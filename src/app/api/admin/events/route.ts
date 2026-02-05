import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/events
 * Lista event_log (hub).
 */
export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { data: isAdmin, error: isAdminError } = await supabase.rpc('is_admin');
  if (isAdminError || !isAdmin) return NextResponse.json({ error: 'Acesso negado (admin)' }, { status: 403 });

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined; // pending | processed | error
    const eventType = searchParams.get('event_type') || undefined;
    const limit = Math.max(1, Math.min(500, Number(searchParams.get('limit') || 100)));

    let q = supabase
      .from('event_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) q = q.eq('status', status);
    if (eventType) q = q.eq('event_type', eventType);

    const { data, error } = await q;
    if (error) throw error;

    return NextResponse.json({ events: data || [] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
  }
}


