import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { resolveNineBoxAccess } from '@/lib/rh/nineBoxAccess';

export const dynamic = 'force-dynamic';

export async function GET(_: NextRequest, ctx: { params: { id: string } }) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const access = await resolveNineBoxAccess({ supabase });
    if (!access.allowed) return NextResponse.json({ error: access.reason || 'Acesso negado' }, { status: 403 });

    const employeeId = String(ctx.params.id);
    const { data, error } = await supabase
      .from('nine_box_assessments')
      .select(
        `
        id, cycle_id, status, submitted_at, updated_at,
        cycle:nine_box_cycles(id, name, status, starts_at, ends_at),
        result:nine_box_results(performance_score, potential_score, quadrant, performance_level, potential_level, computed_at)
      `
      )
      .eq('employee_id', employeeId)
      .order('updated_at', { ascending: false })
      .limit(200);
    if (error) throw error;

    return NextResponse.json({ success: true, history: data || [] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
  }
}


