'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Star, Zap, Target, Award, Crown,
  Flame, Heart, Users, TrendingUp, Clock,
  CheckCircle, Lock, Sparkles, Gift, Calendar,
  DollarSign, Medal, Rocket, Shield, Coffee,
  Lightbulb, MessageSquare, X
} from 'lucide-react';
import { 
  Badge, 
  PREDEFINED_BADGES, 
  BADGE_CATEGORIES, 
  getBadgeColor,
  BadgeCategory 
} from '@/lib/gamification/badges';
import { 
  getRewardIcon, 
  getRewardStatusColor, 
  getRewardStatusLabel 
} from '@/lib/gamification/rewards';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  unlocked: boolean;
  unlockedAt?: Date;
  progress?: number;
  maxProgress?: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: BadgeCategory;
  rewards?: Badge['rewards'];
  pointsAwarded?: number;
}

interface AchievementBadgesProps {
  achievements?: Achievement[];
  employeeId?: string;
  onAchievementClick?: (achievement: Achievement) => void;
  showCategories?: boolean;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  '⚡': <Zap className="w-6 h-6" />,
  '🌅': <Coffee className="w-6 h-6" />,
  '🚀': <Rocket className="w-6 h-6" />,
  '💨': <Zap className="w-6 h-6" />,
  '🥷': <Shield className="w-6 h-6" />,
  '💎': <Star className="w-6 h-6" />,
  '😊': <Heart className="w-6 h-6" />,
  '🛡️': <Shield className="w-6 h-6" />,
  '✅': <CheckCircle className="w-6 h-6" />,
  '👑': <Crown className="w-6 h-6" />,
  '⭐': <Star className="w-6 h-6" />,
  '🎓': <Award className="w-6 h-6" />,
  '💬': <MessageSquare className="w-6 h-6" />,
  '🤝': <Users className="w-6 h-6" />,
  '🎯': <Target className="w-6 h-6" />,
  '🏃': <TrendingUp className="w-6 h-6" />,
  '📅': <Calendar className="w-6 h-6" />,
  '⏰': <Clock className="w-6 h-6" />,
  '🔥': <Flame className="w-6 h-6" />,
  '🔄': <TrendingUp className="w-6 h-6" />,
  '🏆': <Trophy className="w-6 h-6" />,
  '🌟': <Sparkles className="w-6 h-6" />,
  '🎖️': <Medal className="w-6 h-6" />,
  '💡': <Lightbulb className="w-6 h-6" />,
  '🔧': <Target className="w-6 h-6" />,
  '🔮': <Sparkles className="w-6 h-6" />,
  trophy: <Trophy className="w-6 h-6" />,
  star: <Star className="w-6 h-6" />,
  zap: <Zap className="w-6 h-6" />,
  target: <Target className="w-6 h-6" />,
  award: <Award className="w-6 h-6" />,
  crown: <Crown className="w-6 h-6" />,
  flame: <Flame className="w-6 h-6" />,
  heart: <Heart className="w-6 h-6" />,
  users: <Users className="w-6 h-6" />,
  trending: <TrendingUp className="w-6 h-6" />,
  clock: <Clock className="w-6 h-6" />,
  check: <CheckCircle className="w-6 h-6" />
};

const RARITY_COLORS: Record<string, { bg: string; border: string; glow: string }> = {
  common: { 
    bg: 'from-gray-400 to-gray-500', 
    border: '#9CA3AF',
    glow: 'rgba(156, 163, 175, 0.3)'
  },
  rare: { 
    bg: 'from-blue-400 to-blue-600', 
    border: '#3B82F6',
    glow: 'rgba(59, 130, 246, 0.3)'
  },
  epic: { 
    bg: 'from-purple-400 to-purple-600', 
    border: '#8B5CF6',
    glow: 'rgba(139, 92, 246, 0.3)'
  },
  legendary: { 
    bg: 'from-yellow-400 to-amber-500', 
    border: '#F59E0B',
    glow: 'rgba(245, 158, 11, 0.4)'
  }
};

const RARITY_LABELS: Record<string, string> = {
  common: 'Comum',
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Lendário'
};

export function AchievementBadges({ 
  achievements: propAchievements, 
  employeeId,
  onAchievementClick,
  showCategories = true 
}: AchievementBadgesProps) {
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory | 'all'>('all');
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(!propAchievements);

  useEffect(() => {
    if (propAchievements) {
      setAchievements(propAchievements);
    } else {
      loadAchievements();
    }
  }, [propAchievements, employeeId]);

  const loadAchievements = async () => {
    try {
      // Converter PREDEFINED_BADGES para formato de Achievement
      const allAchievements: Achievement[] = PREDEFINED_BADGES.map(badge => ({
        id: badge.id,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        color: getBadgeColor(badge.rarity),
        unlocked: false, // Será atualizado com dados do servidor
        rarity: badge.rarity,
        category: badge.category,
        rewards: badge.rewards,
        pointsAwarded: badge.pointsAwarded,
        progress: 0,
        maxProgress: badge.criteria.threshold
      }));

      // Se tiver employeeId, buscar badges conquistadas
      if (employeeId) {
        const response = await fetch(`/api/gamification/badges?employeeId=${employeeId}`);
        const data = await response.json();
        
        if (data.success) {
          const earnedIds = data.earnedBadges.map((b: any) => b.badge_id);
          
          allAchievements.forEach(achievement => {
            if (earnedIds.includes(achievement.id)) {
              achievement.unlocked = true;
              const earned = data.earnedBadges.find((b: any) => b.badge_id === achievement.id);
              if (earned) {
                achievement.unlockedAt = new Date(earned.earned_at);
              }
            }
            
            // Atualizar progresso com métricas
            const badge = PREDEFINED_BADGES.find(b => b.id === achievement.id);
            if (badge && data.metrics) {
              const metricValue = data.metrics[badge.criteria.metric] || 0;
              achievement.progress = metricValue;
              achievement.maxProgress = badge.criteria.threshold;
            }
          });
        }
      }

      setAchievements(allAchievements);
    } catch (error) {
      console.error('Erro ao carregar conquistas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    onAchievementClick?.(achievement);
  };

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  
  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === selectedCategory);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5" style={{ color: 'var(--warning-500)' }} />
          <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>
            Conquistas
          </h3>
        </div>
        <span 
          className="text-sm font-medium px-3 py-1 rounded-full"
          style={{ 
            backgroundColor: 'var(--warning-100)',
            color: 'var(--warning-700)'
          }}
        >
          {unlockedCount}/{achievements.length}
        </span>
      </div>

      {/* Category Filter */}
      {showCategories && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedCategory === 'all' ? 'ring-2' : ''
            }`}
            style={{
              backgroundColor: selectedCategory === 'all' ? 'var(--primary-100)' : 'var(--bg-secondary)',
              color: selectedCategory === 'all' ? 'var(--primary-700)' : 'var(--text-secondary)',
              // @ts-ignore
              '--tw-ring-color': 'var(--primary-500)'
            }}
          >
            Todas
          </button>
          {Object.entries(BADGE_CATEGORIES).map(([key, category]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key as BadgeCategory)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                selectedCategory === key ? 'ring-2' : ''
              }`}
              style={{
                backgroundColor: selectedCategory === key ? `${category.color}20` : 'var(--bg-secondary)',
                color: selectedCategory === key ? category.color : 'var(--text-secondary)',
                // @ts-ignore
                '--tw-ring-color': category.color
              }}
            >
              <span>{category.icon}</span>
              <span>{category.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Badges Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
        {filteredAchievements.map((achievement, index) => {
          const rarity = RARITY_COLORS[achievement.rarity];
          const icon = ICON_MAP[achievement.icon] || <Trophy className="w-6 h-6" />;

          return (
            <motion.button
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              whileHover={{ scale: achievement.unlocked ? 1.1 : 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleClick(achievement)}
              className="relative aspect-square rounded-xl flex items-center justify-center transition-all"
              style={{
                backgroundColor: achievement.unlocked ? `${achievement.color}20` : 'var(--bg-secondary)',
                border: `2px solid ${achievement.unlocked ? rarity.border : 'var(--border-light)'}`,
                boxShadow: achievement.unlocked ? `0 0 20px ${rarity.glow}` : 'none',
                opacity: achievement.unlocked ? 1 : 0.5
              }}
            >
              {/* Icon */}
              <div style={{ color: achievement.unlocked ? achievement.color : 'var(--text-disabled)' }}>
                {achievement.unlocked ? icon : <Lock className="w-5 h-5" />}
              </div>

              {/* Progress indicator for locked achievements */}
              {!achievement.unlocked && achievement.progress !== undefined && achievement.maxProgress && (
                <div 
                  className="absolute bottom-1 left-1 right-1 h-1 rounded-full overflow-hidden"
                  style={{ backgroundColor: 'var(--bg-tertiary)' }}
                >
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{ 
                      width: `${Math.min(100, (achievement.progress / achievement.maxProgress) * 100)}%`,
                      backgroundColor: achievement.color
                    }}
                  />
                </div>
              )}

              {/* Rarity indicator */}
              {achievement.unlocked && achievement.rarity !== 'common' && (
                <div 
                  className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
                  style={{ backgroundColor: rarity.border }}
                />
              )}

              {/* Rewards indicator */}
              {achievement.rewards && achievement.rewards.length > 0 && achievement.unlocked && (
                <div 
                  className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-xs"
                  style={{ backgroundColor: 'var(--success-500)', color: 'white' }}
                >
                  <Gift className="w-2.5 h-2.5" />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Achievement Detail Modal */}
      <AnimatePresence>
        {selectedAchievement && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAchievement(null)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-6 rounded-2xl shadow-2xl z-50 max-h-[90vh] overflow-y-auto"
              style={{ backgroundColor: 'var(--bg-primary)' }}
            >
              {/* Close button */}
              <button
                onClick={() => setSelectedAchievement(null)}
                className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
              </button>

              {/* Badge Display */}
              <div className="text-center mb-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.1 }}
                  className={`w-24 h-24 mx-auto rounded-2xl flex items-center justify-center bg-gradient-to-br ${RARITY_COLORS[selectedAchievement.rarity].bg}`}
                  style={{
                    boxShadow: `0 0 30px ${RARITY_COLORS[selectedAchievement.rarity].glow}`
                  }}
                >
                  <div className="text-white scale-150">
                    {ICON_MAP[selectedAchievement.icon] || <Trophy className="w-10 h-10" />}
                  </div>
                </motion.div>
              </div>

              {/* Info */}
              <div className="text-center">
                <span 
                  className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                  style={{ 
                    backgroundColor: `${RARITY_COLORS[selectedAchievement.rarity].border}20`,
                    color: RARITY_COLORS[selectedAchievement.rarity].border
                  }}
                >
                  {RARITY_LABELS[selectedAchievement.rarity]}
                </span>
                
                <h3 
                  className="text-xl font-bold mt-3"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {selectedAchievement.name}
                </h3>
                
                <p 
                  className="text-sm mt-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {selectedAchievement.description}
                </p>

                {/* Points */}
                {selectedAchievement.pointsAwarded && (
                  <div 
                    className="mt-3 inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium"
                    style={{ backgroundColor: 'var(--warning-100)', color: 'var(--warning-700)' }}
                  >
                    <Zap className="w-4 h-4" />
                    +{selectedAchievement.pointsAwarded} pontos
                  </div>
                )}

                {/* Status */}
                <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-light)' }}>
                  {selectedAchievement.unlocked ? (
                    <div className="flex items-center justify-center gap-2 text-sm" style={{ color: 'var(--success-500)' }}>
                      <CheckCircle className="w-4 h-4" />
                      <span>Desbloqueada!</span>
                      {selectedAchievement.unlockedAt && (
                        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          em {new Date(selectedAchievement.unlockedAt).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div>
                      {selectedAchievement.progress !== undefined && selectedAchievement.maxProgress && (
                        <>
                          <div 
                            className="h-2 rounded-full overflow-hidden mb-2"
                            style={{ backgroundColor: 'var(--bg-secondary)' }}
                          >
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, (selectedAchievement.progress / selectedAchievement.maxProgress) * 100)}%` }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: selectedAchievement.color }}
                            />
                          </div>
                          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            {selectedAchievement.progress} / {selectedAchievement.maxProgress}
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Rewards Section */}
                {selectedAchievement.rewards && selectedAchievement.rewards.length > 0 && (
                  <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-light)' }}>
                    <h4 className="text-sm font-semibold mb-3 flex items-center justify-center gap-2" style={{ color: 'var(--text-primary)' }}>
                      <Gift className="w-4 h-4" style={{ color: 'var(--success-500)' }} />
                      Recompensas
                    </h4>
                    <div className="space-y-2">
                      {selectedAchievement.rewards.map((reward, idx) => (
                        <div 
                          key={idx}
                          className="flex items-center gap-3 p-2 rounded-lg text-left"
                          style={{ backgroundColor: 'var(--bg-secondary)' }}
                        >
                          <span className="text-lg">{getRewardIcon(reward.type)}</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                              {reward.description}
                            </p>
                            {reward.requiresHRApproval && (
                              <p className="text-xs" style={{ color: 'var(--warning-600)' }}>
                                Requer aprovação do RH
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Close Button */}
              <button
                onClick={() => setSelectedAchievement(null)}
                className="w-full mt-4 py-2 rounded-lg font-medium transition-colors"
                style={{ 
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)'
                }}
              >
                Fechar
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Dados de exemplo atualizados
export const SAMPLE_ACHIEVEMENTS: Achievement[] = PREDEFINED_BADGES.slice(0, 8).map((badge, index) => ({
  id: badge.id,
  name: badge.name,
  description: badge.description,
  icon: badge.icon,
  color: getBadgeColor(badge.rarity),
  unlocked: index < 4,
  rarity: badge.rarity,
  category: badge.category,
  rewards: badge.rewards,
  pointsAwarded: badge.pointsAwarded,
  progress: index >= 4 ? Math.floor(Math.random() * badge.criteria.threshold) : undefined,
  maxProgress: badge.criteria.threshold
}));
