// WhatsApp Cloud API Client

const WHATSAPP_API_VERSION = 'v18.0';
const WHATSAPP_API_BASE = `https://graph.facebook.com/${WHATSAPP_API_VERSION}`;

export interface WhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
  businessId?: string;
  webhookVerifyToken?: string;
}

export interface WhatsAppMessage {
  to: string;
  type: 'text' | 'image' | 'document' | 'template' | 'interactive';
  text?: { body: string };
  image?: { link: string; caption?: string };
  document?: { link: string; filename: string; caption?: string };
  template?: {
    name: string;
    language: { code: string };
    components?: any[];
  };
  interactive?: any;
}

export interface WhatsAppMessageResponse {
  messaging_product: string;
  contacts: Array<{ input: string; wa_id: string }>;
  messages: Array<{ id: string }>;
}

export class WhatsAppClient {
  private accessToken: string;
  private phoneNumberId: string;
  private businessId?: string;

  constructor(config: WhatsAppConfig) {
    this.accessToken = config.accessToken;
    this.phoneNumberId = config.phoneNumberId;
    this.businessId = config.businessId;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${WHATSAPP_API_BASE}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(`WhatsApp API Error: ${data.error.message}`);
    }

    return data;
  }

  // ========== MENSAGENS ==========

  // Enviar mensagem de texto
  async sendTextMessage(
    to: string, 
    text: string,
    previewUrl: boolean = false
  ): Promise<WhatsAppMessageResponse> {
    return this.request(`/${this.phoneNumberId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: this.formatPhoneNumber(to),
        type: 'text',
        text: { 
          preview_url: previewUrl,
          body: text 
        }
      })
    });
  }

  // Enviar imagem
  async sendImage(
    to: string,
    imageUrl: string,
    caption?: string
  ): Promise<WhatsAppMessageResponse> {
    return this.request(`/${this.phoneNumberId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: this.formatPhoneNumber(to),
        type: 'image',
        image: {
          link: imageUrl,
          caption
        }
      })
    });
  }

  // Enviar documento
  async sendDocument(
    to: string,
    documentUrl: string,
    filename: string,
    caption?: string
  ): Promise<WhatsAppMessageResponse> {
    return this.request(`/${this.phoneNumberId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: this.formatPhoneNumber(to),
        type: 'document',
        document: {
          link: documentUrl,
          filename,
          caption
        }
      })
    });
  }

  // Enviar template
  async sendTemplate(
    to: string,
    templateName: string,
    languageCode: string = 'pt_BR',
    components?: Array<{
      type: 'header' | 'body' | 'button';
      parameters: Array<{
        type: 'text' | 'currency' | 'date_time' | 'image' | 'document';
        text?: string;
        currency?: { fallback_value: string; code: string; amount_1000: number };
        date_time?: { fallback_value: string };
        image?: { link: string };
        document?: { link: string };
      }>;
    }>
  ): Promise<WhatsAppMessageResponse> {
    return this.request(`/${this.phoneNumberId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: this.formatPhoneNumber(to),
        type: 'template',
        template: {
          name: templateName,
          language: { code: languageCode },
          components
        }
      })
    });
  }

  // Enviar mensagem interativa (botões)
  async sendInteractiveButtons(
    to: string,
    body: string,
    buttons: Array<{ id: string; title: string }>,
    header?: string,
    footer?: string
  ): Promise<WhatsAppMessageResponse> {
    const interactive: any = {
      type: 'button',
      body: { text: body },
      action: {
        buttons: buttons.map(btn => ({
          type: 'reply',
          reply: { id: btn.id, title: btn.title }
        }))
      }
    };

    if (header) interactive.header = { type: 'text', text: header };
    if (footer) interactive.footer = { text: footer };

    return this.request(`/${this.phoneNumberId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: this.formatPhoneNumber(to),
        type: 'interactive',
        interactive
      })
    });
  }

  // Enviar mensagem interativa (lista)
  async sendInteractiveList(
    to: string,
    body: string,
    buttonText: string,
    sections: Array<{
      title: string;
      rows: Array<{ id: string; title: string; description?: string }>;
    }>,
    header?: string,
    footer?: string
  ): Promise<WhatsAppMessageResponse> {
    const interactive: any = {
      type: 'list',
      body: { text: body },
      action: {
        button: buttonText,
        sections
      }
    };

    if (header) interactive.header = { type: 'text', text: header };
    if (footer) interactive.footer = { text: footer };

    return this.request(`/${this.phoneNumberId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: this.formatPhoneNumber(to),
        type: 'interactive',
        interactive
      })
    });
  }

  // Marcar mensagem como lida
  async markAsRead(messageId: string): Promise<{ success: boolean }> {
    return this.request(`/${this.phoneNumberId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId
      })
    });
  }

  // ========== MÍDIA ==========

  // Upload de mídia
  async uploadMedia(
    file: ArrayBuffer | Uint8Array | number[],
    mimeType: string,
    filename: string
  ): Promise<{ id: string }> {
    const formData = new FormData();
    // Criar Blob a partir dos dados
    let blobData: BlobPart;
    if (file instanceof ArrayBuffer) {
      blobData = file;
    } else if (Array.isArray(file)) {
      blobData = new Uint8Array(file);
    } else {
      // Uint8Array - criar cópia para garantir compatibilidade
      blobData = new Uint8Array(file);
    }
    formData.append('file', new Blob([blobData], { type: mimeType }), filename);
    formData.append('messaging_product', 'whatsapp');
    formData.append('type', mimeType);

    const response = await fetch(`${WHATSAPP_API_BASE}/${this.phoneNumberId}/media`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      },
      body: formData
    });

    return response.json();
  }

  // Obter URL da mídia
  async getMediaUrl(mediaId: string): Promise<{ url: string; mime_type: string; sha256: string; file_size: number }> {
    return this.request(`/${mediaId}`);
  }

  // ========== TEMPLATES ==========

  // Listar templates
  async listTemplates(): Promise<{
    data: Array<{
      name: string;
      status: string;
      category: string;
      language: string;
      components: any[];
    }>;
  }> {
    if (!this.businessId) throw new Error('Business ID não configurado');
    return this.request(`/${this.businessId}/message_templates`);
  }

  // ========== PERFIL ==========

  // Obter perfil do número
  async getBusinessProfile(): Promise<{
    data: Array<{
      about: string;
      address: string;
      description: string;
      email: string;
      profile_picture_url: string;
      websites: string[];
      vertical: string;
    }>;
  }> {
    return this.request(`/${this.phoneNumberId}/whatsapp_business_profile?fields=about,address,description,email,profile_picture_url,websites,vertical`);
  }

  // Atualizar perfil
  async updateBusinessProfile(data: {
    about?: string;
    address?: string;
    description?: string;
    email?: string;
    websites?: string[];
    vertical?: string;
  }): Promise<{ success: boolean }> {
    return this.request(`/${this.phoneNumberId}/whatsapp_business_profile`, {
      method: 'POST',
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        ...data
      })
    });
  }

  // ========== HELPERS ==========

  private formatPhoneNumber(phone: string): string {
    // Remover caracteres não numéricos
    let formatted = phone.replace(/\D/g, '');
    
    // Adicionar código do país se não tiver
    if (!formatted.startsWith('55') && formatted.length <= 11) {
      formatted = '55' + formatted;
    }
    
    return formatted;
  }
}

// Função helper para criar cliente
export function createWhatsAppClient(config: WhatsAppConfig): WhatsAppClient {
  return new WhatsAppClient(config);
}

// Testar conexão
export async function testWhatsAppConnection(
  accessToken: string, 
  phoneNumberId: string
): Promise<boolean> {
  try {
    const client = new WhatsAppClient({ accessToken, phoneNumberId });
    await client.getBusinessProfile();
    return true;
  } catch {
    return false;
  }
}

// Verificar webhook
export function verifyWebhook(
  mode: string,
  token: string,
  challenge: string,
  verifyToken: string
): string | null {
  if (mode === 'subscribe' && token === verifyToken) {
    return challenge;
  }
  return null;
}

// Processar webhook
export interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: { name: string };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: string;
          text?: { body: string };
          image?: { id: string; mime_type: string; sha256: string };
          document?: { id: string; mime_type: string; sha256: string; filename: string };
          button?: { text: string; payload: string };
          interactive?: { type: string; button_reply?: { id: string; title: string }; list_reply?: { id: string; title: string } };
        }>;
        statuses?: Array<{
          id: string;
          status: 'sent' | 'delivered' | 'read' | 'failed';
          timestamp: string;
          recipient_id: string;
          errors?: Array<{ code: number; title: string }>;
        }>;
      };
      field: string;
    }>;
  }>;
}

export function parseWebhookPayload(payload: WhatsAppWebhookPayload): {
  messages: Array<{
    from: string;
    name?: string;
    id: string;
    timestamp: Date;
    type: string;
    content: any;
  }>;
  statuses: Array<{
    messageId: string;
    status: string;
    timestamp: Date;
    to: string;
    error?: string;
  }>;
} {
  const messages: any[] = [];
  const statuses: any[] = [];

  for (const entry of payload.entry) {
    for (const change of entry.changes) {
      const value = change.value;

      // Processar mensagens
      if (value.messages) {
        for (const msg of value.messages) {
          const contact = value.contacts?.find(c => c.wa_id === msg.from);
          messages.push({
            from: msg.from,
            name: contact?.profile?.name,
            id: msg.id,
            timestamp: new Date(parseInt(msg.timestamp) * 1000),
            type: msg.type,
            content: msg.text?.body || msg.image || msg.document || msg.button || msg.interactive
          });
        }
      }

      // Processar status
      if (value.statuses) {
        for (const status of value.statuses) {
          statuses.push({
            messageId: status.id,
            status: status.status,
            timestamp: new Date(parseInt(status.timestamp) * 1000),
            to: status.recipient_id,
            error: status.errors?.[0]?.title
          });
        }
      }
    }
  }

  return { messages, statuses };
}

