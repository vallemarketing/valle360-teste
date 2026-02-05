'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Crown, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface RankedUser {
  id: string;
  name: string;
  avatar: string;
  points: number;
  position: number;
  previousPosition?: number;
  area?: string;
  metric?: string;
}

interface PodiumDisplayProps {
  users: RankedUser[];
  metricLabel?: string;
  metricPrefix?: string;
}

export function PodiumDisplay({ 
  users, 
  metricLabel = 'pontos',
  metricPrefix = ''
}: PodiumDisplayProps) {
  // Pegar top 3
  const top3 = users.slice(0, 3);
  
  // Reordenar para visual do pódio: 2º, 1º, 3º
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);

  const getTrend = (user: RankedUser) => {
    if (!user.previousPosition) return null;
    if (user.previousPosition > user.position) return 'up';
    if (user.previousPosition < user.position) return 'down';
    return 'stable';
  };

  const getPodiumHeight = (position: number) => {
    switch (position) {
      case 1: return 'h-32';
      case 2: return 'h-24';
      case 3: return 'h-20';
      default: return 'h-16';
    }
  };

  const getPodiumColor = (position: number) => {
    switch (position) {
      case 1: return 'from-yellow-400 to-yellow-500';
      case 2: return 'from-gray-300 to-gray-400';
      case 3: return 'from-amber-400 to-amber-500';
      default: return 'from-gray-200 to-gray-300';
    }
  };

  const getBorderColor = (position: number) => {
    switch (position) {
      case 1: return '#FFD700';
      case 2: return '#C0C0C0';
      case 3: return '#CD7F32';
      default: return '#9CA3AF';
    }
  };

  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `${metricPrefix}${(value / 1000000).toFixed(1)}Mi`;
    }
    if (value >= 1000) {
      return `${metricPrefix}${(value / 1000).toFixed(1)}k`;
    }
    return `${metricPrefix}${value.toLocaleString('pt-BR')}`;
  };

  return (
    <div className="w-full">
      {/* Pódio */}
      <div className="flex justify-center items-end gap-4 mb-8 h-56">
        {podiumOrder.map((user, index) => {
          if (!user) return null;
          
          const trend = getTrend(user);
          const isFirst = user.position === 1;
          const displayOrder = user.position === 1 ? 'order-2' : user.position === 2 ? 'order-1' : 'order-3';

          return (
            <motion.div
              key={user.id}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.15, duration: 0.5 }}
              className={`flex flex-col items-center ${displayOrder}`}
            >
              {/* Avatar com Coroa */}
              <div className="relative mb-3">
                {isFirst && (
                  <motion.div
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.3 }}
                    className="absolute -top-8 left-1/2 transform -translate-x-1/2"
                  >
                    <Crown 
                      className="w-8 h-8 drop-shadow-lg" 
                      style={{ color: '#FFD700' }}
                      fill="#FFD700"
                    />
                  </motion.div>
                )}
                
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="relative"
                >
                  <img 
                    src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                    alt={user.name}
                    className="object-cover rounded-full shadow-lg"
                    style={{
                      width: isFirst ? '80px' : '64px',
                      height: isFirst ? '80px' : '64px',
                      border: `4px solid ${getBorderColor(user.position)}`
                    }}
                  />
                  
                  {/* Position Badge */}
                  <div 
                    className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-md"
                    style={{ backgroundColor: getBorderColor(user.position) }}
                  >
                    {user.position}
                  </div>
                </motion.div>

                {/* Trend Indicator */}
                {trend && (
                  <div className="absolute -right-1 top-0">
                    {trend === 'up' && (
                      <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                        <TrendingUp className="w-3 h-3 text-white" />
                      </div>
                    )}
                    {trend === 'down' && (
                      <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                        <TrendingDown className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Podium Bar */}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
                className={`w-24 ${getPodiumHeight(user.position)} rounded-t-xl bg-gradient-to-t ${getPodiumColor(user.position)} flex flex-col justify-start items-center pt-3 shadow-lg`}
              >
                <span 
                  className="font-bold text-sm truncate w-full text-center px-2"
                  style={{ color: user.position === 2 ? '#374151' : 'white' }}
                >
                  {user.name.split(' ')[0]}
                </span>
                <span 
                  className="text-xs font-semibold mt-1"
                  style={{ 
                    color: user.position === 2 ? '#4B5563' : 'rgba(255,255,255,0.9)'
                  }}
                >
                  {formatValue(user.points)}
                </span>
                {user.area && (
                  <span 
                    className="text-xs mt-1 opacity-75"
                    style={{ color: user.position === 2 ? '#6B7280' : 'rgba(255,255,255,0.7)' }}
                  >
                    {user.area}
                  </span>
                )}
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* Metric Label */}
      <div className="text-center">
        <span 
          className="text-sm font-medium px-4 py-1 rounded-full"
          style={{ 
            backgroundColor: 'var(--primary-100)',
            color: 'var(--primary-700)'
          }}
        >
          Ranking por {metricLabel}
        </span>
      </div>
    </div>
  );
}









