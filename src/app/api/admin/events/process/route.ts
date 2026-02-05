import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';
import { handleEvent } from '@/lib/admin/eventHandlers';
import { markEventError, markEventProcessed } from '@/lib/admin/eventBus';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/events/process
 * Processa eventos pendentes no event_log (hub).
 * Requer usuário autenticado e admin.
 */
export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  const supabaseAuth = createRouteHandlerClient({ cookies: () => cookieStore });

  const { data: authData } = await supabaseAuth.auth.getUser();
  if (!authData.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { data: isAdmin, error: isAdminError } = await supabaseAuth.rpc('is_admin');
  if (isAdminError || !isAdmin) {
    return NextResponse.json({ error: 'Acesso negado (admin)' }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const limit = Math.max(1, Math.min(50, Number(body?.limit || 20)));

    const admin = getSupabaseAdmin();

    const { data: events, error } = await admin
      .from('event_log')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;

    let processed = 0;
    let failed = 0;

    for (const ev of events || []) {
      const handled = await handleEvent(ev as any);
      if (!handled.ok) {
        failed += 1;
        await markEventError((ev as any).id, handled.error, admin);
      } else {
        processed += 1;
        await markEventProcessed((ev as any).id, admin);
      }
    }

    return NextResponse.json({
      success: true,
      fetched: events?.length || 0,
      processed,
      failed,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
  }
}


