'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface KPICardProps {
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  format?: 'number' | 'currency' | 'percentage';
  icon?: React.ReactNode;
  color?: string;
}

export function KPICard({
  label,
  value,
  change,
  trend = 'stable',
  format = 'number',
  icon,
  color = '#F97316',
}: KPICardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val;

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(val);
      case 'percentage':
        return `${val}%`;
      default:
        return val.toLocaleString('pt-BR');
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {label}
        </span>
        {icon && (
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${color}20` }}
          >
            <div style={{ color }}>{icon}</div>
          </div>
        )}
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {formatValue(value)}
          </p>
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-1 text-sm ${getTrendColor()}`}>
              {getTrendIcon()}
              <span>{Math.abs(change)}%</span>
              <span className="text-gray-500">vs mês anterior</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
