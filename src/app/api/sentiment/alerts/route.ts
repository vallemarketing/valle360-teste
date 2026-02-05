/**
 * Valle 360 - API de Alertas de Sentimento
 * Gerenciar alertas gerados automaticamente
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

export const dynamic = 'force-dynamic';

function isMissingTableError(message: string) {
  const m = String(message || '').toLowerCase();
  return (
    m.includes('does not exist') ||
    m.includes('relation') ||
    m.includes('schema cache') ||
    m.includes('could not find the table')
  );
}

// GET - Listar alertas
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { data: isAdmin } = await supabase.rpc('is_admin');
    if (!isAdmin) {
      return NextResponse.json({ error: 'Acesso negado (admin)' }, { status: 403 });
    }
    const db: any = getSupabaseAdmin();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');
    const client_id = searchParams.get('client_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = db
      .from('sentiment_alerts')
      .select('*, sentiment_analyses(*)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);
    if (severity) query = query.eq('severity', severity);
    if (client_id) query = query.eq('client_id', client_id);

    const { data, error, count } = await query;

    if (error) throw error;

    // Contar por status e severidade
    const [pendingCount, criticalCount, highCount] = await Promise.all([
      db.from('sentiment_alerts').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      db.from('sentiment_alerts').select('id', { count: 'exact', head: true }).eq('severity', 'critical').eq('status', 'pending'),
      db.from('sentiment_alerts').select('id', { count: 'exact', head: true }).eq('severity', 'high').eq('status', 'pending')
    ]);

    return NextResponse.json({
      success: true,
      data,
      stats: {
        pending: pendingCount.count || 0,
        critical: criticalCount.count || 0,
        high: highCount.count || 0
      },
      pagination: {
        total: count,
        limit,
        offset,
        has_more: count ? offset + limit < count : false
      }
    });

  } catch (error: any) {
    console.error('Erro ao buscar alertas:', error);
    if (isMissingTableError(error?.message || '')) {
      return NextResponse.json({
        success: true,
        data: [],
        stats: { pending: 0, critical: 0, high: 0 },
        pagination: { total: 0, limit: 50, offset: 0, has_more: false },
        note: 'Schema de sentimento ainda não foi aplicado no banco.',
      });
    }
    return NextResponse.json({ 
      error: 'Erro interno',
      details: error.message 
    }, { status: 500 });
  }
}

// PATCH - Atualizar status do alerta
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { data: isAdmin } = await supabase.rpc('is_admin');
    if (!isAdmin) {
      return NextResponse.json({ error: 'Acesso negado (admin)' }, { status: 403 });
    }
    const db: any = getSupabaseAdmin();

    const body = await request.json();
    const { 
      alert_id,
      action, // 'acknowledge', 'resolve', 'dismiss'
      resolution_notes
    } = body;

    if (!alert_id || !action) {
      return NextResponse.json({ 
        error: 'alert_id e action são obrigatórios' 
      }, { status: 400 });
    }

    let updateData: any = {
      updated_at: new Date().toISOString()
    };

    switch (action) {
      case 'acknowledge':
        updateData.status = 'acknowledged';
        updateData.acknowledged_at = new Date().toISOString();
        updateData.acknowledged_by = user.id;
        break;

      case 'resolve':
        updateData.status = 'resolved';
        updateData.resolved_at = new Date().toISOString();
        updateData.resolved_by = user.id;
        updateData.resolution_notes = resolution_notes;
        break;

      case 'dismiss':
        updateData.status = 'dismissed';
        updateData.resolved_at = new Date().toISOString();
        updateData.resolved_by = user.id;
        updateData.resolution_notes = resolution_notes || 'Alerta descartado';
        break;

      default:
        return NextResponse.json({ 
          error: 'Ação inválida. Use: acknowledge, resolve ou dismiss' 
        }, { status: 400 });
    }

    const { data, error } = await db
      .from('sentiment_alerts')
      .update(updateData)
      .eq('id', alert_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      alert: data
    });

  } catch (error: any) {
    console.error('Erro ao atualizar alerta:', error);
    return NextResponse.json({ 
      error: 'Erro interno',
      details: error.message 
    }, { status: 500 });
  }
}

// POST - Ações em lote
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { data: isAdmin } = await supabase.rpc('is_admin');
    if (!isAdmin) {
      return NextResponse.json({ error: 'Acesso negado (admin)' }, { status: 403 });
    }
    const db: any = getSupabaseAdmin();

    const body = await request.json();
    const { 
      action, // 'acknowledge_all', 'resolve_all', 'dismiss_all'
      alert_ids, // Array de IDs específicos (opcional)
      filter // Filtro para seleção
    } = body;

    if (!action) {
      return NextResponse.json({ 
        error: 'action é obrigatório' 
      }, { status: 400 });
    }

    let updateData: any = {
      updated_at: new Date().toISOString()
    };

    switch (action) {
      case 'acknowledge_all':
        updateData.status = 'acknowledged';
        updateData.acknowledged_at = new Date().toISOString();
        updateData.acknowledged_by = user.id;
        break;

      case 'resolve_all':
        updateData.status = 'resolved';
        updateData.resolved_at = new Date().toISOString();
        updateData.resolved_by = user.id;
        break;

      case 'dismiss_all':
        updateData.status = 'dismissed';
        updateData.resolved_at = new Date().toISOString();
        updateData.resolved_by = user.id;
        break;

      default:
        return NextResponse.json({ 
          error: 'Ação inválida' 
        }, { status: 400 });
    }

    let query = db
      .from('sentiment_alerts')
      .update(updateData);

    // Aplicar filtro
    if (alert_ids && Array.isArray(alert_ids)) {
      query = query.in('id', alert_ids);
    } else if (filter) {
      if (filter.status) query = query.eq('status', filter.status);
      if (filter.severity) query = query.eq('severity', filter.severity);
      if (filter.client_id) query = query.eq('client_id', filter.client_id);
    } else {
      // Se não houver filtro, aplicar apenas aos pendentes
      query = query.eq('status', 'pending');
    }

    const { data, error, count } = await query.select();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      updated_count: data?.length || 0,
      alerts: data
    });

  } catch (error: any) {
    console.error('Erro ao processar ação em lote:', error);
    return NextResponse.json({ 
      error: 'Erro interno',
      details: error.message 
    }, { status: 500 });
  }
}

