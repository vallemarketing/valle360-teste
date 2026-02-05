'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCheck } from 'lucide-react';
import { fetchProfilesMapByAuthIds } from '@/lib/messaging/userProfiles';

interface SeenByUser {
  user_id: string;
  full_name: string;
  avatar_url?: string;
  read_at: string;
}

interface SeenByIndicatorProps {
  messageId: string;
  groupId: string;
  currentUserId: string;
  isOwnMessage: boolean;
}

export function SeenByIndicator({
  messageId,
  groupId,
  currentUserId,
  isOwnMessage,
}: SeenByIndicatorProps) {
  const [seenBy, setSeenBy] = useState<SeenByUser[]>([]);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (isOwnMessage) {
      loadSeenBy();

      const channel = supabase
        .channel(`seen-${messageId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'message_read_receipts',
            filter: `message_id=eq.${messageId}`,
          },
          () => {
            loadSeenBy();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [messageId, isOwnMessage]);

  const loadSeenBy = async () => {
    try {
      const { data, error } = await supabase
        .from('message_read_receipts')
        .select('user_id, read_at')
        .eq('message_id', messageId)
        .eq('message_type', 'group')
        .neq('user_id', currentUserId);

      if (error) throw error;

      const ids = Array.from(new Set((data || []).map((i: any) => String(i?.user_id || '')).filter(Boolean)));
      const profilesMap = await fetchProfilesMapByAuthIds(supabase as any, ids);

      const users = (data || []).map((item: any) => {
        const uid = String(item.user_id || '');
        const profile = profilesMap.get(uid);
        return {
          user_id: uid,
          full_name: profile?.full_name || 'Usuário',
          avatar_url: profile?.avatar_url,
          read_at: item.read_at,
        };
      });

      setSeenBy(users);
    } catch (error) {
      console.error('Erro ao carregar visualizações:', error);
    }
  };

  if (!isOwnMessage || seenBy.length === 0) {
    return null;
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="relative inline-block">
      <div
        className="flex items-center gap-1 cursor-pointer"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <CheckCheck className="w-3 h-3 text-blue-500" />
        <span className="text-xs text-blue-500">
          {seenBy.length}
        </span>
      </div>

      {showTooltip && (
        <div className="absolute bottom-full right-0 mb-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 z-50">
          <p className="text-xs font-semibold text-gray-900 dark:text-white mb-2">
            Visto por
          </p>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {seenBy.map((user) => (
              <div key={user.user_id} className="flex items-center gap-2">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt=""
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#1672d6] to-[#001533] flex items-center justify-center text-xs text-white">
                    {user.full_name[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                    {user.full_name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTime(user.read_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
