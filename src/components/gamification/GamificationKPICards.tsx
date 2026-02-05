'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, ShoppingCart, Target, Users, 
  TrendingUp, Award, Zap, BarChart3 
} from 'lucide-react';

interface KPICard {
  id: string;
  label: string;
  value: string | number;
  subValue?: string;
  icon: React.ReactNode;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

interface GamificationKPICardsProps {
  cards: KPICard[];
}

const DEFAULT_CARDS: KPICard[] = [
  {
    id: '1',
    label: 'Faturamento Top #3',
    value: 'R$ 5.408.914',
    subValue: '53% do total',
    icon: <DollarSign className="w-6 h-6" />,
    color: '#10B981',
    trend: { value: 12, isPositive: true }
  },
  {
    id: '2',
    label: 'Qtd Vendas Top #3',
    value: '14.414',
    subValue: '45% do total',
    icon: <ShoppingCart className="w-6 h-6" />,
    color: '#3B82F6',
    trend: { value: 8, isPositive: true }
  },
  {
    id: '3',
    label: 'Positivação Top #3',
    value: '667',
    subValue: '89% do total',
    icon: <Target className="w-6 h-6" />,
    color: '#F59E0B',
    trend: { value: 5, isPositive: true }
  }
];

export function GamificationKPICards({ cards = DEFAULT_CARDS }: GamificationKPICardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(0,0,0,0.15)' }}
          className="relative overflow-hidden rounded-2xl p-6 shadow-lg"
          style={{ 
            background: `linear-gradient(135deg, ${card.color}15 0%, ${card.color}05 100%)`,
            border: `1px solid ${card.color}30`
          }}
        >
          {/* Background Icon */}
          <div 
            className="absolute -right-4 -top-4 opacity-10"
            style={{ color: card.color }}
          >
            <div className="w-24 h-24">
              {card.icon}
            </div>
          </div>

          {/* Content */}
          <div className="relative z-10">
            {/* Icon */}
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
              style={{ 
                backgroundColor: `${card.color}20`,
                color: card.color
              }}
            >
              {card.icon}
            </div>

            {/* Label */}
            <p 
              className="text-sm font-medium mb-1"
              style={{ color: 'var(--text-secondary)' }}
            >
              {card.label}
            </p>

            {/* Value */}
            <p 
              className="text-2xl font-bold mb-1"
              style={{ color: card.color }}
            >
              {card.value}
            </p>

            {/* Sub Value & Trend */}
            <div className="flex items-center justify-between">
              {card.subValue && (
                <p 
                  className="text-xs"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {card.subValue}
                </p>
              )}

              {card.trend && (
                <div 
                  className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ 
                    backgroundColor: card.trend.isPositive ? '#10B98120' : '#EF444420',
                    color: card.trend.isPositive ? '#10B981' : '#EF4444'
                  }}
                >
                  <TrendingUp 
                    className={`w-3 h-3 ${!card.trend.isPositive ? 'rotate-180' : ''}`} 
                  />
                  {card.trend.value}%
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Versão específica para Comercial
export function CommercialKPICards() {
  const cards: KPICard[] = [
    {
      id: '1',
      label: 'Faturamento Top #3',
      value: 'R$ 5.408.914',
      subValue: '53% do total',
      icon: <DollarSign className="w-6 h-6" />,
      color: '#10B981',
      trend: { value: 12, isPositive: true }
    },
    {
      id: '2',
      label: 'Vendas Top #3',
      value: '14.414',
      subValue: '45% do total',
      icon: <ShoppingCart className="w-6 h-6" />,
      color: '#3B82F6',
      trend: { value: 8, isPositive: true }
    },
    {
      id: '3',
      label: 'Clientes Novos',
      value: '667',
      subValue: 'Este mês',
      icon: <Users className="w-6 h-6" />,
      color: '#F59E0B',
      trend: { value: 15, isPositive: true }
    }
  ];

  return <GamificationKPICards cards={cards} />;
}

// Versão específica para Tráfego
export function TrafficKPICards() {
  const cards: KPICard[] = [
    {
      id: '1',
      label: 'ROAS Médio',
      value: '4.2x',
      subValue: 'Últimos 30 dias',
      icon: <TrendingUp className="w-6 h-6" />,
      color: '#10B981',
      trend: { value: 18, isPositive: true }
    },
    {
      id: '2',
      label: 'Leads Gerados',
      value: '2.847',
      subValue: 'Este mês',
      icon: <Target className="w-6 h-6" />,
      color: '#3B82F6',
      trend: { value: 22, isPositive: true }
    },
    {
      id: '3',
      label: 'Budget Gerenciado',
      value: 'R$ 450k',
      subValue: 'Total ativo',
      icon: <DollarSign className="w-6 h-6" />,
      color: '#8B5CF6',
      trend: { value: 5, isPositive: true }
    }
  ];

  return <GamificationKPICards cards={cards} />;
}

// Versão específica para Design
export function DesignKPICards() {
  const cards: KPICard[] = [
    {
      id: '1',
      label: 'Projetos Entregues',
      value: '127',
      subValue: 'Este mês',
      icon: <Award className="w-6 h-6" />,
      color: '#EC4899',
      trend: { value: 8, isPositive: true }
    },
    {
      id: '2',
      label: 'Aprovação 1ª',
      value: '78%',
      subValue: 'Taxa de aprovação',
      icon: <Zap className="w-6 h-6" />,
      color: '#10B981',
      trend: { value: 12, isPositive: true }
    },
    {
      id: '3',
      label: 'Tempo Médio',
      value: '2.4 dias',
      subValue: 'Por projeto',
      icon: <BarChart3 className="w-6 h-6" />,
      color: '#3B82F6',
      trend: { value: 15, isPositive: true }
    }
  ];

  return <GamificationKPICards cards={cards} />;
}









