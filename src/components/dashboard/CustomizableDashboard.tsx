'use client'

import { useState, useEffect } from 'react'
import { Responsive, WidthProvider, Layout } from 'react-grid-layout'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Settings,
  X,
  Plus,
  Save,
  RotateCcw,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
  Target,
  Calendar,
  Award,
  MessageSquare,
  BarChart3,
  Activity
} from 'lucide-react'
import '@/styles/grid-layout.css'

const ResponsiveGridLayout = WidthProvider(Responsive)

interface Widget {
  id: string
  type: 'tasks' | 'metrics' | 'calendar' | 'activity' | 'gamification' | 'messages' | 'chart'
  title: string
  icon: any
  color: string
}

const availableWidgets: Widget[] = [
  { id: 'tasks-active', type: 'tasks', title: 'Tarefas Ativas', icon: Clock, color: '#3B82F6' },
  { id: 'tasks-completed', type: 'tasks', title: 'Tarefas Concluídas', icon: CheckCircle2, color: '#10B981' },
  { id: 'metrics-productivity', type: 'metrics', title: 'Produtividade', icon: TrendingUp, color: '#8B5CF6' },
  { id: 'metrics-quality', type: 'metrics', title: 'Qualidade', icon: Target, color: '#F59E0B' },
  { id: 'calendar', type: 'calendar', title: 'Calendário', icon: Calendar, color: '#EC4899' },
  { id: 'gamification', type: 'gamification', title: 'Gamificação', icon: Award, color: '#FFD700' },
  { id: 'messages', type: 'messages', title: 'Mensagens', icon: MessageSquare, color: '#06B6D4' },
  { id: 'chart-performance', type: 'chart', title: 'Gráfico Desempenho', icon: BarChart3, color: '#6366F1' },
  { id: 'activity-feed', type: 'activity', title: 'Atividades Recentes', icon: Activity, color: '#EF4444' },
  { id: 'team', type: 'metrics', title: 'Minha Equipe', icon: Users, color: '#14B8A6' }
]

const defaultLayout: Layout[] = [
  { i: 'tasks-active', x: 0, y: 0, w: 3, h: 2 },
  { i: 'tasks-completed', x: 3, y: 0, w: 3, h: 2 },
  { i: 'metrics-productivity', x: 6, y: 0, w: 3, h: 2 },
  { i: 'gamification', x: 9, y: 0, w: 3, h: 2 },
  { i: 'calendar', x: 0, y: 2, w: 6, h: 3 },
  { i: 'activity-feed', x: 6, y: 2, w: 6, h: 3 }
]

interface CustomizableDashboardProps {
  userId: string
  defaultWidgets?: string[]
}

export function CustomizableDashboard({ userId, defaultWidgets }: CustomizableDashboardProps) {
  const [isEditMode, setIsEditMode] = useState(false)
  const [layout, setLayout] = useState<Layout[]>(defaultLayout)
  const [activeWidgets, setActiveWidgets] = useState<string[]>(
    defaultWidgets || defaultLayout.map(l => l.i)
  )
  const [showAddWidget, setShowAddWidget] = useState(false)

  useEffect(() => {
    loadLayout()
  }, [userId])

  const loadLayout = async () => {
    // Carregar layout salvo do localStorage ou banco de dados
    const savedLayout = localStorage.getItem(`dashboard-layout-${userId}`)
    const savedWidgets = localStorage.getItem(`dashboard-widgets-${userId}`)
    
    if (savedLayout) {
      setLayout(JSON.parse(savedLayout))
    }
    if (savedWidgets) {
      setActiveWidgets(JSON.parse(savedWidgets))
    }
  }

  const saveLayout = () => {
    localStorage.setItem(`dashboard-layout-${userId}`, JSON.stringify(layout))
    localStorage.setItem(`dashboard-widgets-${userId}`, JSON.stringify(activeWidgets))
    setIsEditMode(false)
    alert('✅ Dashboard personalizado salvo!')
  }

  const resetLayout = () => {
    if (!confirm('Tem certeza que deseja restaurar o layout padrão?')) return
    setLayout(defaultLayout)
    setActiveWidgets(defaultLayout.map(l => l.i))
    localStorage.removeItem(`dashboard-layout-${userId}`)
    localStorage.removeItem(`dashboard-widgets-${userId}`)
  }

  const addWidget = (widgetId: string) => {
    if (activeWidgets.includes(widgetId)) {
      alert('Este widget já está no dashboard!')
      return
    }

    const newLayout: Layout = {
      i: widgetId,
      x: (layout.length * 3) % 12,
      y: Infinity, // Adds to bottom
      w: 3,
      h: 2
    }

    setLayout([...layout, newLayout])
    setActiveWidgets([...activeWidgets, widgetId])
    setShowAddWidget(false)
  }

  const removeWidget = (widgetId: string) => {
    setLayout(layout.filter(l => l.i !== widgetId))
    setActiveWidgets(activeWidgets.filter(w => w !== widgetId))
  }

  const getWidgetContent = (widgetId: string) => {
    const widget = availableWidgets.find(w => w.id === widgetId)
    if (!widget) return null

    const IconComponent = widget.icon

    // Mock data - você substituirá por dados reais
    const mockData: any = {
      'tasks-active': { value: 12, label: 'Em andamento' },
      'tasks-completed': { value: 45, label: 'Concluídas esta semana' },
      'metrics-productivity': { value: 87, label: '% esta semana', trend: '+5%' },
      'metrics-quality': { value: 92, label: '% qualidade', trend: '+3%' },
      'gamification': { level: 15, points: 3420, nextLevel: 500 },
      'messages': { unread: 5, total: 128 },
      'team': { members: 8, online: 6 }
    }

    const data = mockData[widgetId] || {}

    return (
      <div className="h-full p-6 rounded-2xl bg-white shadow-sm border hover:shadow-lg transition-all relative group">
        {isEditMode && (
          <button
            onClick={() => removeWidget(widgetId)}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center gap-3 mb-4">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${widget.color}20` }}
          >
            <IconComponent className="w-6 h-6" style={{ color: widget.color }} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
              {widget.title}
            </h3>
          </div>
        </div>

        {/* Widget-specific content */}
        {widget.type === 'tasks' && (
          <div>
            <p className="text-4xl font-bold mb-2" style={{ color: widget.color }}>
              {data.value || 0}
            </p>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              {data.label}
            </p>
          </div>
        )}

        {widget.type === 'metrics' && (
          <div>
            <div className="flex items-end gap-2 mb-2">
              <p className="text-4xl font-bold" style={{ color: widget.color }}>
                {data.value || 0}
              </p>
              {data.trend && (
                <span className="text-sm font-medium text-green-600 mb-2">
                  {data.trend}
                </span>
              )}
            </div>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              {data.label}
            </p>
            <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all"
                style={{ width: `${data.value}%`, backgroundColor: widget.color }}
              />
            </div>
          </div>
        )}

        {widget.type === 'gamification' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
                Nível {data.level}
              </span>
              <span className="text-sm font-medium" style={{ color: widget.color }}>
                {data.points} pts
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div 
                className="h-3 rounded-full transition-all"
                style={{ 
                  width: `${((data.points % 1000) / 10)}%`, 
                  backgroundColor: widget.color 
                }}
              />
            </div>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {data.nextLevel} pontos até próximo nível
            </p>
          </div>
        )}

        {widget.type === 'messages' && (
          <div>
            <p className="text-4xl font-bold mb-2" style={{ color: widget.color }}>
              {data.unread || 0}
            </p>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              Mensagens não lidas
            </p>
            <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
              {data.total} total
            </p>
          </div>
        )}

        {widget.type === 'calendar' && (
          <div>
            <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
              Próximos eventos
            </p>
            <div className="space-y-2">
              <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                  Reunião de equipe
                </p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Hoje, 14:00
                </p>
              </div>
              <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                  Entrega projeto X
                </p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Amanhã, 17:00
                </p>
              </div>
            </div>
          </div>
        )}

        {widget.type === 'activity' && (
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full mt-1.5" style={{ backgroundColor: widget.color }} />
              <div>
                <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                  Tarefa concluída
                </p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  há 2 horas
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full mt-1.5" style={{ backgroundColor: widget.color }} />
              <div>
                <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                  Nova mensagem
                </p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  há 5 horas
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Edit Controls */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Meu Dashboard
        </h2>
        <div className="flex items-center gap-2">
          {isEditMode && (
            <>
              <button
                onClick={() => setShowAddWidget(!showAddWidget)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-white transition-all hover:scale-105"
                style={{ backgroundColor: 'var(--primary-500)' }}
              >
                <Plus className="w-4 h-4" />
                Adicionar Widget
              </button>
              <button
                onClick={resetLayout}
                className="p-2 rounded-xl hover:bg-opacity-80 transition-all"
                style={{ backgroundColor: 'var(--bg-secondary)' }}
              >
                <RotateCcw className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
              </button>
            </>
          )}
          <button
            onClick={isEditMode ? saveLayout : () => setIsEditMode(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all"
            style={{
              backgroundColor: isEditMode ? 'var(--primary-500)' : 'var(--bg-secondary)',
              color: isEditMode ? 'white' : 'var(--text-primary)'
            }}
          >
            {isEditMode ? (
              <>
                <Save className="w-4 h-4" />
                Salvar
              </>
            ) : (
              <>
                <Settings className="w-4 h-4" />
                Personalizar
              </>
            )}
          </button>
        </div>
      </div>

      {/* Add Widget Panel */}
      <AnimatePresence>
        {showAddWidget && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div 
              className="p-4 rounded-xl border"
              style={{ 
                backgroundColor: 'var(--bg-primary)',
                borderColor: 'var(--border-light)'
              }}
            >
              <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
                Widgets Disponíveis:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {availableWidgets
                  .filter(w => !activeWidgets.includes(w.id))
                  .map(widget => {
                    const IconComponent = widget.icon
                    return (
                      <button
                        key={widget.id}
                        onClick={() => addWidget(widget.id)}
                        className="p-3 rounded-xl border-2 hover:border-opacity-100 transition-all text-left"
                        style={{
                          backgroundColor: 'var(--bg-secondary)',
                          borderColor: 'var(--border-light)'
                        }}
                      >
                        <IconComponent className="w-5 h-5 mb-2" style={{ color: widget.color }} />
                        <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                          {widget.title}
                        </p>
                      </button>
                    )
                  })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid Layout */}
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: layout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={100}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        onLayoutChange={(newLayout) => setLayout(newLayout)}
        draggableHandle=".drag-handle"
      >
        {activeWidgets.map(widgetId => (
          <div key={widgetId} className={isEditMode ? 'drag-handle cursor-move' : ''}>
            {getWidgetContent(widgetId)}
          </div>
        ))}
      </ResponsiveGridLayout>

      {isEditMode && (
        <div 
          className="mt-6 p-4 rounded-xl flex items-center gap-3"
          style={{ 
            backgroundColor: 'var(--primary-50)',
            borderLeft: '4px solid var(--primary-500)'
          }}
        >
          <Settings className="w-5 h-5" style={{ color: 'var(--primary-600)' }} />
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--primary-900)' }}>
              Modo de Edição Ativo
            </p>
            <p className="text-xs" style={{ color: 'var(--primary-700)' }}>
              Arraste os widgets para reorganizar, redimensione clicando nas bordas. 
              Clique em "Salvar" quando terminar.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

