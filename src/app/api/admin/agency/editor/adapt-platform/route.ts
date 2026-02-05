/**
 * Adapt Platform API
 * Adapt content from one platform to another
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
    original_content,
    original_platform,
    target_platforms = ['linkedin', 'facebook', 'twitter'],
  } = body;

  if (!client_id || !original_content || !original_platform) {
    return NextResponse.json(
      { success: false, error: 'client_id, original_content, and original_platform are required' },
      { status: 400 }
    );
  }

  try {
    const brandContext = await getBrandContext(client_id);

    const agent = new Agent({
      id: 'platform_adapter',
      name: 'Platform Adapter',
      role: 'Adaptador de Conteúdo Multi-plataforma',
      goal: 'Adaptar conteúdo mantendo a essência mas otimizando para cada plataforma',
      backstory: `Você é um especialista em adaptar conteúdo para diferentes plataformas.
${brandContext ? `\n\nCONTEXTO DA MARCA:\n${brandContext}` : ''}

Você sabe que:
- Instagram: Visual-first, hooks curtos, emojis estratégicos, 30 hashtags
- LinkedIn: Profissional, insights, storytelling, poucas hashtags (3-5)
- Facebook: Conversacional, mais longo, perguntas engajantes
- Twitter/X: Conciso (280 chars), provocativo, threads quando necessário
- TikTok: Casual, trend-aware, CTA para ação`,
      model: 'gpt-4o',
      temperature: 0.7,
      maxTokens: 2000,
    });

    const prompt = `Adapte o seguinte conteúdo de ${original_platform} para: ${target_platforms.join(', ')}

CONTEÚDO ORIGINAL:
${original_content}

Para cada plataforma, ajuste:
- Tom e linguagem
- Tamanho do texto
- Hashtags (quantidade e tipo)
- CTAs apropriados
- Formatação

Retorne em formato JSON:
{
  "adaptations": {
    "linkedin": {
      "content": "...",
      "hashtags": [...],
      "cta": "..."
    },
    "facebook": {...},
    ...
  },
  "tips": ["dica 1", "dica 2"]
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
      parsed = { adaptations: {}, raw: result.output };
    }

    return NextResponse.json({
      success: true,
      result: {
        ...parsed,
        executionTime: result.executionTime,
      },
    });
  } catch (error: any) {
    console.error('Platform adaptation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Adaptation failed' },
      { status: 500 }
    );
  }
}
