// Discord Integration - Valle 360
// Integração com Discord para notificações

export interface DiscordConfig {
  webhookUrl: string;
  username?: string;
  avatarUrl?: string;
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  timestamp?: string;
  footer?: {
    text: string;
    icon_url?: string;
  };
  thumbnail?: {
    url: string;
  };
  image?: {
    url: string;
  };
  author?: {
    name: string;
    url?: string;
    icon_url?: string;
  };
  fields?: {
    name: string;
    value: string;
    inline?: boolean;
  }[];
}

export interface DiscordMessage {
  content?: string;
  username?: string;
  avatar_url?: string;
  embeds?: DiscordEmbed[];
  tts?: boolean;
}

// Cores padrão para Discord (em decimal)
export const DISCORD_COLORS = {
  success: 0x4caf50,  // Verde
  warning: 0xff9800,  // Laranja
  error: 0xf44336,    // Vermelho
  info: 0x2196f3,     // Azul
  purple: 0x9c27b0,   // Roxo
  primary: 0x4370d1,  // Azul Valle
};

/**
 * Enviar mensagem para Discord via Webhook
 */
export async function sendDiscordMessage(
  config: DiscordConfig,
  message: DiscordMessage
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = {
      ...message,
      username: message.username || config.username || 'Valle 360',
      avatar_url: message.avatar_url || config.avatarUrl
    };

    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Templates de mensagens pré-definidos
 */
export const discordTemplates = {
  /**
   * Notificação de novo cliente
   */
  newClient: (clientName: string, value: number, salesPerson: string): DiscordMessage => ({
    embeds: [{
      title: '🎉 Novo Cliente Fechado!',
      color: DISCORD_COLORS.success,
      fields: [
        { name: '👤 Cliente', value: clientName, inline: true },
        { name: '💰 Valor', value: `R$ ${value.toLocaleString('pt-BR')}`, inline: true },
        { name: '🧑‍💼 Vendedor', value: salesPerson, inline: true }
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Valle 360 - Sistema de Gestão'
      }
    }]
  }),

  /**
   * Alerta de tarefa atrasada
   */
  taskOverdue: (taskTitle: string, assignee: string, daysOverdue: number): DiscordMessage => ({
    embeds: [{
      title: '⚠️ Tarefa Atrasada',
      description: `A tarefa **${taskTitle}** está atrasada há **${daysOverdue} dias**`,
      color: DISCORD_COLORS.warning,
      fields: [
        { name: '👤 Responsável', value: assignee, inline: true },
        { name: '📅 Atraso', value: `${daysOverdue} dias`, inline: true }
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Valle 360 - Kanban'
      }
    }]
  }),

  /**
   * Alerta de NPS baixo
   */
  lowNPS: (clientName: string, score: number, feedback: string): DiscordMessage => ({
    embeds: [{
      title: '🔴 Alerta de NPS Baixo',
      description: `O cliente **${clientName}** deu nota **${score}** no NPS`,
      color: DISCORD_COLORS.error,
      fields: [
        { name: '💬 Feedback', value: feedback || 'Sem comentário', inline: false }
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Valle 360 - NPS'
      }
    }]
  }),

  /**
   * Pagamento recebido
   */
  paymentReceived: (clientName: string, amount: number, invoiceId: string): DiscordMessage => ({
    embeds: [{
      title: '💰 Pagamento Recebido',
      color: DISCORD_COLORS.success,
      fields: [
        { name: '👤 Cliente', value: clientName, inline: true },
        { name: '💵 Valor', value: `R$ ${amount.toLocaleString('pt-BR')}`, inline: true },
        { name: '📄 Fatura', value: `#${invoiceId}`, inline: true }
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Valle 360 - Financeiro'
      }
    }]
  }),

  /**
   * Meta batida
   */
  goalAchieved: (salesPerson: string, goal: number, achieved: number): DiscordMessage => ({
    embeds: [{
      title: '🏆 Meta Batida!',
      description: `Parabéns **${salesPerson}**! Você atingiu **${Math.round((achieved / goal) * 100)}%** da meta! 🎉`,
      color: DISCORD_COLORS.purple,
      fields: [
        { name: '🎯 Meta', value: `R$ ${goal.toLocaleString('pt-BR')}`, inline: true },
        { name: '✅ Alcançado', value: `R$ ${achieved.toLocaleString('pt-BR')}`, inline: true }
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Valle 360 - Comercial'
      }
    }]
  }),

  /**
   * Aprovação pendente
   */
  approvalPending: (itemType: string, clientName: string, daysWaiting: number): DiscordMessage => ({
    embeds: [{
      title: '⏳ Aprovação Pendente',
      description: `O ${itemType} do cliente **${clientName}** está aguardando aprovação há **${daysWaiting} dias**`,
      color: DISCORD_COLORS.info,
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Valle 360 - Aprovações'
      }
    }]
  }),

  /**
   * Atividade de concorrente
   */
  competitorActivity: (competitorName: string, activityType: string, details: string): DiscordMessage => ({
    embeds: [{
      title: '🔍 Atividade de Concorrente',
      description: `**${competitorName}** ${activityType}`,
      color: DISCORD_COLORS.info,
      fields: [
        { name: '📝 Detalhes', value: details, inline: false }
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Valle 360 - Monitoramento'
      }
    }]
  }),

  /**
   * Resumo diário
   */
  dailySummary: (stats: {
    newClients: number;
    revenue: number;
    tasksCompleted: number;
    pendingApprovals: number;
  }): DiscordMessage => ({
    embeds: [{
      title: '📊 Resumo do Dia',
      color: DISCORD_COLORS.primary,
      fields: [
        { name: '👥 Novos Clientes', value: stats.newClients.toString(), inline: true },
        { name: '💰 Faturamento', value: `R$ ${stats.revenue.toLocaleString('pt-BR')}`, inline: true },
        { name: '✅ Tarefas Concluídas', value: stats.tasksCompleted.toString(), inline: true },
        { name: '⏳ Aprovações Pendentes', value: stats.pendingApprovals.toString(), inline: true }
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Valle 360 - Relatório Diário'
      }
    }]
  })
};

/**
 * Classe para gerenciar conexão Discord
 */
export class DiscordClient {
  private config: DiscordConfig;

  constructor(config: DiscordConfig) {
    this.config = config;
  }

  async send(message: DiscordMessage): Promise<{ success: boolean; error?: string }> {
    return sendDiscordMessage(this.config, message);
  }

  async notifyNewClient(clientName: string, value: number, salesPerson: string) {
    return this.send(discordTemplates.newClient(clientName, value, salesPerson));
  }

  async notifyTaskOverdue(taskTitle: string, assignee: string, daysOverdue: number) {
    return this.send(discordTemplates.taskOverdue(taskTitle, assignee, daysOverdue));
  }

  async notifyLowNPS(clientName: string, score: number, feedback: string) {
    return this.send(discordTemplates.lowNPS(clientName, score, feedback));
  }

  async notifyPayment(clientName: string, amount: number, invoiceId: string) {
    return this.send(discordTemplates.paymentReceived(clientName, amount, invoiceId));
  }

  async notifyGoalAchieved(salesPerson: string, goal: number, achieved: number) {
    return this.send(discordTemplates.goalAchieved(salesPerson, goal, achieved));
  }

  async notifyApprovalPending(itemType: string, clientName: string, daysWaiting: number) {
    return this.send(discordTemplates.approvalPending(itemType, clientName, daysWaiting));
  }

  async notifyCompetitorActivity(competitorName: string, activityType: string, details: string) {
    return this.send(discordTemplates.competitorActivity(competitorName, activityType, details));
  }

  async sendDailySummary(stats: {
    newClients: number;
    revenue: number;
    tasksCompleted: number;
    pendingApprovals: number;
  }) {
    return this.send(discordTemplates.dailySummary(stats));
  }
}

export default DiscordClient;









