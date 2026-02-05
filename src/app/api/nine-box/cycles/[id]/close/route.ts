import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { resolveNineBoxAccess } from '@/lib/rh/nineBoxAccess';

export const dynamic = 'force-dynamic';

export async function POST(_: NextRequest, ctx: { params: { id: string } }) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const access = await resolveNineBoxAccess({ supabase });
    if (!access.allowed) return NextResponse.json({ error: access.reason || 'Acesso negado' }, { status: 403 });

    const id = String(ctx.params.id);
    const { data: existing, error: fetchErr } = await supabase.from('nine_box_cycles').select('status').eq('id', id).maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!existing) return NextResponse.json({ error: 'Ciclo não encontrado' }, { status: 404 });

    const { data, error } = await supabase
      .from('nine_box_cycles')
      .update({ status: 'closed' } as any)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, cycle: data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
  }
}


