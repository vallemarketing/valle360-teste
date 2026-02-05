'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Send, X, Users, User } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';

interface Group {
  id: string;
  name: string;
  description?: string;
}

interface Conversation {
  id: string;
  other_user_name: string;
  other_user_avatar?: string;
}

interface ForwardMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageId: string;
  messageType: 'group' | 'direct';
  messageBody: string;
  currentUserId: string;
}

export function ForwardMessageModal({
  isOpen,
  onClose,
  messageId,
  messageType,
  messageBody,
  currentUserId,
}: ForwardMessageModalProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDestinations, setSelectedDestinations] = useState<
    Array<{ id: string; type: 'group' | 'direct'; name: string }>
  >([]);
  const [isForwarding, setIsForwarding] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadDestinations();
    }
  }, [isOpen]);

  const loadDestinations = async () => {
    try {
      const { data: groupsData } = await supabase
        .from('group_participants')
        .select('group_id, groups(id, name, description)')
        .eq('user_id', currentUserId)
        .eq('is_active', true);

      const { data: conversationsData } = await supabase
        .from('direct_conversation_participants')
        .select(`
          conversation_id,
          direct_conversations(
            id,
            participant1:user_profiles!direct_conversations_participant1_id_fkey(full_name, avatar_url),
            participant2:user_profiles!direct_conversations_participant2_id_fkey(full_name, avatar_url),
            participant1_id,
            participant2_id
          )
        `)
        .eq('user_id', currentUserId)
        .eq('is_active', true);

      const groupsList =
        groupsData?.map((g: any) => ({
          id: g.groups.id,
          name: g.groups.name,
          description: g.groups.description,
        })) || [];

      const conversationsList =
        conversationsData?.map((c: any) => {
          const conv = c.direct_conversations;
          const otherUser =
            conv.participant1_id === currentUserId ? conv.participant2 : conv.participant1;
          return {
            id: conv.id,
            other_user_name: otherUser.full_name,
            other_user_avatar: otherUser.avatar_url,
          };
        }) || [];

      setGroups(groupsList);
      setConversations(conversationsList);
    } catch (error) {
      console.error('Erro ao carregar destinos:', error);
    }
  };

  const toggleDestination = (id: string, type: 'group' | 'direct', name: string) => {
    setSelectedDestinations((prev) => {
      const exists = prev.find((d) => d.id === id && d.type === type);
      if (exists) {
        return prev.filter((d) => !(d.id === id && d.type === type));
      }
      return [...prev, { id, type, name }];
    });
  };

  const handleForward = async () => {
    if (selectedDestinations.length === 0) return;

    setIsForwarding(true);
    try {
      for (const dest of selectedDestinations) {
        if (dest.type === 'group') {
          const { data: newMessage, error: msgError } = await supabase
            .from('messages')
            .insert({
              group_id: dest.id,
              from_user_id: currentUserId,
              body: messageBody,
              type: 'text',
              is_forwarded: true,
              forwarded_from_id: messageId,
            })
            .select()
            .single();

          if (msgError) throw msgError;

          await supabase.from('message_forwards').insert({
            original_message_id: messageId,
            original_message_type: messageType,
            new_message_id: newMessage.id,
            new_message_type: 'group',
            forwarded_by: currentUserId,
            forwarded_to_group_id: dest.id,
          });
        } else {
          const { data: newMessage, error: msgError } = await supabase
            .from('direct_messages')
            .insert({
              conversation_id: dest.id,
              from_user_id: currentUserId,
              body: messageBody,
              message_type: 'text',
              is_forwarded: true,
              forwarded_from_id: messageId,
            })
            .select()
            .single();

          if (msgError) throw msgError;

          await supabase.from('message_forwards').insert({
            original_message_id: messageId,
            original_message_type: messageType,
            new_message_id: newMessage.id,
            new_message_type: 'direct',
            forwarded_by: currentUserId,
            forwarded_to_conversation_id: dest.id,
          });
        }
      }

      onClose();
      setSelectedDestinations([]);
    } catch (error) {
      console.error('Erro ao encaminhar mensagem:', error);
      alert('Erro ao encaminhar mensagem');
    } finally {
      setIsForwarding(false);
    }
  };

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredConversations = conversations.filter((c) =>
    c.other_user_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Encaminhar Mensagem
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="p-4 border-b bg-gray-50 dark:bg-gray-800">
            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-2">
              {messageBody}
            </p>
            {selectedDestinations.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedDestinations.map((dest) => (
                  <span
                    key={`${dest.type}-${dest.id}`}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-xs"
                  >
                    {dest.name}
                    <button
                      onClick={() => toggleDestination(dest.id, dest.type, dest.name)}
                      className="hover:bg-primary200 dark:hover:bg-amber-800 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar conversas ou grupos..."
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {filteredGroups.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Grupos
                </h3>
                <div className="space-y-1">
                  {filteredGroups.map((group) => {
                    const isSelected = selectedDestinations.some(
                      (d) => d.id === group.id && d.type === 'group'
                    );
                    return (
                      <button
                        key={group.id}
                        onClick={() => toggleDestination(group.id, 'group', group.name)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                          isSelected
                            ? 'bg-amber-100 dark:bg-amber-900/30'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
                          <Users className="w-5 h-5" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {group.name}
                          </p>
                          {group.description && (
                            <p className="text-xs text-gray-500 truncate">{group.description}</p>
                          )}
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs">
                            ✓
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {filteredConversations.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Conversas Diretas
                </h3>
                <div className="space-y-1">
                  {filteredConversations.map((conv) => {
                    const isSelected = selectedDestinations.some(
                      (d) => d.id === conv.id && d.type === 'direct'
                    );
                    return (
                      <button
                        key={conv.id}
                        onClick={() =>
                          toggleDestination(conv.id, 'direct', conv.other_user_name)
                        }
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                          isSelected
                            ? 'bg-amber-100 dark:bg-amber-900/30'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-gray-400 flex items-center justify-center text-white">
                          <User className="w-5 h-5" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {conv.other_user_name}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs">
                            ✓
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleForward}
              disabled={isForwarding || selectedDestinations.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="w-4 h-4 mr-2" />
              {isForwarding
                ? 'Encaminhando...'
                : `Encaminhar (${selectedDestinations.length})`}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
