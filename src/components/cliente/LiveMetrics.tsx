'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  DollarSign,
  Activity,
  Zap,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface MetricData {
  id: string;
  label: string;
  value: number;
  previousValue: number;
  format: 'number' | 'currency' | 'percentage';
  icon: React.ElementType;
  color: string;
  trend: 'up' | 'down' | 'stable';
}

interface LiveMetricsProps {
  clientId?: string;
  compact?: boolean;
}

// Simular dados em tempo real
const generateMetrics = (): MetricData[] => {
  const baseMetrics = [
    { id: 'followers', label: 'Seguidores', base: 15420, icon: Users, color: 'var(--primary-500)' },
    { id: 'reach', label: 'Alcance Hoje', base: 8540, icon: Eye, color: 'var(--success-500)' },
    { id: 'engagement', label: 'Engajamento', base: 4.2, icon: Heart, color: 'var(--error-500)' },
    { id: 'comments', label: 'Comentários', base: 156, icon: MessageCircle, color: 'var(--warning-500)' },
    { id: 'shares', label: 'Compartilhamentos', base: 89, icon: Share2, color: 'var(--purple-500)' },
    { id: 'revenue', label: 'Leads Hoje', base: 12, icon: DollarSign, color: 'var(--success-600)' }
  ];

  return baseMetrics.map(m => {
    const variance = Math.random() * 0.1 - 0.05; // -5% a +5%
    const value = Math.round(m.base * (1 + variance));
    const previousValue = Math.round(m.base * (1 + (Math.random() * 0.1 - 0.05)));
    const trend = value > previousValue ? 'up' : value < previousValue ? 'down' : 'stable';

    return {
      id: m.id,
      label: m.label,
      value,
      previousValue,
      format: m.id === 'engagement' ? 'percentage' : m.id === 'revenue' ? 'number' : 'number',
      icon: m.icon,
      color: m.color,
      trend
    };
  });
};

export default function LiveMetrics({ clientId, compact = false }: LiveMetricsProps) {
  const [metrics, setMetrics] = useState<MetricData[]>(generateMetrics());
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isLive, setIsLive] = useState(true);

  // Simular atualizações em tempo real
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setMetrics(generateMetrics());
      setLastUpdate(new Date());
    }, 5000); // Atualiza a cada 5 segundos

    return () => clearInterval(interval);
  }, [isLive]);

  const formatValue = (metric: MetricData) => {
    switch (metric.format) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metric.value);
      case 'percentage':
        return `${metric.value.toFixed(1)}%`;
      default:
        return metric.value.toLocaleString('pt-BR');
    }
  };

  const getChangePercentage = (metric: MetricData) => {
    if (metric.previousValue === 0) return 0;
    return ((metric.value - metric.previousValue) / metric.previousValue * 100).toFixed(1);
  };

  if (compact) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {metrics.slice(0, 3).map((metric, index) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={metric.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="p-3 rounded-xl text-center"
              style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-light)' }}
            >
              <Icon className="w-5 h-5 mx-auto mb-1" style={{ color: metric.color }} />
              <motion.p
                key={metric.value}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-lg font-bold"
                style={{ color: 'var(--text-primary)' }}
              >
                {formatValue(metric)}
              </motion.p>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {metric.label}
              </p>
            </motion.div>
          );
        })}
      </div>
    );
  }

  return (
    <div 
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-light)' }}
    >
      {/* Header */}
      <div 
        className="p-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--border-light)' }}
      >
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5" style={{ color: 'var(--primary-500)' }} />
          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
            Métricas em Tempo Real
          </span>
          {isLive && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: 'var(--success-100)', color: 'var(--success-700)' }}>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              AO VIVO
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Atualizado: {lastUpdate.toLocaleTimeString('pt-BR')}
          </span>
          <button
            onClick={() => setIsLive(!isLive)}
            className={`p-1.5 rounded-lg transition-colors ${isLive ? 'bg-green-100' : 'bg-gray-100'}`}
          >
            <Zap className="w-4 h-4" style={{ color: isLive ? 'var(--success-500)' : 'var(--text-tertiary)' }} />
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          const change = getChangePercentage(metric);
          const isPositive = metric.trend === 'up';
          
          return (
            <motion.div
              key={metric.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 rounded-xl"
              style={{ backgroundColor: 'var(--bg-secondary)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <div 
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${metric.color}20` }}
                >
                  <Icon className="w-5 h-5" style={{ color: metric.color }} />
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={metric.value}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full`}
                    style={{ 
                      backgroundColor: isPositive ? 'var(--success-100)' : metric.trend === 'down' ? 'var(--error-100)' : 'var(--bg-primary)',
                      color: isPositive ? 'var(--success-700)' : metric.trend === 'down' ? 'var(--error-700)' : 'var(--text-tertiary)'
                    }}
                  >
                    {isPositive ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : metric.trend === 'down' ? (
                      <ArrowDownRight className="w-3 h-3" />
                    ) : null}
                    {change}%
                  </motion.div>
                </AnimatePresence>
              </div>

              <AnimatePresence mode="wait">
                <motion.p
                  key={metric.value}
                  initial={{ scale: 1.1, color: metric.trend === 'up' ? '#22c55e' : metric.trend === 'down' ? '#ef4444' : undefined }}
                  animate={{ scale: 1, color: 'var(--text-primary)' }}
                  className="text-2xl font-bold"
                >
                  {formatValue(metric)}
                </motion.p>
              </AnimatePresence>
              
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                {metric.label}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Activity Pulse */}
      <div 
        className="p-4 flex items-center justify-center gap-4"
        style={{ borderTop: '1px solid var(--border-light)' }}
      >
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: 'var(--success-500)' }}
          />
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Monitorando atividade em tempo real
          </span>
        </div>
      </div>
    </div>
  );
}









