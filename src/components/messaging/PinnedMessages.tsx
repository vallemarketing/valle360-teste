'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Pin, X } from 'lucide-react';
import { fetchProfilesMapByAuthIds } from '@/lib/messaging/userProfiles';

interface PinnedMessage {
  id: string;
  message_id: string;
  message_type: 'group' | 'direct';
  pinned_by: string;
  pinned_at: string;
  note?: string;
  message_body?: string;
  sender_name?: string;
  message_created_at?: string;
}

interface PinnedMessagesProps {
  conversationId: string;
  conversationType: 'group' | 'direct';
  currentUserId: string;
  onMessageClick: (messageId: string) => void;
}

export function PinnedMessages({
  conversationId,
  conversationType,
  currentUserId,
  onMessageClick,
}: PinnedMessagesProps) {
  const [pinnedMessages, setPinnedMessages] = useState<PinnedMessage[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadPinnedMessages();
    checkAdmin();

    const channel = supabase
      .channel(`pinned-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pinned_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          loadPinnedMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const checkAdmin = async () => {
    if (conversationType === 'group') {
      const { data } = await supabase
        .from('group_participants')
        .select('role')
        .eq('group_id', conversationId)
        .eq('user_id', currentUserId)
        .maybeSingle();

      setIsAdmin(data?.role === 'admin');
    } else {
      setIsAdmin(true);
    }
  };

  const loadPinnedMessages = async () => {
    try {
      const { data: pinnedData, error: pinnedError } = await supabase
        .from('pinned_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('message_type', conversationType)
        .order('pinned_at', { ascending: false });

      if (pinnedError) throw pinnedError;

      if (!pinnedData || pinnedData.length === 0) {
        setPinnedMessages([]);
        return;
      }

      const messagesWithContent = await Promise.all(
        pinnedData.map(async (pinned) => {
          const tableName = conversationType === 'group' ? 'messages' : 'direct_messages';

          const { data: messageData } = await supabase
            .from(tableName)
            .select(
              `
              body,
              created_at,
              from_user_id
            `
            )
            .eq('id', pinned.message_id)
            .maybeSingle();

          const fromUserId = messageData?.from_user_id ? String((messageData as any).from_user_id) : '';
          const profilesMap = await fetchProfilesMapByAuthIds(supabase as any, fromUserId ? [fromUserId] : []);
          const senderName = fromUserId ? profilesMap.get(fromUserId)?.full_name : undefined;

          return {
            ...pinned,
            message_body: messageData?.body,
            sender_name: senderName || 'Usuário',
            message_created_at: messageData?.created_at,
          };
        })
      );

      setPinnedMessages(messagesWithContent as PinnedMessage[]);
    } catch (error) {
      console.error('Erro ao carregar mensagens fixadas:', error);
    }
  };

  const handleUnpin = async (pinnedId: string) => {
    try {
      const { error } = await supabase
        .from('pinned_messages')
        .delete()
        .eq('id', pinnedId);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao desfixar mensagem:', error);
    }
  };

  if (pinnedMessages.length === 0) {
    return null;
  }

  return (
    <div className="border-b bg-blue-50 dark:bg-blue-900/20">
      <div className="p-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between text-sm font-medium text-amber-800 dark:text-amber-200 hover:text-amber-900 dark:hover:text-amber-100"
        >
          <div className="flex items-center gap-2">
            <Pin className="w-4 h-4" />
            <span>
              {pinnedMessages.length} mensagem{pinnedMessages.length !== 1 ? 's' : ''} fixada
              {pinnedMessages.length !== 1 ? 's' : ''}
            </span>
          </div>
          <span className="text-xs">{isExpanded ? '▼' : '▶'}</span>
        </button>

        {isExpanded && (
          <div className="mt-3 space-y-2">
            {pinnedMessages.map((pinned) => (
              <div
                key={pinned.id}
                className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    onClick={() => onMessageClick(pinned.message_id)}
                    className="flex-1 text-left"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-900 dark:text-white">
                        {pinned.sender_name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {pinned.message_created_at &&
                          new Date(pinned.message_created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                      {pinned.message_body}
                    </p>
                    {pinned.note && (
                      <p className="text-xs text-blue-600 dark:text-amber-400 mt-1 italic">
                        Nota: {pinned.note}
                      </p>
                    )}
                  </button>

                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnpin(pinned.id)}
                      className="h-6 w-6 p-0"
                      title="Desfixar mensagem"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
