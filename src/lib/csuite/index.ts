/**
 * Valle 360 - C-Suite Virtual
 * Diretoria Virtual com IAs especializadas
 */

export * from './cfo-ai';
export * from './cto-ai';
export * from './cmo-ai';
export * from './chro-ai';

import { getCFODashboard, chatWithCFO, CFODashboard, CFOAlert } from './cfo-ai';
import { getCTODashboard, chatWithCTO, CTODashboard, CTOAlert } from './cto-ai';
import { getCMODashboard, chatWithCMO, CMODashboard, CMOAlert } from './cmo-ai';
import { getCHRODashboard, chatWithCHRO, CHRODashboard, CHROAlert } from './chro-ai';
import { generateWithAI } from '@/lib/ai/aiRouter';

// =====================================================
// TIPOS CONSOLIDADOS
// =====================================================

export type ExecutiveType = 'cfo' | 'cto' | 'cmo' | 'chro' | 'all';

export interface CSuiteAlert {
  id: string;
  executive: ExecutiveType;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendedAction: string;
  createdAt: string;
}

export interface CSuiteDashboard {
  cfo: CFODashboard | null;
  cto: CTODashboard | null;
  cmo: CMODashboard | null;
  chro: CHRODashboard | null;
  consolidatedAlerts: CSuiteAlert[];
  healthScore: number;
  summary: string;
}

export interface CSuiteInsight {
  executive: ExecutiveType;
  insight: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  actionable: boolean;
}

const CSUITE_SYSTEM_PROMPT = `Você é a Diretoria Virtual da Valle 360, combinando as perspectivas de CFO, CTO, CMO e CHRO.
Quando responder, considere todas as áreas de forma integrada e estratégica.

Você pode responder como:
- A Diretoria completa (visão 360°)
- Um executivo específico quando a pergunta for de uma área

Sempre forneça respostas equilibradas que considerem finanças, operações, clientes e pessoas.`;

// =====================================================
// FUNÇÕES CONSOLIDADAS
// =====================================================

/**
 * Retorna dashboard consolidado de toda a diretoria
 */
export async function getCSuiteDashboard(): Promise<CSuiteDashboard> {
  // Buscar todos os dashboards em paralelo
  const [cfo, cto, cmo, chro] = await Promise.all([
    getCFODashboard().catch(() => null),
    getCTODashboard().catch(() => null),
    getCMODashboard().catch(() => null),
    getCHRODashboard().catch(() => null)
  ]);

  // Consolidar alertas
  const consolidatedAlerts: CSuiteAlert[] = [];

  if (cfo?.alerts) {
    consolidatedAlerts.push(...cfo.alerts.map(a => ({
      ...a,
      executive: 'cfo' as ExecutiveType
    })));
  }
  if (cto?.alerts) {
    consolidatedAlerts.push(...cto.alerts.map(a => ({
      ...a,
      executive: 'cto' as ExecutiveType
    })));
  }
  if (cmo?.alerts) {
    consolidatedAlerts.push(...cmo.alerts.map(a => ({
      ...a,
      executive: 'cmo' as ExecutiveType
    })));
  }
  if (chro?.alerts) {
    consolidatedAlerts.push(...chro.alerts.map(a => ({
      ...a,
      executive: 'chro' as ExecutiveType
    })));
  }

  // Ordenar por severidade
  consolidatedAlerts.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  // Calcular score de saúde geral
  let healthScore = 100;
  const criticalAlerts = consolidatedAlerts.filter(a => a.severity === 'critical').length;
  const highAlerts = consolidatedAlerts.filter(a => a.severity === 'high').length;
  healthScore -= criticalAlerts * 15;
  healthScore -= highAlerts * 5;
  healthScore = Math.max(0, healthScore);

  // Gerar resumo
  const summary = await generateExecutiveSummary({
    cfo,
    cto,
    cmo,
    chro,
    alertsCount: consolidatedAlerts.length,
    criticalCount: criticalAlerts
  });

  return {
    cfo,
    cto,
    cmo,
    chro,
    consolidatedAlerts: consolidatedAlerts.slice(0, 10),
    healthScore,
    summary
  };
}

/**
 * Gera resumo executivo com IA
 */
async function generateExecutiveSummary(data: {
  cfo: CFODashboard | null;
  cto: CTODashboard | null;
  cmo: CMODashboard | null;
  chro: CHRODashboard | null;
  alertsCount: number;
  criticalCount: number;
}): Promise<string> {
  try {
    const context = `
CFO: ${data.cfo ? `Receita R$${data.cfo.kpis.totalRevenue.toLocaleString('pt-BR')}, Margem ${data.cfo.kpis.averageMargin.toFixed(1)}%` : 'Sem dados'}
CTO: ${data.cto ? `Utilização ${data.cto.overview.totalUtilization.toFixed(1)}%, ${data.cto.overview.bottlenecks} gargalos` : 'Sem dados'}
CMO: ${data.cmo ? `${data.cmo.kpis.activeClients} clientes ativos, Churn ${data.cmo.kpis.churnRate.toFixed(1)}%` : 'Sem dados'}
CHRO: ${data.chro ? `Performance ${data.chro.kpis.averagePerformance}%, Risco turnover ${data.chro.kpis.turnoverRate.toFixed(1)}%` : 'Sem dados'}
Alertas: ${data.alertsCount} total, ${data.criticalCount} críticos
`;

    const result = await generateWithAI({
      task: 'strategy',
      json: false,
      temperature: 0.7,
      maxTokens: 200,
      entityType: 'csuite_summary',
      entityId: null,
      messages: [
        { role: 'system', content: 'Você gera resumos executivos concisos (2-3 frases) para diretoria.' },
        { role: 'user', content: `Gere um resumo executivo da situação atual da empresa:\n${context}` }
      ],
    });

    return result.text || 'Situação geral estável. Monitorando indicadores.';
  } catch {
    return 'Dashboard da diretoria carregado. Verifique os alertas críticos.';
  }
}

/**
 * Chat unificado com a Diretoria Virtual
 */
export async function chatWithCSuite(
  message: string,
  executive: ExecutiveType = 'all',
  context?: Record<string, unknown>
): Promise<{
  response: string;
  executive: ExecutiveType;
  insights: CSuiteInsight[];
}> {
  // Se for um executivo específico
  if (executive !== 'all') {
    let response = '';
    
    switch (executive) {
      case 'cfo':
        response = await chatWithCFO(message, context);
        break;
      case 'cto':
        response = await chatWithCTO(message, context);
        break;
      case 'cmo':
        response = await chatWithCMO(message, context);
        break;
      case 'chro':
        response = await chatWithCHRO(message, context);
        break;
    }

    return {
      response,
      executive,
      insights: []
    };
  }

  // Chat com toda a diretoria
  const dashboard = await getCSuiteDashboard();

  const contextData = `
RESUMO DA EMPRESA:
${dashboard.summary}

SAÚDE GERAL: ${dashboard.healthScore}%

ALERTAS CRÍTICOS:
${dashboard.consolidatedAlerts.filter(a => a.severity === 'critical').map(a => 
  `[${a.executive.toUpperCase()}] ${a.title}`
).join('\n') || 'Nenhum alerta crítico'}

MÉTRICAS PRINCIPAIS:
- Financeiro: ${dashboard.cfo ? `Receita R$${dashboard.cfo.kpis.totalRevenue.toLocaleString('pt-BR')}, Margem ${dashboard.cfo.kpis.averageMargin.toFixed(1)}%` : 'N/A'}
- Operações: ${dashboard.cto ? `Utilização ${dashboard.cto.overview.totalUtilization.toFixed(1)}%` : 'N/A'}
- Clientes: ${dashboard.cmo ? `${dashboard.cmo.kpis.activeClients} ativos, Churn ${dashboard.cmo.kpis.churnRate.toFixed(1)}%` : 'N/A'}
- Pessoas: ${dashboard.chro ? `Performance ${dashboard.chro.kpis.averagePerformance}%, Engajamento ${dashboard.chro.kpis.averageEngagement}%` : 'N/A'}
`;

  try {
    const result = await generateWithAI({
      task: 'strategy',
      json: false,
      temperature: 0.7,
      maxTokens: 1500,
      entityType: 'csuite_chat',
      entityId: null,
      messages: [
        { role: 'system', content: CSUITE_SYSTEM_PROMPT },
        { role: 'system', content: contextData },
        { role: 'user', content: message }
      ],
    });

    // Extrair insights relacionados
    const insights: CSuiteInsight[] = dashboard.consolidatedAlerts
      .slice(0, 3)
      .map(a => ({
        executive: a.executive,
        insight: a.title,
        priority: a.severity === 'critical' ? 'high' : a.severity === 'high' ? 'medium' : 'low',
        category: a.type,
        actionable: true
      }));

    return {
      response: result.text || 'Erro ao processar.',
      executive: 'all',
      insights
    };
  } catch (error) {
    console.error('Erro no chat C-Suite:', error);
    return {
      response: 'Erro ao processar solicitação. Tente novamente.',
      executive: 'all',
      insights: []
    };
  }
}

/**
 * Gera relatório executivo consolidado
 */
export async function generateExecutiveReport(): Promise<{
  title: string;
  date: string;
  sections: {
    title: string;
    executive: ExecutiveType;
    summary: string;
    kpis: { label: string; value: string; trend?: 'up' | 'down' | 'stable' }[];
    alerts: string[];
    recommendations: string[];
  }[];
  overallHealth: number;
  topPriorities: string[];
}> {
  const dashboard = await getCSuiteDashboard();

  const sections = [];

  // CFO Section
  if (dashboard.cfo) {
    sections.push({
      title: 'Análise Financeira',
      executive: 'cfo' as ExecutiveType,
      summary: `Receita mensal de R$ ${dashboard.cfo.kpis.totalRevenue.toLocaleString('pt-BR')} com margem média de ${dashboard.cfo.kpis.averageMargin.toFixed(1)}%.`,
      kpis: [
        { label: 'Receita', value: `R$ ${dashboard.cfo.kpis.totalRevenue.toLocaleString('pt-BR')}`, trend: (dashboard.cfo.kpis.revenueGrowth > 0 ? 'up' : 'down') as 'up' | 'down' },
        { label: 'Margem Bruta', value: `${dashboard.cfo.kpis.averageMargin.toFixed(1)}%` },
        { label: 'Crescimento', value: `${dashboard.cfo.kpis.revenueGrowth.toFixed(1)}%`, trend: (dashboard.cfo.kpis.revenueGrowth > 0 ? 'up' : 'down') as 'up' | 'down' }
      ],
      alerts: dashboard.cfo.alerts.slice(0, 2).map(a => a.title),
      recommendations: dashboard.cfo.pricingIssues.slice(0, 2).map(p => `Ajustar preço de ${p.service}`)
    });
  }

  // CTO Section
  if (dashboard.cto) {
    sections.push({
      title: 'Análise Operacional',
      executive: 'cto' as ExecutiveType,
      summary: `Utilização de capacidade em ${dashboard.cto.overview.totalUtilization.toFixed(1)}% com ${dashboard.cto.overview.bottlenecks} gargalos identificados.`,
      kpis: [
        { label: 'Utilização', value: `${dashboard.cto.overview.totalUtilization.toFixed(1)}%`, trend: (dashboard.cto.overview.totalUtilization > 85 ? 'up' : 'stable') as 'up' | 'stable' },
        { label: 'Eficiência', value: `${dashboard.cto.overview.averageEfficiency.toFixed(1)}%` },
        { label: 'Economia Potencial', value: `${dashboard.cto.overview.potentialSavings}h/mês` }
      ],
      alerts: dashboard.cto.alerts.slice(0, 2).map(a => a.title),
      recommendations: dashboard.cto.toolRecommendations.slice(0, 2).map(t => `Implementar ${t.toolName}`)
    });
  }

  // CMO Section
  if (dashboard.cmo) {
    sections.push({
      title: 'Análise de Clientes',
      executive: 'cmo' as ExecutiveType,
      summary: `${dashboard.cmo.kpis.activeClients} clientes ativos com taxa de churn de ${dashboard.cmo.kpis.churnRate.toFixed(1)}%.`,
      kpis: [
        { label: 'Clientes Ativos', value: `${dashboard.cmo.kpis.activeClients}` },
        { label: 'Taxa de Churn', value: `${dashboard.cmo.kpis.churnRate.toFixed(1)}%`, trend: (dashboard.cmo.kpis.churnRate > 10 ? 'down' : 'stable') as 'down' | 'stable' },
        { label: 'Pipeline Upsell', value: `R$ ${dashboard.cmo.kpis.upsellPipeline.toLocaleString('pt-BR')}` }
      ],
      alerts: dashboard.cmo.alerts.slice(0, 2).map(a => a.title),
      recommendations: dashboard.cmo.upsellOpportunities.slice(0, 2).map(u => `Upsell ${u.suggestedService} para ${u.clientName}`)
    });
  }

  // CHRO Section
  if (dashboard.chro) {
    sections.push({
      title: 'Análise de Pessoas',
      executive: 'chro' as ExecutiveType,
      summary: `${dashboard.chro.kpis.totalEmployees} colaboradores com performance média de ${dashboard.chro.kpis.averagePerformance}%.`,
      kpis: [
        { label: 'Performance', value: `${dashboard.chro.kpis.averagePerformance}%` },
        { label: 'Engajamento', value: `${dashboard.chro.kpis.averageEngagement}%` },
        { label: 'Risco Turnover', value: `${dashboard.chro.kpis.turnoverRate.toFixed(1)}%`, trend: (dashboard.chro.kpis.turnoverRate > 15 ? 'down' : 'stable') as 'down' | 'stable' }
      ],
      alerts: dashboard.chro.alerts.slice(0, 2).map(a => a.title),
      recommendations: dashboard.chro.turnoverPredictions.slice(0, 2).map(t => `Ação preventiva para ${t.name}`)
    });
  }

  // Top priorities
  const topPriorities = dashboard.consolidatedAlerts
    .filter(a => a.severity === 'critical' || a.severity === 'high')
    .slice(0, 5)
    .map(a => `[${a.executive.toUpperCase()}] ${a.title}`);

  return {
    title: 'Relatório Executivo Valle 360',
    date: new Date().toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    sections,
    overallHealth: dashboard.healthScore,
    topPriorities
  };
}

export default {
  getCSuiteDashboard,
  chatWithCSuite,
  generateExecutiveReport
};

