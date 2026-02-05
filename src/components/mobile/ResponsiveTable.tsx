'use client';

/**
 * Valle 360 - Responsive Table
 * Tabela que se transforma em cards no mobile
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useIsMobile';

// =====================================================
// TIPOS
// =====================================================

export interface Column<T> {
  id: string;
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  sortable?: boolean;
  mobileHidden?: boolean;
  mobileLabel?: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  renderMobileCard?: (row: T) => React.ReactNode;
  renderActions?: (row: T) => React.ReactNode;
  emptyMessage?: string;
  loading?: boolean;
  sortable?: boolean;
  initialSort?: { column: string; direction: 'asc' | 'desc' };
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function ResponsiveTable<T>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  renderMobileCard,
  renderActions,
  emptyMessage = 'Nenhum item encontrado',
  loading = false,
  sortable = true,
  initialSort
}: ResponsiveTableProps<T>) {
  const isMobile = useIsMobile();
  const [sortConfig, setSortConfig] = useState<{ column: string; direction: 'asc' | 'desc' } | null>(
    initialSort || null
  );
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Função para obter valor da célula
  const getCellValue = (row: T, column: Column<T>): React.ReactNode => {
    if (typeof column.accessor === 'function') {
      return column.accessor(row);
    }
    return row[column.accessor] as React.ReactNode;
  };

  // Ordenação
  const handleSort = (columnId: string) => {
    if (!sortable) return;
    
    setSortConfig(prev => ({
      column: columnId,
      direction: prev?.column === columnId && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Dados ordenados
  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig) return 0;
    
    const column = columns.find(c => c.id === sortConfig.column);
    if (!column) return 0;

    const aValue = getCellValue(a, column);
    const bValue = getCellValue(b, column);

    if (aValue === bValue) return 0;
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    const comparison = String(aValue).localeCompare(String(bValue));
    return sortConfig.direction === 'asc' ? comparison : -comparison;
  });

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-xl h-20 animate-pulse" />
        ))}
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-8 text-center">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  // Mobile: Cards
  if (isMobile) {
    return (
      <div className="space-y-3">
        {sortedData.map((row) => {
          const key = keyExtractor(row);
          const isExpanded = expandedRow === key;

          // Card personalizado
          if (renderMobileCard) {
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
                onClick={() => onRowClick?.(row)}
              >
                {renderMobileCard(row)}
              </motion.div>
            );
          }

          // Card automático
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* Header do Card */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer"
                onClick={() => {
                  if (onRowClick) {
                    onRowClick(row);
                  } else {
                    setExpandedRow(isExpanded ? null : key);
                  }
                }}
              >
                <div className="flex-1">
                  {/* Primeira coluna como título */}
                  <p className="font-medium text-gray-900 dark:text-white">
                    {getCellValue(row, columns[0])}
                  </p>
                  {/* Segunda coluna como subtítulo */}
                  {columns[1] && (
                    <p className="text-sm text-gray-500 mt-0.5">
                      {getCellValue(row, columns[1])}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {renderActions && renderActions(row)}
                  {!onRowClick && (
                    <button className="p-1">
                      <ChevronDown
                        className={cn(
                          "w-5 h-5 text-gray-400 transition-transform",
                          isExpanded && "rotate-180"
                        )}
                      />
                    </button>
                  )}
                </div>
              </div>

              {/* Conteúdo Expandido */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden border-t border-gray-100 dark:border-gray-700"
                  >
                    <div className="p-4 space-y-3 bg-gray-50 dark:bg-gray-900/50">
                      {columns.slice(2).filter(c => !c.mobileHidden).map((column) => (
                        <div key={column.id} className="flex justify-between text-sm">
                          <span className="text-gray-500">{column.mobileLabel || column.header}</span>
                          <span className="text-gray-900 dark:text-white font-medium">
                            {getCellValue(row, column)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    );
  }

  // Desktop: Tabela tradicional
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800/50">
            {columns.map((column) => (
              <th
                key={column.id}
                className={cn(
                  "px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider",
                  column.align === 'center' && "text-center",
                  column.align === 'right' && "text-right",
                  column.sortable !== false && sortable && "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
                style={{ width: column.width }}
                onClick={() => column.sortable !== false && handleSort(column.id)}
              >
                <div className={cn(
                  "flex items-center gap-1",
                  column.align === 'center' && "justify-center",
                  column.align === 'right' && "justify-end"
                )}>
                  {column.header}
                  {sortConfig?.column === column.id && (
                    sortConfig.direction === 'asc'
                      ? <ChevronUp className="w-4 h-4" />
                      : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </th>
            ))}
            {renderActions && (
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-[60px]">
                Ações
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {sortedData.map((row) => (
            <tr
              key={keyExtractor(row)}
              className={cn(
                "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors",
                onRowClick && "cursor-pointer"
              )}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column) => (
                <td
                  key={column.id}
                  className={cn(
                    "px-4 py-3 text-sm text-gray-900 dark:text-white",
                    column.align === 'center' && "text-center",
                    column.align === 'right' && "text-right"
                  )}
                >
                  {getCellValue(row, column)}
                </td>
              ))}
              {renderActions && (
                <td className="px-4 py-3 text-right">
                  {renderActions(row)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ResponsiveTable;

