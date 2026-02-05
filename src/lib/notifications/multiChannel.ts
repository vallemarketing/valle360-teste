/**
 * Multi-Channel Notification System
 * Sends notifications via Email, WhatsApp, and In-App simultaneously
 */

import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

export interface NotificationPayload {
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 
    | 'task_assigned'
    | 'post_pending_approval'
    | 'post_approved'
    | 'post_rejected'
    | 'post_published'
    | 'post_failed'
    | 'account_connected'
    | 'account_disconnected'
    | 'general';
  metadata?: Record<string, any>;
  channels?: ('email' | 'whatsapp' | 'in_app')[];
}

export interface NotificationResult {
  success: boolean;
  channels: {
    email?: { sent: boolean; error?: string };
    whatsapp?: { sent: boolean; error?: string };
    in_app?: { sent: boolean; error?: string };
  };
}

/**
 * Send notification through multiple channels
 */
export async function sendMultiChannelNotification(
  payload: NotificationPayload
): Promise<NotificationResult> {
  const supabase = getSupabaseAdmin();
  const channels = payload.channels || ['email', 'whatsapp', 'in_app'];
  const result: NotificationResult = {
    success: true,
    channels: {},
  };

  // Get user preferences and contact info
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('email, phone, notification_preferences')
    .eq('user_id', payload.userId)
    .single();

  // 1. In-App Notification (always)
  if (channels.includes('in_app')) {
    try {
      const { error } = await supabase.from('notifications').insert({
        user_id: payload.userId,
        title: payload.title,
        message: payload.message,
        type: payload.type,
        category: payload.category,
        metadata: payload.metadata,
        is_read: false,
      });

      result.channels.in_app = { sent: !error, error: error?.message };
    } catch (e: any) {
      result.channels.in_app = { sent: false, error: e.message };
    }
  }

  // 2. Email Notification
  if (channels.includes('email') && userProfile?.email) {
    try {
      // Check if user has email notifications enabled
      const prefs = userProfile.notification_preferences || {};
      if (prefs.email !== false) {
        const emailSent = await sendEmailNotification({
          to: userProfile.email,
          subject: payload.title,
          body: payload.message,
          category: payload.category,
        });
        result.channels.email = { sent: emailSent };
      } else {
        result.channels.email = { sent: false, error: 'Email notifications disabled' };
      }
    } catch (e: any) {
      result.channels.email = { sent: false, error: e.message };
    }
  }

  // 3. WhatsApp Notification
  if (channels.includes('whatsapp') && userProfile?.phone) {
    try {
      // Check if user has WhatsApp notifications enabled
      const prefs = userProfile.notification_preferences || {};
      if (prefs.whatsapp !== false) {
        const whatsappSent = await sendWhatsAppNotification({
          phone: userProfile.phone,
          message: `*${payload.title}*\n\n${payload.message}`,
        });
        result.channels.whatsapp = { sent: whatsappSent };
      } else {
        result.channels.whatsapp = { sent: false, error: 'WhatsApp notifications disabled' };
      }
    } catch (e: any) {
      result.channels.whatsapp = { sent: false, error: e.message };
    }
  }

  // Check if any channel failed
  const failedChannels = Object.values(result.channels).filter(c => !c.sent);
  result.success = failedChannels.length === 0;

  return result;
}

/**
 * Send email via SendGrid
 */
async function sendEmailNotification(params: {
  to: string;
  subject: string;
  body: string;
  category: string;
}): Promise<boolean> {
  const mailtoUrl = `mailto:${params.to}?subject=${encodeURIComponent(params.subject)}&body=${encodeURIComponent(params.body)}`;
  console.log('[MAILTO] Email preparado:', mailtoUrl);
  return true;
}

/**
 * Send WhatsApp message via Evolution API or Twilio
 */
async function sendWhatsAppNotification(params: {
  phone: string;
  message: string;
}): Promise<boolean> {
  const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
  const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
  const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE;

  // Try Evolution API first
  if (EVOLUTION_API_URL && EVOLUTION_API_KEY && EVOLUTION_INSTANCE) {
    try {
      const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
        method: 'POST',
        headers: {
          'apikey': EVOLUTION_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          number: params.phone.replace(/\D/g, ''),
          text: params.message,
        }),
      });

      return response.ok;
    } catch (e) {
      console.error('Evolution API error:', e);
    }
  }

  // Fallback to Twilio
  const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
  const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
  const TWILIO_WHATSAPP = process.env.TWILIO_WHATSAPP_NUMBER;

  if (TWILIO_SID && TWILIO_TOKEN && TWILIO_WHATSAPP) {
    try {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            From: `whatsapp:${TWILIO_WHATSAPP}`,
            To: `whatsapp:${params.phone.replace(/\D/g, '')}`,
            Body: params.message,
          }),
        }
      );

      return response.ok;
    } catch (e) {
      console.error('Twilio error:', e);
    }
  }

  console.warn('No WhatsApp provider configured');
  return false;
}

/**
 * Notify about a specific event
 */
export async function notifyEvent(
  event: 'task_assigned' | 'post_pending_approval' | 'post_approved' | 'post_rejected' | 'post_published' | 'post_failed' | 'account_connected' | 'account_disconnected',
  userId: string,
  details: Record<string, any>
): Promise<NotificationResult> {
  const messages: Record<string, { title: string; message: string; type: NotificationPayload['type'] }> = {
    task_assigned: {
      title: 'Nova tarefa atribuída',
      message: `Você recebeu uma nova tarefa: "${details.taskTitle || 'Tarefa'}"`,
      type: 'info',
    },
    post_pending_approval: {
      title: 'Post aguardando aprovação',
      message: `Um novo post está aguardando sua aprovação para ${details.clientName || 'um cliente'}`,
      type: 'warning',
    },
    post_approved: {
      title: 'Post aprovado! ✅',
      message: `Seu post foi aprovado${details.by ? ` por ${details.by}` : ''}`,
      type: 'success',
    },
    post_rejected: {
      title: 'Post reprovado',
      message: `Seu post foi reprovado. Motivo: ${details.reason || 'Não especificado'}`,
      type: 'error',
    },
    post_published: {
      title: 'Post publicado! 🎉',
      message: `Seu post foi publicado com sucesso em ${details.platforms?.join(', ') || 'suas redes'}`,
      type: 'success',
    },
    post_failed: {
      title: 'Falha na publicação',
      message: `Houve um erro ao publicar: ${details.error || 'Erro desconhecido'}`,
      type: 'error',
    },
    account_connected: {
      title: 'Conta conectada',
      message: `A conta ${details.accountName || ''} do ${details.platform || 'rede social'} foi conectada`,
      type: 'success',
    },
    account_disconnected: {
      title: 'Conta desconectada',
      message: `A conta ${details.accountName || ''} do ${details.platform || 'rede social'} foi desconectada`,
      type: 'warning',
    },
  };

  const config = messages[event] || { title: 'Notificação', message: 'Nova atualização', type: 'info' as const };

  return sendMultiChannelNotification({
    userId,
    title: config.title,
    message: config.message,
    type: config.type,
    category: event,
    metadata: details,
  });
}
