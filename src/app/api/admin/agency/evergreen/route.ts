/**
 * Evergreen Content Detector API
 * Identifies posts that can be reposted
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { Agent } from '@/lib/agency/core/agent';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

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
    min_days_old = 60,
    min_engagement_rate = 3, // percentage
    limit = 20,
  } = body;

  if (!client_id) {
    return NextResponse.json({ success: false, error: 'client_id is required' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - min_days_old);

    // Get published posts with good engagement
    const { data: posts } = await supabase
      .from('content_calendar_posts')
      .select('id, caption, media_url, platform, scheduled_for, metrics')
      .eq('client_id', client_id)
      .eq('status', 'published')
      .lt('scheduled_for', cutoffDate.toISOString())
      .order('scheduled_for', { ascending: false })
      .limit(100);

    if (!posts || posts.length === 0) {
      return NextResponse.json({
        success: true,
        evergreen: [],
        message: 'No posts old enough to analyze',
      });
    }

    // Filter by engagement and analyze with AI
    const agent = new Agent({
      id: 'evergreen_detector',
      name: 'Evergreen Content Detector',
      role: 'Detector de Conteúdo Evergreen',
      goal: 'Identificar conteúdos atemporais que podem ser repostados',
      backstory: `Você analisa posts para identificar conteúdo evergreen.

Conteúdo evergreen:
- Não menciona datas específicas
- Não faz referência a eventos passados
- Aborda temas atemporais
- Ainda é relevante hoje
- Teve bom engajamento`,
      model: 'gpt-4o',
      temperature: 0.5,
      maxTokens: 2000,
    });

    // Prepare posts for analysis
    const postsToAnalyze = posts.slice(0, 30).map(p => ({
      id: p.id,
      caption: p.caption?.substring(0, 300),
      platform: p.platform,
      age_days: Math.floor((Date.now() - new Date(p.scheduled_for).getTime()) / (1000 * 60 * 60 * 24)),
    }));

    const prompt = `Analise estes posts e identifique quais são EVERGREEN (podem ser repostados):

POSTS:
${postsToAnalyze.map((p, i) => `${i + 1}. [${p.platform}] ${p.caption} (${p.age_days} dias atrás)`).join('\n\n')}

Retorne em JSON:
{
  "evergreen": [
    {
      "index": 1,
      "id": "...",
      "is_evergreen": true,
      "reason": "...",
      "repost_suggestion": "Como atualizar para repostar",
      "best_time_to_repost": "semana/mês sugerido"
    }
  ]
}`;

    const result = await agent.execute(prompt);

    let evergreen: any[] = [];
    try {
      const jsonMatch = result.output.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        evergreen = (parsed.evergreen || [])
          .filter((e: any) => e.is_evergreen)
          .map((e: any) => ({
            ...e,
            originalPost: postsToAnalyze[e.index - 1],
          }));
      }
    } catch {
      // Ignore parse errors
    }

    return NextResponse.json({
      success: true,
      evergreen: evergreen.slice(0, limit),
      analyzedCount: postsToAnalyze.length,
    });
  } catch (error: any) {
    console.error('Evergreen detection error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Detection failed' },
      { status: 500 }
    );
  }
}
