'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, TrendingUp, Percent, FileText, Users,
  ShoppingCart, Target, Award
} from 'lucide-react';

interface SalesKPI {
  id: string;
  label: string;
  value: string;
  subValue?: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
}

interface SalesKPICardsProps {
  kpis?: SalesKPI[];
}

const DEFAULT_KPIS: SalesKPI[] = [
  {
    id: '1',
    label: 'Total Vendido',
    value: 'R$ 171 Mi',
    icon: <DollarSign className="w-6 h-6" />,
    color: '#10B981',
    gradient: 'from-green-500 to-emerald-600'
  },
  {
    id: '2',
    label: 'Total Lucro',
    value: 'R$ 89 Mi',
    icon: <TrendingUp className="w-6 h-6" />,
    color: '#3B82F6',
    gradient: 'from-blue-500 to-indigo-600'
  },
  {
    id: '3',
    label: '% Margem',
    value: '52,01%',
    icon: <Percent className="w-6 h-6" />,
    color: '#8B5CF6',
    gradient: 'from-purple-500 to-violet-600'
  },
  {
    id: '4',
    label: 'Notas Emitidas',
    value: '23.189',
    icon: <FileText className="w-6 h-6" />,
    color: '#F59E0B',
    gradient: 'from-amber-500 to-amber-600'
  },
  {
    id: '5',
    label: 'Cobertura Clientes',
    value: '7.655',
    icon: <Users className="w-6 h-6" />,
    color: '#EC4899',
    gradient: 'from-pink-500 to-rose-600'
  }
];

export function SalesKPICards({ kpis = DEFAULT_KPIS }: SalesKPICardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {kpis.map((kpi, index) => (
        <motion.div
          key={kpi.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ y: -4, scale: 1.02 }}
          className={`relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br ${kpi.gradient}`}
        >
          {/* Background decoration */}
          <div className="absolute right-2 top-2 opacity-20 text-white">
            {React.cloneElement(kpi.icon as React.ReactElement<{ className?: string }>, { className: 'w-12 h-12' })}
          </div>

          {/* Icon */}
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3 text-white">
            {kpi.icon}
          </div>

          {/* Value */}
          <p className="text-2xl font-bold text-white mb-1">
            {kpi.value}
          </p>

          {/* Label */}
          <p className="text-sm text-white/80">
            {kpi.label}
          </p>

          {/* Sub Value */}
          {kpi.subValue && (
            <p className="text-xs text-white/60 mt-1">
              {kpi.subValue}
            </p>
          )}
        </motion.div>
      ))}
    </div>
  );
}

// Dark theme version
export function SalesKPICardsDark({ kpis = DEFAULT_KPIS }: SalesKPICardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
          {/* Icon with gradient background */}
          <div 
            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${kpi.gradient} flex items-center justify-center mb-3`}
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
        </motion.div>
      ))}
    </div>
  );
}

// Pipeline KPIs for Commercial
export function PipelineKPIs() {
  const kpis: SalesKPI[] = [
    {
      id: '1',
      label: 'Em Prospecção',
      value: '47',
      icon: <Target className="w-6 h-6" />,
      color: '#6B7280',
      gradient: 'from-gray-500 to-gray-600'
    },
    {
      id: '2',
      label: 'Em Qualificação',
      value: '23',
      icon: <Users className="w-6 h-6" />,
      color: '#3B82F6',
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      id: '3',
      label: 'Proposta Enviada',
      value: '18',
      icon: <FileText className="w-6 h-6" />,
      color: '#8B5CF6',
      gradient: 'from-purple-500 to-purple-600'
    },
    {
      id: '4',
      label: 'Em Negociação',
      value: '12',
      icon: <ShoppingCart className="w-6 h-6" />,
      color: '#F59E0B',
      gradient: 'from-amber-500 to-amber-600'
    },
    {
      id: '5',
      label: 'Fechados (Mês)',
      value: '8',
      icon: <Award className="w-6 h-6" />,
      color: '#10B981',
      gradient: 'from-green-500 to-green-600'
    }
  ];

  return <SalesKPICardsDark kpis={kpis} />;
}

