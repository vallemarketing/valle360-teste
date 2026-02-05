import { getOpenAIClient, OPENAI_MODELS } from './client';

export interface BusinessInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'trend' | 'recommendation';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  action: string;
  metrics?: Record<string, number>;
  confidence: number;
}

export interface InsightGenerationInput {
  businessData: {
    revenue?: number;
    clients?: number;
    churnRate?: number;
    growthRate?: number;
    industry?: string;
    teamSize?: number;
  };
  historicalData?: Array<{
    date: string;
    metric: string;
    value: number;
  }>;
  context?: string;
}

export async function generateBusinessInsights(
  input: InsightGenerationInput,
  apiKey?: string
): Promise<BusinessInsight[]> {
  const client = getOpenAIClient(apiKey);

  const systemPrompt = `Você é um consultor de negócios especializado em análise de dados e geração de insights acionáveis. 
Analise os dados fornecidos e gere insights estratégicos.

Retorne APENAS um JSON válido com array de insights:
[
  {
    "id": "uuid",
    "type": "opportunity" | "risk" | "trend" | "recommendation",
    "priority": "high" | "medium" | "low",
    "title": "Título curto e impactante",
    "description": "Descrição detalhada do insight",
    "impact": "Impacto esperado no negócio",
    "action": "Ação recomendada específica",
    "metrics": { "metrica": valor },
    "confidence": 0.0-1.0
  }
]

Gere entre 3 e 7 insights relevantes baseados nos dados.`;

  try {
    const response = await client.chat.completions.create({
      model: OPENAI_MODELS.analysis,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(input) }
      ],
      temperature: 0.5,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Resposta vazia da OpenAI');
    }

    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : parsed.insights || [];
  } catch (error: any) {
    console.error('Erro na geração de insights:', error);
    throw new Error(`Falha na geração de insights: ${error.message}`);
  }
}

export interface MarketingInsight {
  campaign: string;
  performance: 'excellent' | 'good' | 'average' | 'poor';
  roi: number;
  recommendations: string[];
  targetAudience: string;
  bestChannels: string[];
}

export async function generateMarketingInsights(
  data: {
    campaigns: Array<{
      name: string;
      spend: number;
      revenue: number;
      clicks: number;
      conversions: number;
      channel: string;
    }>;
    audience?: {
      demographics?: Record<string, number>;
      interests?: string[];
    };
  },
  apiKey?: string
): Promise<MarketingInsight[]> {
  const client = getOpenAIClient(apiKey);

  const systemPrompt = `Você é um especialista em marketing digital. Analise os dados de campanhas e gere insights acionáveis.

Retorne APENAS um JSON válido:
{
  "insights": [
    {
      "campaign": "nome da campanha",
      "performance": "excellent" | "good" | "average" | "poor",
      "roi": número,
      "recommendations": ["recomendação 1", "recomendação 2"],
      "targetAudience": "descrição do público ideal",
      "bestChannels": ["canal 1", "canal 2"]
    }
  ],
  "overallRecommendations": ["recomendação geral 1", "recomendação geral 2"],
  "budgetAllocation": { "canal": percentual }
}`;

  try {
    const response = await client.chat.completions.create({
      model: OPENAI_MODELS.analysis,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(data) }
      ],
      temperature: 0.4,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Resposta vazia da OpenAI');
    }

    const parsed = JSON.parse(content);
    return parsed.insights || [];
  } catch (error: any) {
    console.error('Erro na geração de insights de marketing:', error);
    throw new Error(`Falha na geração de insights: ${error.message}`);
  }
}

export interface CompetitorInsight {
  competitor: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  recommendations: string[];
}

export async function analyzeCompetitors(
  data: {
    ourBusiness: {
      name: string;
      products: string[];
      pricing: Record<string, number>;
      marketShare?: number;
    };
    competitors: Array<{
      name: string;
      products: string[];
      pricing?: Record<string, number>;
      marketShare?: number;
      socialMedia?: {
        followers: number;
        engagement: number;
      };
    }>;
    industry: string;
  },
  apiKey?: string
): Promise<{
  insights: CompetitorInsight[];
  ourPosition: string;
  strategicRecommendations: string[];
}> {
  const client = getOpenAIClient(apiKey);

  const systemPrompt = `Você é um estrategista de negócios especializado em análise competitiva. 
Analise os dados dos concorrentes e gere uma análise SWOT detalhada.

Retorne APENAS um JSON válido:
{
  "insights": [
    {
      "competitor": "nome",
      "strengths": ["ponto forte 1"],
      "weaknesses": ["fraqueza 1"],
      "opportunities": ["oportunidade 1"],
      "threats": ["ameaça 1"],
      "recommendations": ["como competir com este concorrente"]
    }
  ],
  "ourPosition": "análise da nossa posição no mercado",
  "strategicRecommendations": ["recomendação estratégica 1", "recomendação 2"]
}`;

  try {
    const response = await client.chat.completions.create({
      model: OPENAI_MODELS.analysis,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(data) }
      ],
      temperature: 0.4,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Resposta vazia da OpenAI');
    }

    return JSON.parse(content);
  } catch (error: any) {
    console.error('Erro na análise de concorrentes:', error);
    throw new Error(`Falha na análise: ${error.message}`);
  }
}

export async function generateClientInsights(
  clientData: {
    name: string;
    industry: string;
    services: string[];
    history: Array<{
      date: string;
      event: string;
      sentiment?: string;
    }>;
    metrics?: {
      satisfaction?: number;
      engagement?: number;
      lifetime_value?: number;
    };
  },
  apiKey?: string
): Promise<{
  healthScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  opportunities: string[];
  concerns: string[];
  nextActions: string[];
  upsellPotential: string[];
}> {
  const client = getOpenAIClient(apiKey);

  const systemPrompt = `Você é um especialista em Customer Success. Analise os dados do cliente e gere insights para melhorar o relacionamento.

Retorne APENAS um JSON válido:
{
  "healthScore": 0-100,
  "riskLevel": "low" | "medium" | "high",
  "opportunities": ["oportunidade de upsell/cross-sell"],
  "concerns": ["pontos de atenção"],
  "nextActions": ["próximas ações recomendadas"],
  "upsellPotential": ["serviços que podem interessar ao cliente"]
}`;

  try {
    const response = await client.chat.completions.create({
      model: OPENAI_MODELS.analysis,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(clientData) }
      ],
      temperature: 0.4,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Resposta vazia da OpenAI');
    }

    return JSON.parse(content);
  } catch (error: any) {
    console.error('Erro na geração de insights do cliente:', error);
    throw new Error(`Falha na geração de insights: ${error.message}`);
  }
}






