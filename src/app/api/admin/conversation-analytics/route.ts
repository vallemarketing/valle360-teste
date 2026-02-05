/**
 * API para obter analytics de conversas para o Centro de Inteligência
 * Somente acessível pelo Super Admin
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';
import { requireAdmin } from '@/lib/auth/requireAdmin';

interface SentimentSummary {
  positive: number;
  neutral: number;
  negative: number;
  total: number;
}

interface ConversationTypeStats {
  type: string;
  label: string;
  positive: number;
  neutral: number;
  negative: number;
  total: number;
  positivePercent: number;
}

interface SentimentTrend {
  date: string;
  positive: number;
  neutral: number;
  negative: number;
  avgScore: number;
}

interface SentimentAlert {
  id: string;
  alertType: string;
  severity: string;
  title: string;
  description: string;
  conversationName: string;
  suggestedAction: string;
  status: string;
  createdAt: string;
}

export async function GET(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) {
    return gate.res;
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || '7d'; // 7d, 30d, 90d
  const db = getSupabaseAdmin();

  // Calcular data de início baseado no período
  const now = new Date();
  let startDate: Date;
  switch (period) {
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default: // 7d
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  try {
    // 1. Buscar resumo geral de sentimentos
    const { data: analysisData, error: analysisError } = await db
      .from('message_sentiment_analysis')
      .select('sentiment, conversation_type, score, analyzed_at, sender_type')
      .gte('analyzed_at', startDate.toISOString())
      .order('analyzed_at', { ascending: false });

    if (analysisError) {
      console.error('Erro ao buscar análises:', analysisError);
      // Retornar dados vazios se tabela não existir
      return NextResponse.json({
        success: true,
        summary: { positive: 0, neutral: 0, negative: 0, total: 0 },
        byType: [],
        bySender: [],
        trend: [],
        alerts: [],
        period,
        message: 'Tabela de análise ainda não possui dados'
      });
    }

    const analyses = analysisData || [];

    // 2. Calcular resumo geral
    const summary: SentimentSummary = {
      positive: analyses.filter(a => a.sentiment === 'positive').length,
      neutral: analyses.filter(a => a.sentiment === 'neutral').length,
      negative: analyses.filter(a => a.sentiment === 'negative').length,
      total: analyses.length
    };

    // 3. Calcular estatísticas por tipo de conversa
    const typeLabels: Record<string, string> = {
      group: 'Grupos',
      direct_team: 'Equipe',
      direct_client: 'Clientes'
    };

    const byType: ConversationTypeStats[] = ['group', 'direct_team', 'direct_client'].map(type => {
      const typeAnalyses = analyses.filter(a => a.conversation_type === type);
      const positive = typeAnalyses.filter(a => a.sentiment === 'positive').length;
      const neutral = typeAnalyses.filter(a => a.sentiment === 'neutral').length;
      const negative = typeAnalyses.filter(a => a.sentiment === 'negative').length;
      const total = typeAnalyses.length;

      return {
        type,
        label: typeLabels[type] || type,
        positive,
        neutral,
        negative,
        total,
        positivePercent: total > 0 ? Math.round((positive / total) * 100) : 0
      };
    });

    // 4. Calcular estatísticas por tipo de sender
    const senderLabels: Record<string, string> = {
      client: 'Clientes',
      collaborator: 'Colaboradores',
      admin: 'Administradores',
      super_admin: 'Super Admin'
    };

    const bySender: ConversationTypeStats[] = ['client', 'collaborator', 'admin'].map(type => {
      const senderAnalyses = analyses.filter(a => a.sender_type === type);
      const positive = senderAnalyses.filter(a => a.sentiment === 'positive').length;
      const neutral = senderAnalyses.filter(a => a.sentiment === 'neutral').length;
      const negative = senderAnalyses.filter(a => a.sentiment === 'negative').length;
      const total = senderAnalyses.length;

      return {
        type,
        label: senderLabels[type] || type,
        positive,
        neutral,
        negative,
        total,
        positivePercent: total > 0 ? Math.round((positive / total) * 100) : 0
      };
    });

    // 5. Calcular tendência por dia
    const trendMap = new Map<string, { positive: number; neutral: number; negative: number; scores: number[] }>();
    
    analyses.forEach(a => {
      const date = new Date(a.analyzed_at).toISOString().split('T')[0];
      if (!trendMap.has(date)) {
        trendMap.set(date, { positive: 0, neutral: 0, negative: 0, scores: [] });
      }
      const entry = trendMap.get(date)!;
      if (a.sentiment === 'positive') entry.positive++;
      else if (a.sentiment === 'neutral') entry.neutral++;
      else entry.negative++;
      entry.scores.push(a.score || 0);
    });

    const trend: SentimentTrend[] = Array.from(trendMap.entries())
      .map(([date, data]) => ({
        date,
        positive: data.positive,
        neutral: data.neutral,
        negative: data.negative,
        avgScore: data.scores.length > 0 
          ? Math.round((data.scores.reduce((a, b) => a + b, 0) / data.scores.length) * 100) / 100
          : 0
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 6. Buscar alertas pendentes
    const { data: alertsData } = await db
      .from('sentiment_alerts')
      .select('*')
      .in('status', ['pending', 'acknowledged'])
      .order('created_at', { ascending: false })
      .limit(10);

    const alerts: SentimentAlert[] = (alertsData || []).map(a => ({
      id: a.id,
      alertType: a.alert_type,
      severity: a.severity,
      title: a.title,
      description: a.description,
      conversationName: a.conversation_name || 'Conversa',
      suggestedAction: a.suggested_action,
      status: a.status,
      createdAt: a.created_at
    }));

    return NextResponse.json({
      success: true,
      summary,
      byType,
      bySender,
      trend,
      alerts,
      period,
      analyzedMessages: analyses.length
    });

  } catch (error: any) {
    console.error('[ConversationAnalytics] Erro:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro interno' },
      { status: 500 }
    );
  }
}

// Endpoint para gerenciar alertas
export async function PATCH(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) {
    return gate.res;
  }

  try {
    const body = await request.json();
    const { alertId, action } = body;

    if (!alertId || !action) {
      return NextResponse.json(
        { error: 'alertId e action são obrigatórios' },
        { status: 400 }
      );
    }

    const db = getSupabaseAdmin();
    const userId = gate.userId;

    let updateData: any = {};
    switch (action) {
      case 'acknowledge':
        updateData = { status: 'acknowledged', acknowledged_by: userId, acknowledged_at: new Date().toISOString() };
        break;
      case 'resolve':
        updateData = { status: 'resolved', resolved_at: new Date().toISOString() };
        break;
      case 'dismiss':
        updateData = { status: 'dismissed' };
        break;
      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }

    const { error } = await db
      .from('sentiment_alerts')
      .update(updateData)
      .eq('id', alertId);

    if (error) throw error;

    return NextResponse.json({ success: true, message: `Alerta ${action}` });

  } catch (error: any) {
    console.error('[ConversationAnalytics] Erro ao atualizar alerta:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro interno' },
      { status: 500 }
    );
  }
}
