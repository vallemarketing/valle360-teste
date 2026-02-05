'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Bell, CheckCircle, Clock, AlertCircle, Gift, Star, MessageSquare, Calendar, Filter, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  created_at: Date
  icon: any
  color: string
}

export default function NotificacoesPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<'all' | 'unread' | 'achievements' | 'messages'>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!employee) return

      // Buscar diferentes tipos de notificações
      const motivationMessages = await supabase
        .from('employee_motivation_messages')
        .select('*')
        .eq('employee_id', employee.id)
        .order('created_at', { ascending: false })
        .limit(20)

      const recognitions = await supabase
        .from('employee_recognition_events')
        .select('*, recognized_by:user_profiles!employee_recognition_events_recognized_by_fkey(full_name)')
        .eq('employee_id', employee.id)
        .order('created_at', { ascending: false })
        .limit(20)

      const taskReminders = await supabase
        .from('employee_task_reminders')
        .select('*')
        .eq('employee_id', employee.id)
        .in('status', ['pending', 'sent'])
        .order('created_at', { ascending: false })
        .limit(20)

      // Consolidar todas as notificações
      const allNotifications: Notification[] = []

      motivationMessages.data?.forEach(msg => {
        allNotifications.push({
          id: msg.id,
          type: 'motivation',
          title: msg.subject || 'Mensagem da Val',
          message: msg.message_content,
          read: msg.status === 'read',
          created_at: new Date(msg.created_at),
          icon: MessageSquare,
          color: 'blue'
        })
      })

      recognitions.data?.forEach(rec => {
        allNotifications.push({
          id: rec.id,
          type: 'recognition',
          title: `Reconhecimento: ${rec.title}`,
          message: `${rec.recognized_by?.full_name || 'Equipe'}: ${rec.description}`,
          read: false,
          created_at: new Date(rec.created_at),
          icon: Star,
          color: 'yellow'
        })
      })

      taskReminders.data?.forEach(task => {
        allNotifications.push({
          id: task.id,
          type: 'task',
          title: `Lembrete: ${task.task_title}`,
          message: task.message,
          read: task.status === 'acknowledged',
          created_at: new Date(task.created_at),
          icon: AlertCircle,
          color: 'red'
        })
      })

      // Ordenar por data
      allNotifications.sort((a, b) => b.created_at.getTime() - a.created_at.getTime())

      setNotifications(allNotifications)
    } catch (error) {
      console.error('Erro ao carregar notificações:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read
    if (filter === 'achievements') return n.type === 'recognition'
    if (filter === 'messages') return n.type === 'motivation'
    return true
  })

  const unreadCount = notifications.filter(n => !n.read).length

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4370d1] mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando notificações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Bell className="w-8 h-8 text-[#4370d1]" />
              Notificações
            </h1>
            {unreadCount > 0 && (
              <p className="text-gray-600 mt-1">Você tem <span className="font-bold text-[#4370d1]">{unreadCount}</span> não lidas</p>
            )}
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-[#4370d1] text-white rounded-lg hover:bg-[#0f1b35] transition-all flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Marcar todas como lidas
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 border-b border-gray-200 pb-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'all'
                ? 'bg-[#4370d1] text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Todas ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'unread'
                ? 'bg-[#4370d1] text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Não lidas ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('achievements')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'achievements'
                ? 'bg-[#4370d1] text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Reconhecimentos
          </button>
          <button
            onClick={() => setFilter('messages')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'messages'
                ? 'bg-[#4370d1] text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Mensagens
          </button>
        </div>

        {/* Lista de Notificações */}
        <div className="space-y-3">
          <AnimatePresence>
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification, index) => {
                const Icon = notification.icon
                const colorClasses = {
                  blue: 'bg-blue-50 border-blue-200 text-blue-700',
                  yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
                  red: 'bg-red-50 border-red-200 text-red-700',
                  green: 'bg-green-50 border-green-200 text-green-700',
                }

                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-5 rounded-xl border-2 transition-all cursor-pointer ${
                      notification.read
                        ? 'bg-white border-gray-200 opacity-70'
                        : 'bg-gradient-to-r from-blue-50 to-purple-50 border-[#4370d1]'
                    }`}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${colorClasses[notification.color as keyof typeof colorClasses]}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-900">{notification.title}</h3>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-[#4370d1] rounded-full"></span>
                          )}
                        </div>
                        <p className="text-gray-700 text-sm mb-2">{notification.message}</p>
                        <p className="text-xs text-gray-500">
                          {notification.created_at.toLocaleDateString('pt-BR', { 
                            day: '2-digit', 
                            month: 'short', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>

                      {!notification.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            markAsRead(notification.id)
                          }}
                          className="text-[#4370d1] hover:text-[#0f1b35] transition-colors"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                )
              })
            ) : (
              <div className="text-center py-16">
                <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">Nenhuma notificação encontrada</p>
                <p className="text-gray-500 text-sm mt-2">
                  {filter === 'unread' && 'Todas as suas notificações estão lidas!'}
                  {filter === 'achievements' && 'Você ainda não tem reconhecimentos.'}
                  {filter === 'messages' && 'Nenhuma mensagem da Val ainda.'}
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  )
}











