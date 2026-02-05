/**
 * API para Push Notifications
 * Gerencia criação e envio de notificações
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import {
  createNotification,
  notifyTaskAssignment,
  notifyNewMessage,
  notifyMention,
  notifyDeadlineApproaching,
  markNotificationAsRead,
  markAllAsRead,
  getUnreadNotifications,
} from '@/lib/notifications/pushService';

async function getAuthUser() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
  
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// GET - Buscar notificações do usuário
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');

    const db = getSupabaseAdmin();

    let query = db
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('[Notifications GET] Erro:', error);
      return NextResponse.json({ error: 'Erro ao buscar notificações' }, { status: 500 });
    }

    // Contar não lidas
    const { count: unreadCount } = await db
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    return NextResponse.json({
      success: true,
      notifications: notifications || [],
      unreadCount: unreadCount || 0,
    });

  } catch (error: any) {
    console.error('[Notifications GET] Erro:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro interno' },
      { status: 500 }
    );
  }
}

// POST - Criar nova notificação
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { action, ...params } = body;

    let result;

    switch (action) {
      case 'create':
        result = await createNotification({
          userId: params.userId || user.id,
          type: params.type || 'system',
          title: params.title,
          body: params.body,
          data: params.data,
          actionUrl: params.actionUrl,
          priority: params.priority,
        });
        break;

      case 'task_assigned':
        result = await notifyTaskAssignment({
          assigneeId: params.assigneeId,
          taskId: params.taskId,
          taskTitle: params.taskTitle,
          assignerName: params.assignerName,
          clientName: params.clientName,
        });
        break;

      case 'new_message':
        result = await notifyNewMessage({
          recipientId: params.recipientId,
          senderName: params.senderName,
          messagePreview: params.messagePreview,
          conversationType: params.conversationType,
          conversationId: params.conversationId,
          conversationName: params.conversationName,
        });
        break;

      case 'mention':
        result = await notifyMention({
          mentionedUserId: params.mentionedUserId,
          mentionerName: params.mentionerName,
          context: params.context,
          contextType: params.contextType,
          contextId: params.contextId,
        });
        break;

      case 'deadline':
        result = await notifyDeadlineApproaching({
          userId: params.userId,
          taskId: params.taskId,
          taskTitle: params.taskTitle,
          dueDate: params.dueDate,
          hoursRemaining: params.hoursRemaining,
        });
        break;

      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[Notifications POST] Erro:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro interno' },
      { status: 500 }
    );
  }
}

// PUT - Marcar notificação(ões) como lida(s)
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { notificationId, markAll } = body;

    let success = false;

    if (markAll) {
      success = await markAllAsRead(user.id);
    } else if (notificationId) {
      success = await markNotificationAsRead(notificationId);
    } else {
      return NextResponse.json({ error: 'Parâmetro inválido' }, { status: 400 });
    }

    return NextResponse.json({ success });

  } catch (error: any) {
    console.error('[Notifications PUT] Erro:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro interno' },
      { status: 500 }
    );
  }
}

// DELETE - Deletar notificação
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');

    if (!notificationId) {
      return NextResponse.json({ error: 'ID da notificação é obrigatório' }, { status: 400 });
    }

    const db = getSupabaseAdmin();

    const { error } = await db
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', user.id);

    if (error) {
      console.error('[Notifications DELETE] Erro:', error);
      return NextResponse.json({ error: 'Erro ao deletar notificação' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('[Notifications DELETE] Erro:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro interno' },
      { status: 500 }
    );
  }
}
