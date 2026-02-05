'use client'

import { motion } from 'framer-motion'
import { 
  Palette, Video, Code, FileText, Users, DollarSign, 
  BarChart3, CheckCircle2, Clock, TrendingUp 
} from 'lucide-react'

interface DashboardData {
  areaName: string
  stats: {
    label: string
    value: number | string
    icon: 'palette' | 'video' | 'code' | 'filetext' | 'users' | 'dollar' | 'chart'
    color: string
  }[]
  tasks: {
    id: string
    title: string
    status: 'pending' | 'in_progress' | 'completed'
    dueDate?: Date
  }[]
}

export function DashboardGenerico({ data }: { data: DashboardData }) {
  const getIcon = (iconName: string) => {
    const icons = {
      palette: Palette,
      video: Video,
      code: Code,
      filetext: FileText,
      users: Users,
      dollar: DollarSign,
      chart: BarChart3
    }
    return icons[iconName as keyof typeof icons] || BarChart3
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {data.stats.map((stat, index) => {
          const Icon = getIcon(stat.icon)
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="rounded-xl p-6"
              style={{ backgroundColor: 'var(--bg-primary)', borderWidth: '1px', borderColor: 'var(--border-light)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{stat.label}</span>
                <Icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
              <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {stat.value}
              </p>
            </motion.div>
          )
        })}
      </div>

      {/* Tasks List */}
      <div 
        className="rounded-xl p-6"
        style={{ backgroundColor: 'var(--bg-primary)', borderWidth: '1px', borderColor: 'var(--border-light)' }}
      >
        <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Minhas Tarefas
        </h2>
        <div className="space-y-3">
          {data.tasks.map((task) => (
            <div
              key={task.id}
              className="p-4 rounded-lg border flex items-center justify-between"
              style={{ 
                backgroundColor: 'var(--bg-secondary)',
                borderColor: task.status === 'pending' ? 'var(--warning-300)' : 'var(--border-light)'
              }}
            >
              <div className="flex items-center gap-3">
                {task.status === 'completed' && (
                  <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--success-500)' }} />
                )}
                {task.status === 'in_progress' && (
                  <Clock className="w-5 h-5" style={{ color: 'var(--primary-500)' }} />
                )}
                {task.status === 'pending' && (
                  <Clock className="w-5 h-5" style={{ color: 'var(--warning-500)' }} />
                )}
                <div>
                  <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                    {task.title}
                  </h3>
                  {task.dueDate && (
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                      Prazo: {task.dueDate.toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              </div>
              <span 
                className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{
                  backgroundColor: task.status === 'completed' ? 'var(--success-50)' : 
                                  task.status === 'in_progress' ? 'var(--primary-50)' : 'var(--warning-50)',
                  color: task.status === 'completed' ? 'var(--success-700)' : 
                         task.status === 'in_progress' ? 'var(--primary-700)' : 'var(--warning-700)'
                }}
              >
                {task.status === 'completed' && '✅ Concluída'}
                {task.status === 'in_progress' && '🔄 Em andamento'}
                {task.status === 'pending' && '⏳ Pendente'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}









