/**
 * Valle 360 - Push Notification Service
 * Serviço para envio de notificações push
 */

import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

export type NotificationType = 
  | 'new_task'
  | 'task_assigned'
  | 'task_updated'
  | 'task_completed'
  | 'new_message'
  | 'mention'
  | 'deadline_approaching'
  | 'client_request'
  | 'approval_needed'
  | 'system';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  actionUrl?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

interface NotificationResult {
  success: boolean;
  notificationId?: string;
  error?: string;
}

/**
 * Criar notificação no banco de dados
 */
export async function createNotification(params: CreateNotificationParams): Promise<NotificationResult> {
  try {
    const db = getSupabaseAdmin();
    
    const { data, error } = await db
      .from('notifications')
      .insert({
        user_id: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        data: params.data || {},
        action_url: params.actionUrl,
        priority: params.priority || 'normal',
        is_read: false,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('[PushService] Erro ao criar notificação:', error);
      return { success: false, error: error.message };
    }

    return { success: true, notificationId: data?.id };
  } catch (error: any) {
    console.error('[PushService] Erro:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Notificar múltiplos usuários
 */
export async function notifyUsers(
  userIds: string[],
  params: Omit<CreateNotificationParams, 'userId'>
): Promise<{ success: boolean; sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const userId of userIds) {
    const result = await createNotification({ ...params, userId });
    if (result.success) {
      sent++;
    } else {
      failed++;
    }
  }

  return { success: failed === 0, sent, failed };
}

/**
 * Notificar atribuição de nova tarefa
 */
export async function notifyTaskAssignment(params: {
  assigneeId: string;
  taskId: string;
  taskTitle: string;
  assignerName: string;
  clientName?: string;
}): Promise<NotificationResult> {
  return createNotification({
    userId: params.assigneeId,
    type: 'task_assigned',
    title: 'Nova tarefa atribuída',
    body: `${params.assignerName} atribuiu a tarefa "${params.taskTitle}"${params.clientName ? ` para ${params.clientName}` : ''}`,
    data: {
      taskId: params.taskId,
      assignerName: params.assignerName,
      clientName: params.clientName,
    },
    actionUrl: `/colaborador/kanban?task=${params.taskId}`,
    priority: 'high',
  });
}

/**
 * Notificar nova mensagem
 */
export async function notifyNewMessage(params: {
  recipientId: string;
  senderName: string;
  messagePreview: string;
  conversationType: 'group' | 'direct';
  conversationId: string;
  conversationName?: string;
}): Promise<NotificationResult> {
  return createNotification({
    userId: params.recipientId,
    type: 'new_message',
    title: params.conversationType === 'group' 
      ? `Nova mensagem em ${params.conversationName || 'grupo'}`
      : `Mensagem de ${params.senderName}`,
    body: params.messagePreview.substring(0, 100) + (params.messagePreview.length > 100 ? '...' : ''),
    data: {
      conversationType: params.conversationType,
      conversationId: params.conversationId,
      senderName: params.senderName,
    },
    actionUrl: params.conversationType === 'group'
      ? `/app/mensagens?group=${params.conversationId}`
      : `/app/mensagens?conversation=${params.conversationId}`,
    priority: 'normal',
  });
}

/**
 * Notificar menção
 */
export async function notifyMention(params: {
  mentionedUserId: string;
  mentionerName: string;
  context: string;
  contextType: 'message' | 'task' | 'comment';
  contextId: string;
}): Promise<NotificationResult> {
  return createNotification({
    userId: params.mentionedUserId,
    type: 'mention',
    title: `${params.mentionerName} mencionou você`,
    body: params.context.substring(0, 100) + (params.context.length > 100 ? '...' : ''),
    data: {
      mentionerName: params.mentionerName,
      contextType: params.contextType,
      contextId: params.contextId,
    },
    priority: 'high',
  });
}

/**
 * Notificar prazo se aproximando
 */
export async function notifyDeadlineApproaching(params: {
  userId: string;
  taskId: string;
  taskTitle: string;
  dueDate: string;
  hoursRemaining: number;
}): Promise<NotificationResult> {
  return createNotification({
    userId: params.userId,
    type: 'deadline_approaching',
    title: 'Prazo se aproximando',
    body: `A tarefa "${params.taskTitle}" vence em ${params.hoursRemaining}h`,
    data: {
      taskId: params.taskId,
      dueDate: params.dueDate,
      hoursRemaining: params.hoursRemaining,
    },
    actionUrl: `/colaborador/kanban?task=${params.taskId}`,
    priority: 'high',
  });
}

/**
 * Marcar notificação como lida
 */
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  try {
    const db = getSupabaseAdmin();
    
    const { error } = await db
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId);

    return !error;
  } catch {
    return false;
  }
}

/**
 * Marcar todas as notificações de um usuário como lidas
 */
export async function markAllAsRead(userId: string): Promise<boolean> {
  try {
    const db = getSupabaseAdmin();
    
    const { error } = await db
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('is_read', false);

    return !error;
  } catch {
    return false;
  }
}

/**
 * Obter notificações não lidas de um usuário
 */
export async function getUnreadNotifications(userId: string, limit = 20): Promise<any[]> {
  try {
    const db = getSupabaseAdmin();
    
    const { data, error } = await db
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

export default {
  createNotification,
  notifyUsers,
  notifyTaskAssignment,
  notifyNewMessage,
  notifyMention,
  notifyDeadlineApproaching,
  markNotificationAsRead,
  markAllAsRead,
  getUnreadNotifications,
};
