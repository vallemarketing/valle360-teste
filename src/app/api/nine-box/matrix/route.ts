import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { resolveNineBoxAccess } from '@/lib/rh/nineBoxAccess';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const access = await resolveNineBoxAccess({ supabase });
    if (!access.allowed) return NextResponse.json({ error: access.reason || 'Acesso negado' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const cycleId = searchParams.get('cycle_id');
    if (!cycleId) return NextResponse.json({ error: 'cycle_id é obrigatório' }, { status: 400 });

    const { data, error } = await supabase
      .from('nine_box_assessments')
      .select(
        `
        id, cycle_id, employee_id, reviewer_user_id, status, submitted_at, updated_at,
        employee:employees(id, full_name, department, position, manager_id),
        result:nine_box_results(performance_score, potential_score, performance_level, potential_level, quadrant, recommendation)
      `
      )
      .eq('cycle_id', cycleId)
      .order('updated_at', { ascending: false })
      .limit(2000);
    if (error) throw error;

    const points = (data || []).filter((x: any) => x.result);
    const counts: Record<string, number> = {};
    for (const p of points as any[]) {
      const q = String(p?.result?.quadrant || 'unknown');
      counts[q] = (counts[q] || 0) + 1;
    }

    return NextResponse.json({ success: true, points, counts });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
  }
}


