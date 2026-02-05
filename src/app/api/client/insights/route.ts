/**
 * Client AI Insights API (Epic 13)
 *
 * GET  /api/client/insights
 *   - lista insights do cliente logado (por status opcional)
 *
 * POST /api/client/insights
 *   - gera novos insights a partir de segment/competitors (Perplexity/Tavily) e persiste em public.client_ai_insights
 *
 * PUT  /api/client/insights
 *   - atualiza status de um insight (implementado/ignorado/em_analise/novo)
 *
 * Nota: usamos service role para contornar RLS em ambientes com drift,
 * mas SEMPRE validamos ownership com auth (cookies) + filtro por client.user_id.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';
import { perplexityWebSearch } from '@/lib/integrations/perplexity';
import { tavilyClient } from '@/lib/integrations/tavily/client';

export const dynamic = 'force-dynamic';

type InsightType = 'oportunidade' | 'melhoria' | 'alerta' | 'tendencia';
type InsightPriority = 'alta' | 'media' | 'baixa';
type InsightStatus = 'novo' | 'em_analise' | 'implementado' | 'ignorado';

function getSaoPauloDayBoundsIso(now = new Date()) {
  // Sem dependências: calcula início/fim do dia em America/Sao_Paulo usando Intl.
  const dtf = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = dtf.formatToParts(now);
  const y = parts.find((p) => p.type === 'year')?.value || '1970';
  const m = parts.find((p) => p.type === 'month')?.value || '01';
  const d = parts.find((p) => p.type === 'day')?.value || '01';
  const start = new Date(`${y}-${m}-${d}T00:00:00-03:00`).toISOString();
  const end = new Date(`${y}-${m}-${d}T23:59:59-03:00`).toISOString();
  return { start, end };
}

function isMissingTableError(e: any) {
  const msg = String(e?.message || '');
  const code = String(e?.code || '');
  return code === '42P01' || msg.toLowerCase().includes('relation') || msg.toLowerCase().includes('does not exist');
}

function uniqUrls(urls: string[]) {
  const out: string[] = [];
  for (const u of urls || []) {
    const s = String(u || '').trim();
    if (!s) continue;
    if (!/^https?:\/\//i.test(s)) continue;
    if (!out.includes(s)) out.push(s);
  }
  return out;
}

function normalizeCompetitors(input: any): string[] {
  if (!input) return [];
  if (Array.isArray(input)) return input.map((x) => String(x).trim()).filter(Boolean).slice(0, 10);
  if (typeof input === 'string') {
    return input
      .split(/[\n,;]+/g)
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 10);
  }
  return [];
}

function extractJsonArray(text: string): any[] | null {
  const s = String(text || '');
  const start = s.indexOf('[');
  const end = s.lastIndexOf(']');
  if (start < 0 || end < 0 || end <= start) return null;
  const candidate = s.slice(start, end + 1);
  try {
    const parsed = JSON.parse(candidate);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function safeType(v: any): InsightType {
  const t = String(v || '').toLowerCase();
  if (t.includes('alert')) return 'alerta';
  if (t.includes('tend')) return 'tendencia';
  if (t.includes('melh')) return 'melhoria';
  return 'oportunidade';
}

function safePriority(v: any): InsightPriority {
  const p = String(v || '').toLowerCase();
  if (p.startsWith('a')) return 'alta';
  if (p.startsWith('b')) return 'baixa';
  return 'media';
}

async function requireUser() {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
}

async function getClientForUser(userId: string) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('clients')
    .select('id, company_name, industry, segment, competitors, concorrentes')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as any;
}

function buildInsightsPrompt(params: {
  companyName?: string;
  industry?: string;
  segment?: string;
  competitors?: string[];
}) {
  const companyName = String(params.companyName || '').trim();
  const industry = String(params.industry || '').trim();
  const segment = String(params.segment || '').trim();
  const competitors = (params.competitors || []).map((c) => String(c).trim()).filter(Boolean).slice(0, 6);
  const topic = segment || industry || 'marketing digital';

  return [
    `Você é um analista de marketing. Gere insights práticos com base em pesquisa web recente (últimos 30 dias) para o segmento: "${topic}" no Brasil.`,
    companyName ? `Empresa: ${companyName}.` : null,
    competitors.length ? `Concorrentes: ${competitors.join(', ')}.` : null,
    '',
    'Responda ESTRITAMENTE em JSON (sem markdown), no formato: uma lista com 5 itens.',
    'Cada item deve ter as chaves:',
    '- type: "oportunidade" | "melhoria" | "alerta" | "tendencia"',
    '- priority: "alta" | "media" | "baixa"',
    '- title: string (curto)',
    '- description: string (1-3 frases)',
    '- impact: string (ex: "+15% CTR", "reduz risco", etc)',
    '- action: string (ação objetiva)',
    '- sources: string[] (URLs)',
  ]
    .filter(Boolean)
    .join('\n');
}

export async function GET(request: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const todayOnly = url.searchParams.get('today') === '1';

  const admin = getSupabaseAdmin();
  const client = await getClientForUser(user.id);
  if (!client?.id) return NextResponse.json({ success: true, insights: [] });

  let q = admin
    .from('client_ai_insights')
    .select('id, type, priority, status, title, description, impact, action, sources, provider, created_at')
    .eq('client_id', client.id)
    .order('created_at', { ascending: false })
    .limit(200);

  if (status) q = q.eq('status', String(status));
  if (todayOnly) {
    const { start, end } = getSaoPauloDayBoundsIso();
    q = q.gte('created_at', start).lte('created_at', end);
  }

  const { data, error } = await q;
  if (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json({
        success: true,
        insights: [],
        warning: 'missing_table_client_ai_insights',
        instruction:
          'A tabela de insights ainda não existe neste banco. Rode a migration `supabase/migrations/20260102000004_clients_rls_and_client_ai_insights.sql` no Supabase (SQL editor).',
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true, insights: data || [] });
}

export async function POST(_request: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const admin = getSupabaseAdmin();
  const client = await getClientForUser(user.id);
  if (!client?.id) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });

  // Cache diário: se já tem insights hoje, não gerar de novo (a não ser que force=1)
  const { start, end } = getSaoPauloDayBoundsIso();
  try {
    const existing = await admin
      .from('client_ai_insights')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', client.id)
      .gte('created_at', start)
      .lte('created_at', end);
    if (existing?.error) throw existing.error;
    const force = false; // mantemos simples por enquanto; pode adicionar force via query/body no futuro
    const count = Number(existing.count || 0);
    if (!force && count > 0) {
      return NextResponse.json({ success: true, skipped: true, existingCount: count, date: start });
    }
  } catch (e: any) {
    // se a tabela não existir ainda, seguimos e retornamos um erro amigável no insert
  }

  const competitors = [
    ...normalizeCompetitors((client as any)?.competitors),
    ...normalizeCompetitors((client as any)?.concorrentes),
  ];

  const prompt = buildInsightsPrompt({
    companyName: client.company_name,
    industry: client.industry,
    segment: (client as any)?.segment,
    competitors,
  });

  // 1) Prefer Perplexity (com fontes)
  let provider: string = 'perplexity';
  let answerText: string = '';
  let sources: string[] = [];
  try {
    const web = await perplexityWebSearch({ query: prompt, timeoutMs: 25_000 });
    answerText = web.answer;
    sources = uniqUrls(web.sources);
  } catch (e: any) {
    // 2) Fallback Tavily (notícias + URLs)
    provider = 'tavily';
    const topic = String((client as any)?.segment || client.industry || 'marketing digital');
    const r = await tavilyClient.searchNews(`tendências ${topic} Brasil`, 8);
    answerText = String(r.answer || '').trim();
    sources = uniqUrls((r.results || []).map((x) => x.url));
  }

  const parsed = extractJsonArray(answerText);
  const now = new Date().toISOString();

  const items =
    parsed && parsed.length
      ? parsed.slice(0, 5)
      : [
          {
            type: 'tendencia',
            priority: 'media',
            title: 'Resumo do setor (com fontes)',
            description: answerText || 'Veja fontes recentes do seu setor para identificar oportunidades.',
            impact: 'Melhor decisão nas próximas 2 semanas',
            action: 'Revisar as fontes e alinhar plano de conteúdo/campanhas',
            sources,
          },
        ];

  const inserts = items.map((it: any) => {
    const itemSources = Array.isArray(it?.sources) ? uniqUrls(it.sources.map(String)) : [];
    const finalSources = uniqUrls([...(itemSources || []), ...(sources || [])]).slice(0, 12);
    return {
      client_id: client.id,
      type: safeType(it?.type),
      priority: safePriority(it?.priority),
      status: 'novo' as InsightStatus,
      title: String(it?.title || 'Insight').slice(0, 180),
      description: String(it?.description || '').slice(0, 4000),
      impact: it?.impact ? String(it.impact).slice(0, 500) : null,
      action: it?.action ? String(it.action).slice(0, 1000) : null,
      sources: finalSources,
      provider,
      raw: {
        generated_at: now,
        prompt,
        answer: answerText,
        base_sources: sources,
        item: it,
      },
    };
  });

  const { data, error } = await admin.from('client_ai_insights').insert(inserts).select('id');
  if (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json(
        {
          error:
            'A tabela de insights ainda não existe neste banco. Rode a migration `supabase/migrations/20260102000004_clients_rls_and_client_ai_insights.sql` no Supabase (SQL editor).',
        },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, created: (data || []).length });
}

export async function PUT(request: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const insightId = String(body?.id || '');
  const status = String(body?.status || '') as InsightStatus;
  if (!insightId) return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 });
  if (!['novo', 'em_analise', 'implementado', 'ignorado'].includes(status)) {
    return NextResponse.json({ error: 'status inválido' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const client = await getClientForUser(user.id);
  if (!client?.id) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });

  const { error } = await admin
    .from('client_ai_insights')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', insightId)
    .eq('client_id', client.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}


