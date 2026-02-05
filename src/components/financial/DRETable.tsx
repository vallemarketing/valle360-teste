'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface DRERow {
  id: string;
  label: string;
  isHeader?: boolean;
  isTotal?: boolean;
  isHighlight?: boolean;
  values: {
    month: string;
    fluxoCaixa: number;
    av?: number; // Análise Vertical (%)
    ah?: number; // Análise Horizontal (%)
  }[];
}

interface DRETableProps {
  data?: DRERow[];
  months?: string[];
}

const DEFAULT_MONTHS = ['janeiro', 'fevereiro', 'março', 'abril'];

const DEFAULT_DATA: DRERow[] = [
  {
    id: '1',
    label: 'RECEITA OPERACIONAL',
    isHeader: true,
    values: [
      { month: 'janeiro', fluxoCaixa: 236569, av: 100, ah: 0 },
      { month: 'fevereiro', fluxoCaixa: 555492, av: 100, ah: 0 },
      { month: 'março', fluxoCaixa: 641542, av: 100, ah: 15.5 },
      { month: 'abril', fluxoCaixa: 784661, av: 100, ah: 22.3 }
    ]
  },
  {
    id: '2',
    label: '(-) Deduções sobre Vendas',
    values: [
      { month: 'janeiro', fluxoCaixa: -51314, av: -20, ah: 0 },
      { month: 'fevereiro', fluxoCaixa: -111098, av: -20, ah: 0 },
      { month: 'março', fluxoCaixa: -128308, av: -20, ah: 15.5 },
      { month: 'abril', fluxoCaixa: -156932, av: -20, ah: 22.3 }
    ]
  },
  {
    id: '3',
    label: 'RECEITA LÍQUIDA',
    isHighlight: true,
    values: [
      { month: 'janeiro', fluxoCaixa: 205255, av: 80, ah: 0 },
      { month: 'fevereiro', fluxoCaixa: 444393, av: 80, ah: 0 },
      { month: 'março', fluxoCaixa: 519253, av: 80, ah: 15.5 },
      { month: 'abril', fluxoCaixa: 627729, av: 80, ah: 20.9 }
    ]
  },
  {
    id: '4',
    label: '(-) Custos Variáveis',
    values: [
      { month: 'janeiro', fluxoCaixa: -148588, av: -57.9, ah: 0 },
      { month: 'fevereiro', fluxoCaixa: -329830, av: -59, ah: 0 },
      { month: 'março', fluxoCaixa: -375508, av: -58.6, ah: 14.3 },
      { month: 'abril', fluxoCaixa: -476284, av: -60.7, ah: 26.8 }
    ]
  },
  {
    id: '5',
    label: 'MARGEM DE CONTRIBUIÇÃO',
    isHighlight: true,
    values: [
      { month: 'janeiro', fluxoCaixa: 56667, av: 22.1, ah: 0 },
      { month: 'fevereiro', fluxoCaixa: 115563, av: 20.8, ah: 0 },
      { month: 'março', fluxoCaixa: 137391, av: 21.4, ah: 18.8 },
      { month: 'abril', fluxoCaixa: 145878, av: 18.6, ah: 6.2 }
    ]
  },
  {
    id: '6',
    label: '(-) Despesas Fixas',
    values: [
      { month: 'janeiro', fluxoCaixa: -70380, av: 27.4, ah: 0 },
      { month: 'fevereiro', fluxoCaixa: -111287, av: 20, ah: 0 },
      { month: 'março', fluxoCaixa: -112778, av: 17.6, ah: 1.3 },
      { month: 'abril', fluxoCaixa: -107949, av: 13.7, ah: -4.3 }
    ]
  },
  {
    id: '7',
    label: 'LUCRO OPERACIONAL',
    isTotal: true,
    values: [
      { month: 'janeiro', fluxoCaixa: -13721, av: -5.3, ah: 0 },
      { month: 'fevereiro', fluxoCaixa: -34276, av: -6.2, ah: 0 },
      { month: 'março', fluxoCaixa: -24925, av: -3.8, ah: 4.5 },
      { month: 'abril', fluxoCaixa: 38099, av: 4.8, ah: 77.8 }
    ]
  }
];

const formatCurrency = (value: number) => {
  const absValue = Math.abs(value);
  if (absValue >= 1000000) {
    return `R$${(value / 1000000).toFixed(2).replace('.', ',')}M`;
  }
  if (absValue >= 1000) {
    return `R$${(value / 1000).toFixed(1).replace('.', ',')}k`;
  }
  return `R$${value.toLocaleString('pt-BR')}`;
};

const formatPercent = (value: number | undefined) => {
  if (value === undefined) return '-';
  return `${value.toFixed(1).replace('.', ',')}%`;
};

export function DRETable({ data = DEFAULT_DATA, months = DEFAULT_MONTHS }: DRETableProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}
    >
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Header */}
          <thead>
            <tr style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
              <th className="text-left p-4 text-gray-400 font-medium text-sm min-w-[200px]">
                Mês
              </th>
              {months.map((month) => (
                <th key={month} className="p-4 text-center" colSpan={3}>
                  <span className="text-white font-semibold capitalize">{month}</span>
                </th>
              ))}
            </tr>
            <tr style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
              <th className="text-left p-2 text-gray-500 text-xs"></th>
              {months.map((month) => (
                <React.Fragment key={month}>
                  <th className="p-2 text-center text-gray-500 text-xs">Fluxo Caixa</th>
                  <th className="p-2 text-center text-gray-500 text-xs">AV</th>
                  <th className="p-2 text-center text-gray-500 text-xs">AH</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {data.map((row, rowIndex) => (
              <motion.tr
                key={row.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: rowIndex * 0.05 }}
                className="border-t transition-colors hover:bg-white/5"
                style={{ 
                  borderColor: 'rgba(255,255,255,0.05)',
                  backgroundColor: row.isTotal 
                    ? 'rgba(16, 185, 129, 0.1)' 
                    : row.isHighlight 
                      ? 'rgba(59, 130, 246, 0.05)' 
                      : 'transparent'
                }}
              >
                {/* Label */}
                <td 
                  className={`p-4 ${row.isHeader || row.isTotal ? 'font-bold' : ''}`}
                  style={{ 
                    color: row.isTotal ? '#10B981' : row.isHeader ? 'white' : '#9CA3AF'
                  }}
                >
                  {row.label}
                </td>

                {/* Values for each month */}
                {row.values.map((value, valueIndex) => (
                  <React.Fragment key={valueIndex}>
                    {/* Fluxo Caixa */}
                    <td 
                      className="p-2 text-center font-medium"
                      style={{ 
                        color: value.fluxoCaixa >= 0 ? '#10B981' : '#EF4444'
                      }}
                    >
                      {formatCurrency(value.fluxoCaixa)}
                    </td>
                    {/* AV */}
                    <td className="p-2 text-center text-gray-400 text-sm">
                      {formatPercent(value.av)}
                    </td>
                    {/* AH */}
                    <td className="p-2 text-center">
                      {value.ah !== undefined && (
                        <span 
                          className="inline-flex items-center gap-1 text-sm"
                          style={{ color: value.ah >= 0 ? '#10B981' : '#EF4444' }}
                        >
                          {value.ah >= 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {formatPercent(Math.abs(value.ah))}
                        </span>
                      )}
                    </td>
                  </React.Fragment>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}









