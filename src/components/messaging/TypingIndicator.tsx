'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchProfilesMapByAuthIds } from '@/lib/messaging/userProfiles';

interface TypingUser {
  user_id: string;
  full_name: string;
}

interface TypingIndicatorProps {
  groupId: string;
  currentUserId: string;
}

export function TypingIndicator({ groupId, currentUserId }: TypingIndicatorProps) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  useEffect(() => {
    loadTypingUsers();

    const channel = supabase
      .channel(`typing-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          loadTypingUsers();
        }
      )
      .subscribe();

    const cleanupInterval = setInterval(() => {
      loadTypingUsers();
    }, 2000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(cleanupInterval);
    };
  }, [groupId]);

  const loadTypingUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('typing_indicators')
        .select('user_id')
        .eq('group_id', groupId)
        .neq('user_id', currentUserId)
        .gt('expires_at', new Date().toISOString());

      if (error) throw error;

      const userIds = Array.from(new Set((data || []).map((i: any) => String(i?.user_id || '')).filter(Boolean)));
      const profilesMap = await fetchProfilesMapByAuthIds(supabase as any, userIds);

      const users = userIds.map((uid) => ({
        user_id: uid,
        full_name: profilesMap.get(uid)?.full_name || 'Usuário',
      }));

      setTypingUsers(users);
    } catch (error) {
      console.error('Erro ao carregar indicadores:', error);
    }
  };

  if (typingUsers.length === 0) return null;

  const renderTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].full_name} está digitando`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].full_name} e ${typingUsers[1].full_name} estão digitando`;
    } else {
      return `${typingUsers[0].full_name} e mais ${typingUsers.length - 1} pessoas estão digitando`;
    }
  };

  return (
    <div className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 italic flex items-center gap-2">
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
        <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
        <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
      </div>
      <span>{renderTypingText()}...</span>
    </div>
  );
}
