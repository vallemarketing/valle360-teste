'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Clock, X, Calendar } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';

interface ScheduleMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  destinationId: string;
  destinationType: 'group' | 'direct';
  currentUserId: string;
  messageBody: string;
}

export function ScheduleMessageModal({
  isOpen,
  onClose,
  destinationId,
  destinationType,
  currentUserId,
  messageBody,
}: ScheduleMessageModalProps) {
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSchedule = async () => {
    if (!scheduledDate || !scheduledTime) return;

    const scheduledFor = new Date(`${scheduledDate}T${scheduledTime}`);

    if (scheduledFor <= new Date()) {
      alert('A data e hora devem ser futuras');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from('scheduled_messages').insert({
        user_id: currentUserId,
        destination_type: destinationType,
        destination_id: destinationId,
        body: messageBody,
        scheduled_for: scheduledFor.toISOString(),
        status: 'pending',
      });

      if (error) throw error;

      onClose();
      alert(`Mensagem agendada para ${scheduledFor.toLocaleString('pt-BR')}`);
    } catch (error) {
      console.error('Erro ao agendar mensagem:', error);
      alert('Erro ao agendar mensagem');
    } finally {
      setIsLoading(false);
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    return now.toISOString().slice(0, 16);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Agendar Mensagem
            </h3>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="space-y-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                {messageBody}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Data
              </label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Hora
              </label>
              <Input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
            </div>

            {scheduledDate && scheduledTime && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Mensagem será enviada em:{' '}
                  <strong>
                    {new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString('pt-BR')}
                  </strong>
                </p>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                onClick={handleSchedule}
                disabled={isLoading || !scheduledDate || !scheduledTime}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? 'Agendando...' : 'Agendar'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
