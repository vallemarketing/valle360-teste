/**
 * Valle 360 - API de Processamento da Fila de Sentimento
 * Endpoint para processar itens pendentes na fila
 */

import { NextRequest, NextResponse } from 'next/server';
import { processNextInQueue, processAllPending } from '@/lib/ai/sentiment-automation';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

export const dynamic = 'force-dynamic';

// Verificar API Key para cron jobs
function verifyCronKey(request: NextRequest): boolean {
  const cronKey = request.headers.get('x-cron-key') || 
                  request.headers.get('authorization')?.replace('Bearer ', '');
  
  const validKey = process.env.CRON_SECRET || process.env.VERCEL_CRON_SECRET;
  
  // Em desenvolvimento, aceitar qualquer key
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  return cronKey === validKey;
}

async function isAdminSession(request: NextRequest): Promise<boolean> {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data } = await supabase.auth.getUser();
    if (!data?.user?.id) return false;
    const { data: isAdmin } = await supabase.rpc('is_admin');
    return !!isAdmin;
  } catch {
    return false;
  }
}

// POST - Processar fila (chamado por cron ou manualmente)
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação: cron secret OU sessão admin
    const ok = verifyCronKey(request) || (await isAdminSession(request));
    if (!ok) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        message: 'Cron key inválida (ou sessão admin ausente)'
      }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { 
      mode = 'batch', // 'single' ou 'batch'
      max_items = 50
    } = body;

    if (mode === 'single') {
      // Processar um único item
      const result = await processNextInQueue();

      return NextResponse.json({
        success: true,
        mode: 'single',
        processed: result !== null,
        result: result ? {
          id: result.id,
          source_type: result.source_type,
          overall_sentiment: result.overall_sentiment,
          score: result.score,
          alert_generated: result.alert_generated
        } : null
      });
    }

    // Processar batch
    const results = await processAllPending(max_items);

    return NextResponse.json({
      success: true,
      mode: 'batch',
      ...results
    });

  } catch (error: any) {
    console.error('Erro ao processar fila:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      message: error.message
    }, { status: 500 });
  }
}

// GET - Status da fila
export async function GET(request: NextRequest) {
  try {
    // Buscar estatísticas da fila (admin usa service role para evitar drift de RLS)
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data } = await supabase.auth.getUser();
    if (!data?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const { data: isAdmin } = await supabase.rpc('is_admin');
    if (!isAdmin) {
      return NextResponse.json({ error: 'Acesso negado (admin)' }, { status: 403 });
    }
    const db: any = getSupabaseAdmin();

    const [pendingResult, processingResult, failedResult, completedTodayResult] = await Promise.all([
      db
        .from('sentiment_processing_queue')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
      db
        .from('sentiment_processing_queue')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'processing'),
      db
        .from('sentiment_processing_queue')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'failed'),
      db
        .from('sentiment_processing_queue')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('completed_at', new Date().toISOString().split('T')[0])
    ]);

    return NextResponse.json({
      queue_status: {
        pending: pendingResult.count || 0,
        processing: processingResult.count || 0,
        failed: failedResult.count || 0,
        completed_today: completedTodayResult.count || 0
      }
    });

  } catch (error: any) {
    console.error('Erro ao buscar status da fila:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      message: error.message
    }, { status: 500 });
  }
}

