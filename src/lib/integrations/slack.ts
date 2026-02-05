// Slack Integration - Valle 360
// Integração com Slack para notificações

export interface SlackConfig {
  webhookUrl: string;
  channel?: string;
  username?: string;
  iconEmoji?: string;
}

export interface SlackMessage {
  text: string;
  blocks?: SlackBlock[];
  attachments?: SlackAttachment[];
  channel?: string;
  username?: string;
  icon_emoji?: string;
}

export interface SlackBlock {
  type: 'section' | 'divider' | 'header' | 'context' | 'actions' | 'image';
  text?: {
    type: 'plain_text' | 'mrkdwn';
    text: string;
    emoji?: boolean;
  };
  fields?: {
    type: 'plain_text' | 'mrkdwn';
    text: string;
  }[];
  accessory?: {
    type: 'button' | 'image';
    text?: {
      type: 'plain_text';
      text: string;
      emoji?: boolean;
    };
    url?: string;
    action_id?: string;
    image_url?: string;
    alt_text?: string;
  };
  elements?: SlackBlockElement[];
  image_url?: string;
  alt_text?: string;
}

export interface SlackBlockElement {
  type: 'button' | 'image' | 'plain_text' | 'mrkdwn';
  text?: string | { type: string; text: string; emoji?: boolean };
  url?: string;
  action_id?: string;
  image_url?: string;
  alt_text?: string;
}

export interface SlackAttachment {
  color?: string;
  pretext?: string;
  author_name?: string;
  author_link?: string;
  author_icon?: string;
  title?: string;
  title_link?: string;
  text?: string;
  fields?: {
    title: string;
    value: string;
    short?: boolean;
  }[];
  footer?: string;
  footer_icon?: string;
  ts?: number;
}

/**
 * Enviar mensagem para Slack via Webhook
 */
export async function sendSlackMessage(
  config: SlackConfig,
  message: SlackMessage
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = {
      ...message,
      channel: message.channel || config.channel,
      username: message.username || config.username || 'Valle 360',
      icon_emoji: message.icon_emoji || config.iconEmoji || ':robot_face:'
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
export const slackTemplates = {
  /**
   * Notificação de novo cliente
   */
  newClient: (clientName: string, value: number, salesPerson: string): SlackMessage => ({
    text: `🎉 Novo cliente: ${clientName}`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🎉 Novo Cliente Fechado!',
          emoji: true
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Cliente:*\n${clientName}`
          },
          {
            type: 'mrkdwn',
            text: `*Valor:*\nR$ ${value.toLocaleString('pt-BR')}`
          },
          {
            type: 'mrkdwn',
            text: `*Vendedor:*\n${salesPerson}`
          },
          {
            type: 'mrkdwn',
            text: `*Data:*\n${new Date().toLocaleDateString('pt-BR')}`
          }
        ]
      },
      {
        type: 'divider'
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: '📊 Valle 360 - Sistema de Gestão'
          }
        ]
      }
    ]
  }),

  /**
   * Alerta de tarefa atrasada
   */
  taskOverdue: (taskTitle: string, assignee: string, daysOverdue: number): SlackMessage => ({
    text: `⚠️ Tarefa atrasada: ${taskTitle}`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '⚠️ Tarefa Atrasada',
          emoji: true
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `A tarefa *${taskTitle}* está atrasada há *${daysOverdue} dias*`
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Responsável:*\n${assignee}`
          },
          {
            type: 'mrkdwn',
            text: `*Atraso:*\n${daysOverdue} dias`
          }
        ]
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Ver Tarefa',
              emoji: true
            },
            url: 'https://valle360.com.br/kanban',
            action_id: 'view_task'
          }
        ]
      }
    ],
    attachments: [
      {
        color: '#ff9800'
      }
    ]
  }),

  /**
   * Alerta de NPS baixo
   */
  lowNPS: (clientName: string, score: number, feedback: string): SlackMessage => ({
    text: `🔴 NPS Baixo: ${clientName} - ${score}`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🔴 Alerta de NPS Baixo',
          emoji: true
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `O cliente *${clientName}* deu nota *${score}* no NPS`
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Feedback:*\n> ${feedback}`
        }
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '📞 Ligar para Cliente',
              emoji: true
            },
            action_id: 'call_client'
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '📧 Enviar Email',
              emoji: true
            },
            action_id: 'send_email'
          }
        ]
      }
    ],
    attachments: [
      {
        color: '#f44336'
      }
    ]
  }),

  /**
   * Pagamento recebido
   */
  paymentReceived: (clientName: string, amount: number, invoiceId: string): SlackMessage => ({
    text: `💰 Pagamento recebido: R$ ${amount.toLocaleString('pt-BR')}`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '💰 Pagamento Recebido',
          emoji: true
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Cliente:*\n${clientName}`
          },
          {
            type: 'mrkdwn',
            text: `*Valor:*\nR$ ${amount.toLocaleString('pt-BR')}`
          },
          {
            type: 'mrkdwn',
            text: `*Fatura:*\n#${invoiceId}`
          },
          {
            type: 'mrkdwn',
            text: `*Data:*\n${new Date().toLocaleDateString('pt-BR')}`
          }
        ]
      }
    ],
    attachments: [
      {
        color: '#4caf50'
      }
    ]
  }),

  /**
   * Meta batida
   */
  goalAchieved: (salesPerson: string, goal: number, achieved: number): SlackMessage => ({
    text: `🏆 ${salesPerson} bateu a meta!`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🏆 Meta Batida!',
          emoji: true
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `Parabéns *${salesPerson}*! Você atingiu *${Math.round((achieved / goal) * 100)}%* da meta! 🎉`
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Meta:*\nR$ ${goal.toLocaleString('pt-BR')}`
          },
          {
            type: 'mrkdwn',
            text: `*Alcançado:*\nR$ ${achieved.toLocaleString('pt-BR')}`
          }
        ]
      }
    ],
    attachments: [
      {
        color: '#9c27b0'
      }
    ]
  }),

  /**
   * Aprovação pendente
   */
  approvalPending: (itemType: string, clientName: string, daysWaiting: number): SlackMessage => ({
    text: `⏳ Aprovação pendente: ${itemType} - ${clientName}`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '⏳ Aprovação Pendente',
          emoji: true
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `O ${itemType} do cliente *${clientName}* está aguardando aprovação há *${daysWaiting} dias*`
        }
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Ver Item',
              emoji: true
            },
            url: 'https://valle360.com.br/aprovacoes',
            action_id: 'view_approval'
          }
        ]
      }
    ],
    attachments: [
      {
        color: '#2196f3'
      }
    ]
  })
};

/**
 * Classe para gerenciar conexão Slack
 */
export class SlackClient {
  private config: SlackConfig;

  constructor(config: SlackConfig) {
    this.config = config;
  }

  async send(message: SlackMessage): Promise<{ success: boolean; error?: string }> {
    return sendSlackMessage(this.config, message);
  }

  async notifyNewClient(clientName: string, value: number, salesPerson: string) {
    return this.send(slackTemplates.newClient(clientName, value, salesPerson));
  }

  async notifyTaskOverdue(taskTitle: string, assignee: string, daysOverdue: number) {
    return this.send(slackTemplates.taskOverdue(taskTitle, assignee, daysOverdue));
  }

  async notifyLowNPS(clientName: string, score: number, feedback: string) {
    return this.send(slackTemplates.lowNPS(clientName, score, feedback));
  }

  async notifyPayment(clientName: string, amount: number, invoiceId: string) {
    return this.send(slackTemplates.paymentReceived(clientName, amount, invoiceId));
  }

  async notifyGoalAchieved(salesPerson: string, goal: number, achieved: number) {
    return this.send(slackTemplates.goalAchieved(salesPerson, goal, achieved));
  }

  async notifyApprovalPending(itemType: string, clientName: string, daysWaiting: number) {
    return this.send(slackTemplates.approvalPending(itemType, clientName, daysWaiting));
  }
}

export default SlackClient;









