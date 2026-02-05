import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { resolveSocialUploadAccess } from '@/lib/social/uploadAccess';

export const dynamic = 'force-dynamic';

function startOfDayIso(date: Date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const access = await resolveSocialUploadAccess({ supabase });
    if (!access.allowed) return NextResponse.json({ error: access.reason || 'Acesso negado' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const clientId = String(searchParams.get('client_id') || '').trim();
    if (!clientId) return NextResponse.json({ error: 'client_id é obrigatório' }, { status: 400 });

    const days = Math.min(90, Math.max(1, Number(searchParams.get('days') || 30)));
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - (days - 1));
    const from = startOfDayIso(fromDate);

    const { data, error } = await supabase
      .from('social_account_metrics_daily')
      .select('platform, metric_date, metrics')
      .eq('client_id', clientId)
      .gte('metric_date', from)
      .order('metric_date', { ascending: true })
      .limit(5000);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const series = (data || []).map((r: any) => ({
      date: String(r.metric_date),
      platform: String(r.platform),
      metrics: r.metrics || {},
    }));

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


