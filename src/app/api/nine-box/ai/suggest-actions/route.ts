import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { resolveNineBoxAccess } from '@/lib/rh/nineBoxAccess';
import { generateWithAI } from '@/lib/ai/aiRouter';

export const dynamic = 'force-dynamic';

const QuadrantSchema = z.enum(['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8', 'Q9']);
type Quadrant = z.infer<typeof QuadrantSchema>;

const BodySchema = z.object({
  cycle_id: z.string().uuid().optional(),
  employee_id: z.string().uuid(),
  quadrant: QuadrantSchema.optional(),
  assessment_id: z.string().uuid().optional(),
  extra_context: z.string().optional().nullable(),
});

function toQuadrant(value: unknown): Quadrant | null {
  const q = String(value || '');
  return q === 'Q1' || q === 'Q2' || q === 'Q3' || q === 'Q4' || q === 'Q5' || q === 'Q6' || q === 'Q7' || q === 'Q8' || q === 'Q9'
    ? (q as Quadrant)
    : null;
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const access = await resolveNineBoxAccess({ supabase });
    if (!access.allowed) return NextResponse.json({ error: access.reason || 'Acesso negado' }, { status: 403 });

    const body = BodySchema.parse(await request.json());

    const { data: employee } = await supabase
      .from('employees')
      .select('id, full_name, department, position, performance_score, metadata')
      .eq('id', body.employee_id)
      .maybeSingle();

    let quadrant: Quadrant | null = body.quadrant ?? null;
    if (!quadrant && body.assessment_id) {
      const { data: resRow } = await supabase
        .from('nine_box_results')
        .select('quadrant')
        .eq('assessment_id', body.assessment_id)
        .maybeSingle();
      quadrant = toQuadrant((resRow as any)?.quadrant);
    }

    const systemPrompt = `Você é um especialista em RH e desenvolvimento de talentos.
Gere um plano de ação (PDI) prático e mensurável para um colaborador com base no quadrante do 9 Box.

Regras:
- Liste ações com: title, description, owner_role (ex: RH, Líder, Colaborador), due_in_days, success_metric.
- Evite ações genéricas; prefira ações específicas.
- Retorne JSON.`;

    const result = await generateWithAI({
      task: 'hr',
      json: true,
      temperature: 0.35,
      maxTokens: 1200,
      actorUserId: access.userId,
      entityType: 'nine_box_ai_suggest_actions',
      entityId: body.assessment_id || null,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content:
            `Retorne JSON no formato:\n` +
            `{\n` +
            ` "quadrant":"Q1",\n` +
            ` "actions":[{"title":"...","description":"...","owner_role":"...","due_in_days":30,"success_metric":"..."}],\n` +
            ` "notes":"..."\n` +
            `}\n\n` +
            `Dados:\n${JSON.stringify({ employee, quadrant, extra_context: body.extra_context || '' })}`,
        },
      ],
    });

    return NextResponse.json({ success: true, output: result.json || null, raw: result.text });
  } catch (e: any) {
    if (e?.name === 'ZodError') return NextResponse.json({ error: 'Payload inválido', details: e.errors }, { status: 400 });
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
  }
}


