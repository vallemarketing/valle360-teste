'use client'

import { TrendingUp, DollarSign, Users, Target, Sparkles } from 'lucide-react'
import SalesPredictive from './widgets/SalesPredictive'

interface Lead {
  id: string
  name: string
  value: number
  stage: string
  lastContact: string
}

interface DashboardComercialProps {
  leads?: Lead[]
  monthGoal?: number
}

export function DashboardComercial({ leads = [], monthGoal = 100000 }: DashboardComercialProps) {
  const defaultLeads: Lead[] = leads.length > 0 ? leads : [
    { id: '1', name: 'Empresa XYZ', value: 15000, stage: 'proposta', lastContact: '2025-11-20' },
    { id: '2', name: 'Startup ABC', value: 8000, stage: 'qualificado', lastContact: '2025-11-19' },
    { id: '3', name: 'Tech Corp', value: 25000, stage: 'negociacao', lastContact: '2025-11-18' }
  ]

  const pipelineTotal = defaultLeads.reduce((acc, l) => acc + l.value, 0)
  const activeDeals = defaultLeads.length
  const conversionRate = 34
  const newLeads = 23

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">📈 Comercial - Pipeline de Vendas</h2>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4" style={{ borderColor: '#10B981' }}>
          <p className="text-sm text-gray-600">Pipeline Total</p>
          <p className="text-3xl font-bold text-gray-900">R$ {(pipelineTotal / 1000).toFixed(0)}k</p>
          <p className="text-sm" style={{ color: '#10B981' }}>↑ 18% vs mês anterior</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4" style={{ borderColor: '#3B82F6' }}>
          <p className="text-sm text-gray-600">Negócios Ativos</p>
          <p className="text-3xl font-bold text-gray-900">{activeDeals}</p>
          <p className="text-sm" style={{ color: '#3B82F6' }}>↑ 12% vs mês anterior</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4" style={{ borderColor: '#F59E0B' }}>
          <p className="text-sm text-gray-600">Taxa de Conversão</p>
          <p className="text-3xl font-bold text-gray-900">{conversionRate}%</p>
          <p className="text-sm" style={{ color: '#F59E0B' }}>↑ 5% vs mês anterior</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4" style={{ borderColor: '#8B5CF6' }}>
          <p className="text-sm text-gray-600">Novos Leads</p>
          <p className="text-3xl font-bold text-gray-900">{newLeads}</p>
          <p className="text-sm" style={{ color: '#8B5CF6' }}>↑ 15% vs mês anterior</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Kanban (2/3 width) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md overflow-x-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Pipeline Kanban</h3>
          <div className="flex gap-4 min-w-max pb-4">
            {[
              { stage: 'Lead', deals: ['Empresa XYZ - R$ 15k', 'Startup ABC - R$ 8k'], color: '#6B7280' },
              { stage: 'Qualificado', deals: ['Tech Corp - R$ 25k', 'Digital House - R$ 12k'], color: '#3B82F6' },
              { stage: 'Proposta', deals: ['Marketing Pro - R$ 35k'], color: '#F59E0B' },
              { stage: 'Negociação', deals: ['Agência Top - R$ 45k', 'Empresa Beta - R$ 18k'], color: '#8B5CF6' },
              { stage: 'Ganho', deals: ['Cliente Novo - R$ 30k'], color: '#10B981' }
            ].map((s, i) => (
              <div key={i} className="w-64 flex-shrink-0">
                <div className="p-3 rounded-lg mb-3" style={{ backgroundColor: `${s.color}20` }}>
                  <h4 className="font-semibold text-sm" style={{ color: s.color }}>{s.stage}</h4>
                  <span className="text-xl font-bold text-gray-900">{s.deals.length}</span>
                </div>
                <div className="space-y-2">
                  {s.deals.map((d, j) => (
                    <div key={j} className="bg-white p-3 rounded-lg shadow border text-sm text-gray-900 border-l-4" style={{ borderLeftColor: s.color }}>
                      {d}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sales Predictive (1/3 width) */}
        <div className="lg:col-span-1">
          <SalesPredictive 
            currentSales={65000} 
            goal={monthGoal} 
            averageDailySales={2800}
            daysRemaining={12}
          />
        </div>
      </div>

      {/* Insights da Val */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg border-2 border-green-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white text-2xl flex-shrink-0">
            ✨
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2 text-gray-900">Insights da Val para Vendas</h3>
            <p className="text-sm text-gray-700 mb-4">
              📈 Seu pipeline cresceu 18%! Foque nos leads em "Negociação" - eles têm 70% de chance de fechar. Você está a R$ {((monthGoal - pipelineTotal) / 1000).toFixed(0)}k da meta!
            </p>
            <button className="px-4 py-2 rounded-lg text-white transition-all hover:scale-105" style={{ backgroundColor: '#10B981' }}>
              <Sparkles className="w-4 h-4 inline mr-2" />
              Ver Estratégias
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardComercial
