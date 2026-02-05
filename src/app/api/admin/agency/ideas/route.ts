/**
 * Ideas Bank API
 * AI-powered content ideas generation and management
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { Agent } from '@/lib/agency/core/agent';
import { getBrandContext } from '@/lib/agency/brandMemory';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// GET - List ideas
export async function GET(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('client_id');
  const status = searchParams.get('status'); // draft, approved, scheduled, used
  const limit = parseInt(searchParams.get('limit') || '20');

  if (!clientId) {
    return NextResponse.json({ success: false, error: 'client_id is required' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    
    let query = supabase
      .from('content_ideas')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true, ideas: data || [] });
  } catch (error: any) {
    console.error('Error fetching ideas:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch ideas' },
      { status: 500 }
    );
  }
}

// POST - Generate new ideas
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
    topic,
    platforms = ['instagram', 'linkedin'],
    count = 10,
    content_types = ['post', 'carousel', 'video', 'story'],
    save_to_bank = true,
  } = body;

  if (!client_id) {
    return NextResponse.json({ success: false, error: 'client_id is required' }, { status: 400 });
  }

  try {
    const brandContext = await getBrandContext(client_id);

    const agent = new Agent({
      id: 'ideas_generator',
      name: 'Content Ideas Generator',
      role: 'Gerador de Ideias de Conteúdo',
      goal: 'Gerar ideias criativas e estratégicas de conteúdo',
      backstory: `Você é um estrategista de conteúdo criativo.
${brandContext ? `\n\nCONTEXTO DA MARCA:\n${brandContext}` : ''}

Você gera ideias que são:
- Relevantes para o público-alvo
- Alinhadas com a marca
- Variadas em formato e abordagem
- Acionáveis e específicas`,
      model: 'gpt-4o',
      temperature: 0.9,
      maxTokens: 2500,
    });

    const prompt = `Gere ${count} ideias de conteúdo:

${topic ? `TEMA PRINCIPAL: ${topic}` : 'Gere ideias variadas'}
PLATAFORMAS: ${platforms.join(', ')}
FORMATOS: ${content_types.join(', ')}

Para cada ideia, inclua:
- Título/conceito
- Formato ideal
- Plataforma recomendada
- Hook sugerido
- Por que funcionaria

Retorne em formato JSON:
{
  "ideas": [
    {
      "title": "...",
      "description": "...",
      "format": "post|carousel|video|story|reels",
      "platform": "instagram|linkedin|...",
      "hook": "...",
      "rationale": "...",
      "priority": "high|medium|low"
    }
  ]
}`;

    const result = await agent.execute(prompt);

    // Parse ideas
    let ideas: any[] = [];
    try {
      const jsonMatch = result.output.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        ideas = parsed.ideas || [];
      }
    } catch {
      console.error('Failed to parse ideas JSON');
    }

    // Save to database if requested
    if (save_to_bank && ideas.length > 0) {
      const supabase = getSupabaseAdmin();
      
      const ideaRecords = ideas.map(idea => ({
        client_id,
        title: idea.title,
        description: idea.description,
        format: idea.format,
        platform: idea.platform,
        hook: idea.hook,
        rationale: idea.rationale,
        priority: idea.priority,
        status: 'draft',
        created_at: new Date().toISOString(),
      }));

      await supabase.from('content_ideas').insert(ideaRecords);
    }

    return NextResponse.json({
      success: true,
      ideas,
      saved: save_to_bank,
      executionTime: result.executionTime,
    });
  } catch (error: any) {
    console.error('Ideas generation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Generation failed' },
      { status: 500 }
    );
  }
}
