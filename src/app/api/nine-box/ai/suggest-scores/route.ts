import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { resolveNineBoxAccess } from '@/lib/rh/nineBoxAccess';
import { generateWithAI } from '@/lib/ai/aiRouter';

export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  cycle_id: z.string().uuid().optional(),
  assessment_id: z.string().uuid().optional(),
  employee_id: z.string().uuid(),
  extra_context: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const access = await resolveNineBoxAccess({ supabase });
    if (!access.allowed) return NextResponse.json({ error: access.reason || 'Acesso negado' }, { status: 403 });

    const body = BodySchema.parse(await request.json());

    const { data: employee } = await supabase
      .from('employees')
      .select('id, full_name, email, department, position, performance_score, manager_id, metadata')
      .eq('id', body.employee_id)
      .maybeSingle();

    // critérios: ciclo + globais (ou apenas globais)
    let criteriaQ = supabase.from('nine_box_criteria').select('id, axis, key, label, description, weight, cycle_id, is_active').eq('is_active', true);
    if (body.cycle_id) criteriaQ = criteriaQ.or(`cycle_id.eq.${body.cycle_id},cycle_id.is.null`);
    else criteriaQ = criteriaQ.is('cycle_id', null);
    const { data: criteria, error: criteriaErr } = await criteriaQ.order('axis', { ascending: true }).order('weight', { ascending: false }).limit(200);
    if (criteriaErr) throw criteriaErr;

    const systemPrompt = `Você é um especialista de RH e avaliação de talentos.
Sua tarefa é sugerir notas (1 a 5) para critérios do 9 Box (Desempenho/Potencial), como um copiloto.

Regras:
- Sugira uma nota por critério (inteiro 1..5).
- Retorne também confidence (0..1), reason (curto) e evidences (lista curta).
- Se não houver evidência suficiente, mantenha confidence baixa e explique.
- NÃO invente fatos.`;

    const userPayload = {
      employee,
      criteria,
      extra_context: body.extra_context || '',
      scale: { min: 1, max: 5 },
    };

    const result = await generateWithAI({
      task: 'hr',
      json: true,
      temperature: 0.2,
      maxTokens: 1400,
      actorUserId: access.userId,
      entityType: 'nine_box_ai_suggest_scores',
      entityId: body.assessment_id || null,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content:
            `Retorne JSON no formato:\n` +
            `{\n` +
            ` "suggestions":[{"criterion_id":"uuid","axis":"performance|potential","key":"...","score":1,"confidence":0.0,"reason":"...","evidences":["..."]}],\n` +
            ` "notes":"observações gerais"\n` +
            `}\n\n` +
            `Dados:\n${JSON.stringify(userPayload)}`,
        },
      ],
    });

    // best-effort: guardar no assessment.ai_payload se fornecido
    if (body.assessment_id && result.json) {
      try {
        const { data: existing } = await supabase
          .from('nine_box_assessments')
          .select('ai_payload')
          .eq('id', body.assessment_id)
          .maybeSingle();

        const prev = (existing as any)?.ai_payload || {};
        await supabase
          .from('nine_box_assessments')
          .update({ ai_payload: { ...prev, suggest_scores: result.json } } as any)
          .eq('id', body.assessment_id);
      } catch {
        // ignore
      }
    }

    return NextResponse.json({ success: true, output: result.json || null, raw: result.text });
  } catch (e: any) {
    if (e?.name === 'ZodError') return NextResponse.json({ error: 'Payload inválido', details: e.errors }, { status: 400 });
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
  }
}


