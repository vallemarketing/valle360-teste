import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface UsePresenceOptions {
  userId?: string;
  groupId?: string;
}

export function usePresence({ userId, groupId }: UsePresenceOptions = {}) {
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const isTypingRef = useRef(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (!userId) return;

    setOnline();

    intervalRef.current = setInterval(() => {
      updatePresence('online');
    }, 30000);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        updatePresence('away');
      } else {
        setOnline();
      }
    };

    const handleBeforeUnload = () => {
      updatePresence('offline');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('blur', () => updatePresence('away'));
    window.addEventListener('focus', () => setOnline());

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('blur', () => updatePresence('away'));
      window.removeEventListener('focus', () => setOnline());
      updatePresence('offline');
    };
  }, [userId]);

  const setOnline = async () => {
    if (!userId) return;
    await updatePresence('online');
  };

  const updatePresence = async (status: 'online' | 'away' | 'offline') => {
    if (!userId) return;

    try {
      await supabase.rpc('update_user_presence', {
        p_user_id: userId,
        p_status: status,
        p_group_id: groupId || null,
      });
    } catch (error) {
      console.error('Erro ao atualizar presença:', error);
    }
  };

  const startTyping = async () => {
    if (!userId || !groupId) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      try {
        await supabase.rpc('upsert_typing_indicator', {
          p_group_id: groupId,
          p_user_id: userId,
        });
      } catch (error) {
        console.error('Erro ao registrar digitação:', error);
      }
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  };

  const stopTyping = async () => {
    if (!userId || !groupId || !isTypingRef.current) return;

    isTypingRef.current = false;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    try {
      await supabase
        .from('typing_indicators')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);
    } catch (error) {
      console.error('Erro ao remover indicador:', error);
    }
  };

  return {
    startTyping,
    stopTyping,
    updatePresence,
  };
}
