/**
 * Valle 360 - Sistema de Notificações em Tempo Real
 * Suporte a notificações push, in-app e por email
 */

import { createClient } from '@supabase/supabase-js';

// =====================================================
// TIPOS
// =====================================================

export type NotificationType = 
  | 'task_assigned'
  | 'task_completed'
  | 'task_overdue'
  | 'message_received'
  | 'mention'
  | 'approval_needed'
  | 'approval_given'
  | 'payment_received'
  | 'payment_overdue'
  | 'contract_signed'
  | 'client_inactive'
  | 'sentiment_alert'
  | 'insight_generated'
  | 'report_ready'
  | 'meeting_reminder'
  | 'system_alert';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export type NotificationChannel = 'in_app' | 'email' | 'push' | 'sms';

export interface Notification {
  id?: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  data?: Record<string, any>;
  actionUrl?: string;
  actionLabel?: string;
  read?: boolean;
  createdAt?: Date;
  expiresAt?: Date;
}

export interface NotificationPreferences {
  userId: string;
  email: boolean;
  push: boolean;
  inApp: boolean;
  sms: boolean;
  quietHours?: {
    enabled: boolean;
    start: string; // HH:mm
    end: string;
  };
  disabledTypes?: NotificationType[];
}

// =====================================================
// CONFIGURAÇÃO DE TIPOS DE NOTIFICAÇÃO
// =====================================================

const NOTIFICATION_CONFIG: Record<NotificationType, {
  icon: string;
  color: string;
  defaultPriority: NotificationPriority;
  defaultChannels: NotificationChannel[];
}> = {
  task_assigned: {
    icon: '📋',
    color: 'blue',
    defaultPriority: 'medium',
    defaultChannels: ['in_app', 'email']
  },
  task_completed: {
    icon: '✅',
    color: 'green',
    defaultPriority: 'low',
    defaultChannels: ['in_app']
  },
  task_overdue: {
    icon: '⚠️',
    color: 'red',
    defaultPriority: 'high',
    defaultChannels: ['in_app', 'email', 'push']
  },
  message_received: {
    icon: '💬',
    color: 'blue',
    defaultPriority: 'medium',
    defaultChannels: ['in_app', 'push']
  },
  mention: {
    icon: '@',
    color: 'purple',
    defaultPriority: 'medium',
    defaultChannels: ['in_app', 'email']
  },
  approval_needed: {
    icon: '🔔',
    color: 'orange',
    defaultPriority: 'high',
    defaultChannels: ['in_app', 'email', 'push']
  },
  approval_given: {
    icon: '👍',
    color: 'green',
    defaultPriority: 'low',
    defaultChannels: ['in_app']
  },
  payment_received: {
    icon: '💰',
    color: 'green',
    defaultPriority: 'medium',
    defaultChannels: ['in_app', 'email']
  },
  payment_overdue: {
    icon: '🚨',
    color: 'red',
    defaultPriority: 'urgent',
    defaultChannels: ['in_app', 'email', 'push']
  },
  contract_signed: {
    icon: '📝',
    color: 'green',
    defaultPriority: 'high',
    defaultChannels: ['in_app', 'email']
  },
  client_inactive: {
    icon: '😴',
    color: 'yellow',
    defaultPriority: 'medium',
    defaultChannels: ['in_app']
  },
  sentiment_alert: {
    icon: '🎭',
    color: 'red',
    defaultPriority: 'high',
    defaultChannels: ['in_app', 'push']
  },
  insight_generated: {
    icon: '💡',
    color: 'purple',
    defaultPriority: 'low',
    defaultChannels: ['in_app']
  },
  report_ready: {
    icon: '📊',
    color: 'blue',
    defaultPriority: 'medium',
    defaultChannels: ['in_app', 'email']
  },
  meeting_reminder: {
    icon: '📅',
    color: 'blue',
    defaultPriority: 'high',
    defaultChannels: ['in_app', 'push']
  },
  system_alert: {
    icon: '⚙️',
    color: 'gray',
    defaultPriority: 'low',
    defaultChannels: ['in_app']
  }
};

// =====================================================
// SERVIÇO DE NOTIFICAÇÕES
// =====================================================

class NotificationService {
  private supabase;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Envia uma notificação
   */
  async send(notification: Notification): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const config = NOTIFICATION_CONFIG[notification.type];
      
      // Aplicar configurações padrão
      const finalNotification = {
        ...notification,
        priority: notification.priority || config.defaultPriority,
        channels: notification.channels || config.defaultChannels,
        read: false,
        createdAt: new Date()
      };

      // Verificar preferências do usuário
      const preferences = await this.getPreferences(notification.userId);
      const activeChannels = this.filterChannelsByPreferences(finalNotification.channels, preferences);

      // Verificar horário silencioso
      if (preferences?.quietHours?.enabled && this.isQuietHours(preferences.quietHours)) {
        // Apenas in_app durante horário silencioso
        activeChannels.length = 0;
        activeChannels.push('in_app');
      }

      // Salvar notificação no banco
      const { data, error } = await this.supabase
        .from('notifications')
        .insert({
          user_id: finalNotification.userId,
          type: finalNotification.type,
          title: finalNotification.title,
          message: finalNotification.message,
          priority: finalNotification.priority,
          channels: activeChannels,
          data: finalNotification.data,
          action_url: finalNotification.actionUrl,
          action_label: finalNotification.actionLabel,
          read: false,
          expires_at: finalNotification.expiresAt
        })
        .select()
        .single();

      if (error) throw error;

      // Disparar notificações nos canais
      await this.dispatchToChannels(finalNotification, activeChannels);

      // Emitir evento realtime via Supabase
      await this.supabase
        .channel(`user:${notification.userId}`)
        .send({
          type: 'broadcast',
          event: 'notification',
          payload: {
            id: data.id,
            ...finalNotification,
            icon: config.icon,
            color: config.color
          }
        });

      return { success: true, id: data.id };
    } catch (error: any) {
      console.error('Erro ao enviar notificação:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Envia notificação para múltiplos usuários
   */
  async sendBulk(
    userIds: string[],
    notification: Omit<Notification, 'userId'>
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    await Promise.all(
      userIds.map(async (userId) => {
        const result = await this.send({ ...notification, userId });
        if (result.success) success++;
        else failed++;
      })
    );

    return { success, failed };
  }

  /**
   * Marca notificação como lida
   */
  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('notifications')
      .update({ read: true, read_at: new Date() })
      .eq('id', notificationId)
      .eq('user_id', userId);

    return !error;
  }

  /**
   * Marca todas as notificações como lidas
   */
  async markAllAsRead(userId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('notifications')
      .update({ read: true, read_at: new Date() })
      .eq('user_id', userId)
      .eq('read', false);

    return !error;
  }

  /**
   * Busca notificações do usuário
   */
  async getNotifications(
    userId: string,
    options?: {
      unreadOnly?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<Notification[]> {
    let query = this.supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (options?.unreadOnly) {
      query = query.eq('read', false);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    const { data } = await query;
    return data || [];
  }

  /**
   * Conta notificações não lidas
   */
  async getUnreadCount(userId: string): Promise<number> {
    const { count } = await this.supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    return count || 0;
  }

  /**
   * Obtém preferências do usuário
   */
  async getPreferences(userId: string): Promise<NotificationPreferences | null> {
    const { data } = await this.supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    return data;
  }

  /**
   * Atualiza preferências do usuário
   */
  async updatePreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<boolean> {
    const { error } = await this.supabase
      .from('notification_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
        updated_at: new Date()
      });

    return !error;
  }

  /**
   * Filtra canais baseado nas preferências
   */
  private filterChannelsByPreferences(
    channels: NotificationChannel[],
    preferences: NotificationPreferences | null
  ): NotificationChannel[] {
    if (!preferences) return channels;

    return channels.filter(channel => {
      switch (channel) {
        case 'email': return preferences.email;
        case 'push': return preferences.push;
        case 'in_app': return preferences.inApp;
        case 'sms': return preferences.sms;
        default: return true;
      }
    });
  }

  /**
   * Verifica se está no horário silencioso
   */
  private isQuietHours(quietHours: { start: string; end: string }): boolean {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    return currentTime >= quietHours.start && currentTime <= quietHours.end;
  }

  /**
   * Dispara notificações nos canais
   */
  private async dispatchToChannels(
    notification: Notification,
    channels: NotificationChannel[]
  ): Promise<void> {
    const promises: Promise<void>[] = [];

    if (channels.includes('email')) {
      promises.push(this.sendEmailNotification(notification));
    }

    if (channels.includes('push')) {
      promises.push(this.sendPushNotification(notification));
    }

    // in_app já foi salvo no banco
    // sms pode ser implementado futuramente

    await Promise.allSettled(promises);
  }

  /**
   * Envia notificação por email
   */
  private async sendEmailNotification(notification: Notification): Promise<void> {
    // Usar o serviço de email
    try {
      await fetch('/api/automations/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'notification',
          recipient: {
            email: notification.data?.userEmail,
            name: notification.data?.userName
          },
          context: {
            title: notification.title,
            message: notification.message,
            actionUrl: notification.actionUrl
          }
        })
      });
    } catch (error) {
      console.error('Erro ao enviar email de notificação:', error);
    }
  }

  /**
   * Envia push notification (Web Push)
   */
  private async sendPushNotification(notification: Notification): Promise<void> {
    // TODO: Implementar Web Push API
    // Requer configuração de Service Worker e VAPID keys
    console.log('Push notification:', notification.title);
  }

  // =====================================================
  // MÉTODOS DE CONVENIÊNCIA
  // =====================================================

  async notifyTaskAssigned(userId: string, taskTitle: string, assignedBy: string, taskUrl: string) {
    return this.send({
      userId,
      type: 'task_assigned',
      title: 'Nova tarefa atribuída',
      message: `${assignedBy} atribuiu a tarefa "${taskTitle}" para você.`,
      priority: 'medium',
      channels: ['in_app', 'email'],
      actionUrl: taskUrl,
      actionLabel: 'Ver tarefa'
    });
  }

  async notifyTaskOverdue(userId: string, taskTitle: string, daysOverdue: number, taskUrl: string) {
    return this.send({
      userId,
      type: 'task_overdue',
      title: 'Tarefa atrasada!',
      message: `A tarefa "${taskTitle}" está ${daysOverdue} dia(s) atrasada.`,
      priority: 'high',
      channels: ['in_app', 'email', 'push'],
      actionUrl: taskUrl,
      actionLabel: 'Ver tarefa'
    });
  }

  async notifyPaymentOverdue(userId: string, clientName: string, amount: number, daysOverdue: number) {
    return this.send({
      userId,
      type: 'payment_overdue',
      title: 'Pagamento em atraso',
      message: `${clientName} está com pagamento de R$ ${amount.toLocaleString('pt-BR')} em atraso há ${daysOverdue} dias.`,
      priority: 'urgent',
      channels: ['in_app', 'email', 'push'],
      actionUrl: '/admin/financeiro',
      actionLabel: 'Ver financeiro'
    });
  }

  async notifySentimentAlert(userId: string, source: string, sentiment: string, content: string) {
    return this.send({
      userId,
      type: 'sentiment_alert',
      title: 'Alerta de Sentimento Negativo',
      message: `Detectado sentimento ${sentiment} em ${source}: "${content.substring(0, 100)}..."`,
      priority: 'high',
      channels: ['in_app', 'push'],
      actionUrl: '/admin/monitoramento-sentimento',
      actionLabel: 'Ver detalhes'
    });
  }

  async notifyInsightGenerated(userId: string, insightTitle: string) {
    return this.send({
      userId,
      type: 'insight_generated',
      title: 'Novo insight da Val',
      message: insightTitle,
      priority: 'low',
      channels: ['in_app'],
      actionUrl: '/admin/centro-inteligencia',
      actionLabel: 'Ver insights'
    });
  }

  async notifyMeetingReminder(userId: string, meetingTitle: string, minutesUntil: number, meetingUrl?: string) {
    return this.send({
      userId,
      type: 'meeting_reminder',
      title: `Reunião em ${minutesUntil} minutos`,
      message: meetingTitle,
      priority: 'high',
      channels: ['in_app', 'push'],
      actionUrl: meetingUrl || '/agenda',
      actionLabel: 'Ver reunião'
    });
  }
}

export const notifications = new NotificationService();
export default notifications;

