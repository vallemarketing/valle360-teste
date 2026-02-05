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
        id, cycle_id, employee_id, status,
        employee:employees(id, full_name, department, position),
        result:nine_box_results(performance_score, potential_score, quadrant)
      `
      )
      .eq('cycle_id', cycleId)
      .limit(5000);
    if (error) throw error;

    const withResults = (data || []).filter((x: any) => x.result);

    const byQuadrant: Record<string, number> = {};
    const byDepartment: Record<string, number> = {};
    let perfSum = 0;
    let potSum = 0;

    const alerts: any[] = [];

    for (const row of withResults as any[]) {
      const q = String(row.result.quadrant);
      byQuadrant[q] = (byQuadrant[q] || 0) + 1;

      const dept = String(row.employee?.department || 'Sem departamento');
      byDepartment[dept] = (byDepartment[dept] || 0) + 1;

      perfSum += Number(row.result.performance_score || 0);
      potSum += Number(row.result.potential_score || 0);

      // alertas foco (Q1/Q4/Q7)
      if (q === 'Q1' || q === 'Q4' || q === 'Q7') {
        alerts.push({
          quadrant: q,
          employee: row.employee,
          performance_score: row.result.performance_score,
          potential_score: row.result.potential_score,
          assessment_id: row.id,
        });
      }
    }

    const total = withResults.length;
    const averages = {
      performance: total ? Math.round((perfSum / total) * 100) / 100 : null,
      potential: total ? Math.round((potSum / total) * 100) / 100 : null,
    };

    return NextResponse.json({
      success: true,
      totals: { results: total, assessments: (data || []).length },
      averages,
      byQuadrant,
      byDepartment,
      alerts,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
  }
}


