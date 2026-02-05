'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Search, MessageCircle, User, Users } from 'lucide-react';
import { fetchProfileByAuthId } from '@/lib/messaging/userProfiles';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  user_type: string;
  avatar_url?: string;
}

interface NewDirectConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationCreated: (conversationId: string) => void;
  currentUserId: string;
  filterType?: 'all' | 'team' | 'clients';
}

export function NewDirectConversationModal({
  isOpen,
  onClose,
  onConversationCreated,
  currentUserId,
  filterType = 'all',
}: NewDirectConversationModalProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [currentUserType, setCurrentUserType] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadCurrentUserType();
      loadUsers();
    }
  }, [isOpen]);

  const loadCurrentUserType = async () => {
    try {
      const profile = await fetchProfileByAuthId(supabase as any, currentUserId);
      setCurrentUserType(String(profile?.user_type || ''));
    } catch {
      setCurrentUserType('');
    }
  };

  const loadUsers = async () => {
    try {
      console.log('🔍 Buscando usuários...');
      console.log('🔍 FilterType:', filterType);
      console.log('🔍 CurrentUserId:', currentUserId);
      
      // Buscar todos os perfis ativos
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, user_id, full_name, email, user_type, avatar_url, avatar, is_active')
        .eq('is_active', true)
        .order('full_name');

      if (error) {
        console.error('❌ Erro ao buscar user_profiles:', error);
        throw error;
      }

      console.log('📊 Dados recebidos:', data);

      let filteredData = data || [];

      // Aplicar filtro de tipo
      if (filterType === 'clients') {
        filteredData = filteredData.filter((u) => String(u?.user_type || '') === 'client');
      } else if (filterType === 'team') {
        // Para equipe, pegar todos que NÃO são cliente (employee, admin, super_admin, etc)
        filteredData = filteredData.filter((u) => {
          const userType = String(u?.user_type || '').toLowerCase();
          return userType !== 'client' && userType !== '';
        });
      }

      console.log('📊 Após filtro:', filteredData);

      const normalized: UserProfile[] = filteredData
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
        .filter(Boolean) as UserProfile[];

      const finalUsers = normalized.filter((u) => u.id !== currentUserId);
      console.log('✅ Usuários finais:', finalUsers);
      
      setUsers(finalUsers);
    } catch (error) {
      console.error('❌ Erro ao carregar usuários:', error);
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

  const handleCreateConversation = async (user: UserProfile) => {
    setIsCreating(true);
    try {
      const isClientConversation =
        currentUserType === 'client' || user.user_type === 'client';

      const { data: conversationId, error } = await supabase.rpc(
        'get_or_create_direct_conversation',
        {
          p_user_id_1: currentUserId,
          p_user_id_2: user.id,
          p_is_client_conversation: isClientConversation,
        }
      );

      if (error) throw error;

      onConversationCreated(conversationId);
      handleClose();
    } catch (error) {
      console.error('Erro ao criar conversa:', error);
      alert('Erro ao criar conversa');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
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
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              {filterType === 'clients'
                ? 'Nova Conversa com Cliente'
                : filterType === 'team'
                ? 'Nova Conversa com Equipe'
                : 'Nova Conversa'}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0">
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

          <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
            {filteredUsers.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-gray-500">Nenhum usuário encontrado</p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleCreateConversation(user)}
                  disabled={isCreating}
                  className="w-full p-4 border-b hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt=""
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1672d6] to-[#001533] flex items-center justify-center text-white font-medium">
                        {getInitials(user.full_name)}
                      </div>
                    )}

                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {user.full_name}
                        </p>
                        {user.user_type === 'client' && (
                          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                            Cliente
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      <p className="text-xs text-gray-400">{getRoleLabel(user.user_type)}</p>
                    </div>

                    <MessageCircle className="w-5 h-5 text-gray-400" />
                  </div>
                </button>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
