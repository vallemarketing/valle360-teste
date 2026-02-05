'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, X, Check, CheckCheck, Trash2, Settings,
  MessageSquare, AlertTriangle, DollarSign, Users,
  Calendar, FileText, Target, Sparkles, Filter,
  Volume2, VolumeX, Mail, Smartphone
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'message' | 'task' | 'payment' | 'approval';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  sender?: {
    name: string;
    avatar?: string;
  };
  metadata?: Record<string, any>;
}

interface NotificationPreferences {
  email: boolean;
  push: boolean;
  whatsapp: boolean;
  sound: boolean;
  categories: {
    tasks: boolean;
    messages: boolean;
    payments: boolean;
    approvals: boolean;
    system: boolean;
  };
}

const SAMPLE_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'warning',
    title: 'Cliente em risco de churn',
    message: 'Tech Corp deu NPS 4. Ação urgente necessária.',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    read: false,
    actionUrl: '/admin/nps',
    actionLabel: 'Ver detalhes'
  },
  {
    id: '2',
    type: 'message',
    title: 'Nova mensagem de Maria',
    message: 'Olá! Preciso de ajuda com o projeto do cliente ABC...',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    read: false,
    actionUrl: '/colaborador/mensagens',
    sender: { name: 'Maria Silva', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maria' }
  },
  {
    id: '3',
    type: 'approval',
    title: 'Aprovação pendente',
    message: '3 posts aguardando aprovação do cliente Loja ABC.',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    read: false,
    actionUrl: '/colaborador/aprovacoes',
    actionLabel: 'Revisar'
  },
  {
    id: '4',
    type: 'payment',
    title: 'Fatura paga',
    message: 'Cliente Startup XYZ pagou R$ 8.500,00.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: true,
    actionUrl: '/admin/financeiro'
  },
  {
    id: '5',
    type: 'task',
    title: 'Tarefa atrasada',
    message: 'Banner promocional está 2 dias atrasado.',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
    read: true,
    actionUrl: '/colaborador/kanban'
  },
  {
    id: '6',
    type: 'success',
    title: 'Meta atingida! 🎉',
    message: 'Você atingiu 100% da meta de novembro!',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    read: true
  }
];

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  info: { icon: <Bell className="w-4 h-4" />, color: '#3B82F6', bg: '#EFF6FF' },
  success: { icon: <Check className="w-4 h-4" />, color: '#10B981', bg: '#ECFDF5' },
  warning: { icon: <AlertTriangle className="w-4 h-4" />, color: '#F59E0B', bg: '#FFFBEB' },
  error: { icon: <AlertTriangle className="w-4 h-4" />, color: '#EF4444', bg: '#FEF2F2' },
  message: { icon: <MessageSquare className="w-4 h-4" />, color: '#8B5CF6', bg: '#F5F3FF' },
  task: { icon: <Target className="w-4 h-4" />, color: '#6366F1', bg: '#EEF2FF' },
  payment: { icon: <DollarSign className="w-4 h-4" />, color: '#10B981', bg: '#ECFDF5' },
  approval: { icon: <FileText className="w-4 h-4" />, color: '#F59E0B', bg: '#FFFBEB' }
};

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>(SAMPLE_NOTIFICATIONS);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: true,
    push: true,
    whatsapp: false,
    sound: true,
    categories: {
      tasks: true,
      messages: true,
      payments: true,
      approvals: true,
      system: true
    }
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => !n.read);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed top-0 right-0 h-full w-full max-w-md z-50 shadow-2xl"
            style={{ backgroundColor: 'var(--bg-primary)' }}
          >
            {/* Header */}
            <div 
              className="p-4 border-b flex items-center justify-between"
              style={{ borderColor: 'var(--border-light)' }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: 'var(--primary-100)' }}
                >
                  <Bell className="w-5 h-5" style={{ color: 'var(--primary-500)' }} />
                </div>
                <div>
                  <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Notificações
                  </h2>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {unreadCount > 0 ? `${unreadCount} não lidas` : 'Todas lidas'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 rounded-lg transition-colors"
                  style={{ backgroundColor: 'var(--bg-secondary)' }}
                >
                  <Settings className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg transition-colors"
                  style={{ backgroundColor: 'var(--bg-secondary)' }}
                >
                  <X className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                </button>
              </div>
            </div>

            {/* Settings Panel */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-b overflow-hidden"
                  style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--bg-secondary)' }}
                >
                  <div className="p-4 space-y-4">
                    <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      Preferências de Notificação
                    </h3>

                    {/* Channels */}
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.email}
                          onChange={(e) => setPreferences(p => ({ ...p, email: e.target.checked }))}
                          className="w-4 h-4"
                        />
                        <Mail className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Email</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.push}
                          onChange={(e) => setPreferences(p => ({ ...p, push: e.target.checked }))}
                          className="w-4 h-4"
                        />
                        <Smartphone className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Push</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.sound}
                          onChange={(e) => setPreferences(p => ({ ...p, sound: e.target.checked }))}
                          className="w-4 h-4"
                        />
                        {preferences.sound ? (
                          <Volume2 className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                        ) : (
                          <VolumeX className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                        )}
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Som</span>
                      </label>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Filters & Actions */}
            <div 
              className="p-3 border-b flex items-center justify-between"
              style={{ borderColor: 'var(--border-light)' }}
            >
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: filter === 'all' ? 'var(--primary-500)' : 'var(--bg-secondary)',
                    color: filter === 'all' ? 'white' : 'var(--text-secondary)'
                  }}
                >
                  Todas
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: filter === 'unread' ? 'var(--primary-500)' : 'var(--bg-secondary)',
                    color: filter === 'unread' ? 'white' : 'var(--text-secondary)'
                  }}
                >
                  Não lidas ({unreadCount})
                </button>
              </div>

              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs flex items-center gap-1 px-2 py-1 rounded"
                    style={{ color: 'var(--primary-500)' }}
                  >
                    <CheckCheck className="w-3 h-3" />
                    Marcar todas
                  </button>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Bell 
                    className="w-16 h-16 mb-4 opacity-20"
                    style={{ color: 'var(--text-tertiary)' }}
                  />
                  <p style={{ color: 'var(--text-secondary)' }}>
                    {filter === 'unread' ? 'Nenhuma notificação não lida' : 'Nenhuma notificação'}
                  </p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: 'var(--border-light)' }}>
                  {filteredNotifications.map((notification, index) => {
                    const config = TYPE_CONFIG[notification.type];
                    
                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-4 transition-colors cursor-pointer ${!notification.read ? 'bg-opacity-50' : ''}`}
                        style={{ 
                          backgroundColor: !notification.read ? `${config.bg}50` : 'transparent'
                        }}
                        onClick={() => {
                          markAsRead(notification.id);
                          if (notification.actionUrl) {
                            window.location.href = notification.actionUrl;
                          }
                        }}
                      >
                        <div className="flex gap-3">
                          {/* Icon or Avatar */}
                          {notification.sender?.avatar ? (
                            <img 
                              src={notification.sender.avatar}
                              alt={notification.sender.name}
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div 
                              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: config.bg, color: config.color }}
                            >
                              {config.icon}
                            </div>
                          )}

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 
                                className={`text-sm ${!notification.read ? 'font-semibold' : 'font-medium'}`}
                                style={{ color: 'var(--text-primary)' }}
                              >
                                {notification.title}
                              </h4>
                              <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>
                                {formatTime(notification.timestamp)}
                              </span>
                            </div>
                            <p 
                              className="text-sm mt-0.5 line-clamp-2"
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              {notification.message}
                            </p>

                            {/* Actions */}
                            <div className="flex items-center gap-2 mt-2">
                              {notification.actionLabel && (
                                <button
                                  className="text-xs px-2 py-1 rounded font-medium"
                                  style={{ backgroundColor: config.bg, color: config.color }}
                                >
                                  {notification.actionLabel}
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                                className="text-xs p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{ color: 'var(--text-tertiary)' }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Unread indicator */}
                          {!notification.read && (
                            <div 
                              className="w-2 h-2 rounded-full flex-shrink-0 mt-2"
                              style={{ backgroundColor: config.color }}
                            />
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div 
                className="p-3 border-t"
                style={{ borderColor: 'var(--border-light)' }}
              >
                <button
                  onClick={clearAll}
                  className="w-full text-sm py-2 rounded-lg transition-colors"
                  style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                >
                  Limpar todas
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Bell Button Component (para usar no header)
export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount] = useState(3); // Em produção, viria do estado global

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative p-2 rounded-lg transition-colors"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        <Bell className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
        {unreadCount > 0 && (
          <span 
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ backgroundColor: 'var(--error-500)' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationCenter isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

export default NotificationCenter;
