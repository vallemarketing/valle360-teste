'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Check, X, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  created_at: string
  link?: string | null
  metadata?: any
}

export function NotificationBell(props?: { context?: 'admin' | 'colaborador' | 'cliente' }) {
  const context = props?.context || 'admin'
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadNotifications()
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/notifications?limit=10')
      const data = await response.json()
      
      if (data.notifications) {
        setNotifications(data.notifications)
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_read', notificationId })
      })
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
    } catch (error) {
      console.error('Erro ao marcar como lida:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read' })
      })
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error)
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_completed':
        return '✅'
      case 'task_assigned':
        return '📋'
      case 'mention':
        return '👤'
      case 'system':
        return '⚙️'
      default:
        return '🔔'
    }
  }

  const getNotificationTargetUrl = (notification: Notification) => {
    const meta = notification.metadata || {}
    const boardId = meta?.board_id as string | undefined
    const taskId = meta?.task_id as string | undefined

    if (boardId && taskId) {
      if (context === 'colaborador') {
        return `/colaborador/kanban?boardId=${encodeURIComponent(boardId)}&taskId=${encodeURIComponent(taskId)}`
      }
      if (context === 'cliente') {
        return `/cliente/producao`
      }
      return `/admin/meu-kanban?boardId=${encodeURIComponent(boardId)}&taskId=${encodeURIComponent(taskId)}`
    }

    if (notification.link) return notification.link

    // Fallbacks úteis quando for evento do Hub
    const transitionId = meta?.workflow_transition_id as string | undefined
    if (transitionId) {
      if (context === 'admin') return `/admin/fluxos?tab=transitions&q=${encodeURIComponent(transitionId)}`
      return null
    }

    return null
  }

  const handleNotificationClick = async (notification: Notification) => {
    try {
      if (!notification.read) {
        await markAsRead(notification.id)
      }
    } finally {
      const url = getNotificationTargetUrl(notification)
      if (url) {
        setIsOpen(false)
        router.push(url)
      }
    }
  }

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-opacity-80 transition-all"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        <Bell className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
        
        {unreadCount > 0 && (
          <span 
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold text-white"
            style={{ backgroundColor: 'var(--error-500)' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-96 rounded-xl shadow-2xl border overflow-hidden z-50"
            style={{ 
              backgroundColor: 'var(--bg-primary)',
              borderColor: 'var(--border-light)'
            }}
          >
            {/* Header */}
            <div 
              className="flex items-center justify-between p-4 border-b"
              style={{ borderColor: 'var(--border-light)' }}
            >
              <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                Notificações
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs px-3 py-1 rounded-lg transition-all"
                  style={{ 
                    backgroundColor: 'var(--primary-100)',
                    color: 'var(--primary-700)'
                  }}
                >
                  Marcar todas como lidas
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center" style={{ color: 'var(--text-secondary)' }}>
                  Carregando...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center" style={{ color: 'var(--text-secondary)' }}>
                  Nenhuma notificação
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b transition-all hover:bg-opacity-50 cursor-pointer ${
                      !notification.read ? 'bg-opacity-30' : ''
                    }`}
                    style={{ 
                      borderColor: 'var(--border-light)',
                      backgroundColor: !notification.read ? 'var(--primary-50)' : 'transparent'
                    }}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p 
                            className={`text-sm font-semibold ${!notification.read ? 'font-bold' : ''}`}
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <div 
                              className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                              style={{ backgroundColor: 'var(--primary-500)' }}
                            />
                          )}
                        </div>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                          {notification.message}
                        </p>
                        <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
                          {formatDistanceToNow(new Date(notification.created_at), { 
                            addSuffix: true,
                            locale: ptBR 
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div 
                className="p-3 text-center border-t"
                style={{ borderColor: 'var(--border-light)' }}
              >
                <button
                  onClick={() => {
                    if (context === 'colaborador') router.push('/colaborador/notificacoes')
                    else if (context === 'cliente') router.push('/cliente/dashboard')
                    else router.push('/admin/fluxos')
                    setIsOpen(false)
                  }}
                  className="text-sm font-medium transition-colors"
                  style={{ color: 'var(--primary-600)' }}
                >
                  Ver todas as notificações
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}



