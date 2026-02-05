/**
 * Valle 360 - Serviço Unificado de Análise de Sentimento
 * Suporta múltiplos provedores: OpenAI, Google Cloud, Claude
 */

import { analyzeSentiment as analyzeOpenAISentiment, SentimentResult as OpenAISentimentResult } from '@/lib/integrations/openai/sentiment';
import { analyzeGoogleSentiment, GoogleSentimentResult } from '@/lib/integrations/google/sentiment';

// =====================================================
// TIPOS
// =====================================================

export type SentimentProvider = 'openai' | 'google' | 'claude' | 'auto';

export interface UnifiedSentimentResult {
  provider: SentimentProvider;
  overall: 'positive' | 'neutral' | 'negative';
  score: number; // -1 a 1
  confidence: number; // 0 a 1
  details: {
    emotions?: {
      joy: number;
      sadness: number;
      anger: number;
      fear: number;
      surprise: number;
      trust: number;
    };
    magnitude?: number;
    sentences?: Array<{
      text: string;
      score: number;
    }>;
    keywords?: string[];
  };
  summary?: string;
  processingTime: number;
  language: string;
}

export interface SentimentAnalysisRequest {
  text: string;
  provider?: SentimentProvider;
  language?: string;
  context?: string;
}

export interface SentimentConfig {
  defaultProvider: SentimentProvider;
  fallbackProvider?: SentimentProvider;
  enableAutoSelect: boolean;
  preferredLanguageProvider: Record<string, SentimentProvider>;
}

// =====================================================
// CONFIGURAÇÃO PADRÃO
// =====================================================

const DEFAULT_CONFIG: SentimentConfig = {
  defaultProvider: 'openai',
  fallbackProvider: 'google',
  enableAutoSelect: true,
  preferredLanguageProvider: {
    'pt': 'google', // Google é melhor para português
    'pt-BR': 'google',
    'en': 'openai',
    'es': 'google'
  }
};

// Estado global da configuração (pode ser atualizado pelo admin)
let currentConfig: SentimentConfig = { ...DEFAULT_CONFIG };

// =====================================================
// FUNÇÕES PRINCIPAIS
// =====================================================

/**
 * Atualiza a configuração do serviço de sentimento
 */
export function updateSentimentConfig(config: Partial<SentimentConfig>): void {
  currentConfig = { ...currentConfig, ...config };
}

/**
 * Obtém a configuração atual
 */
export function getSentimentConfig(): SentimentConfig {
  return { ...currentConfig };
}

/**
 * Seleciona automaticamente o melhor provedor baseado no contexto
 */
function selectBestProvider(text: string, language?: string): SentimentProvider {
  // Se tiver preferência por idioma, usar
  if (language && currentConfig.preferredLanguageProvider[language]) {
    return currentConfig.preferredLanguageProvider[language];
  }

  // Detectar idioma básico (heurística simples)
  const hasPortugueseChars = /[ãáàâéêíóôõúç]/i.test(text);
  if (hasPortugueseChars) {
    return 'google'; // Google é mais preciso para português
  }

  // Textos muito curtos funcionam melhor com OpenAI
  if (text.length < 50) {
    return 'openai';
  }

  // Textos muito longos funcionam melhor com Google
  if (text.length > 2000) {
    return 'google';
  }

  return currentConfig.defaultProvider;
}

/**
 * Analisa sentimento usando o provedor especificado ou auto-selecionado
 */
export async function analyzeSentiment(
  request: SentimentAnalysisRequest
): Promise<UnifiedSentimentResult> {
  const startTime = Date.now();
  
  // Determinar provedor
  let provider = request.provider || currentConfig.defaultProvider;
  
  if (provider === 'auto' || (currentConfig.enableAutoSelect && !request.provider)) {
    provider = selectBestProvider(request.text, request.language);
  }

  try {
    let result: UnifiedSentimentResult;

    switch (provider) {
      case 'google':
        result = await analyzeWithGoogle(request, startTime);
        break;
      case 'claude':
        result = await analyzeWithClaude(request, startTime);
        break;
      case 'openai':
      default:
        result = await analyzeWithOpenAI(request, startTime);
        break;
    }

    return result;
  } catch (error) {
    // Tentar fallback se configurado
    if (currentConfig.fallbackProvider && provider !== currentConfig.fallbackProvider) {
      console.warn(`Falha com ${provider}, tentando fallback ${currentConfig.fallbackProvider}`);
      return analyzeSentiment({
        ...request,
        provider: currentConfig.fallbackProvider
      });
    }
    throw error;
  }
}

/**
 * Analisa usando OpenAI
 */
async function analyzeWithOpenAI(
  request: SentimentAnalysisRequest,
  startTime: number
): Promise<UnifiedSentimentResult> {
  const result = await analyzeOpenAISentiment({
    text: request.text,
    context: request.context,
    language: request.language
  });

  return {
    provider: 'openai',
    overall: result.overall,
    score: result.score,
    confidence: result.confidence,
    details: {
      emotions: result.emotions,
      keywords: result.keywords
    },
    summary: result.summary,
    processingTime: Date.now() - startTime,
    language: request.language || 'pt-BR'
  };
}

/**
 * Analisa usando Google Cloud
 */
async function analyzeWithGoogle(
  request: SentimentAnalysisRequest,
  startTime: number
): Promise<UnifiedSentimentResult> {
  const result = await analyzeGoogleSentiment({
    text: request.text,
    language: request.language
  });

  return {
    provider: 'google',
    overall: result.overall,
    score: result.score,
    confidence: result.confidence,
    details: {
      magnitude: result.magnitude,
      sentences: result.sentences.map(s => ({
        text: s.text,
        score: s.score
      }))
    },
    processingTime: Date.now() - startTime,
    language: result.language
  };
}

/**
 * Analisa usando Claude (Anthropic)
 */
async function analyzeWithClaude(
  request: SentimentAnalysisRequest,
  startTime: number
): Promise<UnifiedSentimentResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    throw new Error('Anthropic API Key não configurada');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Analise o sentimento do seguinte texto e retorne APENAS um JSON válido com esta estrutura:
{
  "overall": "positive" | "neutral" | "negative",
  "score": número de -1 (muito negativo) a 1 (muito positivo),
  "confidence": número de 0 a 1,
  "emotions": {
    "joy": 0-1, "sadness": 0-1, "anger": 0-1, 
    "fear": 0-1, "surprise": 0-1, "trust": 0-1
  },
  "keywords": ["palavras-chave"],
  "summary": "resumo em uma frase"
}

Texto: ${request.text}`
      }]
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Claude API Error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text || '{}';
  
  // Extrair JSON da resposta
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Resposta inválida do Claude');
  }

  const result = JSON.parse(jsonMatch[0]);

  return {
    provider: 'claude',
    overall: result.overall,
    score: result.score,
    confidence: result.confidence,
    details: {
      emotions: result.emotions,
      keywords: result.keywords
    },
    summary: result.summary,
    processingTime: Date.now() - startTime,
    language: request.language || 'pt-BR'
  };
}

/**
 * Compara resultados de múltiplos provedores
 */
export async function compareSentimentProviders(
  text: string
): Promise<{
  results: Record<SentimentProvider, UnifiedSentimentResult | null>;
  consensus: 'positive' | 'neutral' | 'negative';
  agreement: number;
}> {
  const providers: SentimentProvider[] = ['openai', 'google', 'claude'];
  const results: Record<string, UnifiedSentimentResult | null> = {};

  await Promise.all(
    providers.map(async (provider) => {
      try {
        results[provider] = await analyzeSentiment({ text, provider });
      } catch (error) {
        console.warn(`Falha ao analisar com ${provider}:`, error);
        results[provider] = null;
      }
    })
  );

  // Calcular consenso
  const validResults = Object.values(results).filter(r => r !== null) as UnifiedSentimentResult[];
  const scores = validResults.map(r => r.overall);
  
  const counts = {
    positive: scores.filter(s => s === 'positive').length,
    neutral: scores.filter(s => s === 'neutral').length,
    negative: scores.filter(s => s === 'negative').length
  };

  const consensus = (Object.entries(counts) as [string, number][])
    .sort((a, b) => b[1] - a[1])[0][0] as 'positive' | 'neutral' | 'negative';

  const agreement = Math.max(...Object.values(counts)) / validResults.length;

  return {
    results: results as Record<SentimentProvider, UnifiedSentimentResult | null>,
    consensus,
    agreement
  };
}

/**
 * Analisa tendência de sentimento ao longo do tempo
 */
export async function analyzeSentimentTrend(
  texts: Array<{ text: string; date: Date }>,
  provider?: SentimentProvider
): Promise<{
  trend: 'improving' | 'stable' | 'declining';
  dataPoints: Array<{ date: Date; score: number; overall: string }>;
  averageScore: number;
  volatility: number;
}> {
  const sortedTexts = [...texts].sort((a, b) => a.date.getTime() - b.date.getTime());
  
  const results = await Promise.all(
    sortedTexts.map(async (item) => {
      const result = await analyzeSentiment({ text: item.text, provider });
      return {
        date: item.date,
        score: result.score,
        overall: result.overall
      };
    })
  );

  const scores = results.map(r => r.score);
  const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;

  // Calcular tendência (regressão linear simples)
  const n = scores.length;
  const sumX = (n * (n - 1)) / 2;
  const sumY = scores.reduce((a, b) => a + b, 0);
  const sumXY = scores.reduce((sum, score, i) => sum + i * score, 0);
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

  let trend: 'improving' | 'stable' | 'declining';
  if (slope > 0.05) trend = 'improving';
  else if (slope < -0.05) trend = 'declining';
  else trend = 'stable';

  // Calcular volatilidade (desvio padrão)
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - averageScore, 2), 0) / n;
  const volatility = Math.sqrt(variance);

  return {
    trend,
    dataPoints: results,
    averageScore,
    volatility
  };
}

