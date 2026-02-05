// SendGrid Email Integration

const SENDGRID_API_BASE = 'https://api.sendgrid.com/v3';

export interface SendGridConfig {
  apiKey: string;
  fromEmail: string;
  fromName?: string;
}

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailAttachment {
  content: string; // Base64 encoded
  filename: string;
  type: string;
  disposition?: 'attachment' | 'inline';
  contentId?: string;
}

export interface SendEmailOptions {
  to: EmailRecipient | EmailRecipient[];
  subject: string;
  text?: string;
  html?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  replyTo?: EmailRecipient;
  attachments?: EmailAttachment[];
  categories?: string[];
  customArgs?: Record<string, string>;
  sendAt?: number; // Unix timestamp
  headers?: Record<string, string>;
}

export interface SendEmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  mailtoUrl?: string;
}

export class SendGridClient {
  private apiKey: string;
  private fromEmail: string;
  private fromName?: string;

  constructor(config: SendGridConfig) {
    this.apiKey = config.apiKey;
    this.fromEmail = config.fromEmail;
    this.fromName = config.fromName;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${SENDGRID_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    // SendGrid retorna 202 para sucesso em envio de email
    if (response.status === 202 || response.status === 200 || response.status === 201) {
      const text = await response.text();
      return (text ? JSON.parse(text) : { success: true }) as T;
    }

    const error = await response.json();
    throw new Error(error.errors?.[0]?.message || 'Erro na API SendGrid');
  }

  // ========== ENVIO DE EMAILS ==========

  async sendEmail(options: SendEmailOptions): Promise<SendEmailResponse> {
    const toArray = Array.isArray(options.to) ? options.to : [options.to];
    const toEmail = toArray[0]?.email || '';
    const subject = options.subject || '';
    const rawBody = options.text || options.html || '';
    const body = rawBody.replace(/<[^>]+>/g, '').trim();
    const mailtoUrl = `mailto:${toEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    return { success: true, mailtoUrl };
  }

  // Envio em lote
  async sendBulkEmail(
    recipients: Array<{ email: string; name?: string; data?: Record<string, any> }>,
    options: Omit<SendEmailOptions, 'to' | 'dynamicTemplateData'>
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    return {
      success: 0,
      failed: recipients.length,
      errors: ['Envio em lote não suportado via mailto. Use envio manual.'],
    };
  }

  // ========== TEMPLATES ==========

  async listTemplates(): Promise<{
    templates: Array<{
      id: string;
      name: string;
      generation: string;
      updated_at: string;
      versions: Array<{
        id: string;
        name: string;
        active: number;
        subject: string;
      }>;
    }>;
  }> {
    return this.request('/templates?generations=dynamic');
  }

  async getTemplate(templateId: string): Promise<{
    id: string;
    name: string;
    versions: Array<{
      id: string;
      name: string;
      subject: string;
      html_content: string;
      plain_content: string;
    }>;
  }> {
    return this.request(`/templates/${templateId}`);
  }

  // ========== ESTATÍSTICAS ==========

  async getStats(
    startDate: string,
    endDate?: string
  ): Promise<Array<{
    date: string;
    stats: Array<{
      metrics: {
        requests: number;
        delivered: number;
        opens: number;
        clicks: number;
        bounces: number;
        spam_reports: number;
        unsubscribes: number;
      };
    }>;
  }>> {
    let url = `/stats?start_date=${startDate}`;
    if (endDate) url += `&end_date=${endDate}`;
    return this.request(url);
  }

  async getCategoryStats(
    category: string,
    startDate: string,
    endDate?: string
  ): Promise<any> {
    let url = `/categories/${category}/stats?start_date=${startDate}`;
    if (endDate) url += `&end_date=${endDate}`;
    return this.request(url);
  }

  // ========== CONTATOS ==========

  async addContact(
    email: string,
    data?: {
      firstName?: string;
      lastName?: string;
      customFields?: Record<string, any>;
      listIds?: string[];
    }
  ): Promise<{ job_id: string }> {
    const contact: any = { email };
    if (data?.firstName) contact.first_name = data.firstName;
    if (data?.lastName) contact.last_name = data.lastName;
    if (data?.customFields) contact.custom_fields = data.customFields;

    const payload: any = { contacts: [contact] };
    if (data?.listIds) payload.list_ids = data.listIds;

    return this.request('/marketing/contacts', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  }

  async searchContacts(query: string): Promise<{
    result: Array<{
      id: string;
      email: string;
      first_name?: string;
      last_name?: string;
      created_at: string;
      updated_at: string;
    }>;
    contact_count: number;
  }> {
    return this.request('/marketing/contacts/search', {
      method: 'POST',
      body: JSON.stringify({ query })
    });
  }

  async deleteContact(contactId: string): Promise<{ job_id: string }> {
    return this.request(`/marketing/contacts?ids=${contactId}`, {
      method: 'DELETE'
    });
  }

  // ========== LISTAS ==========

  async getLists(): Promise<{
    result: Array<{
      id: string;
      name: string;
      contact_count: number;
    }>;
  }> {
    return this.request('/marketing/lists');
  }

  async createList(name: string): Promise<{ id: string; name: string }> {
    return this.request('/marketing/lists', {
      method: 'POST',
      body: JSON.stringify({ name })
    });
  }

  // ========== SUPRESSÕES ==========

  async addToSuppressionList(
    emails: string[],
    type: 'bounces' | 'blocks' | 'spam_reports' | 'unsubscribes'
  ): Promise<void> {
    const endpoint = type === 'unsubscribes' 
      ? '/asm/suppressions/global'
      : `/suppression/${type}`;
    
    await this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify({ 
        recipient_emails: emails 
      })
    });
  }

  async getSuppressionList(
    type: 'bounces' | 'blocks' | 'spam_reports' | 'unsubscribes'
  ): Promise<Array<{ email: string; created: number; reason?: string }>> {
    const endpoint = type === 'unsubscribes'
      ? '/asm/suppressions/global'
      : `/suppression/${type}`;
    return this.request(endpoint);
  }
}

// Função helper para criar cliente
export function createSendGridClient(config: SendGridConfig): SendGridClient {
  return new SendGridClient(config);
}

// Testar conexão
export async function testSendGridConnection(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(`${SENDGRID_API_BASE}/user/profile`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    return response.ok;
  } catch {
    return false;
  }
}

// ========== EMAIL TEMPLATES ÚTEIS ==========

export const EMAIL_TEMPLATES = {
  // Template de boas-vindas
  welcome: (name: string, companyName: string) => ({
    subject: `Bem-vindo à ${companyName}! 🎉`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #4370d1;">Olá, ${name}!</h1>
        <p>Seja muito bem-vindo(a) à ${companyName}!</p>
        <p>Estamos muito felizes em ter você conosco. A partir de agora, você terá acesso a todas as nossas ferramentas e recursos.</p>
        <p>Se precisar de ajuda, não hesite em entrar em contato.</p>
        <p>Abraços,<br/>Equipe ${companyName}</p>
      </div>
    `
  }),

  // Template de notificação
  notification: (title: string, message: string, actionUrl?: string, actionText?: string) => ({
    subject: title,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">${title}</h2>
        <p>${message}</p>
        ${actionUrl ? `
          <p style="margin-top: 20px;">
            <a href="${actionUrl}" style="background-color: #4370d1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              ${actionText || 'Ver mais'}
            </a>
          </p>
        ` : ''}
      </div>
    `
  }),

  // Template de reunião agendada
  meetingScheduled: (
    clientName: string,
    date: string,
    time: string,
    meetLink: string,
    description?: string
  ) => ({
    subject: `Reunião Agendada - ${date} às ${time}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4370d1;">Reunião Confirmada! 📅</h2>
        <p>Olá ${clientName},</p>
        <p>Sua reunião foi agendada com sucesso.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Data:</strong> ${date}</p>
          <p><strong>Horário:</strong> ${time}</p>
          ${description ? `<p><strong>Descrição:</strong> ${description}</p>` : ''}
        </div>
        <p>
          <a href="${meetLink}" style="background-color: #4370d1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Entrar na Reunião
          </a>
        </p>
        <p style="color: #666; font-size: 12px; margin-top: 20px;">
          Adicione este evento ao seu calendário para não esquecer!
        </p>
      </div>
    `
  }),

  // Template de fatura
  invoice: (
    clientName: string,
    invoiceNumber: string,
    amount: string,
    dueDate: string,
    paymentLink: string
  ) => ({
    subject: `Fatura #${invoiceNumber} - Pagamento Pendente`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Fatura #${invoiceNumber}</h2>
        <p>Olá ${clientName},</p>
        <p>Segue sua fatura para pagamento:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Valor:</strong> ${amount}</p>
          <p><strong>Vencimento:</strong> ${dueDate}</p>
        </div>
        <p>
          <a href="${paymentLink}" style="background-color: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Pagar Agora
          </a>
        </p>
      </div>
    `
  })
};

