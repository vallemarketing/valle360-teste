import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { resolveNineBoxAccess } from '@/lib/rh/nineBoxAccess';
import { buildXlsx } from '@/lib/export/xlsx';

export const dynamic = 'force-dynamic';

function safeStr(v: any) {
  if (v === null || v === undefined) return '';
  return String(v);
}

function resolveEmployee(raw: any): any | null {
  if (!raw) return null;
  return Array.isArray(raw) ? raw[0] || null : raw;
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

    const { data: rows, error } = await supabase
      .from('nine_box_assessments')
      .select(
        `
        id, status, submitted_at, updated_at,
        employee:employees(id, full_name, department, position),
        result:nine_box_results(performance_score, potential_score, performance_level, potential_level, quadrant)
      `
      )
      .eq('cycle_id', cycleId)
      .order('updated_at', { ascending: false })
      .limit(5000);
    if (error) throw error;

    const { data: items } = await supabase
      .from('nine_box_action_items')
      .select('title, description, status, due_date, employee_id')
      .eq('cycle_id', cycleId)
      .order('created_at', { ascending: false })
      .limit(5000);

    const header = [
      ['Ciclo', safeStr((cycle as any)?.name || cycleId)],
      ['Status', safeStr((cycle as any)?.status || '')],
      ['Gerado em', new Date().toISOString()],
    ];

    const sheetMatrix: any[][] = [
      ['Colaborador', 'Departamento', 'Cargo', 'Status', 'Desempenho', 'Potencial', 'Quadrante', 'Atualizado em', 'Submetido em'],
      ...(rows || []).map((r: any) => {
        const emp = resolveEmployee((r as any)?.employee);
        return [
          safeStr(emp?.full_name || emp?.name || emp?.id),
          safeStr(emp?.department || ''),
          safeStr(emp?.position || ''),
          safeStr(r.status || ''),
          r.result ? Number(r.result.performance_score) : '',
          r.result ? Number(r.result.potential_score) : '',
          safeStr(r.result?.quadrant || ''),
          safeStr(r.updated_at || ''),
          safeStr(r.submitted_at || ''),
        ];
      }),
    ];

    const sheetActions: any[][] = [
      ['Colaborador', 'Título', 'Descrição', 'Status', 'Vencimento'],
      ...(items || []).map((it: any) => {
        const hit = (rows || []).find((r: any) => {
          const emp = resolveEmployee((r as any)?.employee);
          return String(emp?.id || '') === String(it.employee_id || '');
        });
        const emp = resolveEmployee((hit as any)?.employee);
        return [
          safeStr(emp?.full_name || emp?.name || it.employee_id),
          safeStr(it.title),
          safeStr(it.description || ''),
          safeStr(it.status || ''),
          safeStr(it.due_date || ''),
        ];
      }),
    ];

    const xlsx = buildXlsx({
      sheets: [
        { name: 'Resumo', rows: [['Campo', 'Valor'], ...header] },
        { name: 'Matriz', rows: sheetMatrix },
        { name: 'Plano_de_Acao', rows: sheetActions },
      ],
    });

    const filename = `nine-box_${cycleId}.xlsx`;
    const bytes = new Uint8Array(xlsx);
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
  }
}


