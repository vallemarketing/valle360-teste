import { NextRequest, NextResponse } from 'next/server';

export type CronAuthResult = NextResponse | null;

function isVercelCron(request: NextRequest): boolean {
  const hdr = String(request.headers.get('x-vercel-cron') || '').trim();
  if (hdr === '1') return true;

  // Heurística adicional (não é segurança forte, só compatibilidade)
  const ua = String(request.headers.get('user-agent') || '').toLowerCase();
  if (ua.includes('vercel-cron')) return true;

  return false;
}

/**
 * Autenticação para rotas de cron em produção:
 * - Aceita Vercel Cron (header `x-vercel-cron: 1`)
 * - OU `Authorization: Bearer ${CRON_SECRET}`
 */
export function requireCronAuth(request: NextRequest): CronAuthResult {
  if (process.env.NODE_ENV !== 'production') return null;

  const cronSecret = String(process.env.CRON_SECRET || '').trim();
  const authHeader = String(request.headers.get('authorization') || '').trim();

  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return null;
  if (isVercelCron(request)) return null;

  return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
}

export async function logCronRun(params: {
  supabase: any;
  action: string;
  status: 'ok' | 'error';
  durationMs: number;
  requestData?: any;
  responseData?: any;
  errorMessage?: string | null;
}) {
  try {
    await params.supabase.from('integration_logs').insert({
      integration_id: 'cron',
      action: params.action,
      status: params.status,
      request_data: params.requestData ?? null,
      response_data: params.responseData ?? null,
      error_message: params.errorMessage ?? null,
      duration_ms: Math.max(0, Math.floor(params.durationMs || 0)),
      created_at: new Date().toISOString(),
    });
  } catch {
    // best-effort (não derruba cron)
  }
}


