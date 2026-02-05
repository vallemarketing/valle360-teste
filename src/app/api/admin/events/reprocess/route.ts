import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';
import { handleEvent } from '@/lib/admin/eventHandlers';
import { markEventError, markEventProcessed } from '@/lib/admin/eventBus';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/events/reprocess
 * Reprocessa um evento específico do event_log (admin-only).
 * body: { id }
 */
export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  const supabaseAuth = createRouteHandlerClient({ cookies: () => cookieStore });

  const { data: authData } = await supabaseAuth.auth.getUser();
  if (!authData.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { data: isAdmin, error: isAdminError } = await supabaseAuth.rpc('is_admin');
  if (isAdminError || !isAdmin) return NextResponse.json({ error: 'Acesso negado (admin)' }, { status: 403 });

  try {
    const body = await request.json();
    const id = body?.id as string | undefined;
    if (!id) return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 });

    const admin = getSupabaseAdmin();

    const { data: ev, error } = await admin.from('event_log').select('*').eq('id', id).single();
    if (error || !ev) return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });

    // Reset para pending (best-effort)
    await admin
      .from('event_log')
      .update({ status: 'pending', error_message: null, processed_at: null })
      .eq('id', id);

    const handled = await handleEvent(ev as any);
    if (!handled.ok) {
      await markEventError(id, handled.error, admin);
      return NextResponse.json({ success: false, status: 'error', error: handled.error });
    }

    await markEventProcessed(id, admin);
    return NextResponse.json({ success: true, status: 'processed' });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
  }
}


