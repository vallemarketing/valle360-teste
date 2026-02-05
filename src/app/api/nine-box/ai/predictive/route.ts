import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { resolveNineBoxAccess } from '@/lib/rh/nineBoxAccess';

export const dynamic = 'force-dynamic';

function riskFromQuadrant(q: string) {
  if (q === 'Q1' || q === 'Q4') return 'high';
  if (q === 'Q7') return 'medium';
  return 'low';
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const access = await resolveNineBoxAccess({ supabase });
    if (!access.allowed) return NextResponse.json({ error: access.reason || 'Acesso negado' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const cycleId = searchParams.get('cycle_id');
    if (!cycleId) return NextResponse.json({ error: 'cycle_id é obrigatório' }, { status: 400 });

    const { data: currentRows, error } = await supabase
      .from('nine_box_assessments')
      .select(
        `
        id, employee_id, cycle_id,
        employee:employees(id, full_name, department, position),
        result:nine_box_results(performance_score, potential_score, quadrant)
      `
      )
      .eq('cycle_id', cycleId)
      .limit(2000);
    if (error) throw error;

    const current = (currentRows || []).filter((r: any) => r.result);
    const employeeIds = current.map((r: any) => String(r.employee_id));

    // Buscar "último resultado anterior" por colaborador (best-effort)
    let previousByEmployee: Record<string, any> = {};
    if (employeeIds.length) {
      const { data: prevRows } = await supabase
        .from('nine_box_assessments')
        .select(
          `
          employee_id,
          cycle_id,
          result:nine_box_results(performance_score, potential_score, quadrant, computed_at)
        `
        )
        .in('employee_id', employeeIds)
        .neq('cycle_id', cycleId)
        .limit(5000);

      // pega o "mais recente" por computed_at (se existir)
      const list = (prevRows || []).filter((r: any) => r.result);
      list.sort((a: any, b: any) => {
        const da = new Date(a.result.computed_at || 0).getTime();
        const db = new Date(b.result.computed_at || 0).getTime();
        return db - da;
      });
      for (const r of list) {
        const eid = String(r.employee_id);
        if (!previousByEmployee[eid]) previousByEmployee[eid] = r.result;
      }
    }

    const alerts = current.map((r: any) => {
      const eid = String(r.employee_id);
      const curr = r.result;
      const prev = previousByEmployee[eid] || null;
      const perfDelta = prev ? Number(curr.performance_score) - Number(prev.performance_score) : null;
      const potDelta = prev ? Number(curr.potential_score) - Number(prev.potential_score) : null;

      const risk = riskFromQuadrant(String(curr.quadrant));
      const trendRisk =
        perfDelta !== null && perfDelta <= -0.5 ? 'high' : perfDelta !== null && perfDelta <= -0.25 ? 'medium' : 'low';

      const riskLevel = risk === 'high' || trendRisk === 'high' ? 'high' : risk === 'medium' || trendRisk === 'medium' ? 'medium' : 'low';

      return {
        employee: r.employee,
        current: curr,
        previous: prev,
        deltas: { performance: perfDelta, potential: potDelta },
        riskLevel,
        reasons: [
          ...(risk !== 'low' ? [`Quadrante ${curr.quadrant}`] : []),
          ...(perfDelta !== null && perfDelta <= -0.5 ? ['Queda relevante de performance vs ciclo anterior'] : []),
        ],
      };
    });

    const summary = alerts.reduce(
      (acc: any, a: any) => {
        acc.total++;
        acc.byRisk[a.riskLevel] = (acc.byRisk[a.riskLevel] || 0) + 1;
        return acc;
      },
      { total: 0, byRisk: {} as Record<string, number> }
    );

    return NextResponse.json({ success: true, summary, alerts });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
  }
}


