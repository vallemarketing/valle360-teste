'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, Users, User, MessageCircle } from 'lucide-react';

interface Conversation {
  id: string;
  conversation_type: string;
  name?: string;
  avatar_url?: string;
  client_id?: string;
  last_message_at?: string;
  last_message_preview?: string;
  unread_count?: number;
  participant_name?: string;
  participant_avatar?: string;
}

interface ConversationListProps {
  onSelectConversation: (conversation: Conversation) => void;
  selectedConversationId?: string;
  onNewConversation: () => void;
}

export function ConversationList({
  onSelectConversation,
  selectedConversationId,
  onNewConversation
}: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    loadConversations();
    getCurrentUser();

    const channel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          loadConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          loadConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_participants',
        },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: participations, error: participError } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          unread_count,
          conversations!inner (
            id,
            conversation_type,
            name,
            avatar_url,
            client_id,
            last_message_at,
            last_message_preview
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (participError) throw participError;

      const conversationData = await Promise.all(
        (participations || []).map(async (p: any) => {
          const conv = p.conversations;

          if (conv.conversation_type === 'direct') {
            const { data: otherParticipant } = await supabase
              .from('conversation_participants')
              .select(`
                user_id,
                user_profiles!inner (full_name, avatar_url)
              `)
              .eq('conversation_id', conv.id)
              .neq('user_id', user.id)
              .maybeSingle();

            if (otherParticipant) {
              const profileData = Array.isArray(otherParticipant.user_profiles)
                ? otherParticipant.user_profiles[0]
                : otherParticipant.user_profiles;

              return {
                ...conv,
                unread_count: p.unread_count,
                participant_name: profileData?.full_name,
                participant_avatar: profileData?.avatar_url,
              };
            }
          }

          return {
            ...conv,
            unread_count: p.unread_count,
          };
        })
      );

      conversationData.sort((a, b) => {
        const dateA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
        const dateB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
        return dateB - dateA;
      });

      setConversations(conversationData);
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredConversations = conversations.filter((conv) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      conv.name?.toLowerCase().includes(search) ||
      conv.participant_name?.toLowerCase().includes(search) ||
      conv.last_message_preview?.toLowerCase().includes(search)
    );
  });

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const getConversationIcon = (type: string) => {
    switch (type) {
      case 'group':
        return <Users className="w-5 h-5" />;
      case 'client':
        return <MessageCircle className="w-5 h-5" />;
      default:
        return <User className="w-5 h-5" />;
    }
  };

  const getConversationName = (conv: Conversation) => {
    if (conv.conversation_type === 'direct') {
      return conv.participant_name || 'Conversa Direta';
    }
    return conv.name || 'Grupo';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 border-r">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex-1">
            Mensagens
          </h2>
          <Button
            onClick={onNewConversation}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar conversas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
            </p>
            {!searchTerm && (
              <Button
                onClick={onNewConversation}
                variant="outline"
                size="sm"
                className="mt-3"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Conversa
              </Button>
            )}
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelectConversation(conv)}
              className={`w-full p-4 border-b hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left ${
                selectedConversationId === conv.id
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-primary'
                  : ''
              }`}
            >
              <div className="flex gap-3">
                <div className="relative flex-shrink-0">
                  {conv.participant_avatar || conv.avatar_url ? (
                    <img
                      src={conv.participant_avatar || conv.avatar_url}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1672d6] to-[#001533] flex items-center justify-center text-white font-medium">
                      {getInitials(getConversationName(conv))}
                    </div>
                  )}
                  {conv.unread_count && conv.unread_count > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 bg-red-600 text-white text-xs">
                      {conv.unread_count > 9 ? '9+' : conv.unread_count}
                    </Badge>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {getConversationIcon(conv.conversation_type)}
                      <span className="font-medium text-gray-900 dark:text-white truncate">
                        {getConversationName(conv)}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {formatTime(conv.last_message_at)}
                    </span>
                  </div>
                  {conv.last_message_preview && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {conv.last_message_preview}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
