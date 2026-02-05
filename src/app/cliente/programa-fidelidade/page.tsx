'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Star, Award, Gift, Trophy, Target, Zap, ChevronRight, 
  Check, Lock, Loader2, Flame, Calendar, TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LEVELS, Level, getLevelByPoints, getProgressToNextLevel, POINT_ACTIONS } from '@/lib/gamification/levels';
import { ApprovalStreak } from '@/components/cliente/ApprovalStreak';

interface Achievement {
  id: string;
  achievement_code: string;
  title: string;
  description: string;
  points: number;
  earned_at: string;
}

interface PointsHistory {
  id: string;
  action: string;
  points: number;
  balance_after: number;
  created_at: string;
}

export default function ProgramaFidelidadePage() {
  const [points, setPoints] = useState(0);
  const [currentLevel, setCurrentLevel] = useState<Level>(LEVELS[0]);
  const [progress, setProgress] = useState({ progress: 0, pointsNeeded: 0, nextLevel: null as Level | null });
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [history, setHistory] = useState<PointsHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'levels' | 'rewards' | 'history'>('overview');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await fetch('/api/client/points');
      const data = await response.json();
      
      if (data.success) {
        setPoints(data.points || 0);
        const level = getLevelByPoints(data.points || 0);
        setCurrentLevel(level);
        setProgress(getProgressToNextLevel(data.points || 0));
        setAchievements(data.achievements || []);
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      APPROVE_POST: 'Aprovação de post',
      APPROVE_POST_FAST: 'Aprovação rápida',
      COMPLETE_BRIEFING: 'Briefing completo',
      FEEDBACK_DETAILED: 'Feedback detalhado',
      REFERRAL: 'Indicação de cliente',
      MONTHLY_ACTIVE: 'Atividade mensal',
      STREAK_7_DAYS: 'Streak de 7 dias',
      STREAK_30_DAYS: 'Streak de 30 dias',
      FIRST_APPROVAL: 'Primeira aprovação',
      CONNECT_INSTAGRAM: 'Instagram conectado',
      COMPLETE_ONBOARDING: 'Onboarding completo'
    };
    return labels[action] || action;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Valle Club
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Programa de fidelidade exclusivo
          </p>
        </div>

        {/* Level Badge */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r ${currentLevel.bgGradient} text-white shadow-lg`}
        >
          <span className="text-3xl">{currentLevel.icon}</span>
          <div>
            <p className="text-sm opacity-80">Nível {currentLevel.name}</p>
            <p className="text-xl font-bold">{points.toLocaleString()} pts</p>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'overview', label: 'Visão Geral', icon: Star },
          { id: 'levels', label: 'Níveis', icon: Award },
          { id: 'rewards', label: 'Recompensas', icon: Gift },
          { id: 'history', label: 'Histórico', icon: TrendingUp }
        ].map(tab => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'outline'}
            onClick={() => setActiveTab(tab.id as any)}
            className={activeTab === tab.id ? 'bg-primary' : ''}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Progress Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Progresso
              </CardTitle>
            </CardHeader>
            <CardContent>
              {progress.nextLevel ? (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{currentLevel.icon}</span>
                      <span className="font-medium">{currentLevel.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{progress.nextLevel.name}</span>
                      <span className="text-2xl">{progress.nextLevel.icon}</span>
                    </div>
                  </div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress.progress}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className={`h-full bg-gradient-to-r ${currentLevel.bgGradient} rounded-full`}
                    />
                  </div>
                  <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                    Faltam <span className="font-bold text-primary">{progress.pointsNeeded.toLocaleString()}</span> pontos para o próximo nível
                  </p>
                </>
              ) : (
                <div className="text-center py-8">
                  <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                  <p className="text-xl font-bold">Você atingiu o nível máximo!</p>
                  <p className="text-gray-500">Parabéns, você é um cliente Diamante! 👑</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Streak Card */}
          <ApprovalStreak />

          {/* How to earn points */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Como ganhar pontos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(POINT_ACTIONS).map(([action, points]) => (
                  <div
                    key={action}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <span className="text-sm">{getActionLabel(action)}</span>
                    <Badge className="bg-primary">+{points} pts</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-500" />
                Conquistas Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {achievements.length > 0 ? (
                <div className="space-y-3">
                  {achievements.slice(0, 5).map(achievement => (
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white">
                        <Trophy className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{achievement.title}</p>
                        <p className="text-xs text-gray-500">+{achievement.points} pts</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">
                  Nenhuma conquista ainda. Continue usando a plataforma!
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'levels' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {LEVELS.map((level, index) => {
            const isCurrentLevel = level.id === currentLevel.id;
            const isUnlocked = points >= level.minPoints;

            return (
              <motion.div
                key={level.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`relative overflow-hidden ${isCurrentLevel ? 'ring-2 ring-primary' : ''}`}>
                  {isCurrentLevel && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-primary">Atual</Badge>
                    </div>
                  )}
                  <div className={`h-2 bg-gradient-to-r ${level.bgGradient}`} />
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-4xl">{level.icon}</span>
                      <div>
                        <h3 className="font-bold text-lg">{level.name}</h3>
                        <p className="text-sm text-gray-500">
                          {level.maxPoints === Infinity 
                            ? `${level.minPoints.toLocaleString()}+ pts`
                            : `${level.minPoints.toLocaleString()} - ${level.maxPoints.toLocaleString()} pts`}
                        </p>
                      </div>
                      {!isUnlocked && <Lock className="w-5 h-5 text-gray-400 ml-auto" />}
                    </div>
                    <ul className="space-y-2">
                      {level.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <Check className={`w-4 h-4 ${isUnlocked ? 'text-green-500' : 'text-gray-300'}`} />
                          <span className={isUnlocked ? '' : 'text-gray-400'}>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {activeTab === 'rewards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Recompensas disponíveis baseadas no nível */}
          {[
            { 
              id: 'discount-5', 
              name: '5% de desconto', 
              description: 'Desconto em serviços extras', 
              minLevel: 'silver',
              points: 200 
            },
            { 
              id: 'template-pack', 
              name: 'Pack de Templates', 
              description: 'Templates exclusivos de stories', 
              minLevel: 'silver',
              points: 300 
            },
            { 
              id: 'discount-10', 
              name: '10% de desconto', 
              description: 'Desconto em serviços extras', 
              minLevel: 'gold',
              points: 500 
            },
            { 
              id: 'consultoria', 
              name: 'Consultoria 30min', 
              description: 'Sessão de consultoria exclusiva', 
              minLevel: 'gold',
              points: 800 
            },
            { 
              id: 'brinde', 
              name: 'Brinde Exclusivo', 
              description: 'Kit de brindes Valle', 
              minLevel: 'platinum',
              points: 1000 
            },
            { 
              id: 'discount-20', 
              name: '20% de desconto', 
              description: 'Desconto em serviços extras', 
              minLevel: 'diamond',
              points: 1500 
            }
          ].map((reward, index) => {
            const requiredLevel = LEVELS.find(l => l.id === reward.minLevel) || LEVELS[0];
            const currentLevelIndex = LEVELS.findIndex(l => l.id === currentLevel.id);
            const requiredLevelIndex = LEVELS.findIndex(l => l.id === reward.minLevel);
            const isAvailable = currentLevelIndex >= requiredLevelIndex && points >= reward.points;

            return (
              <motion.div
                key={reward.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`${!isAvailable ? 'opacity-60' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Gift className={`w-8 h-8 ${isAvailable ? 'text-primary' : 'text-gray-400'}`} />
                      {!isAvailable && <Lock className="w-5 h-5 text-gray-400" />}
                    </div>
                    <h3 className="font-bold text-lg mb-1">{reward.name}</h3>
                    <p className="text-sm text-gray-500 mb-4">{reward.description}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="flex items-center gap-1">
                        {requiredLevel.icon} {requiredLevel.name}+
                      </Badge>
                      <span className="font-bold text-primary">{reward.points} pts</span>
                    </div>
                    <Button
                      className="w-full mt-4"
                      disabled={!isAvailable}
                    >
                      {isAvailable ? 'Resgatar' : 'Indisponível'}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {activeTab === 'history' && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Pontos</CardTitle>
          </CardHeader>
          <CardContent>
            {history.length > 0 ? (
              <div className="space-y-3">
                {history.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">{getActionLabel(item.action)}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(item.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">+{item.points}</p>
                      <p className="text-sm text-gray-500">Saldo: {item.balance_after}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">
                Nenhuma atividade ainda. Comece a usar a plataforma para ganhar pontos!
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
