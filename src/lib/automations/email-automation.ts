/**
 * Valle 360 - Sistema de Automação de Emails
 * Envia emails automáticos para cobrança, follow-up, NPS, etc.
 */

import { generateWithAI } from '@/lib/ai/aiRouter';
import { sendEmailWithFallback } from '@/lib/email/emailService';

// =====================================================
// TIPOS
// =====================================================

export type EmailType = 
  | 'collection'           // Cobrança
  | 'collection_reminder'  // Lembrete de cobrança
  | 'collection_urgent'    // Cobrança urgente
  | 'welcome'              // Boas-vindas
  | 'followup'             // Follow-up
  | 'nps'                  // Pesquisa NPS
  | 'report'               // Relatório mensal
  | 'task_assigned'        // Tarefa atribuída
  | 'task_completed'       // Tarefa concluída
  | 'contract_reminder'    // Lembrete de contrato
  | 'meeting_reminder'     // Lembrete de reunião
  | 'birthday'             // Aniversário
  | 'inactive_client';     // Cliente inativo

export interface EmailRecipient {
  email: string;
  name: string;
  companyName?: string;
}

export interface EmailContext {
  [key: string]: any;
}

export interface AutomatedEmail {
  id?: string;
  type: EmailType;
  recipient: EmailRecipient;
  context: EmailContext;
  scheduledFor?: Date;
  sentAt?: Date;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  error?: string;
}

export interface EmailTemplate {
  subject: string;
  body: string;
  variables: string[];
}

// =====================================================
// TEMPLATES DE EMAIL
// =====================================================

const EMAIL_TEMPLATES: Record<EmailType, EmailTemplate> = {
  collection: {
    subject: 'Lembrete de Pagamento - {{companyName}}',
    body: `Olá {{name}},

Esperamos que esteja tudo bem!

Gostaríamos de lembrar que o pagamento referente aos serviços de {{month}} está pendente.

**Valor:** R$ {{value}}
**Vencimento:** {{dueDate}}

Para sua conveniência, você pode realizar o pagamento através do link abaixo:
{{paymentLink}}

Se já efetuou o pagamento, por favor desconsidere este e-mail.

Qualquer dúvida, estamos à disposição!

Atenciosamente,
Equipe Valle 360`,
    variables: ['name', 'companyName', 'month', 'value', 'dueDate', 'paymentLink']
  },

  collection_reminder: {
    subject: '⚠️ Pagamento em Atraso - {{companyName}}',
    body: `Olá {{name}},

Notamos que o pagamento referente a {{month}} ainda não foi identificado em nosso sistema.

**Valor:** R$ {{value}}
**Vencimento original:** {{dueDate}}
**Dias em atraso:** {{daysOverdue}}

Pedimos que regularize a situação o mais breve possível para evitar interrupção dos serviços.

Link para pagamento: {{paymentLink}}

Caso tenha alguma dificuldade ou precise de condições especiais, entre em contato conosco.

Atenciosamente,
Equipe Financeira Valle 360`,
    variables: ['name', 'companyName', 'month', 'value', 'dueDate', 'daysOverdue', 'paymentLink']
  },

  collection_urgent: {
    subject: '🚨 URGENTE: Serviços podem ser suspensos - {{companyName}}',
    body: `{{name}},

Este é nosso último aviso antes da suspensão dos serviços.

O pagamento de R$ {{value}} está em atraso há {{daysOverdue}} dias.

**Para evitar a suspensão, regularize até {{deadline}}.**

Link para pagamento imediato: {{paymentLink}}

Após a suspensão, a reativação estará sujeita a análise e possíveis taxas.

Se já realizou o pagamento ou precisa negociar, responda este e-mail urgentemente.

Atenciosamente,
Diretoria Valle 360`,
    variables: ['name', 'companyName', 'value', 'daysOverdue', 'deadline', 'paymentLink']
  },

  welcome: {
    subject: '🎉 Bem-vindo(a) à Valle 360, {{name}}!',
    body: `Olá {{name}},

É com grande prazer que damos as boas-vindas a você e à {{companyName}} à família Valle 360!

Estamos muito animados em começar essa parceria e ajudar você a alcançar resultados incríveis.

**Seus próximos passos:**
1. Acesse sua área do cliente: {{clientAreaLink}}
2. Complete seu perfil
3. Agende uma reunião de kickoff com nossa equipe

**Seu gestor de conta:** {{accountManager}}
**Email:** {{managerEmail}}
**WhatsApp:** {{managerPhone}}

Qualquer dúvida, estamos à disposição!

Vamos juntos! 🚀

Equipe Valle 360`,
    variables: ['name', 'companyName', 'clientAreaLink', 'accountManager', 'managerEmail', 'managerPhone']
  },

  followup: {
    subject: 'Como foi sua experiência? - Valle 360',
    body: `Olá {{name}},

Espero que esteja tudo bem!

Gostaria de saber como estão as coisas por aí e se há algo em que possamos ajudar.

{{customMessage}}

Estou à disposição para uma conversa rápida se precisar!

Um abraço,
{{senderName}}
Valle 360`,
    variables: ['name', 'customMessage', 'senderName']
  },

  nps: {
    subject: 'Sua opinião é muito importante! ⭐',
    body: `Olá {{name}},

Queremos saber: de 0 a 10, o quanto você recomendaria a Valle 360 para um amigo ou colega?

Clique no número que representa sua avaliação:

{{npsButtons}}

Sua resposta nos ajuda a melhorar continuamente!

Obrigado pela parceria,
Equipe Valle 360`,
    variables: ['name', 'npsButtons']
  },

  report: {
    subject: '📊 Relatório Mensal de {{month}} - {{companyName}}',
    body: `Olá {{name}},

Seu relatório de performance de {{month}} está pronto!

**Destaques do mês:**
{{highlights}}

**Métricas principais:**
{{metrics}}

Acesse o relatório completo: {{reportLink}}

Agende uma reunião para discutirmos os resultados: {{scheduleLink}}

Atenciosamente,
Equipe Valle 360`,
    variables: ['name', 'companyName', 'month', 'highlights', 'metrics', 'reportLink', 'scheduleLink']
  },

  task_assigned: {
    subject: '📋 Nova tarefa atribuída: {{taskTitle}}',
    body: `Olá {{name}},

Uma nova tarefa foi atribuída a você:

**Tarefa:** {{taskTitle}}
**Cliente:** {{clientName}}
**Prioridade:** {{priority}}
**Prazo:** {{deadline}}

**Descrição:**
{{description}}

Acesse o Kanban para mais detalhes: {{kanbanLink}}

Bom trabalho!`,
    variables: ['name', 'taskTitle', 'clientName', 'priority', 'deadline', 'description', 'kanbanLink']
  },

  task_completed: {
    subject: '✅ Tarefa concluída: {{taskTitle}}',
    body: `Olá {{name}},

A tarefa "{{taskTitle}}" foi concluída com sucesso!

**Concluída por:** {{completedBy}}
**Data:** {{completedDate}}

Acesse para revisar: {{taskLink}}

Equipe Valle 360`,
    variables: ['name', 'taskTitle', 'completedBy', 'completedDate', 'taskLink']
  },

  contract_reminder: {
    subject: '📄 Seu contrato vence em {{daysUntil}} dias',
    body: `Olá {{name}},

Gostaríamos de informar que seu contrato com a Valle 360 vence em {{daysUntil}} dias ({{expirationDate}}).

Que tal renovarmos nossa parceria?

Preparamos condições especiais de renovação para você!

Agende uma conversa: {{scheduleLink}}

Atenciosamente,
Equipe Comercial Valle 360`,
    variables: ['name', 'daysUntil', 'expirationDate', 'scheduleLink']
  },

  meeting_reminder: {
    subject: '⏰ Lembrete: Reunião em {{timeUntil}}',
    body: `Olá {{name}},

Lembrete da sua reunião:

**Assunto:** {{meetingTitle}}
**Data:** {{meetingDate}}
**Horário:** {{meetingTime}}
**Link:** {{meetingLink}}

Até logo!`,
    variables: ['name', 'timeUntil', 'meetingTitle', 'meetingDate', 'meetingTime', 'meetingLink']
  },

  birthday: {
    subject: '🎂 Feliz Aniversário, {{name}}!',
    body: `Olá {{name}},

Toda a equipe Valle 360 deseja a você um feliz aniversário! 🎉

Que seu dia seja repleto de alegrias e realizações.

Obrigado por fazer parte da nossa história!

Com carinho,
Equipe Valle 360`,
    variables: ['name']
  },

  inactive_client: {
    subject: 'Sentimos sua falta! 💙',
    body: `Olá {{name}},

Notamos que faz {{daysSinceLastContact}} dias que não nos falamos.

Está tudo bem? Gostariamos de saber como podemos ajudar.

{{customMessage}}

Podemos agendar uma conversa rápida?

Abraços,
{{senderName}}
Valle 360`,
    variables: ['name', 'daysSinceLastContact', 'customMessage', 'senderName']
  }
};

// =====================================================
// SERVIÇO DE AUTOMAÇÃO
// =====================================================

class EmailAutomationService {
  /**
   * Converte markdown básico para HTML
   */
  private markdownToHtml(markdown: string): string {
    return markdown
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>');
  }

  /**
   * Renderiza template com variáveis
   */
  private renderTemplate(template: string, variables: Record<string, any>): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }
    return result;
  }

  /**
   * Gera conteúdo personalizado com IA
   */
  async generatePersonalizedContent(
    type: EmailType,
    recipient: EmailRecipient,
    context: EmailContext
  ): Promise<{ subject: string; body: string }> {
    const template = EMAIL_TEMPLATES[type];
    if (!template) throw new Error(`Template não encontrado: ${type}`);

    try {
      const result = await generateWithAI({
        task: 'copywriting',
        json: true,
        temperature: 0.7,
        maxTokens: 900,
        entityType: 'email_personalization',
        entityId: null,
        messages: [
          {
            role: 'system',
            content: `Você é um especialista em comunicação empresarial.
Personalize o email abaixo para ser mais humano e efetivo, mantendo o tom profissional.
Adapte a mensagem ao contexto do destinatário.

Template original:
Assunto: ${template.subject}
Corpo: ${template.body}

Retorne JSON: { "subject": "assunto personalizado", "body": "corpo personalizado em markdown" }`
          },
          {
            role: 'user',
            content: JSON.stringify({
              recipient,
              context,
              type
            })
          }
        ],
      });

      const parsed = result.json || null;
      if (!parsed?.subject || !parsed?.body) {
        throw new Error('Resposta inválida');
      }

      return {
        subject: this.renderTemplate(parsed.subject, { ...recipient, ...context }),
        body: this.renderTemplate(parsed.body, { ...recipient, ...context })
      };
    } catch {
      // Fallback para template padrão
      return {
        subject: this.renderTemplate(template.subject, { ...recipient, ...context }),
        body: this.renderTemplate(template.body, { ...recipient, ...context })
      };
    }
  }

  /**
   * Envia email
   */
  async sendEmail(email: AutomatedEmail): Promise<{ success: boolean; messageId?: string; error?: string; mailtoUrl?: string }> {
    try {
      // Gerar conteúdo personalizado
      const { subject, body } = await this.generatePersonalizedContent(
        email.type,
        email.recipient,
        email.context
      );
      const htmlBody = this.markdownToHtml(body);

      const result = await sendEmailWithFallback({
        to: email.recipient.email,
        subject,
        text: body,
        html: htmlBody,
      });

      return {
        success: result.success,
        error: result.error,
        mailtoUrl: result.mailtoUrl,
      };
    } catch (error: any) {
      console.error('Erro ao enviar email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Agenda envio de email
   */
  async scheduleEmail(
    type: EmailType,
    recipient: EmailRecipient,
    context: EmailContext,
    scheduledFor: Date
  ): Promise<AutomatedEmail> {
    const email: AutomatedEmail = {
      type,
      recipient,
      context,
      scheduledFor,
      status: 'pending'
    };

    // TODO: Salvar no banco de dados
    // await supabase.from('scheduled_emails').insert(email);

    return email;
  }

  /**
   * Envia email de cobrança
   */
  async sendCollectionEmail(
    recipient: EmailRecipient,
    context: {
      value: number;
      dueDate: string;
      daysOverdue?: number;
      paymentLink?: string;
    }
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    let type: EmailType = 'collection';
    
    if (context.daysOverdue) {
      if (context.daysOverdue > 15) {
        type = 'collection_urgent';
      } else if (context.daysOverdue > 0) {
        type = 'collection_reminder';
      }
    }

    return this.sendEmail({
      type,
      recipient,
      context: {
        ...context,
        value: context.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
        month: new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      },
      status: 'pending'
    });
  }

  /**
   * Envia email de boas-vindas
   */
  async sendWelcomeEmail(
    recipient: EmailRecipient,
    context: {
      accountManager: string;
      managerEmail: string;
      managerPhone: string;
      clientAreaLink?: string;
    }
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.sendEmail({
      type: 'welcome',
      recipient,
      context: {
        ...context,
        clientAreaLink: context.clientAreaLink || 'https://valle360.com.br/cliente'
      },
      status: 'pending'
    });
  }

  /**
   * Envia pesquisa NPS
   */
  async sendNPSEmail(
    recipient: EmailRecipient,
    npsLink: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // Gerar botões de NPS
    const npsButtons = Array.from({ length: 11 }, (_, i) => 
      `<a href="${npsLink}?score=${i}" style="display:inline-block;padding:10px 15px;margin:2px;background:${i <= 6 ? '#ef4444' : i <= 8 ? '#f59e0b' : '#22c55e'};color:white;text-decoration:none;border-radius:5px;">${i}</a>`
    ).join('');

    return this.sendEmail({
      type: 'nps',
      recipient,
      context: { npsButtons },
      status: 'pending'
    });
  }

  /**
   * Envia relatório mensal
   */
  async sendMonthlyReport(
    recipient: EmailRecipient,
    context: {
      month: string;
      highlights: string[];
      metrics: Record<string, any>;
      reportLink: string;
    }
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.sendEmail({
      type: 'report',
      recipient,
      context: {
        ...context,
        highlights: context.highlights.map(h => `• ${h}`).join('\n'),
        metrics: Object.entries(context.metrics)
          .map(([k, v]) => `• ${k}: ${v}`)
          .join('\n')
      },
      status: 'pending'
    });
  }
}

export const emailAutomation = new EmailAutomationService();
export default emailAutomation;

