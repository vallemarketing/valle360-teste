/**
 * Valle 360 - Google Cloud Natural Language API
 * Análise de Sentimento usando Google Cloud
 */

// =====================================================
// TIPOS
// =====================================================

export interface GoogleSentimentResult {
  overall: 'positive' | 'neutral' | 'negative';
  score: number; // -1 a 1
  magnitude: number; // 0 a infinito (intensidade)
  confidence: number; // 0 a 1
  sentences: Array<{
    text: string;
    score: number;
    magnitude: number;
  }>;
  language: string;
}

export interface GoogleSentimentInput {
  text: string;
  language?: string; // 'pt-BR', 'en', etc.
}

// =====================================================
// CONFIGURAÇÃO
// =====================================================

const GOOGLE_NLP_API_URL = 'https://language.googleapis.com/v2/documents:analyzeSentiment';

// =====================================================
// FUNÇÕES
// =====================================================

/**
 * Analisa sentimento usando Google Cloud Natural Language API
 */
export async function analyzeGoogleSentiment(
  input: GoogleSentimentInput,
  apiKey?: string
): Promise<GoogleSentimentResult> {
  const key = apiKey || process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_CLOUD_API_KEY;
  
  if (!key) {
    throw new Error('Google Cloud API Key não configurada');
  }

  try {
    const response = await fetch(`${GOOGLE_NLP_API_URL}?key=${key}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        document: {
          type: 'PLAIN_TEXT',
          content: input.text,
          languageCode: input.language || 'pt-BR'
        },
        encodingType: 'UTF8'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Google API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    // Converter score do Google (-1 a 1) para nossa classificação
    const score = data.documentSentiment?.score || 0;
    const magnitude = data.documentSentiment?.magnitude || 0;
    
    let overall: 'positive' | 'neutral' | 'negative';
    if (score > 0.25) overall = 'positive';
    else if (score < -0.25) overall = 'negative';
    else overall = 'neutral';

    // Calcular confiança baseada na magnitude
    const confidence = Math.min(magnitude / 2, 1);

    // Processar sentenças
    const sentences = (data.sentences || []).map((s: any) => ({
      text: s.text?.content || '',
      score: s.sentiment?.score || 0,
      magnitude: s.sentiment?.magnitude || 0
    }));

    return {
      overall,
      score,
      magnitude,
      confidence,
      sentences,
      language: data.languageCode || input.language || 'pt-BR'
    };
  } catch (error: any) {
    console.error('Erro na análise de sentimento Google:', error);
    throw new Error(`Falha na análise Google: ${error.message}`);
  }
}

/**
 * Analisa múltiplos textos em batch
 */
export async function analyzeGoogleBatchSentiment(
  texts: GoogleSentimentInput[],
  apiKey?: string
): Promise<{
  results: GoogleSentimentResult[];
  averageScore: number;
  overallSentiment: 'positive' | 'neutral' | 'negative';
  totalMagnitude: number;
}> {
  const results: GoogleSentimentResult[] = [];

  // Processar em paralelo com limite de concorrência
  const batchSize = 5;
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(input => analyzeGoogleSentiment(input, apiKey))
    );
    results.push(...batchResults);
  }

  // Calcular métricas agregadas
  const averageScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
  const totalMagnitude = results.reduce((sum, r) => sum + r.magnitude, 0);

  let overallSentiment: 'positive' | 'neutral' | 'negative';
  if (averageScore > 0.25) overallSentiment = 'positive';
  else if (averageScore < -0.25) overallSentiment = 'negative';
  else overallSentiment = 'neutral';

  return {
    results,
    averageScore,
    overallSentiment,
    totalMagnitude
  };
}

/**
 * Classifica entidades no texto (pessoas, lugares, organizações)
 */
export async function analyzeGoogleEntities(
  text: string,
  apiKey?: string
): Promise<Array<{
  name: string;
  type: string;
  salience: number;
  sentiment?: { score: number; magnitude: number };
}>> {
  const key = apiKey || process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_CLOUD_API_KEY;
  
  if (!key) {
    throw new Error('Google Cloud API Key não configurada');
  }

  try {
    const response = await fetch(`https://language.googleapis.com/v2/documents:analyzeEntities?key=${key}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        document: {
          type: 'PLAIN_TEXT',
          content: text,
          languageCode: 'pt-BR'
        },
        encodingType: 'UTF8'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Google API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    return (data.entities || []).map((e: any) => ({
      name: e.name,
      type: e.type,
      salience: e.salience || 0,
      sentiment: e.sentiment ? {
        score: e.sentiment.score,
        magnitude: e.sentiment.magnitude
      } : undefined
    }));
  } catch (error: any) {
    console.error('Erro na análise de entidades Google:', error);
    throw new Error(`Falha na análise de entidades: ${error.message}`);
  }
}

