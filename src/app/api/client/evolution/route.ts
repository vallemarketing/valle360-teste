/**
 * Client Evolution (remove mocks)
 * - Métricas mensais baseadas em social_account_metrics_daily
 * - Marcos (timeline) best-effort: insights, arquivos, event_log
 *
 * Não depende de integrações externas. Se tabelas não existirem, retorna vazios (sem quebrar UI).
 */
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

export const dynamic = 'force-dynamic';

function safeNum(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function isMissingTableError(e: any) {
  const msg = String(e?.message || '').toLowerCase();
  const code = String(e?.code || '');
  return code === '42P01' || msg.includes('relation') || msg.includes('does not exist');
}

function monthLabelPtBR(yyyyMm: string) {
  // yyyy-mm -> "Ago 2024" (curto) ou apenas "Ago"
  const [y, m] = yyyyMm.split('-').map((x) => Number(x));
  if (!y || !m) return yyyyMm;
  const d = new Date(Date.UTC(y, m - 1, 1));
  const mon = new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'America/Sao_Paulo' })
    .format(d)
    .replace('.', '');
  const cap = mon.charAt(0).toUpperCase() + mon.slice(1);
  return cap.slice(0, 3);
}

function monthKeysBetween(start: Date, end: Date) {
  const keys: string[] = [];
  const s = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  const e = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
  let cur = s;
  while (cur.getTime() <= e.getTime()) {
    const y = cur.getUTCFullYear();
    const m = String(cur.getUTCMonth() + 1).padStart(2, '0');
    keys.push(`${y}-${m}`);
    cur = new Date(Date.UTC(y, cur.getUTCMonth() + 1, 1));
  }
  return keys;
}

type EvolutionMetricKey = 'followers' | 'reach_avg' | 'engagement_rate' | 'profile_views';
type EvolutionMetricPayload = {
  key: EvolutionMetricKey;
  unit: string;
  startValue: number;
  currentValue: number;
  series: Array<{ month: string; value: number }>;
};

type MilestonePayload = {
  id: string;
  date: string; // ISO
  title: string;
  description: string;
  type: 'achievement' | 'growth' | 'campaign' | 'feature';
  metric?: { label: string; before: string; after: string };
  badge?: string;
};

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });

    const admin = getSupabaseAdmin();
    const { data: clientRow, error: clientErr } = await admin
      .from('clients')
      .select('id, created_at')
      .eq('user_id', user.id)
      .maybeSingle();
    if (clientErr) return NextResponse.json({ success: false, error: clientErr.message }, { status: 500 });
    const clientId = clientRow?.id ? String(clientRow.id) : null;
    if (!clientId) return NextResponse.json({ success: false, error: 'Cliente não vinculado (clients.user_id)' }, { status: 400 });

    const { searchParams } = new URL(request.url);
    const rawMonths = Number(searchParams.get('months') || 6);
    const months = Math.max(1, Math.min(24, Number.isFinite(rawMonths) ? Math.floor(rawMonths) : 6));

    const end = new Date();
    const start = new Date();
    start.setUTCDate(1);
    start.setUTCMonth(start.getUTCMonth() - (months - 1));
    start.setUTCHours(0, 0, 0, 0);

    const monthKeys = monthKeysBetween(start, end);

    const byMonth: Record<
      string,
      { impressions: number; reach: number; engaged: number; profile_views: number; fansLast: number; fansFirst: number; days: number; hasFans: boolean }
    > = {};
    for (const k of monthKeys) {
      byMonth[k] = { impressions: 0, reach: 0, engaged: 0, profile_views: 0, fansLast: 0, fansFirst: 0, days: 0, hasFans: false };
    }

    // ===== Social metrics =====
    let hasSocial = false;
    try {
      const fromDate = start.toISOString().slice(0, 10);
      const { data, error } = await admin
        .from('social_account_metrics_daily')
        .select('metric_date, metrics')
        .eq('client_id', clientId)
        .gte('metric_date', fromDate)
        .order('metric_date', { ascending: true })
        .limit(5000);
      if (error) throw error;

      for (const row of data || []) {
        const d = String((row as any).metric_date || '');
        if (!d) continue;
        const monthKey = d.slice(0, 7);
        if (!byMonth[monthKey]) continue;
        const m = ((row as any).metrics || {}) as any;
        const impressions = safeNum(m.impressions ?? m.page_impressions ?? 0);
        const reach = safeNum(m.reach ?? 0);
        const engaged = safeNum(m.page_engaged_users ?? 0);
        const profileViews = safeNum(m.profile_views ?? 0);
        const fans = safeNum(m.page_fans ?? 0);

        byMonth[monthKey].impressions += impressions;
        byMonth[monthKey].reach += reach;
        byMonth[monthKey].engaged += engaged;
        byMonth[monthKey].profile_views += profileViews;
        byMonth[monthKey].days += 1;

        if (fans) {
          if (!byMonth[monthKey].hasFans) {
            byMonth[monthKey].fansFirst = fans;
            byMonth[monthKey].fansLast = fans;
            byMonth[monthKey].hasFans = true;
          } else {
            byMonth[monthKey].fansLast = fans;
          }
        }
      }
      hasSocial = true;
      hasSocial = Object.values(byMonth).some((x) => x.days > 0);
    } catch (e: any) {
      if (!isMissingTableError(e)) {
        // ignore hard failure; UI must not break
      }
      hasSocial = false;
    }

    const seriesFollowers = monthKeys.map((k) => ({ month: monthLabelPtBR(k), value: byMonth[k].hasFans ? byMonth[k].fansLast : 0 }));
    const seriesReachAvg = monthKeys.map((k) => ({
      month: monthLabelPtBR(k),
      value: byMonth[k].days ? Math.round(byMonth[k].reach / byMonth[k].days) : 0,
    }));
    const seriesEngRate = monthKeys.map((k) => {
      const imp = byMonth[k].impressions;
      const rate = imp ? (byMonth[k].engaged / imp) * 100 : 0;
      return { month: monthLabelPtBR(k), value: Math.round(rate * 10) / 10 };
    });
    const seriesProfileViews = monthKeys.map((k) => ({ month: monthLabelPtBR(k), value: Math.round(byMonth[k].profile_views) }));

    const metrics: EvolutionMetricPayload[] = [
      {
        key: 'followers',
        unit: '',
        startValue: seriesFollowers[0]?.value || 0,
        currentValue: seriesFollowers[seriesFollowers.length - 1]?.value || 0,
        series: seriesFollowers,
      },
      {
        key: 'reach_avg',
        unit: '',
        startValue: seriesReachAvg[0]?.value || 0,
        currentValue: seriesReachAvg[seriesReachAvg.length - 1]?.value || 0,
        series: seriesReachAvg,
      },
      {
        key: 'engagement_rate',
        unit: '%',
        startValue: seriesEngRate[0]?.value || 0,
        currentValue: seriesEngRate[seriesEngRate.length - 1]?.value || 0,
        series: seriesEngRate,
      },
      {
        key: 'profile_views',
        unit: '',
        startValue: seriesProfileViews[0]?.value || 0,
        currentValue: seriesProfileViews[seriesProfileViews.length - 1]?.value || 0,
        series: seriesProfileViews,
      },
    ];

    // ===== Milestones (best-effort) =====
    const milestones: MilestonePayload[] = [];
    const push = (m: MilestonePayload) => milestones.push(m);

    try {
      const { data, error } = await admin
        .from('client_ai_insights')
        .select('id,title,created_at')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      for (const row of data || []) {
        push({
          id: `insight:${row.id}`,
          date: String((row as any).created_at),
          title: row.title ? `Insight gerado: ${String(row.title)}` : 'Novo insight gerado',
          description: 'A Val gerou um insight com recomendações para o seu negócio.',
          type: 'growth',
        });
      }
    } catch (e: any) {
      if (!isMissingTableError(e)) {
        // ignore
      }
    }

    try {
      const { data, error } = await admin
        .from('files')
        .select('id,file_name,created_at')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      for (const row of data || []) {
        push({
          id: `file:${row.id}`,
          date: String((row as any).created_at),
          title: row.file_name ? `Arquivo enviado: ${String(row.file_name)}` : 'Novo arquivo enviado',
          description: 'Um novo arquivo foi adicionado ao seu painel.',
          type: 'feature',
        });
      }
    } catch (e: any) {
      if (!isMissingTableError(e)) {
        // ignore
      }
    }

    try {
      const { data, error } = await admin
        .from('event_log')
        .select('id,event_type,created_at,payload')
        .order('created_at', { ascending: false })
        .limit(60);
      if (error) throw error;
      for (const row of data || []) {
        const payload = ((row as any).payload || {}) as any;
        const payloadClientId = String(payload.client_id || payload.clientId || '').trim();
        if (!payloadClientId || payloadClientId !== clientId) continue;
        const t = String((row as any).event_type || '').toLowerCase();
        if (!t) continue;

        if (t === 'invoice.paid') {
          push({
            id: `event:${row.id}`,
            date: String((row as any).created_at),
            title: 'Pagamento confirmado',
            description: 'Recebemos a confirmação de pagamento de uma fatura.',
            type: 'achievement',
          });
        } else if (t.includes('approval')) {
          push({
            id: `event:${row.id}`,
            date: String((row as any).created_at),
            title: 'Aprovação registrada',
            description: 'Um item foi aprovado ou recebeu solicitação de ajustes.',
            type: 'campaign',
          });
        } else if (t.includes('kanban') || t.includes('task')) {
          push({
            id: `event:${row.id}`,
            date: String((row as any).created_at),
            title: 'Atualização no Kanban',
            description: 'Houve movimentação/atualização em tarefas do seu projeto.',
            type: 'feature',
          });
        }
      }
    } catch (e: any) {
      if (!isMissingTableError(e)) {
        // ignore
      }
    }

    // Milestone derivado: início do monitoramento social
    if (hasSocial) {
      const firstMonth = monthKeys[0];
      push({
        id: 'social:start',
        date: new Date(Date.UTC(Number(firstMonth.slice(0, 4)), Number(firstMonth.slice(5, 7)) - 1, 1)).toISOString(),
        title: 'Início do monitoramento social',
        description: 'Começamos a coletar métricas orgânicas das suas redes sociais.',
        type: 'feature',
      });
    }

    const merged = Array.from(new Map(milestones.map((m) => [m.id, m])).values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 12);

    return NextResponse.json({
      success: true,
      client_id: clientId,
      join_date: clientRow?.created_at ? String((clientRow as any).created_at) : null,
      months,
      hasSocial,
      metrics,
      milestones: merged,
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Erro interno' }, { status: 500 });
  }
}



