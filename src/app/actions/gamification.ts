'use server';

import { supabase } from '@/lib/supabase';
import { getCurrentUserId, withUserContext } from '@/lib/db-helpers';

// Refresh performance scores para toda a organização
export async function refreshPerformanceScores(
  orgId: string,
  periodStart: string,
  periodEnd: string
) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Não autenticado');

  return withUserContext(userId, async () => {
    const { error } = await supabase.rpc('refresh_performance_scores', {
      p_org: orgId,
      p_start: periodStart,
      p_end: periodEnd,
    });

    if (error) throw error;
    return { success: true };
  });
}

// Obter ranking da organização
export async function getOrganizationRanking(
  orgId: string,
  periodStart: string,
  periodEnd: string
) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Não autenticado');

  return withUserContext(userId, async () => {
    const { data, error } = await supabase.rpc('ranking_for_org', {
      p_org: orgId,
      p_start: periodStart,
      p_end: periodEnd,
    });

    if (error) throw error;

    // Enriquecer com dados de usuário
    if (data && data.length > 0) {
      const userIds = data.map((r: any) => r.user_id);
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      return data.map((rank: any) => ({
        ...rank,
        user: profiles?.find(p => p.id === rank.user_id),
      }));
    }

    return data || [];
  });
}

// Obter score de um usuário específico
export async function getUserScore(
  orgId: string,
  userId: string,
  periodStart: string,
  periodEnd: string
) {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) throw new Error('Não autenticado');

  return withUserContext(currentUserId, async () => {
    const { data, error } = await supabase.rpc('compute_user_score', {
      p_org: orgId,
      p_user: userId,
      p_start: periodStart,
      p_end: periodEnd,
    });

    if (error) throw error;
    return data;
  });
}

// Atualizar achievements de um usuário
export async function updateUserAchievements(orgId: string, userId: string) {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) throw new Error('Não autenticado');

  return withUserContext(currentUserId, async () => {
    const { error } = await supabase.rpc('update_achievements_for_user', {
      p_org: orgId,
      p_user: userId,
    });

    if (error) throw error;
    return { success: true };
  });
}

// Obter achievements de um usuário
export async function getUserAchievements(orgId: string, userId: string) {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) throw new Error('Não autenticado');

  return withUserContext(currentUserId, async () => {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('org_id', orgId)
      .eq('user_id', userId)
      .order('awarded_at', { ascending: false });

    if (error) throw error;
    return data || [];
  });
}

// Criar alerta personalizado
export async function createAlert(data: {
  orgId: string;
  userId: string;
  kind: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}) {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) throw new Error('Não autenticado');

  return withUserContext(currentUserId, async () => {
    const { data: alert, error } = await supabase
      .from('alerts')
      .insert({
        org_id: data.orgId,
        user_id: data.userId,
        kind: data.kind,
        severity: data.severity,
        title: data.title,
        message: data.message,
        action_url: data.actionUrl,
        metadata: data.metadata,
      })
      .select()
      .single();

    if (error) throw error;
    return alert;
  });
}

// Obter alertas do usuário
export async function getUserAlerts(orgId: string, onlyUnread: boolean = false) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Não autenticado');

  return withUserContext(userId, async () => {
    let query = supabase
      .from('alerts')
      .select('*')
      .eq('org_id', orgId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (onlyUnread) {
      query = query.is('read_at', null);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  });
}

// Marcar alerta como lido
export async function markAlertAsRead(alertId: string) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Não autenticado');

  return withUserContext(userId, async () => {
    const { data, error } = await supabase
      .from('alerts')
      .update({ read_at: new Date().toISOString() })
      .eq('id', alertId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  });
}

// Dispensar (dismiss) alerta
export async function dismissAlert(alertId: string) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Não autenticado');

  return withUserContext(userId, async () => {
    const { data, error } = await supabase
      .from('alerts')
      .update({ dismissed_at: new Date().toISOString() })
      .eq('id', alertId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  });
}

// Dashboard de gamificação (resumo geral)
export async function getGamificationDashboard(orgId: string) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Não autenticado');

  return withUserContext(userId, async () => {
    // Performance do usuário atual
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const periodStart = startOfMonth.toISOString().split('T')[0];
    const periodEnd = endOfMonth.toISOString().split('T')[0];

    const { data: myScore } = await supabase
      .from('performance_scores')
      .select('*')
      .eq('org_id', orgId)
      .eq('user_id', userId)
      .eq('period_start', periodStart)
      .eq('period_end', periodEnd)
      .maybeSingle();

    // Achievements
    const { data: myAchievements } = await supabase
      .from('achievements')
      .select('*')
      .eq('org_id', orgId)
      .eq('user_id', userId)
      .order('awarded_at', { ascending: false })
      .limit(5);

    // Top 5 ranking
    const { data: topRanking } = await supabase.rpc('ranking_for_org', {
      p_org: orgId,
      p_start: periodStart,
      p_end: periodEnd,
    });

    const top5 = (topRanking || []).slice(0, 5);

    // Enriquecer com perfis
    if (top5.length > 0) {
      const userIds = top5.map((r: any) => r.user_id);
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      top5.forEach((rank: any) => {
        rank.user = profiles?.find(p => p.id === rank.user_id);
      });
    }

    return {
      myScore: myScore || null,
      myAchievements: myAchievements || [],
      topRanking: top5,
      period: {
        start: periodStart,
        end: periodEnd,
      },
    };
  });
}
