'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pin } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';

interface PinMessageButtonProps {
  messageId: string;
  messageType: 'group' | 'direct';
  conversationId: string;
  currentUserId: string;
  compact?: boolean;
}

export function PinMessageButton({
  messageId,
  messageType,
  conversationId,
  currentUserId,
  compact = false,
}: PinMessageButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePin = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.from('pinned_messages').insert({
        message_id: messageId,
        message_type: messageType,
        conversation_id: conversationId,
        pinned_by: currentUserId,
        note: note.trim() || null,
      });

      if (error) {
        if (error.code === '23505') {
          alert('Esta mensagem já está fixada!');
        } else {
          throw error;
        }
      } else {
        setIsOpen(false);
        setNote('');
      }
    } catch (error) {
      console.error('Erro ao fixar mensagem:', error);
      alert('Erro ao fixar mensagem');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size={compact ? 'sm' : 'default'}
        onClick={() => setIsOpen(true)}
        className={compact ? 'h-6 w-6 p-0' : ''}
        title="Fixar mensagem"
      >
        <Pin className={compact ? 'w-3 h-3' : 'w-4 h-4'} />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Fixar Mensagem
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nota (opcional)
                </label>
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Adicione uma nota explicativa..."
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {note.length}/200 caracteres
                </p>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handlePin} disabled={isLoading}>
                  {isLoading ? 'Fixando...' : 'Fixar'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
}
