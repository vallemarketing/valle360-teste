'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  Radar, 
  TrendingUp, 
  AlertTriangle, 
  Calendar, 
  ArrowRight, 
  Zap, 
  Mail, 
  Clock,
  CheckCircle2,
  HeartPulse,
  TrendingDown
} from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

interface UpsellOpportunity {
  client_name: string
  client_email: string
  service_id: string
  service_name: string
  category: string
  potential_revenue: number
  probability_score: number
}

interface ExpiringContract {
  contract_id: string
  client_name: string
  client_email: string
  contract_value: number
  expiration_date: string
  days_remaining: number
  urgency_level: 'critical' | 'warning' | 'info'
}

interface ClientHealth {
  client_name: string
  client_email: string
  contract_id: string
  total_value: number
  health_score: number
  trend: 'increasing' | 'decreasing' | 'stable'
  churn_risk: 'high' | 'medium' | 'low'
}

export default function SalesRadarPage() {
  const [opportunities, setOpportunities] = useState<UpsellOpportunity[]>([])
  const [expiring, setExpiring] = useState<ExpiringContract[]>([])
  const [riskyClients, setRiskyClients] = useState<ClientHealth[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClientComponentClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Fetch Upsell Opportunities
      const { data: upsellData, error: upsellError } = await supabase
        .from('view_upsell_opportunities')
        .select('*')
        .limit(10)

      if (upsellError) throw upsellError

      // Fetch Expiring Contracts
      const { data: expiringData, error: expiringError } = await supabase
        .from('view_expiring_contracts')
        .select('*')
        .order('days_remaining', { ascending: true })

      if (expiringError) throw expiringError

      // Fetch Client Health (Risky Ones)
      const { data: healthData, error: healthError } = await supabase
        .from('view_client_health')
        .select('*')
        .in('churn_risk', ['high', 'medium'])
        .order('health_score', { ascending: true })
        .limit(5)

      if (healthError) throw healthError

      setOpportunities(upsellData || [])
      setExpiring(expiringData || [])
      setRiskyClients(healthData || [])
    } catch (error) {
      console.error('Erro ao carregar radar:', error)
      toast.error('Erro ao carregar dados do radar de vendas')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendProposal = async (opp: UpsellOpportunity) => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: `Gerando proposta de ${opp.service_name} para ${opp.client_name}...`,
        success: 'Proposta enviada para o cliente com sucesso!',
        error: 'Erro ao enviar proposta'
      }
    )
  }

  const handleRenewContract = async (contract: ExpiringContract) => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: `Preparando renovação para ${contract.client_name}...`,
        success: 'Link de renovação enviado!',
        error: 'Erro ao processar renovação'
      }
    )
  }

  const handleContactClient = async (client: ClientHealth) => {
    toast.success(`Iniciando contato de retenção com ${client.client_name}`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Radar className="w-8 h-8 text-purple-600" />
            Radar de Vendas
          </h1>
          <p className="text-gray-600 mt-2">
            Inteligência preditiva para identificar oportunidades e riscos.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 text-center">
            <p className="text-xs text-gray-500 font-medium uppercase">Potencial em Aberto</p>
            <p className="text-xl font-bold text-green-600">
              R$ {opportunities.reduce((acc, cur) => acc + cur.potential_revenue, 0).toLocaleString('pt-BR')}
            </p>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 text-center">
            <p className="text-xs text-gray-500 font-medium uppercase">Contratos em Risco</p>
            <p className="text-xl font-bold text-primary">
              {expiring.length + riskyClients.length}
            </p>
          </div>
        </div>
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Coluna da Esquerda: Riscos (Renovação + Churn) */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* Widget 1: Renovações */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-amber-100">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-primary" />
              Renovações Próximas
            </h2>
            
            {expiring.length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-400" />
                <p>Nenhum contrato vencendo em breve.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {expiring.map((contract) => (
                  <motion.div
                    key={contract.contract_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-4 rounded-xl border-l-4 ${
                      contract.urgency_level === 'critical' 
                        ? 'bg-red-50 border-red-500' 
                        : 'bg-amber-50 border-amber-400'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-gray-900">{contract.client_name}</h3>
                        <p className="text-sm text-gray-600">{contract.client_email}</p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                         contract.urgency_level === 'critical' 
                         ? 'bg-red-100 text-red-700'
                         : 'bg-amber-100 text-amber-700'
                      }`}>
                        {contract.days_remaining} dias
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <p className="font-semibold text-gray-900">
                        R$ {contract.contract_value.toLocaleString('pt-BR')}
                      </p>
                      <button
                        onClick={() => handleRenewContract(contract)}
                        className="text-sm px-3 py-1.5 bg-white shadow-sm rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1"
                      >
                        <Mail className="w-3 h-3" />
                        Propor Renovação
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Widget 2: Alerta de Churn (Health Score Baixo) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <HeartPulse className="w-5 h-5 text-red-500" />
              Risco de Churn (Atenção)
            </h2>

            {riskyClients.length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-400" />
                <p>Carteira saudável! Nenhum cliente em risco alto.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {riskyClients.map((client) => (
                  <div key={client.contract_id} className="p-4 rounded-xl bg-red-50 border border-red-100">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-gray-900">{client.client_name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                           <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                             <div 
                               className={`h-full ${client.health_score < 40 ? 'bg-red-500' : 'bg-primary'}`} 
                               style={{ width: `${client.health_score}%` }}
                             />
                           </div>
                           <span className="text-xs font-bold text-red-700">{client.health_score}/100</span>
                        </div>
                      </div>
                      {client.trend === 'decreasing' && (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-xs text-red-600 font-medium bg-red-100 px-2 py-1 rounded">
                        Risco {client.churn_risk === 'high' ? 'Alto' : 'Médio'}
                      </span>
                      <button
                        onClick={() => handleContactClient(client)}
                        className="text-sm px-3 py-1.5 bg-white shadow-sm rounded-lg font-medium text-red-700 hover:bg-red-50 transition-colors"
                      >
                        Plano de Retenção
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Coluna da Direita: Oportunidades de Upsell (2/3 largura) */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-purple-100 h-full">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-6">
              <Zap className="w-5 h-5 text-purple-500" />
              Sugestões de Upsell & Cross-sell
            </h2>

            {opportunities.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>Sem oportunidades identificadas no momento.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {opportunities.map((opp, idx) => (
                  <motion.div
                    key={`${opp.client_email}-${opp.service_id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="group relative p-5 rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all bg-white flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div className="px-2 py-1 bg-purple-50 rounded text-xs font-medium text-purple-700 mb-2 inline-block">
                          {opp.category || 'Serviço'}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Probabilidade</p>
                          <p className="font-bold text-green-600">{opp.probability_score}%</p>
                        </div>
                      </div>
                      
                      <h3 className="font-bold text-gray-900 text-lg mb-1">
                        {opp.service_name}
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Para: <span className="font-medium text-gray-900">{opp.client_name}</span>
                      </p>
                    </div>
                    
                    <div className="flex items-end justify-between mt-4">
                      <div>
                        <p className="text-xs text-gray-500">Potencial Extra</p>
                        <p className="text-xl font-bold text-gray-900">
                          + R$ {opp.potential_revenue.toLocaleString('pt-BR')}
                        </p>
                      </div>
                      
                      <button
                        onClick={() => handleSendProposal(opp)}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
                      >
                        Ofertar Agora
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
