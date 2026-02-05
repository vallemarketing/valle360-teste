/**
 * Proactive Alerts API
 * System for generating proactive alerts about calendar gaps, token expiration, etc.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

export const dynamic = 'force-dynamic';

interface Alert {
  id: string;
  type: 'calendar_gap' | 'token_expiring' | 'low_engagement' | 'missed_schedule' | 'content_suggestion';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  action?: string;
  actionUrl?: string;
  createdAt: string;
}

export async function GET(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('client_id');

  if (!clientId) {
    return NextResponse.json({ success: false, error: 'client_id is required' }, { status: 400 });
  }

  try {
    const alerts: Alert[] = [];
    const supabase = getSupabaseAdmin();
    const now = new Date();

    // 1. Check for calendar gaps (next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const { data: upcomingPosts } = await supabase
      .from('content_calendar_posts')
      .select('id, scheduled_for')
      .eq('client_id', clientId)
      .gte('scheduled_for', now.toISOString())
      .lte('scheduled_for', nextWeek.toISOString())
      .in('status', ['scheduled', 'draft']);

    if (!upcomingPosts || upcomingPosts.length < 3) {
      alerts.push({
        id: 'gap_' + Date.now(),
        type: 'calendar_gap',
        severity: upcomingPosts?.length === 0 ? 'critical' : 'warning',
        title: 'Gap no Calendário',
        description: `Apenas ${upcomingPosts?.length || 0} posts agendados para os próximos 7 dias. Recomendamos mínimo de 3.`,
        action: 'Gerar Ideias',
        actionUrl: `/admin/social-media/ideias`,
        createdAt: now.toISOString(),
      });
    }

    // 2. Check for expiring tokens
    const { data: connectedAccounts } = await supabase
      .from('social_connected_accounts')
      .select('id, platform, token_expires_at, display_name')
      .eq('client_id', clientId);

    if (connectedAccounts) {
      for (const account of connectedAccounts) {
        if (account.token_expires_at) {
          const expiresAt = new Date(account.token_expires_at);
          const daysUntilExpiry = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
            alerts.push({
              id: `token_${account.id}`,
              type: 'token_expiring',
              severity: daysUntilExpiry <= 2 ? 'critical' : 'warning',
              title: 'Token Expirando',
              description: `O token do ${account.platform} (${account.display_name}) expira em ${daysUntilExpiry} dias.`,
              action: 'Reconectar',
              actionUrl: `/admin/integracoes`,
              createdAt: now.toISOString(),
            });
          } else if (daysUntilExpiry <= 0) {
            alerts.push({
              id: `token_expired_${account.id}`,
              type: 'token_expiring',
              severity: 'critical',
              title: 'Token Expirado',
              description: `O token do ${account.platform} (${account.display_name}) expirou. Reconecte para continuar publicando.`,
              action: 'Reconectar',
              actionUrl: `/admin/integracoes`,
              createdAt: now.toISOString(),
            });
          }
        }
      }
    }

    // 3. Check for low engagement (last 7 days)
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    const { data: recentPosts } = await supabase
      .from('content_calendar_posts')
      .select('id, metrics, caption')
      .eq('client_id', clientId)
      .eq('status', 'published')
      .gte('scheduled_for', lastWeek.toISOString())
      .limit(10);

    if (recentPosts && recentPosts.length > 0) {
      const lowEngagementPosts = recentPosts.filter(p => {
        const metrics = p.metrics as any;
        if (!metrics) return false;
        const engagementRate = metrics.engagement_rate || 0;
        return engagementRate < 2; // Below 2% is considered low
      });

      if (lowEngagementPosts.length >= 3) {
        alerts.push({
          id: 'engagement_' + Date.now(),
          type: 'low_engagement',
          severity: 'warning',
          title: 'Engajamento Baixo',
          description: `${lowEngagementPosts.length} posts recentes têm engajamento abaixo de 2%. Considere revisar a estratégia.`,
          action: 'Ver Análise',
          actionUrl: `/admin/social-media/analise`,
          createdAt: now.toISOString(),
        });
      }
    }

    // 4. Check for missed scheduled posts
    const { data: missedPosts } = await supabase
      .from('content_calendar_posts')
      .select('id, caption, scheduled_for')
      .eq('client_id', clientId)
      .eq('status', 'scheduled')
      .lt('scheduled_for', now.toISOString())
      .limit(5);

    if (missedPosts && missedPosts.length > 0) {
      alerts.push({
        id: 'missed_' + Date.now(),
        type: 'missed_schedule',
        severity: 'critical',
        title: 'Posts Não Publicados',
        description: `${missedPosts.length} posts agendados não foram publicados. Verifique as integrações.`,
        action: 'Ver Posts',
        actionUrl: `/admin/social-media/calendario`,
        createdAt: now.toISOString(),
      });
    }

    // Sort by severity
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return NextResponse.json({
      success: true,
      alerts,
      summary: {
        total: alerts.length,
        critical: alerts.filter(a => a.severity === 'critical').length,
        warning: alerts.filter(a => a.severity === 'warning').length,
        info: alerts.filter(a => a.severity === 'info').length,
      },
    });
  } catch (error: any) {
    console.error('Alerts error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get alerts' },
      { status: 500 }
    );
  }
}
