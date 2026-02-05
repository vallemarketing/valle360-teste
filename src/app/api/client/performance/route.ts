/**
 * Client Performance API (Epic 14-2)
 * Consolida Social (orgânico) + Ads (quando configurado) para a área do cliente.
 *
 * Observação: AdsIntegration ainda pode operar em modo mock dependendo das credenciais;
 * este endpoint é "best-effort" e nunca deve quebrar a UI do cliente.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';
import { adsIntegration } from '@/lib/ads/ads-integration';

export const dynamic = 'force-dynamic';

function startOfDayIso(date: Date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function safeNum(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const admin = getSupabaseAdmin();
    const { data: client, error: clientErr } = await admin
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (clientErr) return NextResponse.json({ error: clientErr.message }, { status: 500 });
    const clientId = client?.id ? String(client.id) : null;
    if (!clientId) return NextResponse.json({ error: 'Cliente não vinculado (clients.user_id)' }, { status: 400 });

    const { searchParams } = new URL(request.url);
    const rawDays = Number(searchParams.get('days') || 30);
    const days = Math.max(1, Math.min(365, Number.isFinite(rawDays) ? Math.floor(rawDays) : 30));
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - (days - 1));
    const from = startOfDayIso(fromDate);

    // --- Social (orgânico) ---
    let socialDaily: any[] = [];
    let socialError: string | null = null;
    try {
      const { data, error } = await admin
        .from('social_account_metrics_daily')
        .select('metric_date, metrics')
        .eq('client_id', clientId)
        .gte('metric_date', from)
        .order('metric_date', { ascending: true })
        .limit(5000);
      if (error) throw error;

      const byDate: Record<string, { impressions: number; reach: number; engaged: number; fans: number; profile_views: number }> = {};
      for (const row of data || []) {
        const d = String((row as any).metric_date);
        const m = (row as any).metrics || {};
        byDate[d] ||= { impressions: 0, reach: 0, engaged: 0, fans: 0, profile_views: 0 };
        byDate[d].impressions += safeNum(m.impressions ?? m.page_impressions ?? 0);
        byDate[d].reach += safeNum(m.reach ?? 0);
        byDate[d].profile_views += safeNum(m.profile_views ?? 0);
        byDate[d].engaged += safeNum(m.page_engaged_users ?? 0);
        byDate[d].fans += safeNum(m.page_fans ?? 0);
      }
      const dates = Object.keys(byDate).sort();
      socialDaily = dates.map((d) => ({ date: d, ...byDate[d] }));
    } catch (e: any) {
      socialError = String(e?.message || 'Falha ao carregar social_account_metrics_daily');
      socialDaily = [];
    }

    // --- Ads (best-effort) ---
    let ads: any = { available: false };
    try {
      // Se integrações estiverem configuradas, esse método pode retornar dados reais;
      // caso contrário, alguns ambientes podem retornar mocks.
      const endDate = new Date().toISOString().slice(0, 10);
      const startDate = from;
      const reports = await adsIntegration.generatePerformanceReport(clientId, 'all', { start: startDate, end: endDate });
      const list = Array.isArray(reports) ? reports : [];
      const total = list.reduce(
        (acc: any, r: any) => {
          acc.total_spend += safeNum(r.total_spend);
          acc.total_impressions += safeNum(r.total_impressions);
          acc.total_clicks += safeNum(r.total_clicks);
          acc.total_conversions += safeNum(r.total_conversions);
          acc.avg_roas += safeNum(r.avg_roas);
          acc.count += 1;
          return acc;
        },
        { total_spend: 0, total_impressions: 0, total_clicks: 0, total_conversions: 0, avg_roas: 0, count: 0 }
      );
      ads = {
        available: list.length > 0,
        reports: list,
        totals: {
          total_spend: total.total_spend,
          total_impressions: total.total_impressions,
          total_clicks: total.total_clicks,
          total_conversions: total.total_conversions,
          avg_roas: total.count ? total.avg_roas / total.count : 0,
        },
      };
    } catch (e: any) {
      ads = { available: false, error: String(e?.message || 'ads_unavailable') };
    }

    return NextResponse.json({
      success: true,
      client_id: clientId,
      range_days: days,
      social: { daily: socialDaily, error: socialError },
      ads,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
  }
}


