/**
 * Improve Text API
 * AI-powered text improvement/rewriting
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { Agent } from '@/lib/agency/core/agent';
import { getBrandContext } from '@/lib/agency/brandMemory';

export const dynamic = 'force-dynamic';
export const maxDuration = 45;

export async function POST(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const { 
    client_id, 
    text,
    improvement_type = 'engagement', // engagement, clarity, persuasion, hook, shorten, expand
    platform = 'instagram',
    preserve_message = true,
  } = body;

  if (!client_id || !text) {
    return NextResponse.json(
      { success: false, error: 'client_id and text are required' },
      { status: 400 }
    );
  }

  try {
    const brandContext = await getBrandContext(client_id);

    const improvementGuides: Record<string, string> = {
      engagement: 'Reescreva para maximizar engajamento (curtidas, comentários, compartilhamentos)',
      clarity: 'Reescreva para ser mais claro e fácil de entender',
      persuasion: 'Reescreva para ser mais persuasivo e convincente',
      hook: 'Melhore o hook/abertura para parar o scroll',
      shorten: 'Reduza o texto mantendo a mensagem principal',
      expand: 'Expanda o texto com mais detalhes e contexto',
    };

    const agent = new Agent({
      id: 'text_improver',
      name: 'Text Improver',
      role: 'Editor de Texto',
      goal: 'Melhorar textos mantendo a essência e alinhamento com a marca',
      backstory: `Você é um editor especializado em conteúdo para ${platform}.
${brandContext ? `\n\nCONTEXTO DA MARCA:\n${brandContext}` : ''}`,
      model: 'gpt-4o',
      temperature: 0.7,
      maxTokens: 1200,
    });

    const prompt = `${improvementGuides[improvement_type] || improvementGuides.engagement}

TEXTO ORIGINAL:
${text}

${preserve_message ? 'IMPORTANTE: Preserve a mensagem e intenção principais.' : ''}

Retorne em formato JSON:
{
  "improved_text": "...",
  "changes_made": ["mudança 1", "mudança 2"],
  "improvement_score": 1-10,
  "alternative_version": "..."
}`;

    const result = await agent.execute(prompt);

    // Try to parse JSON from response
    let parsed;
    try {
      const jsonMatch = result.output.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      }
    } catch {
      parsed = { improved_text: result.output };
    }

    return NextResponse.json({
      success: true,
      result: {
        original: text,
        ...parsed,
        executionTime: result.executionTime,
      },
    });
  } catch (error: any) {
    console.error('Text improvement error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Improvement failed' },
      { status: 500 }
    );
  }
}
