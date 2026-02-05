'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, AlertTriangle, TrendingUp, TrendingDown,
  Users, DollarSign, Target, Zap, ChevronRight,
  Bell, CheckCircle, Clock, Sparkles, BarChart3,
  PieChart, Activity, Shield, Lightbulb
} from 'lucide-react';

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  action?: string;
  actionUrl?: string;
  timestamp: Date;
}

interface Prediction {
  id: string;
  label: string;
  value: string;
  trend: number;
  confidence: number;
  icon: React.ReactNode;
}

interface ValSuggestion {
  id: string;
  text: string;
  priority: 'high' | 'medium' | 'low';
  action: string;
  actionLabel: string;
}

interface HealthMetric {
  id: string;
  label: string;
  value: number;
  color: string;
}

export function IntelligenceCenter() {
  const [alerts, setAlerts] = useState<Alert[]>(SAMPLE_ALERTS);
  const [predictions, setPredictions] = useState<Prediction[]>(SAMPLE_PREDICTIONS);
  const [suggestions, setSuggestions] = useState<ValSuggestion[]>(SAMPLE_SUGGESTIONS);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>(SAMPLE_HEALTH);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'alerts' | 'predictions' | 'actions'>('overview');

  const criticalAlerts = alerts.filter(a => a.type === 'critical').length;

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical': return '#EF4444';
      case 'warning': return '#F59E0B';
      case 'info': return '#3B82F6';
      case 'success': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="w-5 h-5" />;
      case 'warning': return <Bell className="w-5 h-5" />;
      case 'info': return <Activity className="w-5 h-5" />;
      case 'success': return <CheckCircle className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#0F172A' }}>
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
              <h1 className="text-2xl font-bold text-white">Centro de Inteligência</h1>
              <p className="text-gray-400">Visão 360° da sua empresa</p>
            </div>
          </div>

          {criticalAlerts > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl"
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
            >
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span className="text-red-400 font-medium">{criticalAlerts} alertas críticos</span>
            </motion.div>
          )}
        </div>

        {/* KPI Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPISummaryCard
            label="Faturamento"
            value="R$ 850k"
            trend={12}
            icon={<DollarSign className="w-6 h-6" />}
            color="#10B981"
          />
          <KPISummaryCard
            label="Clientes"
            value="127"
            trend={5}
            icon={<Users className="w-6 h-6" />}
            color="#3B82F6"
          />
          <KPISummaryCard
            label="Equipe"
            value="32"
            trend={2}
            icon={<Users className="w-6 h-6" />}
            color="#8B5CF6"
          />
          <KPISummaryCard
            label="Eficiência"
            value="94.2%"
            trend={3}
            icon={<Activity className="w-6 h-6" />}
            color="#F59E0B"
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Critical Alerts */}
          <div 
            className="lg:col-span-2 rounded-2xl p-6"
            style={{ 
              background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Alertas Críticos
              </h2>
              <span className="text-sm text-gray-400">{alerts.length} alertas</span>
            </div>

            <div className="space-y-3">
              {alerts.slice(0, 5).map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3 p-4 rounded-xl transition-colors hover:bg-white/5"
                  style={{ backgroundColor: `${getAlertColor(alert.type)}10` }}
                >
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${getAlertColor(alert.type)}20`, color: getAlertColor(alert.type) }}
                  >
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white">{alert.title}</p>
                    <p className="text-sm text-gray-400 line-clamp-1">{alert.description}</p>
                  </div>
                  {alert.action && (
                    <button 
                      className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                      style={{ 
                        backgroundColor: getAlertColor(alert.type),
                        color: 'white'
                      }}
                    >
                      {alert.action}
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Val Insights */}
          <div 
            className="rounded-2xl p-6"
            style={{ 
              background: 'linear-gradient(135deg, #4C1D95 0%, #1E1B4B 100%)',
              border: '1px solid rgba(139, 92, 246, 0.3)'
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-purple-300" />
              <h2 className="text-lg font-bold text-white">Insights da Val</h2>
            </div>

            <div className="space-y-4">
              {suggestions.map((suggestion, index) => (
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.15 }}
                  className="p-4 rounded-xl bg-white/10 backdrop-blur-sm"
                >
                  <p className="text-white text-sm mb-3">{suggestion.text}</p>
                  <button 
                    className="w-full py-2 rounded-lg bg-white text-purple-700 font-medium text-sm hover:bg-purple-50 transition-colors"
                  >
                    {suggestion.actionLabel}
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Predictions & Health */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Predictions */}
          <div 
            className="rounded-2xl p-6"
            style={{ 
              background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-bold text-white">Previsões</h2>
            </div>

            <div className="space-y-4">
              {predictions.map((prediction, index) => (
                <div key={prediction.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                      {prediction.icon}
                    </div>
                    <div>
                      <p className="text-white font-medium">{prediction.label}</p>
                      <p className="text-xs text-gray-400">Confiança: {prediction.confidence}%</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-white">{prediction.value}</p>
                    <p 
                      className="text-xs flex items-center justify-end gap-1"
                      style={{ color: prediction.trend >= 0 ? '#10B981' : '#EF4444' }}
                    >
                      {prediction.trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {Math.abs(prediction.trend)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Company Health */}
          <div 
            className="rounded-2xl p-6"
            style={{ 
              background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-green-400" />
              <h2 className="text-lg font-bold text-white">Saúde da Empresa</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {healthMetrics.map((metric) => (
                <div key={metric.id} className="text-center">
                  <div className="relative w-20 h-20 mx-auto mb-2">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="40"
                        cy="40"
                        r="35"
                        fill="none"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="6"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="35"
                        fill="none"
                        stroke={metric.color}
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={`${metric.value * 2.2} 220`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-white">{metric.value}%</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// KPI Summary Card Component
function KPISummaryCard({ label, value, trend, icon, color }: {
  label: string;
  value: string;
  trend: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="rounded-2xl p-5"
      style={{ 
        background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}
    >
      <div 
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
        style={{ backgroundColor: `${color}20`, color }}
      >
        {icon}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <div className="flex items-center justify-between mt-1">
        <p className="text-sm text-gray-400">{label}</p>
        <span 
          className="text-xs font-medium flex items-center gap-0.5"
          style={{ color: trend >= 0 ? '#10B981' : '#EF4444' }}
        >
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </span>
      </div>
    </motion.div>
  );
}

// Sample Data
const SAMPLE_ALERTS: Alert[] = [
  {
    id: '1',
    type: 'critical',
    title: 'Cliente "Tech Corp" com NPS 4',
    description: 'Risco de churn alto. Última interação há 15 dias.',
    action: 'Ligar',
    timestamp: new Date()
  },
  {
    id: '2',
    type: 'critical',
    title: 'Vendedor Pedro 40% abaixo da meta',
    description: 'Precisa fechar R$ 40k em 7 dias para bater meta.',
    action: 'Ver',
    timestamp: new Date()
  },
  {
    id: '3',
    type: 'warning',
    title: '5 tarefas críticas atrasadas',
    description: 'Projetos de 3 clientes diferentes com atraso.',
    action: 'Ver',
    timestamp: new Date()
  },
  {
    id: '4',
    type: 'info',
    title: 'Budget do cliente XYZ em 20%',
    description: 'Previsão de esgotamento em 5 dias.',
    action: 'Notificar',
    timestamp: new Date()
  }
];

const SAMPLE_PREDICTIONS: Prediction[] = [
  {
    id: '1',
    label: 'Faturamento Dezembro',
    value: 'R$ 920k',
    trend: 8,
    confidence: 85,
    icon: <DollarSign className="w-5 h-5" />
  },
  {
    id: '2',
    label: 'Churn Previsto',
    value: '3 clientes',
    trend: -2,
    confidence: 72,
    icon: <Users className="w-5 h-5" />
  },
  {
    id: '3',
    label: 'Contratações Necessárias',
    value: '2 pessoas',
    trend: 0,
    confidence: 90,
    icon: <Users className="w-5 h-5" />
  }
];

const SAMPLE_SUGGESTIONS: ValSuggestion[] = [
  {
    id: '1',
    text: 'Ligar para Tech Corp hoje - preparei um roteiro de retenção.',
    priority: 'high',
    action: 'call',
    actionLabel: 'Ver Roteiro'
  },
  {
    id: '2',
    text: 'Reunião com equipe comercial amanhã para revisar pipeline.',
    priority: 'medium',
    action: 'meeting',
    actionLabel: 'Agendar'
  },
  {
    id: '3',
    text: 'Demanda de design cresceu 30%. Considerar contratação.',
    priority: 'medium',
    action: 'hire',
    actionLabel: 'Ver Análise'
  }
];

const SAMPLE_HEALTH: HealthMetric[] = [
  { id: '1', label: 'Financeiro', value: 82, color: '#10B981' },
  { id: '2', label: 'Operacional', value: 94, color: '#3B82F6' },
  { id: '3', label: 'Comercial', value: 71, color: '#F59E0B' },
  { id: '4', label: 'RH', value: 85, color: '#8B5CF6' }
];

export default IntelligenceCenter;









