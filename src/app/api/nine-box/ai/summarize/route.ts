import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { resolveNineBoxAccess } from '@/lib/rh/nineBoxAccess';
import { generateWithAI } from '@/lib/ai/aiRouter';

export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  assessment_id: z.string().uuid(),
  extra_context: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const access = await resolveNineBoxAccess({ supabase });
    if (!access.allowed) return NextResponse.json({ error: access.reason || 'Acesso negado' }, { status: 403 });

    const body = BodySchema.parse(await request.json());

    const { data: assessment, error: aErr } = await supabase
      .from('nine_box_assessments')
      .select(
        `
        *,
        employee:employees(id, full_name, department, position),
        result:nine_box_results(*)
      `
      )
      .eq('id', body.assessment_id)
      .maybeSingle();
    if (aErr) throw aErr;
    if (!assessment) return NextResponse.json({ error: 'Avaliação não encontrada' }, { status: 404 });

    const { data: responses, error: rErr } = await supabase
      .from('nine_box_responses')
      .select('score, comment, criterion:nine_box_criteria(axis, key, label, weight)')
      .eq('assessment_id', body.assessment_id)
      .limit(500);
    if (rErr) throw rErr;

    const systemPrompt = `Você é um especialista em RH.
Gere um resumo executivo curto e objetivo para uma avaliação 9 Box.

Regras:
- Seja específico e útil (pontos fortes, pontos a melhorar, riscos e próximo passo).
- Não invente informações.
- Retorne JSON.`;

    const result = await generateWithAI({
      task: 'hr',
      json: true,
      temperature: 0.3,
      maxTokens: 1200,
      actorUserId: access.userId,
      entityType: 'nine_box_ai_summarize',
      entityId: body.assessment_id,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content:
            `Retorne JSON no formato:\n` +
            `{\n` +
            ` "summary":"...",\n` +
            ` "strengths":["..."],\n` +
            ` "improvements":["..."],\n` +
            ` "risks":["..."],\n` +
            ` "next_step":"..."\n` +
            `}\n\n` +
            `Dados:\n${JSON.stringify({ assessment, responses, extra_context: body.extra_context || '' })}`,
        },
      ],
    });

    // best-effort: salvar no resultado.ai_insights
    if (result.json) {
      try {
        await supabase
          .from('nine_box_results')
          .update({ ai_insights: { ...(assessment as any)?.result?.ai_insights, summary: result.json } } as any)
          .eq('assessment_id', body.assessment_id);
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


