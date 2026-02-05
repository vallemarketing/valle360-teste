'use client'

import { useState } from 'react'
import { DollarSign, TrendingUp, AlertTriangle, Clock, ArrowRight, MoreHorizontal } from 'lucide-react'

export default function ProfitabilityView() {
  const [timeRange, setTimeRange] = useState('month')

  // Dados simulados de projetos
  const projects = [
    {
      id: 1,
      client: 'Tech Corp',
      project: 'Redesign App',
      budget: 45000,
      cost: 12500,
      hours: 145,
      status: 'healthy', // healthy, warning, critical
      deadline: '2025-02-15'
    },
    {
      id: 2,
      client: 'Startup ABC',
      project: 'Campanha Q1',
      budget: 15000,
      cost: 14200,
      hours: 98,
      status: 'critical',
      deadline: '2025-01-30'
    },
    {
      id: 3,
      client: 'Marketing Pro',
      project: 'Gestão Social Media',
      budget: 5000,
      cost: 1200,
      hours: 12,
      status: 'healthy',
      deadline: 'Mensal'
    },
    {
      id: 4,
      client: 'Loja Exemplo',
      project: 'E-commerce',
      budget: 25000,
      cost: 18000,
      hours: 210,
      status: 'warning',
      deadline: '2025-03-10'
    }
  ]

  const totalRevenue = projects.reduce((acc, p) => acc + p.budget, 0)
  const totalCost = projects.reduce((acc, p) => acc + p.cost, 0)
  const profitMargin = ((totalRevenue - totalCost) / totalRevenue) * 100

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Lucratividade por Projeto (God Mode)</h2>
        <select 
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="month">Este Mês</option>
          <option value="quarter">Este Trimestre</option>
          <option value="year">Este Ano</option>
        </select>
      </div>

      {/* Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Receita Total Projetada</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-gray-900">R$ {(totalRevenue / 1000).toFixed(1)}k</span>
            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
              +12%
            </span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Custo Operacional (Horas)</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-gray-900">R$ {(totalCost / 1000).toFixed(1)}k</span>
            <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full font-medium">
              -5%
            </span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Margem de Lucro Média</p>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold ${profitMargin > 20 ? 'text-green-600' : 'text-yellow-600'}`}>
              {profitMargin.toFixed(1)}%
            </span>
            <div className="flex -space-x-2">
              {/* Avatars placeholder */}
              <div className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white" />
              <div className="w-6 h-6 rounded-full bg-gray-400 border-2 border-white" />
              <div className="w-6 h-6 rounded-full bg-gray-500 border-2 border-white flex items-center justify-center text-[10px] text-white">+3</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Projetos */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold">
                <th className="px-6 py-4">Projeto / Cliente</th>
                <th className="px-6 py-4">Orçamento</th>
                <th className="px-6 py-4">Custo Real</th>
                <th className="px-6 py-4">Margem</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {projects.map((project) => {
                const margin = ((project.budget - project.cost) / project.budget) * 100
                return (
                  <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-gray-900">{project.project}</p>
                        <p className="text-gray-500 text-xs">{project.client}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      R$ {project.budget.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      R$ {project.cost.toLocaleString()}
                      <span className="block text-xs text-gray-400">{project.hours}h gastas</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-bold ${margin < 15 ? 'text-red-500' : margin < 30 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {margin.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        project.status === 'critical' ? 'bg-red-100 text-red-700' :
                        project.status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {project.status === 'critical' ? 'Crítico' : project.status === 'warning' ? 'Atenção' : 'Saudável'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
            Ver Todos os Projetos <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Radar de Problemas */}
      {projects.some(p => p.status === 'critical') && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-red-700 text-sm">Atenção Necessária: Projetos em Risco</h4>
            <p className="text-sm text-red-600 mt-1">
              O projeto <strong>Campanha Q1 (Startup ABC)</strong> está com margem negativa (-5.3%). 
              Considere renegociar o escopo ou pausar atividades extras.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

