/**
 * Generate Caption API
 * AI-powered caption generation for the post editor
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { Agent } from '@/lib/agency/core/agent';
import { getBrandContext } from '@/lib/agency/brandMemory';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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
    image_description,
    topic,
    platform = 'instagram',
    tone,
    length = 'medium', // short, medium, long
    include_cta = true,
    include_hashtags = true,
  } = body;

  if (!client_id || (!image_description && !topic)) {
    return NextResponse.json(
      { success: false, error: 'client_id and either image_description or topic are required' },
      { status: 400 }
    );
  }

  try {
    const brandContext = await getBrandContext(client_id);

    const lengthGuide = {
      short: 'máximo 150 caracteres',
      medium: '150-300 caracteres',
      long: '300-500 caracteres',
    };

    const agent = new Agent({
      id: 'caption_generator',
      name: 'Caption Generator',
      role: 'Gerador de Legendas',
      goal: 'Criar legendas envolventes que geram engajamento',
      backstory: `Você é um especialista em criar legendas para ${platform}.
${brandContext ? `\n\nCONTEXTO DA MARCA:\n${brandContext}` : ''}`,
      model: 'gpt-4o',
      temperature: 0.8,
      maxTokens: 1000,
    });

    const prompt = `Crie uma legenda para ${platform}:

${image_description ? `IMAGEM: ${image_description}` : ''}
${topic ? `TEMA: ${topic}` : ''}
${tone ? `TOM: ${tone}` : ''}
TAMANHO: ${lengthGuide[length as keyof typeof lengthGuide]}
${include_cta ? 'Inclua um CTA engajante' : ''}
${include_hashtags ? `Inclua 5-10 hashtags relevantes para ${platform}` : ''}

Retorne em formato JSON:
{
  "caption": "texto da legenda",
  "hashtags": ["#hashtag1", "#hashtag2"],
  "cta": "call to action"
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
      // If parsing fails, return raw output
      parsed = { caption: result.output, hashtags: [], cta: null };
    }

    return NextResponse.json({
      success: true,
      result: {
        ...parsed,
        executionTime: result.executionTime,
        tokenUsage: result.tokenUsage?.total || 0,
      },
    });
  } catch (error: any) {
    console.error('Caption generation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Generation failed' },
      { status: 500 }
    );
  }
}
