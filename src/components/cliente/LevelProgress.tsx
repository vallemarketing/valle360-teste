'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, ChevronRight, Loader2, Award, Gift, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getLevelByPoints, getProgressToNextLevel, LEVELS, Level } from '@/lib/gamification/levels';

interface LevelProgressProps {
  clientId?: string;
  onViewRewards?: () => void;
}

export function LevelProgress({ onViewRewards }: LevelProgressProps) {
  const [points, setPoints] = useState(0);
  const [currentLevel, setCurrentLevel] = useState<Level>(LEVELS[0]);
  const [progress, setProgress] = useState(0);
  const [pointsNeeded, setPointsNeeded] = useState(0);
  const [nextLevel, setNextLevel] = useState<Level | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPoints();
  }, []);

  const loadPoints = async () => {
    try {
      const response = await fetch('/api/client/points');
      const data = await response.json();
      
      if (data.success) {
        const pts = data.points || 0;
        setPoints(pts);
        
        const level = getLevelByPoints(pts);
        setCurrentLevel(level);
        
        const progressData = getProgressToNextLevel(pts);
        setProgress(progressData.progress);
        setPointsNeeded(progressData.pointsNeeded);
        setNextLevel(progressData.nextLevel);
      }
    } catch (error) {
      console.error('Erro ao carregar pontos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`overflow-hidden bg-gradient-to-br ${currentLevel.bgGradient} text-white`}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-4xl">{currentLevel.icon}</div>
            <div>
              <p className="text-sm opacity-80">Seu nível</p>
              <h3 className="font-bold text-xl">{currentLevel.name}</h3>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">{points.toLocaleString()}</p>
            <p className="text-sm opacity-80">pontos</p>
          </div>
        </div>

        {/* Progress bar */}
        {nextLevel && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="opacity-80">Progresso para {nextLevel.name}</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                className="h-full bg-white rounded-full"
              />
            </div>
            <p className="text-sm opacity-80 mt-1">
              Faltam <span className="font-bold">{pointsNeeded.toLocaleString()}</span> pontos
            </p>
          </div>
        )}

        {/* Benefits preview */}
        <div className="bg-white/10 rounded-lg p-3 mb-4">
          <p className="text-sm font-medium mb-2 flex items-center gap-2">
            <Award className="w-4 h-4" /> Seus benefícios:
          </p>
          <ul className="text-sm space-y-1">
            {currentLevel.benefits.slice(0, 3).map((benefit, index) => (
              <li key={index} className="flex items-center gap-2 opacity-90">
                <Star className="w-3 h-3" />
                {benefit}
              </li>
            ))}
            {currentLevel.benefits.length > 3 && (
              <li className="opacity-70">+{currentLevel.benefits.length - 3} mais...</li>
            )}
          </ul>
        </div>

        {/* Next level preview */}
        {nextLevel && (
          <div className="bg-white/5 rounded-lg p-3 mb-4 border border-white/10">
            <p className="text-sm flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4" />
              <span className="opacity-80">Próximo nível:</span>
              <span className="font-bold">{nextLevel.icon} {nextLevel.name}</span>
            </p>
            <p className="text-xs opacity-70">
              Novos benefícios: {nextLevel.benefits[nextLevel.benefits.length - 1]}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="flex-1 bg-white/20 hover:bg-white/30 text-white border-0"
            onClick={onViewRewards}
          >
            <Gift className="w-4 h-4 mr-2" />
            Ver Recompensas
          </Button>
          <Button
            variant="secondary"
            className="bg-white/20 hover:bg-white/30 text-white border-0"
            onClick={() => window.location.href = '/cliente/programa-fidelidade'}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
