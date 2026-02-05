/**
 * Gamification System
 * Implements points, badges, levels, and rankings
 */

import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

// Point values for different actions
export const POINT_VALUES = {
  // Content creation
  POST_CREATED: 10,
  POST_PUBLISHED: 15,
  POST_APPROVED_FIRST_TRY: 25,
  CAROUSEL_CREATED: 20,
  VIDEO_CREATED: 30,
  CAMPAIGN_CREATED: 50,

  // Engagement
  HIGH_ENGAGEMENT_POST: 50, // Post with above-average engagement
  VIRAL_POST: 100, // Post that goes viral
  
  // Quality
  NO_REVISIONS_NEEDED: 20,
  CLIENT_PRAISED: 40,
  
  // Consistency
  DAILY_POST: 5,
  WEEKLY_STREAK: 30, // 7 consecutive days with posts
  MONTHLY_STREAK: 100, // Full month with posts
  
  // Collaboration
  HELPED_TEAMMATE: 15,
  TASK_COMPLETED_EARLY: 10,
} as const;

// Badge definitions
export const BADGES = {
  // Bronze tier
  FIRST_POST: {
    id: 'first_post',
    name: 'Primeiro Post',
    nameEn: 'First Post',
    description: 'Publicou seu primeiro post',
    icon: '🎉',
    tier: 'bronze',
    pointsRequired: 0,
  },
  CONTENT_STARTER: {
    id: 'content_starter',
    name: 'Iniciante em Conteúdo',
    nameEn: 'Content Starter',
    description: 'Publicou 10 posts',
    icon: '✍️',
    tier: 'bronze',
    pointsRequired: 100,
  },
  
  // Silver tier
  CONTENT_CREATOR: {
    id: 'content_creator',
    name: 'Criador de Conteúdo',
    nameEn: 'Content Creator',
    description: 'Publicou 50 posts',
    icon: '🖊️',
    tier: 'silver',
    pointsRequired: 500,
  },
  ENGAGEMENT_MASTER: {
    id: 'engagement_master',
    name: 'Mestre do Engajamento',
    nameEn: 'Engagement Master',
    description: '10 posts com alto engajamento',
    icon: '🔥',
    tier: 'silver',
    pointsRequired: 500,
  },
  STREAK_KEEPER: {
    id: 'streak_keeper',
    name: 'Guardião da Consistência',
    nameEn: 'Streak Keeper',
    description: 'Manteve 4 semanas consecutivas de posts',
    icon: '📅',
    tier: 'silver',
    pointsRequired: 400,
  },
  
  // Gold tier
  CONTENT_EXPERT: {
    id: 'content_expert',
    name: 'Expert em Conteúdo',
    nameEn: 'Content Expert',
    description: 'Publicou 200 posts',
    icon: '🏆',
    tier: 'gold',
    pointsRequired: 2000,
  },
  VIRAL_MAKER: {
    id: 'viral_maker',
    name: 'Fazedor de Viral',
    nameEn: 'Viral Maker',
    description: '5 posts virais',
    icon: '🚀',
    tier: 'gold',
    pointsRequired: 1500,
  },
  PERFECT_MONTH: {
    id: 'perfect_month',
    name: 'Mês Perfeito',
    nameEn: 'Perfect Month',
    description: 'Todos os posts aprovados de primeira em um mês',
    icon: '💎',
    tier: 'gold',
    pointsRequired: 1000,
  },
  
  // Platinum tier
  CONTENT_LEGEND: {
    id: 'content_legend',
    name: 'Lenda do Conteúdo',
    nameEn: 'Content Legend',
    description: 'Publicou 500 posts',
    icon: '👑',
    tier: 'platinum',
    pointsRequired: 5000,
  },
  TEAM_MVP: {
    id: 'team_mvp',
    name: 'MVP da Equipe',
    nameEn: 'Team MVP',
    description: 'Top 1 do ranking por 3 meses',
    icon: '⭐',
    tier: 'platinum',
    pointsRequired: 8000,
  },
} as const;

// Level thresholds
export const LEVELS = [
  { level: 1, name: 'Novato', nameEn: 'Rookie', minPoints: 0 },
  { level: 2, name: 'Aprendiz', nameEn: 'Apprentice', minPoints: 100 },
  { level: 3, name: 'Praticante', nameEn: 'Practitioner', minPoints: 300 },
  { level: 4, name: 'Especialista', nameEn: 'Specialist', minPoints: 600 },
  { level: 5, name: 'Expert', nameEn: 'Expert', minPoints: 1000 },
  { level: 6, name: 'Mestre', nameEn: 'Master', minPoints: 1500 },
  { level: 7, name: 'Grão-Mestre', nameEn: 'Grand Master', minPoints: 2500 },
  { level: 8, name: 'Elite', nameEn: 'Elite', minPoints: 4000 },
  { level: 9, name: 'Lendário', nameEn: 'Legendary', minPoints: 6000 },
  { level: 10, name: 'Mítico', nameEn: 'Mythic', minPoints: 10000 },
];

export interface UserGamificationStats {
  userId: string;
  totalPoints: number;
  currentLevel: number;
  levelName: string;
  pointsToNextLevel: number;
  badges: string[];
  weeklyPoints: number;
  monthlyPoints: number;
  rank: number;
}

/**
 * Award points to a user for an action
 */
export async function awardPoints(
  userId: string,
  action: keyof typeof POINT_VALUES,
  metadata?: Record<string, any>
): Promise<{ newTotal: number; leveledUp: boolean; newLevel?: number }> {
  const supabaseAdmin = getSupabaseAdmin();
  const points = POINT_VALUES[action];

  // Insert point event
  const { error: eventError } = await supabaseAdmin
    .from('gamification_points')
    .insert({
      user_id: userId,
      action: action,
      points: points,
      metadata: metadata,
    });

  if (eventError) {
    console.error('Error awarding points:', eventError);
    throw new Error('Failed to award points');
  }

  // Calculate new total
  const { data: totalData, error: totalError } = await supabaseAdmin
    .from('gamification_points')
    .select('points')
    .eq('user_id', userId);

  if (totalError) {
    throw new Error('Failed to calculate total points');
  }

  const newTotal = totalData?.reduce((sum, row) => sum + (row.points || 0), 0) || 0;

  // Check for level up
  const previousLevel = getLevelFromPoints(newTotal - points);
  const newLevel = getLevelFromPoints(newTotal);
  const leveledUp = newLevel.level > previousLevel.level;

  // Update user profile with new points
  await supabaseAdmin
    .from('user_profiles')
    .update({ 
      gamification_points: newTotal,
      gamification_level: newLevel.level,
    })
    .eq('user_id', userId);

  return {
    newTotal,
    leveledUp,
    newLevel: leveledUp ? newLevel.level : undefined,
  };
}

/**
 * Award a badge to a user
 */
export async function awardBadge(
  userId: string,
  badgeId: keyof typeof BADGES
): Promise<boolean> {
  const supabaseAdmin = getSupabaseAdmin();

  // Check if already has badge
  const { data: existing } = await supabaseAdmin
    .from('gamification_badges')
    .select('id')
    .eq('user_id', userId)
    .eq('badge_id', badgeId)
    .single();

  if (existing) {
    return false; // Already has badge
  }

  // Award badge
  const { error } = await supabaseAdmin
    .from('gamification_badges')
    .insert({
      user_id: userId,
      badge_id: badgeId,
      awarded_at: new Date().toISOString(),
    });

  if (error) {
    console.error('Error awarding badge:', error);
    return false;
  }

  return true;
}

/**
 * Get user's gamification stats
 */
export async function getUserStats(userId: string): Promise<UserGamificationStats | null> {
  const supabaseAdmin = getSupabaseAdmin();

  // Get total points
  const { data: pointsData } = await supabaseAdmin
    .from('gamification_points')
    .select('points, created_at')
    .eq('user_id', userId);

  const totalPoints = pointsData?.reduce((sum, row) => sum + (row.points || 0), 0) || 0;

  // Calculate weekly and monthly points
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const weeklyPoints = pointsData
    ?.filter(p => new Date(p.created_at) >= weekAgo)
    .reduce((sum, row) => sum + (row.points || 0), 0) || 0;

  const monthlyPoints = pointsData
    ?.filter(p => new Date(p.created_at) >= monthAgo)
    .reduce((sum, row) => sum + (row.points || 0), 0) || 0;

  // Get badges
  const { data: badgesData } = await supabaseAdmin
    .from('gamification_badges')
    .select('badge_id')
    .eq('user_id', userId);

  const badges = badgesData?.map(b => b.badge_id) || [];

  // Get level
  const level = getLevelFromPoints(totalPoints);
  const nextLevel = LEVELS.find(l => l.minPoints > totalPoints);
  const pointsToNextLevel = nextLevel ? nextLevel.minPoints - totalPoints : 0;

  // Get rank
  const { data: rankData } = await supabaseAdmin
    .from('user_profiles')
    .select('user_id')
    .order('gamification_points', { ascending: false });

  const rank = (rankData?.findIndex(u => u.user_id === userId) ?? -1) + 1;

  return {
    userId,
    totalPoints,
    currentLevel: level.level,
    levelName: level.name,
    pointsToNextLevel,
    badges,
    weeklyPoints,
    monthlyPoints,
    rank: rank || 0,
  };
}

/**
 * Get leaderboard
 */
export async function getLeaderboard(
  period: 'weekly' | 'monthly' | 'all_time' = 'monthly',
  limit: number = 10
): Promise<Array<{
  userId: string;
  userName: string;
  avatarUrl?: string;
  points: number;
  level: number;
  badges: number;
  rank: number;
}>> {
  const supabaseAdmin = getSupabaseAdmin();

  if (period === 'all_time') {
    // Get from aggregated profiles
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select('user_id, name, avatar_url, gamification_points, gamification_level')
      .order('gamification_points', { ascending: false })
      .limit(limit);

    if (error || !data) return [];

    // Get badge counts
    const userIds = data.map(u => u.user_id);
    const { data: badgeCounts } = await supabaseAdmin
      .from('gamification_badges')
      .select('user_id')
      .in('user_id', userIds);

    const badgeCountMap: Record<string, number> = {};
    badgeCounts?.forEach(b => {
      badgeCountMap[b.user_id] = (badgeCountMap[b.user_id] || 0) + 1;
    });

    return data.map((u, index) => ({
      userId: u.user_id,
      userName: u.name || 'Usuário',
      avatarUrl: u.avatar_url,
      points: u.gamification_points || 0,
      level: u.gamification_level || 1,
      badges: badgeCountMap[u.user_id] || 0,
      rank: index + 1,
    }));
  }

  // For weekly/monthly, calculate from points table
  const now = new Date();
  const startDate = period === 'weekly'
    ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const { data: pointsData, error } = await supabaseAdmin
    .from('gamification_points')
    .select('user_id, points')
    .gte('created_at', startDate.toISOString());

  if (error || !pointsData) return [];

  // Aggregate by user
  const userPoints: Record<string, number> = {};
  pointsData.forEach(p => {
    userPoints[p.user_id] = (userPoints[p.user_id] || 0) + p.points;
  });

  // Sort and limit
  const sortedUsers = Object.entries(userPoints)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit);

  // Get user details
  const userIds = sortedUsers.map(([id]) => id);
  const { data: profiles } = await supabaseAdmin
    .from('user_profiles')
    .select('user_id, name, avatar_url, gamification_level')
    .in('user_id', userIds);

  const profileMap: Record<string, any> = {};
  profiles?.forEach(p => { profileMap[p.user_id] = p; });

  // Get badge counts
  const { data: badgeCounts } = await supabaseAdmin
    .from('gamification_badges')
    .select('user_id')
    .in('user_id', userIds);

  const badgeCountMap: Record<string, number> = {};
  badgeCounts?.forEach(b => {
    badgeCountMap[b.user_id] = (badgeCountMap[b.user_id] || 0) + 1;
  });

  return sortedUsers.map(([userId, points], index) => ({
    userId,
    userName: profileMap[userId]?.name || 'Usuário',
    avatarUrl: profileMap[userId]?.avatar_url,
    points,
    level: profileMap[userId]?.gamification_level || 1,
    badges: badgeCountMap[userId] || 0,
    rank: index + 1,
  }));
}

function getLevelFromPoints(points: number) {
  let current = LEVELS[0];
  for (const level of LEVELS) {
    if (points >= level.minPoints) {
      current = level;
    } else {
      break;
    }
  }
  return current;
}
