import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { resolveNineBoxAccess } from '@/lib/rh/nineBoxAccess';
import { buildSimplePdf } from '@/lib/export/simplePdf';

export const dynamic = 'force-dynamic';

function safeStr(v: any) {
  if (v === null || v === undefined) return '';
  return String(v);
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

    const { data: cycle } = await supabase.from('nine_box_cycles').select('*').eq('id', cycleId).maybeSingle();

    const { data: points, error } = await supabase
      .from('nine_box_assessments')
      .select(
        `
        id, status, submitted_at, updated_at,
        employee:employees(id, full_name, department, position),
        result:nine_box_results(performance_score, potential_score, quadrant, recommendation)
      `
      )
      .eq('cycle_id', cycleId)
      .order('updated_at', { ascending: false })
      .limit(2000);
    if (error) throw error;

    const withResults = (points || []).filter((p: any) => p.result);
    const byQuadrant: Record<string, number> = {};
    for (const p of withResults as any[]) {
      const q = String(p.result.quadrant || '—');
      byQuadrant[q] = (byQuadrant[q] || 0) + 1;
    }

    const lines: string[] = [];
    lines.push(`Ciclo: ${safeStr((cycle as any)?.name || cycleId)} (${safeStr((cycle as any)?.status || '')})`);
    lines.push(`Gerado em: ${new Date().toISOString()}`);
    lines.push('');
    lines.push('Distribuição por quadrante:');
    const qs = ['Q9', 'Q8', 'Q7', 'Q6', 'Q5', 'Q4', 'Q3', 'Q2', 'Q1'];
    for (const q of qs) lines.push(`- ${q}: ${byQuadrant[q] || 0}`);
    lines.push('');
    lines.push('Amostra (até 60 colaboradores):');
    for (const p of (withResults as any[]).slice(0, 60)) {
      const emp = p.employee || {};
      const res = p.result || {};
      lines.push(
        `${safeStr(emp.full_name || emp.name || emp.id)} | ${safeStr(emp.department || '')} | ${safeStr(emp.position || '')} | ` +
          `Perf ${safeStr(res.performance_score)} / Pot ${safeStr(res.potential_score)} | ${safeStr(res.quadrant)}`
      );
    }
    if ((withResults as any[]).length > 60) lines.push(`... (${(withResults as any[]).length - 60} a mais)`);

    const pdf = buildSimplePdf({
      title: 'Relatório 9 Box (Matriz de Talentos)',
      lines,
    });

    const filename = `nine-box_${cycleId}.pdf`;
    const bytes = new Uint8Array(pdf);
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
  }
}


