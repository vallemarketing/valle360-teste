'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageCircle, Calendar, Clock, TrendingUp, X } from 'lucide-react';

interface InteractionStats {
  total_messages: number;
  messages_sent: number;
  messages_received: number;
  first_message_at: string;
  last_message_at: string;
  avg_response_time_minutes: number;
  most_active_day: string;
}

interface ClientInteractionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
  conversationId: string;
}

export function ClientInteractionHistory({
  isOpen,
  onClose,
  clientId,
  clientName,
  conversationId,
}: ClientInteractionHistoryProps) {
  const [stats, setStats] = useState<InteractionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadStats();
    }
  }, [isOpen, conversationId]);

  const loadStats = async () => {
    try {
      setIsLoading(true);

      const { data: messages, error } = await supabase
        .from('direct_messages')
        .select('from_user_id, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (!messages || messages.length === 0) {
        setStats(null);
        return;
      }

      const messagesSent = messages.filter(m => m.from_user_id !== clientId).length;
      const messagesReceived = messages.filter(m => m.from_user_id === clientId).length;

      const dayCount: Record<string, number> = {};
      messages.forEach(msg => {
        const day = new Date(msg.created_at).toLocaleDateString('pt-BR', { weekday: 'long' });
        dayCount[day] = (dayCount[day] || 0) + 1;
      });

      const mostActiveDay = Object.entries(dayCount).reduce((a, b) =>
        a[1] > b[1] ? a : b
      )[0];

      let totalResponseTime = 0;
      let responseCount = 0;

      for (let i = 1; i < messages.length; i++) {
        if (messages[i].from_user_id !== messages[i - 1].from_user_id) {
          const timeDiff = new Date(messages[i].created_at).getTime() -
                          new Date(messages[i - 1].created_at).getTime();
          totalResponseTime += timeDiff;
          responseCount++;
        }
      }

      const avgResponseTimeMinutes = responseCount > 0
        ? Math.round(totalResponseTime / responseCount / 60000)
        : 0;

      setStats({
        total_messages: messages.length,
        messages_sent: messagesSent,
        messages_received: messagesReceived,
        first_message_at: messages[0].created_at,
        last_message_at: messages[messages.length - 1].created_at,
        avg_response_time_minutes: avgResponseTimeMinutes,
        most_active_day: mostActiveDay,
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatResponseTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutos`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hora${hours > 1 ? 's' : ''}`;
    const days = Math.floor(hours / 24);
    return `${days} dia${days > 1 ? 's' : ''}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col">
        <CardHeader className="flex-shrink-0 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              Histórico de Interações
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {clientName}
          </p>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : !stats ? (
            <div className="text-center py-12">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                Nenhuma interação registrada ainda
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageCircle className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-medium text-blue-900 dark:text-blue-300">
                      Total de Mensagens
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.total_messages}
                  </p>
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-medium text-green-900 dark:text-green-300">
                      Taxa de Resposta
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.messages_received > 0
                      ? Math.round((stats.messages_sent / stats.messages_received) * 100)
                      : 0}%
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Tempo Médio de Resposta
                    </span>
                  </div>
                  <Badge variant="outline">
                    {formatResponseTime(stats.avg_response_time_minutes)}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Dia Mais Ativo
                    </span>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {stats.most_active_day}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Mensagens Enviadas
                    </span>
                  </div>
                  <Badge className="bg-blue-600 text-white">
                    {stats.messages_sent}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Mensagens Recebidas
                    </span>
                  </div>
                  <Badge className="bg-green-600 text-white">
                    {stats.messages_received}
                  </Badge>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Linha do Tempo
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Primeira Mensagem
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      {formatDate(stats.first_message_at)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Última Mensagem
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      {formatDate(stats.last_message_at)}
                    </span>
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
