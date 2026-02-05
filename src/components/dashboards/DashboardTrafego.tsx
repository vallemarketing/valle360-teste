'use client'

import { Target, DollarSign, MousePointer, TrendingUp, Sparkles } from 'lucide-react'

interface Campaign {
  id: string
  name: string
  budget: number
  spent: number
  impressions: number
  clicks: number
  conversions: number
  ctr: number
}

interface DashboardTrafegoProps {
  campaigns?: Campaign[]
}

export function DashboardTrafego({ campaigns = [] }: DashboardTrafegoProps) {
  const defaultCampaigns: Campaign[] = campaigns.length > 0 ? campaigns : [
    {
      id: '1',
      name: 'Campanha Black Friday',
      budget: 5000,
      spent: 3200,
      impressions: 125000,
      clicks: 4500,
      conversions: 180,
      ctr: 3.6
    },
    {
      id: '2',
      name: 'Lançamento Produto X',
      budget: 8000,
      spent: 6100,
      impressions: 200000,
      clicks: 7200,
      conversions: 290,
      ctr: 3.6
    }
  ]

  const totalBudget = defaultCampaigns.reduce((acc, c) => acc + c.budget, 0)
  const totalSpent = defaultCampaigns.reduce((acc, c) => acc + c.spent, 0)
  const totalClicks = defaultCampaigns.reduce((acc, c) => acc + c.clicks, 0)
  const avgCTR = (defaultCampaigns.reduce((acc, c) => acc + c.ctr, 0) / defaultCampaigns.length).toFixed(1)

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">🎯 Tráfego Pago - Campanhas Ativas</h2>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4" style={{ borderColor: '#3B82F6' }}>
          <p className="text-sm text-gray-600">Budget Total</p>
          <p className="text-3xl font-bold text-gray-900">R$ {(totalBudget / 1000).toFixed(0)}k</p>
          <p className="text-sm" style={{ color: '#3B82F6' }}>💰 Investimento</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4" style={{ borderColor: '#F59E0B' }}>
          <p className="text-sm text-gray-600">Gasto</p>
          <p className="text-3xl font-bold text-gray-900">R$ {(totalSpent / 1000).toFixed(1)}k</p>
          <p className="text-sm" style={{ color: '#F59E0B' }}>📊 {((totalSpent / totalBudget) * 100).toFixed(0)}% usado</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4" style={{ borderColor: '#10B981' }}>
          <p className="text-sm text-gray-600">Total de Cliques</p>
          <p className="text-3xl font-bold text-gray-900">{(totalClicks / 1000).toFixed(1)}k</p>
          <p className="text-sm" style={{ color: '#10B981' }}>👆 Interações</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4" style={{ borderColor: '#8B5CF6' }}>
          <p className="text-sm text-gray-600">CTR Médio</p>
          <p className="text-3xl font-bold text-gray-900">{avgCTR}%</p>
          <p className="text-sm" style={{ color: '#8B5CF6' }}>📈 Performance</p>
        </div>
      </div>

      {/* Campanhas */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🚀 Campanhas Ativas</h3>
        <div className="space-y-3">
          {defaultCampaigns.map((campaign) => (
            <div key={campaign.id} className="p-4 border rounded-lg hover:bg-blue-50 transition-all">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">{campaign.name}</h4>
                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                  CTR: {campaign.ctr}%
                </span>
              </div>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Budget</p>
                  <p className="font-medium text-gray-900">R$ {campaign.budget}</p>
                </div>
                <div>
                  <p className="text-gray-600">Gasto</p>
                  <p className="font-medium text-gray-900">R$ {campaign.spent}</p>
                </div>
                <div>
                  <p className="text-gray-600">Cliques</p>
                  <p className="font-medium text-gray-900">{campaign.clicks.toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-gray-600">Conversões</p>
                  <p className="font-medium text-gray-900">{campaign.conversions}</p>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${(campaign.spent / campaign.budget) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600">{((campaign.spent / campaign.budget) * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights da Val */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-lg border-2 border-blue-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl flex-shrink-0">
            ✨
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2 text-gray-900">Insights da Val para Tráfego</h3>
            <p className="text-sm text-gray-700 mb-4">
              🎯 Seu CTR de {avgCTR}% está acima da média! Considere realocar budget das campanhas com CTR menor que 3% para as de melhor performance.
            </p>
            <button className="px-4 py-2 rounded-lg text-white transition-all hover:scale-105" style={{ backgroundColor: '#3B82F6' }}>
              <Sparkles className="w-4 h-4 inline mr-2" />
              Otimizar Campanhas
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardTrafego
