/**
 * Valle 360 - Serviço Central de Inteligência Artificial
 * Conecta todas as funcionalidades do sistema com IAs reais
 */

import { generateWithAI } from '@/lib/ai/aiRouter';
import { googleNLP } from '@/lib/integrations/google/nlp';

// =====================================================
// TIPOS
// =====================================================

export interface AIInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'trend' | 'recommendation' | 'alert';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  action: string;
  actionType?: 'link' | 'button' | 'automation';
  actionTarget?: string;
  metrics?: Record<string, number | string>;
  confidence: number;
  category: string;
  icon?: string;
}

export interface ClientHealthData {
  clientId: string;
  clientName: string;
  revenue: number;
  monthlyFee: number;
  contractStart: string;
  contractEnd?: string;
  npsScore?: number;
  lastInteraction?: string;
  pendingTasks: number;
  overduePayments: number;
  supportTickets: number;
  sentimentScore?: number;
}

export interface TeamPerformanceData {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  avgCompletionTime: number;
  teamMembers: number;
  topPerformers: string[];
  bottlenecks: string[];
}

export interface FinancialData {
  totalRevenue: number;
  pendingPayments: number;
  overduePayments: number;
  clientsCount: number;
  avgTicket: number;
  churnRate: number;
  growthRate: number;
}

export interface GeneratedContent {
  title: string;
  content: string;
  suggestions?: string[];
  hashtags?: string[];
  callToAction?: string;
}

// =====================================================
// FUNÇÕES DE GERAÇÃO DE INSIGHTS
// =====================================================

/**
 * Gera insights estratégicos baseados em dados do negócio
 */
export async function generateStrategicInsights(
  data: {
    clients?: ClientHealthData[];
    team?: TeamPerformanceData;
    financial?: FinancialData;
    period?: string;
  }
): Promise<AIInsight[]> {
  const systemPrompt = `Você é um consultor de negócios sênior especializado em agências de marketing digital.
Analise os dados fornecidos e gere insights estratégicos ACIONÁVEIS.

Retorne um JSON com array "insights" contendo 5-8 insights:
{
  "insights": [
    {
      "id": "uuid único",
      "type": "opportunity" | "risk" | "trend" | "recommendation" | "alert",
      "priority": "critical" | "high" | "medium" | "low",
      "title": "Título curto e impactante (max 60 chars)",
      "description": "Descrição detalhada do insight (2-3 frases)",
      "impact": "Impacto quantificado (ex: 'Potencial de R$ 50k/mês')",
      "action": "Ação específica e executável",
      "actionType": "link" | "button" | "automation",
      "actionTarget": "/caminho/para/acao ou nome_do_botao",
      "metrics": { "chave": "valor" },
      "confidence": 0.0-1.0,
      "category": "financeiro" | "operacional" | "comercial" | "rh" | "cliente"
    }
  ]
}

Foque em:
1. Oportunidades de upsell/cross-sell
2. Clientes em risco de churn
3. Gargalos operacionais
4. Tendências de mercado
5. Otimização de receita`;

  try {
    const result = await generateWithAI({
      task: 'strategy',
      json: true,
      temperature: 0.7,
      maxTokens: 1400,
      entityType: 'ai_insights',
      entityId: null,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Dados para análise:\n${JSON.stringify(data, null, 2)}` }
      ],
    });

    const parsed = result.json || {};
    return parsed.insights || [];
  } catch (error: any) {
    console.error('Erro ao gerar insights:', error);
    throw error;
  }
}

/**
 * Analisa saúde de um cliente específico
 */
export async function analyzeClientHealth(
  client: ClientHealthData
): Promise<{
  healthScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  insights: AIInsight[];
  predictedChurn: number;
  recommendations: string[];
}> {
  const systemPrompt = `Você é um especialista em Customer Success.
Analise os dados do cliente e retorne um JSON com:
{
  "healthScore": 0-100,
  "riskLevel": "low" | "medium" | "high" | "critical",
  "predictedChurn": 0.0-1.0 (probabilidade de churn nos próximos 90 dias),
  "insights": [
    {
      "id": "uuid",
      "type": "risk" | "opportunity" | "recommendation",
      "priority": "critical" | "high" | "medium" | "low",
      "title": "Título",
      "description": "Descrição",
      "impact": "Impacto",
      "action": "Ação recomendada",
      "confidence": 0.0-1.0,
      "category": "cliente"
    }
  ],
  "recommendations": ["Lista de 3-5 ações prioritárias"]
}`;

  try {
    const result = await generateWithAI({
      task: 'analysis',
      json: true,
      temperature: 0.5,
      maxTokens: 1200,
      entityType: 'client_health',
      entityId: client.clientId || null,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(client) }
      ],
    });

    return result.json;
  } catch (error: any) {
    console.error('Erro ao analisar cliente:', error);
    throw error;
  }
}

/**
 * Gera previsões financeiras
 */
export async function generateFinancialForecast(
  data: FinancialData & { historicalData?: Array<{ month: string; revenue: number }> }
): Promise<{
  forecast: Array<{ month: string; predicted: number; confidence: number }>;
  insights: AIInsight[];
  risks: string[];
  opportunities: string[];
}> {
  const systemPrompt = `Você é um analista financeiro especializado em agências.
Analise os dados e gere previsões para os próximos 6 meses.

Retorne um JSON com:
{
  "forecast": [
    { "month": "2024-01", "predicted": 150000, "confidence": 0.85 }
  ],
  "insights": [array de AIInsight focados em finanças],
  "risks": ["Lista de riscos financeiros identificados"],
  "opportunities": ["Lista de oportunidades de otimização"]
}`;

  try {
    const result = await generateWithAI({
      task: 'analysis',
      json: true,
      temperature: 0.5,
      maxTokens: 1400,
      entityType: 'financial_forecast',
      entityId: null,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(data) }
      ],
    });

    return result.json;
  } catch (error: any) {
    console.error('Erro ao gerar previsão:', error);
    throw error;
  }
}

// =====================================================
// FUNÇÕES DE GERAÇÃO DE CONTEÚDO
// =====================================================

/**
 * Gera conteúdo para redes sociais
 */
export async function generateSocialContent(
  params: {
    platform: 'instagram' | 'linkedin' | 'facebook' | 'twitter';
    topic: string;
    tone: 'professional' | 'casual' | 'inspirational' | 'educational';
    clientBrand?: string;
    keywords?: string[];
  }
): Promise<GeneratedContent> {
  const platformSpecs: Record<string, string> = {
    instagram: 'Post de Instagram com emojis, hashtags relevantes, max 2200 caracteres',
    linkedin: 'Post profissional para LinkedIn, tom corporativo, 1300 caracteres ideal',
    facebook: 'Post para Facebook, engajador, pode ser mais longo',
    twitter: 'Tweet conciso, max 280 caracteres, impactante'
  };

  const systemPrompt = `Você é um social media expert.
Crie conteúdo para ${params.platform}.
Especificações: ${platformSpecs[params.platform]}

Retorne um JSON:
{
  "title": "Título/Hook do post",
  "content": "Conteúdo completo do post",
  "suggestions": ["3 variações alternativas"],
  "hashtags": ["hashtags", "relevantes"],
  "callToAction": "CTA sugerido"
}`;

  try {
    const result = await generateWithAI({
      task: 'copywriting',
      json: true,
      temperature: 0.8,
      maxTokens: 1200,
      entityType: 'social_content',
      entityId: null,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Tema: ${params.topic}\nTom: ${params.tone}\nMarca: ${params.clientBrand || 'Genérico'}\nPalavras-chave: ${params.keywords?.join(', ') || 'Nenhuma'}` }
      ],
    });

    return result.json;
  } catch (error: any) {
    console.error('Erro ao gerar conteúdo:', error);
    throw error;
  }
}

/**
 * Gera email/mensagem personalizada
 */
export async function generateEmail(
  params: {
    type: 'cobranca' | 'followup' | 'proposta' | 'boas_vindas' | 'feedback' | 'upsell';
    recipientName: string;
    recipientCompany?: string;
    context: string;
    tone?: 'formal' | 'amigavel' | 'urgente';
  }
): Promise<{
  subject: string;
  body: string;
  followUpSuggestion?: string;
}> {
  const emailTypes: Record<string, string> = {
    cobranca: 'Email de cobrança educado mas firme',
    followup: 'Email de follow-up para manter relacionamento',
    proposta: 'Email apresentando proposta comercial',
    boas_vindas: 'Email de boas-vindas para novo cliente',
    feedback: 'Email solicitando feedback/NPS',
    upsell: 'Email sugerindo serviços adicionais'
  };

  const systemPrompt = `Você é um especialista em comunicação corporativa.
Crie um ${emailTypes[params.type]}.
Tom: ${params.tone || 'amigavel'}

Retorne um JSON:
{
  "subject": "Assunto do email (max 60 chars)",
  "body": "Corpo do email em HTML simples",
  "followUpSuggestion": "Sugestão de próximo passo"
}`;

  try {
    const result = await generateWithAI({
      task: 'copywriting',
      json: true,
      temperature: 0.7,
      maxTokens: 1100,
      entityType: 'email_generate',
      entityId: null,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Para: ${params.recipientName}${params.recipientCompany ? ` (${params.recipientCompany})` : ''}\nContexto: ${params.context}` }
      ],
    });

    return result.json;
  } catch (error: any) {
    console.error('Erro ao gerar email:', error);
    throw error;
  }
}

/**
 * Gera descrição de vaga
 */
export async function generateJobDescription(
  params: {
    title: string;
    department: string;
    level: 'junior' | 'pleno' | 'senior' | 'lead';
    type: 'clt' | 'pj' | 'estagio' | 'freelancer';
    skills?: string[];
    benefits?: string[];
    companyDescription?: string;
  }
): Promise<{
  title: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  callToAction: string;
}> {
  const systemPrompt = `Você é um especialista em RH e recrutamento.
Crie uma descrição de vaga atraente e completa.

Retorne um JSON:
{
  "title": "Título otimizado da vaga",
  "description": "Descrição geral da posição (2-3 parágrafos)",
  "requirements": ["Lista de requisitos"],
  "responsibilities": ["Lista de responsabilidades"],
  "benefits": ["Lista de benefícios"],
  "callToAction": "Frase de chamada para aplicação"
}`;

  try {
    const result = await generateWithAI({
      task: 'hr',
      json: true,
      temperature: 0.7,
      maxTokens: 1400,
      entityType: 'job_description',
      entityId: null,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(params) }
      ],
    });

    return result.json;
  } catch (error: any) {
    console.error('Erro ao gerar vaga:', error);
    throw error;
  }
}

// =====================================================
// FUNÇÕES DE ANÁLISE
// =====================================================

/**
 * Analisa texto completo (sentimento + entidades + classificação)
 */
export async function analyzeText(
  text: string,
  options: {
    includeSentiment?: boolean;
    includeEntities?: boolean;
    includeClassification?: boolean;
    language?: string;
  } = {}
): Promise<{
  sentiment?: { overall: string; score: number; confidence: number };
  entities?: Array<{ name: string; type: string; sentiment?: string }>;
  categories?: Array<{ name: string; confidence: number }>;
  summary?: string;
  keywords?: string[];
}> {
  const result: any = {};

  try {
    // Usar Google NLP para análise completa
    const fullAnalysis = await googleNLP.analyzeFullText(text, {
      language: options.language || 'pt-BR',
      includeClassification: options.includeClassification
    });

    if (options.includeSentiment !== false) {
      result.sentiment = {
        overall: fullAnalysis.summary.overallSentiment,
        score: fullAnalysis.sentiment.documentSentiment.score,
        confidence: Math.min(fullAnalysis.sentiment.documentSentiment.magnitude / 2, 1)
      };
    }

    if (options.includeEntities !== false) {
      result.entities = fullAnalysis.summary.mainEntities;
    }

    if (options.includeClassification && fullAnalysis.classification) {
      result.categories = fullAnalysis.classification.categories;
    }

    result.keywords = fullAnalysis.summary.keyInsights;

    return result;
  } catch (error: any) {
    console.error('Erro na análise de texto:', error);
    throw error;
  }
}

/**
 * Responde perguntas sobre dados do negócio
 */
export async function askAboutBusiness(
  question: string,
  context: {
    clients?: any[];
    financial?: any;
    team?: any;
    recentActivities?: any[];
  }
): Promise<{
  answer: string;
  confidence: number;
  sources?: string[];
  suggestedActions?: string[];
}> {
  const systemPrompt = `Você é a Val, assistente de IA da Valle 360.
Responda perguntas sobre o negócio baseado nos dados fornecidos.
Seja precisa, útil e proativa em sugerir ações.

Retorne um JSON:
{
  "answer": "Resposta completa e útil",
  "confidence": 0.0-1.0,
  "sources": ["De onde veio a informação"],
  "suggestedActions": ["Ações que o usuário pode tomar"]
}`;

  try {
    const result = await generateWithAI({
      task: 'analysis',
      json: true,
      temperature: 0.5,
      maxTokens: 1100,
      entityType: 'ask_business',
      entityId: null,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Contexto do negócio:\n${JSON.stringify(context, null, 2)}\n\nPergunta: ${question}` }
      ],
    });

    return result.json;
  } catch (error: any) {
    console.error('Erro ao responder pergunta:', error);
    throw error;
  }
}

// =====================================================
// EXPORTAÇÕES
// =====================================================

export const intelligenceService = {
  generateStrategicInsights,
  analyzeClientHealth,
  generateFinancialForecast,
  generateSocialContent,
  generateEmail,
  generateJobDescription,
  analyzeText,
  askAboutBusiness
};

export default intelligenceService;

