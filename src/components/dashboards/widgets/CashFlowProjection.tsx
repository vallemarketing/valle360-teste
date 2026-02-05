'use client'

import { TrendingUp, ArrowDownRight, ArrowUpRight, DollarSign, Calendar, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'

export default function CashFlowProjection() {
  const projectionData = [
    { month: 'Dez', inflow: 125000, outflow: 85000, balance: 40000 },
    { month: 'Jan', inflow: 140000, outflow: 90000, balance: 50000 },
    { month: 'Fev', inflow: 110000, outflow: 88000, balance: 22000 },
  ]

  const currentMonth = projectionData[0]
  const nextMonth = projectionData[1]

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Fluxo de Caixa Projetado</h3>
            <p className="text-xs text-gray-500">Previsão para 90 dias</p>
          </div>
        </div>
      </div>

      {/* Resumo Próximo Mês */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
          <p className="text-xs text-emerald-700 mb-1 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" /> Entradas Previstas (Jan)
          </p>
          <span className="text-xl font-bold text-emerald-700">
            R$ {(nextMonth.inflow / 1000).toFixed(0)}k
          </span>
        </div>
        <div className="p-4 bg-red-50 rounded-lg border border-red-100">
          <p className="text-xs text-red-700 mb-1 flex items-center gap-1">
            <ArrowDownRight className="w-3 h-3" /> Saídas Previstas (Jan)
          </p>
          <span className="text-xl font-bold text-red-700">
            R$ {(nextMonth.outflow / 1000).toFixed(0)}k
          </span>
        </div>
      </div>

      {/* Gráfico de Barras Simplificado */}
      <div className="space-y-4">
        {projectionData.map((data, index) => (
          <div key={index} className="relative">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span className="font-semibold text-gray-700">{data.month}</span>
              <span>Saldo: R$ {(data.balance / 1000).toFixed(1)}k</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(data.inflow / 150000) * 100}%` }}
                transition={{ duration: 1, delay: index * 0.2 }}
                className="h-full bg-emerald-500"
              />
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(data.outflow / 150000) * 100}%` }}
                transition={{ duration: 1, delay: index * 0.2 + 0.1 }}
                className="h-full bg-red-400 opacity-80"
                style={{ marginLeft: '-10px', mixBlendMode: 'multiply' }} 
              />
            </div>
          </div>
        ))}
      </div>

      {/* Alerta Inteligente */}
      <div className="mt-6 flex items-start gap-3 text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg border border-yellow-100">
        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <p>
          Atenção para <strong>Fevereiro</strong>: Previsão de queda nas entradas. Recomendado antecipar recebíveis ou reforçar vendas agora.
        </p>
      </div>
    </div>
  )
}

