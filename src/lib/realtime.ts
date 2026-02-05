// Sistema de Real-time - Valle 360
// Gerencia conexões WebSocket e eventos em tempo real

import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

type EventCallback = (payload: any) => void;

class RealtimeManager {
  private channels: Map<string, RealtimeChannel> = new Map();
  private listeners: Map<string, Set<EventCallback>> = new Map();

  // Criar ou obter canal
  private getOrCreateChannel(channelName: string): RealtimeChannel {
    if (!this.channels.has(channelName)) {
      const channel = supabase.channel(channelName);
      this.channels.set(channelName, channel);
    }
    return this.channels.get(channelName)!;
  }

  // Subscrever a mudanças em uma tabela
  subscribeToTable(
    table: string,
    event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
    callback: EventCallback,
    filter?: string
  ): () => void {
    const channelName = `${table}-${event}-${filter || 'all'}`;
    const channel = this.getOrCreateChannel(channelName);

    const config: any = {
      event: event === '*' ? '*' : event,
      schema: 'public',
      table: table
    };

    if (filter) {
      config.filter = filter;
    }

    channel
      .on('postgres_changes', config, callback)
      .subscribe();

    // Retornar função de cleanup
    return () => {
      channel.unsubscribe();
      this.channels.delete(channelName);
    };
  }

  // Subscrever a canal de broadcast (para eventos customizados)
  subscribeToBroadcast(
    channelName: string,
    eventName: string,
    callback: EventCallback
  ): () => void {
    const channel = this.getOrCreateChannel(`broadcast-${channelName}`);

    channel
      .on('broadcast', { event: eventName }, callback)
      .subscribe();

    return () => {
      channel.unsubscribe();
      this.channels.delete(`broadcast-${channelName}`);
    };
  }

  // Enviar evento de broadcast
  async broadcast(channelName: string, eventName: string, payload: any): Promise<void> {
    const channel = this.getOrCreateChannel(`broadcast-${channelName}`);
    await channel.send({
      type: 'broadcast',
      event: eventName,
      payload
    });
  }

  // Subscrever a presença (quem está online)
  subscribeToPresence(
    channelName: string,
    userId: string,
    userInfo: Record<string, any>,
    onSync: (state: Record<string, any[]>) => void,
    onJoin?: (key: string, currentPresences: any[], newPresences: any[]) => void,
    onLeave?: (key: string, currentPresences: any[], leftPresences: any[]) => void
  ): () => void {
    const channel = this.getOrCreateChannel(`presence-${channelName}`);

    channel
      .on('presence', { event: 'sync' }, () => {
        onSync(channel.presenceState());
      })
      .on('presence', { event: 'join' }, ({ key, currentPresences, newPresences }) => {
        onJoin?.(key, currentPresences, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, currentPresences, leftPresences }) => {
        onLeave?.(key, currentPresences, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: userId,
            online_at: new Date().toISOString(),
            ...userInfo
          });
        }
      });

    return () => {
      channel.untrack();
      channel.unsubscribe();
      this.channels.delete(`presence-${channelName}`);
    };
  }

  // Desconectar todos os canais
  disconnectAll(): void {
    this.channels.forEach(channel => {
      channel.unsubscribe();
    });
    this.channels.clear();
  }
}

// Instância singleton
export const realtime = new RealtimeManager();

// Hooks helpers

// Hook para subscrever a notificações em tempo real
export function subscribeToNotifications(
  userId: string,
  onNewNotification: (notification: any) => void
): () => void {
  return realtime.subscribeToTable(
    'notifications',
    'INSERT',
    (payload) => onNewNotification(payload.new),
    `user_id=eq.${userId}`
  );
}

// Hook para subscrever a tarefas do Kanban
export function subscribeToKanbanTasks(
  onTaskChange: (payload: any) => void
): () => void {
  return realtime.subscribeToTable(
    'kanban_tasks',
    '*',
    onTaskChange
  );
}

// Hook para subscrever a mensagens de chat
export function subscribeToChatMessages(
  conversationId: string,
  onNewMessage: (message: any) => void
): () => void {
  return realtime.subscribeToTable(
    'chat_messages',
    'INSERT',
    (payload) => onNewMessage(payload.new),
    `conversation_id=eq.${conversationId}`
  );
}

// Hook para presença em uma conversa/página
export function subscribeToPresence(
  room: string,
  userId: string,
  userName: string,
  onPresenceChange: (users: any[]) => void
): () => void {
  return realtime.subscribeToPresence(
    room,
    userId,
    { name: userName },
    (state) => {
      const users = Object.values(state).flat();
      onPresenceChange(users);
    }
  );
}

// Enviar evento de digitando
export async function sendTypingEvent(
  conversationId: string,
  userId: string,
  userName: string
): Promise<void> {
  await realtime.broadcast(
    `chat-${conversationId}`,
    'typing',
    { userId, userName, timestamp: Date.now() }
  );
}

// Subscrever a eventos de digitando
export function subscribeToTyping(
  conversationId: string,
  onTyping: (userId: string, userName: string) => void
): () => void {
  return realtime.subscribeToBroadcast(
    `chat-${conversationId}`,
    'typing',
    (payload) => onTyping(payload.payload.userId, payload.payload.userName)
  );
}









