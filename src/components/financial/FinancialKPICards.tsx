'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, TrendingUp, TrendingDown, 
  Wallet, CreditCard, PiggyBank, Percent
} from 'lucide-react';

interface FinancialKPI {
  id: string;
  label: string;
  value: string;
  subLabel?: string;
  subValue?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color: string;
}

interface FinancialKPICardsProps {
  kpis?: FinancialKPI[];
}

const DEFAULT_KPIS: FinancialKPI[] = [
  {
    id: '1',
    label: 'Receita Operacional',
    value: 'R$ 9.681.527',
    subLabel: 'Melhor Mês: novembro',
    subValue: 'R$ 1.189.150',
    icon: <DollarSign className="w-8 h-8" />,
    trend: { value: 12, isPositive: true },
    color: '#10B981'
  },
  {
    id: '2',
    label: 'Margem de Contribuição',
    value: 'R$ 2.061.909',
    subLabel: 'Melhor Mês: novembro',
    subValue: 'R$ 255.943',
    icon: <TrendingUp className="w-8 h-8" />,
    trend: { value: 8, isPositive: true },
    color: '#3B82F6'
  },
  {
    id: '3',
    label: '% MC Geral',
    value: '21%',
    subLabel: 'Melhor Mês: janeiro',
    subValue: '22%',
    icon: <Percent className="w-8 h-8" />,
    trend: { value: 2, isPositive: false },
    color: '#F59E0B'
  }
];

export function FinancialKPICards({ kpis = DEFAULT_KPIS }: FinancialKPICardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {kpis.map((kpi, index) => (
        <motion.div
          key={kpi.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ y: -4 }}
          className="relative overflow-hidden rounded-2xl p-6"
          style={{
            background: `linear-gradient(135deg, ${kpi.color}20 0%, ${kpi.color}05 100%)`,
            border: `1px solid ${kpi.color}30`
          }}
        >
          {/* Background decoration */}
          <div 
            className="absolute right-4 top-4 opacity-10"
            style={{ color: kpi.color }}
          >
            {kpi.icon}
          </div>

          {/* Icon */}
          <div 
            className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
            style={{ 
              backgroundColor: `${kpi.color}20`,
              color: kpi.color
            }}
          >
            {kpi.icon}
          </div>

          {/* Label */}
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            {kpi.label}
          </p>

          {/* Value */}
          <p className="text-3xl font-bold mb-2" style={{ color: kpi.color }}>
            {kpi.value}
          </p>

          {/* Sub info */}
          {kpi.subLabel && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {kpi.subLabel}
                </p>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  {kpi.subValue}
                </p>
              </div>

              {kpi.trend && (
                <div 
                  className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: kpi.trend.isPositive ? '#10B98120' : '#EF444420',
                    color: kpi.trend.isPositive ? '#10B981' : '#EF4444'
                  }}
                >
                  {kpi.trend.isPositive ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {kpi.trend.value}%
                </div>
              )}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

// Versão Dark Theme
export function FinancialKPICardsDark({ kpis = DEFAULT_KPIS }: FinancialKPICardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {kpis.map((kpi, index) => (
        <motion.div
          key={kpi.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ y: -4 }}
          className="relative overflow-hidden rounded-2xl p-5"
          style={{
            background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          {/* Icon */}
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
            style={{ 
              background: `linear-gradient(135deg, ${kpi.color} 0%, ${kpi.color}80 100%)`
            }}
          >
            <div className="text-white">
              {kpi.icon}
            </div>
          </div>

          {/* Value */}
          <p className="text-2xl font-bold text-white mb-1">
            {kpi.value}
          </p>

          {/* Label */}
          <p className="text-sm text-gray-400">
            {kpi.label}
          </p>

          {/* Trend */}
          {kpi.trend && (
            <div 
              className="absolute top-4 right-4 flex items-center gap-1 text-xs font-medium"
              style={{ color: kpi.trend.isPositive ? '#10B981' : '#EF4444' }}
            >
              {kpi.trend.isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {kpi.trend.value}%
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

// KPIs específicos para Fluxo de Caixa
export function CashFlowKPIs() {
  const kpis: FinancialKPI[] = [
    {
      id: '1',
      label: 'Receita Operacional',
      value: 'R$ 9.681.527',
      icon: <DollarSign className="w-6 h-6" />,
      trend: { value: 12, isPositive: true },
      color: '#10B981'
    },
    {
      id: '2',
      label: 'Custo Variável',
      value: 'R$ 5.683.313',
      icon: <CreditCard className="w-6 h-6" />,
      trend: { value: 5, isPositive: false },
      color: '#F59E0B'
    },
    {
      id: '3',
      label: 'Despesas Fixas',
      value: 'R$ 1.849.758',
      icon: <Wallet className="w-6 h-6" />,
      trend: { value: 3, isPositive: false },
      color: '#EF4444'
    },
    {
      id: '4',
      label: 'Lucro Operacional',
      value: 'R$ 212.151',
      icon: <PiggyBank className="w-6 h-6" />,
      trend: { value: 8, isPositive: true },
      color: '#10B981'
    },
    {
      id: '5',
      label: '% Lucro',
      value: '2,19%',
      icon: <Percent className="w-6 h-6" />,
      trend: { value: 1, isPositive: true },
      color: '#3B82F6'
    }
  ];

  return <FinancialKPICardsDark kpis={kpis} />;
}









