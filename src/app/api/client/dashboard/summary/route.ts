/**
 * Client Dashboard Summary (Epic 15)
 * Fornece um resumo único com KPIs reais para o dashboard do cliente.
 *
 * Best-effort: se alguma fonte/tabela não existir, retorna com warnings e não quebra a UI.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';
import { adsIntegration } from '@/lib/ads/ads-integration';

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

function startOfDayIso(date: Date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function pct(curr: number, base: number) {
  if (!base) return 0;
  return Math.round(((curr - base) / base) * 100);
}

function getSaoPauloDayBoundsIso(now = new Date()) {
  const dtf = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = dtf.formatToParts(now);
  const y = parts.find((p) => p.type === 'year')?.value || '1970';
  const m = parts.find((p) => p.type === 'month')?.value || '01';
  const d = parts.find((p) => p.type === 'day')?.value || '01';
  const start = new Date(`${y}-${m}-${d}T00:00:00-03:00`).toISOString();
  const end = new Date(`${y}-${m}-${d}T23:59:59-03:00`).toISOString();
  return { start, end };
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const admin = getSupabaseAdmin();

    const { data: clientRow, error: clientErr } = await admin
      .from('clients')
      .select('id, company_name, industry, segment, competitors, concorrentes')
      .eq('user_id', user.id)
      .maybeSingle();
    if (clientErr) return NextResponse.json({ error: clientErr.message }, { status: 500 });
    const clientId = clientRow?.id ? String(clientRow.id) : null;
    if (!clientId) return NextResponse.json({ error: 'Cliente não vinculado (clients.user_id)' }, { status: 400 });

    const { searchParams } = new URL(request.url);
    const rawDays = Number(searchParams.get('days') || 30);
    const days = Math.max(1, Math.min(365, Number.isFinite(rawDays) ? Math.floor(rawDays) : 30));
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - (days - 1));
    const from = startOfDayIso(fromDate);

    const warnings: string[] = [];

    // ---------------- Social (orgânico) ----------------
    const social = {
      totals30: { impressions: 0, reach: 0, engaged: 0, profile_views: 0 },
      deltas7: { impressions: 0, reach: 0, engaged: 0, profile_views: 0 },
      available: false,
    };

    try {
      const { data, error } = await admin
        .from('social_account_metrics_daily')
        .select('metric_date, metrics')
        .eq('client_id', clientId)
        .gte('metric_date', from)
        .order('metric_date', { ascending: true })
        .limit(5000);
      if (error) throw error;

      const byDate: Record<string, { impressions: number; reach: number; engaged: number; profile_views: number }> = {};
      for (const row of data || []) {
        const d = String((row as any).metric_date);
        const m = (row as any).metrics || {};
        byDate[d] ||= { impressions: 0, reach: 0, engaged: 0, profile_views: 0 };
        byDate[d].impressions += safeNum(m.impressions ?? m.page_impressions ?? 0);
        byDate[d].reach += safeNum(m.reach ?? 0);
        byDate[d].profile_views += safeNum(m.profile_views ?? 0);
        byDate[d].engaged += safeNum(m.page_engaged_users ?? 0);
      }
      const dates = Object.keys(byDate).sort();
      const daily = dates.map((d) => ({ date: d, ...byDate[d] }));
      social.available = daily.length > 0;

      const last30 = daily.slice(-30);
      social.totals30 = {
        impressions: last30.reduce((s, d) => s + safeNum(d.impressions), 0),
        reach: last30.reduce((s, d) => s + safeNum(d.reach), 0),
        engaged: last30.reduce((s, d) => s + safeNum(d.engaged), 0),
        profile_views: last30.reduce((s, d) => s + safeNum(d.profile_views), 0),
      };

      const last14 = daily.slice(-14);
      const prev7 = last14.slice(0, 7);
      const curr7 = last14.slice(7);
      const sum = (arr: any[], key: string) => arr.reduce((s, d) => s + safeNum(d[key]), 0);
      social.deltas7 = {
        impressions: pct(sum(curr7, 'impressions'), sum(prev7, 'impressions')),
        reach: pct(sum(curr7, 'reach'), sum(prev7, 'reach')),
        engaged: pct(sum(curr7, 'engaged'), sum(prev7, 'engaged')),
        profile_views: pct(sum(curr7, 'profile_views'), sum(prev7, 'profile_views')),
      };
    } catch (e: any) {
      if (isMissingTableError(e)) warnings.push('missing_table_social_account_metrics_daily');
      else warnings.push('social_metrics_failed');
    }

    // ---------------- Ads (best-effort) ----------------
    const ads = {
      available: false,
      totals: { total_spend: 0, total_impressions: 0, total_clicks: 0, total_conversions: 0, avg_roas: 0 },
    };
    try {
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
      ads.available = list.length > 0;
      ads.totals = {
        total_spend: total.total_spend,
        total_impressions: total.total_impressions,
        total_clicks: total.total_clicks,
        total_conversions: total.total_conversions,
        avg_roas: total.count ? total.avg_roas / total.count : 0,
      };
    } catch {
      // keep unavailable
    }

    // ---------------- Insights IA ----------------
    const insights = {
      available: false,
      total: 0,
      new: 0,
      latestTitles: [] as string[],
    };
    try {
      const { start, end } = getSaoPauloDayBoundsIso();
      const { data, error } = await admin
        .from('client_ai_insights')
        .select('id, status, title, created_at')
        .eq('client_id', clientId)
        .gte('created_at', start)
        .lte('created_at', end)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      const rows = data || [];
      insights.available = true;
      insights.total = rows.length;
      insights.new = rows.filter((r: any) => String(r.status) === 'novo').length;
      insights.latestTitles = rows.slice(0, 3).map((r: any) => String(r.title || '')).filter(Boolean);
    } catch (e: any) {
      if (isMissingTableError(e)) warnings.push('missing_table_client_ai_insights');
    }

    // ---------------- Concorrentes ----------------
    const competitors =
      Array.isArray((clientRow as any)?.competitors)
        ? ((clientRow as any).competitors as any[]).map((x) => String(x)).filter(Boolean)
        : typeof (clientRow as any)?.concorrentes === 'string'
          ? String((clientRow as any).concorrentes)
              .split(/[\n,;]+/g)
              .map((x) => x.trim())
              .filter(Boolean)
          : [];

    // ---------------- Billing (best-effort) ----------------
    let billing: any = { hasOpenInvoice: false };
    try {
      const { data, error } = await admin
        .from('invoices')
        .select('id, amount, due_date, status')
        .eq('client_id', clientId)
        .in('status', ['pending', 'overdue'])
        .order('due_date', { ascending: true })
        .limit(1);
      if (error) throw error;
      const inv = (data || [])[0];
      if (inv) {
        billing = {
          hasOpenInvoice: true,
          invoice: {
            id: String(inv.id),
            amount: Number(inv.amount) || 0,
            due_date: String(inv.due_date),
            status: String(inv.status),
          },
        };
      }
    } catch (e: any) {
      if (isMissingTableError(e)) warnings.push('missing_table_invoices');
    }

    // KPIs para dashboard (preferir Ads quando disponível)
    const kpis = {
      impressions: {
        value: ads.available ? ads.totals.total_impressions : social.totals30.impressions,
        change: social.deltas7.impressions,
      },
      clicks: {
        value: ads.available ? ads.totals.total_clicks : social.totals30.profile_views,
        change: ads.available ? 0 : social.deltas7.profile_views,
        label: ads.available ? 'Cliques (ads)' : 'Visitas ao perfil (social)',
      },
      conversions: {
        value: ads.available ? ads.totals.total_conversions : 0,
        change: 0,
      },
      spend: {
        value: ads.available ? ads.totals.total_spend : 0,
        change: 0,
      },
      roi: {
        value: ads.available ? ads.totals.avg_roas : 0,
        change: 0,
      },
    };

    return NextResponse.json({
      success: true,
      client: {
        id: clientId,
        company_name: String(clientRow?.company_name || ''),
        segment: String((clientRow as any)?.segment || ''),
        industry: String(clientRow?.industry || ''),
        competitors_count: competitors.length,
      },
      kpis,
      social,
      ads,
      insights,
      billing,
      warnings,
      generatedAt: new Date().toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
  }
}


