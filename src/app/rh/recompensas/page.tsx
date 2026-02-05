'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Gift,
  Check,
  X,
  Clock,
  User,
  Award,
  DollarSign,
  Calendar,
  MessageSquare,
  Filter,
  Search,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  XCircle,
  Trophy,
  Zap
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { 
  getRewardIcon, 
  getRewardStatusColor, 
  getRewardStatusLabel,
  formatRewardValue 
} from '@/lib/gamification/rewards'

interface Reward {
  id: string
  employee_id: string
  badge_id: string
  badge_name: string
  reward_type: string
  reward_value: string
  reward_description: string
  status: 'pending' | 'approved' | 'rejected' | 'redeemed' | 'expired'
  requested_at: string
  approved_by?: string
  approved_at?: string
  rejected_reason?: string
  employee?: {
    id: string
    full_name: string
    email: string
    avatar: string
  }
  approver?: {
    id: string
    full_name: string
  }
}

export default function RHRecompensasPage() {
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    totalValue: 0
  })

  useEffect(() => {
    loadCurrentUser()
    loadRewards()
  }, [filter])

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (employee) {
        setCurrentUserId(employee.id)
      }
    }
  }

  const loadRewards = async () => {
    try {
      let query = supabase
        .from('employee_rewards')
        .select(`
          *,
          employee:employees!employee_id(id, full_name, email, avatar),
          approver:employees!approved_by(id, full_name)
        `)
        .order('requested_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) throw error

      setRewards(data || [])

      // Calcular estatísticas
      const allRewards = data || []
      setStats({
        pending: allRewards.filter(r => r.status === 'pending').length,
        approved: allRewards.filter(r => r.status === 'approved' || r.status === 'redeemed').length,
        rejected: allRewards.filter(r => r.status === 'rejected').length,
        totalValue: allRewards
          .filter(r => r.reward_type === 'bonus' && (r.status === 'approved' || r.status === 'redeemed'))
          .reduce((sum, r) => sum + (parseFloat(r.reward_value) || 0), 0)
      })
    } catch (error) {
      console.error('Erro ao carregar recompensas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (rewardId: string) => {
    if (!currentUserId) return
    setActionLoading(rewardId)

    try {
      const response = await fetch('/api/gamification/rewards', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rewardId,
          action: 'approve',
          approvedBy: currentUserId
        })
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)

      loadRewards()
      setSelectedReward(null)
    } catch (error) {
      console.error('Erro ao aprovar:', error)
      alert('Erro ao aprovar recompensa')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (rewardId: string) => {
    if (!currentUserId || !rejectReason.trim()) {
      alert('Por favor, informe o motivo da rejeição')
      return
    }
    setActionLoading(rewardId)

    try {
      const response = await fetch('/api/gamification/rewards', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rewardId,
          action: 'reject',
          approvedBy: currentUserId,
          rejectedReason: rejectReason
        })
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)

      loadRewards()
      setSelectedReward(null)
      setRejectReason('')
    } catch (error) {
      console.error('Erro ao rejeitar:', error)
      alert('Erro ao rejeitar recompensa')
    } finally {
      setActionLoading(null)
    }
  }

  const filteredRewards = rewards.filter(reward => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      reward.employee?.full_name?.toLowerCase().includes(search) ||
      reward.badge_name.toLowerCase().includes(search) ||
      reward.reward_description.toLowerCase().includes(search)
    )
  })

  const getStatusIcon = (status: Reward['status']) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />
      case 'approved': return <CheckCircle className="w-4 h-4" />
      case 'rejected': return <XCircle className="w-4 h-4" />
      case 'redeemed': return <Gift className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Gestão de Recompensas
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
              Aprove ou rejeite recompensas conquistadas pelos colaboradores (RH e SuperAdmin)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8" style={{ color: 'var(--warning-500)' }} />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl"
            style={{ backgroundColor: 'var(--bg-primary)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--warning-100)' }}>
                <Clock className="w-5 h-5" style={{ color: 'var(--warning-600)' }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.pending}</p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Pendentes</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-xl"
            style={{ backgroundColor: 'var(--bg-primary)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--success-100)' }}>
                <CheckCircle className="w-5 h-5" style={{ color: 'var(--success-600)' }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.approved}</p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Aprovadas</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-4 rounded-xl"
            style={{ backgroundColor: 'var(--bg-primary)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--error-100)' }}>
                <XCircle className="w-5 h-5" style={{ color: 'var(--error-600)' }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.rejected}</p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Rejeitadas</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-4 rounded-xl"
            style={{ backgroundColor: 'var(--bg-primary)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--primary-100)' }}>
                <DollarSign className="w-5 h-5" style={{ color: 'var(--primary-600)' }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  R$ {stats.totalValue.toLocaleString('pt-BR')}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Total em Bônus</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <div 
          className="p-4 rounded-xl flex flex-wrap items-center gap-4"
          style={{ backgroundColor: 'var(--bg-primary)' }}
        >
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              placeholder="Buscar por colaborador, badge..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border"
              style={{ 
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-light)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <div className="flex gap-2">
            {(['all', 'pending', 'approved', 'rejected'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === status ? 'ring-2' : ''
                }`}
                style={{
                  backgroundColor: filter === status ? 'var(--primary-100)' : 'var(--bg-secondary)',
                  color: filter === status ? 'var(--primary-700)' : 'var(--text-secondary)',
                  // @ts-ignore
                  '--tw-ring-color': 'var(--primary-500)'
                }}
              >
                {status === 'all' ? 'Todas' : 
                 status === 'pending' ? 'Pendentes' :
                 status === 'approved' ? 'Aprovadas' : 'Rejeitadas'}
              </button>
            ))}
          </div>
        </div>

        {/* Rewards List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p style={{ color: 'var(--text-tertiary)' }}>Carregando recompensas...</p>
            </div>
          ) : filteredRewards.length === 0 ? (
            <div 
              className="text-center py-12 rounded-xl"
              style={{ backgroundColor: 'var(--bg-primary)' }}
            >
              <Gift className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-disabled)' }} />
              <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                Nenhuma recompensa encontrada
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
                {filter === 'pending' ? 'Não há recompensas pendentes de aprovação' : 'Tente ajustar os filtros'}
              </p>
            </div>
          ) : (
            filteredRewards.map((reward, index) => (
              <motion.div
                key={reward.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 rounded-xl border"
                style={{ 
                  backgroundColor: 'var(--bg-primary)',
                  borderColor: reward.status === 'pending' ? 'var(--warning-300)' : 'var(--border-light)'
                }}
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="relative">
                    {reward.employee?.avatar ? (
                      <img 
                        src={reward.employee.avatar} 
                        alt={reward.employee.full_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: 'var(--bg-secondary)' }}
                      >
                        <User className="w-6 h-6" style={{ color: 'var(--text-tertiary)' }} />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {reward.employee?.full_name || 'Colaborador'}
                      </p>
                      <span 
                        className="px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1"
                        style={{ 
                          backgroundColor: `${getRewardStatusColor(reward.status)}20`,
                          color: getRewardStatusColor(reward.status)
                        }}
                      >
                        {getStatusIcon(reward.status)}
                        {getRewardStatusLabel(reward.status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      <Award className="w-4 h-4" style={{ color: 'var(--warning-500)' }} />
                      <span className="font-medium">{reward.badge_name}</span>
                      <span>•</span>
                      <span>{getRewardIcon(reward.reward_type as any)} {reward.reward_description}</span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                      Solicitado em {new Date(reward.requested_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>

                  {/* Value */}
                  <div className="text-right">
                    <p className="font-bold text-lg" style={{ color: 'var(--primary-600)' }}>
                      {reward.reward_type === 'bonus' ? `R$ ${reward.reward_value}` :
                       reward.reward_type === 'time_off' ? `${reward.reward_value}h folga` :
                       reward.reward_type === 'points' ? `+${reward.reward_value} pts` :
                       reward.reward_description}
                    </p>
                  </div>

                  {/* Actions */}
                  {reward.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(reward.id)}
                        disabled={actionLoading === reward.id}
                        className="p-2 rounded-lg transition-all hover:scale-105 disabled:opacity-50"
                        style={{ backgroundColor: 'var(--success-100)' }}
                      >
                        <Check className="w-5 h-5" style={{ color: 'var(--success-600)' }} />
                      </button>
                      <button
                        onClick={() => setSelectedReward(reward)}
                        disabled={actionLoading === reward.id}
                        className="p-2 rounded-lg transition-all hover:scale-105 disabled:opacity-50"
                        style={{ backgroundColor: 'var(--error-100)' }}
                      >
                        <X className="w-5 h-5" style={{ color: 'var(--error-600)' }} />
                      </button>
                    </div>
                  )}

                  {reward.status === 'rejected' && reward.rejected_reason && (
                    <div 
                      className="max-w-[200px] p-2 rounded-lg text-xs"
                      style={{ backgroundColor: 'var(--error-50)' }}
                    >
                      <p className="font-medium" style={{ color: 'var(--error-700)' }}>Motivo:</p>
                      <p style={{ color: 'var(--error-600)' }}>{reward.rejected_reason}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Reject Modal */}
      <AnimatePresence>
        {selectedReward && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedReward(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md p-6 rounded-2xl shadow-2xl"
              style={{ backgroundColor: 'var(--bg-primary)' }}
            >
              <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Rejeitar Recompensa
              </h3>
              
              <div 
                className="p-3 rounded-lg mb-4"
                style={{ backgroundColor: 'var(--bg-secondary)' }}
              >
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {selectedReward.employee?.full_name}
                </p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {selectedReward.badge_name} - {selectedReward.reward_description}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Motivo da Rejeição *
                </label>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Informe o motivo da rejeição..."
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border resize-none"
                  style={{ 
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-light)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedReward(null)
                    setRejectReason('')
                  }}
                  className="flex-1 py-2 rounded-lg font-medium transition-all"
                  style={{ 
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleReject(selectedReward.id)}
                  disabled={actionLoading === selectedReward.id || !rejectReason.trim()}
                  className="flex-1 py-2 rounded-lg font-medium text-white transition-all disabled:opacity-50"
                  style={{ backgroundColor: 'var(--error-500)' }}
                >
                  {actionLoading === selectedReward.id ? 'Rejeitando...' : 'Confirmar Rejeição'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

