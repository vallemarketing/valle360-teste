/**
 * Valle 360 - CMO IA (Chief Marketing Officer Virtual)
 * Estratégia comercial, upsell, cross-sell e retenção de clientes
 */

import { supabase } from '@/lib/supabase';
import { generateWithAI } from '@/lib/ai/aiRouter';

// =====================================================
// TIPOS
// =====================================================

export interface SegmentAnalysis {
  segmentName: string;
  clientCount: number;
  totalRevenue: number;
  averageTicket: number;
  averageLtv: number;
  churnRate: number;
  acquisitionCost: number;
  profitabilityScore: number;
  growthPotential: 'low' | 'medium' | 'high' | 'very_high';
  recommendation: string;
}

export interface UpsellOpportunity {
  id: string;
  clientId: string;
  clientName: string;
  currentServices: string[];
  suggestedService: string;
  opportunityType: 'upsell' | 'cross_sell' | 'upgrade';
  estimatedValue: number;
  probability: number;
  bestTiming: string;
  approachScript: string;
  reasonsToOffer: string[];
  status: 'identified' | 'contacted' | 'negotiating' | 'won' | 'lost';
}

export interface ChurnRisk {
  clientId: string;
  clientName: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: ChurnFactor[];
  predictedChurnDate: string | null;
  potentialRevenueLoss: number;
  recommendedActions: string[];
  lastInteraction: string;
  npsScore: number | null;
}

export interface ChurnFactor {
  factor: string;
  impact: number;
  description: string;
}

export interface RetentionCampaign {
  id: string;
  name: string;
  targetClients: string[];
  type: 'discount' | 'bonus_service' | 'loyalty' | 'personal_touch' | 'feedback';
  message: string;
  expectedRetention: number;
  cost: number;
  status: 'planned' | 'active' | 'completed';
}

export interface MarketingStrategy {
  targetSegment: string;
  idealClientProfile: string;
  idealTicket: number;
  recommendedChannels: string[];
  messagingStrategy: string;
  competitiveAdvantages: string[];
  expectedCac: number;
  expectedLtv: number;
}

export interface CMODashboard {
  kpis: {
    totalClients: number;
    activeClients: number;
    churnRate: number;
    npsAverage: number;
    upsellPipeline: number;
    retentionRate: number;
  };
  segmentAnalysis: SegmentAnalysis[];
  upsellOpportunities: UpsellOpportunity[];
  churnRisks: ChurnRisk[];
  topPerformingClients: {
    id: string;
    name: string;
    revenue: number;
    nps: number;
    timeAsClient: number;
  }[];
  alerts: CMOAlert[];
}

export interface CMOAlert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  clientId?: string;
  recommendedAction: string;
  potentialImpact: number;
  createdAt: string;
}

const CMO_SYSTEM_PROMPT = `Você é o CMO virtual da Valle 360, uma agência de marketing digital.
Seu papel é maximizar receita através de estratégias de aquisição, upsell e retenção.

Suas responsabilidades:
1. Análise de segmentos de mercado
2. Identificação de oportunidades de upsell e cross-sell
3. Predição e prevenção de churn
4. Estratégias de fidelização
5. Definição de perfil de cliente ideal

Sempre forneça:
- Análises baseadas em dados de comportamento
- Scripts de abordagem personalizados
- Timing ideal para cada ação
- Métricas de sucesso esperadas

Seja persuasivo, estratégico e focado em crescimento de receita.`;

// =====================================================
// FUNÇÕES DE ANÁLISE DE SEGMENTOS
// =====================================================

/**
 * Analisa todos os segmentos de clientes
 */
export async function analyzeSegments(): Promise<SegmentAnalysis[]> {
  // Buscar dados de clientes
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, industry, monthly_value, created_at, status');

  if (!clients?.length) {
    // Retornar dados simulados se não houver clientes
    return getSimulatedSegments();
  }

  // Agrupar por indústria
  const segments: Record<string, typeof clients> = {};
  for (const client of clients) {
    const industry = client.industry || 'Outros';
    if (!segments[industry]) segments[industry] = [];
    segments[industry].push(client);
  }

  const analyses: SegmentAnalysis[] = [];

  for (const [segmentName, segmentClients] of Object.entries(segments)) {
    const totalRevenue = segmentClients.reduce((sum, c) => sum + (c.monthly_value || 0), 0);
    const activeClients = segmentClients.filter(c => c.status === 'active');
    const churnedClients = segmentClients.filter(c => c.status === 'churned');

    const analysis: SegmentAnalysis = {
      segmentName,
      clientCount: segmentClients.length,
      totalRevenue,
      averageTicket: totalRevenue / (activeClients.length || 1),
      averageLtv: totalRevenue * 12, // Simplificado
      churnRate: (churnedClients.length / segmentClients.length) * 100,
      acquisitionCost: 2500, // Simulado
      profitabilityScore: calculateProfitabilityScore(totalRevenue, segmentClients.length),
      growthPotential: getGrowthPotential(segmentName),
      recommendation: ''
    };

    // Gerar recomendação
    analysis.recommendation = await generateSegmentRecommendation(analysis);
    analyses.push(analysis);
  }

  return analyses.sort((a, b) => b.profitabilityScore - a.profitabilityScore);
}

function calculateProfitabilityScore(revenue: number, clientCount: number): number {
  const avgTicket = revenue / (clientCount || 1);
  return Math.min(100, (avgTicket / 3000) * 100); // R$ 3000 = score 100
}

function getGrowthPotential(segment: string): 'low' | 'medium' | 'high' | 'very_high' {
  const highGrowthSegments = ['e-commerce', 'saúde', 'tecnologia', 'educação'];
  const mediumGrowthSegments = ['varejo', 'alimentação', 'serviços'];
  
  const normalized = segment.toLowerCase();
  if (highGrowthSegments.some(s => normalized.includes(s))) return 'very_high';
  if (mediumGrowthSegments.some(s => normalized.includes(s))) return 'high';
  return 'medium';
}

async function generateSegmentRecommendation(segment: SegmentAnalysis): Promise<string> {
  try {
    const result = await generateWithAI({
      task: 'strategy',
      json: false,
      temperature: 0.7,
      maxTokens: 150,
      entityType: 'cmo_segment_reco',
      entityId: null,
      messages: [
        { role: 'system', content: CMO_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Gere 1 recomendação estratégica em 2 frases para este segmento:
Segmento: ${segment.segmentName}
Clientes: ${segment.clientCount}
Ticket médio: R$ ${segment.averageTicket.toFixed(0)}
Churn: ${segment.churnRate.toFixed(1)}%
Potencial: ${segment.growthPotential}`
        }
      ],
    });

    return result.text || 'Avaliar potencial de crescimento.';
  } catch {
    return 'Avaliar potencial de crescimento e oportunidades de upsell.';
  }
}

function getSimulatedSegments(): SegmentAnalysis[] {
  return [
    {
      segmentName: 'E-commerce',
      clientCount: 12,
      totalRevenue: 84000,
      averageTicket: 7000,
      averageLtv: 168000,
      churnRate: 8,
      acquisitionCost: 3000,
      profitabilityScore: 92,
      growthPotential: 'very_high',
      recommendation: 'Expandir prospecção neste segmento. Alto ticket e baixo churn indicam fit perfeito.'
    },
    {
      segmentName: 'Clínicas e Saúde',
      clientCount: 8,
      totalRevenue: 48000,
      averageTicket: 6000,
      averageLtv: 144000,
      churnRate: 5,
      acquisitionCost: 2500,
      profitabilityScore: 88,
      growthPotential: 'very_high',
      recommendation: 'Foco em upsell de gestão de reputação e Google Ads para clínicas.'
    },
    {
      segmentName: 'Franquias',
      clientCount: 5,
      totalRevenue: 75000,
      averageTicket: 15000,
      averageLtv: 360000,
      churnRate: 3,
      acquisitionCost: 5000,
      profitabilityScore: 95,
      growthPotential: 'high',
      recommendation: 'Ticket mais alto e fidelidade excepcional. Criar programa VIP para este segmento.'
    },
    {
      segmentName: 'Restaurantes',
      clientCount: 15,
      totalRevenue: 45000,
      averageTicket: 3000,
      averageLtv: 54000,
      churnRate: 18,
      acquisitionCost: 1500,
      profitabilityScore: 65,
      growthPotential: 'medium',
      recommendation: 'Alto churn indica necessidade de revisão do serviço ou ticket. Considerar pacotes mais acessíveis.'
    }
  ];
}

// =====================================================
// FUNÇÕES DE UPSELL
// =====================================================

/**
 * Identifica oportunidades de upsell
 */
export async function identifyUpsellOpportunities(): Promise<UpsellOpportunity[]> {
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, industry, monthly_value, services, created_at')
    .eq('status', 'active');

  if (!clients?.length) return getSimulatedUpsells();

  const opportunities: UpsellOpportunity[] = [];

  for (const client of clients) {
    const currentServices = client.services || [];
    const monthsAsClient = Math.floor(
      (Date.now() - new Date(client.created_at).getTime()) / (30 * 24 * 60 * 60 * 1000)
    );

    // Identificar serviços que o cliente não tem
    const allServices = ['social_media', 'trafego', 'design', 'video', 'web', 'seo', 'email_marketing'];
    const missingServices = allServices.filter(s => !currentServices.includes(s));

    for (const service of missingServices.slice(0, 2)) {
      const opportunity = await generateUpsellOpportunity(client, service, monthsAsClient);
      if (opportunity.probability >= 40) {
        opportunities.push(opportunity);
      }
    }
  }

  return opportunities.sort((a, b) => b.probability - a.probability);
}

async function generateUpsellOpportunity(
  client: { id: string; name: string; industry: string; monthly_value: number; services: string[] },
  service: string,
  monthsAsClient: number
): Promise<UpsellOpportunity> {
  const serviceValues: Record<string, number> = {
    social_media: 3500,
    trafego: 4500,
    design: 2800,
    video: 5000,
    web: 8000,
    seo: 3000,
    email_marketing: 2000
  };

  const estimatedValue = serviceValues[service] || 3000;
  
  // Calcular probabilidade baseada em fatores
  let probability = 50;
  if (monthsAsClient >= 6) probability += 15; // Cliente fiel
  if (client.monthly_value >= 5000) probability += 10; // Já gasta bem
  if (client.industry === 'e-commerce') probability += 10; // Segmento propenso

  const script = await generateApproachScript(client, service);

  return {
    id: `upsell-${client.id}-${service}`,
    clientId: client.id,
    clientName: client.name,
    currentServices: client.services || [],
    suggestedService: service,
    opportunityType: 'upsell',
    estimatedValue,
    probability: Math.min(95, probability),
    bestTiming: monthsAsClient < 3 ? 'Aguardar maturidade (3 meses)' : 'Próxima reunião de resultados',
    approachScript: script,
    reasonsToOffer: [
      `Cliente há ${monthsAsClient} meses - momento ideal`,
      `Serviço complementa ${client.services?.[0] || 'atual'}`,
      `Potencial de aumento de ${Math.round(estimatedValue / (client.monthly_value || 1) * 100)}% na receita`
    ],
    status: 'identified'
  };
}

async function generateApproachScript(
  client: { name: string; industry: string; services: string[] },
  service: string
): Promise<string> {
  try {
    const result = await generateWithAI({
      task: 'sales',
      json: false,
      temperature: 0.8,
      maxTokens: 200,
      entityType: 'cmo_upsell_script',
      entityId: null,
      messages: [
        { role: 'system', content: CMO_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Crie um script de abordagem de upsell em 3-4 frases:
Cliente: ${client.name}
Setor: ${client.industry}
Serviços atuais: ${client.services?.join(', ') || 'Não informado'}
Serviço a oferecer: ${service}

Seja natural e focado no valor para o cliente.`
        }
      ],
    });

    return result.text || 'Apresentar benefícios do serviço.';
  } catch {
    return `Olá [Nome], notamos que você está tendo ótimos resultados com nossos serviços atuais. Tenho uma proposta que pode potencializar ainda mais: ${service}. Podemos conversar?`;
  }
}

function getSimulatedUpsells(): UpsellOpportunity[] {
  return [
    {
      id: 'upsell-1',
      clientId: 'client-1',
      clientName: 'Tech Solutions',
      currentServices: ['social_media'],
      suggestedService: 'trafego',
      opportunityType: 'upsell',
      estimatedValue: 4500,
      probability: 85,
      bestTiming: 'Próxima semana - após relatório mensal',
      approachScript: 'Tech Solutions, seus resultados em redes sociais estão excelentes! Para multiplicar essas conversões, tráfego pago é o próximo passo natural. Vamos conversar?',
      reasonsToOffer: ['Cliente há 8 meses', 'NPS 9', 'Crescimento de 40% no engajamento'],
      status: 'identified'
    },
    {
      id: 'upsell-2',
      clientId: 'client-2',
      clientName: 'Clínica Bem-Estar',
      currentServices: ['social_media', 'trafego'],
      suggestedService: 'video',
      opportunityType: 'cross_sell',
      estimatedValue: 5000,
      probability: 72,
      bestTiming: 'Após Black Friday',
      approachScript: 'Clínica Bem-Estar, conteúdo em vídeo tem 3x mais engajamento no setor de saúde. Que tal criarmos vídeos curtos para seus procedimentos?',
      reasonsToOffer: ['Setor valoriza vídeo', 'Já tem base de tráfego', 'Competidores usando vídeo'],
      status: 'identified'
    }
  ];
}

// =====================================================
// FUNÇÕES DE CHURN
// =====================================================

/**
 * Analisa risco de churn de todos os clientes
 */
export async function analyzeChurnRisk(): Promise<ChurnRisk[]> {
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, monthly_value, created_at, last_contact, nps_score')
    .eq('status', 'active');

  if (!clients?.length) return getSimulatedChurnRisks();

  const risks: ChurnRisk[] = [];

  for (const client of clients) {
    const factors: ChurnFactor[] = [];
    let riskScore = 0;

    // Fator: Tempo sem contato
    const daysSinceContact = client.last_contact 
      ? Math.floor((Date.now() - new Date(client.last_contact).getTime()) / (24 * 60 * 60 * 1000))
      : 30;
    
    if (daysSinceContact > 30) {
      const impact = Math.min(30, daysSinceContact - 30);
      riskScore += impact;
      factors.push({
        factor: 'Sem contato recente',
        impact,
        description: `${daysSinceContact} dias sem interação`
      });
    }

    // Fator: NPS baixo
    if (client.nps_score !== null && client.nps_score < 7) {
      const impact = (7 - client.nps_score) * 10;
      riskScore += impact;
      factors.push({
        factor: 'NPS baixo',
        impact,
        description: `NPS de ${client.nps_score} (detrator)`
      });
    }

    // Fator: Cliente novo (mais propenso a churn)
    const monthsAsClient = Math.floor(
      (Date.now() - new Date(client.created_at).getTime()) / (30 * 24 * 60 * 60 * 1000)
    );
    if (monthsAsClient < 3) {
      riskScore += 15;
      factors.push({
        factor: 'Cliente recente',
        impact: 15,
        description: 'Primeiros 3 meses são críticos'
      });
    }

    // Determinar nível de risco
    const riskLevel = riskScore >= 60 ? 'critical' : riskScore >= 40 ? 'high' : riskScore >= 20 ? 'medium' : 'low';

    if (riskScore >= 20) {
      risks.push({
        clientId: client.id,
        clientName: client.name,
        riskScore: Math.min(100, riskScore),
        riskLevel,
        factors,
        predictedChurnDate: riskLevel === 'critical' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
        potentialRevenueLoss: (client.monthly_value || 0) * 12,
        recommendedActions: generateRetentionActions(factors),
        lastInteraction: client.last_contact || 'Não registrado',
        npsScore: client.nps_score
      });
    }
  }

  return risks.sort((a, b) => b.riskScore - a.riskScore);
}

function generateRetentionActions(factors: ChurnFactor[]): string[] {
  const actions: string[] = [];

  for (const factor of factors) {
    switch (factor.factor) {
      case 'Sem contato recente':
        actions.push('Agendar ligação de relacionamento');
        actions.push('Enviar relatório de resultados personalizado');
        break;
      case 'NPS baixo':
        actions.push('Realizar pesquisa de satisfação detalhada');
        actions.push('Oferecer reunião com gestor para ouvir feedback');
        break;
      case 'Cliente recente':
        actions.push('Intensificar onboarding');
        actions.push('Enviar quick wins e primeiros resultados');
        break;
    }
  }

  return [...new Set(actions)].slice(0, 4);
}

function getSimulatedChurnRisks(): ChurnRisk[] {
  return [
    {
      clientId: 'risk-1',
      clientName: 'Loja Virtual XYZ',
      riskScore: 78,
      riskLevel: 'critical',
      factors: [
        { factor: 'Sem contato recente', impact: 35, description: '45 dias sem interação' },
        { factor: 'NPS baixo', impact: 30, description: 'NPS de 4 (detrator)' },
        { factor: 'Reclamação não resolvida', impact: 13, description: 'Ticket aberto há 15 dias' }
      ],
      predictedChurnDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      potentialRevenueLoss: 60000,
      recommendedActions: [
        'URGENTE: Ligar para o cliente hoje',
        'Preparar plano de ação para reclamação',
        'Oferecer reunião com diretor'
      ],
      lastInteraction: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      npsScore: 4
    },
    {
      clientId: 'risk-2',
      clientName: 'Restaurante Sabor',
      riskScore: 52,
      riskLevel: 'high',
      factors: [
        { factor: 'Resultados abaixo do esperado', impact: 32, description: 'ROAS caiu 30%' },
        { factor: 'Questionou valor', impact: 20, description: 'Pediu revisão de contrato' }
      ],
      predictedChurnDate: null,
      potentialRevenueLoss: 36000,
      recommendedActions: [
        'Preparar análise de otimização de campanha',
        'Agendar reunião de revisão estratégica',
        'Considerar desconto temporário'
      ],
      lastInteraction: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      npsScore: 6
    }
  ];
}

// =====================================================
// CAMPANHAS DE RETENÇÃO
// =====================================================

/**
 * Gera campanha de retenção personalizada
 */
export async function generateRetentionCampaign(
  churnRisks: ChurnRisk[]
): Promise<RetentionCampaign> {
  const criticalClients = churnRisks.filter(r => r.riskLevel === 'critical' || r.riskLevel === 'high');
  
  if (criticalClients.length === 0) {
    return {
      id: 'campaign-loyalty',
      name: 'Programa de Fidelidade',
      targetClients: [],
      type: 'loyalty',
      message: 'Obrigado por fazer parte da nossa jornada! Como forma de agradecimento...',
      expectedRetention: 95,
      cost: 0,
      status: 'planned'
    };
  }

  const totalAtRisk = criticalClients.reduce((sum, c) => sum + c.potentialRevenueLoss, 0);

  // Gerar mensagem personalizada
  const message = await generateRetentionMessage(criticalClients);

  return {
    id: `campaign-${Date.now()}`,
    name: `Campanha de Retenção - ${criticalClients.length} clientes em risco`,
    targetClients: criticalClients.map(c => c.clientId),
    type: 'personal_touch',
    message,
    expectedRetention: 70,
    cost: totalAtRisk * 0.1, // 10% do valor em risco como investimento
    status: 'planned'
  };
}

async function generateRetentionMessage(clients: ChurnRisk[]): Promise<string> {
  try {
    const result = await generateWithAI({
      task: 'copywriting',
      json: false,
      temperature: 0.7,
      maxTokens: 200,
      entityType: 'cmo_retention_message',
      entityId: null,
      messages: [
        { role: 'system', content: CMO_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Crie uma mensagem de retenção empática e profissional (3-4 frases) para clientes em risco de churn.
Principais problemas detectados: ${[...new Set(clients.flatMap(c => c.factors.map(f => f.factor)))].join(', ')}

A mensagem deve reconhecer possíveis falhas e propor uma conversa.`
        }
      ],
    });

    return result.text || 'Gostaríamos de conversar sobre como podemos melhorar nossa parceria.';
  } catch {
    return 'Percebemos que podemos melhorar. Gostaríamos de agendar uma conversa para entender suas necessidades e garantir que estamos entregando o melhor para você.';
  }
}

// =====================================================
// DASHBOARD CONSOLIDADO
// =====================================================

/**
 * Retorna dashboard completo do CMO
 */
export async function getCMODashboard(): Promise<CMODashboard> {
  const segmentAnalysis = await analyzeSegments();
  const upsellOpportunities = await identifyUpsellOpportunities();
  const churnRisks = await analyzeChurnRisk();

  // KPIs
  const { data: clientsData } = await supabase
    .from('clients')
    .select('id, status, monthly_value, nps_score');

  const clients = clientsData || [];
  const activeClients = clients.filter(c => c.status === 'active');
  const churnedClients = clients.filter(c => c.status === 'churned');
  const npsScores = activeClients.filter(c => c.nps_score !== null).map(c => c.nps_score!);

  const upsellPipeline = upsellOpportunities.reduce((sum, o) => sum + o.estimatedValue, 0);

  // Alertas
  const alerts: CMOAlert[] = [];

  // Alertas de churn crítico
  const criticalChurn = churnRisks.filter(r => r.riskLevel === 'critical');
  for (const risk of criticalChurn.slice(0, 3)) {
    alerts.push({
      id: `churn-${risk.clientId}`,
      type: 'churn_critical',
      severity: 'critical',
      title: `URGENTE: ${risk.clientName} em risco crítico`,
      description: `Score de risco: ${risk.riskScore}. Perda potencial: R$ ${risk.potentialRevenueLoss.toLocaleString('pt-BR')}/ano`,
      clientId: risk.clientId,
      recommendedAction: risk.recommendedActions[0] || 'Contato imediato',
      potentialImpact: risk.potentialRevenueLoss,
      createdAt: new Date().toISOString()
    });
  }

  // Alertas de oportunidades quentes
  const hotOpportunities = upsellOpportunities.filter(o => o.probability >= 70);
  if (hotOpportunities.length > 0) {
    alerts.push({
      id: 'hot-opportunities',
      type: 'upsell_opportunity',
      severity: 'medium',
      title: `${hotOpportunities.length} oportunidades quentes de upsell`,
      description: `Potencial de R$ ${hotOpportunities.reduce((s, o) => s + o.estimatedValue, 0).toLocaleString('pt-BR')}/mês`,
      recommendedAction: 'Priorizar contato com clientes de alta probabilidade',
      potentialImpact: hotOpportunities.reduce((s, o) => s + o.estimatedValue * 12, 0),
      createdAt: new Date().toISOString()
    });
  }

  return {
    kpis: {
      totalClients: clients.length,
      activeClients: activeClients.length,
      churnRate: clients.length > 0 ? (churnedClients.length / clients.length) * 100 : 0,
      npsAverage: npsScores.length > 0 ? npsScores.reduce((a, b) => a + b, 0) / npsScores.length : 0,
      upsellPipeline,
      retentionRate: clients.length > 0 ? (activeClients.length / clients.length) * 100 : 100
    },
    segmentAnalysis,
    upsellOpportunities,
    churnRisks,
    topPerformingClients: activeClients
      .sort((a, b) => (b.monthly_value || 0) - (a.monthly_value || 0))
      .slice(0, 5)
      .map(c => ({
        id: c.id,
        name: 'Cliente ' + c.id.slice(0, 4),
        revenue: c.monthly_value || 0,
        nps: c.nps_score || 0,
        timeAsClient: 12 // Simulado
      })),
    alerts
  };
}

// =====================================================
// CHAT COM CMO
// =====================================================

/**
 * Processa mensagem para o CMO IA
 */
export async function chatWithCMO(message: string, context?: Record<string, unknown>): Promise<string> {
  const dashboard = await getCMODashboard();

  const contextData = `
DADOS ATUAIS DE CLIENTES:
- Total de clientes: ${dashboard.kpis.totalClients}
- Clientes ativos: ${dashboard.kpis.activeClients}
- Taxa de churn: ${dashboard.kpis.churnRate.toFixed(1)}%
- NPS médio: ${dashboard.kpis.npsAverage.toFixed(1)}
- Pipeline de upsell: R$ ${dashboard.kpis.upsellPipeline.toLocaleString('pt-BR')}/mês

SEGMENTOS MAIS RENTÁVEIS:
${dashboard.segmentAnalysis.slice(0, 3).map(s => 
  `- ${s.segmentName}: ${s.clientCount} clientes, ticket R$ ${s.averageTicket.toLocaleString('pt-BR')}`
).join('\n')}

CLIENTES EM RISCO:
${dashboard.churnRisks.slice(0, 3).map(r => 
  `- ${r.clientName}: score ${r.riskScore}, perda potencial R$ ${r.potentialRevenueLoss.toLocaleString('pt-BR')}`
).join('\n')}

OPORTUNIDADES DE UPSELL:
${dashboard.upsellOpportunities.slice(0, 3).map(o => 
  `- ${o.clientName}: ${o.suggestedService}, R$ ${o.estimatedValue.toLocaleString('pt-BR')}, ${o.probability}% probabilidade`
).join('\n')}
`;

  try {
    const result = await generateWithAI({
      task: 'strategy',
      json: false,
      temperature: 0.7,
      maxTokens: 1000,
      entityType: 'cmo_chat',
      entityId: null,
      messages: [
        { role: 'system', content: CMO_SYSTEM_PROMPT },
        { role: 'system', content: contextData },
        { role: 'user', content: message }
      ],
    });

    return result.text || 'Desculpe, não consegui processar sua solicitação.';
  } catch (error) {
    console.error('Erro no chat CMO:', error);
    return 'Erro ao processar solicitação. Tente novamente.';
  }
}

export default {
  analyzeSegments,
  identifyUpsellOpportunities,
  analyzeChurnRisk,
  generateRetentionCampaign,
  getCMODashboard,
  chatWithCMO
};

