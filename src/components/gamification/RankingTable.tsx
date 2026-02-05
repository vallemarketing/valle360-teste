'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';

interface RankedUser {
  id: string;
  name: string;
  avatar: string;
  points: number;
  position: number;
  previousPosition?: number;
  area?: string;
  department?: string;
}

interface RankingTableProps {
  users: RankedUser[];
  startPosition?: number;
  metricLabel?: string;
  metricPrefix?: string;
  onUserClick?: (user: RankedUser) => void;
  showArea?: boolean;
}

export function RankingTable({ 
  users, 
  startPosition = 4,
  metricLabel = 'Pontos',
  metricPrefix = '',
  onUserClick,
  showArea = true
}: RankingTableProps) {
  
  const getTrend = (user: RankedUser) => {
    if (!user.previousPosition) return null;
    const diff = user.previousPosition - user.position;
    if (diff > 0) return { direction: 'up', value: diff };
    if (diff < 0) return { direction: 'down', value: Math.abs(diff) };
    return { direction: 'stable', value: 0 };
  };

  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `${metricPrefix}${(value / 1000000).toFixed(2).replace('.', ',')} Mi`;
    }
    if (value >= 1000) {
      return `${metricPrefix}${(value / 1000).toFixed(1).replace('.', ',')}k`;
    }
    return `${metricPrefix}${value.toLocaleString('pt-BR')}`;
  };

  // Filtrar usuários a partir da posição inicial (geralmente 4+)
  const filteredUsers = users.filter(u => u.position >= startPosition);

  return (
    <div 
      className="rounded-xl overflow-hidden border"
      style={{ 
        backgroundColor: 'var(--bg-primary)',
        borderColor: 'var(--border-light)'
      }}
    >
      {/* Header */}
      <div 
        className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-semibold uppercase tracking-wider"
        style={{ 
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-tertiary)'
        }}
      >
        <div className="col-span-1">Rank</div>
        <div className="col-span-1">Foto</div>
        <div className={showArea ? 'col-span-4' : 'col-span-6'}>Colaborador</div>
        {showArea && <div className="col-span-2">Área</div>}
        <div className="col-span-3 text-right">{metricLabel}</div>
        <div className="col-span-1"></div>
      </div>

      {/* Rows */}
      <div className="divide-y" style={{ borderColor: 'var(--border-light)' }}>
        {filteredUsers.map((user, index) => {
          const trend = getTrend(user);
          
          return (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ backgroundColor: 'var(--bg-secondary)' }}
              onClick={() => onUserClick?.(user)}
              className="grid grid-cols-12 gap-4 px-4 py-3 items-center cursor-pointer transition-colors"
            >
              {/* Position */}
              <div className="col-span-1">
                <span 
                  className="text-sm font-bold"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {user.position}
                </span>
              </div>

              {/* Avatar */}
              <div className="col-span-1">
                <img 
                  src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover border-2"
                  style={{ borderColor: 'var(--border-light)' }}
                />
              </div>

              {/* Name */}
              <div className={showArea ? 'col-span-4' : 'col-span-6'}>
                <p 
                  className="font-medium text-sm truncate"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {user.name}
                </p>
                {user.department && (
                  <p 
                    className="text-xs truncate"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {user.department}
                  </p>
                )}
              </div>

              {/* Area */}
              {showArea && (
                <div className="col-span-2">
                  <span 
                    className="text-xs px-2 py-1 rounded-full"
                    style={{ 
                      backgroundColor: 'var(--primary-100)',
                      color: 'var(--primary-700)'
                    }}
                  >
                    {user.area || 'Geral'}
                  </span>
                </div>
              )}

              {/* Points */}
              <div className="col-span-3 text-right">
                <span 
                  className="font-bold text-sm"
                  style={{ color: 'var(--primary-500)' }}
                >
                  {formatValue(user.points)}
                </span>
              </div>

              {/* Trend */}
              <div className="col-span-1 flex justify-end">
                {trend && (
                  <div className="flex items-center gap-1">
                    {trend.direction === 'up' && (
                      <div 
                        className="flex items-center gap-0.5 text-xs font-medium"
                        style={{ color: 'var(--success-500)' }}
                      >
                        <TrendingUp className="w-3 h-3" />
                        {trend.value > 0 && <span>{trend.value}</span>}
                      </div>
                    )}
                    {trend.direction === 'down' && (
                      <div 
                        className="flex items-center gap-0.5 text-xs font-medium"
                        style={{ color: 'var(--error-500)' }}
                      >
                        <TrendingDown className="w-3 h-3" />
                        {trend.value > 0 && <span>{trend.value}</span>}
                      </div>
                    )}
                    {trend.direction === 'stable' && (
                      <Minus 
                        className="w-3 h-3" 
                        style={{ color: 'var(--text-tertiary)' }}
                      />
                    )}
                  </div>
                )}
                <ChevronRight 
                  className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: 'var(--text-tertiary)' }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredUsers.length === 0 && (
        <div className="p-8 text-center">
          <p style={{ color: 'var(--text-tertiary)' }}>
            Nenhum colaborador encontrado
          </p>
        </div>
      )}
    </div>
  );
}









