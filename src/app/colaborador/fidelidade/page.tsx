'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Gift, Copy, Share2, Mail, MessageCircle, Link2, 
  CheckCircle, Clock, XCircle, DollarSign, TrendingUp,
  Users, Calendar, Award, Sparkles, ExternalLink
} from 'lucide-react'
import { motion } from 'framer-motion'

interface ReferralProgram {
  referral_code: string
  times_used: number
  total_earned: number
  pending_amount: number
  shares_count: number
  is_active: boolean
}

interface Referral {
  id: string
  client_name: string
  client_email: string
  client_phone: string
  contract_value: number
  commission_amount: number
  status: string
  referred_at: Date
  contract_signed_at?: Date
  commission_paid_at?: Date
  payment_month?: string
}

export default function FidelidadePage() {
  const [program, setProgram] = useState<ReferralProgram | null>(null)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadReferralData()
  }, [])

  const loadReferralData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!employee) return

      // Buscar programa de indicação
      let { data: programData } = await supabase
        .from('employee_referral_program')
        .select('*')
        .eq('employee_id', employee.id)
        .single()

      // Se não existir, criar
      if (!programData) {
        const { data: newProgram } = await supabase
          .rpc('create_employee_referral_program', { p_employee_id: employee.id })

        if (newProgram) {
          const { data: createdProgram } = await supabase
            .from('employee_referral_program')
            .select('*')
            .eq('employee_id', employee.id)
            .single()

          programData = createdProgram
        }
      }

      // Buscar indicações
      const { data: referralsData } = await supabase
        .from('employee_referrals')
        .select('*')
        .eq('employee_id', employee.id)
        .order('referred_at', { ascending: false })

      setProgram(programData)
      setReferrals(referralsData || [])
    } catch (error) {
      console.error('Erro ao carregar programa:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyCode = () => {
    if (program?.referral_code) {
      navigator.clipboard.writeText(program.referral_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleShare = async (channel: 'whatsapp' | 'email') => {
    if (!program?.referral_code) return

    const message = `🎁 Quer transformar seu marketing com IA? Use meu cupom exclusivo ${program.referral_code} e ganhe 10% de desconto! Entre em contato com a Valle 360: https://valle360.com`

    if (channel === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
    } else if (channel === 'email') {
      window.open(`mailto:?subject=Indicação Valle 360&body=${encodeURIComponent(message)}`, '_blank')
    }

    // Registrar compartilhamento
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (employee) {
        await supabase.rpc('track_referral_share', {
          p_employee_id: employee.id,
          p_channel: channel
        })
      }
    } catch (error) {
      console.error('Erro ao registrar compartilhamento:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Em Negociação', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      qualified: { label: 'Lead Qualificado', color: 'bg-blue-100 text-blue-800', icon: Users },
      proposal_sent: { label: 'Proposta Enviada', color: 'bg-purple-100 text-purple-800', icon: Mail },
      contract_signed: { label: 'Contrato Assinado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      paid: { label: 'Comissão Paga', color: 'bg-green-100 text-green-800', icon: DollarSign },
      cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: XCircle },
      expired: { label: 'Expirado', color: 'bg-gray-100 text-gray-800', icon: XCircle }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4370d1] mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando programa...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-8 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Gift className="w-8 h-8" />
                Programa de Fidelidade
              </h1>
              <p className="text-white/90">Indique clientes e ganhe 10% do valor de cada contrato!</p>
            </div>
            <Sparkles className="w-16 h-16 opacity-50" />
          </div>
        </motion.div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Indicado</h3>
            <p className="text-3xl font-bold text-gray-900">{program?.times_used || 0}</p>
            <p className="text-xs text-gray-500 mt-1">clientes</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Ganho</h3>
            <p className="text-3xl font-bold text-gray-900">
              R$ {(program?.total_earned || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-500 mt-1">pago em salário</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <Calendar className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Próximo Pagamento</h3>
            <p className="text-3xl font-bold text-gray-900">
              R$ {(program?.pending_amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </p>
          </motion.div>
        </div>

        {/* Cupom de Indicação */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl p-8 shadow-sm border border-gray-100"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Award className="w-7 h-7 text-[#4370d1]" />
            Seu Cupom Exclusivo
          </h2>

          {/* Cupom */}
          <div className="bg-gradient-to-r from-[#0f1b35] to-[#4370d1] rounded-2xl p-8 text-white mb-6">
            <p className="text-white/80 text-sm mb-3">SEU CÓDIGO DE INDICAÇÃO:</p>
            <div className="flex items-center justify-between bg-white/10 rounded-xl p-4 backdrop-blur-sm mb-6">
              <p className="text-3xl font-bold tracking-wider">{program?.referral_code}</p>
              <button
                onClick={handleCopyCode}
                className="bg-white/20 hover:bg-white/30 p-3 rounded-lg transition-all flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    <span className="text-sm">Copiar</span>
                  </>
                )}
              </button>
            </div>

            {/* Botões de Compartilhamento */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <button
                onClick={() => handleShare('whatsapp')}
                className="bg-white/10 hover:bg-white/20 p-4 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="font-medium">WhatsApp</span>
              </button>

              <button
                onClick={() => handleShare('email')}
                className="bg-white/10 hover:bg-white/20 p-4 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Mail className="w-5 h-5" />
                <span className="font-medium">Email</span>
              </button>

              <button
                onClick={handleCopyCode}
                className="bg-white/10 hover:bg-white/20 p-4 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Link2 className="w-5 h-5" />
                <span className="font-medium">Copiar Link</span>
              </button>

              <button
                onClick={() => {}}
                className="bg-white/10 hover:bg-white/20 p-4 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Share2 className="w-5 h-5" />
                <span className="font-medium">Mais</span>
              </button>
            </div>
          </div>

          {/* Como Funciona */}
          <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-100">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Como Funciona
            </h3>
            <ol className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                <span>Compartilhe seu cupom exclusivo com empresas interessadas em marketing digital</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                <span>O cliente menciona seu cupom durante o fechamento do contrato</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                <span>Você recebe <strong>10% do valor total do contrato</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                <span>Pagamento automático no seu salário do próximo mês 💰</span>
              </li>
            </ol>
          </div>
        </motion.div>

        {/* Histórico de Indicações */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Histórico de Indicações</h2>

          {referrals.length > 0 ? (
            <div className="space-y-4">
              {referrals.map((referral) => (
                <div key={referral.id} className="p-5 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{referral.client_name}</h3>
                      <p className="text-sm text-gray-600">{referral.client_email}</p>
                      {referral.client_phone && (
                        <p className="text-sm text-gray-600">{referral.client_phone}</p>
                      )}
                    </div>
                    {getStatusBadge(referral.status)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Valor do Contrato</p>
                      <p className="text-lg font-bold text-gray-900">
                        {referral.contract_value 
                          ? `R$ ${referral.contract_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : 'Aguardando'
                        }
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Sua Comissão (10%)</p>
                      <p className="text-lg font-bold text-green-600">
                        {referral.commission_amount 
                          ? `R$ ${referral.commission_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : 'A calcular'
                        }
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        {referral.status === 'paid' ? 'Pago em' : 
                         referral.status === 'contract_signed' ? 'Pagamento em' : 
                         'Indicado em'}
                      </p>
                      <p className="text-sm font-medium text-gray-700">
                        {referral.commission_paid_at 
                          ? new Date(referral.commission_paid_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
                          : referral.payment_month 
                          ? referral.payment_month
                          : new Date(referral.referred_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
                        }
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-2">Nenhuma indicação ainda</p>
              <p className="text-gray-500 text-sm">Compartilhe seu cupom e comece a ganhar!</p>
            </div>
          )}
        </motion.div>

      </div>
    </div>
  )
}











