'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Users, User, MessageCircle, Search } from 'lucide-react';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  user_type: string;
  avatar_url?: string;
}

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationCreated: (conversationId: string) => void;
  currentUserId: string;
}

export function NewConversationModal({
  isOpen,
  onClose,
  onConversationCreated,
  currentUserId,
}: NewConversationModalProps) {
  const [conversationType, setConversationType] = useState<'direct' | 'group' | 'client'>('direct');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, email, user_type, avatar_url')
        .eq('is_active', true)
        .neq('id', currentUserId)
        .order('full_name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  const filteredUsers = users.filter((user) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      user.full_name.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search) ||
      user.user_type.toLowerCase().includes(search)
    );
  });

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreateConversation = async () => {
    if (selectedUsers.length === 0) {
      alert('Selecione pelo menos um usuário');
      return;
    }

    if (conversationType === 'group' && !groupName.trim()) {
      alert('Digite um nome para o grupo');
      return;
    }

    setIsCreating(true);
    try {
      if (conversationType === 'direct' && selectedUsers.length === 1) {
        const { data: existing } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', currentUserId);

        if (existing && existing.length > 0) {
          for (const conv of existing) {
            const { data: otherParticipant } = await supabase
              .from('conversation_participants')
              .select('user_id')
              .eq('conversation_id', conv.conversation_id)
              .eq('user_id', selectedUsers[0])
              .maybeSingle();

            if (otherParticipant) {
              onConversationCreated(conv.conversation_id);
              handleClose();
              return;
            }
          }
        }
      }

      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          conversation_type: conversationType,
          name: conversationType === 'group' ? groupName.trim() : null,
          client_id: conversationType === 'client' ? selectedUsers[0] : null,
        })
        .select()
        .single();

      if (convError) throw convError;

      const participants = [
        { conversation_id: conversation.id, user_id: currentUserId, role: 'admin' },
        ...selectedUsers.map((userId) => ({
          conversation_id: conversation.id,
          user_id: userId,
          role: conversationType === 'group' ? 'member' : 'admin',
        })),
      ];

      const { error: partError } = await supabase
        .from('conversation_participants')
        .insert(participants);

      if (partError) throw partError;

      onConversationCreated(conversation.id);
      handleClose();
    } catch (error) {
      console.error('Erro ao criar conversa:', error);
      alert('Erro ao criar conversa');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setConversationType('direct');
    setSelectedUsers([]);
    setGroupName('');
    setSearchTerm('');
    onClose();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleLabel = (userType: string) => {
    const roles: Record<string, string> = {
      super_admin: 'Super Admin',
      admin: 'Admin',
      client: 'Cliente',
      video_maker: 'Videomaker',
      web_designer: 'Web Designer',
      graphic_designer: 'Designer Gráfico',
      social_media: 'Social Media',
      traffic_manager: 'Tráfego',
      marketing_head: 'Head Marketing',
      financial: 'Financeiro',
      hr: 'RH',
      commercial: 'Comercial',
    };
    return roles[userType] || userType;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col">
        <CardHeader className="flex-shrink-0 border-b">
          <div className="flex items-center justify-between">
            <CardTitle>Nova Conversa</CardTitle>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0">
          <div className="p-4 border-b space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Tipo de Conversa
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setConversationType('direct')}
                  className={`p-3 border rounded-lg flex flex-col items-center gap-2 transition-colors ${
                    conversationType === 'direct'
                      ? 'border-primary bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <User className="w-5 h-5" />
                  <span className="text-sm font-medium">Direta</span>
                </button>
                <button
                  onClick={() => setConversationType('group')}
                  className={`p-3 border rounded-lg flex flex-col items-center gap-2 transition-colors ${
                    conversationType === 'group'
                      ? 'border-primary bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <Users className="w-5 h-5" />
                  <span className="text-sm font-medium">Grupo</span>
                </button>
                <button
                  onClick={() => setConversationType('client')}
                  className={`p-3 border rounded-lg flex flex-col items-center gap-2 transition-colors ${
                    conversationType === 'client'
                      ? 'border-primary bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Cliente</span>
                </button>
              </div>
            </div>

            {conversationType === 'group' && (
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Nome do Grupo
                </label>
                <Input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Digite o nome do grupo"
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                {conversationType === 'direct'
                  ? 'Selecione um usuário'
                  : conversationType === 'client'
                  ? 'Selecione um cliente'
                  : 'Selecione os participantes'}
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar por nome, email ou cargo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((userId) => {
                  const user = users.find((u) => u.id === userId);
                  if (!user) return null;
                  return (
                    <Badge key={userId} className="flex items-center gap-1 bg-blue-600 text-white">
                      {user.full_name}
                      <button onClick={() => toggleUserSelection(userId)}>
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 400px)' }}>
            {filteredUsers.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-gray-500">Nenhum usuário encontrado</p>
              </div>
            ) : (
              filteredUsers
                .filter((user) => {
                  if (conversationType === 'client') return user.user_type === 'client';
                  if (conversationType === 'direct') return true;
                  return true;
                })
                .map((user) => (
                  <button
                    key={user.id}
                    onClick={() => {
                      if (conversationType === 'direct') {
                        setSelectedUsers([user.id]);
                      } else {
                        toggleUserSelection(user.id);
                      }
                    }}
                    className={`w-full p-4 border-b hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                      selectedUsers.includes(user.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1672d6] to-[#001533] flex items-center justify-center text-white font-medium">
                          {getInitials(user.full_name)}
                        </div>
                      )}
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-900 dark:text-white">{user.full_name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        <p className="text-xs text-gray-400">{getRoleLabel(user.user_type)}</p>
                      </div>
                      {selectedUsers.includes(user.id) && (
                        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                          <X className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                ))
            )}
          </div>
        </CardContent>

        <div className="flex-shrink-0 border-t p-4 flex gap-2 justify-end">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleCreateConversation}
            disabled={
              isCreating ||
              selectedUsers.length === 0 ||
              (conversationType === 'group' && !groupName.trim())
            }
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isCreating ? 'Criando...' : 'Criar Conversa'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
