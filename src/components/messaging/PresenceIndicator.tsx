'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface PresenceIndicatorProps {
  userId: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function PresenceIndicator({ userId, showLabel = false, size = 'sm' }: PresenceIndicatorProps) {
  const [status, setStatus] = useState<'online' | 'away' | 'offline'>('offline');
  const [lastSeen, setLastSeen] = useState<string>('');

  useEffect(() => {
    loadPresence();

    const channel = supabase
      .channel(`presence-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          loadPresence();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const loadPresence = async () => {
    try {
      const { data, error } = await supabase
        .from('user_presence')
        .select('status, last_seen_at')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setStatus(data.status as 'online' | 'away' | 'offline');
        setLastSeen(data.last_seen_at);
      }
    } catch (error) {
      console.error('Erro ao carregar presença:', error);
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'away':
        return 'Ausente';
      default:
        return formatLastSeen();
    }
  };

  const formatLastSeen = () => {
    if (!lastSeen) return 'Offline';

    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `Visto há ${diffMins}m`;
    if (diffHours < 24) return `Visto há ${diffHours}h`;
    if (diffDays < 7) return `Visto há ${diffDays}d`;
    return 'Offline';
  };

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  if (!showLabel) {
    return (
      <div
        className={`${sizeClasses[size]} ${getStatusColor()} rounded-full border-2 border-white dark:border-gray-800`}
        title={getStatusLabel()}
      ></div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className={`${sizeClasses[size]} ${getStatusColor()} rounded-full`}></div>
      <span className="text-xs text-gray-600 dark:text-gray-400">{getStatusLabel()}</span>
    </div>
  );
}
