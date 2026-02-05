/**
 * Valle 360 - Google Cloud Natural Language API
 * Serviço completo de NLP com todas as funcionalidades do Google Cloud
 * 
 * Funcionalidades:
 * - Análise de Sentimento
 * - Análise de Entidades
 * - Sentimento por Entidade
 * - Análise de Sintaxe
 * - Classificação de Texto
 */

// =====================================================
// TIPOS - SENTIMENTO
// =====================================================

export interface SentimentResult {
  documentSentiment: {
    score: number; // -1 a 1
    magnitude: number; // 0 a infinito
  };
  sentences: Array<{
    text: string;
    sentiment: {
      score: number;
      magnitude: number;
    };
  }>;
  language: string;
}

// =====================================================
// TIPOS - ENTIDADES
// =====================================================

export type EntityType = 
  | 'UNKNOWN'
  | 'PERSON'
  | 'LOCATION'
  | 'ORGANIZATION'
  | 'EVENT'
  | 'WORK_OF_ART'
  | 'CONSUMER_GOOD'
  | 'OTHER'
  | 'PHONE_NUMBER'
  | 'ADDRESS'
  | 'DATE'
  | 'NUMBER'
  | 'PRICE';

export interface Entity {
  name: string;
  type: EntityType;
  salience: number; // 0 a 1 - relevância
  metadata: Record<string, string>;
  mentions: Array<{
    text: string;
    type: 'TYPE_UNKNOWN' | 'PROPER' | 'COMMON';
    probability: number;
  }>;
  sentiment?: {
    score: number;
    magnitude: number;
  };
}

export interface EntitiesResult {
  entities: Entity[];
  language: string;
}

// =====================================================
// TIPOS - SINTAXE
// =====================================================

export type PartOfSpeechTag = 
  | 'UNKNOWN' | 'ADJ' | 'ADP' | 'ADV' | 'CONJ' | 'DET' 
  | 'NOUN' | 'NUM' | 'PRON' | 'PRT' | 'PUNCT' | 'VERB' | 'X' | 'AFFIX';

export interface Token {
  text: string;
  partOfSpeech: {
    tag: PartOfSpeechTag;
    voice: 'VOICE_UNKNOWN' | 'ACTIVE' | 'PASSIVE';
    tense: 'TENSE_UNKNOWN' | 'PAST' | 'PRESENT' | 'FUTURE';
    mood: string;
    person: string;
    number: string;
  };
  lemma: string;
  dependencyEdge: {
    headTokenIndex: number;
    label: string;
  };
}

export interface SyntaxResult {
  tokens: Token[];
  sentences: Array<{ text: string }>;
  language: string;
}

// =====================================================
// TIPOS - CLASSIFICAÇÃO
// =====================================================

export interface Category {
  name: string; // Ex: "/Arts & Entertainment/Music"
  confidence: number; // 0 a 1
}

export interface ClassificationResult {
  categories: Category[];
  language: string;
}

// =====================================================
// TIPOS - ANÁLISE COMPLETA
// =====================================================

export interface FullAnalysisResult {
  sentiment: SentimentResult;
  entities: EntitiesResult;
  syntax?: SyntaxResult;
  classification?: ClassificationResult;
  summary: {
    overallSentiment: 'positive' | 'neutral' | 'negative';
    mainEntities: Array<{ name: string; type: string; sentiment: string }>;
    topics: string[];
    keyInsights: string[];
  };
}

// =====================================================
// CONFIGURAÇÃO
// =====================================================

const GOOGLE_NLP_BASE_URL = 'https://language.googleapis.com';

function getApiKey(): string {
  const key = process.env.GOOGLE_GEMINI_API_KEY || 
              process.env.GOOGLE_CLOUD_API_KEY ||
              process.env.GOOGLE_NLP_API_KEY;
  
  if (!key) {
    throw new Error('Google Cloud API Key não configurada. Configure GOOGLE_GEMINI_API_KEY ou GOOGLE_CLOUD_API_KEY.');
  }
  return key;
}

// =====================================================
// ANÁLISE DE SENTIMENTO
// =====================================================

export async function analyzeSentiment(
  text: string,
  language: string = 'pt-BR'
): Promise<SentimentResult> {
  const apiKey = getApiKey();

  const response = await fetch(
    `${GOOGLE_NLP_BASE_URL}/v2/documents:analyzeSentiment?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        document: {
          type: 'PLAIN_TEXT',
          content: text,
          languageCode: language
        },
        encodingType: 'UTF8'
      })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Google NLP Error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();

  return {
    documentSentiment: {
      score: data.documentSentiment?.score || 0,
      magnitude: data.documentSentiment?.magnitude || 0
    },
    sentences: (data.sentences || []).map((s: any) => ({
      text: s.text?.content || '',
      sentiment: {
        score: s.sentiment?.score || 0,
        magnitude: s.sentiment?.magnitude || 0
      }
    })),
    language: data.languageCode || language
  };
}

// =====================================================
// ANÁLISE DE ENTIDADES
// =====================================================

export async function analyzeEntities(
  text: string,
  language: string = 'pt-BR'
): Promise<EntitiesResult> {
  const apiKey = getApiKey();

  const response = await fetch(
    `${GOOGLE_NLP_BASE_URL}/v2/documents:analyzeEntities?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        document: {
          type: 'PLAIN_TEXT',
          content: text,
          languageCode: language
        },
        encodingType: 'UTF8'
      })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Google NLP Error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();

  return {
    entities: (data.entities || []).map((e: any) => ({
      name: e.name,
      type: e.type || 'UNKNOWN',
      salience: e.salience || 0,
      metadata: e.metadata || {},
      mentions: (e.mentions || []).map((m: any) => ({
        text: m.text?.content || e.name,
        type: m.type || 'TYPE_UNKNOWN',
        probability: m.probability || 0
      })),
      sentiment: e.sentiment ? {
        score: e.sentiment.score,
        magnitude: e.sentiment.magnitude
      } : undefined
    })),
    language: data.languageCode || language
  };
}

// =====================================================
// ANÁLISE DE SENTIMENTO POR ENTIDADE (v1)
// =====================================================

export async function analyzeEntitySentiment(
  text: string,
  language: string = 'pt-BR'
): Promise<EntitiesResult> {
  const apiKey = getApiKey();

  // A API v1 suporta entity sentiment
  const response = await fetch(
    `${GOOGLE_NLP_BASE_URL}/v1/documents:analyzeEntitySentiment?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        document: {
          type: 'PLAIN_TEXT',
          content: text,
          language: language.split('-')[0] // v1 usa código curto
        },
        encodingType: 'UTF8'
      })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Google NLP Error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();

  return {
    entities: (data.entities || []).map((e: any) => ({
      name: e.name,
      type: e.type || 'UNKNOWN',
      salience: e.salience || 0,
      metadata: e.metadata || {},
      mentions: (e.mentions || []).map((m: any) => ({
        text: m.text?.content || e.name,
        type: m.type || 'TYPE_UNKNOWN',
        probability: 1
      })),
      sentiment: {
        score: e.sentiment?.score || 0,
        magnitude: e.sentiment?.magnitude || 0
      }
    })),
    language: data.language || language
  };
}

// =====================================================
// ANÁLISE DE SINTAXE (v1)
// =====================================================

export async function analyzeSyntax(
  text: string,
  language: string = 'pt-BR'
): Promise<SyntaxResult> {
  const apiKey = getApiKey();

  const response = await fetch(
    `${GOOGLE_NLP_BASE_URL}/v1/documents:analyzeSyntax?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        document: {
          type: 'PLAIN_TEXT',
          content: text,
          language: language.split('-')[0]
        },
        encodingType: 'UTF8'
      })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Google NLP Error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();

  return {
    tokens: (data.tokens || []).map((t: any) => ({
      text: t.text?.content || '',
      partOfSpeech: {
        tag: t.partOfSpeech?.tag || 'UNKNOWN',
        voice: t.partOfSpeech?.voice || 'VOICE_UNKNOWN',
        tense: t.partOfSpeech?.tense || 'TENSE_UNKNOWN',
        mood: t.partOfSpeech?.mood || '',
        person: t.partOfSpeech?.person || '',
        number: t.partOfSpeech?.number || ''
      },
      lemma: t.lemma || '',
      dependencyEdge: {
        headTokenIndex: t.dependencyEdge?.headTokenIndex || 0,
        label: t.dependencyEdge?.label || ''
      }
    })),
    sentences: (data.sentences || []).map((s: any) => ({
      text: s.text?.content || ''
    })),
    language: data.language || language
  };
}

// =====================================================
// CLASSIFICAÇÃO DE TEXTO (v1)
// =====================================================

export async function classifyText(
  text: string,
  language: string = 'pt-BR'
): Promise<ClassificationResult> {
  const apiKey = getApiKey();

  // Classificação requer mínimo de 20 palavras
  const wordCount = text.split(/\s+/).length;
  if (wordCount < 20) {
    throw new Error('Classificação de texto requer pelo menos 20 palavras.');
  }

  const response = await fetch(
    `${GOOGLE_NLP_BASE_URL}/v1/documents:classifyText?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        document: {
          type: 'PLAIN_TEXT',
          content: text,
          language: language.split('-')[0]
        },
        classificationModelOptions: {
          v2Model: {
            contentCategoriesVersion: 'V2'
          }
        }
      })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Google NLP Error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();

  return {
    categories: (data.categories || []).map((c: any) => ({
      name: c.name,
      confidence: c.confidence || 0
    })),
    language: language
  };
}

// =====================================================
// ANÁLISE COMPLETA (TODAS AS FUNCIONALIDADES)
// =====================================================

export async function analyzeFullText(
  text: string,
  options: {
    language?: string;
    includeSyntax?: boolean;
    includeClassification?: boolean;
  } = {}
): Promise<FullAnalysisResult> {
  const language = options.language || 'pt-BR';
  
  // Executar análises em paralelo
  const [sentimentResult, entitiesResult] = await Promise.all([
    analyzeSentiment(text, language),
    analyzeEntitySentiment(text, language)
  ]);

  // Análises opcionais
  let syntaxResult: SyntaxResult | undefined;
  let classificationResult: ClassificationResult | undefined;

  if (options.includeSyntax) {
    try {
      syntaxResult = await analyzeSyntax(text, language);
    } catch (error) {
      console.warn('Erro na análise de sintaxe:', error);
    }
  }

  if (options.includeClassification && text.split(/\s+/).length >= 20) {
    try {
      classificationResult = await classifyText(text, language);
    } catch (error) {
      console.warn('Erro na classificação:', error);
    }
  }

  // Gerar resumo
  const overallScore = sentimentResult.documentSentiment.score;
  let overallSentiment: 'positive' | 'neutral' | 'negative';
  if (overallScore > 0.25) overallSentiment = 'positive';
  else if (overallScore < -0.25) overallSentiment = 'negative';
  else overallSentiment = 'neutral';

  // Entidades principais com sentimento
  const mainEntities = entitiesResult.entities
    .filter(e => e.salience > 0.1)
    .slice(0, 5)
    .map(e => {
      let sentiment: string;
      if (e.sentiment) {
        if (e.sentiment.score > 0.25) sentiment = 'positive';
        else if (e.sentiment.score < -0.25) sentiment = 'negative';
        else sentiment = 'neutral';
      } else {
        sentiment = 'unknown';
      }
      return {
        name: e.name,
        type: e.type,
        sentiment
      };
    });

  // Tópicos da classificação
  const topics = classificationResult?.categories
    .filter(c => c.confidence > 0.5)
    .map(c => c.name.split('/').pop() || c.name) || [];

  // Gerar insights
  const keyInsights: string[] = [];
  
  if (overallSentiment === 'positive') {
    keyInsights.push('O texto expressa sentimento predominantemente positivo');
  } else if (overallSentiment === 'negative') {
    keyInsights.push('O texto expressa sentimento predominantemente negativo - requer atenção');
  }

  const positiveEntities = mainEntities.filter(e => e.sentiment === 'positive');
  const negativeEntities = mainEntities.filter(e => e.sentiment === 'negative');

  if (positiveEntities.length > 0) {
    keyInsights.push(`Menções positivas: ${positiveEntities.map(e => e.name).join(', ')}`);
  }
  if (negativeEntities.length > 0) {
    keyInsights.push(`Menções negativas: ${negativeEntities.map(e => e.name).join(', ')}`);
  }

  return {
    sentiment: sentimentResult,
    entities: entitiesResult,
    syntax: syntaxResult,
    classification: classificationResult,
    summary: {
      overallSentiment,
      mainEntities,
      topics,
      keyInsights
    }
  };
}

// =====================================================
// ANÁLISE DE BATCH (MÚLTIPLOS TEXTOS)
// =====================================================

export async function analyzeBatch(
  texts: string[],
  language: string = 'pt-BR'
): Promise<{
  results: Array<{
    text: string;
    sentiment: SentimentResult;
    entities: Entity[];
  }>;
  aggregate: {
    averageScore: number;
    overallSentiment: 'positive' | 'neutral' | 'negative';
    topEntities: Array<{ name: string; count: number; avgSentiment: number }>;
  };
}> {
  // Processar em batches de 5
  const batchSize = 5;
  const results: Array<{
    text: string;
    sentiment: SentimentResult;
    entities: Entity[];
  }> = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (text) => {
        const [sentiment, entities] = await Promise.all([
          analyzeSentiment(text, language),
          analyzeEntitySentiment(text, language)
        ]);
        return { text, sentiment, entities: entities.entities };
      })
    );
    results.push(...batchResults);
  }

  // Calcular agregados
  const scores = results.map(r => r.sentiment.documentSentiment.score);
  const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;

  let overallSentiment: 'positive' | 'neutral' | 'negative';
  if (averageScore > 0.25) overallSentiment = 'positive';
  else if (averageScore < -0.25) overallSentiment = 'negative';
  else overallSentiment = 'neutral';

  // Agregar entidades
  const entityMap = new Map<string, { count: number; totalSentiment: number }>();
  results.forEach(r => {
    r.entities.forEach(e => {
      const key = e.name.toLowerCase();
      const existing = entityMap.get(key) || { count: 0, totalSentiment: 0 };
      entityMap.set(key, {
        count: existing.count + 1,
        totalSentiment: existing.totalSentiment + (e.sentiment?.score || 0)
      });
    });
  });

  const topEntities = Array.from(entityMap.entries())
    .map(([name, data]) => ({
      name,
      count: data.count,
      avgSentiment: data.totalSentiment / data.count
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    results,
    aggregate: {
      averageScore,
      overallSentiment,
      topEntities
    }
  };
}

// =====================================================
// EXPORTAÇÕES
// =====================================================

export const googleNLP = {
  analyzeSentiment,
  analyzeEntities,
  analyzeEntitySentiment,
  analyzeSyntax,
  classifyText,
  analyzeFullText,
  analyzeBatch
};

export default googleNLP;

