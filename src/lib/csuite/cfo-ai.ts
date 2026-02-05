/**
 * Valle 360 - CFO IA (Chief Financial Officer Virtual)
 * Precificação inteligente, análise de rentabilidade, previsões financeiras
 */

import { supabase } from '@/lib/supabase';
import { generateWithAI } from '@/lib/ai/aiRouter';

// =====================================================
// TIPOS
// =====================================================

export interface ServicePricing {
  id: string;
  service_name: string;
  service_category: string;
  base_cost: number;
  hours_estimate: number;
  suggested_price: number;
  current_price: number;
  margin_percentage: number;
  market_benchmark: number;
  ai_recommendation: string;
}

export interface ClientProfitability {
  client_id: string;
  client_name: string;
  revenue: number;
  direct_costs: number;
  hours_spent: number;
  gross_margin: number;
  margin_percentage: number;
  profitability_score: number;
  trend: 'up' | 'down' | 'stable';
  ai_insights: string[];
}

export interface FinancialForecast {
  period: string;
  optimistic: number;
  expected: number;
  conservative: number;
  confidence: number;
  factors: string[];
}

export interface PricingRecommendation {
  service: string;
  currentPrice: number;
  recommendedPrice: number;
  minPrice: number;
  maxPrice: number;
  margin: number;
  justification: string;
  marketComparison: 'below' | 'average' | 'above';
}

export interface CFOAlert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  potentialImpact: number;
  recommendedAction: string;
  createdAt: string;
}

export interface CFODashboard {
  kpis: {
    totalRevenue: number;
    totalCosts: number;
    grossMargin: number;
    averageMargin: number;
    mrr: number;
    revenueGrowth: number;
  };
  alerts: CFOAlert[];
  topClients: ClientProfitability[];
  worstClients: ClientProfitability[];
  forecasts: FinancialForecast[];
  pricingIssues: PricingRecommendation[];
}

const CFO_SYSTEM_PROMPT = `Você é o CFO virtual da Valle 360, uma agência de marketing digital.
Seu papel é analisar dados financeiros e fornecer insights estratégicos como um diretor financeiro experiente.

Suas responsabilidades:
1. Precificação inteligente de serviços
2. Análise de rentabilidade por cliente
3. Previsões financeiras
4. Identificação de riscos e oportunidades
5. Recomendações de ajustes de preço

Sempre forneça:
- Números específicos e justificativas
- Comparações com benchmarks de mercado
- Ações concretas e priorizadas
- Análise de risco vs retorno

Seja direto, analítico e focado em resultados financeiros.`;

// =====================================================
// FUNÇÕES DE PRECIFICAÇÃO
// =====================================================

/**
 * Calcula o preço sugerido para um serviço
 */
export async function calculateServicePrice(params: {
  serviceName: string;
  category: string;
  hoursEstimate: number;
  complexity: 'low' | 'medium' | 'high';
  clientSegment?: string;
  includeTools?: boolean;
}): Promise<PricingRecommendation> {
  // Buscar custos médios da equipe
  const { data: costs } = await supabase
    .from('employee_costs')
    .select('hourly_cost, department:user_profiles(role)')
    .order('effective_date', { ascending: false });

  const averageHourlyCost = costs?.length 
    ? costs.reduce((sum, c) => sum + (c.hourly_cost || 0), 0) / costs.length
    : 150; // Fallback

  // Multiplicadores
  const complexityMultiplier = {
    low: 1.0,
    medium: 1.3,
    high: 1.6
  }[params.complexity];

  const marginTargets = {
    'social_media': 0.40,
    'design': 0.45,
    'trafego': 0.35,
    'video': 0.50,
    'web': 0.45,
    'default': 0.40
  };

  const targetMargin = marginTargets[params.category as keyof typeof marginTargets] || marginTargets.default;

  // Cálculos
  const baseCost = params.hoursEstimate * averageHourlyCost;
  const adjustedCost = baseCost * complexityMultiplier;
  const toolsCost = params.includeTools ? adjustedCost * 0.1 : 0;
  const totalCost = adjustedCost + toolsCost;
  
  const recommendedPrice = totalCost / (1 - targetMargin);
  const minPrice = totalCost / (1 - 0.25); // Margem mínima 25%
  const maxPrice = totalCost / (1 - 0.55); // Margem máxima 55%

  // Buscar benchmark de mercado (simulado)
  const marketBenchmarks: Record<string, number> = {
    'social_media': 3500,
    'design': 2800,
    'trafego': 4500,
    'video': 5000,
    'web': 8000,
  };

  const benchmark = marketBenchmarks[params.category] || 3000;
  const marketComparison = recommendedPrice < benchmark * 0.9 
    ? 'below' 
    : recommendedPrice > benchmark * 1.1 
      ? 'above' 
      : 'average';

  // Gerar justificativa com IA
  const justification = await generatePricingJustification({
    service: params.serviceName,
    cost: totalCost,
    price: recommendedPrice,
    margin: targetMargin,
    benchmark,
    marketComparison
  });

  return {
    service: params.serviceName,
    currentPrice: 0,
    recommendedPrice: Math.round(recommendedPrice),
    minPrice: Math.round(minPrice),
    maxPrice: Math.round(maxPrice),
    margin: targetMargin * 100,
    justification,
    marketComparison
  };
}

/**
 * Gera justificativa de preço com IA
 */
async function generatePricingJustification(params: {
  service: string;
  cost: number;
  price: number;
  margin: number;
  benchmark: number;
  marketComparison: string;
}): Promise<string> {
  try {
    const result = await generateWithAI({
      task: 'analysis',
      json: false,
      temperature: 0.7,
      maxTokens: 200,
      entityType: 'cfo_pricing_justification',
      entityId: null,
      messages: [
        { role: 'system', content: CFO_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Gere uma justificativa de preço em 2-3 frases para:
Serviço: ${params.service}
Custo base: R$ ${params.cost.toFixed(2)}
Preço sugerido: R$ ${params.price.toFixed(2)}
Margem: ${(params.margin * 100).toFixed(0)}%
Benchmark de mercado: R$ ${params.benchmark.toFixed(2)}
Posição: ${params.marketComparison}

Seja direto e focado no valor.`
        }
      ],
    });

    return result.text || `Preço baseado em custo de R$ ${params.cost.toFixed(2)} com margem de ${(params.margin * 100).toFixed(0)}%.`;
  } catch {
    return `Preço calculado com base nos custos operacionais e margem alvo de ${(params.margin * 100).toFixed(0)}%.`;
  }
}

/**
 * Analisa todos os serviços e sugere ajustes de preço
 */
export async function analyzePricingHealth(): Promise<{
  healthy: ServicePricing[];
  needsAttention: ServicePricing[];
  critical: ServicePricing[];
  totalPotentialRevenue: number;
}> {
  const { data: services } = await supabase
    .from('service_pricing')
    .select('*')
    .eq('is_active', true);

  const healthy: ServicePricing[] = [];
  const needsAttention: ServicePricing[] = [];
  const critical: ServicePricing[] = [];
  let totalPotentialRevenue = 0;

  for (const service of services || []) {
    const marginDiff = service.margin_percentage - 35; // Meta: 35%

    if (marginDiff >= 0) {
      healthy.push(service);
    } else if (marginDiff >= -15) {
      needsAttention.push(service);
      totalPotentialRevenue += (service.suggested_price - service.current_price) || 0;
    } else {
      critical.push(service);
      totalPotentialRevenue += (service.suggested_price - service.current_price) || 0;
    }
  }

  return { healthy, needsAttention, critical, totalPotentialRevenue };
}

// =====================================================
// FUNÇÕES DE RENTABILIDADE
// =====================================================

/**
 * Analisa rentabilidade de todos os clientes
 */
export async function analyzeClientProfitability(): Promise<ClientProfitability[]> {
  const { data: profitability } = await supabase
    .from('client_profitability')
    .select(`
      *,
      clients:client_id(name, industry)
    `)
    .order('margin_percentage', { ascending: true })
    .limit(50);

  if (!profitability) return [];

  return profitability.map(p => ({
    client_id: p.client_id,
    client_name: p.clients?.name || 'Cliente',
    revenue: p.revenue,
    direct_costs: p.direct_costs,
    hours_spent: p.hours_spent,
    gross_margin: p.gross_margin,
    margin_percentage: p.margin_percentage,
    profitability_score: p.profitability_score,
    trend: p.margin_percentage > 30 ? 'up' : p.margin_percentage > 20 ? 'stable' : 'down',
    ai_insights: p.ai_insights || []
  }));
}

/**
 * Gera insights de rentabilidade com IA
 */
export async function generateProfitabilityInsights(clientId: string): Promise<string[]> {
  const { data: client } = await supabase
    .from('client_profitability')
    .select('*')
    .eq('client_id', clientId)
    .order('period_month', { ascending: false })
    .limit(6);

  if (!client?.length) return ['Dados insuficientes para análise'];

  const latestMonth = client[0];
  const previousMonth = client[1];

  const insights: string[] = [];

  // Análise de margem
  if (latestMonth.margin_percentage < 25) {
    insights.push(`⚠️ Margem crítica de ${latestMonth.margin_percentage?.toFixed(1)}% - abaixo do mínimo de 25%`);
  }

  // Tendência
  if (previousMonth && latestMonth.margin_percentage < previousMonth.margin_percentage) {
    const drop = previousMonth.margin_percentage - latestMonth.margin_percentage;
    insights.push(`📉 Margem caiu ${drop.toFixed(1)}% em relação ao mês anterior`);
  }

  // Horas vs receita
  const hourlyRevenue = latestMonth.revenue / (latestMonth.hours_spent || 1);
  if (hourlyRevenue < 100) {
    insights.push(`⏱️ Receita por hora de R$ ${hourlyRevenue.toFixed(0)} está abaixo do ideal (R$ 150+)`);
  }

  // Gerar insight com IA
  try {
    const result = await generateWithAI({
      task: 'analysis',
      json: false,
      temperature: 0.7,
      maxTokens: 100,
      entityType: 'cfo_profitability_insight',
      entityId: latestMonth.client_id || null,
      messages: [
        { role: 'system', content: CFO_SYSTEM_PROMPT },
        { 
          role: 'user', 
          content: `Analise estes dados do cliente e dê 1 insight estratégico:
Receita: R$ ${latestMonth.revenue}
Custos: R$ ${latestMonth.direct_costs}
Horas gastas: ${latestMonth.hours_spent}h
Margem: ${latestMonth.margin_percentage?.toFixed(1)}%

Responda em 1 frase direta com uma recomendação.`
        }
      ],
    });

    if (result.text) {
      insights.push(`💡 ${result.text}`);
    }
  } catch (e) {
    console.error('Erro ao gerar insight:', e);
  }

  return insights;
}

// =====================================================
// FUNÇÕES DE PREVISÃO
// =====================================================

/**
 * Gera previsão financeira para os próximos meses
 */
export async function generateFinancialForecast(months: number = 3): Promise<FinancialForecast[]> {
  // Buscar dados históricos
  const { data: historical } = await supabase
    .from('financial_forecasts')
    .select('*')
    .order('period_month', { ascending: false })
    .limit(12);

  // Buscar receita atual
  const { data: currentRevenue } = await supabase
    .from('client_profitability')
    .select('revenue')
    .gte('period_month', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

  const totalCurrentRevenue = currentRevenue?.reduce((sum, r) => sum + (r.revenue || 0), 0) || 100000;
  const monthlyAverage = totalCurrentRevenue / 3;

  const forecasts: FinancialForecast[] = [];
  const now = new Date();

  for (let i = 1; i <= months; i++) {
    const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const monthName = futureDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    // Fatores sazonais
    const month = futureDate.getMonth() + 1;
    let seasonalFactor = 1.0;
    if (month === 12 || month === 11) seasonalFactor = 1.2; // Black Friday, Natal
    if (month === 1 || month === 2) seasonalFactor = 0.85; // Baixa temporada

    // Tendência de crescimento
    const growthFactor = 1.05; // 5% de crescimento esperado

    const expected = monthlyAverage * growthFactor * seasonalFactor;
    const optimistic = expected * 1.15;
    const conservative = expected * 0.85;

    const factors: string[] = [];
    if (seasonalFactor > 1) factors.push('Alta sazonalidade');
    if (seasonalFactor < 1) factors.push('Baixa temporada');
    factors.push('Tendência de crescimento de 5%');

    forecasts.push({
      period: monthName,
      optimistic: Math.round(optimistic),
      expected: Math.round(expected),
      conservative: Math.round(conservative),
      confidence: 75,
      factors
    });
  }

  return forecasts;
}

// =====================================================
// FUNÇÕES DE ALERTAS
// =====================================================

/**
 * Gera alertas do CFO
 */
export async function generateCFOAlerts(): Promise<CFOAlert[]> {
  const alerts: CFOAlert[] = [];

  // 1. Clientes com margem crítica
  const { data: lowMarginClients } = await supabase
    .from('client_profitability')
    .select('*, clients:client_id(name)')
    .lt('margin_percentage', 20)
    .order('margin_percentage', { ascending: true })
    .limit(5);

  for (const client of lowMarginClients || []) {
    alerts.push({
      id: `margin-${client.client_id}`,
      type: 'low_margin',
      severity: client.margin_percentage < 10 ? 'critical' : 'high',
      title: `Margem crítica: ${client.clients?.name || 'Cliente'}`,
      description: `Margem de apenas ${client.margin_percentage?.toFixed(1)}%. Receita: R$ ${client.revenue?.toLocaleString('pt-BR')}, Custos: R$ ${client.direct_costs?.toLocaleString('pt-BR')}`,
      potentialImpact: (35 - client.margin_percentage) * client.revenue / 100,
      recommendedAction: 'Renegociar valores ou reduzir escopo de serviços',
      createdAt: new Date().toISOString()
    });
  }

  // 2. Serviços subprecificados
  const { data: underpriced } = await supabase
    .from('service_pricing')
    .select('*')
    .lt('margin_percentage', 25)
    .eq('is_active', true);

  for (const service of underpriced || []) {
    alerts.push({
      id: `pricing-${service.id}`,
      type: 'underpriced_service',
      severity: 'medium',
      title: `Serviço subprecificado: ${service.service_name}`,
      description: `Preço atual R$ ${service.current_price?.toLocaleString('pt-BR')} com margem de ${service.margin_percentage?.toFixed(1)}%. Sugestão: R$ ${service.suggested_price?.toLocaleString('pt-BR')}`,
      potentialImpact: (service.suggested_price || 0) - (service.current_price || 0),
      recommendedAction: 'Ajustar preço na próxima renovação',
      createdAt: new Date().toISOString()
    });
  }

  // 3. Previsão de queda
  const forecasts = await generateFinancialForecast(1);
  const nextMonth = forecasts[0];
  if (nextMonth && nextMonth.expected < nextMonth.conservative * 1.1) {
    alerts.push({
      id: `forecast-warning`,
      type: 'revenue_forecast',
      severity: 'high',
      title: 'Previsão de queda de receita',
      description: `Próximo mês previsto: R$ ${nextMonth.expected.toLocaleString('pt-BR')} (cenário esperado)`,
      potentialImpact: nextMonth.expected - nextMonth.conservative,
      recommendedAction: 'Acelerar prospecção e upsells',
      createdAt: new Date().toISOString()
    });
  }

  return alerts.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

// =====================================================
// DASHBOARD CONSOLIDADO
// =====================================================

/**
 * Retorna dashboard completo do CFO
 */
export async function getCFODashboard(): Promise<CFODashboard> {
  // KPIs
  const { data: revenueData } = await supabase
    .from('client_profitability')
    .select('revenue, direct_costs, gross_margin, margin_percentage')
    .gte('period_month', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  const totalRevenue = revenueData?.reduce((sum, r) => sum + (r.revenue || 0), 0) || 0;
  const totalCosts = revenueData?.reduce((sum, r) => sum + (r.direct_costs || 0), 0) || 0;
  const grossMargin = totalRevenue - totalCosts;
  const averageMargin = revenueData?.length 
    ? revenueData.reduce((sum, r) => sum + (r.margin_percentage || 0), 0) / revenueData.length
    : 0;

  // Dados anteriores para crescimento
  const { data: previousData } = await supabase
    .from('client_profitability')
    .select('revenue')
    .gte('period_month', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString())
    .lt('period_month', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  const previousRevenue = previousData?.reduce((sum, r) => sum + (r.revenue || 0), 0) || totalRevenue;
  const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

  // Top e piores clientes
  const profitability = await analyzeClientProfitability();
  const topClients = [...profitability].sort((a, b) => b.margin_percentage - a.margin_percentage).slice(0, 5);
  const worstClients = [...profitability].sort((a, b) => a.margin_percentage - b.margin_percentage).slice(0, 5);

  // Alertas
  const alerts = await generateCFOAlerts();

  // Previsões
  const forecasts = await generateFinancialForecast(3);

  // Problemas de precificação
  const pricingHealth = await analyzePricingHealth();
  const pricingIssues = [...pricingHealth.critical, ...pricingHealth.needsAttention].map(s => ({
    service: s.service_name,
    currentPrice: s.current_price,
    recommendedPrice: s.suggested_price,
    minPrice: s.base_cost * 1.25,
    maxPrice: s.base_cost * 1.55,
    margin: s.margin_percentage,
    justification: s.ai_recommendation || 'Ajustar para margem saudável',
    marketComparison: s.current_price < (s.market_benchmark || 0) * 0.9 ? 'below' as const : 'average' as const
  }));

  return {
    kpis: {
      totalRevenue,
      totalCosts,
      grossMargin,
      averageMargin,
      mrr: totalRevenue, // Simplified
      revenueGrowth
    },
    alerts,
    topClients,
    worstClients,
    forecasts,
    pricingIssues
  };
}

// =====================================================
// CHAT COM CFO
// =====================================================

/**
 * Processa mensagem para o CFO IA
 */
export async function chatWithCFO(message: string, context?: Record<string, unknown>): Promise<string> {
  // Buscar dados relevantes
  const dashboard = await getCFODashboard();
  
  const contextData = `
DADOS ATUAIS DA EMPRESA:
- Receita mensal: R$ ${dashboard.kpis.totalRevenue.toLocaleString('pt-BR')}
- Margem média: ${dashboard.kpis.averageMargin.toFixed(1)}%
- Crescimento: ${dashboard.kpis.revenueGrowth.toFixed(1)}%
- Alertas ativos: ${dashboard.alerts.length}
- Clientes com margem crítica: ${dashboard.worstClients.filter(c => c.margin_percentage < 25).length}

TOP 3 CLIENTES (por margem):
${dashboard.topClients.slice(0, 3).map(c => `- ${c.client_name}: ${c.margin_percentage.toFixed(1)}% margem`).join('\n')}

CLIENTES EM RISCO:
${dashboard.worstClients.slice(0, 3).map(c => `- ${c.client_name}: ${c.margin_percentage.toFixed(1)}% margem`).join('\n')}

PREVISÃO PRÓXIMO MÊS:
- Otimista: R$ ${dashboard.forecasts[0]?.optimistic.toLocaleString('pt-BR')}
- Esperado: R$ ${dashboard.forecasts[0]?.expected.toLocaleString('pt-BR')}
- Conservador: R$ ${dashboard.forecasts[0]?.conservative.toLocaleString('pt-BR')}
`;

  try {
    const result = await generateWithAI({
      task: 'analysis',
      json: false,
      temperature: 0.7,
      maxTokens: 1000,
      entityType: 'cfo_chat',
      entityId: null,
      messages: [
        { role: 'system', content: CFO_SYSTEM_PROMPT },
        { role: 'system', content: contextData },
        { role: 'user', content: message }
      ],
    });

    return result.text || 'Desculpe, não consegui processar sua solicitação.';
  } catch (error) {
    console.error('Erro no chat CFO:', error);
    return 'Erro ao processar solicitação. Tente novamente.';
  }
}

export default {
  calculateServicePrice,
  analyzePricingHealth,
  analyzeClientProfitability,
  generateProfitabilityInsights,
  generateFinancialForecast,
  generateCFOAlerts,
  getCFODashboard,
  chatWithCFO
};

