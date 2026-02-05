/**
 * Valle 360 - CHRO IA (Chief Human Resources Officer Virtual)
 * Análise de pessoas, desenvolvimento, turnover e cultura
 */

import { supabase } from '@/lib/supabase';
import { generateWithAI } from '@/lib/ai/aiRouter';

// =====================================================
// TIPOS
// =====================================================

export interface EmployeeAnalytics {
  userId: string;
  name: string;
  role: string;
  department: string;
  performanceScore: number;
  engagementScore: number;
  satisfactionScore: number;
  culturalFitScore: number;
  growthPotential: 'low' | 'medium' | 'high' | 'exceptional';
  turnoverRisk: number;
  burnoutRisk: number;
  promotionReadiness: number;
  salaryCompetitiveness: number;
  insights: string[];
  trend: 'improving' | 'stable' | 'declining';
}

export interface TurnoverPrediction {
  userId: string;
  name: string;
  department: string;
  probability: number;
  predictedDate: string | null;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: TurnoverFactor[];
  preventiveActions: string[];
  estimatedReplacementCost: number;
}

export interface TurnoverFactor {
  factor: string;
  weight: number;
  description: string;
  isMitigatable: boolean;
}

export interface CareerPlan {
  userId: string;
  employeeName: string;
  currentPosition: string;
  targetPosition: string;
  timelineMonths: number;
  currentProgress: number;
  requiredSkills: Skill[];
  milestones: Milestone[];
  recommendedTrainings: Training[];
  mentorName: string | null;
  status: 'active' | 'completed' | 'paused';
}

export interface Skill {
  name: string;
  currentLevel: number;
  requiredLevel: number;
  gap: number;
}

export interface Milestone {
  title: string;
  description: string;
  targetDate: string;
  completed: boolean;
}

export interface Training {
  name: string;
  type: 'course' | 'workshop' | 'mentoring' | 'project' | 'certification';
  duration: string;
  priority: 'low' | 'medium' | 'high';
  cost: number;
  expectedImpact: string;
}

export interface SalaryRecommendation {
  userId: string;
  employeeName: string;
  currentSalary: number;
  marketAverage: number;
  recommendedSalary: number;
  adjustmentPercentage: number;
  justification: string;
  performanceFactor: number;
  tenureFactor: number;
  urgency: 'low' | 'medium' | 'high';
}

export interface HiringRecommendation {
  department: string;
  position: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  idealProfile: {
    skills: string[];
    experience: string;
    behavioralTraits: string[];
    culturalFit: string[];
  };
  salaryRange: { min: number; max: number };
  recruitingChannels: string[];
  interviewFocus: string[];
  onboardingPlan: string[];
}

export interface TeamHealth {
  department: string;
  overallScore: number;
  engagementLevel: number;
  collaborationScore: number;
  leadershipScore: number;
  workloadBalance: number;
  developmentOpportunities: number;
  issues: string[];
  strengths: string[];
}

export interface CHRODashboard {
  kpis: {
    totalEmployees: number;
    averagePerformance: number;
    averageEngagement: number;
    turnoverRate: number;
    openPositions: number;
    averageTenure: number;
    trainingHoursPerEmployee: number;
  };
  employeeAnalytics: EmployeeAnalytics[];
  turnoverPredictions: TurnoverPrediction[];
  careerPlans: CareerPlan[];
  salaryRecommendations: SalaryRecommendation[];
  teamHealth: TeamHealth[];
  alerts: CHROAlert[];
}

export interface CHROAlert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  employeeId?: string;
  department?: string;
  recommendedAction: string;
  createdAt: string;
}

const CHRO_SYSTEM_PROMPT = `Você é o CHRO virtual da Valle 360, uma agência de marketing digital.
Seu papel é desenvolver pessoas, prever turnover e fortalecer a cultura organizacional.

Suas responsabilidades:
1. Análise de performance e potencial de colaboradores
2. Predição e prevenção de turnover
3. Planos de carreira e desenvolvimento
4. Recomendações salariais justas
5. Saúde das equipes e cultura

Sempre forneça:
- Análises empáticas mas objetivas
- Planos de ação específicos
- Consideração pelo bem-estar individual e coletivo
- Alinhamento com objetivos do negócio

Seja humano, estratégico e focado no desenvolvimento das pessoas.`;

// =====================================================
// FUNÇÕES DE ANÁLISE DE COLABORADORES
// =====================================================

/**
 * Analisa todos os colaboradores
 */
export async function analyzeEmployees(): Promise<EmployeeAnalytics[]> {
  const { data: employees } = await supabase
    .from('user_profiles')
    .select('id, full_name, role, created_at')
    .in('role', ['social_media', 'designer', 'trafego', 'video_maker', 'web_designer', 'comercial', 'rh', 'financeiro']);

  if (!employees?.length) return getSimulatedEmployeeAnalytics();

  const analytics: EmployeeAnalytics[] = [];

  for (const emp of employees) {
    // Buscar dados de performance (simulado)
    const performanceScore = Math.floor(Math.random() * 30) + 70; // 70-100
    const engagementScore = Math.floor(Math.random() * 25) + 75; // 75-100
    const satisfactionScore = Math.floor(Math.random() * 30) + 70; // 70-100

    // Calcular fatores de risco
    const tenureMonths = Math.floor(
      (Date.now() - new Date(emp.created_at).getTime()) / (30 * 24 * 60 * 60 * 1000)
    );
    
    let turnoverRisk = 20;
    if (tenureMonths < 6) turnoverRisk += 15; // Novato
    if (satisfactionScore < 75) turnoverRisk += 20;
    if (engagementScore < 80) turnoverRisk += 15;

    const burnoutRisk = 100 - ((satisfactionScore + engagementScore) / 2);

    // Determinar potencial
    let growthPotential: 'low' | 'medium' | 'high' | 'exceptional' = 'medium';
    if (performanceScore >= 90 && engagementScore >= 90) growthPotential = 'exceptional';
    else if (performanceScore >= 85) growthPotential = 'high';
    else if (performanceScore < 75) growthPotential = 'low';

    // Gerar insights
    const insights = await generateEmployeeInsights({
      name: emp.full_name || 'Colaborador',
      performance: performanceScore,
      engagement: engagementScore,
      satisfaction: satisfactionScore,
      tenure: tenureMonths
    });

    analytics.push({
      userId: emp.id,
      name: emp.full_name || 'Colaborador',
      role: emp.role,
      department: getDepartmentFromRole(emp.role),
      performanceScore,
      engagementScore,
      satisfactionScore,
      culturalFitScore: Math.floor(Math.random() * 20) + 80,
      growthPotential,
      turnoverRisk: Math.min(100, turnoverRisk),
      burnoutRisk: Math.min(100, burnoutRisk),
      promotionReadiness: performanceScore >= 85 && tenureMonths >= 12 ? 80 : 40,
      salaryCompetitiveness: Math.floor(Math.random() * 30) + 70,
      insights,
      trend: performanceScore > 85 ? 'improving' : performanceScore > 75 ? 'stable' : 'declining'
    });
  }

  return analytics;
}

function getDepartmentFromRole(role: string): string {
  const mapping: Record<string, string> = {
    social_media: 'Social Media',
    designer: 'Design',
    trafego: 'Tráfego',
    video_maker: 'Vídeo',
    web_designer: 'Web',
    comercial: 'Comercial',
    rh: 'RH',
    financeiro: 'Financeiro'
  };
  return mapping[role] || role;
}

async function generateEmployeeInsights(data: {
  name: string;
  performance: number;
  engagement: number;
  satisfaction: number;
  tenure: number;
}): Promise<string[]> {
  const insights: string[] = [];

  if (data.performance >= 90) {
    insights.push('Alto performer - considerar para promoção ou projetos especiais');
  }
  if (data.engagement < 75) {
    insights.push('Engajamento baixo - agendar 1:1 para entender motivações');
  }
  if (data.satisfaction < 70) {
    insights.push('Satisfação em queda - identificar causas e agir preventivamente');
  }
  if (data.tenure < 3) {
    insights.push('Período de adaptação - reforçar onboarding e acompanhamento');
  }
  if (data.tenure >= 24 && data.performance >= 85) {
    insights.push('Colaborador sênior e dedicado - avaliar reconhecimento especial');
  }

  if (insights.length === 0) {
    insights.push('Performance estável - manter acompanhamento regular');
  }

  return insights;
}

function getSimulatedEmployeeAnalytics(): EmployeeAnalytics[] {
  return [
    {
      userId: 'emp-1',
      name: 'Maria Silva',
      role: 'social_media',
      department: 'Social Media',
      performanceScore: 92,
      engagementScore: 88,
      satisfactionScore: 85,
      culturalFitScore: 95,
      growthPotential: 'exceptional',
      turnoverRisk: 15,
      burnoutRisk: 25,
      promotionReadiness: 85,
      salaryCompetitiveness: 82,
      insights: ['Alto performer', 'Pronta para liderar equipe', 'Excelente fit cultural'],
      trend: 'improving'
    },
    {
      userId: 'emp-2',
      name: 'João Santos',
      role: 'designer',
      department: 'Design',
      performanceScore: 78,
      engagementScore: 65,
      satisfactionScore: 62,
      culturalFitScore: 75,
      growthPotential: 'medium',
      turnoverRisk: 55,
      burnoutRisk: 48,
      promotionReadiness: 35,
      salaryCompetitiveness: 68,
      insights: ['Engajamento baixo - necessita atenção', 'Possível sobrecarga', 'Revisar salário'],
      trend: 'declining'
    },
    {
      userId: 'emp-3',
      name: 'Ana Oliveira',
      role: 'trafego',
      department: 'Tráfego',
      performanceScore: 88,
      engagementScore: 92,
      satisfactionScore: 90,
      culturalFitScore: 88,
      growthPotential: 'high',
      turnoverRisk: 12,
      burnoutRisk: 15,
      promotionReadiness: 70,
      salaryCompetitiveness: 90,
      insights: ['Excelente equilíbrio', 'Candidata a mentora', 'Manter reconhecimento'],
      trend: 'improving'
    }
  ];
}

// =====================================================
// FUNÇÕES DE TURNOVER
// =====================================================

/**
 * Prediz risco de turnover
 */
export async function predictTurnover(): Promise<TurnoverPrediction[]> {
  const analytics = await analyzeEmployees();
  const predictions: TurnoverPrediction[] = [];

  for (const emp of analytics.filter(e => e.turnoverRisk >= 35)) {
    const factors: TurnoverFactor[] = [];

    // Identificar fatores
    if (emp.satisfactionScore < 70) {
      factors.push({
        factor: 'Satisfação baixa',
        weight: 30,
        description: `Score de ${emp.satisfactionScore}% abaixo do ideal`,
        isMitigatable: true
      });
    }
    if (emp.engagementScore < 75) {
      factors.push({
        factor: 'Engajamento baixo',
        weight: 25,
        description: 'Possível desconexão com objetivos',
        isMitigatable: true
      });
    }
    if (emp.salaryCompetitiveness < 75) {
      factors.push({
        factor: 'Salário abaixo do mercado',
        weight: 25,
        description: 'Risco de proposta externa',
        isMitigatable: true
      });
    }
    if (emp.burnoutRisk > 50) {
      factors.push({
        factor: 'Risco de burnout',
        weight: 20,
        description: 'Sobrecarga identificada',
        isMitigatable: true
      });
    }

    const riskLevel = emp.turnoverRisk >= 70 ? 'critical' : 
                      emp.turnoverRisk >= 50 ? 'high' : 
                      emp.turnoverRisk >= 35 ? 'medium' : 'low';

    // Gerar ações preventivas
    const preventiveActions = await generatePreventiveActions(emp, factors);

    // Estimar custo de substituição (6 meses de salário + treinamento)
    const estimatedReplacementCost = 5000 * 6 * 1.5; // Simplificado

    predictions.push({
      userId: emp.userId,
      name: emp.name,
      department: emp.department,
      probability: emp.turnoverRisk,
      predictedDate: riskLevel === 'critical' 
        ? new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString() 
        : null,
      riskLevel,
      factors,
      preventiveActions,
      estimatedReplacementCost
    });
  }

  return predictions.sort((a, b) => b.probability - a.probability);
}

async function generatePreventiveActions(
  employee: EmployeeAnalytics,
  factors: TurnoverFactor[]
): Promise<string[]> {
  const actions: string[] = [];

  for (const factor of factors) {
    switch (factor.factor) {
      case 'Satisfação baixa':
        actions.push('Agendar conversa individual para entender insatisfações');
        actions.push('Avaliar mudança de projetos ou equipe');
        break;
      case 'Engajamento baixo':
        actions.push('Envolver em projeto desafiador');
        actions.push('Reconhecer publicamente contribuições recentes');
        break;
      case 'Salário abaixo do mercado':
        actions.push('Avaliar reajuste salarial');
        actions.push('Considerar benefícios alternativos');
        break;
      case 'Risco de burnout':
        actions.push('Redistribuir tarefas imediatamente');
        actions.push('Oferecer dia de folga ou flexibilidade');
        break;
    }
  }

  return [...new Set(actions)].slice(0, 5);
}

// =====================================================
// FUNÇÕES DE CARREIRA
// =====================================================

/**
 * Gera plano de carreira para colaborador
 */
export async function generateCareerPlan(
  userId: string,
  targetPosition: string
): Promise<CareerPlan | null> {
  const analytics = await analyzeEmployees();
  const employee = analytics.find(e => e.userId === userId);

  if (!employee) return null;

  // Definir skills necessários
  const skillsMapping: Record<string, Skill[]> = {
    'Líder de Social Media': [
      { name: 'Gestão de equipe', currentLevel: 60, requiredLevel: 90, gap: 30 },
      { name: 'Estratégia de conteúdo', currentLevel: 80, requiredLevel: 95, gap: 15 },
      { name: 'Análise de métricas', currentLevel: 75, requiredLevel: 90, gap: 15 },
      { name: 'Comunicação com cliente', currentLevel: 70, requiredLevel: 90, gap: 20 }
    ],
    'Head de Design': [
      { name: 'Liderança criativa', currentLevel: 65, requiredLevel: 95, gap: 30 },
      { name: 'Design systems', currentLevel: 70, requiredLevel: 90, gap: 20 },
      { name: 'Gestão de projetos', currentLevel: 60, requiredLevel: 85, gap: 25 },
      { name: 'Mentoria', currentLevel: 50, requiredLevel: 85, gap: 35 }
    ],
    'Gerente de Tráfego': [
      { name: 'Estratégia multicanal', currentLevel: 75, requiredLevel: 95, gap: 20 },
      { name: 'Otimização de budget', currentLevel: 80, requiredLevel: 95, gap: 15 },
      { name: 'Gestão de equipe', currentLevel: 55, requiredLevel: 85, gap: 30 },
      { name: 'Relatórios executivos', currentLevel: 70, requiredLevel: 90, gap: 20 }
    ]
  };

  const skills = skillsMapping[targetPosition] || [
    { name: 'Habilidade técnica', currentLevel: 70, requiredLevel: 90, gap: 20 },
    { name: 'Liderança', currentLevel: 50, requiredLevel: 85, gap: 35 },
    { name: 'Comunicação', currentLevel: 65, requiredLevel: 85, gap: 20 }
  ];

  const totalGap = skills.reduce((sum, s) => sum + s.gap, 0);
  const timelineMonths = Math.ceil(totalGap / 5); // ~5% de melhoria por mês

  // Gerar milestones
  const milestones: Milestone[] = [
    {
      title: 'Completar treinamento de liderança',
      description: 'Curso de fundamentos de gestão de pessoas',
      targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      completed: false
    },
    {
      title: 'Liderar projeto piloto',
      description: 'Assumir responsabilidade de um projeto menor',
      targetDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
      completed: false
    },
    {
      title: 'Mentorar um colega',
      description: 'Apoiar desenvolvimento de um colega mais novo',
      targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
      completed: false
    },
    {
      title: 'Feedback 360°',
      description: 'Coletar e agir sobre feedback da equipe',
      targetDate: new Date(Date.now() + 240 * 24 * 60 * 60 * 1000).toISOString(),
      completed: false
    }
  ];

  // Recomendar treinamentos
  const trainings: Training[] = [
    {
      name: 'Liderança para novos gestores',
      type: 'course',
      duration: '20 horas',
      priority: 'high',
      cost: 500,
      expectedImpact: 'Fundamentos de gestão e comunicação'
    },
    {
      name: 'Mentoria com líder sênior',
      type: 'mentoring',
      duration: '3 meses',
      priority: 'high',
      cost: 0,
      expectedImpact: 'Aprendizado prático e networking interno'
    },
    {
      name: 'Workshop de feedback efetivo',
      type: 'workshop',
      duration: '4 horas',
      priority: 'medium',
      cost: 200,
      expectedImpact: 'Melhorar comunicação com equipe'
    }
  ];

  return {
    userId,
    employeeName: employee.name,
    currentPosition: employee.role,
    targetPosition,
    timelineMonths,
    currentProgress: 25, // Simulado
    requiredSkills: skills,
    milestones,
    recommendedTrainings: trainings,
    mentorName: 'Gestor atual',
    status: 'active'
  };
}

// =====================================================
// FUNÇÕES DE SALÁRIO
// =====================================================

/**
 * Gera recomendações salariais
 */
export async function analyzeSalaryCompetitiveness(): Promise<SalaryRecommendation[]> {
  const analytics = await analyzeEmployees();
  const recommendations: SalaryRecommendation[] = [];

  // Salários de mercado simulados
  const marketSalaries: Record<string, number> = {
    social_media: 4500,
    designer: 5000,
    trafego: 5500,
    video_maker: 5500,
    web_designer: 6000,
    comercial: 5000,
    rh: 4500,
    financeiro: 5000
  };

  for (const emp of analytics) {
    const marketAverage = marketSalaries[emp.role] || 4500;
    const currentSalary = marketAverage * (emp.salaryCompetitiveness / 100);
    
    // Calcular salário recomendado
    let performanceFactor = 1.0;
    if (emp.performanceScore >= 90) performanceFactor = 1.15;
    else if (emp.performanceScore >= 85) performanceFactor = 1.10;
    else if (emp.performanceScore >= 80) performanceFactor = 1.05;
    else if (emp.performanceScore < 70) performanceFactor = 0.95;

    const tenureFactor = 1.0; // Simplificado

    const recommendedSalary = marketAverage * performanceFactor * tenureFactor;
    const adjustmentPercentage = ((recommendedSalary - currentSalary) / currentSalary) * 100;

    if (Math.abs(adjustmentPercentage) >= 5) {
      recommendations.push({
        userId: emp.userId,
        employeeName: emp.name,
        currentSalary,
        marketAverage,
        recommendedSalary,
        adjustmentPercentage,
        justification: generateSalaryJustification(emp, adjustmentPercentage),
        performanceFactor,
        tenureFactor,
        urgency: adjustmentPercentage < -15 ? 'high' : adjustmentPercentage < -5 ? 'medium' : 'low'
      });
    }
  }

  return recommendations.sort((a, b) => a.adjustmentPercentage - b.adjustmentPercentage);
}

function generateSalaryJustification(emp: EmployeeAnalytics, adjustment: number): string {
  if (adjustment > 10) {
    return `Performance excepcional (${emp.performanceScore}%) e alto engajamento justificam aumento significativo.`;
  } else if (adjustment > 5) {
    return `Performance acima da média merece reconhecimento salarial.`;
  } else if (adjustment < -10) {
    return `Salário abaixo do mercado - risco de perda para concorrência.`;
  } else if (adjustment < -5) {
    return `Ajuste necessário para manter competitividade salarial.`;
  }
  return `Salário alinhado com mercado e performance.`;
}

// =====================================================
// FUNÇÕES DE SAÚDE DAS EQUIPES
// =====================================================

/**
 * Analisa saúde das equipes
 */
export async function analyzeTeamHealth(): Promise<TeamHealth[]> {
  const analytics = await analyzeEmployees();
  const departments = [...new Set(analytics.map(e => e.department))];
  const healthData: TeamHealth[] = [];

  for (const dept of departments) {
    const teamMembers = analytics.filter(e => e.department === dept);
    
    if (teamMembers.length === 0) continue;

    const avgPerformance = teamMembers.reduce((sum, e) => sum + e.performanceScore, 0) / teamMembers.length;
    const avgEngagement = teamMembers.reduce((sum, e) => sum + e.engagementScore, 0) / teamMembers.length;
    const avgSatisfaction = teamMembers.reduce((sum, e) => sum + e.satisfactionScore, 0) / teamMembers.length;
    const avgBurnout = teamMembers.reduce((sum, e) => sum + e.burnoutRisk, 0) / teamMembers.length;

    const issues: string[] = [];
    const strengths: string[] = [];

    // Identificar problemas
    if (avgEngagement < 75) issues.push('Engajamento baixo');
    if (avgSatisfaction < 70) issues.push('Satisfação em queda');
    if (avgBurnout > 40) issues.push('Risco de burnout elevado');
    if (teamMembers.filter(e => e.turnoverRisk > 50).length > 0) issues.push('Risco de turnover');

    // Identificar pontos fortes
    if (avgPerformance >= 85) strengths.push('Alta performance');
    if (avgEngagement >= 85) strengths.push('Equipe engajada');
    if (teamMembers.filter(e => e.growthPotential === 'exceptional').length > 0) {
      strengths.push('Talentos excepcionais');
    }

    healthData.push({
      department: dept,
      overallScore: Math.round((avgPerformance + avgEngagement + avgSatisfaction + (100 - avgBurnout)) / 4),
      engagementLevel: Math.round(avgEngagement),
      collaborationScore: Math.round(Math.random() * 20 + 75), // Simulado
      leadershipScore: Math.round(Math.random() * 20 + 70), // Simulado
      workloadBalance: Math.round(100 - avgBurnout),
      developmentOpportunities: Math.round(Math.random() * 20 + 70), // Simulado
      issues,
      strengths
    });
  }

  return healthData;
}

// =====================================================
// ALERTAS DO CHRO
// =====================================================

/**
 * Gera alertas do CHRO
 */
export async function generateCHROAlerts(): Promise<CHROAlert[]> {
  const alerts: CHROAlert[] = [];
  const predictions = await predictTurnover();
  const teamHealth = await analyzeTeamHealth();
  const salaryRecs = await analyzeSalaryCompetitiveness();

  // Alertas de turnover crítico
  for (const pred of predictions.filter(p => p.riskLevel === 'critical')) {
    alerts.push({
      id: `turnover-${pred.userId}`,
      type: 'turnover_critical',
      severity: 'critical',
      title: `URGENTE: ${pred.name} pode sair em breve`,
      description: `Risco de ${pred.probability}%. Custo de substituição: R$ ${pred.estimatedReplacementCost.toLocaleString('pt-BR')}`,
      employeeId: pred.userId,
      recommendedAction: pred.preventiveActions[0] || 'Conversa imediata',
      createdAt: new Date().toISOString()
    });
  }

  // Alertas de equipes com problemas
  for (const team of teamHealth.filter(t => t.overallScore < 70)) {
    alerts.push({
      id: `team-${team.department}`,
      type: 'team_health',
      severity: 'high',
      title: `Equipe ${team.department} precisa de atenção`,
      description: `Score geral: ${team.overallScore}%. Problemas: ${team.issues.join(', ')}`,
      department: team.department,
      recommendedAction: 'Reunião de equipe para diagnóstico',
      createdAt: new Date().toISOString()
    });
  }

  // Alertas salariais
  const underpaid = salaryRecs.filter(s => s.adjustmentPercentage < -15);
  if (underpaid.length > 0) {
    alerts.push({
      id: 'salary-gap',
      type: 'salary_competitiveness',
      severity: 'high',
      title: `${underpaid.length} colaboradores com salário abaixo do mercado`,
      description: `Risco de perda de talentos. Ajuste total sugerido: R$ ${underpaid.reduce((s, r) => s + (r.recommendedSalary - r.currentSalary), 0).toLocaleString('pt-BR')}/mês`,
      recommendedAction: 'Revisão salarial urgente',
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
 * Retorna dashboard completo do CHRO
 */
export async function getCHRODashboard(): Promise<CHRODashboard> {
  const employeeAnalytics = await analyzeEmployees();
  const turnoverPredictions = await predictTurnover();
  const teamHealth = await analyzeTeamHealth();
  const salaryRecommendations = await analyzeSalaryCompetitiveness();
  const alerts = await generateCHROAlerts();

  // KPIs
  const avgPerformance = employeeAnalytics.reduce((sum, e) => sum + e.performanceScore, 0) / 
    (employeeAnalytics.length || 1);
  const avgEngagement = employeeAnalytics.reduce((sum, e) => sum + e.engagementScore, 0) / 
    (employeeAnalytics.length || 1);
  const highTurnoverRisk = turnoverPredictions.filter(t => t.riskLevel === 'high' || t.riskLevel === 'critical').length;

  // Planos de carreira (simulado)
  const careerPlans: CareerPlan[] = [];

  return {
    kpis: {
      totalEmployees: employeeAnalytics.length,
      averagePerformance: Math.round(avgPerformance),
      averageEngagement: Math.round(avgEngagement),
      turnoverRate: (highTurnoverRisk / (employeeAnalytics.length || 1)) * 100,
      openPositions: 2, // Simulado
      averageTenure: 18, // Meses - simulado
      trainingHoursPerEmployee: 12 // Simulado
    },
    employeeAnalytics,
    turnoverPredictions,
    careerPlans,
    salaryRecommendations,
    teamHealth,
    alerts
  };
}

// =====================================================
// CHAT COM CHRO
// =====================================================

/**
 * Processa mensagem para o CHRO IA
 */
export async function chatWithCHRO(message: string, context?: Record<string, unknown>): Promise<string> {
  const dashboard = await getCHRODashboard();

  const contextData = `
DADOS ATUAIS DE PESSOAS:
- Total de colaboradores: ${dashboard.kpis.totalEmployees}
- Performance média: ${dashboard.kpis.averagePerformance}%
- Engajamento médio: ${dashboard.kpis.averageEngagement}%
- Taxa de risco de turnover: ${dashboard.kpis.turnoverRate.toFixed(1)}%
- Vagas abertas: ${dashboard.kpis.openPositions}
- Tempo médio de empresa: ${dashboard.kpis.averageTenure} meses

COLABORADORES EM RISCO:
${dashboard.turnoverPredictions.slice(0, 3).map(t => 
  `- ${t.name} (${t.department}): ${t.probability}% risco - ${t.factors[0]?.factor || 'Múltiplos fatores'}`
).join('\n')}

SAÚDE DAS EQUIPES:
${dashboard.teamHealth.map(t => 
  `- ${t.department}: ${t.overallScore}% score, ${t.issues.length ? 'Problemas: ' + t.issues.join(', ') : 'Saudável'}`
).join('\n')}

ALERTAS ATIVOS:
${dashboard.alerts.slice(0, 3).map(a => `- [${a.severity.toUpperCase()}] ${a.title}`).join('\n')}
`;

  try {
    const ai = await generateWithAI({
      task: 'hr',
      json: false,
      temperature: 0.7,
      maxTokens: 1000,
      entityType: 'chro_chat',
      entityId: null,
      messages: [
        { role: 'system', content: CHRO_SYSTEM_PROMPT },
        { role: 'system', content: contextData },
        { role: 'user', content: message }
      ],
    });

    return ai.text || 'Desculpe, não consegui processar sua solicitação.';
  } catch (error) {
    console.error('Erro no chat CHRO:', error);
    return 'Erro ao processar solicitação. Tente novamente.';
  }
}

export default {
  analyzeEmployees,
  predictTurnover,
  generateCareerPlan,
  analyzeSalaryCompetitiveness,
  analyzeTeamHealth,
  generateCHROAlerts,
  getCHRODashboard,
  chatWithCHRO
};

