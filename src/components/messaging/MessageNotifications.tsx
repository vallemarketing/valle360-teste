'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { MessageCircle } from 'lucide-react';

interface MessageNotificationsProps {
  currentUserId: string;
  onClick?: () => void;
}

export function MessageNotifications({ currentUserId, onClick }: MessageNotificationsProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (currentUserId) {
      loadUnreadCount();

      const channel = supabase
        .channel('message-notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'conversation_participants',
            filter: `user_id=eq.${currentUserId}`,
          },
          () => {
            loadUnreadCount();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentUserId]);

  const loadUnreadCount = async () => {
    try {
      const { data, error } = await supabase
        .from('conversation_participants')
        .select('unread_count')
        .eq('user_id', currentUserId)
        .eq('is_active', true);

      if (error) throw error;

      const total = (data || []).reduce((sum, p) => sum + (p.unread_count || 0), 0);
      setUnreadCount(total);
    } catch (error) {
      console.error('Erro ao carregar contador:', error);
    }
  };

  return (
    <button
      onClick={onClick}
      className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
    >
      <MessageCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      {unreadCount > 0 && (
        <Badge className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 bg-red-600 text-white text-xs">
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </button>
  );
}
