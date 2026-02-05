/**
 * WhatsApp Business API Integration
 * Supports both Meta WhatsApp Business API and Evolution API
 */

// Types
export interface WhatsAppConfig {
  provider: 'meta' | 'evolution' | 'twilio';
  apiUrl?: string;
  accessToken: string;
  phoneNumberId?: string; // For Meta
  instanceName?: string; // For Evolution
  accountSid?: string; // For Twilio
}

export interface WhatsAppMessage {
  to: string; // Phone number with country code (e.g., 5511999999999)
  type: 'text' | 'template' | 'image' | 'document' | 'audio' | 'video';
  text?: string;
  template?: {
    name: string;
    language: string;
    components?: any[];
  };
  media?: {
    url: string;
    caption?: string;
    filename?: string;
  };
}

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Configuration from environment
function getConfig(): WhatsAppConfig {
  const provider = (process.env.WHATSAPP_PROVIDER || 'meta') as WhatsAppConfig['provider'];
  
  switch (provider) {
    case 'evolution':
      return {
        provider: 'evolution',
        apiUrl: process.env.EVOLUTION_API_URL || 'https://api.evolution.com',
        accessToken: process.env.EVOLUTION_API_KEY || '',
        instanceName: process.env.EVOLUTION_INSTANCE_NAME || 'valle360',
      };
    case 'twilio':
      return {
        provider: 'twilio',
        accessToken: process.env.TWILIO_AUTH_TOKEN || '',
        accountSid: process.env.TWILIO_ACCOUNT_SID || '',
        phoneNumberId: process.env.TWILIO_WHATSAPP_NUMBER || '',
      };
    default:
      return {
        provider: 'meta',
        apiUrl: 'https://graph.facebook.com/v18.0',
        accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
        phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
      };
  }
}

/**
 * Send a WhatsApp message
 */
export async function sendWhatsAppMessage(message: WhatsAppMessage): Promise<WhatsAppSendResult> {
  const config = getConfig();
  
  if (!config.accessToken) {
    console.warn('WhatsApp not configured');
    return { success: false, error: 'WhatsApp not configured' };
  }

  try {
    switch (config.provider) {
      case 'meta':
        return await sendViaMeta(config, message);
      case 'evolution':
        return await sendViaEvolution(config, message);
      case 'twilio':
        return await sendViaTwilio(config, message);
      default:
        return { success: false, error: 'Unknown provider' };
    }
  } catch (error: any) {
    console.error('WhatsApp send error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send via Meta WhatsApp Business API
 */
async function sendViaMeta(config: WhatsAppConfig, message: WhatsAppMessage): Promise<WhatsAppSendResult> {
  const url = `${config.apiUrl}/${config.phoneNumberId}/messages`;
  
  let body: any = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: formatPhoneNumber(message.to),
  };

  if (message.type === 'text') {
    body.type = 'text';
    body.text = { 
      preview_url: true,
      body: message.text 
    };
  } else if (message.type === 'template') {
    body.type = 'template';
    body.template = {
      name: message.template?.name,
      language: { code: message.template?.language || 'pt_BR' },
      components: message.template?.components || [],
    };
  } else if (message.type === 'image') {
    body.type = 'image';
    body.image = {
      link: message.media?.url,
      caption: message.media?.caption,
    };
  } else if (message.type === 'document') {
    body.type = 'document';
    body.document = {
      link: message.media?.url,
      caption: message.media?.caption,
      filename: message.media?.filename,
    };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    return { 
      success: false, 
      error: data.error?.message || 'Failed to send message' 
    };
  }

  return {
    success: true,
    messageId: data.messages?.[0]?.id,
  };
}

/**
 * Send via Evolution API
 */
async function sendViaEvolution(config: WhatsAppConfig, message: WhatsAppMessage): Promise<WhatsAppSendResult> {
  const baseUrl = `${config.apiUrl}/message`;
  let endpoint = '';
  let body: any = {
    number: formatPhoneNumber(message.to),
  };

  if (message.type === 'text') {
    endpoint = `${baseUrl}/sendText/${config.instanceName}`;
    body.textMessage = { text: message.text };
  } else if (message.type === 'image') {
    endpoint = `${baseUrl}/sendMedia/${config.instanceName}`;
    body.mediaMessage = {
      mediatype: 'image',
      media: message.media?.url,
      caption: message.media?.caption,
    };
  } else if (message.type === 'document') {
    endpoint = `${baseUrl}/sendMedia/${config.instanceName}`;
    body.mediaMessage = {
      mediatype: 'document',
      media: message.media?.url,
      caption: message.media?.caption,
      fileName: message.media?.filename,
    };
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'apikey': config.accessToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    return { 
      success: false, 
      error: data.message || 'Failed to send message' 
    };
  }

  return {
    success: true,
    messageId: data.key?.id,
  };
}

/**
 * Send via Twilio
 */
async function sendViaTwilio(config: WhatsAppConfig, message: WhatsAppMessage): Promise<WhatsAppSendResult> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`;
  
  const formData = new URLSearchParams();
  formData.append('From', `whatsapp:${config.phoneNumberId}`);
  formData.append('To', `whatsapp:+${formatPhoneNumber(message.to)}`);
  
  if (message.type === 'text') {
    formData.append('Body', message.text || '');
  } else if (message.media?.url) {
    formData.append('MediaUrl', message.media.url);
    if (message.media.caption) {
      formData.append('Body', message.media.caption);
    }
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${config.accountSid}:${config.accessToken}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  const data = await response.json();

  if (!response.ok) {
    return { 
      success: false, 
      error: data.message || 'Failed to send message' 
    };
  }

  return {
    success: true,
    messageId: data.sid,
  };
}

/**
 * Format phone number (remove special characters, ensure country code)
 */
function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If no country code, assume Brazil (+55)
  if (cleaned.length === 10 || cleaned.length === 11) {
    cleaned = '55' + cleaned;
  }
  
  return cleaned;
}

/**
 * Pre-defined message templates
 */
export const WhatsAppTemplates = {
  // Approval request
  approvalRequest: (clientName: string, contentTitle: string, approvalUrl: string): WhatsAppMessage => ({
    to: '',
    type: 'text',
    text: `🎨 *Novo Conteúdo para Aprovação*\n\nOlá ${clientName}!\n\nUm novo conteúdo está aguardando sua aprovação:\n\n📝 *${contentTitle}*\n\nClique no link para revisar e aprovar:\n${approvalUrl}\n\n_Valle 360_`,
  }),

  // Invoice reminder
  invoiceReminder: (clientName: string, invoiceNumber: string, amount: string, dueDate: string): WhatsAppMessage => ({
    to: '',
    type: 'text',
    text: `💰 *Lembrete de Fatura*\n\nOlá ${clientName}!\n\nLembramos que sua fatura está próxima do vencimento:\n\n📄 Fatura: #${invoiceNumber}\n💵 Valor: ${amount}\n📅 Vencimento: ${dueDate}\n\nSe já realizou o pagamento, desconsidere esta mensagem.\n\n_Valle 360_`,
  }),

  // Post published
  postPublished: (clientName: string, platform: string, postUrl?: string): WhatsAppMessage => ({
    to: '',
    type: 'text',
    text: `🚀 *Conteúdo Publicado!*\n\nOlá ${clientName}!\n\nSeu conteúdo foi publicado com sucesso no *${platform}*! 🎉\n\n${postUrl ? `🔗 Ver publicação: ${postUrl}\n\n` : ''}Acompanhe as métricas no painel.\n\n_Valle 360_`,
  }),

  // Meeting reminder
  meetingReminder: (clientName: string, meetingTitle: string, dateTime: string, meetingUrl?: string): WhatsAppMessage => ({
    to: '',
    type: 'text',
    text: `📅 *Lembrete de Reunião*\n\nOlá ${clientName}!\n\nSua reunião está marcada para:\n\n📌 *${meetingTitle}*\n🕐 ${dateTime}\n\n${meetingUrl ? `🔗 Link: ${meetingUrl}\n\n` : ''}Nos vemos em breve!\n\n_Valle 360_`,
  }),

  // Contract signed
  contractSigned: (clientName: string): WhatsAppMessage => ({
    to: '',
    type: 'text',
    text: `🎉 *Contrato Assinado com Sucesso!*\n\nOlá ${clientName}!\n\nSeu contrato foi assinado com sucesso. Bem-vindo à Valle 360!\n\nNossa equipe já está preparando tudo para começarmos. Em breve entraremos em contato para agendar a reunião de kickoff.\n\n✨ Estamos animados para essa parceria!\n\n_Valle 360_`,
  }),

  // Task update
  taskUpdate: (clientName: string, taskTitle: string, status: string): WhatsAppMessage => ({
    to: '',
    type: 'text',
    text: `📋 *Atualização de Tarefa*\n\nOlá ${clientName}!\n\nA tarefa *"${taskTitle}"* foi atualizada:\n\n📊 Status: ${status}\n\nAcompanhe todos os detalhes no seu painel.\n\n_Valle 360_`,
  }),
};

/**
 * Send a templated message
 */
export async function sendTemplatedMessage(
  phone: string,
  template: WhatsAppMessage
): Promise<WhatsAppSendResult> {
  return sendWhatsAppMessage({
    ...template,
    to: phone,
  });
}
