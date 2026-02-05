import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { resolveNineBoxAccess } from '@/lib/rh/nineBoxAccess';
import { levelFromScore, quadrantFromLevels, round2, weightedAverage } from '@/lib/rh/nineBoxScoring';

export const dynamic = 'force-dynamic';

const PutSchema = z.object({
  status: z.enum(['draft', 'submitted']).optional(),
  notes: z.string().optional().nullable(),
  responses: z
    .array(
      z.object({
        criterion_id: z.string().uuid(),
        score: z.number().int().min(1).max(5),
        comment: z.string().optional().nullable(),
      })
    )
    .optional(),
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

export async function GET(_: NextRequest, ctx: { params: { id: string } }) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const access = await resolveNineBoxAccess({ supabase });
    if (!access.allowed) return NextResponse.json({ error: access.reason || 'Acesso negado' }, { status: 403 });

    const id = String(ctx.params.id);
    const { data: assessment, error } = await supabase
      .from('nine_box_assessments')
      .select(
        `
        *,
        employee:employees(id, full_name, department, position),
        result:nine_box_results(*)
      `
      )
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!assessment) return NextResponse.json({ error: 'Avaliação não encontrada' }, { status: 404 });

    const { data: responses, error: respErr } = await supabase
      .from('nine_box_responses')
      .select('*, criterion:nine_box_criteria(id, axis, key, label, description, weight)')
      .eq('assessment_id', id)
      .limit(500);
    if (respErr) throw respErr;

    return NextResponse.json({ success: true, assessment, responses: responses || [] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, ctx: { params: { id: string } }) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const access = await resolveNineBoxAccess({ supabase });
    if (!access.allowed) return NextResponse.json({ error: access.reason || 'Acesso negado' }, { status: 403 });

    const id = String(ctx.params.id);
    const body = PutSchema.parse(await request.json());

    const { data: existing, error: exErr } = await supabase.from('nine_box_assessments').select('*').eq('id', id).maybeSingle();
    if (exErr) throw exErr;
    if (!existing) return NextResponse.json({ error: 'Avaliação não encontrada' }, { status: 404 });

    if (body.responses && body.responses.length) {
      const { error: respErr } = await supabase
        .from('nine_box_responses')
        .upsert(
          body.responses.map((r) => ({
            assessment_id: id,
            criterion_id: r.criterion_id,
            score: r.score,
            comment: r.comment || null,
          })) as any,
          { onConflict: 'assessment_id,criterion_id' }
        );
      if (respErr) throw respErr;
    }

    const statusToSet = body.status || existing.status;
    if (statusToSet === 'submitted') {
      const { data: respRows } = await supabase
        .from('nine_box_responses')
        .select('score, comment')
        .eq('assessment_id', id)
        .limit(500);

      const missing = (respRows || []).filter((r: any) => [1, 2, 5].includes(Number(r.score)) && !String(r.comment || '').trim());
      if (missing.length) {
        return NextResponse.json({ error: 'Justificativa obrigatória para notas 1, 2 e 5.' }, { status: 400 });
      }
    }

    const { data: assessment, error: upErr } = await supabase
      .from('nine_box_assessments')
      .update({
        ...(body.notes !== undefined ? { notes: body.notes } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.status === 'submitted' ? { submitted_at: new Date().toISOString() } : {}),
      } as any)
      .eq('id', id)
      .select('*')
      .single();
    if (upErr) throw upErr;

    let result = null;
    if (assessment.status === 'submitted') {
      result = await recomputeResults(supabase, id);
    }

    return NextResponse.json({ success: true, assessment, result });
  } catch (e: any) {
    if (e?.name === 'ZodError') return NextResponse.json({ error: 'Payload inválido', details: e.errors }, { status: 400 });
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
  }
}


