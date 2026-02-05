/**
 * Valle 360 - CTO IA (Chief Technology Officer Virtual)
 * Capacidade produtiva, ferramentas, automações e decisões de contratação
 */

import { supabase } from '@/lib/supabase';
import { generateWithAI } from '@/lib/ai/aiRouter';

// =====================================================
// TIPOS
// =====================================================

export interface CapacityMetrics {
  department: string;
  totalAvailableHours: number;
  totalAllocatedHours: number;
  totalDeliveredHours: number;
  utilizationRate: number;
  efficiencyRate: number;
  bottleneckScore: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  collaborators: CollaboratorCapacity[];
}

export interface CollaboratorCapacity {
  id: string;
  name: string;
  department: string;
  availableHours: number;
  allocatedHours: number;
  utilizationRate: number;
  isOverloaded: boolean;
  currentTasks: number;
}

export interface CapacityForecast {
  department: string;
  currentUtilization: number;
  predictedUtilization: number;
  daysUntilOverload: number | null;
  willExceedCapacity: boolean;
  recommendation: string;
  confidenceLevel: number;
}

export interface ToolRecommendation {
  id: string;
  toolName: string;
  category: string;
  department: string;
  monthlyCost: number;
  timeSavingsHours: number;
  roiPercentage: number;
  paybackMonths: number;
  implementationEffort: 'low' | 'medium' | 'high';
  description: string;
  pros: string[];
  cons: string[];
  priority: 'low' | 'medium' | 'high';
}

export interface HiringDecision {
  department: string;
  positionTitle: string;
  decisionType: 'hire' | 'outsource' | 'automate' | 'redistribute';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  expectedCost: number;
  expectedRoiMonths: number;
  justification: string;
  alternativeOptions: string[];
}

export interface ProcessOptimization {
  process: string;
  department: string;
  currentTimeHours: number;
  potentialTimeHours: number;
  savingsPercentage: number;
  automationPossibility: 'none' | 'partial' | 'full';
  suggestion: string;
}

export interface CTODashboard {
  overview: {
    totalCapacity: number;
    totalUtilization: number;
    averageEfficiency: number;
    bottlenecks: number;
    toolsInUse: number;
    potentialSavings: number;
  };
  departmentMetrics: CapacityMetrics[];
  capacityForecasts: CapacityForecast[];
  toolRecommendations: ToolRecommendation[];
  hiringDecisions: HiringDecision[];
  processOptimizations: ProcessOptimization[];
  alerts: CTOAlert[];
}

export interface CTOAlert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  department?: string;
  recommendedAction: string;
  createdAt: string;
}

const CTO_SYSTEM_PROMPT = `Você é o CTO virtual da Valle 360, uma agência de marketing digital.
Seu papel é otimizar operações, gerenciar capacidade produtiva e recomendar ferramentas e automações.

Suas responsabilidades:
1. Monitorar capacidade produtiva por setor
2. Identificar gargalos e sobrecargas
3. Recomendar ferramentas de IA e automação
4. Analisar quando contratar vs automatizar vs terceirizar
5. Otimizar processos e fluxos de trabalho

Sempre forneça:
- Análise baseada em dados de utilização
- ROI claro para cada recomendação
- Alternativas viáveis
- Priorização clara

Seja técnico, analítico e focado em eficiência operacional.`;

// =====================================================
// FUNÇÕES DE CAPACIDADE
// =====================================================

/**
 * Calcula métricas de capacidade por departamento
 */
export async function getDepartmentCapacity(department?: string): Promise<CapacityMetrics[]> {
  // Buscar colaboradores e suas horas
  const { data: collaborators } = await supabase
    .from('user_profiles')
    .select('id, full_name, role')
    .in('role', ['social_media', 'designer', 'trafego', 'video_maker', 'web_designer', 'comercial', 'rh']);

  // Buscar tasks/horas alocadas (simulado com base em Kanban)
  const { data: tasks } = await supabase
    .from('kanban_tasks')
    .select('assigned_to, estimated_hours, status')
    .neq('status', 'done');

  const departments = ['social_media', 'designer', 'trafego', 'video_maker', 'web_designer'];
  const metrics: CapacityMetrics[] = [];

  for (const dept of departments) {
    if (department && dept !== department) continue;

    const deptCollaborators = collaborators?.filter(c => c.role === dept) || [];
    const deptTasks = tasks?.filter(t => 
      deptCollaborators.some(c => c.id === t.assigned_to)
    ) || [];

    const totalAvailable = deptCollaborators.length * 160; // 160h/mês por pessoa
    const totalAllocated = deptTasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
    const utilizationRate = totalAvailable > 0 ? (totalAllocated / totalAvailable) * 100 : 0;

    const collaboratorCapacity: CollaboratorCapacity[] = deptCollaborators.map(c => {
      const userTasks = deptTasks.filter(t => t.assigned_to === c.id);
      const allocated = userTasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
      const utilization = (allocated / 160) * 100;

      return {
        id: c.id,
        name: c.full_name || 'Colaborador',
        department: dept,
        availableHours: 160,
        allocatedHours: allocated,
        utilizationRate: utilization,
        isOverloaded: utilization > 90,
        currentTasks: userTasks.length
      };
    });

    const bottleneckScore = collaboratorCapacity.filter(c => c.isOverloaded).length / 
      (collaboratorCapacity.length || 1) * 100;

    metrics.push({
      department: dept,
      totalAvailableHours: totalAvailable,
      totalAllocatedHours: totalAllocated,
      totalDeliveredHours: 0, // Calculado separadamente
      utilizationRate,
      efficiencyRate: 85, // Simulado
      bottleneckScore,
      trend: utilizationRate > 80 ? 'increasing' : utilizationRate > 60 ? 'stable' : 'decreasing',
      collaborators: collaboratorCapacity
    });
  }

  return metrics;
}

/**
 * Prevê capacidade futura
 */
export async function forecastCapacity(weeks: number = 4): Promise<CapacityForecast[]> {
  const currentMetrics = await getDepartmentCapacity();
  const forecasts: CapacityForecast[] = [];

  for (const dept of currentMetrics) {
    // Tendência baseada em histórico (simulado)
    const weeklyGrowth = dept.trend === 'increasing' ? 5 : dept.trend === 'decreasing' ? -3 : 1;
    const predictedUtilization = Math.min(150, dept.utilizationRate + (weeklyGrowth * weeks));
    
    let daysUntilOverload: number | null = null;
    if (dept.utilizationRate < 100 && predictedUtilization >= 100) {
      daysUntilOverload = Math.ceil((100 - dept.utilizationRate) / (weeklyGrowth / 7));
    }

    let recommendation = '';
    if (predictedUtilization > 100) {
      recommendation = `Capacidade será excedida. Considere contratar ou redistribuir.`;
    } else if (predictedUtilization > 85) {
      recommendation = `Próximo do limite. Monitore de perto e prepare contingências.`;
    } else if (predictedUtilization < 50) {
      recommendation = `Subutilização. Considere redistribuir demandas ou prospectar mais.`;
    } else {
      recommendation = `Capacidade saudável. Mantenha o ritmo atual.`;
    }

    forecasts.push({
      department: dept.department,
      currentUtilization: dept.utilizationRate,
      predictedUtilization,
      daysUntilOverload,
      willExceedCapacity: predictedUtilization > 100,
      recommendation,
      confidenceLevel: 75
    });
  }

  return forecasts;
}

/**
 * Identifica colaboradores sobrecarregados
 */
export async function getOverloadedCollaborators(): Promise<CollaboratorCapacity[]> {
  const metrics = await getDepartmentCapacity();
  const overloaded: CollaboratorCapacity[] = [];

  for (const dept of metrics) {
    overloaded.push(...dept.collaborators.filter(c => c.isOverloaded));
  }

  return overloaded.sort((a, b) => b.utilizationRate - a.utilizationRate);
}

// =====================================================
// FUNÇÕES DE FERRAMENTAS E AUTOMAÇÃO
// =====================================================

/**
 * Busca recomendações de ferramentas
 */
export async function getToolRecommendations(department?: string): Promise<ToolRecommendation[]> {
  let query = supabase
    .from('tool_recommendations')
    .select('*')
    .eq('status', 'suggested')
    .order('estimated_roi_percentage', { ascending: false });

  if (department) {
    query = query.eq('department', department);
  }

  const { data } = await query;

  return (data || []).map(t => ({
    id: t.id,
    toolName: t.tool_name,
    category: t.tool_category,
    department: t.department,
    monthlyCost: t.monthly_cost || 0,
    timeSavingsHours: t.estimated_time_savings_hours || 0,
    roiPercentage: t.estimated_roi_percentage || 0,
    paybackMonths: t.payback_months || 0,
    implementationEffort: t.implementation_effort as 'low' | 'medium' | 'high',
    description: t.description || '',
    pros: t.pros || [],
    cons: t.cons || [],
    priority: t.estimated_roi_percentage > 200 ? 'high' : t.estimated_roi_percentage > 100 ? 'medium' : 'low'
  }));
}

/**
 * Analisa potencial de automação para um processo
 */
export async function analyzeAutomationPotential(processDescription: string): Promise<{
  automationScore: number;
  recommendations: string[];
  tools: string[];
  estimatedSavings: number;
}> {
  try {
    const ai = await generateWithAI({
      task: 'analysis',
      json: true,
      temperature: 0.7,
      maxTokens: 500,
      entityType: 'cto_automation',
      entityId: null,
      messages: [
        { role: 'system', content: CTO_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Analise o potencial de automação deste processo:
"${processDescription}"

Responda em JSON com:
- automationScore (0-100)
- recommendations (lista de 3 sugestões)
- tools (lista de ferramentas recomendadas)
- estimatedSavings (% de tempo que pode ser economizado)`
        }
      ],
    });

    const result = ai.json || {};
    return {
      automationScore: result.automationScore || 50,
      recommendations: result.recommendations || [],
      tools: result.tools || [],
      estimatedSavings: result.estimatedSavings || 20
    };
  } catch {
    return {
      automationScore: 50,
      recommendations: ['Avaliar manualmente'],
      tools: [],
      estimatedSavings: 0
    };
  }
}

// =====================================================
// FUNÇÕES DE CONTRATAÇÃO
// =====================================================

/**
 * Analisa necessidade de contratação
 */
export async function analyzeHiringNeed(department: string): Promise<HiringDecision | null> {
  const metrics = await getDepartmentCapacity(department);
  const deptMetrics = metrics[0];

  if (!deptMetrics) return null;

  const utilizationRate = deptMetrics.utilizationRate;
  const overloadedCount = deptMetrics.collaborators.filter(c => c.isOverloaded).length;

  // Não precisa contratar
  if (utilizationRate < 75 && overloadedCount === 0) {
    return null;
  }

  // Calcular opção de contratação
  const avgSalary = 5000; // Média do mercado
  const totalCost = avgSalary * 1.8; // Com encargos

  // Buscar ferramentas que poderiam resolver
  const tools = await getToolRecommendations(department);
  const bestTool = tools[0];

  // Decidir entre contratar, automatizar ou redistribuir
  let decision: HiringDecision;

  if (utilizationRate > 110 && overloadedCount >= 2) {
    // Precisa contratar urgentemente
    decision = {
      department,
      positionTitle: `${department.replace('_', ' ')} Jr/Pleno`,
      decisionType: 'hire',
      urgency: 'high',
      expectedCost: totalCost,
      expectedRoiMonths: 3,
      justification: `Utilização em ${utilizationRate.toFixed(0)}% com ${overloadedCount} colaboradores sobrecarregados. Contratação necessária para manter qualidade.`,
      alternativeOptions: bestTool 
        ? [`Implementar ${bestTool.toolName} para ganhar ${bestTool.timeSavingsHours}h/mês`]
        : []
    };
  } else if (bestTool && bestTool.timeSavingsHours >= 30) {
    // Automatizar pode resolver
    decision = {
      department,
      positionTitle: '',
      decisionType: 'automate',
      urgency: 'medium',
      expectedCost: bestTool.monthlyCost,
      expectedRoiMonths: bestTool.paybackMonths,
      justification: `${bestTool.toolName} pode economizar ${bestTool.timeSavingsHours}h/mês com ROI de ${bestTool.roiPercentage}%.`,
      alternativeOptions: ['Contratar freelancer', 'Redistribuir tarefas']
    };
  } else if (overloadedCount === 1) {
    // Redistribuir pode resolver
    const underutilized = deptMetrics.collaborators.filter(c => c.utilizationRate < 70);
    decision = {
      department,
      positionTitle: '',
      decisionType: 'redistribute',
      urgency: 'low',
      expectedCost: 0,
      expectedRoiMonths: 0,
      justification: `Redistribuir tarefas de colaboradores sobrecarregados para ${underutilized.length} com capacidade disponível.`,
      alternativeOptions: ['Contratar estagiário', 'Terceirizar demandas pontuais']
    };
  } else {
    // Terceirizar
    decision = {
      department,
      positionTitle: `Freelancer ${department}`,
      decisionType: 'outsource',
      urgency: 'medium',
      expectedCost: totalCost * 0.6, // Freelancer geralmente mais barato
      expectedRoiMonths: 1,
      justification: `Terceirização pontual pode aliviar a sobrecarga sem compromisso de longo prazo.`,
      alternativeOptions: ['Contratar CLT', 'Implementar ferramentas de automação']
    };
  }

  return decision;
}

// =====================================================
// ALERTAS DO CTO
// =====================================================

/**
 * Gera alertas do CTO
 */
export async function generateCTOAlerts(): Promise<CTOAlert[]> {
  const alerts: CTOAlert[] = [];
  const metrics = await getDepartmentCapacity();
  const forecasts = await forecastCapacity(2);

  // 1. Departamentos sobrecarregados
  for (const dept of metrics) {
    if (dept.utilizationRate > 95) {
      alerts.push({
        id: `overload-${dept.department}`,
        type: 'capacity_overload',
        severity: dept.utilizationRate > 110 ? 'critical' : 'high',
        title: `${dept.department} em sobrecarga`,
        description: `Utilização de ${dept.utilizationRate.toFixed(0)}% - acima do limite saudável de 85%`,
        department: dept.department,
        recommendedAction: 'Redistribuir tarefas ou considerar contratação',
        createdAt: new Date().toISOString()
      });
    }
  }

  // 2. Previsão de sobrecarga
  for (const forecast of forecasts) {
    if (forecast.daysUntilOverload && forecast.daysUntilOverload <= 30) {
      alerts.push({
        id: `forecast-${forecast.department}`,
        type: 'capacity_forecast',
        severity: forecast.daysUntilOverload <= 14 ? 'high' : 'medium',
        title: `${forecast.department} vai estourar em ${forecast.daysUntilOverload} dias`,
        description: forecast.recommendation,
        department: forecast.department,
        recommendedAction: 'Iniciar processo de contratação ou automação',
        createdAt: new Date().toISOString()
      });
    }
  }

  // 3. Colaboradores sobrecarregados
  const overloaded = await getOverloadedCollaborators();
  if (overloaded.length >= 3) {
    alerts.push({
      id: `multiple-overload`,
      type: 'team_burnout_risk',
      severity: 'high',
      title: `${overloaded.length} colaboradores sobrecarregados`,
      description: `Risco de burnout e queda de qualidade. Nomes: ${overloaded.slice(0, 3).map(c => c.name).join(', ')}`,
      recommendedAction: 'Ação imediata: redistribuir tarefas e avaliar contratação',
      createdAt: new Date().toISOString()
    });
  }

  // 4. Ferramentas com alto ROI não implementadas
  const tools = await getToolRecommendations();
  const highRoiTools = tools.filter(t => t.roiPercentage > 200 && t.priority === 'high');
  if (highRoiTools.length > 0) {
    alerts.push({
      id: `tools-roi`,
      type: 'automation_opportunity',
      severity: 'medium',
      title: `${highRoiTools.length} ferramentas com alto ROI disponíveis`,
      description: `Potencial economia: ${highRoiTools.reduce((sum, t) => sum + t.timeSavingsHours, 0)}h/mês`,
      recommendedAction: `Avaliar: ${highRoiTools.map(t => t.toolName).join(', ')}`,
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
 * Retorna dashboard completo do CTO
 */
export async function getCTODashboard(): Promise<CTODashboard> {
  const departmentMetrics = await getDepartmentCapacity();
  const capacityForecasts = await forecastCapacity(4);
  const toolRecommendations = await getToolRecommendations();
  const alerts = await generateCTOAlerts();

  // Calcular overview
  const totalCapacity = departmentMetrics.reduce((sum, d) => sum + d.totalAvailableHours, 0);
  const totalAllocated = departmentMetrics.reduce((sum, d) => sum + d.totalAllocatedHours, 0);
  const totalUtilization = totalCapacity > 0 ? (totalAllocated / totalCapacity) * 100 : 0;
  const averageEfficiency = departmentMetrics.reduce((sum, d) => sum + d.efficiencyRate, 0) / 
    (departmentMetrics.length || 1);
  const bottlenecks = departmentMetrics.filter(d => d.bottleneckScore > 30).length;
  const potentialSavings = toolRecommendations.reduce((sum, t) => sum + t.timeSavingsHours, 0);

  // Analisar necessidades de contratação
  const hiringDecisions: HiringDecision[] = [];
  for (const dept of departmentMetrics) {
    const decision = await analyzeHiringNeed(dept.department);
    if (decision) hiringDecisions.push(decision);
  }

  // Otimizações de processo (simulado)
  const processOptimizations: ProcessOptimization[] = [
    {
      process: 'Criação de relatórios de performance',
      department: 'trafego',
      currentTimeHours: 8,
      potentialTimeHours: 2,
      savingsPercentage: 75,
      automationPossibility: 'full',
      suggestion: 'Usar Supermetrics + templates automáticos'
    },
    {
      process: 'Aprovação de artes com cliente',
      department: 'designer',
      currentTimeHours: 5,
      potentialTimeHours: 1,
      savingsPercentage: 80,
      automationPossibility: 'partial',
      suggestion: 'Implementar workflow de aprovação no sistema'
    },
    {
      process: 'Publicação de posts em redes',
      department: 'social_media',
      currentTimeHours: 4,
      potentialTimeHours: 0.5,
      savingsPercentage: 87,
      automationPossibility: 'full',
      suggestion: 'Agendamento automático via API'
    }
  ];

  return {
    overview: {
      totalCapacity,
      totalUtilization,
      averageEfficiency,
      bottlenecks,
      toolsInUse: 5, // Simulado
      potentialSavings
    },
    departmentMetrics,
    capacityForecasts,
    toolRecommendations,
    hiringDecisions,
    processOptimizations,
    alerts
  };
}

// =====================================================
// CHAT COM CTO
// =====================================================

/**
 * Processa mensagem para o CTO IA
 */
export async function chatWithCTO(message: string, context?: Record<string, unknown>): Promise<string> {
  const dashboard = await getCTODashboard();

  const contextData = `
DADOS ATUAIS DE CAPACIDADE:
- Capacidade total: ${dashboard.overview.totalCapacity}h/mês
- Utilização geral: ${dashboard.overview.totalUtilization.toFixed(1)}%
- Eficiência média: ${dashboard.overview.averageEfficiency.toFixed(1)}%
- Gargalos identificados: ${dashboard.overview.bottlenecks} setores
- Potencial de economia: ${dashboard.overview.potentialSavings}h/mês

POR DEPARTAMENTO:
${dashboard.departmentMetrics.map(d => 
  `- ${d.department}: ${d.utilizationRate.toFixed(1)}% utilização (${d.collaborators.length} pessoas)`
).join('\n')}

ALERTAS ATIVOS:
${dashboard.alerts.slice(0, 3).map(a => `- [${a.severity.toUpperCase()}] ${a.title}`).join('\n')}

PREVISÕES:
${dashboard.capacityForecasts.filter(f => f.willExceedCapacity).map(f => 
  `- ${f.department}: vai exceder capacidade em ${f.daysUntilOverload} dias`
).join('\n') || 'Nenhuma sobrecarga prevista'}

FERRAMENTAS RECOMENDADAS:
${dashboard.toolRecommendations.slice(0, 3).map(t => 
  `- ${t.toolName}: economia de ${t.timeSavingsHours}h/mês, ROI ${t.roiPercentage}%`
).join('\n')}
`;

  try {
    const ai = await generateWithAI({
      task: 'analysis',
      json: false,
      temperature: 0.7,
      maxTokens: 1000,
      entityType: 'cto_chat',
      entityId: null,
      messages: [
        { role: 'system', content: CTO_SYSTEM_PROMPT },
        { role: 'system', content: contextData },
        { role: 'user', content: message }
      ],
    });

    return ai.text || 'Desculpe, não consegui processar sua solicitação.';
  } catch (error) {
    console.error('Erro no chat CTO:', error);
    return 'Erro ao processar solicitação. Tente novamente.';
  }
}

export default {
  getDepartmentCapacity,
  forecastCapacity,
  getOverloadedCollaborators,
  getToolRecommendations,
  analyzeAutomationPotential,
  analyzeHiringNeed,
  generateCTOAlerts,
  getCTODashboard,
  chatWithCTO
};

