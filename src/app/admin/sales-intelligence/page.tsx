'use client'

import { useState } from 'react'
import { 
  BarChart3, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  Zap, 
  Users,
  ArrowRight,
  Brain,
  Target
} from 'lucide-react'

export default function SalesIntelligence() {
  const [selectedPeriod, setSelectedPeriod] = useState('month')

  // Dados simulados para demonstração
  const insights = [
    {
      type: 'warning',
      title: 'Risco de Gargalo Detectado',
      description: 'O time de Design está com 15 tarefas na fase "Revisão" há mais de 48h. Isso pode impactar as entregas de sexta-feira.',
      action: 'Ver Detalhes'
    },
    {
      type: 'success',
      title: 'Produtividade em Alta',
      description: 'O setor de Web Design aumentou a velocidade de entrega em 22% esta semana após a implementação do novo fluxo.',
      action: 'Ver Relatório'
    },
    {
      type: 'prediction',
      title: 'Previsão de Atraso',
      description: 'Baseado no histórico, o projeto "Campanha Black Friday" tem 75% de chance de atrasar se não for priorizado hoje.',
      action: 'Priorizar Agora'
    }
  ]

  const performanceData = [
    { name: 'Design', delivered: 45, delayed: 3, efficiency: 94 },
    { name: 'Web', delivered: 28, delayed: 1, efficiency: 98 },
    { name: 'Social', delivered: 156, delayed: 12, efficiency: 88 },
    { name: 'Video', delivered: 12, delayed: 4, efficiency: 82 },
  ]

  return (
    <div className="min-h-screen bg-gray-50/50 p-8 space-y-8">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Brain className="w-10 h-10 text-indigo-600" />
            Centro de Inteligência Valle 360
          </h1>
          <p className="text-gray-500 mt-2 text-lg">Análise preditiva e insights estratégicos baseados em dados reais.</p>
        </div>
        
        <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
          {['semana', 'mês', 'trimestre'].map((p) => (
            <button
              key={p}
              onClick={() => setSelectedPeriod(p)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                selectedPeriod === p 
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs Preditivos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="relative">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <Zap className="w-5 h-5" />
              <span className="font-semibold text-sm">Velocidade Média</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900">4.2 dias</h3>
            <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              -12% vs mês anterior
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="relative">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-semibold text-sm">Risco de Atraso</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900">18%</h3>
            <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +2% vs média histórica
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="relative">
            <div className="flex items-center gap-2 text-purple-600 mb-2">
              <Target className="w-5 h-5" />
              <span className="font-semibold text-sm">Eficiência Global</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900">92%</h3>
            <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Top 5% do mercado
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="relative">
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <Users className="w-5 h-5" />
              <span className="font-semibold text-sm">Satisfação (eNPS)</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900">78</h3>
            <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Zona de Excelência
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Insights da IA */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Insights da Val (IA)</h2>
            <button className="text-sm text-indigo-600 font-medium hover:underline">Ver todos</button>
          </div>
          
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <div key={index} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex gap-4">
                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0
                  ${insight.type === 'warning' ? 'bg-red-100 text-red-600' : ''}
                  ${insight.type === 'success' ? 'bg-green-100 text-green-600' : ''}
                  ${insight.type === 'prediction' ? 'bg-purple-100 text-purple-600' : ''}
                `}>
                  {insight.type === 'warning' && <AlertTriangle className="w-6 h-6" />}
                  {insight.type === 'success' && <TrendingUp className="w-6 h-6" />}
                  {insight.type === 'prediction' && <Brain className="w-6 h-6" />}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-gray-900">{insight.title}</h3>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600 uppercase tracking-wider">
                      {insight.type === 'prediction' ? 'IA Preditiva' : 'Análise'}
                    </span>
                  </div>
                  <p className="text-gray-600 mt-1">{insight.description}</p>
                  <button className="mt-3 text-sm font-medium text-indigo-600 flex items-center gap-1 hover:gap-2 transition-all">
                    {insight.action} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ranking de Performance */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Performance por Área</h2>
          <div className="space-y-6">
            {performanceData.map((area, index) => (
              <div key={index}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-900">{area.name}</span>
                  <span className={`text-sm font-bold ${
                    area.efficiency >= 90 ? 'text-green-600' : 
                    area.efficiency >= 80 ? 'text-blue-600' : 'text-yellow-600'
                  }`}>
                    {area.efficiency}% Eficiência
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-1000 ${
                      area.efficiency >= 90 ? 'bg-green-500' : 
                      area.efficiency >= 80 ? 'bg-blue-500' : 'bg-yellow-500'
                    }`}
                    style={{ width: `${area.efficiency}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>✅ {area.delivered} entregues</span>
                  <span>⚠️ {area.delayed} atrasos</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
            <h4 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Gargalo Identificado
            </h4>
            <p className="text-sm text-indigo-800">
              O tempo de aprovação do cliente aumentou 40% nos últimos 15 dias. Considere automatizar o follow-up.
            </p>
            <button className="mt-3 w-full py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
              Ativar Automação
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
