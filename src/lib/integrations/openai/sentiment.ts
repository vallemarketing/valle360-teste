import { getOpenAIClient, OPENAI_MODELS } from './client';

export interface SentimentResult {
  overall: 'positive' | 'neutral' | 'negative';
  score: number; // -1 a 1
  confidence: number; // 0 a 1
  emotions: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
    trust: number;
  };
  keywords: string[];
  summary: string;
}

export interface SentimentAnalysisInput {
  text: string;
  context?: string;
  language?: string;
}

export interface BatchSentimentResult {
  results: SentimentResult[];
  averageScore: number;
  overallSentiment: 'positive' | 'neutral' | 'negative';
  trendDirection: 'improving' | 'stable' | 'declining';
}

export async function analyzeSentiment(
  input: SentimentAnalysisInput,
  apiKey?: string
): Promise<SentimentResult> {
  const client = getOpenAIClient(apiKey);

  const systemPrompt = `Você é um especialista em análise de sentimentos. Analise o texto fornecido e retorne APENAS um JSON válido com a seguinte estrutura:
{
  "overall": "positive" | "neutral" | "negative",
  "score": número de -1 (muito negativo) a 1 (muito positivo),
  "confidence": número de 0 a 1 indicando confiança na análise,
  "emotions": {
    "joy": 0-1,
    "sadness": 0-1,
    "anger": 0-1,
    "fear": 0-1,
    "surprise": 0-1,
    "trust": 0-1
  },
  "keywords": ["palavras-chave", "relevantes"],
  "summary": "Resumo breve do sentimento em uma frase"
}

${input.context ? `Contexto adicional: ${input.context}` : ''}
Idioma do texto: ${input.language || 'português brasileiro'}`;

  try {
    const response = await client.chat.completions.create({
      model: OPENAI_MODELS.analysis,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: input.text }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Resposta vazia da OpenAI');
    }

    return JSON.parse(content) as SentimentResult;
  } catch (error: any) {
    console.error('Erro na análise de sentimento:', error);
    throw new Error(`Falha na análise de sentimento: ${error.message}`);
  }
}

export async function analyzeBatchSentiment(
  texts: SentimentAnalysisInput[],
  apiKey?: string
): Promise<BatchSentimentResult> {
  const results: SentimentResult[] = [];

  // Processar em paralelo com limite de concorrência
  const batchSize = 5;
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(input => analyzeSentiment(input, apiKey))
    );
    results.push(...batchResults);
  }

  // Calcular métricas agregadas
  const averageScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
  
  let overallSentiment: 'positive' | 'neutral' | 'negative';
  if (averageScore > 0.2) overallSentiment = 'positive';
  else if (averageScore < -0.2) overallSentiment = 'negative';
  else overallSentiment = 'neutral';

  // Calcular tendência (comparando primeira e segunda metade)
  const midpoint = Math.floor(results.length / 2);
  const firstHalfAvg = results.slice(0, midpoint).reduce((sum, r) => sum + r.score, 0) / midpoint;
  const secondHalfAvg = results.slice(midpoint).reduce((sum, r) => sum + r.score, 0) / (results.length - midpoint);
  
  let trendDirection: 'improving' | 'stable' | 'declining';
  const trendDiff = secondHalfAvg - firstHalfAvg;
  if (trendDiff > 0.1) trendDirection = 'improving';
  else if (trendDiff < -0.1) trendDirection = 'declining';
  else trendDirection = 'stable';

  return {
    results,
    averageScore,
    overallSentiment,
    trendDirection
  };
}

export async function analyzeSocialMediaSentiment(
  posts: Array<{ text: string; platform: string; engagement: number }>,
  apiKey?: string
): Promise<{
  bySentiment: { positive: number; neutral: number; negative: number };
  byPlatform: Record<string, { score: number; count: number }>;
  topKeywords: string[];
  recommendations: string[];
}> {
  const client = getOpenAIClient(apiKey);

  const systemPrompt = `Você é um especialista em análise de sentimentos de redes sociais. Analise os posts fornecidos e retorne APENAS um JSON válido com:
{
  "bySentiment": { "positive": %, "neutral": %, "negative": % },
  "byPlatform": { "plataforma": { "score": -1 a 1, "count": número } },
  "topKeywords": ["palavras", "mais", "mencionadas"],
  "recommendations": ["recomendações", "para", "melhorar", "engajamento"]
}`;

  try {
    const response = await client.chat.completions.create({
      model: OPENAI_MODELS.analysis,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(posts) }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Resposta vazia da OpenAI');
    }

    return JSON.parse(content);
  } catch (error: any) {
    console.error('Erro na análise de redes sociais:', error);
    throw new Error(`Falha na análise: ${error.message}`);
  }
}






