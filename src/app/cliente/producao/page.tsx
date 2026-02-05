'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Clock, Calendar, CheckCircle2, AlertCircle, Package, 
  ArrowRight, Eye, FileText, MessageSquare, TrendingUp,
  Loader2, RefreshCw
} from 'lucide-react'
import { format, differenceInDays, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { AREA_BOARDS } from '@/lib/kanban/areaBoards'

interface Demand {
  id: string
  title: string
  description?: string
  status: 'demandas' | 'em_progresso' | 'revisao' | 'aprovacao' | 'concluido'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  dueDate?: Date
  approvalDueAt?: Date
  approvalOverdue?: boolean
  approvalRisk?: boolean
  createdAt: Date
  updatedAt: Date
  area: string
  progress: number // 0-100
  assignees: string[]
  lastUpdate?: string
}

const STATUS_CONFIG = {
  demandas: { 
    label: 'Na Fila', 
    color: '#6366f1', 
    bgColor: 'bg-indigo-50', 
    textColor: 'text-indigo-700',
    icon: Package,
    progress: 0
  },
  em_progresso: { 
    label: 'Em Produção', 
    color: '#f97316', 
    bgColor: 'bg-amber-50', 
    textColor: 'text-amber-700',
    icon: TrendingUp,
    progress: 25
  },
  revisao: { 
    label: 'Em Revisão', 
    color: '#eab308', 
    bgColor: 'bg-yellow-50', 
    textColor: 'text-yellow-700',
    icon: Eye,
    progress: 50
  },
  aprovacao: { 
    label: 'Aguardando Aprovação', 
    color: '#06b6d4', 
    bgColor: 'bg-cyan-50', 
    textColor: 'text-cyan-700',
    icon: FileText,
    progress: 75
  },
  concluido: { 
    label: 'Concluído', 
    color: '#10b981', 
    bgColor: 'bg-green-50', 
    textColor: 'text-green-700',
    icon: CheckCircle2,
    progress: 100
  }
}

const PRIORITY_CONFIG = {
  low: { label: 'Baixa', color: 'bg-gray-100 text-gray-600' },
  medium: { label: 'Média', color: 'bg-blue-100 text-blue-600' },
  high: { label: 'Alta', color: 'bg-amber-100 text-primary' },
  urgent: { label: 'Urgente', color: 'bg-red-100 text-red-600' }
}

export default function ClienteProducaoPage() {
  const [demands, setDemands] = useState<Demand[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDemand, setSelectedDemand] = useState<Demand | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active')

  useEffect(() => {
    loadDemands()
  }, [])

  const loadDemands = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/kanban/card?mine=1')
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Falha ao carregar demandas')

      const areaLabelByKey = new Map<string, string>(AREA_BOARDS.map((b) => [String(b.areaKey), String(b.label)]))

      const mapped: Demand[] = (data.tasks || []).map((t: any) => {
        const stageKey = String(t?.column?.stage_key || '').toLowerCase()
        const ref = (t?.reference_links || {}) as any
        const approval = (ref?.client_approval || {}) as any
        const group =
          stageKey === 'demanda' || stageKey.includes('lead') ? 'demandas'
          : stageKey.includes('revisao') ? 'revisao'
          : stageKey.includes('aprov') ? 'aprovacao'
          : stageKey.includes('final') ? 'concluido'
          : 'em_progresso'

        const progress =
          group === 'demandas' ? 0
          : group === 'em_progresso' ? 40
          : group === 'revisao' ? 65
          : group === 'aprovacao' ? 75
          : 100

        const slaHours = Number(t?.column?.sla_hours || 48)
        const requestedAtIso = String(approval?.requested_at || t?.updated_at || t?.created_at || new Date().toISOString())
        const dueAtIso = String(
          approval?.due_at || new Date(new Date(requestedAtIso).getTime() + slaHours * 60 * 60 * 1000).toISOString()
        )
        const dueAt = group === 'aprovacao' ? new Date(dueAtIso) : undefined
        const approvalOverdue = group === 'aprovacao' ? new Date(dueAtIso).getTime() < Date.now() : false
        const approvalRisk =
          group === 'aprovacao'
            ? !approvalOverdue && new Date(dueAtIso).getTime() - Date.now() <= 12 * 60 * 60 * 1000
            : false

        return {
          id: String(t.id),
          title: String(t.title || ''),
          description: t.description || '',
          status: group as Demand['status'],
          priority: (t.priority || 'medium') as Demand['priority'],
          dueDate: t.due_date ? new Date(String(t.due_date)) : undefined,
          approvalDueAt: dueAt,
          approvalOverdue,
          approvalRisk,
          createdAt: new Date(String(t.created_at || new Date().toISOString())),
          updatedAt: new Date(String(t.updated_at || new Date().toISOString())),
          area: areaLabelByKey.get(String(t?.board?.area_key || '')) || 'Equipe',
          progress,
          assignees: [],
          lastUpdate: undefined,
        }
      })

      setDemands(mapped)
    } catch (error) {
      console.error('Erro ao carregar demandas:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredDemands = demands.filter(d => {
    if (filter === 'active') return d.status !== 'concluido'
    if (filter === 'completed') return d.status === 'concluido'
    return true
  })

  const stats = {
    total: demands.length,
    active: demands.filter(d => d.status !== 'concluido').length,
    completed: demands.filter(d => d.status === 'concluido').length,
    urgent: demands.filter(d => d.priority === 'urgent' && d.status !== 'concluido').length
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-muted-foreground">Carregando suas demandas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#001533] dark:text-white">Minhas Demandas</h1>
            <p className="text-[#001533]/60 dark:text-white/60">Acompanhe o status de produção dos seus projetos</p>
          </div>
          <div className="flex gap-2">
            <a
              href="/cliente/solicitacao"
              className="flex items-center gap-2 px-4 py-2 bg-[#1672d6] text-white rounded-lg hover:bg-[#1260b5] transition-colors font-medium"
            >
              <FileText className="w-4 h-4" />
              Solicitar
            </a>
            <button
              onClick={loadDemands}
              className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg hover:bg-muted transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-card rounded-xl p-4 border border-border">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <p className="text-sm text-muted-foreground">Em Andamento</p>
            <p className="text-2xl font-bold text-primary">{stats.active}</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <p className="text-sm text-muted-foreground">Concluídos</p>
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <p className="text-sm text-muted-foreground">Urgentes</p>
            <p className="text-2xl font-bold text-red-600">{stats.urgent}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {[
            { value: 'active', label: 'Em Andamento' },
            { value: 'completed', label: 'Concluídos' },
            { value: 'all', label: 'Todos' }
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value as any)}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-colors",
                filter === f.value
                  ? "bg-blue-600 text-white"
                  : "bg-card text-muted-foreground hover:bg-muted"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Demands List */}
        <div className="space-y-4">
          {filteredDemands.length === 0 ? (
            <div className="bg-card rounded-xl p-12 text-center border border-border">
              <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Nenhuma demanda encontrada</p>
            </div>
          ) : (
            filteredDemands.map((demand, index) => {
              const statusConfig = STATUS_CONFIG[demand.status]
              const StatusIcon = statusConfig.icon
              const priorityConfig = PRIORITY_CONFIG[demand.priority]
              const daysUntilDue = demand.dueDate ? differenceInDays(demand.dueDate, new Date()) : null
              const isOverdue = daysUntilDue !== null && daysUntilDue < 0 && demand.status !== 'concluido'
              const approvalBadge =
                demand.status === 'aprovacao'
                  ? demand.approvalOverdue
                    ? { text: 'Aprovação atrasada', cls: 'bg-red-100 text-red-700' }
                    : demand.approvalRisk
                      ? { text: 'Aprovação em risco', cls: 'bg-amber-100 text-amber-700' }
                      : { text: 'Aguardando sua aprovação', cls: 'bg-emerald-100 text-emerald-700' }
                  : null

              return (
                <motion.div
                  key={demand.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedDemand(demand)}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                            {demand.area}
                          </span>
                          <span className={cn("text-xs px-2 py-0.5 rounded", priorityConfig.color)}>
                            {priorityConfig.label}
                          </span>
                          {approvalBadge && (
                            <span className={cn("text-xs px-2 py-0.5 rounded", approvalBadge.cls)}>
                              {approvalBadge.text}
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800">{demand.title}</h3>
                        {demand.description && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-1">{demand.description}</p>
                        )}
                      </div>

                      <div className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full",
                        statusConfig.bgColor,
                        statusConfig.textColor
                      )}>
                        <StatusIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">{statusConfig.label}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-500">Progresso</span>
                        <span className="font-medium" style={{ color: statusConfig.color }}>
                          {demand.progress}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${demand.progress}%` }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: statusConfig.color }}
                        />
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        {demand.dueDate && (
                          <div className={cn(
                            "flex items-center gap-1",
                            isOverdue ? "text-red-600" : 
                            daysUntilDue !== null && daysUntilDue <= 2 ? "text-primary" : 
                            "text-gray-500"
                          )}>
                            <Calendar className="w-4 h-4" />
                            <span>
                              {isOverdue 
                                ? `Atrasado ${Math.abs(daysUntilDue!)} dias`
                                : daysUntilDue === 0 
                                  ? 'Entrega hoje'
                                  : `Entrega em ${daysUntilDue} dias`
                              }
                            </span>
                            {isOverdue && <AlertCircle className="w-4 h-4" />}
                          </div>
                        )}
                        
                        {demand.lastUpdate && (
                          <div className="flex items-center gap-1 text-gray-400">
                            <Clock className="w-4 h-4" />
                            <span>
                              Atualizado {formatDistanceToNow(demand.updatedAt, { addSuffix: true, locale: ptBR })}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-blue-600 hover:text-blue-700">
                        <span>Ver detalhes</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  {/* Last Update Banner */}
                  {demand.lastUpdate && demand.status !== 'concluido' && (
                    <div className="px-5 py-3 bg-gray-50 border-t">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Última atualização:</span> {demand.lastUpdate}
                      </p>
                    </div>
                  )}
                </motion.div>
              )
            })
          )}
        </div>

        {/* Timeline Legend */}
        <div className="mt-8 bg-white rounded-xl p-6 border">
          <h3 className="font-semibold text-gray-800 mb-4">Etapas do Processo</h3>
          <div className="flex items-center justify-between">
            {Object.entries(STATUS_CONFIG).map(([key, config], index) => {
              const Icon = config.icon
              return (
                <div key={key} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${config.color}20` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: config.color }} />
                    </div>
                    <span className="text-xs text-gray-600 mt-2 text-center max-w-[80px]">
                      {config.label}
                    </span>
                  </div>
                  {index < Object.entries(STATUS_CONFIG).length - 1 && (
                    <div className="w-16 h-0.5 bg-gray-200 mx-2" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Demand Detail Modal */}
      {selectedDemand && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedDemand(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"
          >
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-500">{selectedDemand.area}</span>
                  <h2 className="text-xl font-bold text-gray-800">{selectedDemand.title}</h2>
                </div>
                <button 
                  onClick={() => setSelectedDemand(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Status */}
              <div className={cn(
                "flex items-center gap-2 px-4 py-3 rounded-xl",
                STATUS_CONFIG[selectedDemand.status].bgColor
              )}>
                {(() => {
                  const Icon = STATUS_CONFIG[selectedDemand.status].icon
                  return <Icon className="w-5 h-5" style={{ color: STATUS_CONFIG[selectedDemand.status].color }} />
                })()}
                <span className={cn("font-medium", STATUS_CONFIG[selectedDemand.status].textColor)}>
                  {STATUS_CONFIG[selectedDemand.status].label}
                </span>
              </div>

              {/* Stepper */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-medium text-gray-800 mb-3">Etapas</h4>
                <div className="flex items-center justify-between">
                  {(['demandas','em_progresso','revisao','aprovacao','concluido'] as const).map((k, idx) => {
                    const cfg = STATUS_CONFIG[k]
                    const Icon = cfg.icon
                    const isActive = selectedDemand.status === k
                    const isDone =
                      (k === 'demandas' && selectedDemand.progress > 0) ||
                      (k === 'em_progresso' && selectedDemand.progress >= 40) ||
                      (k === 'revisao' && selectedDemand.progress >= 65) ||
                      (k === 'aprovacao' && selectedDemand.progress >= 75) ||
                      (k === 'concluido' && selectedDemand.progress >= 100)

                    return (
                      <div key={k} className="flex items-center">
                        <div className="flex flex-col items-center">
                          <div
                            className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center border",
                              isActive ? "border-blue-500 bg-white" : "border-gray-200 bg-white"
                            )}
                          >
                            <Icon className="w-5 h-5" style={{ color: isDone || isActive ? cfg.color : '#9CA3AF' }} />
                          </div>
                          <span className={cn("text-xs mt-2 text-center max-w-[90px]", isActive ? "text-gray-800 font-medium" : "text-gray-500")}>
                            {cfg.label}
                          </span>
                        </div>
                        {idx < 4 && <div className="w-10 h-0.5 bg-gray-200 mx-2" />}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Progress */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Progresso</span>
                  <span className="font-bold" style={{ color: STATUS_CONFIG[selectedDemand.status].color }}>
                    {selectedDemand.progress}%
                  </span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{ 
                      width: `${selectedDemand.progress}%`,
                      backgroundColor: STATUS_CONFIG[selectedDemand.status].color
                    }}
                  />
                </div>
              </div>

              {/* Description */}
              {selectedDemand.description && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-1">Descrição</h4>
                  <p className="text-gray-600">{selectedDemand.description}</p>
                </div>
              )}

              {/* Due Date */}
              {selectedDemand.dueDate && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Previsão de entrega: {format(selectedDemand.dueDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                </div>
              )}

              {/* Aprovação do cliente (SLA) */}
              {selectedDemand.status === 'aprovacao' && selectedDemand.approvalDueAt && (
                <div className={cn(
                  "p-4 rounded-xl border",
                  selectedDemand.approvalOverdue ? "bg-red-50 border-red-200" :
                  selectedDemand.approvalRisk ? "bg-amber-50 border-amber-200" :
                  "bg-emerald-50 border-emerald-200"
                )}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-800">Sua aprovação está pendente</p>
                      <p className="text-sm text-gray-600">
                        Vence em {format(selectedDemand.approvalDueAt, "dd/MM 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <a
                      href="/cliente/aprovacoes"
                      className={cn(
                        "px-4 py-2 rounded-lg font-medium text-white",
                        selectedDemand.approvalOverdue ? "bg-red-600 hover:bg-red-700" :
                        selectedDemand.approvalRisk ? "bg-primary hover:bg-[#1260b5]" :
                        "bg-emerald-600 hover:bg-emerald-700"
                      )}
                    >
                      Aprovar agora
                    </a>
                  </div>
                  {selectedDemand.approvalOverdue && (
                    <p className="text-sm text-red-700 mt-2">
                      Atraso na aprovação pode impactar o prazo de entrega. Se precisar de ajustes, descreva no item de aprovação.
                    </p>
                  )}
                </div>
              )}

              {/* Last Update */}
              {selectedDemand.lastUpdate && (
                <div className="bg-blue-50 p-4 rounded-xl">
                  <h4 className="font-medium text-blue-800 mb-1">Última Atualização</h4>
                  <p className="text-blue-700">{selectedDemand.lastUpdate}</p>
                  <p className="text-xs text-blue-500 mt-2">
                    {formatDistanceToNow(selectedDemand.updatedAt, { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
              )}

              {/* Assignees */}
              {selectedDemand.assignees.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Responsáveis</h4>
                  <div className="flex gap-2">
                    {selectedDemand.assignees.map((name, i) => (
                      <div key={i} className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full">
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                          {name[0]}
                        </div>
                        <span className="text-sm text-gray-700">{name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-gray-50">
              <button
                onClick={() => setSelectedDemand(null)}
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
