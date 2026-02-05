'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';

interface WaterfallData {
  name: string;
  value: number;
  type: 'positive' | 'negative' | 'total';
}

interface WaterfallChartProps {
  data?: WaterfallData[];
  title?: string;
  height?: number;
}

const DEFAULT_DATA: WaterfallData[] = [
  { name: 'Jan', value: 50000, type: 'positive' },
  { name: 'Fev', value: 20000, type: 'positive' },
  { name: 'Mar', value: 40000, type: 'positive' },
  { name: 'Abr', value: 95000, type: 'positive' },
  { name: 'Mai', value: 94000, type: 'positive' },
  { name: 'Jun', value: 94000, type: 'positive' },
  { name: 'Jul', value: 96000, type: 'positive' },
  { name: 'Ago', value: -50000, type: 'negative' },
  { name: 'Set', value: -50000, type: 'negative' },
  { name: 'Out', value: -50000, type: 'negative' },
  { name: 'Nov', value: -30000, type: 'negative' },
  { name: 'Dez', value: 210000, type: 'total' }
];

const formatCurrency = (value: number) => {
  if (Math.abs(value) >= 1000000) {
    return `R$${(value / 1000000).toFixed(2)}M`;
  }
  if (Math.abs(value) >= 1000) {
    return `R$${(value / 1000).toFixed(0)}k`;
  }
  return `R$${value}`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div 
        className="rounded-lg p-3 shadow-lg border"
        style={{ 
          backgroundColor: '#1E293B',
          borderColor: 'rgba(255,255,255,0.1)'
        }}
      >
        <p className="text-white font-medium">{label}</p>
        <p 
          className="text-lg font-bold"
          style={{ 
            color: data.type === 'negative' ? '#EF4444' : '#10B981'
          }}
        >
          {formatCurrency(data.value)}
        </p>
      </div>
    );
  }
  return null;
};

export function WaterfallChart({ 
  data = DEFAULT_DATA, 
  title = 'Lucro Operacional by Mês',
  height = 300 
}: WaterfallChartProps) {
  
  // Process data for waterfall effect
  const processedData = data.map((item, index) => {
    const start = index === 0 ? 0 : data.slice(0, index).reduce((sum, d) => sum + (d.type !== 'total' ? d.value : 0), 0);
    return {
      ...item,
      start,
      end: item.type === 'total' ? item.value : start + item.value
    };
  });

  const getBarColor = (type: string) => {
    switch (type) {
      case 'positive': return '#10B981';
      case 'negative': return '#EF4444';
      case 'total': return '#10B981';
      default: return '#6B7280';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-6"
      style={{
        background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#10B981' }} />
            <span className="text-gray-400">Increase</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#EF4444' }} />
            <span className="text-gray-400">Decrease</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#10B981' }} />
            <span className="text-gray-400">Total</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={processedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
          />
          <YAxis 
            tickFormatter={formatCurrency}
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {processedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.type)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Value labels */}
      <div className="flex justify-between mt-4 px-4 overflow-x-auto">
        {data.map((item, index) => (
          <div key={index} className="text-center min-w-[60px]">
            <span 
              className="text-xs font-medium"
              style={{ 
                color: item.type === 'negative' ? '#EF4444' : '#10B981'
              }}
            >
              {formatCurrency(item.value)}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}









