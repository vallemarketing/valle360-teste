'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Target, TrendingUp, Calendar, CheckCircle, Clock, Award, ChevronRight, Plus } from 'lucide-react'
import { motion } from 'framer-motion'

interface Goal {
  id: string
  title: string
  description: string
  type: 'short_term' | 'medium_term' | 'long_term'
  progress: number
  target: number
  unit: string
  deadline: Date
  status: 'active' | 'completed' | 'paused'
  created_at: Date
}

interface CareerPath {
  current_level: string
  target_level: string
  target_position: string
  overall_progress: number
  milestones: any[]
  ai_suggested_next_steps: any[]
}

export default function MetasPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [careerPath, setCareerPath] = useState<CareerPath | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGoals()
  }, [])

  const loadGoals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!employee) return

      // Buscar plano de carreira
      const { data: career } = await supabase
        .from('employee_career_path')
        .select('*')
        .eq('employee_id', employee.id)
        .single()

      setCareerPath(career)

      // Metas reais via API (collaborator_goals)
      const { data: session } = await supabase.auth.getSession()
      const token = session.session?.access_token
      if (!token) {
        setGoals([])
        return
      }

      const res = await fetch(`/api/goals?collaborator_id=${encodeURIComponent(String(employee.id))}&status=active`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.success) {
        setGoals([])
        return
      }

      const row = (json.data || [])[0]
      const metrics = (row?.goals || {}) as Record<string, { target: number; current: number; unit: string }>
      const deadline = row?.period_end ? new Date(String(row.period_end)) : new Date()

      const mapped: Goal[] = Object.entries(metrics).map(([metric, v], idx) => {
        const target = Number(v?.target || 0)
        const current = Number(v?.current || 0)
        const progress = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0

        return {
          id: `${row?.id || 'goal'}:${metric}:${idx}`,
          title: metric,
          description: row?.ai_reasoning ? String(row.ai_reasoning) : 'Meta definida pelo sistema',
          type: 'short_term',
          progress,
          target,
          unit: String(v?.unit || ''),
          deadline,
          status: 'active',
          created_at: row?.created_at ? new Date(String(row.created_at)) : new Date()
        }
      })

      setGoals(mapped)
    } catch (error) {
      console.error('Erro ao carregar metas:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4370d1] mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando suas metas...</p>
        </div>
      </div>
    )
  }

  const getTypeLabel = (type: string) => {
    const labels = {
      short_term: { label: 'Curto Prazo', color: 'bg-green-100 text-green-800' },
      medium_term: { label: 'Médio Prazo', color: 'bg-yellow-100 text-yellow-800' },
      long_term: { label: 'Longo Prazo', color: 'bg-blue-100 text-blue-800' },
    }
    return labels[type as keyof typeof labels] || labels.short_term
  }

  const getDaysRemaining = (deadline: Date) => {
    const today = new Date()
    const diff = deadline.getTime() - today.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return days
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Target className="w-8 h-8 text-[#4370d1]" />
              Minhas Metas
            </h1>
            <p className="text-gray-600 mt-1">Acompanhe seu desenvolvimento profissional</p>
          </div>
          
          <button className="px-4 py-2 bg-[#4370d1] text-white rounded-lg hover:bg-[#0f1b35] transition-all flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nova Meta
          </button>
        </div>

        {/* Plano de Carreira */}
        {careerPath && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-8 text-white"
          >
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Award className="w-7 h-7" />
              Seu Plano de Carreira
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-white/80 text-sm mb-1">Nível Atual</p>
                <p className="text-2xl font-bold">{careerPath.current_level}</p>
              </div>
              <div>
                <p className="text-white/80 text-sm mb-1">Meta</p>
                <p className="text-2xl font-bold">{careerPath.target_position}</p>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Progresso Geral</span>
                <span className="font-bold">{Math.round(careerPath.overall_progress || 0)}%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-3">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${careerPath.overall_progress || 0}%` }}
                  transition={{ duration: 1 }}
                  className="bg-white h-3 rounded-full"
                />
              </div>
            </div>

            {careerPath.ai_suggested_next_steps?.length > 0 && (
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Próximos Passos Sugeridos pela IA
                </h3>
                <ul className="space-y-2">
                  {careerPath.ai_suggested_next_steps.slice(0, 3).map((step: any, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{step.action || step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}

        {/* Metas por Tipo */}
        {['short_term', 'medium_term', 'long_term'].map((type) => {
          const typeGoals = goals.filter(g => g.type === type)
          if (typeGoals.length === 0) return null

          const typeInfo = getTypeLabel(type)

          return (
            <motion.div 
              key={type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${typeInfo.color}`}>
                  {typeInfo.label}
                </span>
              </h2>

              <div className="space-y-4">
                {typeGoals.map((goal) => {
                  const daysRemaining = getDaysRemaining(goal.deadline)
                  const isOverdue = daysRemaining < 0
                  const isUrgent = daysRemaining <= 7 && daysRemaining > 0

                  return (
                    <div key={goal.id} className="p-5 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-lg mb-1">{goal.title}</h3>
                          <p className="text-sm text-gray-600">{goal.description}</p>
                        </div>
                        
                        <div className="text-right">
                          {goal.status === 'completed' ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                              <CheckCircle className="w-3 h-3" />
                              Concluída
                            </span>
                          ) : (
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                              isOverdue ? 'bg-red-100 text-red-800' :
                              isUrgent ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              <Clock className="w-3 h-3" />
                              {isOverdue ? 'Atrasada' : isUrgent ? 'Urgente' : `${daysRemaining} dias`}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                          <span>Progresso</span>
                          <span className="font-bold text-gray-900">
                            {goal.progress} / {goal.target} {goal.unit}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(goal.progress / goal.target) * 100}%` }}
                            transition={{ duration: 0.5 }}
                            className={`h-3 rounded-full ${
                              goal.progress >= goal.target ? 'bg-green-500' :
                              (goal.progress / goal.target) >= 0.75 ? 'bg-blue-500' :
                              (goal.progress / goal.target) >= 0.5 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Prazo: {goal.deadline.toLocaleDateString('pt-BR')}
                        </span>
                        <span>{Math.round((goal.progress / goal.target) * 100)}% completo</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )
        })}

      </div>
    </div>
  )
}











