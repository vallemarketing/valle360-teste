'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { GroupList } from '@/components/messaging/GroupList';
import { GroupChatWindow } from '@/components/messaging/GroupChatWindow';
import { AllUsersList } from '@/components/messaging/AllUsersList';
import { DirectChatWindow } from '@/components/messaging/DirectChatWindow';
import { NewConversationModal } from '@/components/messaging/NewConversationModal';
import { Card } from '@/components/ui/card';
import { MessageCircle, Users, User, MessageSquare } from 'lucide-react';
import { usePresence } from '@/hooks/usePresence';
import { fetchProfileByAuthId } from '@/lib/messaging/userProfiles';
import type { DirectConversation, Group } from '@/types/messaging';

type ActiveTab = 'groups' | 'team' | 'clients';

export default function MensagensPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('team');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedUser, setSelectedUser] = useState<DirectConversation | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isNewGroupModalOpen, setIsNewGroupModalOpen] = useState(false);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      try {
        const profile = await fetchProfileByAuthId(supabase as any, user.id);
        const t = String(profile?.user_type || '').toLowerCase();
        setIsSuperAdmin(t === 'super_admin');
      } catch {
        setIsSuperAdmin(false);
      }
    }
  };

  usePresence({ userId: currentUserId });

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    setSelectedGroup(null);
    setSelectedUser(null);
  };

  const handleUserSelect = async (userId: string, conversationId?: string) => {
    console.log('👤 Usuário selecionado:', userId, 'Conversa:', conversationId);
    
    // Buscar informações do usuário
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_id, full_name, email, user_type, avatar_url')
      .eq('user_id', userId)
      .single();

    if (!profile) return;

    // Se já tem conversa, usar; senão criar uma nova
    let finalConversationId = conversationId;
    
    if (!finalConversationId) {
      // Criar nova conversa
      const { data: convId } = await supabase.rpc('get_or_create_direct_conversation', {
        p_user_id_1: currentUserId,
        p_user_id_2: userId,
        p_is_client_conversation: profile.user_type === 'client',
      });
      
      finalConversationId = convId;
    }

    // Garantir que temos um ID válido antes de selecionar
    if (!finalConversationId) {
      console.error('❌ Não foi possível obter/criar conversa');
      return;
    }

    setSelectedUser({
      id: finalConversationId,
      is_client_conversation: profile.user_type === 'client',
      other_user_id: userId,
      other_user_name: profile.full_name || 'Usuário',
      other_user_email: profile.email || '',
      other_user_avatar: profile.avatar_url,
    });
  };

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mensagens</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Converse com grupos, equipe e clientes em tempo real
        </p>
      </div>

      <div className="h-[calc(100vh-250px)] min-h-[600px]">
        <Card className="h-full overflow-hidden flex flex-col">
          <div className="flex-shrink-0 border-b">
            <div className="flex">
              <button
                onClick={() => handleTabChange('groups')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  activeTab === 'groups'
                    ? 'border-b-2 border-primary text-primary bg-blue-50 dark:bg-blue-900/20'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" />
                Grupos
              </button>
              <button
                onClick={() => handleTabChange('team')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  activeTab === 'team'
                    ? 'border-b-2 border-primary text-primary bg-blue-50 dark:bg-blue-900/20'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                Equipe
              </button>
              <button
                onClick={() => handleTabChange('clients')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  activeTab === 'clients'
                    ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <User className="w-4 h-4" />
                Clientes
              </button>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 overflow-hidden">
            <div className="lg:col-span-1 border-r overflow-hidden">
              {currentUserId && activeTab === 'groups' && (
                <GroupList
                  onSelectGroup={(group) => {
                    setSelectedGroup(group);
                    setSelectedUser(null);
                  }}
                  selectedGroupId={selectedGroup?.id}
                  currentUserId={currentUserId}
                  adminView={isSuperAdmin}
                  onCreateGroup={isSuperAdmin ? () => setIsNewGroupModalOpen(true) : undefined}
                />
              )}
              {currentUserId && activeTab === 'team' && (
                <AllUsersList
                  onSelectUser={handleUserSelect}
                  selectedUserId={selectedUser?.other_user_id}
                  currentUserId={currentUserId}
                  filterType="team"
                />
              )}
              {currentUserId && activeTab === 'clients' && (
                <AllUsersList
                  onSelectUser={handleUserSelect}
                  selectedUserId={selectedUser?.other_user_id}
                  currentUserId={currentUserId}
                  filterType="clients"
                />
              )}
            </div>

            <div className="lg:col-span-2 overflow-hidden bg-gray-50 dark:bg-gray-900">
              {activeTab === 'groups' && selectedGroup && currentUserId ? (
                <GroupChatWindow group={selectedGroup} currentUserId={currentUserId} readOnly={false} />
              ) : activeTab !== 'groups' && selectedUser && currentUserId ? (
                <DirectChatWindow conversation={selectedUser} currentUserId={currentUserId} readOnly={false} />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {activeTab === 'groups' && 'Selecione um grupo'}
                      {activeTab === 'team' && 'Selecione alguém da equipe'}
                      {activeTab === 'clients' && 'Selecione um cliente'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {activeTab === 'groups' && 'Escolha um grupo para conversar'}
                      {activeTab === 'team' && 'Clique em alguém para iniciar uma conversa'}
                      {activeTab === 'clients' && 'Clique em um cliente para conversar'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {currentUserId && isSuperAdmin && (
        <NewConversationModal
          isOpen={isNewGroupModalOpen}
          onClose={() => setIsNewGroupModalOpen(false)}
          onConversationCreated={(groupId) => {
            setIsNewGroupModalOpen(false);
          }}
          currentUserId={currentUserId}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Indicadores em tempo real:</strong> Veja quem está online e digitando instantaneamente!
          </p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Canal de Clientes:</strong> Conversas com clientes são destacadas com prioridade especial.
          </p>
        </div>
      </div>
    </div>
  );
}
