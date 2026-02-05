import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';
import { createMetaClient } from '@/lib/integrations/meta/client';
import { logCronRun, requireCronAuth } from '@/lib/cron/cronUtils';
import { requireAdmin } from '@/lib/auth/requireAdmin';

export const dynamic = 'force-dynamic';

function pickLatestMetricValue(values: Array<{ value: any; end_time?: string }> | undefined) {
  if (!Array.isArray(values) || values.length === 0) return null;
  const last = values[values.length - 1];
  return typeof last?.value === 'number' ? last.value : last?.value ?? null;
}

function isoDateUTC(d: Date) {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

async function handleSocialMetricsCron(request: NextRequest) {
  const started = Date.now();
  // GET: cron (Vercel); POST: admin manual. Mantemos o handler único e o auth é decidido no export.

  const admin = getSupabaseAdmin();
  const today = isoDateUTC(new Date());
  const nowIso = new Date().toISOString();

  // Busca contas conectadas (Meta/Instagram) com tokens - tabela legada
  const { data: rows, error } = await admin
    .from('social_connected_accounts')
    .select(
      `
      id,
      client_id,
      platform,
      external_account_id,
      status,
      social_connected_account_secrets (
        access_token,
        expires_at
      )
    `
    )
    .in('platform', ['instagram', 'facebook'])
    .limit(2000);

  // Também busca da nova tabela client_social_connections (OAuth Meta)
  const { data: newConnRows } = await admin
    .from('client_social_connections')
    .select('*')
    .in('platform', ['instagram', 'facebook'])
    .eq('is_active', true)
    .limit(2000);

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  // Mapear contas da tabela legada
  const accountsLegacy = (rows || []).map((r: any) => {
    const sec = Array.isArray(r?.social_connected_account_secrets)
      ? r.social_connected_account_secrets[0]
      : r.social_connected_account_secrets;
    return {
      id: String(r.id),
      client_id: String(r.client_id),
      platform: String(r.platform),
      external_account_id: String(r.external_account_id),
      status: String(r.status || 'active'),
      token: sec?.access_token ? String(sec.access_token) : '',
      expires_at: sec?.expires_at ? String(sec.expires_at) : null,
      source: 'legacy' as const,
    };
  });

  // Mapear contas da nova tabela (OAuth Meta)
  const accountsNew = (newConnRows || []).map((r: any) => ({
    id: String(r.id || r.account_id),
    client_id: String(r.client_id),
    platform: String(r.platform),
    external_account_id: String(r.account_id),
    status: 'active',
    token: r.access_token ? String(r.access_token) : '',
    expires_at: r.token_expires_at ? String(r.token_expires_at) : null,
    source: 'oauth' as const,
  }));

  // Combinar contas (evitar duplicatas por account_id + platform)
  const seenKeys = new Set<string>();
  const accounts = [...accountsNew, ...accountsLegacy].filter((a) => {
    const key = `${a.platform}:${a.external_account_id}`;
    if (seenKeys.has(key)) return false;
    seenKeys.add(key);
    return true;
  });

  let processed = 0;
  let upserted = 0;
  let expired = 0;
  const failures: Array<{ account_id: string; platform: string; error: string }> = [];

  try {
    for (const a of accounts) {
    if (!a.token) continue;
    processed++;

    // Atualiza status de expiração (best-effort)
    try {
      if (a.expires_at && new Date(a.expires_at).getTime() < Date.now()) {
        await admin.from('social_connected_accounts').update({ status: 'expired' }).eq('id', a.id);
        expired++;
      }
    } catch {
      // ignore
    }

      try {
      const meta = createMetaClient({ accessToken: a.token });

      let metrics: Record<string, any> = {};
      let raw: any = null;

      if (a.platform === 'instagram') {
        // Métricas básicas e estáveis para IG Business
        const resp = await meta.getInstagramInsights(a.external_account_id, ['impressions', 'reach', 'profile_views'], 'day');
        raw = resp;
        if ((resp as any)?.error) throw new Error((resp as any).error?.message || 'Erro Meta (instagram insights)');
        const dataArr = Array.isArray((resp as any)?.data) ? (resp as any).data : [];
        for (const m of dataArr) {
          const name = String(m?.name || '');
          metrics[name] = pickLatestMetricValue(m?.values);
        }
      } else if (a.platform === 'facebook') {
        // Métricas de página (necessita page access token)
        const resp = await meta.getPageInsights(a.external_account_id, a.token, ['page_impressions', 'page_engaged_users', 'page_fans'], 'day');
        raw = resp;
        if ((resp as any)?.error) throw new Error((resp as any).error?.message || 'Erro Meta (page insights)');
        const dataArr = Array.isArray((resp as any)?.data) ? (resp as any).data : [];
        for (const m of dataArr) {
          const name = String(m?.name || '');
          metrics[name] = pickLatestMetricValue(m?.values);
        }
      }

      // Upsert no banco (por conta + dia)
      const { error: upErr } = await admin
        .from('social_account_metrics_daily')
        .upsert(
          {
            client_id: a.client_id,
            account_id: a.id,
            platform: a.platform,
            metric_date: today,
            metrics,
            raw_payload: { collected_at: nowIso, platform: a.platform, metrics, raw },
          } as any,
          { onConflict: 'account_id,metric_date' }
        );
      if (upErr) throw upErr;
      upserted++;
      } catch (e: any) {
      failures.push({ account_id: a.id, platform: a.platform, error: e?.message || 'Falha ao coletar métricas' });
      }
    }

    const payload = {
      success: failures.length === 0,
      processed,
      upserted,
      expired,
      failed: failures.length,
      failures,
    };

    await logCronRun({
      supabase: admin,
      action: 'social-metrics',
      status: failures.length === 0 ? 'ok' : 'error',
      durationMs: Date.now() - started,
      responseData: { processed, upserted, expired, failed: failures.length },
      errorMessage: failures.length ? failures[0]?.error || 'Falhas ao coletar métricas' : null,
    });

    return NextResponse.json(payload);
  } catch (e: any) {
    await logCronRun({
      supabase: admin,
      action: 'social-metrics',
      status: 'error',
      durationMs: Date.now() - started,
      errorMessage: e?.message || 'Erro interno',
    });
    return NextResponse.json({ success: false, error: e?.message || 'Erro interno' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const auth = requireCronAuth(request);
  if (auth) return auth;
  return handleSocialMetricsCron(request);
}

export async function POST(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;
  return handleSocialMetricsCron(request);
}


