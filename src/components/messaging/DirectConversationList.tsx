'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, User, MessageCircle, Users } from 'lucide-react';
import { PresenceIndicator } from './PresenceIndicator';
import { fetchProfilesMapByAuthIds } from '@/lib/messaging/userProfiles';

interface DirectConversation {
  id: string;
  is_client_conversation: boolean;
  last_message_at?: string;
  last_message_preview?: string;
  unread_count?: number;
  other_user_id: string;
  other_user_name: string;
  other_user_email: string;
  other_user_avatar?: string;
  other_user_type: string;
}

interface DirectConversationListProps {
  onSelectConversation: (conversation: DirectConversation) => void;
  selectedConversationId?: string;
  onNewConversation: () => void;
  currentUserId: string;
  filterType?: 'all' | 'team' | 'clients';
  peerTypeFilter?: 'all' | 'client' | 'non_client';
  titleOverride?: string;
  adminView?: boolean;
  /** IDs de usuários permitidos (para filtrar apenas profissionais do projeto) */
  allowedUserIds?: string[];
}

export function DirectConversationList({
  onSelectConversation,
  selectedConversationId,
  onNewConversation,
  currentUserId,
  filterType = 'all',
  peerTypeFilter = 'all',
  titleOverride,
  adminView = false,
  allowedUserIds,
}: DirectConversationListProps) {
  const [conversations, setConversations] = useState<DirectConversation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConversations();

    const channel = supabase
      .channel('direct-conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'direct_conversations',
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
          table: 'direct_conversation_participants',
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
          table: 'direct_messages',
        },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  const loadConversations = async () => {
    try {
      setIsLoading(true);

      let conversationsWithUsers: any[] = [];

      if (adminView) {
        const { data: convs, error } = await supabase
          .from('direct_conversations')
          .select('id, is_client_conversation, last_message_at, last_message_preview')
          .order('last_message_at', { ascending: false, nullsFirst: false })
          .limit(200);
        if (error) throw error;

        const convIds = (convs || []).map((c: any) => c.id).filter(Boolean);

        const { data: participants } = await supabase
          .from('direct_conversation_participants')
          .select('conversation_id, user_id')
          .in('conversation_id', convIds)
          .eq('is_active', true);

        const usersByConvId = new Map<string, string[]>();
        for (const row of (participants || []) as any[]) {
          const cid = String(row?.conversation_id || '');
          const uid = String(row?.user_id || '');
          if (!cid || !uid) continue;
          usersByConvId.set(cid, [...(usersByConvId.get(cid) || []), uid]);
        }

        const allUserIds = Array.from(new Set((participants || []).map((p: any) => String(p?.user_id || '')).filter(Boolean)));
        const profilesMap = await fetchProfilesMapByAuthIds(supabase as any, allUserIds);

        conversationsWithUsers = (convs || []).map((conv: any) => {
          const uids = usersByConvId.get(String(conv.id)) || [];
          // Preferir exibir o cliente (quando houver) como “outro usuário”
          let displayUserId = uids[0] || '';
          if (conv.is_client_conversation) {
            const clientId = uids.find((id) => profilesMap.get(id)?.user_type === 'client');
            if (clientId) displayUserId = clientId;
          }
          const profile = displayUserId ? profilesMap.get(displayUserId) : null;
          return {
            ...conv,
            unread_count: 0,
            other_user_id: displayUserId,
            other_user_name: profile?.full_name || 'Conversa',
            other_user_email: profile?.email || '',
            other_user_avatar: profile?.avatar_url,
            other_user_type: profile?.user_type || '',
          };
        });
      } else {
        const { data: participations, error } = await supabase
          .from('direct_conversation_participants')
          .select(`
            unread_count,
            direct_conversations!inner (
              id,
              is_client_conversation,
              last_message_at,
              last_message_preview
            )
          `)
          .eq('user_id', currentUserId)
          .eq('is_active', true);

        if (error) throw error;

        const convIds = (participations || [])
          .map((p: any) => p?.direct_conversations?.id)
          .filter(Boolean);

        const { data: others } = await supabase
          .from('direct_conversation_participants')
          .select('conversation_id, user_id')
          .in('conversation_id', convIds)
          .neq('user_id', currentUserId);

        const otherByConvId = new Map<string, string>();
        for (const row of (others || []) as any[]) {
          if (!row?.conversation_id || !row?.user_id) continue;
          otherByConvId.set(String(row.conversation_id), String(row.user_id));
        }

        const otherUserIds = Array.from(new Set(Array.from(otherByConvId.values())));
        const profilesMap = await fetchProfilesMapByAuthIds(supabase as any, otherUserIds);

        conversationsWithUsers = (participations || []).map((p: any) => {
          const conv = p.direct_conversations;
          const otherUserId = otherByConvId.get(String(conv?.id || '')) || null;
          if (!conv?.id || !otherUserId) return null;

          const profile = profilesMap.get(otherUserId);

          return {
            ...conv,
            unread_count: p.unread_count,
            other_user_id: otherUserId,
            other_user_name: profile?.full_name || 'Usuário',
            other_user_email: profile?.email || '',
            other_user_avatar: profile?.avatar_url,
            other_user_type: profile?.user_type || '',
          };
        });
      }

      const validConversations = conversationsWithUsers.filter(c => c !== null);

      validConversations.sort((a, b) => {
        if (a.is_client_conversation && !b.is_client_conversation) return -1;
        if (!a.is_client_conversation && b.is_client_conversation) return 1;

        if (a.unread_count && !b.unread_count) return -1;
        if (!a.unread_count && b.unread_count) return 1;

        const dateA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
        const dateB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
        return dateB - dateA;
      });

      setConversations(validConversations);
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredConversations = conversations.filter((conv) => {
    if (filterType === 'clients' && !conv.is_client_conversation) return false;
    if (filterType === 'team' && conv.is_client_conversation) return false;

    if (peerTypeFilter === 'client' && conv.other_user_type !== 'client') return false;
    if (peerTypeFilter === 'non_client' && conv.other_user_type === 'client') return false;

    // Filtrar por IDs de usuários permitidos (para clientes verem apenas profissionais do projeto)
    if (allowedUserIds && allowedUserIds.length > 0) {
      if (!allowedUserIds.includes(conv.other_user_id)) return false;
    }

    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      conv.other_user_name?.toLowerCase().includes(search) ||
      conv.other_user_email?.toLowerCase().includes(search) ||
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
            {titleOverride || (filterType === 'clients' ? 'Clientes' : filterType === 'team' ? 'Equipe' : 'Conversas')}
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
                  ? conv.is_client_conversation
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-600'
                    : 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-primary'
                  : conv.is_client_conversation && conv.unread_count && conv.unread_count > 0
                  ? 'bg-blue-50/50 dark:bg-blue-900/10 border-l-2 border-l-blue-400'
                  : ''
              }`}
            >
              <div className="flex gap-3">
                <div className="relative flex-shrink-0">
                  {conv.other_user_avatar ? (
                    <img
                      src={conv.other_user_avatar}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1672d6] to-[#001533] flex items-center justify-center text-white font-medium">
                      {getInitials(conv.other_user_name)}
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0">
                    <PresenceIndicator userId={conv.other_user_id} size="md" />
                  </div>
                  {conv.unread_count && conv.unread_count > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 bg-red-600 text-white text-xs">
                      {conv.unread_count > 9 ? '9+' : conv.unread_count}
                    </Badge>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span
                        className={`font-medium text-gray-900 dark:text-white truncate ${
                          conv.unread_count && conv.unread_count > 0 ? 'font-bold' : ''
                        }`}
                      >
                        {conv.other_user_name}
                      </span>
                      {conv.is_client_conversation && (
                        <Badge className="text-xs flex-shrink-0 bg-blue-600 text-white border-0 shadow-sm">
                          Cliente
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                      {formatTime(conv.last_message_at)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-1">
                    {conv.other_user_email}
                  </p>
                  {conv.last_message_preview && (
                    <p
                      className={`text-sm text-gray-600 dark:text-gray-400 truncate ${
                        conv.unread_count && conv.unread_count > 0
                          ? 'font-semibold text-gray-900 dark:text-white'
                          : ''
                      }`}
                    >
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
