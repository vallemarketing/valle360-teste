// Motor Central de IA - O cérebro que controla tudo
// A IA dita o ritmo da agência

import { supabase } from '@/lib/supabase';

// ==================== TIPOS ====================
export interface AIAlert {
  id: string;
  severity: 'info' | 'warning' | 'urgent' | 'critical';
  category: string;
  title: string;
  description: string;
  actionRequired: boolean;
  actionUrl?: string;
  actionLabel?: string;
  targetUsers: string[];
  entityType?: string;
  entityId?: string;
  createdAt: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface AIInsight {
  id: string;
  type: 'opportunity' | 'warning' | 'achievement' | 'suggestion' | 'prediction';
  area: string;
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  confidence: number; // 0-100
  actionable: boolean;
  suggestedAction?: string;
  data?: Record<string, any>;
  createdAt: Date;
}

export interface AITask {
  id: string;
  type: string;
  priority: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  payload: Record<string, any>;
  result?: Record<string, any>;
  scheduledFor?: Date;
  completedAt?: Date;
  createdAt: Date;
}

export interface ClientHealth {
  clientId: string;
  overallScore: number; // 0-100
  engagementScore: number;
  paymentScore: number;
  satisfactionScore: number;
  growthScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: {
    positive: string[];
    negative: string[];
  };
  lastCalculated: Date;
}

export interface EmployeePerformance {
  employeeId: string;
  area: string;
  currentScore: number;
  goalProgress: number; // percentage
  tasksCompleted: number;
  tasksOverdue: number;
  avgDeliveryTime: number; // days
  qualityScore: number;
  trend: 'up' | 'stable' | 'down';
}

// ==================== CONSTANTES ====================
export const AGENCY_RHYTHM = {
  weeklyClientMeeting: 7, // dias
  biweeklyMetricsPresentation: 15, // dias
  dailyGroupContact: 1, // dias
  taskFollowUp: 2, // dias sem atualização
  leadCoolingThreshold: 3, // dias sem contato
  paymentReminderDays: [1, 3, 7, 15, 30], // D+ após vencimento
  juridicalEscalation: 45, // dias para escalar para jurídico
};

export const SEVERITY_WEIGHTS = {
  info: 1,
  warning: 2,
  urgent: 3,
  critical: 4,
};

// ==================== MOTOR DE COBRANÇA ====================
export class AICollector {
  
  // Verificar tarefas atrasadas
  static async checkOverdueTasks(): Promise<AIAlert[]> {
    const alerts: AIAlert[] = [];
    const today = new Date();
    
    // Simular dados - em produção, buscar do banco
    const overdueTasks = [
      { id: '1', title: 'Landing Page Cliente X', dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), assignee: 'João', assigneeId: '1' },
      { id: '2', title: 'Campanha Instagram', dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), assignee: 'Maria', assigneeId: '2' },
    ];

    for (const task of overdueTasks) {
      const daysOverdue = Math.floor((today.getTime() - task.dueDate.getTime()) / (1000 * 60 * 60 * 24));
      
      alerts.push({
        id: `overdue-${task.id}`,
        severity: daysOverdue > 3 ? 'critical' : daysOverdue > 1 ? 'urgent' : 'warning',
        category: 'tasks',
        title: `Tarefa atrasada: ${task.title}`,
        description: `Esta tarefa está ${daysOverdue} dia(s) atrasada. Responsável: ${task.assignee}`,
        actionRequired: true,
        actionUrl: `/colaborador/kanban?task=${task.id}`,
        actionLabel: 'Ver Tarefa',
        targetUsers: [task.assigneeId],
        entityType: 'task',
        entityId: task.id,
        createdAt: new Date(),
        metadata: { daysOverdue, assignee: task.assignee }
      });
    }

    return alerts;
  }

  // Verificar reuniões esquecidas/não agendadas
  static async checkMissedMeetings(): Promise<AIAlert[]> {
    const alerts: AIAlert[] = [];
    
    // Clientes sem reunião há mais de 7 dias
    const clientsWithoutMeeting = [
      { id: '1', name: 'Tech Solutions', lastMeeting: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), accountManager: 'Carlos', accountManagerId: '3' },
    ];

    for (const client of clientsWithoutMeeting) {
      const daysSinceLastMeeting = Math.floor((Date.now() - client.lastMeeting.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceLastMeeting >= AGENCY_RHYTHM.weeklyClientMeeting) {
        alerts.push({
          id: `meeting-${client.id}`,
          severity: daysSinceLastMeeting > 14 ? 'critical' : 'urgent',
          category: 'meetings',
          title: `Reunião pendente: ${client.name}`,
          description: `Última reunião foi há ${daysSinceLastMeeting} dias. Agende uma reunião semanal com o cliente.`,
          actionRequired: true,
          actionUrl: `/colaborador/agenda?client=${client.id}`,
          actionLabel: 'Agendar Reunião',
          targetUsers: [client.accountManagerId],
          entityType: 'client',
          entityId: client.id,
          createdAt: new Date(),
          metadata: { daysSinceLastMeeting, clientName: client.name }
        });
      }
    }

    return alerts;
  }

  // Verificar métricas não apresentadas
  static async checkPendingMetrics(): Promise<AIAlert[]> {
    const alerts: AIAlert[] = [];
    
    // Clientes sem apresentação de métricas há mais de 15 dias
    const clientsWithoutMetrics = [
      { id: '2', name: 'E-commerce Plus', lastPresentation: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), accountManager: 'Ana', accountManagerId: '4' },
    ];

    for (const client of clientsWithoutMetrics) {
      const daysSinceLastPresentation = Math.floor((Date.now() - client.lastPresentation.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceLastPresentation >= AGENCY_RHYTHM.biweeklyMetricsPresentation) {
        alerts.push({
          id: `metrics-${client.id}`,
          severity: 'urgent',
          category: 'metrics',
          title: `Métricas pendentes: ${client.name}`,
          description: `Apresentação de métricas atrasada em ${daysSinceLastPresentation - AGENCY_RHYTHM.biweeklyMetricsPresentation} dias. Prepare e envie o relatório.`,
          actionRequired: true,
          actionUrl: `/colaborador/relatorios?client=${client.id}`,
          actionLabel: 'Gerar Relatório',
          targetUsers: [client.accountManagerId],
          entityType: 'client',
          entityId: client.id,
          createdAt: new Date(),
          metadata: { daysSinceLastPresentation, clientName: client.name }
        });
      }
    }

    return alerts;
  }

  // Verificar leads esfriando
  static async checkCoolingLeads(): Promise<AIAlert[]> {
    const alerts: AIAlert[] = [];
    
    const coolingLeads = [
      { id: '1', name: 'Potencial Cliente ABC', lastContact: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), salesRep: 'Pedro', salesRepId: '5', conversionProbability: 65 },
    ];

    for (const lead of coolingLeads) {
      const daysSinceLastContact = Math.floor((Date.now() - lead.lastContact.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceLastContact >= AGENCY_RHYTHM.leadCoolingThreshold) {
        alerts.push({
          id: `lead-cooling-${lead.id}`,
          severity: lead.conversionProbability > 50 ? 'urgent' : 'warning',
          category: 'sales',
          title: `Lead esfriando: ${lead.name}`,
          description: `Sem contato há ${daysSinceLastContact} dias. Probabilidade de conversão: ${lead.conversionProbability}%. Entre em contato agora!`,
          actionRequired: true,
          actionUrl: `/colaborador/comercial?lead=${lead.id}`,
          actionLabel: 'Contatar Lead',
          targetUsers: [lead.salesRepId],
          entityType: 'lead',
          entityId: lead.id,
          createdAt: new Date(),
          metadata: { daysSinceLastContact, conversionProbability: lead.conversionProbability }
        });
      }
    }

    return alerts;
  }

  // Verificar metas abaixo do esperado
  static async checkUnderperformingGoals(): Promise<AIAlert[]> {
    const alerts: AIAlert[] = [];
    
    const underperformers = [
      { employeeId: '1', name: 'João Silva', area: 'Web Designer', goalProgress: 45, expectedProgress: 70 },
      { employeeId: '2', name: 'Maria Santos', area: 'Social Media', goalProgress: 60, expectedProgress: 75 },
    ];

    for (const employee of underperformers) {
      if (employee.goalProgress < employee.expectedProgress * 0.7) { // Menos de 70% do esperado
        alerts.push({
          id: `goal-${employee.employeeId}`,
          severity: employee.goalProgress < 50 ? 'urgent' : 'warning',
          category: 'performance',
          title: `Meta abaixo do esperado: ${employee.name}`,
          description: `Progresso atual: ${employee.goalProgress}% (esperado: ${employee.expectedProgress}%). Área: ${employee.area}`,
          actionRequired: true,
          actionUrl: `/colaborador/metas`,
          actionLabel: 'Ver Metas',
          targetUsers: [employee.employeeId],
          entityType: 'employee',
          entityId: employee.employeeId,
          createdAt: new Date(),
          metadata: { goalProgress: employee.goalProgress, expectedProgress: employee.expectedProgress, area: employee.area }
        });
      }
    }

    return alerts;
  }

  // Verificar pagamentos em atraso
  static async checkOverduePayments(): Promise<AIAlert[]> {
    const alerts: AIAlert[] = [];
    
    const overduePayments = [
      { id: '1', clientName: 'Cliente Inadimplente', value: 5000, dueDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), attempts: 3 },
    ];

    for (const payment of overduePayments) {
      const daysOverdue = Math.floor((Date.now() - payment.dueDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Escalar para jurídico se > 45 dias
      if (daysOverdue >= AGENCY_RHYTHM.juridicalEscalation) {
        alerts.push({
          id: `payment-juridico-${payment.id}`,
          severity: 'critical',
          category: 'financial',
          title: `Escalar para Jurídico: ${payment.clientName}`,
          description: `Pagamento de R$ ${payment.value.toLocaleString('pt-BR')} está ${daysOverdue} dias em atraso. ${payment.attempts} tentativas de cobrança realizadas. Encaminhar para cobrança extrajudicial.`,
          actionRequired: true,
          actionUrl: `/juridico/casos?payment=${payment.id}`,
          actionLabel: 'Abrir Caso Jurídico',
          targetUsers: ['financeiro', 'juridico'],
          entityType: 'payment',
          entityId: payment.id,
          createdAt: new Date(),
          metadata: { daysOverdue, value: payment.value, attempts: payment.attempts }
        });
      } else {
        const reminderDay = AGENCY_RHYTHM.paymentReminderDays.find(d => d <= daysOverdue);
        if (reminderDay) {
          alerts.push({
            id: `payment-${payment.id}`,
            severity: daysOverdue > 15 ? 'urgent' : 'warning',
            category: 'financial',
            title: `Cobrança D+${daysOverdue}: ${payment.clientName}`,
            description: `Pagamento de R$ ${payment.value.toLocaleString('pt-BR')} vencido há ${daysOverdue} dias. Enviar cobrança.`,
            actionRequired: true,
            actionUrl: `/financeiro/receber?payment=${payment.id}`,
            actionLabel: 'Enviar Cobrança',
            targetUsers: ['financeiro'],
            entityType: 'payment',
            entityId: payment.id,
            createdAt: new Date(),
            metadata: { daysOverdue, value: payment.value }
          });
        }
      }
    }

    return alerts;
  }

  // Coletar todos os alertas
  static async collectAllAlerts(): Promise<AIAlert[]> {
    const [
      overdueTasks,
      missedMeetings,
      pendingMetrics,
      coolingLeads,
      underperformingGoals,
      overduePayments
    ] = await Promise.all([
      this.checkOverdueTasks(),
      this.checkMissedMeetings(),
      this.checkPendingMetrics(),
      this.checkCoolingLeads(),
      this.checkUnderperformingGoals(),
      this.checkOverduePayments()
    ]);

    const allAlerts = [
      ...overdueTasks,
      ...missedMeetings,
      ...pendingMetrics,
      ...coolingLeads,
      ...underperformingGoals,
      ...overduePayments
    ];

    // Ordenar por severidade
    return allAlerts.sort((a, b) => SEVERITY_WEIGHTS[b.severity] - SEVERITY_WEIGHTS[a.severity]);
  }
}

// ==================== MOTOR DE INSIGHTS ====================
export class AIInsights {
  
  // Gerar insights para área comercial
  static async getComercialInsights(): Promise<AIInsight[]> {
    return [
      {
        id: 'comercial-1',
        type: 'opportunity',
        area: 'comercial',
        title: 'Momento ideal para upsell',
        description: 'Cliente Tech Solutions está com engajamento alto e contrato vencendo em 30 dias. Probabilidade de aceitar upgrade: 78%',
        impact: 'high',
        confidence: 78,
        actionable: true,
        suggestedAction: 'Enviar proposta de upgrade com 15% de desconto',
        data: { clientId: '1', clientName: 'Tech Solutions', currentPlan: 'Basic', suggestedPlan: 'Premium' },
        createdAt: new Date()
      },
      {
        id: 'comercial-2',
        type: 'prediction',
        area: 'comercial',
        title: 'Lead quente identificado',
        description: 'Lead "ABC Corp" abriu a proposta 5 vezes nas últimas 24h. Conversão prevista: 85%',
        impact: 'high',
        confidence: 85,
        actionable: true,
        suggestedAction: 'Ligar agora para fechar negócio',
        data: { leadId: '5', leadName: 'ABC Corp', proposalViews: 5 },
        createdAt: new Date()
      },
      {
        id: 'comercial-3',
        type: 'warning',
        area: 'comercial',
        title: 'Pipeline esfriando',
        description: '3 leads não foram contatados há mais de 5 dias. Risco de perda: R$ 45.000',
        impact: 'medium',
        confidence: 70,
        actionable: true,
        suggestedAction: 'Priorizar contato com leads inativos',
        data: { leadsAtRisk: 3, potentialLoss: 45000 },
        createdAt: new Date()
      }
    ];
  }

  // Gerar insights para Social Media
  static async getSocialMediaInsights(): Promise<AIInsight[]> {
    return [
      {
        id: 'social-1',
        type: 'suggestion',
        area: 'social_media',
        title: 'Melhor horário identificado',
        description: 'Posts às 18:30 têm 45% mais engajamento para o cliente Fashion Store',
        impact: 'medium',
        confidence: 92,
        actionable: true,
        suggestedAction: 'Reagendar posts para 18:30',
        data: { clientId: '2', optimalTime: '18:30', engagementIncrease: 45 },
        createdAt: new Date()
      },
      {
        id: 'social-2',
        type: 'achievement',
        area: 'social_media',
        title: 'Meta de engajamento batida!',
        description: 'Cliente E-commerce Plus atingiu 150% da meta de engajamento este mês',
        impact: 'high',
        confidence: 100,
        actionable: false,
        data: { clientId: '3', achievement: 150, metric: 'engagement' },
        createdAt: new Date()
      }
    ];
  }

  // Gerar insights para Tráfego
  static async getTrafegoInsights(): Promise<AIInsight[]> {
    return [
      {
        id: 'trafego-1',
        type: 'warning',
        area: 'trafego',
        title: 'CPA acima do esperado',
        description: 'Campanha "Black Friday" está com CPA 35% acima da meta. Sugestão: pausar e otimizar',
        impact: 'high',
        confidence: 88,
        actionable: true,
        suggestedAction: 'Pausar campanha e revisar segmentação',
        data: { campaignId: '1', currentCPA: 45, targetCPA: 33, overage: 35 },
        createdAt: new Date()
      },
      {
        id: 'trafego-2',
        type: 'opportunity',
        area: 'trafego',
        title: 'Oportunidade de escala',
        description: 'Campanha "Remarketing" com ROAS 5.2x. Recomendação: aumentar budget em 50%',
        impact: 'high',
        confidence: 82,
        actionable: true,
        suggestedAction: 'Solicitar aumento de budget ao cliente',
        data: { campaignId: '2', currentROAS: 5.2, suggestedBudgetIncrease: 50 },
        createdAt: new Date()
      }
    ];
  }

  // Gerar insights para área específica
  static async getInsightsForArea(area: string): Promise<AIInsight[]> {
    switch (area.toLowerCase()) {
      case 'comercial':
        return this.getComercialInsights();
      case 'social_media':
      case 'social media':
        return this.getSocialMediaInsights();
      case 'trafego':
      case 'tráfego':
        return this.getTrafegoInsights();
      default:
        return [];
    }
  }
}

// ==================== MOTOR DE PREDIÇÃO ====================
export class AIPredictions {
  
  // Calcular saúde do cliente
  static calculateClientHealth(clientData: any): ClientHealth {
    // Fatores positivos e negativos
    const positive: string[] = [];
    const negative: string[] = [];

    // Engajamento (simulado)
    const engagementScore = Math.random() * 40 + 60; // 60-100
    if (engagementScore > 80) positive.push('Alto engajamento');
    if (engagementScore < 60) negative.push('Baixo engajamento');

    // Pagamentos (simulado)
    const paymentScore = Math.random() * 30 + 70; // 70-100
    if (paymentScore > 90) positive.push('Pagamentos em dia');
    if (paymentScore < 70) negative.push('Histórico de atrasos');

    // Satisfação (simulado)
    const satisfactionScore = Math.random() * 40 + 60; // 60-100
    if (satisfactionScore > 85) positive.push('Alta satisfação');
    if (satisfactionScore < 65) negative.push('Satisfação baixa');

    // Crescimento (simulado)
    const growthScore = Math.random() * 50 + 50; // 50-100
    if (growthScore > 80) positive.push('Crescimento acelerado');
    if (growthScore < 60) negative.push('Crescimento estagnado');

    // Score geral
    const overallScore = Math.round((engagementScore + paymentScore + satisfactionScore + growthScore) / 4);

    // Nível de risco
    let riskLevel: ClientHealth['riskLevel'] = 'low';
    if (overallScore < 60) riskLevel = 'critical';
    else if (overallScore < 70) riskLevel = 'high';
    else if (overallScore < 80) riskLevel = 'medium';

    return {
      clientId: clientData.id,
      overallScore,
      engagementScore: Math.round(engagementScore),
      paymentScore: Math.round(paymentScore),
      satisfactionScore: Math.round(satisfactionScore),
      growthScore: Math.round(growthScore),
      riskLevel,
      factors: { positive, negative },
      lastCalculated: new Date()
    };
  }

  // Prever churn
  static predictChurn(clientHealth: ClientHealth): { probability: number; factors: string[] } {
    let probability = 0;
    const factors: string[] = [];

    if (clientHealth.overallScore < 60) {
      probability += 40;
      factors.push('Score geral baixo');
    }
    if (clientHealth.engagementScore < 50) {
      probability += 20;
      factors.push('Engajamento muito baixo');
    }
    if (clientHealth.paymentScore < 70) {
      probability += 15;
      factors.push('Problemas com pagamentos');
    }
    if (clientHealth.satisfactionScore < 60) {
      probability += 25;
      factors.push('Insatisfação detectada');
    }

    return {
      probability: Math.min(probability, 95),
      factors
    };
  }

  // Prever conversão de lead
  static predictLeadConversion(leadData: any): { probability: number; factors: string[] } {
    let probability = 30; // Base
    const factors: string[] = [];

    // Interações com proposta
    if (leadData.proposalViews > 3) {
      probability += 25;
      factors.push('Alto interesse na proposta');
    }

    // Tempo desde último contato
    if (leadData.daysSinceContact < 2) {
      probability += 15;
      factors.push('Contato recente');
    }

    // Tamanho do deal
    if (leadData.dealSize > 10000) {
      probability += 10;
      factors.push('Deal de alto valor');
    }

    // Fit do cliente
    if (leadData.fitScore > 70) {
      probability += 20;
      factors.push('Bom fit com serviços');
    }

    return {
      probability: Math.min(probability, 95),
      factors
    };
  }
}

// ==================== FLUXOS ENTRE ÁREAS ====================
export class AIWorkflows {
  
  // Fluxo: Proposta aceita -> Contrato -> Financeiro
  static async handleProposalAccepted(proposalId: string, clientId: string) {
    console.log(`[AI Workflow] Proposta ${proposalId} aceita. Iniciando fluxo...`);
    
    // 1. Criar contrato no Jurídico
    // 2. Notificar Jurídico
    // 3. Após assinatura, criar faturamento no Financeiro
    // 4. Notificar equipes de produção para onboarding
    
    return {
      steps: [
        { area: 'juridico', action: 'create_contract', status: 'pending' },
        { area: 'financeiro', action: 'create_billing', status: 'waiting' },
        { area: 'producao', action: 'start_onboarding', status: 'waiting' }
      ]
    };
  }

  // Fluxo: Inadimplência -> Cobrança -> Jurídico
  static async handlePaymentOverdue(paymentId: string, daysOverdue: number) {
    console.log(`[AI Workflow] Pagamento ${paymentId} atrasado ${daysOverdue} dias`);
    
    if (daysOverdue >= AGENCY_RHYTHM.juridicalEscalation) {
      return {
        action: 'escalate_to_legal',
        nextStep: 'Criar caso no Jurídico para cobrança extrajudicial'
      };
    }
    
    const reminderType = daysOverdue > 15 ? 'urgent' : daysOverdue > 7 ? 'firm' : 'friendly';
    return {
      action: 'send_reminder',
      reminderType,
      nextStep: `Enviar cobrança ${reminderType}`
    };
  }

  // Fluxo: Meta batida -> Gamificação -> RH
  static async handleGoalAchieved(employeeId: string, goalType: string, achievement: number) {
    console.log(`[AI Workflow] Colaborador ${employeeId} bateu meta de ${goalType}`);
    
    return {
      steps: [
        { area: 'gamificacao', action: 'award_points', points: achievement * 10 },
        { area: 'rh', action: 'check_bonus_eligibility', status: 'pending' }
      ]
    };
  }
}

// ==================== EXPORT DEFAULT ====================
const AIBrain = {
  Collector: AICollector,
  Insights: AIInsights,
  Predictions: AIPredictions,
  Workflows: AIWorkflows,
  AGENCY_RHYTHM
};

export default AIBrain;






