'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import {
  TrendingUp, DollarSign, Target, AlertTriangle, CheckCircle2,
  Clock, Users, BarChart3, Calendar, Bell, Zap, RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Campaign {
  id: string
  clientName: string
  platform: string
  budget: number
  spent: number
  roas: number
  status: 'active' | 'low_budget' | 'needs_refill'
  needsAttention: boolean
}

export default function DashboardTrafegoPage() {
  const [loading, setLoading] = useState(true)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [meetings, setMeetings] = useState<any[]>([])
  const [overdueTasks, setOverdueTasks] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Mock data - integrar com banco depois
      const mockCampaigns: Campaign[] = [
        {
          id: '1',
          clientName: 'Tech Solutions',
          platform: 'Google Ads',
          budget: 5000,
          spent: 4800,
          roas: 4.2,
          status: 'low_budget',
          needsAttention: true
        },
        {
          id: '2',
          clientName: 'E-commerce Plus',
          platform: 'Facebook Ads',
          budget: 3000,
          spent: 3000,
          roas: 2.8,
          status: 'needs_refill',
          needsAttention: true
        },
        {
          id: '3',
          clientName: 'Marketing Pro',
          platform: 'Instagram Ads',
          budget: 4000,
          spent: 2100,
          roas: 5.1,
          status: 'active',
          needsAttention: false
        }
      ]

      const mockMeetings = [
        {
          id: '1',
          title: 'Reunião com Tech Solutions - Análise de Campanha',
          date: new Date(Date.now() + 2 * 60 * 60 * 1000),
          type: 'urgent'
        }
      ]

      const mockOverdueTasks = [
        {
          id: '1',
          title: 'Relatório mensal Google Ads - Tech Solutions',
          dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        }
      ]

      setCampaigns(mockCampaigns)
      setMeetings(mockMeetings)
      setOverdueTasks(mockOverdueTasks)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-73px)] flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: 'var(--primary-500)' }}></div>
          <p className="mt-4" style={{ color: 'var(--text-secondary)' }}>Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  const totalBudget = campaigns.reduce((acc, c) => acc + c.budget, 0)
  const totalSpent = campaigns.reduce((acc, c) => acc + c.spent, 0)
  const avgRoas = campaigns.reduce((acc, c) => acc + c.roas, 0) / campaigns.length

  return (
    <div className="min-h-[calc(100vh-73px)] p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Dashboard - Tráfego Pago
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Bem-vindo(a)! Acompanhe suas campanhas e métricas
          </p>
        </div>

        {/* Alertas Críticos */}
        {(overdueTasks.length > 0 || campaigns.some(c => c.needsAttention) || meetings.length > 0) && (
          <div className="space-y-3">
            {/* Reuniões Fixadas */}
            {meetings.map((meeting) => (
              <motion.div
                key={meeting.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="rounded-xl p-4 flex items-center gap-3"
                style={{ 
                  backgroundColor: 'var(--primary-50)', 
                  borderWidth: '1px',
                  borderColor: 'var(--primary-200)'
                }}
              >
                <Calendar className="w-5 h-5" style={{ color: 'var(--primary-600)' }} />
                <div className="flex-1">
                  <p className="font-semibold text-sm" style={{ color: 'var(--primary-700)' }}>
                    📅 Reunião agendada em {Math.floor((meeting.date.getTime() - Date.now()) / (1000 * 60 * 60))}h
                  </p>
                  <p className="text-xs" style={{ color: 'var(--primary-600)' }}>
                    {meeting.title}
                  </p>
                </div>
              </motion.div>
            ))}

            {/* Tarefas Atrasadas */}
            {overdueTasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="rounded-xl p-4 flex items-center gap-3"
                style={{ 
                  backgroundColor: 'var(--error-50)', 
                  borderWidth: '1px',
                  borderColor: 'var(--error-200)'
                }}
              >
                <AlertTriangle className="w-5 h-5" style={{ color: 'var(--error-600)' }} />
                <div className="flex-1">
                  <p className="font-semibold text-sm" style={{ color: 'var(--error-700)' }}>
                    ⚠️ Tarefa atrasada há {Math.floor((Date.now() - task.dueDate.getTime()) / (1000 * 60 * 60 * 24))} dias
                  </p>
                  <p className="text-xs" style={{ color: 'var(--error-600)' }}>
                    {task.title}
                  </p>
                </div>
              </motion.div>
            ))}

            {/* Lembretes de Recarga */}
            {campaigns.filter(c => c.status === 'needs_refill').map((campaign) => (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="rounded-xl p-4 flex items-center gap-3"
                style={{ 
                  backgroundColor: 'var(--warning-50)', 
                  borderWidth: '1px',
                  borderColor: 'var(--warning-200)'
                }}
              >
                <RefreshCw className="w-5 h-5" style={{ color: 'var(--warning-600)' }} />
                <div className="flex-1">
                  <p className="font-semibold text-sm" style={{ color: 'var(--warning-700)' }}>
                    💰 Cliente precisa recarregar saldo
                  </p>
                  <p className="text-xs" style={{ color: 'var(--warning-600)' }}>
                    {campaign.clientName} - {campaign.platform}: Budget esgotado (R$ {campaign.budget.toLocaleString()})
                  </p>
                </div>
                <button
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-white transition-all hover:scale-105"
                  style={{ backgroundColor: 'var(--warning-500)' }}
                >
                  Notificar Cliente
                </button>
              </motion.div>
            ))}

            {/* Budget Baixo */}
            {campaigns.filter(c => c.status === 'low_budget').map((campaign) => (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="rounded-xl p-4 flex items-center gap-3"
                style={{ 
                  backgroundColor: 'var(--amber-50)', 
                  borderWidth: '1px',
                  borderColor: 'var(--amber-200)'
                }}
              >
                <Zap className="w-5 h-5" style={{ color: 'var(--amber-600)' }} />
                <div className="flex-1">
                  <p className="font-semibold text-sm" style={{ color: 'var(--amber-700)' }}>
                    ⚡ Budget acabando
                  </p>
                  <p className="text-xs" style={{ color: 'var(--amber-600)' }}>
                    {campaign.clientName} - {campaign.platform}: Restam apenas R$ {(campaign.budget - campaign.spent).toFixed(2)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl p-6"
            style={{ backgroundColor: 'var(--bg-primary)', borderWidth: '1px', borderColor: 'var(--border-light)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Campanhas Ativas</span>
              <Target className="w-5 h-5" style={{ color: 'var(--primary-500)' }} />
            </div>
            <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {campaigns.length}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--success-600)' }}>
              {campaigns.filter(c => c.status === 'active').length} operando bem
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl p-6"
            style={{ backgroundColor: 'var(--bg-primary)', borderWidth: '1px', borderColor: 'var(--border-light)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Budget Total</span>
              <DollarSign className="w-5 h-5" style={{ color: 'var(--success-500)' }} />
            </div>
            <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
              R$ {totalBudget.toLocaleString()}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              R$ {totalSpent.toLocaleString()} investido
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl p-6"
            style={{ backgroundColor: 'var(--bg-primary)', borderWidth: '1px', borderColor: 'var(--border-light)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>ROAS Médio</span>
              <TrendingUp className="w-5 h-5" style={{ color: 'var(--primary-500)' }} />
            </div>
            <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {avgRoas.toFixed(1)}x
            </p>
            <p className="text-xs mt-1" style={{ color: avgRoas >= 3 ? 'var(--success-600)' : 'var(--warning-600)' }}>
              {avgRoas >= 3 ? '✅ Acima da meta' : '⚠️ Abaixo da meta'}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl p-6"
            style={{ backgroundColor: 'var(--bg-primary)', borderWidth: '1px', borderColor: 'var(--border-light)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Atenção Necessária</span>
              <AlertTriangle className="w-5 h-5" style={{ color: 'var(--warning-500)' }} />
            </div>
            <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {campaigns.filter(c => c.needsAttention).length}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--warning-600)' }}>
              Campanhas precisam de ação
            </p>
          </motion.div>
        </div>

        {/* Campanhas */}
        <div 
          className="rounded-xl p-6"
          style={{ backgroundColor: 'var(--bg-primary)', borderWidth: '1px', borderColor: 'var(--border-light)' }}
        >
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Campanhas Ativas
          </h2>
          <div className="space-y-3">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="p-4 rounded-lg border"
                style={{ 
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: campaign.needsAttention ? 'var(--warning-300)' : 'var(--border-light)'
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {campaign.clientName}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {campaign.platform}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      ROAS: {campaign.roas.toFixed(1)}x
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {campaign.status === 'active' && '✅ Ativa'}
                      {campaign.status === 'low_budget' && '⚡ Budget baixo'}
                      {campaign.status === 'needs_refill' && '💰 Precisa recarregar'}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-2">
                  <div className="flex items-center justify-between text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                    <span>Budget utilizado</span>
                    <span>{((campaign.spent / campaign.budget) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${(campaign.spent / campaign.budget) * 100}%`,
                        backgroundColor: campaign.spent / campaign.budget > 0.9 ? 'var(--error-500)' : 'var(--success-500)'
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: 'var(--text-secondary)' }}>
                    R$ {campaign.spent.toLocaleString()} / R$ {campaign.budget.toLocaleString()}
                  </span>
                  {campaign.needsAttention && (
                    <button
                      className="px-3 py-1 rounded-lg text-xs font-semibold text-white"
                      style={{ backgroundColor: 'var(--primary-500)' }}
                    >
                      Ver detalhes
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Insights da Val */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-6"
          style={{ 
            background: 'linear-gradient(135deg, var(--primary-50) 0%, var(--primary-100) 100%)',
            borderWidth: '1px',
            borderColor: 'var(--primary-200)'
          }}
        >
          <div className="flex items-start gap-4">
            <div 
              className="p-3 rounded-xl flex-shrink-0"
              style={{ backgroundColor: 'var(--primary-500)' }}
            >
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold mb-2" style={{ color: 'var(--primary-700)' }}>
                💡 Insight da Val
              </h3>
              <p className="text-sm mb-3" style={{ color: 'var(--primary-600)' }}>
                Excelente trabalho! Suas campanhas estão com ROAS acima da média. Continue monitorando o budget do Tech Solutions e E-commerce Plus para evitar pausas nas campanhas.
              </p>
              <p className="text-xs font-semibold" style={{ color: 'var(--primary-700)' }}>
                ⚡ Dica: Configure alertas automáticos quando o budget atingir 80% para antecipar recargas.
              </p>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  )
}









