'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, Users, TrendingUp, Target, Sparkles } from 'lucide-react'

export default function DashboardHeadMarketing() {
  const monthlyRevenue = 285000
  const activeClients = 45
  const activeProjects = 128
  const teamPerformance = 87

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">📊 Head de Marketing - Visão Estratégica</h2>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4" style={{ borderColor: '#10B981' }}>
          <p className="text-sm text-gray-600">Faturamento Mensal</p>
          <p className="text-3xl font-bold text-gray-900">R$ {(monthlyRevenue / 1000).toFixed(0)}k</p>
          <p className="text-sm" style={{ color: '#10B981' }}>↑ 24% vs mês anterior</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4" style={{ borderColor: '#3B82F6' }}>
          <p className="text-sm text-gray-600">Clientes Ativos</p>
          <p className="text-3xl font-bold text-gray-900">{activeClients}</p>
          <p className="text-sm" style={{ color: '#3B82F6' }}>↑ 8% vs mês anterior</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4" style={{ borderColor: '#F59E0B' }}>
          <p className="text-sm text-gray-600">Projetos em Andamento</p>
          <p className="text-3xl font-bold text-gray-900">{activeProjects}</p>
          <p className="text-sm" style={{ color: '#F59E0B' }}>↑ 12% vs mês anterior</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4" style={{ borderColor: '#8B5CF6' }}>
          <p className="text-sm text-gray-600">Performance da Equipe</p>
          <p className="text-3xl font-bold text-gray-900">{teamPerformance}%</p>
          <p className="text-sm" style={{ color: '#8B5CF6' }}>↑ 5% vs mês anterior</p>
        </div>
      </div>

      {/* Performance por Departamento */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance por Departamento</h3>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { dept: 'Social Media', metric: '156 posts, 8.5% eng.', color: '#E1306C' },
            { dept: 'Videomaker', metric: '24 projetos, 18 entregues', color: '#FF0000' },
            { dept: 'Design', metric: '89 briefings, 76 aprovados', color: '#7B68EE' },
            { dept: 'Web Design', metric: '12 sites, 34 tickets', color: '#4169E1' }
          ].map((item, i) => (
            <div key={i} className="p-6 border-2 rounded-lg" style={{ borderColor: item.color }}>
              <p className="font-semibold mb-2" style={{ color: item.color }}>{item.dept}</p>
              <p className="text-sm text-gray-600">{item.metric}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top Performers */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 Top Performers do Mês</h3>
        {[
          { name: 'Ana Silva', area: 'Social Media', points: 95 },
          { name: 'Carlos Santos', area: 'Videomaker', points: 92 },
          { name: 'Maria Lima', area: 'Design', points: 90 },
          { name: 'João Costa', area: 'Web Design', points: 88 }
        ].map((performer, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b last:border-b-0">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
              i === 0 ? 'bg-yellow-500' : 'bg-gray-400'
            }`}>
              {i + 1}
            </div>
            <p className="flex-1 font-medium text-gray-900">{performer.name} - {performer.area} - {performer.points} pontos</p>
          </div>
        ))}
      </div>

      {/* Insights da Val */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-lg border-2 border-purple-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl flex-shrink-0">
            ✨
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2 text-gray-900">Insights Estratégicos da Val</h3>
            <p className="text-sm text-gray-700 mb-4">
              📊 Análise: Seu faturamento está crescendo 24% ao mês! Continue investindo em Social Media e Design, que são os departamentos com melhor ROI.
            </p>
            <button className="px-4 py-2 rounded-lg text-white transition-all hover:scale-105" style={{ backgroundColor: '#8B5CF6' }}>
              <Sparkles className="w-4 h-4 inline mr-2" />
              Ver Relatório Completo
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
