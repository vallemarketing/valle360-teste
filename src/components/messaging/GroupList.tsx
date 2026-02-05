'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, Users, User, MessageCircle } from 'lucide-react';

interface Group {
  id: string;
  name: string;
  type: string;
  description?: string;
  last_message_at?: string;
  last_message_preview?: string;
  unread_count?: number;
}

interface GroupListProps {
  onSelectGroup: (group: Group) => void;
  selectedGroupId?: string;
  currentUserId: string;
  adminView?: boolean;
  onCreateGroup?: () => void;
}

export function GroupList({
  onSelectGroup,
  selectedGroupId,
  currentUserId,
  adminView = false,
  onCreateGroup,
}: GroupListProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadGroups();

    const channel = supabase
      .channel('groups-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_groups',
        },
        () => {
          loadGroups();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_participants',
        },
        () => {
          loadGroups();
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
          loadGroups();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  const loadGroups = async () => {
    try {
      setIsLoading(true);

      let groupData: any[] = [];

      if (adminView) {
        const { data, error } = await supabase
          .from('message_groups')
          .select('id, name, type, description, last_message_at, last_message_preview')
          .order('last_message_at', { ascending: false, nullsFirst: false });
        if (error) throw error;
        groupData = (data || []).map((g: any) => ({ ...g, unread_count: 0 }));
      } else {
        const { data: participations, error: participError } = await supabase
          .from('group_participants')
          .select(`
            unread_count,
            message_groups!inner (
              id,
              name,
              type,
              description,
              last_message_at,
              last_message_preview
            )
          `)
          .eq('user_id', currentUserId)
          .eq('is_active', true);

        if (participError) throw participError;

        groupData = (participations || []).map((p: any) => ({
          ...p.message_groups,
          unread_count: p.unread_count,
        }));
      }

      groupData.sort((a, b) => {
        const dateA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
        const dateB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
        return dateB - dateA;
      });

      setGroups(groupData);
    } catch (error) {
      console.error('Erro ao carregar grupos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredGroups = groups.filter((group) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      group.name?.toLowerCase().includes(search) ||
      group.description?.toLowerCase().includes(search) ||
      group.last_message_preview?.toLowerCase().includes(search)
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

  const getGroupIcon = (type: string) => {
    switch (type) {
      case 'general':
        return <Users className="w-5 h-5" />;
      case 'project':
        return <MessageCircle className="w-5 h-5" />;
      default:
        return <Users className="w-5 h-5" />;
    }
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
            Grupos
          </h2>
          {onCreateGroup && (
            <Button
              size="sm"
              onClick={onCreateGroup}
              className="bg-primary hover:bg-[#1260b5]"
              title="Criar novo grupo"
            >
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar grupos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredGroups.length === 0 ? (
          <div className="p-8 text-center">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              {searchTerm ? 'Nenhum grupo encontrado' : 'Nenhum grupo ainda'}
            </p>
          </div>
        ) : (
          filteredGroups.map((group) => (
            <button
              key={group.id}
              onClick={() => onSelectGroup(group)}
              className={`w-full p-4 border-b hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left ${
                selectedGroupId === group.id
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-primary'
                  : ''
              }`}
            >
              <div className="flex gap-3">
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1672d6] to-[#001533] flex items-center justify-center text-white font-medium">
                    {getGroupIcon(group.type)}
                  </div>
                  {group.unread_count && group.unread_count > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 bg-red-600 text-white text-xs">
                      {group.unread_count > 9 ? '9+' : group.unread_count}
                    </Badge>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span
                        className={`font-medium text-gray-900 dark:text-white truncate ${
                          group.unread_count && group.unread_count > 0 ? 'font-bold' : ''
                        }`}
                      >
                        {group.name}
                      </span>
                      {group.type === 'general' && (
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          Geral
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                      {formatTime(group.last_message_at)}
                    </span>
                  </div>
                  {group.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-1">
                      {group.description}
                    </p>
                  )}
                  {group.last_message_preview && (
                    <p
                      className={`text-sm text-gray-600 dark:text-gray-400 truncate ${
                        group.unread_count && group.unread_count > 0
                          ? 'font-semibold text-gray-900 dark:text-white'
                          : ''
                      }`}
                    >
                      {group.last_message_preview}
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
