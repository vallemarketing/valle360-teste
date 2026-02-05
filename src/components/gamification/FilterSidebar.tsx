'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, BarChart3, Filter, X } from 'lucide-react';

interface FilterOption {
  id: string;
  label: string;
  value: string;
}

interface FilterSidebarProps {
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
  selectedArea: string;
  onAreaChange: (area: string) => void;
  selectedMetric: string;
  onMetricChange: (metric: string) => void;
  onClearFilters: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const PERIODS: FilterOption[] = [
  { id: 'today', label: 'Hoje', value: 'today' },
  { id: 'week', label: 'Esta Semana', value: 'week' },
  { id: 'month', label: 'Este Mês', value: 'month' },
  { id: 'quarter', label: 'Trimestre', value: 'quarter' },
  { id: 'year', label: 'Este Ano', value: 'year' }
];

const AREAS: FilterOption[] = [
  { id: 'all', label: 'Todas as Áreas', value: 'all' },
  { id: 'comercial', label: 'Comercial', value: 'comercial' },
  { id: 'trafego', label: 'Tráfego Pago', value: 'trafego' },
  { id: 'social', label: 'Social Media', value: 'social_media' },
  { id: 'design', label: 'Design', value: 'designer' },
  { id: 'web', label: 'Web Design', value: 'web_designer' },
  { id: 'video', label: 'Video Maker', value: 'video_maker' }
];

const METRICS: FilterOption[] = [
  { id: 'points', label: 'Pontos Totais', value: 'points' },
  { id: 'tasks', label: 'Tarefas Concluídas', value: 'tasks' },
  { id: 'quality', label: 'Qualidade', value: 'quality' },
  { id: 'productivity', label: 'Produtividade', value: 'productivity' },
  { id: 'revenue', label: 'Faturamento', value: 'revenue' }
];

export function FilterSidebar({
  selectedPeriod,
  onPeriodChange,
  selectedArea,
  onAreaChange,
  selectedMetric,
  onMetricChange,
  onClearFilters,
  isOpen = true,
  onClose
}: FilterSidebarProps) {
  const hasActiveFilters = selectedPeriod !== 'month' || selectedArea !== 'all' || selectedMetric !== 'points';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`
        ${isOpen ? 'block' : 'hidden lg:block'}
        w-full lg:w-64 rounded-xl border p-4 space-y-6
      `}
      style={{ 
        backgroundColor: 'var(--bg-primary)',
        borderColor: 'var(--border-light)'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" style={{ color: 'var(--primary-500)' }} />
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            Filtros
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="text-xs font-medium transition-colors hover:underline"
              style={{ color: 'var(--error-500)' }}
            >
              Limpar
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="lg:hidden">
              <X className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
            </button>
          )}
        </div>
      </div>

      {/* Period Filter */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
          <Calendar className="w-4 h-4" />
          Período
        </label>
        <div className="space-y-1">
          {PERIODS.map((period) => (
            <button
              key={period.id}
              onClick={() => onPeriodChange(period.value)}
              className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
              style={{
                backgroundColor: selectedPeriod === period.value ? 'var(--primary-100)' : 'transparent',
                color: selectedPeriod === period.value ? 'var(--primary-700)' : 'var(--text-secondary)'
              }}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Area Filter */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
          <Users className="w-4 h-4" />
          Área
        </label>
        <div className="space-y-1">
          {AREAS.map((area) => (
            <button
              key={area.id}
              onClick={() => onAreaChange(area.value)}
              className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
              style={{
                backgroundColor: selectedArea === area.value ? 'var(--primary-100)' : 'transparent',
                color: selectedArea === area.value ? 'var(--primary-700)' : 'var(--text-secondary)'
              }}
            >
              {area.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Filter */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
          <BarChart3 className="w-4 h-4" />
          Métrica
        </label>
        <div className="space-y-1">
          {METRICS.map((metric) => (
            <button
              key={metric.id}
              onClick={() => onMetricChange(metric.value)}
              className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
              style={{
                backgroundColor: selectedMetric === metric.value ? 'var(--primary-100)' : 'transparent',
                color: selectedMetric === metric.value ? 'var(--primary-700)' : 'var(--text-secondary)'
              }}
            >
              {metric.label}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Versão compacta para mobile
export function FilterBar({
  selectedPeriod,
  onPeriodChange,
  selectedArea,
  onAreaChange,
  onOpenFullFilters
}: {
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
  selectedArea: string;
  onAreaChange: (area: string) => void;
  onOpenFullFilters: () => void;
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:hidden">
      {/* Period Dropdown */}
      <select
        value={selectedPeriod}
        onChange={(e) => onPeriodChange(e.target.value)}
        className="px-3 py-2 rounded-lg text-sm border"
        style={{
          backgroundColor: 'var(--bg-primary)',
          borderColor: 'var(--border-light)',
          color: 'var(--text-primary)'
        }}
      >
        {PERIODS.map((period) => (
          <option key={period.id} value={period.value}>
            {period.label}
          </option>
        ))}
      </select>

      {/* Area Dropdown */}
      <select
        value={selectedArea}
        onChange={(e) => onAreaChange(e.target.value)}
        className="px-3 py-2 rounded-lg text-sm border"
        style={{
          backgroundColor: 'var(--bg-primary)',
          borderColor: 'var(--border-light)',
          color: 'var(--text-primary)'
        }}
      >
        {AREAS.map((area) => (
          <option key={area.id} value={area.value}>
            {area.label}
          </option>
        ))}
      </select>

      {/* More Filters Button */}
      <button
        onClick={onOpenFullFilters}
        className="px-3 py-2 rounded-lg text-sm border flex items-center gap-1"
        style={{
          backgroundColor: 'var(--bg-primary)',
          borderColor: 'var(--border-light)',
          color: 'var(--text-secondary)'
        }}
      >
        <Filter className="w-4 h-4" />
        Mais
      </button>
    </div>
  );
}









