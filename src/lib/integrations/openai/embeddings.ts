import { getOpenAIClient, OPENAI_MODELS } from './client';

export interface EmbeddingResult {
  text: string;
  embedding: number[];
  tokens: number;
}

export interface SemanticSearchResult {
  text: string;
  score: number;
  metadata?: Record<string, any>;
}

// Gerar embedding para um texto
export async function generateEmbedding(
  text: string,
  apiKey?: string
): Promise<EmbeddingResult> {
  const client = getOpenAIClient(apiKey);

  try {
    const response = await client.embeddings.create({
      model: OPENAI_MODELS.embedding,
      input: text
    });

    return {
      text,
      embedding: response.data[0].embedding,
      tokens: response.usage.total_tokens
    };
  } catch (error: any) {
    console.error('Erro ao gerar embedding:', error);
    throw new Error(`Falha ao gerar embedding: ${error.message}`);
  }
}

// Gerar embeddings em lote
export async function generateBatchEmbeddings(
  texts: string[],
  apiKey?: string
): Promise<EmbeddingResult[]> {
  const client = getOpenAIClient(apiKey);

  try {
    const response = await client.embeddings.create({
      model: OPENAI_MODELS.embedding,
      input: texts
    });

    return response.data.map((item, index) => ({
      text: texts[index],
      embedding: item.embedding,
      tokens: Math.floor(response.usage.total_tokens / texts.length)
    }));
  } catch (error: any) {
    console.error('Erro ao gerar embeddings em lote:', error);
    throw new Error(`Falha ao gerar embeddings: ${error.message}`);
  }
}

// Calcular similaridade de cosseno entre dois vetores
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vetores devem ter o mesmo tamanho');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Busca semântica em uma lista de documentos
export async function semanticSearch(
  query: string,
  documents: Array<{ text: string; metadata?: Record<string, any> }>,
  options: {
    topK?: number;
    threshold?: number;
    apiKey?: string;
  } = {}
): Promise<SemanticSearchResult[]> {
  const { topK = 5, threshold = 0.5, apiKey } = options;

  // Gerar embedding da query
  const queryEmbedding = await generateEmbedding(query, apiKey);

  // Gerar embeddings dos documentos
  const docTexts = documents.map(d => d.text);
  const docEmbeddings = await generateBatchEmbeddings(docTexts, apiKey);

  // Calcular similaridades
  const results: SemanticSearchResult[] = documents.map((doc, index) => ({
    text: doc.text,
    score: cosineSimilarity(queryEmbedding.embedding, docEmbeddings[index].embedding),
    metadata: doc.metadata
  }));

  // Filtrar e ordenar
  return results
    .filter(r => r.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

// Agrupar documentos similares
export async function clusterDocuments(
  documents: Array<{ text: string; metadata?: Record<string, any> }>,
  options: {
    numClusters?: number;
    apiKey?: string;
  } = {}
): Promise<Array<{
  clusterId: number;
  documents: Array<{ text: string; metadata?: Record<string, any> }>;
  centroid: number[];
}>> {
  const { numClusters = 3, apiKey } = options;

  // Gerar embeddings
  const docTexts = documents.map(d => d.text);
  const embeddings = await generateBatchEmbeddings(docTexts, apiKey);

  // K-means simplificado
  const vectors = embeddings.map(e => e.embedding);
  const clusters = kMeans(vectors, numClusters);

  // Agrupar documentos por cluster
  const result = clusters.map((cluster, clusterId) => ({
    clusterId,
    documents: cluster.indices.map(i => documents[i]),
    centroid: cluster.centroid
  }));

  return result;
}

// Implementação simplificada de K-means
function kMeans(
  vectors: number[][],
  k: number,
  maxIterations: number = 100
): Array<{ indices: number[]; centroid: number[] }> {
  const n = vectors.length;
  const dim = vectors[0].length;

  // Inicializar centroides aleatoriamente
  const centroids: number[][] = [];
  const usedIndices = new Set<number>();
  
  while (centroids.length < k) {
    const idx = Math.floor(Math.random() * n);
    if (!usedIndices.has(idx)) {
      usedIndices.add(idx);
      centroids.push([...vectors[idx]]);
    }
  }

  let assignments = new Array(n).fill(0);

  for (let iter = 0; iter < maxIterations; iter++) {
    // Atribuir cada vetor ao centroide mais próximo
    const newAssignments = vectors.map(vec => {
      let minDist = Infinity;
      let closest = 0;
      
      centroids.forEach((centroid, i) => {
        const dist = euclideanDistance(vec, centroid);
        if (dist < minDist) {
          minDist = dist;
          closest = i;
        }
      });
      
      return closest;
    });

    // Verificar convergência
    if (arraysEqual(assignments, newAssignments)) {
      break;
    }
    assignments = newAssignments;

    // Atualizar centroides
    for (let i = 0; i < k; i++) {
      const clusterVectors = vectors.filter((_, idx) => assignments[idx] === i);
      if (clusterVectors.length > 0) {
        centroids[i] = clusterVectors[0].map((_, dim) =>
          clusterVectors.reduce((sum, vec) => sum + vec[dim], 0) / clusterVectors.length
        );
      }
    }
  }

  // Retornar clusters
  return centroids.map((centroid, i) => ({
    indices: assignments.map((a, idx) => a === i ? idx : -1).filter(idx => idx >= 0),
    centroid
  }));
}

function euclideanDistance(a: number[], b: number[]): number {
  return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
}

function arraysEqual(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((val, i) => val === b[i]);
}






