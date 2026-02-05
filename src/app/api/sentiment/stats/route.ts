/**
 * Valle 360 - API de Estatísticas de Sentimento
 * Dashboard de monitoramento de sentimento
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

export const dynamic = 'force-dynamic';

function isMissingTableError(message: string) {
  const m = String(message || '').toLowerCase();
  return (
    m.includes('does not exist') ||
    m.includes('relation') ||
    m.includes('schema cache') ||
    m.includes('could not find the table')
  );
}

// GET - Estatísticas de sentimento
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { data: isAdmin } = await supabase.rpc('is_admin');
    if (!isAdmin) {
      return NextResponse.json({ error: 'Acesso negado (admin)' }, { status: 403 });
    }
    const db: any = getSupabaseAdmin();

    const { searchParams } = new URL(request.url);
    const client_id = searchParams.get('client_id');
    const period = searchParams.get('period') || '7d'; // 1d, 7d, 30d, 90d
    const group_by = searchParams.get('group_by') || 'day'; // day, week, month

    // Calcular data inicial baseada no período
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '7d':
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Buscar estatísticas diárias
    let statsQuery = db
      .from('sentiment_daily_stats')
      .select('*')
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (client_id) {
      statsQuery = statsQuery.eq('client_id', client_id);
    }

    const { data: dailyStats, error: statsError } = await statsQuery;
    if (statsError) throw statsError;

    // Buscar análises recentes para totais
    let analysesQuery = db
      .from('sentiment_analyses')
      .select('overall_sentiment, source_type, score', { count: 'exact' })
      .gte('analyzed_at', startDate.toISOString());

    if (client_id) {
      analysesQuery = analysesQuery.eq('client_id', client_id);
    }

    const { data: analyses, count: totalAnalyses, error: analysesError } = await analysesQuery;
    if (analysesError) throw analysesError;

    // Calcular totais
    const totals = {
      total: totalAnalyses || 0,
      positive: 0,
      neutral: 0,
      negative: 0,
      by_source: {} as Record<string, number>,
      average_score: 0
    };

    let totalScore = 0;

    (analyses || []).forEach((a: any) => {
      if (a.overall_sentiment === 'positive') totals.positive++;
      else if (a.overall_sentiment === 'neutral') totals.neutral++;
      else if (a.overall_sentiment === 'negative') totals.negative++;

      totals.by_source[a.source_type] = (totals.by_source[a.source_type] || 0) + 1;
      totalScore += a.score || 0;
    });

    totals.average_score = totals.total > 0 ? totalScore / totals.total : 0;

    // Buscar alertas pendentes
    let alertsQuery = db
      .from('sentiment_alerts')
      .select('severity', { count: 'exact' })
      .eq('status', 'pending');

    if (client_id) {
      alertsQuery = alertsQuery.eq('client_id', client_id);
    }

    const { data: alerts, count: pendingAlerts } = await alertsQuery;

    const alertsBySeverity = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    (alerts || []).forEach((a: any) => {
      alertsBySeverity[a.severity as keyof typeof alertsBySeverity]++;
    });

    // Buscar top entidades (positivas e negativas)
    const { data: recentAnalyses } = await db
      .from('sentiment_analyses')
      .select('entities')
      .gte('analyzed_at', startDate.toISOString())
      .not('entities', 'is', null)
      .limit(100);

    const entityStats: Record<string, { count: number; totalSentiment: number }> = {};
    
    (recentAnalyses || []).forEach((a: any) => {
      if (a.entities && Array.isArray(a.entities)) {
        a.entities.forEach((e: any) => {
          const key = e.name?.toLowerCase();
          if (key) {
            if (!entityStats[key]) {
              entityStats[key] = { count: 0, totalSentiment: 0 };
            }
            entityStats[key].count++;
            if (e.sentiment === 'positive') entityStats[key].totalSentiment += 1;
            else if (e.sentiment === 'negative') entityStats[key].totalSentiment -= 1;
          }
        });
      }
    });

    const sortedEntities = Object.entries(entityStats)
      .map(([name, data]) => ({
        name,
        count: data.count,
        avgSentiment: data.totalSentiment / data.count
      }))
      .sort((a, b) => b.count - a.count);

    const topPositiveEntities = sortedEntities
      .filter(e => e.avgSentiment > 0)
      .slice(0, 5);

    const topNegativeEntities = sortedEntities
      .filter(e => e.avgSentiment < 0)
      .slice(0, 5);

    // Preparar dados para gráfico de tendência
    const trendData = (dailyStats || []).map((day: any) => ({
      date: day.date,
      total: day.total_analyses,
      positive: day.positive_count,
      neutral: day.neutral_count,
      negative: day.negative_count,
      average_score: day.average_score
    }));

    return NextResponse.json({
      success: true,
      period,
      totals,
      alerts: {
        pending: pendingAlerts || 0,
        by_severity: alertsBySeverity
      },
      trend: trendData,
      entities: {
        top_positive: topPositiveEntities,
        top_negative: topNegativeEntities
      },
      percentages: {
        positive: totals.total > 0 ? ((totals.positive / totals.total) * 100).toFixed(1) : 0,
        neutral: totals.total > 0 ? ((totals.neutral / totals.total) * 100).toFixed(1) : 0,
        negative: totals.total > 0 ? ((totals.negative / totals.total) * 100).toFixed(1) : 0
      }
    });

  } catch (error: any) {
    console.error('Erro ao buscar estatísticas:', error);
    if (isMissingTableError(error?.message || '')) {
      // Sem schema ainda (ou migration não aplicada). Não retorna 500 para o dashboard não cair.
      return NextResponse.json({
        success: true,
        period: new URL(request.url).searchParams.get('period') || '7d',
        totals: { total: 0, positive: 0, neutral: 0, negative: 0, average_score: 0, by_source: {} },
        alerts: { pending: 0, by_severity: { critical: 0, high: 0, medium: 0, low: 0 } },
        trend: [],
        entities: { top_positive: [], top_negative: [] },
        percentages: { positive: '0.0', neutral: '0.0', negative: '0.0' },
        note: 'Schema de sentimento ainda não foi aplicado no banco.',
      });
    }
    return NextResponse.json({ 
      error: 'Erro interno',
      details: error.message 
    }, { status: 500 });
  }
}

