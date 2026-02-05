'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, X, MessageSquare, UserPlus, Move, Edit } from 'lucide-react';

interface Notification {
  id: string;
  task_id?: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  triggered_by_name?: string;
}

interface NotificationCenterProps {
  onNotificationClick?: (taskId: string) => void;
}

export function NotificationCenter({ onNotificationClick }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/notifications?limit=20');
      const data = await res.json();
      if (!data?.success) return;

      const normalized: Notification[] = (data.notifications || []).map((n: any) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        is_read: Boolean(n.read),
        created_at: n.created_at,
        task_id: (n.metadata as any)?.task_id || undefined,
        triggered_by_name: (n.metadata as any)?.triggered_by_name || (n.metadata as any)?.from_name || undefined,
      }));

      setNotifications(normalized);
      setUnreadCount(Number(data.unreadCount || 0));
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_read', notificationId }),
      });
      await loadNotifications();
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read' }),
      });
      await loadNotifications();
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      // Remoção não suportada pela API atual (mantemos simples por enquanto)
      await markAsRead(notificationId);
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    if (onNotificationClick && notification.task_id) {
      onNotificationClick(notification.task_id);
      setIsOpen(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'mention':
        return <MessageSquare className="w-4 h-4" />;
      case 'assignment':
        return <UserPlus className="w-4 h-4" />;
      case 'move':
        return <Move className="w-4 h-4" />;
      case 'comment':
        return <MessageSquare className="w-4 h-4" />;
      case 'update':
        return <Edit className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
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

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 bg-red-600 text-white text-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full right-0 mt-2 z-50 w-96 bg-white dark:bg-gray-800 border rounded-lg shadow-xl">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">Notificações</h3>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs text-primary hover:text-amber-700"
                >
                  Marcar todas como lidas
                </Button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Carregando...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Nenhuma notificação</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer group ${
                      !notification.is_read ? 'bg-amber-50 dark:bg-amber-900/10' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        notification.is_read
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                          : 'bg-amber-100 dark:bg-amber-900/30 text-primary'
                      }`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {notification.title}
                          </p>
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {formatDate(notification.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {notification.message}
                        </p>
                        {notification.task_id && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 italic">
                            Abrir tarefa relacionada
                          </p>
                        )}
                        {notification.triggered_by_name && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            Por {notification.triggered_by_name}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="h-6 w-6 p-0"
                            title="Marcar como lida"
                          >
                            <Check className="w-3 h-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="h-6 w-6 p-0 text-red-600"
                          title="Deletar"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-3 border-t bg-gray-50 dark:bg-gray-900">
                <Button
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-sm"
                >
                  Fechar
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
