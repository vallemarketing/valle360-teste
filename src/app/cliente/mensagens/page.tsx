'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { MessageCircle, Users, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePresence } from '@/hooks/usePresence'
import { GroupList } from '@/components/messaging/GroupList'
import { GroupChatWindow } from '@/components/messaging/GroupChatWindow'
import { DirectConversationList } from '@/components/messaging/DirectConversationList'
import { DirectChatWindow } from '@/components/messaging/DirectChatWindow'
import { NewDirectConversationModal } from '@/components/messaging/NewDirectConversationModal'

type ActiveTab = 'groups' | 'team'

export default function ClienteMensagensPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('team')
  const [selectedGroup, setSelectedGroup] = useState<any>(null)
  const [selectedConversation, setSelectedConversation] = useState<any>(null)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [isNewConversationModalOpen, setIsNewConversationModalOpen] = useState(false)
  const [allowedTeamUserIds, setAllowedTeamUserIds] = useState<string[]>([])
  const [loadingTeam, setLoadingTeam] = useState(true)

  // Buscar profissionais atribuídos ao projeto do cliente
  useEffect(() => {
    const loadTeamMembers = async () => {
      try {
        const response = await fetch('/api/client/team-members')
        const data = await response.json()
        if (data.success && data.teamMembers) {
          const userIds = data.teamMembers.map((m: any) => m.userId)
          setAllowedTeamUserIds(userIds)
        }
      } catch (error) {
        console.error('Erro ao carregar equipe do projeto:', error)
      } finally {
        setLoadingTeam(false)
      }
    }
    loadTeamMembers()
  }, [])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!mounted) return
      if (user) setCurrentUserId(user.id)
    })()
    return () => {
      mounted = false
    }
  }, [])

  usePresence({ userId: currentUserId })

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab)
    setSelectedGroup(null)
    setSelectedConversation(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#001533] dark:text-white">Mensagens</h1>
        <p className="text-[#001533]/60 dark:text-white/60 mt-2">
          Converse com a equipe em tempo real e acompanhe grupos de projeto
        </p>
      </div>

      <div className="h-[calc(100vh-250px)] min-h-[600px]">
        <Card className="h-full overflow-hidden flex flex-col">
          <div className="flex-shrink-0 border-b border-[#001533]/10 dark:border-white/10">
            <div className="flex">
              <button
                onClick={() => handleTabChange('team')}
                  className={cn(
                  'flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2',
                  activeTab === 'team'
                    ? 'border-b-2 border-[#1672d6] text-[#1672d6] bg-[#1672d6]/10'
                    : 'text-[#001533]/60 dark:text-white/60 hover:text-[#001533] dark:hover:text-white'
                )}
              >
                <MessageSquare className="w-4 h-4" />
                Equipe
              </button>

              <button
                onClick={() => handleTabChange('groups')}
                className={cn(
                  'flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2',
                  activeTab === 'groups'
                    ? 'border-b-2 border-[#1672d6] text-[#1672d6] bg-[#1672d6]/10'
                    : 'text-[#001533]/60 dark:text-white/60 hover:text-[#001533] dark:hover:text-white'
                )}
              >
                <Users className="w-4 h-4" />
                Grupos
              </button>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 overflow-hidden">
            <div className="lg:col-span-1 border-r border-[#001533]/10 dark:border-white/10 overflow-hidden">
              {currentUserId && activeTab === 'groups' && (
                <GroupList
                  onSelectGroup={(group) => {
                    setSelectedGroup(group)
                    setSelectedConversation(null)
                  }}
                  selectedGroupId={selectedGroup?.id}
                  currentUserId={currentUserId}
                />
              )}

              {currentUserId && activeTab === 'team' && (
                <DirectConversationList
                  onSelectConversation={(conv) => {
                    setSelectedConversation(conv)
                    setSelectedGroup(null)
                  }}
                  selectedConversationId={selectedConversation?.id}
                  onNewConversation={() => setIsNewConversationModalOpen(true)}
                  currentUserId={currentUserId}
                  filterType="all"
                  peerTypeFilter="non_client"
                  titleOverride="Equipe do Projeto"
                  allowedUserIds={allowedTeamUserIds.length > 0 ? allowedTeamUserIds : undefined}
                />
                  )}
                </div>

            <div className="lg:col-span-2 overflow-hidden">
              {activeTab === 'groups' && selectedGroup && currentUserId ? (
                <GroupChatWindow group={selectedGroup} currentUserId={currentUserId} />
              ) : activeTab === 'team' && selectedConversation && currentUserId ? (
                <DirectChatWindow conversation={selectedConversation} currentUserId={currentUserId} />
              ) : (
                <div className="h-full flex items-center justify-center bg-[#001533]/5 dark:bg-white/5">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 text-[#001533]/20 dark:text-white/20 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-[#001533] dark:text-white mb-2">
                      {activeTab === 'groups' ? 'Selecione um grupo' : 'Selecione uma conversa'}
                    </h3>
                    <p className="text-sm text-[#001533]/60 dark:text-white/60">
                      {activeTab === 'groups'
                        ? 'Escolha um grupo da lista ao lado'
                        : 'Escolha uma conversa ou inicie uma nova'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
            </div>

      {currentUserId && (
        <NewDirectConversationModal
          isOpen={isNewConversationModalOpen}
          onClose={() => setIsNewConversationModalOpen(false)}
          onConversationCreated={() => setIsNewConversationModalOpen(false)}
          currentUserId={currentUserId}
          filterType="team"
        />
      )}
    </div>
  )
}


