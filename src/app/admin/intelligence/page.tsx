'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Brain, TrendingUp, Users, DollarSign, AlertTriangle,
  Target, Zap, BarChart3, Activity, Bell, ChevronRight,
  Sparkles, Calculator, FileText, Radar, ThumbsUp
} from 'lucide-react';
import { PredictionsPanel } from '@/components/intelligence/PredictionsPanel';
import { ScenarioSimulator } from '@/components/intelligence/ScenarioSimulator';

// KPIs principais
const MAIN_KPIS = [
  { label: 'Faturamento', value: 'R$ 850k', change: 12, icon: <DollarSign className="w-5 h-5" />, color: '#10B981' },
  { label: 'Clientes', value: '127', change: 5, icon: <Users className="w-5 h-5" />, color: '#3B82F6' },
  { label: 'Equipe', value: '32', change: 2, icon: <Users className="w-5 h-5" />, color: '#8B5CF6' },
  { label: 'Eficiência', value: '94.2%', change: 3.5, icon: <Activity className="w-5 h-5" />, color: '#F59E0B' }
];

// Alertas críticos
const CRITICAL_ALERTS = [
  { type: 'danger', message: 'Cliente "Tech Corp" com NPS 4 - Risco de churn alto', action: 'Ver Cliente' },
  { type: 'warning', message: 'Vendedor Pedro 40% abaixo da meta', action: 'Ver Detalhes' },
  { type: 'warning', message: '5 tarefas críticas atrasadas', action: 'Ver Kanban' }
];

// Insights da Val
const VAL_INSIGHTS = [
  { priority: 1, text: 'Ligar para Tech Corp hoje - risco de churn alto', action: 'Gerar Script' },
  { priority: 2, text: 'Reunião com equipe comercial amanhã - meta em risco', action: 'Agendar' },
  { priority: 3, text: 'Contratar 1 designer - demanda cresceu 30%', action: 'Criar Vaga' }
];

// Saúde da empresa
const COMPANY_HEALTH = [
  { area: 'Financeiro', score: 82, color: '#10B981' },
  { area: 'Comercial', score: 71, color: '#F59E0B' },
  { area: 'Operacional', score: 94, color: '#10B981' },
  { area: 'RH', score: 85, color: '#3B82F6' }
];

export default function IntelligencePage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'predictions' | 'simulator'>('overview');

  return (
    <div 
      className="min-h-screen p-6"
      style={{ 
        background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)'
      }}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)' }}
            >
              <Brain className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Centro de Inteligência
              </h1>
              <p className="text-gray-400">
                Visão 360° da Valle com IA
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            {[
              { id: 'overview', label: 'Visão Geral', icon: <BarChart3 className="w-4 h-4" /> },
              { id: 'predictions', label: 'Previsões', icon: <TrendingUp className="w-4 h-4" /> },
              { id: 'simulator', label: 'Simulador', icon: <Calculator className="w-4 h-4" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                style={{
                  backgroundColor: activeTab === tab.id ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255,255,255,0.05)',
                  color: activeTab === tab.id ? 'white' : '#9CA3AF'
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Main KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {MAIN_KPIS.map((kpi, index) => (
                <motion.div
                  key={kpi.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="rounded-xl p-5"
                  style={{ 
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}
                >
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                    style={{ backgroundColor: `${kpi.color}20`, color: kpi.color }}
                  >
                    {kpi.icon}
                  </div>
                  <p className="text-3xl font-bold text-white">{kpi.value}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-gray-400">{kpi.label}</p>
                    <span 
                      className="text-sm font-medium"
                      style={{ color: kpi.change >= 0 ? '#10B981' : '#EF4444' }}
                    >
                      {kpi.change >= 0 ? '+' : ''}{kpi.change}%
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Critical Alerts */}
              <div 
                className="rounded-xl p-5"
                style={{ 
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)'
                }}
              >
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Alertas Críticos ({CRITICAL_ALERTS.length})
                </h3>
                <div className="space-y-3">
                  {CRITICAL_ALERTS.map((alert, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 rounded-lg"
                      style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${alert.type === 'danger' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                        <span className="text-sm text-gray-300">{alert.message}</span>
                      </div>
                      <button className="text-xs text-purple-400 hover:text-purple-300">
                        {alert.action}
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Val Insights */}
              <div 
                className="rounded-xl p-5"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(99, 102, 241, 0.1) 100%)',
                  border: '1px solid rgba(139, 92, 246, 0.3)'
                }}
              >
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  Insights da Val
                </h3>
                <div className="space-y-3">
                  {VAL_INSIGHTS.map((insight, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <span 
                            className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ backgroundColor: 'rgba(139, 92, 246, 0.3)', color: '#A78BFA' }}
                          >
                            {insight.priority}
                          </span>
                          <span className="text-sm text-gray-300">{insight.text}</span>
                        </div>
                      </div>
                      <button 
                        className="mt-2 w-full flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ backgroundColor: 'rgba(139, 92, 246, 0.3)', color: '#A78BFA' }}
                      >
                        <Zap className="w-3 h-3" />
                        {insight.action}
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Company Health */}
              <div 
                className="rounded-xl p-5"
                style={{ 
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
              >
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-400" />
                  Saúde da Empresa
                </h3>
                <div className="space-y-4">
                  {COMPANY_HEALTH.map((area, index) => (
                    <motion.div
                      key={area.area}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-400">{area.area}</span>
                        <span className="text-sm font-bold" style={{ color: area.color }}>
                          {area.score}%
                        </span>
                      </div>
                      <div 
                        className="h-2 rounded-full overflow-hidden"
                        style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                      >
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${area.score}%` }}
                          transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: area.color }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Relatórios', icon: <FileText className="w-5 h-5" />, href: '/admin/relatorios', color: '#3B82F6' },
                { label: 'Concorrência', icon: <Radar className="w-5 h-5" />, href: '/admin/concorrencia', color: '#EF4444' },
                { label: 'NPS', icon: <ThumbsUp className="w-5 h-5" />, href: '/admin/nps', color: '#8B5CF6' },
                { label: 'Metas', icon: <Target className="w-5 h-5" />, href: '/admin/metas', color: '#10B981' }
              ].map((action, index) => (
                <motion.a
                  key={action.label}
                  href={action.href}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center justify-between p-4 rounded-xl transition-colors"
                  style={{ 
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${action.color}20`, color: action.color }}
                    >
                      {action.icon}
                    </div>
                    <span className="font-medium text-white">{action.label}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                </motion.a>
              ))}
            </div>
          </div>
        )}

        {/* Predictions Tab */}
        {activeTab === 'predictions' && (
          <PredictionsPanel />
        )}

        {/* Simulator Tab */}
        {activeTab === 'simulator' && (
          <ScenarioSimulator />
        )}
      </div>
    </div>
  );
}









