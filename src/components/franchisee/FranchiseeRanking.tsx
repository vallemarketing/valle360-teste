'use client';

/**
 * Valle 360 - Franchisee Ranking Component
 * Ranking de performance das franquias
 */

import { motion } from 'framer-motion';
import {
  Trophy,
  Medal,
  TrendingUp,
  TrendingDown,
  Minus,
  Crown,
  Star,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RankedFranchisee {
  id: string;
  unit_name: string;
  city?: string;
  state?: string;
  ranking_position: number;
  previous_position?: number;
  total_score: number;
  performance_score?: number;
  nps_score?: number;
  engagement_rate?: number;
}

interface FranchiseeRankingProps {
  franchisees: RankedFranchisee[];
  onFranchiseeClick?: (franchisee: RankedFranchisee) => void;
  showDetails?: boolean;
  maxItems?: number;
}

export function FranchiseeRanking({
  franchisees,
  onFranchiseeClick,
  showDetails = true,
  maxItems = 10
}: FranchiseeRankingProps) {
  const displayedFranchisees = franchisees.slice(0, maxItems);

  const getPositionChange = (current: number, previous?: number) => {
    if (!previous) return { direction: 'stable', change: 0 };
    const change = previous - current;
    if (change > 0) return { direction: 'up', change };
    if (change < 0) return { direction: 'down', change: Math.abs(change) };
    return { direction: 'stable', change: 0 };
  };

  const getMedalColor = (position: number) => {
    switch (position) {
      case 1: return 'from-yellow-400 to-amber-500';
      case 2: return 'from-gray-300 to-gray-400';
      case 3: return 'from-[#1672d6] to-[#001533]';
      default: return 'from-gray-200 to-gray-300';
    }
  };

  const getMedalIcon = (position: number) => {
    switch (position) {
      case 1: return <Crown className="w-4 h-4 text-yellow-600" />;
      case 2: return <Medal className="w-4 h-4 text-gray-500" />;
      case 3: return <Medal className="w-4 h-4 text-primary" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Pódio Top 3 */}
      {displayedFranchisees.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* 2º Lugar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => onFranchiseeClick?.(displayedFranchisees[1])}
            className="cursor-pointer"
          >
            <div className="bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-2xl p-4 pt-8 relative h-48 flex flex-col justify-end">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center shadow-lg">
                <Medal className="w-6 h-6 text-white" />
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-400">2º</p>
                <p className="font-bold text-gray-800 dark:text-white mt-2 truncate">
                  {displayedFranchisees[1].unit_name}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {displayedFranchisees[1].city}
                </p>
                <p className="text-xl font-bold text-gray-600 mt-2">
                  {displayedFranchisees[1].total_score} pts
                </p>
              </div>
            </div>
          </motion.div>

          {/* 1º Lugar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => onFranchiseeClick?.(displayedFranchisees[0])}
            className="cursor-pointer -mt-4"
          >
            <div className="bg-gradient-to-b from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-800/30 rounded-2xl p-4 pt-10 relative h-56 flex flex-col justify-end border-2 border-yellow-400">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-600">1º</p>
                <p className="font-bold text-gray-800 dark:text-white mt-2 text-lg truncate">
                  {displayedFranchisees[0].unit_name}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {displayedFranchisees[0].city}
                </p>
                <p className="text-2xl font-bold text-yellow-600 mt-2">
                  {displayedFranchisees[0].total_score} pts
                </p>
              </div>
            </div>
          </motion.div>

          {/* 3º Lugar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => onFranchiseeClick?.(displayedFranchisees[2])}
            className="cursor-pointer"
          >
            <div className="bg-gradient-to-b from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 rounded-2xl p-4 pt-8 relative h-44 flex flex-col justify-end">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-gradient-to-br from-[#1672d6] to-[#001533] flex items-center justify-center shadow-lg">
                <Medal className="w-6 h-6 text-white" />
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">3º</p>
                <p className="font-bold text-gray-800 dark:text-white mt-2 truncate">
                  {displayedFranchisees[2].unit_name}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {displayedFranchisees[2].city}
                </p>
                <p className="text-xl font-bold text-primary mt-2">
                  {displayedFranchisees[2].total_score} pts
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Lista do restante */}
      <div className="space-y-2">
        {displayedFranchisees.slice(3).map((franchisee, index) => {
          const positionChange = getPositionChange(
            franchisee.ranking_position,
            franchisee.previous_position
          );

          return (
            <motion.div
              key={franchisee.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onFranchiseeClick?.(franchisee)}
              className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-all"
            >
              {/* Posição */}
              <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-xl font-bold text-gray-600 dark:text-gray-400">
                  {franchisee.ranking_position}º
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-800 dark:text-white truncate">
                  {franchisee.unit_name}
                </h4>
                <p className="text-sm text-gray-500 truncate">
                  {franchisee.city}, {franchisee.state}
                </p>
              </div>

              {/* Métricas (se showDetails) */}
              {showDetails && (
                <div className="flex items-center gap-4">
                  {franchisee.nps_score && (
                    <div className="text-center">
                      <p className="text-sm font-bold text-gray-800 dark:text-white">
                        {franchisee.nps_score}
                      </p>
                      <p className="text-xs text-gray-500">NPS</p>
                    </div>
                  )}
                  {franchisee.engagement_rate && (
                    <div className="text-center">
                      <p className="text-sm font-bold text-gray-800 dark:text-white">
                        {franchisee.engagement_rate}%
                      </p>
                      <p className="text-xs text-gray-500">Engaj.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Score */}
              <div className="text-right">
                <p className="text-lg font-bold text-[#1672d6]">
                  {franchisee.total_score}
                </p>
                <p className="text-xs text-gray-500">pontos</p>
              </div>

              {/* Mudança de posição */}
              <div className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                positionChange.direction === 'up' && "bg-green-100 text-green-600",
                positionChange.direction === 'down' && "bg-red-100 text-red-600",
                positionChange.direction === 'stable' && "bg-gray-100 text-gray-600"
              )}>
                {positionChange.direction === 'up' && (
                  <>
                    <ChevronUp className="w-3 h-3" />
                    +{positionChange.change}
                  </>
                )}
                {positionChange.direction === 'down' && (
                  <>
                    <ChevronDown className="w-3 h-3" />
                    -{positionChange.change}
                  </>
                )}
                {positionChange.direction === 'stable' && (
                  <>
                    <Minus className="w-3 h-3" />
                    0
                  </>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Ver todos */}
      {franchisees.length > maxItems && (
        <div className="text-center pt-4">
          <button className="text-[#1672d6] font-medium text-sm hover:underline">
            Ver ranking completo ({franchisees.length} franquias)
          </button>
        </div>
      )}
    </div>
  );
}

export default FranchiseeRanking;

