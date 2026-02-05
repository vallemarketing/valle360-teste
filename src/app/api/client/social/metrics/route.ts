import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

export const dynamic = 'force-dynamic';

function startOfDayIso(date: Date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export async function GET(_request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    // Use service role (evita depender de RLS do clients), mas valida ownership via user_id.
    const admin = getSupabaseAdmin();
    const { data: client, error: clientErr } = await admin
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (clientErr) return NextResponse.json({ error: clientErr.message }, { status: 500 });
    const clientId = client?.id ? String(client.id) : null;
    if (!clientId) return NextResponse.json({ error: 'Cliente não vinculado (clients.user_id)' }, { status: 400 });

    const { searchParams } = new URL(_request.url);
    const rawDays = Number(searchParams.get('days') || 30);
    const days = Math.max(1, Math.min(365, Number.isFinite(rawDays) ? Math.floor(rawDays) : 30));
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - (days - 1));
    const from = startOfDayIso(fromDate);

    const seenTablesErr = (e: any) => {
      const msg = String(e?.message || '').toLowerCase();
      const code = String(e?.code || '');
      return code === '42P01' || msg.includes('relation') || msg.includes('does not exist');
    };

    const { data, error } = await admin
      .from('social_account_metrics_daily')
      .select('platform, metric_date, metrics')
      .eq('client_id', clientId)
      .gte('metric_date', from)
      .order('metric_date', { ascending: true })
      .limit(5000);

    if (error) {
      if (seenTablesErr(error)) {
        return NextResponse.json({
          success: true,
          client_id: clientId,
          range_days: days,
          latest: null,
          daily: [],
          warning: 'missing_table_social_account_metrics_daily',
          instruction:
            'A tabela social_account_metrics_daily não existe neste banco. Verifique migrations de social metrics (Supabase).',
        });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const series = (data || []).map((r: any) => ({
      date: String(r.metric_date),
      platform: String(r.platform),
      metrics: r.metrics || {},
    }));

    // Agrega por dia (soma) para métricas comuns
    const byDate: Record<string, { impressions: number; reach: number; engaged: number; fans: number; profile_views: number }> = {};
    for (const row of series) {
      const d = row.date;
      const m = row.metrics || {};
      byDate[d] ||= { impressions: 0, reach: 0, engaged: 0, fans: 0, profile_views: 0 };
      byDate[d].impressions += Number(m.impressions ?? m.page_impressions ?? 0) || 0;
      byDate[d].reach += Number(m.reach ?? 0) || 0;
      byDate[d].profile_views += Number(m.profile_views ?? 0) || 0;
      byDate[d].engaged += Number(m.page_engaged_users ?? 0) || 0;
      byDate[d].fans += Number(m.page_fans ?? 0) || 0;
    }

    const dates = Object.keys(byDate).sort();
    const daily = dates.map((d) => ({ date: d, ...byDate[d] }));
    const latest = daily.length ? daily[daily.length - 1] : null;

    return NextResponse.json({
      success: true,
      client_id: clientId,
      range_days: days,
      latest,
      daily,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
  }
}


