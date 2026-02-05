/**
 * Brand Memory - RAG via Supabase pgvector (sem Railway)
 * Implementação direta no Next.js para ingestão e busca semântica.
 */

import { createClient } from '@supabase/supabase-js';

// ── Supabase Admin Client ──────────────────────────────────────────────────
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error('Supabase env vars not configured');
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

// ── OpenAI Embeddings ──────────────────────────────────────────────────────
async function embedTexts(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY não configurada');
  if (texts.length === 0) return [];

  const model = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, input: texts }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OpenAI embeddings failed: ${res.status} ${txt}`);
  }

  const json = await res.json();
  const data = (json.data || []) as { index: number; embedding: number[] }[];
  data.sort((a, b) => a.index - b.index);
  return data.map((d) => d.embedding);
}

function toPgvectorLiteral(vec: number[]): string {
  return '[' + vec.map((x) => x.toFixed(8)).join(',') + ']';
}

// ── Chunking ───────────────────────────────────────────────────────────────
function chunkText(text: string, chunkSize = 1200, overlap = 200): string[] {
  const t = (text || '').trim();
  if (!t) return [];
  if (chunkSize <= 0) return [t];

  const out: string[] = [];
  let i = 0;
  const n = t.length;
  while (i < n) {
    const end = Math.min(n, i + chunkSize);
    out.push(t.slice(i, end));
    if (end >= n) break;
    i = Math.max(0, end - overlap);
  }
  return out;
}

// ── Ingest Text ────────────────────────────────────────────────────────────
export interface IngestTextParams {
  clientId: string;
  title?: string | null;
  content: string;
  sourceType?: string;
  sourceRef?: string | null;
  createdByUserId?: string | null;
  metadata?: Record<string, unknown>;
}

export async function ingestText(params: IngestTextParams): Promise<{ documentId: string; chunksCreated: number }> {
  const admin = getSupabaseAdmin();
  const meta = params.metadata || {};

  // 1. Cria documento
  const { data: docData, error: docError } = await admin
    .from('brand_memory_documents')
    .insert({
      client_id: params.clientId,
      title: params.title || null,
      source_type: params.sourceType || 'manual',
      source_ref: params.sourceRef || null,
      raw_text: params.content,
      metadata: meta,
      created_by_user_id: params.createdByUserId || null,
    })
    .select('id')
    .single();

  if (docError || !docData?.id) throw new Error(`Falha ao criar documento: ${docError?.message}`);
  const docId = String(docData.id);

  // 2. Divide em chunks
  const chunks = chunkText(params.content);
  if (chunks.length === 0) return { documentId: docId, chunksCreated: 0 };

  // 3. Gera embeddings
  const embeddings = await embedTexts(chunks);

  // 4. Insere chunks
  const rows = chunks.map((chunk, idx) => ({
    client_id: params.clientId,
    document_id: docId,
    chunk_index: idx,
    content: chunk,
    metadata: { title: params.title, ...meta, chunk_size: chunk.length },
    embedding: toPgvectorLiteral(embeddings[idx]),
  }));

  const { error: chunkError } = await admin.from('brand_memory_chunks').insert(rows);
  if (chunkError) throw new Error(`Falha ao inserir chunks: ${chunkError.message}`);

  return { documentId: docId, chunksCreated: rows.length };
}

// ── Search ─────────────────────────────────────────────────────────────────
export interface SearchParams {
  clientId: string;
  query: string;
  matchCount?: number;
  similarityThreshold?: number;
}

export interface SearchMatch {
  id: string;
  content: string;
  similarity: number;
  metadata: Record<string, unknown>;
}

export async function searchBrandMemory(params: SearchParams): Promise<{ matches: SearchMatch[] }> {
  const admin = getSupabaseAdmin();
  const matchCount = params.matchCount ?? 8;
  const threshold = params.similarityThreshold ?? 0.7;

  // 1. Gera embedding da query
  const [queryEmb] = await embedTexts([params.query]);

  // 2. Chama a função RPC
  const { data, error } = await admin.rpc('match_brand_memory_chunks', {
    p_client_id: params.clientId,
    query_embedding: toPgvectorLiteral(queryEmb),
    match_count: matchCount,
    similarity_threshold: threshold,
  });

  if (error) throw new Error(`Falha na busca: ${error.message}`);

  return { matches: (data || []) as SearchMatch[] };
}

// ── Alias for searchBrandMemory ─────────────────────────────────────────────
export async function searchMemory(
  query: string,
  clientId?: string,
  matchCount: number = 5
): Promise<SearchMatch[]> {
  if (!clientId) return [];
  
  try {
    const result = await searchBrandMemory({
      clientId,
      query,
      matchCount,
      similarityThreshold: 0.65,
    });
    return result.matches;
  } catch (error) {
    console.error('searchMemory error:', error);
    return [];
  }
}

// ── Get Brand Context ───────────────────────────────────────────────────────
/**
 * Retrieves consolidated brand context for a client
 * Used by agents to understand brand voice, values, and guidelines
 */
export async function getBrandContext(clientId: string): Promise<string | null> {
  if (!clientId) return null;
  
  try {
    // Search for key brand elements
    const queries = [
      'tom de voz e personalidade da marca',
      'valores e missão da empresa',
      'público-alvo e personas',
      'diretrizes visuais e identidade',
    ];
    
    const allMatches: SearchMatch[] = [];
    
    for (const query of queries) {
      const matches = await searchMemory(query, clientId, 3);
      allMatches.push(...matches);
    }
    
    if (allMatches.length === 0) {
      return null;
    }
    
    // Remove duplicates by id
    const uniqueMatches = Array.from(
      new Map(allMatches.map(m => [m.id, m])).values()
    );
    
    // Sort by similarity and take top results
    uniqueMatches.sort((a, b) => b.similarity - a.similarity);
    const topMatches = uniqueMatches.slice(0, 8);
    
    // Consolidate into a single context string
    const context = topMatches
      .map(m => m.content)
      .join('\n\n---\n\n');
    
    return context;
  } catch (error) {
    console.error('getBrandContext error:', error);
    return null;
  }
}
