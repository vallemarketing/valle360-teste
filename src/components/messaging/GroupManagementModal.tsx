'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  X,
  Users,
  Search,
  UserPlus,
  UserMinus,
  Crown,
  Edit2,
  Save,
  Trash2,
  Camera,
  Upload,
} from 'lucide-react';
import { PresenceIndicator } from './PresenceIndicator';
import { fetchProfilesMapByAuthIds } from '@/lib/messaging/userProfiles';

interface GroupMember {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'member';
  joined_at: string;
  avatar_url?: string;
}

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  user_type: string;
  avatar_url?: string;
}

interface GroupManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
  groupDescription?: string;
  currentUserId: string;
  isAdmin: boolean;
}

export function GroupManagementModal({
  isOpen,
  onClose,
  groupId,
  groupName: initialGroupName,
  groupDescription: initialGroupDescription,
  currentUserId,
  isAdmin,
}: GroupManagementModalProps) {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [groupName, setGroupName] = useState(initialGroupName);
  const [groupDescription, setGroupDescription] = useState(initialGroupDescription || '');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'members' | 'add' | 'settings'>('members');
  const [groupAvatar, setGroupAvatar] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadMembers();
      loadAvailableUsers();
      loadGroupInfo();
    }
  }, [isOpen, groupId]);

  const loadGroupInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('message_groups')
        .select('avatar_url')
        .eq('id', groupId)
        .maybeSingle();

      if (error) throw error;
      setGroupAvatar(data?.avatar_url || null);
    } catch (error) {
      console.error('Erro ao carregar informações do grupo:', error);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !isAdmin) return;

    setIsUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${groupId}-${Date.now()}.${fileExt}`;
      const filePath = `group-avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('message_groups')
        .update({ avatar_url: publicUrl })
        .eq('id', groupId);

      if (updateError) throw updateError;

      setGroupAvatar(publicUrl);
      alert('Avatar atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Erro ao fazer upload do avatar');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const loadMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('group_participants')
        .select('id, user_id, role, joined_at')
        .eq('group_id', groupId)
        .eq('is_active', true)
        .order('role', { ascending: false })
        .order('joined_at', { ascending: true });

      if (error) throw error;

      const userIds = Array.from(new Set((data || []).map((i: any) => String(i?.user_id || '')).filter(Boolean)));
      const profilesMap = await fetchProfilesMapByAuthIds(supabase as any, userIds);

      const formattedMembers = (data || []).map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        role: item.role,
        joined_at: item.joined_at,
        full_name: profilesMap.get(String(item.user_id))?.full_name || 'Usuário',
        email: profilesMap.get(String(item.user_id))?.email || '',
        avatar_url: profilesMap.get(String(item.user_id))?.avatar_url,
      }));

      setMembers(formattedMembers);
    } catch (error) {
      console.error('Erro ao carregar membros:', error);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      // Alguns ambientes usam `user_profiles.id = auth.uid()`, outros guardam o auth id em `user_id`.
      // Tentamos com `user_id` e fazemos fallback se a coluna não existir.
      let rows: any[] = [];
      const attemptWithUserId = await supabase
        .from('user_profiles')
        .select('id, user_id, full_name, email, user_type, avatar_url, avatar')
        .neq('user_type', 'client');

      if (!attemptWithUserId.error) {
        rows = attemptWithUserId.data || [];
      } else {
        const attemptWithId = await supabase
          .from('user_profiles')
          .select('id, full_name, email, user_type, avatar_url, avatar')
          .neq('user_type', 'client');
        if (attemptWithId.error) throw attemptWithId.error;
        rows = attemptWithId.data || [];
      }

      const memberIds = new Set(members.map((m) => String(m.user_id)));
      const available = (rows || [])
        .map((u: any) => {
          const authId = u?.user_id ? String(u.user_id) : u?.id ? String(u.id) : null;
          if (!authId) return null;
          return {
            id: authId,
            full_name: String(u?.full_name || 'Usuário'),
            email: String(u?.email || ''),
            user_type: String(u?.user_type || ''),
            avatar_url: u?.avatar_url ? String(u.avatar_url) : u?.avatar ? String(u.avatar) : undefined,
          };
        })
        .filter(Boolean)
        .filter((u: any) => !memberIds.has(String(u.id)));

      setAvailableUsers(available as any);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  const handleAddMember = async (userId: string) => {
    if (!isAdmin) {
      alert('Apenas administradores podem adicionar membros');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from('group_participants').insert({
        group_id: groupId,
        user_id: userId,
        role: 'member',
        is_active: true,
      });

      if (error) throw error;

      await loadMembers();
      await loadAvailableUsers();
    } catch (error) {
      console.error('Erro ao adicionar membro:', error);
      alert('Erro ao adicionar membro');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (participantId: string, userId: string) => {
    if (!isAdmin) {
      alert('Apenas administradores podem remover membros');
      return;
    }

    if (userId === currentUserId) {
      alert('Você não pode remover a si mesmo');
      return;
    }

    if (!confirm('Tem certeza que deseja remover este membro?')) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('group_participants')
        .update({ is_active: false })
        .eq('id', participantId);

      if (error) throw error;

      await loadMembers();
      await loadAvailableUsers();
    } catch (error) {
      console.error('Erro ao remover membro:', error);
      alert('Erro ao remover membro');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAdmin = async (participantId: string, currentRole: string) => {
    if (!isAdmin) {
      alert('Apenas administradores podem alterar funções');
      return;
    }

    setIsLoading(true);
    try {
      const newRole = currentRole === 'admin' ? 'member' : 'admin';
      const { error } = await supabase
        .from('group_participants')
        .update({ role: newRole })
        .eq('id', participantId);

      if (error) throw error;

      await loadMembers();
    } catch (error) {
      console.error('Erro ao alterar função:', error);
      alert('Erro ao alterar função');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveGroupInfo = async () => {
    if (!isAdmin) {
      alert('Apenas administradores podem editar informações do grupo');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('message_groups')
        .update({
          name: groupName,
          description: groupDescription,
          updated_at: new Date().toISOString(),
        })
        .eq('id', groupId);

      if (error) throw error;

      setIsEditing(false);
      alert('Informações do grupo atualizadas!');
    } catch (error) {
      console.error('Erro ao atualizar grupo:', error);
      alert('Erro ao atualizar informações');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAvailableUsers = availableUsers.filter(user =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] flex flex-col">
        <CardHeader className="flex-shrink-0 border-b">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-2">
                  <Input
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="text-lg font-semibold"
                  />
                  <Input
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    placeholder="Descrição do grupo"
                    className="text-sm"
                  />
                </div>
              ) : (
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    {groupName}
                    {isAdmin && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="ml-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </CardTitle>
                  {groupDescription && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {groupDescription}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">{members.length} membros</p>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {isEditing && (
                <>
                  <Button size="sm" onClick={handleSaveGroupInfo} disabled={isLoading}>
                    <Save className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setGroupName(initialGroupName);
                      setGroupDescription(initialGroupDescription || '');
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </>
              )}
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <div className="flex-shrink-0 border-b">
          <div className="flex">
            <button
              onClick={() => setActiveTab('members')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'members'
                  ? 'border-b-2 border-primary text-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Membros ({members.length})
            </button>
            {isAdmin && (
              <>
                <button
                  onClick={() => setActiveTab('add')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'add'
                      ? 'border-b-2 border-primary text-blue-600'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Adicionar Membros
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'settings'
                      ? 'border-b-2 border-primary text-blue-600'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Configurações
                </button>
              </>
            )}
          </div>
        </div>

        <CardContent className="flex-1 overflow-y-auto p-0">
          {activeTab === 'members' ? (
            <div>
              {members.map((member) => (
                <div
                  key={member.id}
                  className="p-4 border-b hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {member.avatar_url ? (
                        <img
                          src={member.avatar_url}
                          alt=""
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1672d6] to-[#001533] flex items-center justify-center text-white font-medium">
                          {getInitials(member.full_name)}
                        </div>
                      )}
                      <div className="absolute bottom-0 right-0">
                        <PresenceIndicator userId={member.user_id} size="md" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {member.full_name}
                        </p>
                        {member.role === 'admin' && (
                          <Badge className="bg-blue-600 text-white">
                            <Crown className="w-3 h-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                        {member.user_id === currentUserId && (
                          <Badge variant="outline">Você</Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{member.email}</p>
                      <p className="text-xs text-gray-400">
                        Entrou em {new Date(member.joined_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>

                    {isAdmin && member.user_id !== currentUserId && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleAdmin(member.id, member.role)}
                          title={
                            member.role === 'admin'
                              ? 'Remover como admin'
                              : 'Promover a admin'
                          }
                        >
                          <Crown className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemoveMember(member.id, member.user_id)}
                          title="Remover do grupo"
                          className="text-red-600 hover:bg-red-50"
                        >
                          <UserMinus className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : activeTab === 'add' ? (
            <div>
              <div className="p-4 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                {filteredAvailableUsers.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-sm text-gray-500">Nenhum usuário disponível</p>
                  </div>
                ) : (
                  filteredAvailableUsers.map((user) => (
                    <div
                      key={user.id}
                      className="p-4 border-b hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
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

                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {user.full_name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>

                        <Button
                          size="sm"
                          onClick={() => handleAddMember(user.id)}
                          disabled={isLoading}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <UserPlus className="w-4 h-4 mr-1" />
                          Adicionar
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Avatar do Grupo
                </h3>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {groupAvatar ? (
                      <img
                        src={groupAvatar}
                        alt="Avatar do grupo"
                        className="w-24 h-24 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#1672d6] to-[#001533] flex items-center justify-center border-4 border-gray-200 dark:border-gray-700">
                        <Users className="w-12 h-12 text-white" />
                      </div>
                    )}
                    {isAdmin && (
                      <label
                        htmlFor="avatar-upload"
                        className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors shadow-lg"
                      >
                        <Camera className="w-4 h-4 text-white" />
                      </label>
                    )}
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={!isAdmin || isUploadingAvatar}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Personalize o avatar do grupo
                    </p>
                    {isAdmin && (
                      <label
                        htmlFor="avatar-upload"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                        {isUploadingAvatar ? 'Enviando...' : 'Carregar Imagem'}
                      </label>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Recomendado: 256x256px, máx 2MB
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Informações do Grupo
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total de membros:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{members.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Administradores:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {members.filter(m => m.role === 'admin').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Tipo:</span>
                    <Badge variant="outline">Grupo</Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
