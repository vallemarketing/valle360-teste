'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Search, MessageCircle, Circle } from 'lucide-react';
import { PresenceIndicator } from './PresenceIndicator';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  user_type: string;
  avatar_url?: string;
  has_conversation?: boolean;
  conversation_id?: string;
  last_message_at?: string;
  last_message_preview?: string;
  unread_count?: number;
}

interface AllUsersListProps {
  onSelectUser: (userId: string, conversationId?: string) => void;
  selectedUserId?: string;
  currentUserId: string;
  filterType?: 'all' | 'team' | 'clients';
}

export function AllUsersList({
  onSelectUser,
  selectedUserId,
  currentUserId,
  filterType = 'team',
}: AllUsersListProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAllUsers();
  }, [currentUserId, filterType]);

  const loadAllUsers = async () => {
    try {
      setIsLoading(true);
      console.log('📋 Carregando todos os usuários...');

      // 1. Buscar todos os user_profiles ativos (exceto o atual)
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, user_id, full_name, email, user_type, avatar_url')
        .eq('is_active', true)
        .neq('user_id', currentUserId);

      if (profilesError) throw profilesError;

      console.log('📋 Profiles encontrados:', profiles?.length);

      // 2. Filtrar por tipo
      let filteredProfiles = profiles || [];
      if (filterType === 'team') {
        filteredProfiles = filteredProfiles.filter(
          (p) => p.user_type && p.user_type.toLowerCase() !== 'client'
        );
      } else if (filterType === 'clients') {
        filteredProfiles = filteredProfiles.filter(
          (p) => p.user_type?.toLowerCase() === 'client'
        );
      }

      console.log('📋 Após filtro:', filteredProfiles.length);

      // 3. Para cada usuário, verificar se já existe conversa
      const usersWithConversations = await Promise.all(
        filteredProfiles.map(async (profile) => {
          const authId = profile.user_id || profile.id;
          
          // Buscar conversa existente
          const { data: convData } = await supabase
            .from('direct_conversation_participants')
            .select(`
              conversation_id,
              direct_conversations!inner (
                id,
                last_message_at,
                last_message_preview
              )
            `)
            .eq('user_id', currentUserId);

          // Verificar se alguma dessas conversas tem o outro usuário
          let userConversation = null;
          if (convData) {
            for (const conv of convData) {
              const { data: otherParticipant } = await supabase
                .from('direct_conversation_participants')
                .select('user_id')
                .eq('conversation_id', conv.conversation_id)
                .neq('user_id', currentUserId)
                .single();

              if (otherParticipant?.user_id === authId) {
                userConversation = conv;
                break;
              }
            }
          }

          return {
            id: authId,
            full_name: profile.full_name || 'Usuário',
            email: profile.email || '',
            user_type: profile.user_type || '',
            avatar_url: profile.avatar_url,
            has_conversation: !!userConversation,
            conversation_id: userConversation?.conversation_id,
            last_message_at: userConversation?.direct_conversations?.last_message_at,
            last_message_preview: userConversation?.direct_conversations?.last_message_preview,
            unread_count: 0,
          };
        })
      );

      // Ordenar: com conversa primeiro, depois por nome
      usersWithConversations.sort((a, b) => {
        if (a.has_conversation && !b.has_conversation) return -1;
        if (!a.has_conversation && b.has_conversation) return 1;
        if (a.last_message_at && b.last_message_at) {
          return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
        }
        return a.full_name.localeCompare(b.full_name);
      });

      setUsers(usersWithConversations);
    } catch (error) {
      console.error('❌ Erro ao carregar usuários:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      user.full_name.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search)
    );
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

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

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700">
        <h2 className="text-lg font-bold text-white mb-3">
          {filterType === 'team' ? '👥 Equipe' : '💼 Clientes'}
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/70" />
          <Input
            type="text"
            placeholder="Buscar pessoas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20"
          />
        </div>
      </div>

      {/* Lista de Usuários */}
      <div className="flex-1 overflow-y-auto">
        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              {searchTerm ? 'Nenhuma pessoa encontrada' : 'Nenhuma pessoa disponível'}
            </p>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <button
              key={user.id}
              onClick={() => onSelectUser(user.id, user.conversation_id)}
              className={`w-full p-4 border-b hover:bg-blue-50 dark:hover:bg-gray-800 transition-all duration-200 ${
                selectedUserId === user.id
                  ? 'bg-blue-50 dark:bg-gray-800 border-l-4 border-l-blue-600'
                  : ''
              }`}
            >
              <div className="flex gap-3">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-white dark:ring-gray-800"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm ring-2 ring-white dark:ring-gray-800">
                      {getInitials(user.full_name)}
                    </div>
                  )}
                  <div className="absolute -bottom-0.5 -right-0.5">
                    <PresenceIndicator userId={user.id} size="md" />
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-semibold text-gray-900 dark:text-white truncate">
                      {user.full_name}
                    </span>
                    {user.last_message_at && (
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                        {formatTime(user.last_message_at)}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-1">
                    {user.email}
                  </p>

                  {user.has_conversation && user.last_message_preview ? (
                    <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                      {user.last_message_preview}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                      {user.has_conversation ? 'Sem mensagens ainda' : 'Iniciar conversa'}
                    </p>
                  )}
                </div>

                {/* Status indicator */}
                {!user.has_conversation && (
                  <div className="flex-shrink-0 self-center">
                    <Circle className="w-2 h-2 fill-gray-300 text-gray-300" />
                  </div>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
