/**
 * Valle 360 - API de Notificações
 * Gerencia notificações em tempo real
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

type NotificationRow = {
  id: string;
  user_id: string | null;
  title: string;
  message: string;
  type: string;
  is_read: boolean | null;
  read_at: string | null;
  link: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
};

// GET - Buscar notificações (inclui broadcast user_id = null)
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { data: isAdmin } = await supabase.rpc('is_admin');

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const baseFilter = `user_id.eq.${user.id},user_id.is.null`;

    const listQuery = supabase
      .from('notifications')
      .select('*')
      .or(baseFilter)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly) {
      listQuery.eq('is_read', false);
    }

    const { data: rows, error: listError } = await listQuery;

    if (listError) throw listError;

    // Filtrar apenas broadcasts "por área" (user_id = null) para não-admins.
    // Notificações direcionadas ao usuário (user_id = auth.uid) devem continuar visíveis.
    const filtered = (rows || []).filter((n: any) => {
      const audience = n?.metadata?.audience;
      if (!isAdmin && audience === 'area' && (n.user_id === null || n.user_id === undefined)) return false;
      return true;
    });

    const notifications = filtered.map((n: any) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      read: Boolean(n.is_read),
      created_at: n.created_at,
      link: n.link || null,
      metadata: n.metadata || null,
      user_id: n.user_id ?? null,
    }));

    // unreadCount: calcular com base no que o usuário pode ver (inclui broadcast, mas exclui audience=area se não for admin)
    const unreadRowsQuery = supabase
      .from('notifications')
      .select('*')
      .or(baseFilter)
      .eq('is_read', false)
      .limit(200);

    const { data: unreadRows, error: unreadErr } = await unreadRowsQuery;
    if (unreadErr) throw unreadErr;

    const unreadCount = (unreadRows || []).filter((n: any) => {
      const audience = n?.metadata?.audience;
      if (!isAdmin && audience === 'area' && (n.user_id === null || n.user_id === undefined)) return false;
      return true;
    }).length;

    return NextResponse.json({ success: true, notifications, unreadCount: unreadCount || 0 });

  } catch (error: any) {
    console.error('Erro ao buscar notificações:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Marcar como lida / marcar todas como lidas
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { action, notificationId } = body || {};

    if (action === 'mark_all_read') {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .eq('is_read', false);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === 'mark_read') {
      if (!notificationId) {
        return NextResponse.json({ error: 'notificationId obrigatório' }, { status: 400 });
      }

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .or(`user_id.eq.${user.id},user_id.is.null`);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });

  } catch (error: any) {
    console.error('Erro na API de notificações:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
