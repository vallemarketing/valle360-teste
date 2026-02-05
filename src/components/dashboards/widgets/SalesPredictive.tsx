'use client'

import { TrendingUp, Target, ArrowUpRight, AlertCircle, HelpCircle } from 'lucide-react'
import { motion } from 'framer-motion'

interface SalesPredictiveProps {
  currentSales: number
  goal: number
  averageDailySales: number
  daysRemaining: number
}

export default function SalesPredictive({ 
  currentSales = 65000, 
  goal = 100000, 
  averageDailySales = 2500,
  daysRemaining = 10
}: SalesPredictiveProps) {
  
  const projectedSales = currentSales + (averageDailySales * daysRemaining)
  const projectionPercent = Math.min(Math.round((projectedSales / goal) * 100), 100)
  const currentPercent = Math.round((currentSales / goal) * 100)
  const gap = goal - currentSales
  const requiredDaily = gap / daysRemaining

  const statusColor = projectionPercent >= 100 ? 'text-green-600' : projectionPercent >= 80 ? 'text-yellow-600' : 'text-red-600'
  const statusBg = projectionPercent >= 100 ? 'bg-green-50' : projectionPercent >= 80 ? 'bg-yellow-50' : 'bg-red-50'
  const progressBarColor = projectionPercent >= 100 ? 'bg-green-500' : projectionPercent >= 80 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${statusBg} ${statusColor}`}>
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Previsão de Meta</h3>
            <p className="text-xs text-gray-500">Inteligência Preditiva Comercial</p>
          </div>
        </div>
        <div className="relative group">
          <HelpCircle className="w-5 h-5 text-gray-400 cursor-help" />
          <div className="absolute right-0 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            Cálculo baseado na média diária atual x dias úteis restantes.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Projeção de Fechamento</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${statusColor}`}>
              {projectionPercent}%
            </span>
            <span className="text-xs text-gray-400">
              (R$ {(projectedSales / 1000).toFixed(1)}k)
            </span>
          </div>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Meta Diária Necessária</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">
              R$ {(requiredDaily / 1000).toFixed(1)}k
            </span>
            {requiredDaily > averageDailySales && (
              <span className="text-xs text-red-500 flex items-center">
                <ArrowUpRight className="w-3 h-3" /> Aumentar ritmo
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative pt-1">
        <div className="flex mb-2 items-center justify-between">
          <div>
            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-gray-600 bg-gray-200">
              Progresso Atual
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold inline-block text-gray-600">
              {currentPercent}%
            </span>
          </div>
        </div>
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${currentPercent}%` }}
            transition={{ duration: 1 }}
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
          />
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(0, projectionPercent - currentPercent)}%` }}
            transition={{ duration: 1, delay: 0.5 }}
            className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center opacity-50 ${progressBarColor}`} 
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>R$ 0</span>
          <span>Meta: R$ {(goal / 1000).toFixed(0)}k</span>
        </div>
      </div>

      {/* Insight */}
      <div className="mt-4 flex items-start gap-3 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
        <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <p>
          {projectionPercent >= 100 
            ? "🚀 Excelente! Você está no caminho para superar a meta. Tente adiantar leads do próximo mês."
            : `⚠️ Atenção! Para bater a meta, você precisa fechar mais R$ ${(gap / 1000).toFixed(1)}k. Foque nos leads em 'Negociação'.`
          }
        </p>
      </div>
    </div>
  )
}

