'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, Trophy, Target, Calendar, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StreakData {
  current: number;
  best: number;
  total_approvals: number;
  last_approval: string | null;
  streak_start: string | null;
}

export function ApprovalStreak() {
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [nextMilestone, setNextMilestone] = useState(7);
  const [daysToMilestone, setDaysToMilestone] = useState(7);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStreak();
  }, []);

  const loadStreak = async () => {
    try {
      const response = await fetch('/api/client/streak');
      const data = await response.json();
      
      if (data.success) {
        setStreak(data.streak);
        setNextMilestone(data.nextMilestone);
        setDaysToMilestone(data.daysToMilestone);
      }
    } catch (error) {
      console.error('Erro ao carregar streak:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFlameColor = (streak: number) => {
    if (streak >= 30) return 'text-purple-500';
    if (streak >= 14) return 'text-red-500';
    if (streak >= 7) return 'text-orange-500';
    return 'text-amber-500';
  };

  const getFlameSize = (streak: number) => {
    if (streak >= 30) return 'w-16 h-16';
    if (streak >= 14) return 'w-14 h-14';
    if (streak >= 7) return 'w-12 h-12';
    return 'w-10 h-10';
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
        </CardContent>
      </Card>
    );
  }

  const currentStreak = streak?.current || 0;
  const progressToMilestone = ((nextMilestone - daysToMilestone) / nextMilestone) * 100;

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ 
                scale: currentStreak > 0 ? [1, 1.1, 1] : 1,
              }}
              transition={{ 
                duration: 0.5, 
                repeat: currentStreak > 0 ? Infinity : 0,
                repeatDelay: 2
              }}
            >
              <Flame className={`${getFlameSize(currentStreak)} ${getFlameColor(currentStreak)}`} />
            </motion.div>
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                Streak de Aprovações
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Aprove conteúdos diariamente
              </p>
            </div>
          </div>
        </div>

        {/* Contador principal */}
        <div className="text-center py-4">
          <motion.div
            key={currentStreak}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative inline-block"
          >
            <span className="text-6xl font-bold bg-gradient-to-br from-amber-500 to-orange-600 bg-clip-text text-transparent">
              {currentStreak}
            </span>
            <span className="text-2xl font-medium text-gray-600 dark:text-gray-400 ml-2">
              {currentStreak === 1 ? 'dia' : 'dias'}
            </span>
          </motion.div>
        </div>

        {/* Progresso para próximo milestone */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400">
              Próximo milestone: {nextMilestone} dias
            </span>
            <span className="font-medium text-amber-600">
              {daysToMilestone} dias restantes
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressToMilestone}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg">
            <Target className="w-4 h-4 mx-auto text-gray-500 mb-1" />
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {streak?.total_approvals || 0}
            </p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
          <div className="text-center p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg">
            <Trophy className="w-4 h-4 mx-auto text-amber-500 mb-1" />
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {streak?.best || 0}
            </p>
            <p className="text-xs text-gray-500">Recorde</p>
          </div>
          <div className="text-center p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg">
            <Calendar className="w-4 h-4 mx-auto text-blue-500 mb-1" />
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {nextMilestone}
            </p>
            <p className="text-xs text-gray-500">Meta</p>
          </div>
        </div>

        {/* Mensagem motivacional */}
        {currentStreak > 0 && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-sm text-amber-700 dark:text-amber-300 mt-4 font-medium"
          >
            {currentStreak >= 30 
              ? '🔥 Incrível! Você é uma lenda!'
              : currentStreak >= 14 
                ? '🎯 Fantástico! Continue assim!'
                : currentStreak >= 7 
                  ? '⭐ Uma semana! Você está voando!'
                  : '💪 Ótimo começo! Mantenha o ritmo!'}
          </motion.p>
        )}

        {currentStreak === 0 && (
          <p className="text-center text-sm text-gray-500 mt-4">
            Aprove um conteúdo hoje para iniciar seu streak!
          </p>
        )}
      </CardContent>
    </Card>
  );
}
