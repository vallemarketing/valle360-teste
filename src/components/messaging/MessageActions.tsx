'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Edit2,
  Trash2,
  Forward,
  Reply,
  MoreVertical,
  Clock,
  MapPin,
} from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';

interface Message {
  id: string;
  body: string;
  from_user_id: string;
  created_at: string;
  is_edited?: boolean;
  is_deleted?: boolean;
  reply_to_message_id?: string;
  location_lat?: number;
  location_lng?: number;
  location_name?: string;
}

interface MessageActionsProps {
  message: Message;
  messageType: 'group' | 'direct';
  currentUserId: string;
  onReply: (messageId: string) => void;
  onForward: (messageId: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isSuperAdmin?: boolean;
}

export function MessageActions({
  message,
  messageType,
  currentUserId,
  onReply,
  onForward,
  onEdit,
  onDelete,
  isSuperAdmin = false,
}: MessageActionsProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editedBody, setEditedBody] = useState(message.body);
  const [isLoading, setIsLoading] = useState(false);

  const isOwnMessage = message.from_user_id === currentUserId;
  const canDelete = isOwnMessage || isSuperAdmin; // Super Admin pode deletar qualquer mensagem
  const canEdit = isOwnMessage && !message.is_deleted;
  const messageAge = Date.now() - new Date(message.created_at).getTime();
  const canEditTime = messageAge < 15 * 60 * 1000; // 15 minutos

  const handleEdit = async () => {
    if (!editedBody.trim() || editedBody === message.body) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.rpc('edit_message', {
        p_message_id: message.id,
        p_message_type: messageType,
        p_new_body: editedBody.trim(),
        p_user_id: currentUserId,
      });

      if (error) throw error;

      setShowEditModal(false);
      if (onEdit) onEdit();
    } catch (error: any) {
      console.error('Erro ao editar mensagem:', error);
      alert(error.message || 'Erro ao editar mensagem');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (deletionType: 'for_me' | 'for_everyone') => {
    setIsLoading(true);
    try {
      const { error } = await supabase.rpc('delete_message', {
        p_message_id: message.id,
        p_message_type: messageType,
        p_user_id: currentUserId,
        p_deletion_type: deletionType,
      });

      if (error) throw error;

      setShowDeleteModal(false);
      if (onDelete) onDelete();
    } catch (error: any) {
      console.error('Erro ao excluir mensagem:', error);
      alert(error.message || 'Erro ao excluir mensagem');
    } finally {
      setIsLoading(false);
    }
  };

  if (message.is_deleted) {
    return null;
  }

  return (
    <>
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowMenu(!showMenu)}
          className="h-6 w-6 p-0"
        >
          <MoreVertical className="w-4 h-4" />
        </Button>

        {showMenu && (
          <div className="absolute right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50 min-w-[180px]">
            <button
              onClick={() => {
                onReply(message.id);
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <Reply className="w-4 h-4" />
              Responder
            </button>

            <button
              onClick={() => {
                onForward(message.id);
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <Forward className="w-4 h-4" />
              Encaminhar
            </button>

            {canEdit && canEditTime && (
              <button
                onClick={() => {
                  setShowEditModal(true);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Editar
              </button>
            )}

            {canDelete && (
              <button
                onClick={() => {
                  setShowDeleteModal(true);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600"
              >
                <Trash2 className="w-4 h-4" />
                {isSuperAdmin && !isOwnMessage ? 'Excluir (Admin)' : 'Excluir'}
              </button>
            )}
          </div>
        )}
      </div>

      {showEditModal && (
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Editar Mensagem
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mensagem
                  </label>
                  <textarea
                    value={editedBody}
                    onChange={(e) => setEditedBody(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white min-h-[100px]"
                    maxLength={2000}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {editedBody.length}/2000 caracteres
                  </p>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowEditModal(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleEdit}
                    disabled={isLoading || !editedBody.trim() || editedBody === message.body}
                  >
                    {isLoading ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Dialog>
      )}

      {showDeleteModal && (
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Excluir Mensagem
              </h3>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Como você deseja excluir esta mensagem?
              </p>

              <div className="space-y-3">
                <Button
                  variant="outline"
                  onClick={() => handleDelete('for_me')}
                  disabled={isLoading}
                  className="w-full justify-start"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir para mim
                </Button>

                {(isOwnMessage || isSuperAdmin) && (
                  <Button
                    variant="outline"
                    onClick={() => handleDelete('for_everyone')}
                    disabled={isLoading}
                    className="w-full justify-start text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir para todos
                  </Button>
                )}

                <Button
                  variant="ghost"
                  onClick={() => setShowDeleteModal(false)}
                  className="w-full"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </>
  );
}
