import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { resolveNineBoxAccess } from '@/lib/rh/nineBoxAccess';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(_: NextRequest, ctx: { params: { id: string } }) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const access = await resolveNineBoxAccess({ supabase });
    if (!access.allowed) return NextResponse.json({ error: access.reason || 'Acesso negado' }, { status: 403 });

    const id = String(ctx.params.id);
    const { data: cycle, error: fetchErr } = await supabase.from('nine_box_cycles').select('*').eq('id', id).maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!cycle) return NextResponse.json({ error: 'Ciclo não encontrado' }, { status: 404 });
    if (cycle.status === 'closed') return NextResponse.json({ error: 'Ciclo fechado não pode ser reaberto' }, { status: 400 });

    const { data: updated, error } = await supabase
      .from('nine_box_cycles')
      .update({ status: 'open' } as any)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;

    // Notificar RH (best-effort) usando schema real de `notifications` (user_id/type/link/metadata)
    try {
      const admin = getSupabaseAdmin();
      // tenta usar employees.areas (novo) e fallback por department (antigo)
      const { data: rhEmps } = await admin
        .from('employees')
        .select('user_id, department, areas')
        .or('department.eq.hr,department.ilike.%rh%')
        .limit(500);

      const recipients = (rhEmps || [])
        .map((e: any) => String(e.user_id || ''))
        .filter(Boolean);

      if (recipients.length) {
        await admin.from('notifications').insert(
          recipients.map((userId) => ({
            user_id: userId,
            type: 'nine_box_cycle_open',
            title: 'Ciclo 9 Box aberto',
            message: `O ciclo "${updated.name}" foi aberto e está pronto para avaliações.`,
            link: `/admin/rh/nine-box?cycle=${encodeURIComponent(updated.id)}`,
            metadata: { module: 'nine_box', cycle_id: updated.id },
            created_at: new Date().toISOString(),
          })) as any
        );
      }
    } catch {
      // ignore
    }

    return NextResponse.json({ success: true, cycle: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
  }
}


