// Email Service Integration - Valle 360
// Suporta SendGrid e SMTP genérico

interface EmailConfig {
  provider: 'sendgrid' | 'smtp';
  sendgridApiKey?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  fromEmail: string;
  fromName: string;
}

interface EmailMessage {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  templateId?: string;
  templateData?: Record<string, any>;
  attachments?: {
    filename: string;
    content: string; // base64
    type: string;
  }[];
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
}

// Templates de email pré-definidos
export const EMAIL_TEMPLATES = {
  WELCOME: {
    subject: 'Bem-vindo à Valle 360! 🎉',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #4370d1 0%, #0f1b35 100%); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0;">Valle 360</h1>
        </div>
        <div style="padding: 40px; background: #f9fafb;">
          <h2 style="color: #1f2937;">Olá, {{name}}!</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            Seja muito bem-vindo(a) à Valle 360! Estamos muito felizes em ter você conosco.
          </p>
          <p style="color: #4b5563; line-height: 1.6;">
            Seu acesso está pronto. Clique no botão abaixo para acessar seu portal:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{portalLink}}" style="background: #4370d1; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Acessar Portal
            </a>
          </div>
          <p style="color: #4b5563; line-height: 1.6;">
            Qualquer dúvida, é só responder este email ou falar com a Val, nossa assistente virtual.
          </p>
          <p style="color: #4b5563; line-height: 1.6;">
            Abraços,<br>
            <strong>Equipe Valle 360</strong>
          </p>
        </div>
        <div style="background: #1f2937; padding: 20px; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            © 2024 Valle 360. Todos os direitos reservados.
          </p>
        </div>
      </div>
    `
  },

  INVOICE: {
    subject: 'Fatura #{{invoiceNumber}} - Valle 360',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #4370d1 0%, #0f1b35 100%); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0;">Valle 360</h1>
        </div>
        <div style="padding: 40px; background: #f9fafb;">
          <h2 style="color: #1f2937;">Olá, {{name}}!</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            Sua fatura #{{invoiceNumber}} no valor de <strong>R$ {{amount}}</strong> está disponível.
          </p>
          <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; color: #6b7280;">Número da Fatura:</td>
                <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #1f2937;">#{{invoiceNumber}}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #6b7280;">Valor:</td>
                <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #1f2937;">R$ {{amount}}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #6b7280;">Vencimento:</td>
                <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #1f2937;">{{dueDate}}</td>
              </tr>
            </table>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{paymentLink}}" style="background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Pagar Agora
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            Dúvidas sobre esta fatura? Responda este email ou entre em contato com nosso financeiro.
          </p>
        </div>
        <div style="background: #1f2937; padding: 20px; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            © 2024 Valle 360. Todos os direitos reservados.
          </p>
        </div>
      </div>
    `
  },

  PAYMENT_REMINDER: {
    subject: '⚠️ Lembrete: Fatura #{{invoiceNumber}} vence em breve',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0;">⏰ Lembrete de Pagamento</h1>
        </div>
        <div style="padding: 40px; background: #f9fafb;">
          <h2 style="color: #1f2937;">Olá, {{name}}!</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            Este é um lembrete amigável de que sua fatura <strong>#{{invoiceNumber}}</strong> vence em <strong>{{daysUntilDue}} dias</strong>.
          </p>
          <div style="background: #fef3c7; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; color: #92400e;">
              <strong>Valor:</strong> R$ {{amount}}<br>
              <strong>Vencimento:</strong> {{dueDate}}
            </p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{paymentLink}}" style="background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Pagar Agora
            </a>
          </div>
        </div>
        <div style="background: #1f2937; padding: 20px; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            © 2024 Valle 360. Todos os direitos reservados.
          </p>
        </div>
      </div>
    `
  },

  APPROVAL_REQUEST: {
    subject: '📋 Conteúdo aguardando sua aprovação - Valle 360',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0;">Aprovação Pendente</h1>
        </div>
        <div style="padding: 40px; background: #f9fafb;">
          <h2 style="color: #1f2937;">Olá, {{name}}!</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            Você tem <strong>{{pendingCount}} item(ns)</strong> aguardando sua aprovação.
          </p>
          <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
            {{itemsList}}
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{approvalLink}}" style="background: #8b5cf6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Ver e Aprovar
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            Leva menos de 2 minutos! Sua aprovação é importante para mantermos o cronograma.
          </p>
        </div>
        <div style="background: #1f2937; padding: 20px; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            © 2024 Valle 360. Todos os direitos reservados.
          </p>
        </div>
      </div>
    `
  },

  REPORT: {
    subject: '📊 Relatório {{reportType}} - {{period}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0;">Relatório {{reportType}}</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0;">{{period}}</p>
        </div>
        <div style="padding: 40px; background: #f9fafb;">
          <h2 style="color: #1f2937;">Olá!</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            Segue em anexo o relatório {{reportType}} referente ao período de {{period}}.
          </p>
          <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
            <h3 style="color: #1f2937; margin-top: 0;">Destaques:</h3>
            {{highlights}}
          </div>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            Para mais detalhes, acesse o arquivo PDF em anexo ou visite o portal.
          </p>
        </div>
        <div style="background: #1f2937; padding: 20px; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            © 2024 Valle 360. Todos os direitos reservados.
          </p>
        </div>
      </div>
    `
  },

  NPS_REQUEST: {
    subject: '💜 Como estamos indo? Queremos ouvir você!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0;">Sua opinião importa!</h1>
        </div>
        <div style="padding: 40px; background: #f9fafb;">
          <h2 style="color: #1f2937;">Olá, {{name}}!</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            Gostaríamos de saber como está sendo sua experiência com a Valle 360.
          </p>
          <p style="color: #4b5563; line-height: 1.6;">
            <strong>De 0 a 10, o quanto você recomendaria a Valle 360 para um amigo ou colega?</strong>
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <table style="margin: 0 auto;">
              <tr>
                {{npsButtons}}
              </tr>
            </table>
          </div>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
            Clique em um número para avaliar. Leva apenas 10 segundos!
          </p>
        </div>
        <div style="background: #1f2937; padding: 20px; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            © 2024 Valle 360. Todos os direitos reservados.
          </p>
        </div>
      </div>
    `
  }
};

class EmailService {
  private config: EmailConfig | null = null;

  private getConfig(): EmailConfig {
    if (!this.config) {
      this.config = {
        provider: (process.env.EMAIL_PROVIDER as 'sendgrid' | 'smtp') || 'sendgrid',
        sendgridApiKey: process.env.SENDGRID_API_KEY,
        smtpHost: process.env.SMTP_HOST,
        smtpPort: parseInt(process.env.SMTP_PORT || '587'),
        smtpUser: process.env.SMTP_USER,
        smtpPassword: process.env.SMTP_PASSWORD,
        fromEmail: process.env.EMAIL_FROM || 'noreply@valle360.com',
        fromName: process.env.EMAIL_FROM_NAME || 'Valle 360'
      };
    }
    return this.config;
  }

  // Enviar email via SendGrid
  private async sendViaSendGrid(message: EmailMessage): Promise<{ success: boolean; error?: string }> {
    const config = this.getConfig();
    
    try {
      const recipients = Array.isArray(message.to) ? message.to : [message.to];
      
      const payload: any = {
        personalizations: [{
          to: recipients.map(email => ({ email })),
          ...(message.cc && { cc: message.cc.map(email => ({ email })) }),
          ...(message.bcc && { bcc: message.bcc.map(email => ({ email })) }),
          ...(message.templateData && { dynamic_template_data: message.templateData })
        }],
        from: {
          email: config.fromEmail,
          name: config.fromName
        },
        subject: message.subject,
        ...(message.replyTo && { reply_to: { email: message.replyTo } })
      };

      if (message.templateId) {
        payload.template_id = message.templateId;
      } else {
        payload.content = [];
        if (message.text) {
          payload.content.push({ type: 'text/plain', value: message.text });
        }
        if (message.html) {
          payload.content.push({ type: 'text/html', value: message.html });
        }
      }

      if (message.attachments) {
        payload.attachments = message.attachments.map(att => ({
          content: att.content,
          filename: att.filename,
          type: att.type,
          disposition: 'attachment'
        }));
      }

      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.sendgridApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('SendGrid error:', error);
        return { success: false, error: 'Erro ao enviar email' };
      }

      return { success: true };
    } catch (error) {
      console.error('Erro SendGrid:', error);
      return { success: false, error: 'Erro de conexão' };
    }
  }

  // Enviar email (método principal)
  async send(message: EmailMessage): Promise<{ success: boolean; error?: string }> {
    const config = this.getConfig();
    
    if (config.provider === 'sendgrid') {
      return this.sendViaSendGrid(message);
    }
    
    // Para SMTP, em produção usaria nodemailer
    console.log('SMTP não implementado, usando SendGrid como fallback');
    return this.sendViaSendGrid(message);
  }

  // Substituir variáveis no template
  private replaceVariables(template: string, data: Record<string, any>): string {
    let result = template;
    for (const [key, value] of Object.entries(data)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }
    return result;
  }

  // Enviar email de boas-vindas
  async sendWelcome(to: string, name: string, portalLink: string) {
    const template = EMAIL_TEMPLATES.WELCOME;
    return this.send({
      to,
      subject: this.replaceVariables(template.subject, { name }),
      html: this.replaceVariables(template.html, { name, portalLink })
    });
  }

  // Enviar fatura
  async sendInvoice(
    to: string,
    name: string,
    invoiceNumber: string,
    amount: string,
    dueDate: string,
    paymentLink: string
  ) {
    const template = EMAIL_TEMPLATES.INVOICE;
    return this.send({
      to,
      subject: this.replaceVariables(template.subject, { invoiceNumber }),
      html: this.replaceVariables(template.html, { name, invoiceNumber, amount, dueDate, paymentLink })
    });
  }

  // Enviar lembrete de pagamento
  async sendPaymentReminder(
    to: string,
    name: string,
    invoiceNumber: string,
    amount: string,
    dueDate: string,
    daysUntilDue: number,
    paymentLink: string
  ) {
    const template = EMAIL_TEMPLATES.PAYMENT_REMINDER;
    return this.send({
      to,
      subject: this.replaceVariables(template.subject, { invoiceNumber }),
      html: this.replaceVariables(template.html, { 
        name, invoiceNumber, amount, dueDate, daysUntilDue: daysUntilDue.toString(), paymentLink 
      })
    });
  }

  // Enviar solicitação de aprovação
  async sendApprovalRequest(
    to: string,
    name: string,
    pendingCount: number,
    itemsList: string,
    approvalLink: string
  ) {
    const template = EMAIL_TEMPLATES.APPROVAL_REQUEST;
    return this.send({
      to,
      subject: template.subject,
      html: this.replaceVariables(template.html, { 
        name, pendingCount: pendingCount.toString(), itemsList, approvalLink 
      })
    });
  }

  // Enviar relatório
  async sendReport(
    to: string | string[],
    reportType: string,
    period: string,
    highlights: string,
    pdfAttachment?: { content: string; filename: string }
  ) {
    const template = EMAIL_TEMPLATES.REPORT;
    return this.send({
      to,
      subject: this.replaceVariables(template.subject, { reportType, period }),
      html: this.replaceVariables(template.html, { reportType, period, highlights }),
      attachments: pdfAttachment ? [{
        content: pdfAttachment.content,
        filename: pdfAttachment.filename,
        type: 'application/pdf'
      }] : undefined
    });
  }

  // Enviar pesquisa NPS
  async sendNPSRequest(to: string, name: string, surveyBaseUrl: string) {
    const template = EMAIL_TEMPLATES.NPS_REQUEST;
    
    // Gerar botões de 0-10
    const npsButtons = Array.from({ length: 11 }, (_, i) => {
      const color = i <= 6 ? '#ef4444' : i <= 8 ? '#f59e0b' : '#10b981';
      return `<td style="padding: 2px;">
        <a href="${surveyBaseUrl}?score=${i}" style="display: inline-block; width: 36px; height: 36px; line-height: 36px; text-align: center; background: ${color}; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">${i}</a>
      </td>`;
    }).join('');

    return this.send({
      to,
      subject: template.subject,
      html: this.replaceVariables(template.html, { name, npsButtons })
    });
  }
}

export const emailService = new EmailService();
export default emailService;









