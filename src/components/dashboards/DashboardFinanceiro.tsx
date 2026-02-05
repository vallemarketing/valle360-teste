'use client'

import { DollarSign, TrendingUp, FileText, AlertCircle, Sparkles } from 'lucide-react'
import CashFlowProjection from './widgets/CashFlowProjection'

export default function DashboardFinanceiro() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">💰 Financeiro - Gestão Financeira</h2>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4" style={{ borderColor: '#10B981' }}>
          <p className="text-sm text-gray-600">Recebido</p>
          <p className="text-3xl font-bold text-gray-900">R$ 125k</p>
          <p className="text-sm" style={{ color: '#10B981' }}>💰 Este mês</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4" style={{ borderColor: '#F59E0B' }}>
          <p className="text-sm text-gray-600">A Receber</p>
          <p className="text-3xl font-bold text-gray-900">R$ 85k</p>
          <p className="text-sm" style={{ color: '#F59E0B' }}>📅 Previsto</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4" style={{ borderColor: '#3B82F6' }}>
          <p className="text-sm text-gray-600">Faturas Abertas</p>
          <p className="text-3xl font-bold text-gray-900">12</p>
          <p className="text-sm" style={{ color: '#3B82F6' }}>📄 Pendentes</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4" style={{ borderColor: '#EF4444' }}>
          <p className="text-sm text-gray-600">Em Atraso</p>
          <p className="text-3xl font-bold text-gray-900">3</p>
          <p className="text-sm" style={{ color: '#EF4444' }}>⚠️ Atenção</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Faturas Recentes (2/3 width) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Faturas Recentes</h3>
          <div className="space-y-3">
            {[
              { client: 'Cliente ABC', value: 'R$ 15.000', date: '10/12/2025', status: 'pago' },
              { client: 'Cliente XYZ', value: 'R$ 22.500', date: '15/12/2025', status: 'pendente' },
              { client: 'Cliente 123', value: 'R$ 8.750', date: '05/12/2025', status: 'atrasado' }
            ].map((invoice, i) => (
              <div key={i} className="p-4 border rounded-lg hover:bg-gray-50 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{invoice.client}</p>
                    <p className="text-sm text-gray-600">{invoice.value} - Venc: {invoice.date}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    invoice.status === 'pago' ? 'bg-green-100 text-green-700' :
                    invoice.status === 'pendente' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {invoice.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cash Flow Projection (1/3 width) */}
        <div className="lg:col-span-1">
          <CashFlowProjection />
        </div>
      </div>

      {/* Insights da Val */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg border-2 border-green-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white text-2xl flex-shrink-0">
            ✨
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2 text-gray-900">Insights Financeiros da Val</h3>
            <p className="text-sm text-gray-700 mb-4">
              💰 Fluxo de caixa positivo! Você recebeu R$ 125k este mês. Considere investir em marketing para aumentar ainda mais.
            </p>
            <button className="px-4 py-2 rounded-lg text-white transition-all hover:scale-105" style={{ backgroundColor: '#10B981' }}>
              <Sparkles className="w-4 h-4 inline mr-2" />
              Ver Projeções
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
