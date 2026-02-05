'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Star, TrendingUp, Award } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { SkeletonListItem } from '@/components/ui/Skeleton';

interface LeaderboardEntry {
  userId: string;
  userName: string;
  avatarUrl?: string;
  points: number;
  level: number;
  badges: number;
  rank: number;
}

interface LeaderboardProps {
  period?: 'weekly' | 'monthly' | 'all_time';
  limit?: number;
  showCurrentUser?: boolean;
  currentUserId?: string;
}

const rankColors = {
  1: { bg: 'from-yellow-400 to-amber-500', text: 'text-yellow-900', icon: Trophy },
  2: { bg: 'from-gray-300 to-gray-400', text: 'text-gray-900', icon: Medal },
  3: { bg: 'from-amber-600 to-amber-700', text: 'text-amber-100', icon: Medal },
};

export function Leaderboard({ 
  period = 'monthly', 
  limit = 10,
  showCurrentUser = true,
  currentUserId,
}: LeaderboardProps) {
  const { t, locale } = useTranslation();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePeriod, setActivePeriod] = useState(period);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/gamification/leaderboard?period=${activePeriod}&limit=${limit}`);
        const data = await response.json();
        if (data.entries) {
          setEntries(data.entries);
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [activePeriod, limit]);

  const periodLabels = {
    weekly: locale === 'en' ? 'This Week' : 'Esta Semana',
    monthly: locale === 'en' ? 'This Month' : 'Este Mês',
    all_time: locale === 'en' ? 'All Time' : 'Todos os Tempos',
  };

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}>
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-light)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-yellow-400 to-amber-500">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {locale === 'en' ? 'Leaderboard' : 'Ranking'}
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              {locale === 'en' ? 'Top performers' : 'Melhores desempenhos'}
            </p>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          {(['weekly', 'monthly', 'all_time'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setActivePeriod(p)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activePeriod === p ? 'bg-white shadow-sm' : ''
              }`}
              style={{ color: activePeriod === p ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="p-4 space-y-2">
        {loading ? (
          <>
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
          </>
        ) : entries.length === 0 ? (
          <div className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
            {locale === 'en' ? 'No data yet' : 'Sem dados ainda'}
          </div>
        ) : (
          entries.map((entry, index) => {
            const isTopThree = entry.rank <= 3;
            const rankStyle = rankColors[entry.rank as keyof typeof rankColors];
            const isCurrentUser = currentUserId && entry.userId === currentUserId;
            const RankIcon = rankStyle?.icon || Star;

            return (
              <motion.div
                key={entry.userId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`
                  flex items-center gap-4 p-3 rounded-xl transition-all
                  ${isCurrentUser ? 'ring-2 ring-offset-2' : ''}
                `}
                style={{ 
                  backgroundColor: isCurrentUser ? 'var(--primary-50)' : 'var(--bg-secondary)',
                  // @ts-ignore - ringColor is a Tailwind CSS custom property
                  '--tw-ring-color': isCurrentUser ? 'var(--primary-500)' : undefined,
                } as React.CSSProperties}
              >
                {/* Rank */}
                <div className={`
                  w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm
                  ${isTopThree ? `bg-gradient-to-br ${rankStyle?.bg} ${rankStyle?.text}` : ''}
                `}
                  style={!isTopThree ? { backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' } : undefined}
                >
                  {isTopThree ? <RankIcon className="w-5 h-5" /> : entry.rank}
                </div>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                  {entry.avatarUrl ? (
                    <img src={entry.avatarUrl} alt={entry.userName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg font-medium" style={{ color: 'var(--text-tertiary)' }}>
                      {entry.userName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {entry.userName}
                    {isCurrentUser && (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--primary-100)', color: 'var(--primary-700)' }}>
                        {locale === 'en' ? 'You' : 'Você'}
                      </span>
                    )}
                  </p>
                  <p className="text-sm flex items-center gap-2" style={{ color: 'var(--text-tertiary)' }}>
                    <span>Level {entry.level}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      {entry.badges}
                    </span>
                  </p>
                </div>

                {/* Points */}
                <div className="text-right">
                  <p className="font-bold" style={{ color: 'var(--primary-600)' }}>
                    {entry.points.toLocaleString()}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {locale === 'en' ? 'points' : 'pontos'}
                  </p>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default Leaderboard;
