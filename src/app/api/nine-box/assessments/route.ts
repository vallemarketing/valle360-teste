import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { resolveNineBoxAccess } from '@/lib/rh/nineBoxAccess';
import { levelFromScore, quadrantFromLevels, round2, weightedAverage } from '@/lib/rh/nineBoxScoring';

export const dynamic = 'force-dynamic';

const ResponseSchema = z.object({
  criterion_id: z.string().uuid(),
  score: z.number().int().min(1).max(5),
  comment: z.string().optional().nullable(),
});

const UpsertAssessmentSchema = z.object({
  cycle_id: z.string().uuid(),
  employee_id: z.string().uuid(),
  reviewer_user_id: z.string().uuid().optional().nullable(),
  status: z.enum(['draft', 'submitted']).optional(),
  notes: z.string().optional().nullable(),
  responses: z.array(ResponseSchema).optional(),
});

function recommendationForQuadrant(q: string) {
  const map: Record<string, string> = {
    Q1: 'Prioridade: plano de melhoria imediato, alinhamento de expectativas e acompanhamento semanal.',
    Q2: 'Reforçar consistência: coaching e metas claras para elevar performance.',
    Q3: 'Baixo potencial com alta performance: manter, reconhecer e explorar especialização técnica.',
    Q4: 'Potencial médio e baixa performance: identificar bloqueios, treinar e definir plano de curto prazo.',
    Q5: 'Centro: manter desenvolvimento contínuo e objetivos progressivos.',
    Q6: 'Boa performance: ampliar desafios e preparar para responsabilidades maiores.',
    Q7: 'Alto potencial, baixa performance: focar em fit de função, mentoria e plano estruturado.',
    Q8: 'Alto potencial e performance média: acelerar desenvolvimento e oportunidades de liderança.',
    Q9: 'Top talent: retenção, crescimento acelerado e trilha de liderança.',
  };
  return map[q] || 'Plano de desenvolvimento recomendado conforme quadrante.';
}

async function recomputeResults(supabase: any, assessmentId: string) {
  const { data: rows, error } = await supabase
    .from('nine_box_responses')
    .select('score, comment, criterion:nine_box_criteria(axis, weight)')
    .eq('assessment_id', assessmentId)
    .limit(500);
  if (error) throw error;

  const performanceItems: Array<{ score: number; weight: number }> = [];
  const potentialItems: Array<{ score: number; weight: number }> = [];

  for (const r of rows || []) {
    const axis = String((r as any)?.criterion?.axis || '');
    const w = Number((r as any)?.criterion?.weight || 0);
    const s = Number((r as any)?.score || 1);
    if (axis === 'performance') performanceItems.push({ score: s, weight: w });
    if (axis === 'potential') potentialItems.push({ score: s, weight: w });
  }

  const performanceScore = weightedAverage(performanceItems);
  const potentialScore = weightedAverage(potentialItems);
  const perfLevel = levelFromScore(performanceScore);
  const potLevel = levelFromScore(potentialScore);
  const quadrant = quadrantFromLevels(perfLevel, potLevel);

  const payload = {
    assessment_id: assessmentId,
    performance_score: round2(performanceScore),
    potential_score: round2(potentialScore),
    performance_level: perfLevel,
    potential_level: potLevel,
    quadrant,
    recommendation: recommendationForQuadrant(quadrant),
    computed_at: new Date().toISOString(),
  };

  const { data: resultRow, error: upErr } = await supabase
    .from('nine_box_results')
    .upsert(payload as any, { onConflict: 'assessment_id' })
    .select('*')
    .single();
  if (upErr) throw upErr;
  return resultRow;
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const access = await resolveNineBoxAccess({ supabase });
    if (!access.allowed) return NextResponse.json({ error: access.reason || 'Acesso negado' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const cycleId = searchParams.get('cycle_id');
    const employeeId = searchParams.get('employee_id');
    const status = searchParams.get('status');

    let q = supabase
      .from('nine_box_assessments')
      .select(
        `
        *,
        employee:employees(id, full_name, department, position),
        result:nine_box_results(*)
      `
      )
      .order('updated_at', { ascending: false });

    if (cycleId) q = q.eq('cycle_id', cycleId);
    if (employeeId) q = q.eq('employee_id', employeeId);
    if (status) q = q.eq('status', status);

    const { data, error } = await q.limit(500);
    if (error) throw error;

    return NextResponse.json({ success: true, assessments: data || [] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const access = await resolveNineBoxAccess({ supabase });
    if (!access.allowed) return NextResponse.json({ error: access.reason || 'Acesso negado' }, { status: 403 });

    const body = UpsertAssessmentSchema.parse(await request.json());
    const reviewerUserId = body.reviewer_user_id || access.userId;

    // Upsert da avaliação
    const { data: assessment, error: upErr } = await supabase
      .from('nine_box_assessments')
      .upsert(
        {
          cycle_id: body.cycle_id,
          employee_id: body.employee_id,
          reviewer_user_id: reviewerUserId,
          status: body.status || 'draft',
          notes: body.notes || null,
          submitted_at: body.status === 'submitted' ? new Date().toISOString() : null,
        } as any,
        { onConflict: 'cycle_id,employee_id,reviewer_user_id' }
      )
      .select('*')
      .single();
    if (upErr) throw upErr;

    // Upsert respostas
    if (body.responses && body.responses.length) {
      const upserts = body.responses.map((r) => ({
        assessment_id: assessment.id,
        criterion_id: r.criterion_id,
        score: r.score,
        comment: r.comment || null,
      }));

      const { error: respErr } = await supabase
        .from('nine_box_responses')
        .upsert(upserts as any, { onConflict: 'assessment_id,criterion_id' });
      if (respErr) throw respErr;
    }

    let result = null;
    if (body.status === 'submitted') {
      // regra: justificativa obrigatória para notas 1/2/5
      const { data: respRows } = await supabase
        .from('nine_box_responses')
        .select('score, comment')
        .eq('assessment_id', assessment.id)
        .limit(500);

      const missing = (respRows || []).filter((r: any) => [1, 2, 5].includes(Number(r.score)) && !String(r.comment || '').trim());
      if (missing.length) {
        return NextResponse.json({ error: 'Justificativa obrigatória para notas 1, 2 e 5.' }, { status: 400 });
      }

      result = await recomputeResults(supabase, assessment.id);
    }

    return NextResponse.json({ success: true, assessment, result });
  } catch (e: any) {
    if (e?.name === 'ZodError') return NextResponse.json({ error: 'Payload inválido', details: e.errors }, { status: 400 });
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
  }
}


