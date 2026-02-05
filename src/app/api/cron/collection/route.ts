import { NextRequest, NextResponse } from 'next/server';
import { runAutoCollection } from '@/lib/ai/collectionBot';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';
import { logCronRun, requireCronAuth } from '@/lib/cron/cronUtils';
import { requireAdmin } from '@/lib/auth/requireAdmin';

export const dynamic = 'force-dynamic';

// Esta rota deve ser chamada por um cron job (ex: Vercel Cron)
// Configurar em vercel.json:
// {
//   "crons": [{
//     "path": "/api/cron/collection",
//     "schedule": "0 9,14,18 * * *"
//   }]
// }

export async function GET(request: NextRequest) {
  const started = Date.now();
  const auth = requireCronAuth(request);
  if (auth) return auth;

  const admin = getSupabaseAdmin();
  try {
    console.log('Iniciando cobrança automática...');
    
    const result = await runAutoCollection();
    
    console.log(`Cobrança finalizada: ${result.sent} enviadas, ${result.failed} falhas`);

    await logCronRun({
      supabase: admin,
      action: 'collection',
      status: (result?.failed || 0) > 0 ? 'error' : 'ok',
      durationMs: Date.now() - started,
      responseData: { sent: result.sent, failed: result.failed },
      errorMessage: (result?.failed || 0) > 0 ? 'Falhas na cobrança automática' : null,
    });

    return NextResponse.json({
      success: true,
      message: 'Cobrança automática executada',
      result
    });

  } catch (error: any) {
    console.error('Erro na cobrança automática:', error);
    await logCronRun({
      supabase: admin,
      action: 'collection',
      status: 'error',
      durationMs: Date.now() - started,
      errorMessage: error?.message || 'Erro interno ao executar cobrança',
    });
    return NextResponse.json(
      { error: 'Erro interno ao executar cobrança' },
      { status: 500 }
    );
  }
}

// POST para executar manualmente (admin)
export async function POST(request: NextRequest) {
  const started = Date.now();
  const admin = getSupabaseAdmin();
  try {
    const gate = await requireAdmin(request);
    if (!gate.ok) return gate.res;
    
    const result = await runAutoCollection();

    await logCronRun({
      supabase: admin,
      action: 'collection',
      status: (result?.failed || 0) > 0 ? 'error' : 'ok',
      durationMs: Date.now() - started,
      requestData: { manual: true, by: gate.userId },
      responseData: { sent: result.sent, failed: result.failed },
      errorMessage: (result?.failed || 0) > 0 ? 'Falhas na cobrança manual' : null,
    });

    return NextResponse.json({
      success: true,
      message: 'Cobrança manual executada',
      result
    });

  } catch (error: any) {
    console.error('Erro na cobrança manual:', error);
    await logCronRun({
      supabase: admin,
      action: 'collection',
      status: 'error',
      durationMs: Date.now() - started,
      errorMessage: error?.message || 'Erro interno ao executar cobrança',
    });
    return NextResponse.json(
      { error: 'Erro interno ao executar cobrança' },
      { status: 500 }
    );
  }
}









