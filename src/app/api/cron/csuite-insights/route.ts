import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';
import { logCronRun, requireCronAuth } from '@/lib/cron/cronUtils';
import { EXECUTIVE_ROLES } from '@/lib/csuite/executiveTypes';
import { generateInsights } from '@/lib/csuite/insightsGenerator';
import { requireAdmin } from '@/lib/auth/requireAdmin';

export const dynamic = 'force-dynamic';

async function runCsuiteInsights(params: { actorUserId: string | null; requestData: any }) {
  let created = 0;
  const perRole: any[] = [];

  for (const role of EXECUTIVE_ROLES) {
    const includeMarket = role === 'cmo'; // mercado pesa mais no CMO
    const res = await generateInsights({ role, actorUserId: params.actorUserId, includeMarket });
    created += res.created;
    perRole.push({ role, created: res.created, warning: res.warning || null });
  }

  return { created, perRole, requestData: params.requestData };
}

// Vercel Cron chama via GET. Mantemos GET protegido por requireCronAuth.
export async function GET(request: NextRequest) {
  const started = Date.now();
  const cronGate = requireCronAuth(request);
  if (cronGate) return cronGate;

  const admin = getSupabaseAdmin();
  try {
    const result = await runCsuiteInsights({ actorUserId: null, requestData: { source: 'cron' } });
    await logCronRun({
      supabase: admin,
      action: 'csuite_insights',
      status: 'ok',
      durationMs: Date.now() - started,
      requestData: result.requestData,
      responseData: { created: result.created, perRole: result.perRole },
    });
    return NextResponse.json({ success: true, created: result.created, perRole: result.perRole });
  } catch (e: any) {
    await logCronRun({
      supabase: admin,
      action: 'csuite_insights',
      status: 'error',
      durationMs: Date.now() - started,
      requestData: { source: 'cron' },
      responseData: null,
      errorMessage: String(e?.message || 'erro'),
    });
    return NextResponse.json({ success: false, error: String(e?.message || 'erro') }, { status: 500 });
  }
}

// POST manual (admin) — útil para QA dentro do painel
export async function POST(request: NextRequest) {
  const started = Date.now();
  const admin = getSupabaseAdmin();
  try {
    const gate = await requireAdmin(request);
    if (!gate.ok) return gate.res;

    const result = await runCsuiteInsights({ actorUserId: gate.userId, requestData: { manual: true, by: gate.userId } });
    await logCronRun({
      supabase: admin,
      action: 'csuite_insights',
      status: 'ok',
      durationMs: Date.now() - started,
      requestData: result.requestData,
      responseData: { created: result.created, perRole: result.perRole },
    });
    return NextResponse.json({ success: true, created: result.created, perRole: result.perRole });
  } catch (e: any) {
    await logCronRun({
      supabase: admin,
      action: 'csuite_insights',
      status: 'error',
      durationMs: Date.now() - started,
      requestData: { manual: true },
      responseData: null,
      errorMessage: String(e?.message || 'erro'),
    });
    return NextResponse.json({ success: false, error: String(e?.message || 'erro') }, { status: 500 });
  }
}

