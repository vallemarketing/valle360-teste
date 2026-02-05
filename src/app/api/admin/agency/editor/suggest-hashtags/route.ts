/**
 * Suggest Hashtags API
 * AI-powered hashtag suggestions
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { Agent } from '@/lib/agency/core/agent';
import { getBrandContext } from '@/lib/agency/brandMemory';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

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
    caption,
    topic,
    platform = 'instagram',
    count = 15,
    include_niche = true,
    include_trending = true,
    include_brand = true,
  } = body;

  if (!client_id || (!caption && !topic)) {
    return NextResponse.json(
      { success: false, error: 'client_id and either caption or topic are required' },
      { status: 400 }
    );
  }

  try {
    const brandContext = await getBrandContext(client_id);

    const agent = new Agent({
      id: 'hashtag_suggester',
      name: 'Hashtag Suggester',
      role: 'Especialista em Hashtags',
      goal: 'Sugerir hashtags estratégicas que aumentam alcance e engajamento',
      backstory: `Você é um especialista em hashtags para ${platform}.
${brandContext ? `\n\nCONTEXTO DA MARCA:\n${brandContext}` : ''}`,
      model: 'gpt-4o',
      temperature: 0.7,
      maxTokens: 800,
    });

    const prompt = `Sugira ${count} hashtags para ${platform}:

${caption ? `LEGENDA: ${caption}` : ''}
${topic ? `TEMA: ${topic}` : ''}

Categorize as hashtags:
${include_niche ? '- NICHO: hashtags específicas do segmento (menor volume, mais relevantes)' : ''}
${include_trending ? '- TRENDING: hashtags populares do momento' : ''}
${include_brand ? '- MARCA: hashtags que podem ser associadas à marca' : ''}

Retorne em formato JSON:
{
  "hashtags": {
    "niche": ["#exemplo1", "#exemplo2"],
    "trending": ["#exemplo3", "#exemplo4"],
    "brand": ["#exemplo5", "#exemplo6"]
  },
  "recommended_mix": ["#melhor1", "#melhor2", ...],
  "avoid": ["#hashtag_a_evitar", ...]
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
      // If parsing fails, extract hashtags manually
      const hashtagMatch = result.output.match(/#[^\s#]+/g);
      parsed = { 
        hashtags: { all: hashtagMatch || [] },
        recommended_mix: hashtagMatch?.slice(0, count) || [],
      };
    }

    return NextResponse.json({
      success: true,
      result: parsed,
    });
  } catch (error: any) {
    console.error('Hashtag suggestion error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Suggestion failed' },
      { status: 500 }
    );
  }
}
