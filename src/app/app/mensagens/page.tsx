'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { GroupList } from '@/components/messaging/GroupList';
import { GroupChatWindow } from '@/components/messaging/GroupChatWindow';
import { DirectConversationList } from '@/components/messaging/DirectConversationList';
import { DirectChatWindow } from '@/components/messaging/DirectChatWindow';
import { NewDirectConversationModal } from '@/components/messaging/NewDirectConversationModal';
import { NewConversationModal } from '@/components/messaging/NewConversationModal';
import { Card } from '@/components/ui/card';
import { MessageCircle, Users, User, MessageSquare } from 'lucide-react';
import { usePresence } from '@/hooks/usePresence';
import { fetchProfileByAuthId } from '@/lib/messaging/userProfiles';

interface Group {
  id: string;
  name: string;
  type: string;
  description?: string;
}

interface DirectConversation {
  id: string;
  is_client_conversation: boolean;
  other_user_id: string;
  other_user_name: string;
  other_user_email: string;
  other_user_avatar?: string;
}

type ActiveTab = 'groups' | 'team' | 'clients';

export default function MensagensPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('groups');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<DirectConversation | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isNewConversationModalOpen, setIsNewConversationModalOpen] = useState(false);
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
    setSelectedConversation(null);
  };

  const handleConversationCreated = (conversationId: string) => {
    setIsNewConversationModalOpen(false);
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
                    setSelectedConversation(null);
                  }}
                  selectedGroupId={selectedGroup?.id}
                  currentUserId={currentUserId}
                  adminView={isSuperAdmin}
                  onCreateGroup={isSuperAdmin ? () => setIsNewGroupModalOpen(true) : undefined}
                />
              )}
              {currentUserId && activeTab === 'team' && (
                <DirectConversationList
                  onSelectConversation={(conv) => {
                    setSelectedConversation(conv);
                    setSelectedGroup(null);
                  }}
                  selectedConversationId={selectedConversation?.id}
                  onNewConversation={() => setIsNewConversationModalOpen(true)}
                  currentUserId={currentUserId}
                  filterType="team"
                  adminView={false}
                />
              )}
              {currentUserId && activeTab === 'clients' && (
                <DirectConversationList
                  onSelectConversation={(conv) => {
                    setSelectedConversation(conv);
                    setSelectedGroup(null);
                  }}
                  selectedConversationId={selectedConversation?.id}
                  onNewConversation={() => setIsNewConversationModalOpen(true)}
                  currentUserId={currentUserId}
                  filterType="clients"
                  adminView={false}
                />
              )}
            </div>

            <div className="lg:col-span-2 overflow-hidden">
              {activeTab === 'groups' && selectedGroup && currentUserId ? (
                <GroupChatWindow group={selectedGroup} currentUserId={currentUserId} readOnly={isSuperAdmin} />
              ) : activeTab !== 'groups' && selectedConversation && currentUserId ? (
                <DirectChatWindow conversation={selectedConversation} currentUserId={currentUserId} readOnly={isSuperAdmin} />
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {activeTab === 'groups' && 'Selecione um grupo'}
                      {activeTab === 'team' && 'Selecione uma conversa'}
                      {activeTab === 'clients' && 'Selecione um cliente'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {activeTab === 'groups' && 'Escolha um grupo da lista ao lado'}
                      {activeTab === 'team' && 'Escolha uma conversa ou inicie uma nova'}
                      {activeTab === 'clients' && 'Escolha um cliente ou inicie uma conversa'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {currentUserId && !isSuperAdmin && (
        <NewDirectConversationModal
          isOpen={isNewConversationModalOpen}
          onClose={() => setIsNewConversationModalOpen(false)}
          onConversationCreated={handleConversationCreated}
          currentUserId={currentUserId}
          filterType={activeTab === 'clients' ? 'clients' : 'team'}
        />
      )}

      {currentUserId && isSuperAdmin && (
        <>
          <NewDirectConversationModal
            isOpen={isNewConversationModalOpen && activeTab !== 'groups'}
            onClose={() => setIsNewConversationModalOpen(false)}
            onConversationCreated={handleConversationCreated}
            currentUserId={currentUserId}
            filterType={activeTab === 'clients' ? 'clients' : 'team'}
          />
          <NewConversationModal
            isOpen={isNewGroupModalOpen}
            onClose={() => setIsNewGroupModalOpen(false)}
            onConversationCreated={(groupId) => {
              setIsNewGroupModalOpen(false);
              // Recarregar lista de grupos
            }}
            currentUserId={currentUserId}
          />
        </>
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
