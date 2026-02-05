/**
 * Web Push Notifications Service
 * Handles browser push notifications using the Web Push API
 */

import webpush from 'web-push';

// VAPID keys should be stored in environment variables
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:contact@valle360.com';

// Initialize web-push with VAPID details
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  url?: string;
  data?: Record<string, any>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

/**
 * Send a push notification to a subscription
 */
export async function sendPushNotification(
  subscription: PushSubscription,
  payload: PushNotificationPayload
): Promise<{ success: boolean; error?: string }> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn('VAPID keys not configured, skipping push notification');
    return { success: false, error: 'VAPID keys not configured' };
  }

  try {
    const notificationPayload = JSON.stringify({
      ...payload,
      icon: payload.icon || '/icons/valle-icon-192.png',
      badge: payload.badge || '/icons/valle-badge-72.png',
      timestamp: Date.now(),
    });

    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
      notificationPayload
    );

    return { success: true };
  } catch (error: any) {
    console.error('Push notification failed:', error);
    
    // Handle expired or invalid subscriptions
    if (error.statusCode === 404 || error.statusCode === 410) {
      return { success: false, error: 'subscription_expired' };
    }
    
    return { success: false, error: error.message };
  }
}

/**
 * Send push notifications to multiple subscriptions
 */
export async function sendBulkPushNotifications(
  subscriptions: PushSubscription[],
  payload: PushNotificationPayload
): Promise<{ sent: number; failed: number; expired: string[] }> {
  const results = await Promise.allSettled(
    subscriptions.map(sub => sendPushNotification(sub, payload))
  );

  const expired: string[] = [];
  let sent = 0;
  let failed = 0;

  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value.success) {
      sent++;
    } else {
      failed++;
      if (result.status === 'fulfilled' && result.value.error === 'subscription_expired') {
        expired.push(subscriptions[index].endpoint);
      }
    }
  });

  return { sent, failed, expired };
}

/**
 * Generate VAPID keys (run once for setup)
 */
export function generateVapidKeys(): { publicKey: string; privateKey: string } {
  return webpush.generateVAPIDKeys();
}

/**
 * Get the public VAPID key for client-side subscription
 */
export function getPublicVapidKey(): string {
  return VAPID_PUBLIC_KEY;
}

/**
 * Notification types and their default configurations
 */
export const NotificationTemplates = {
  NEW_TASK: (taskName: string) => ({
    title: 'Nova Tarefa Atribuída',
    body: `Você recebeu uma nova tarefa: ${taskName}`,
    tag: 'new-task',
    url: '/app/tarefas',
  }),

  APPROVAL_REQUEST: (contentName: string) => ({
    title: 'Aprovação Pendente',
    body: `Conteúdo aguardando sua aprovação: ${contentName}`,
    tag: 'approval-request',
    url: '/admin/aprovacoes',
  }),

  CONTENT_APPROVED: (contentName: string) => ({
    title: 'Conteúdo Aprovado! ✅',
    body: `Seu conteúdo "${contentName}" foi aprovado`,
    tag: 'content-approved',
    url: '/app/social-media',
  }),

  CONTENT_REJECTED: (contentName: string, reason?: string) => ({
    title: 'Conteúdo Precisando de Ajustes',
    body: reason || `O conteúdo "${contentName}" requer revisão`,
    tag: 'content-rejected',
    url: '/app/social-media',
  }),

  INVOICE_DUE: (invoiceNumber: string, dueDate: string) => ({
    title: 'Fatura Próxima do Vencimento',
    body: `A fatura #${invoiceNumber} vence em ${dueDate}`,
    tag: 'invoice-due',
    url: '/cliente/financeiro',
  }),

  PAYMENT_RECEIVED: (amount: string) => ({
    title: 'Pagamento Recebido! 💰',
    body: `Confirmamos o recebimento de ${amount}`,
    tag: 'payment-received',
    url: '/cliente/financeiro',
  }),

  POST_PUBLISHED: (platform: string) => ({
    title: 'Post Publicado! 🎉',
    body: `Seu conteúdo foi publicado com sucesso no ${platform}`,
    tag: 'post-published',
    url: '/app/social-media/calendario',
  }),

  MEETING_REMINDER: (meetingTitle: string, time: string) => ({
    title: 'Lembrete de Reunião',
    body: `${meetingTitle} começa em ${time}`,
    tag: 'meeting-reminder',
    url: '/app/agenda',
  }),

  AI_CONTENT_READY: (contentType: string) => ({
    title: 'Conteúdo IA Pronto! 🤖',
    body: `A IA terminou de gerar seu ${contentType}`,
    tag: 'ai-content-ready',
    url: '/admin/social-media/command-center',
  }),

  CONTRACT_SIGNED: (clientName: string) => ({
    title: 'Contrato Assinado! 📝',
    body: `${clientName} acabou de assinar o contrato`,
    tag: 'contract-signed',
    url: '/admin/juridico/contratos',
  }),

  SLA_WARNING: (taskName: string, timeLeft: string) => ({
    title: '⚠️ SLA Próximo do Limite',
    body: `"${taskName}" tem apenas ${timeLeft} restantes`,
    tag: 'sla-warning',
    url: '/admin/sla',
  }),

  GAMIFICATION_BADGE: (badgeName: string) => ({
    title: 'Novo Conquista Desbloqueada! 🏆',
    body: `Você conquistou a medalha "${badgeName}"`,
    tag: 'gamification-badge',
    url: '/app/gamificacao',
  }),

  CLIENT_MESSAGE: (clientName: string) => ({
    title: 'Nova Mensagem',
    body: `${clientName} enviou uma mensagem`,
    tag: 'client-message',
    url: '/app/mensagens',
  }),
};
