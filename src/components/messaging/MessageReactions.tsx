'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { ThumbsUp, Heart, Laugh, Frown, Angry } from 'lucide-react';

interface Reaction {
  reaction_type: string;
  count: number;
  users: Array<{
    user_id: string;
    full_name: string;
    avatar_url?: string;
  }>;
}

interface MessageReactionsProps {
  messageId: string;
  messageType: 'group' | 'direct';
  currentUserId: string;
  compact?: boolean;
}

const reactionIcons: Record<string, { icon: any; label: string; emoji: string }> = {
  like: { icon: ThumbsUp, label: 'Curtir', emoji: '👍' },
  love: { icon: Heart, label: 'Amar', emoji: '❤️' },
  laugh: { icon: Laugh, label: 'Rir', emoji: '😂' },
  wow: { icon: Heart, label: 'Uau', emoji: '😮' },
  sad: { icon: Frown, label: 'Triste', emoji: '😢' },
  angry: { icon: Angry, label: 'Bravo', emoji: '😠' },
};

export function MessageReactions({
  messageId,
  messageType,
  currentUserId,
  compact = false
}: MessageReactionsProps) {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadReactions();

    const channel = supabase
      .channel(`reactions-${messageId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions',
          filter: `message_id=eq.${messageId}`,
        },
        () => {
          loadReactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [messageId]);

  const loadReactions = async () => {
    try {
      const { data, error } = await supabase.rpc('get_message_reactions', {
        p_message_id: messageId,
        p_message_type: messageType,
      });

      if (error) throw error;

      setReactions(data || []);

      const userReactionData = (data || []).find((r: Reaction) =>
        r.users.some((u) => u.user_id === currentUserId)
      );

      setUserReaction(userReactionData?.reaction_type || null);
    } catch (error) {
      console.error('Erro ao carregar reações:', error);
    }
  };

  const handleReaction = async (reactionType: string) => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.rpc('toggle_message_reaction', {
        p_message_id: messageId,
        p_message_type: messageType,
        p_user_id: currentUserId,
        p_reaction_type: reactionType,
      });

      if (error) throw error;

      setShowPicker(false);
      await loadReactions();
    } catch (error) {
      console.error('Erro ao reagir:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalReactions = reactions.reduce((sum, r) => sum + r.count, 0);

  if (compact) {
    return (
      <div className="flex items-center gap-1 flex-wrap">
        {reactions.slice(0, 3).map((reaction) => {
          const config = reactionIcons[reaction.reaction_type];
          return (
            <button
              key={reaction.reaction_type}
              onClick={() => handleReaction(reaction.reaction_type)}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs transition-colors"
              title={reaction.users.map((u) => u.full_name).join(', ')}
            >
              <span>{config.emoji}</span>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {reaction.count}
              </span>
            </button>
          );
        })}
        {totalReactions > 0 && reactions.length > 3 && (
          <span className="text-xs text-gray-500">+{reactions.length - 3}</span>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 flex-wrap">
        {reactions.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {reactions.map((reaction) => {
              const config = reactionIcons[reaction.reaction_type];
              const hasUserReacted = reaction.users.some(
                (u) => u.user_id === currentUserId
              );

              return (
                <button
                  key={reaction.reaction_type}
                  onClick={() => handleReaction(reaction.reaction_type)}
                  disabled={isLoading}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-all ${
                    hasUserReacted
                      ? 'bg-amber-100 dark:bg-amber-900/30 border-2 border-primary'
                      : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  title={reaction.users.map((u) => u.full_name).join(', ')}
                >
                  <span className="text-base">{config.emoji}</span>
                  <span
                    className={`font-medium ${
                      hasUserReacted
                        ? 'text-amber-700 dark:text-amber-300'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {reaction.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPicker(!showPicker)}
            disabled={isLoading}
            className="h-7 px-2"
            title="Adicionar reação"
          >
            <span className="text-lg">➕</span>
          </Button>

          {showPicker && (
            <div className="absolute bottom-full mb-2 left-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-2 z-50">
              <div className="flex items-center gap-1">
                {Object.entries(reactionIcons).map(([type, config]) => (
                  <button
                    key={type}
                    onClick={() => handleReaction(type)}
                    disabled={isLoading}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title={config.label}
                  >
                    <span className="text-2xl">{config.emoji}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
