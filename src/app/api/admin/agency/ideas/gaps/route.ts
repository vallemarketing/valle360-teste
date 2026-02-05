/**
 * Content Gaps API
 * Detect gaps in the content calendar and suggest ideas
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { Agent } from '@/lib/agency/core/agent';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';
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
    days_ahead = 30,
    min_posts_per_week = 3,
  } = body;

  if (!client_id) {
    return NextResponse.json({ success: false, error: 'client_id is required' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    
    // Get scheduled posts for next X days
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days_ahead);

    const { data: scheduledPosts } = await supabase
      .from('content_calendar_posts')
      .select('scheduled_for, platform, content_type')
      .eq('client_id', client_id)
      .gte('scheduled_for', startDate.toISOString())
      .lte('scheduled_for', endDate.toISOString())
      .in('status', ['scheduled', 'draft']);

    // Analyze gaps by week
    const weeks: Record<string, number> = {};
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const weekKey = getWeekKey(currentDate);
      weeks[weekKey] = 0;
      currentDate.setDate(currentDate.getDate() + 7);
    }

    // Count posts per week
    for (const post of scheduledPosts || []) {
      const weekKey = getWeekKey(new Date(post.scheduled_for));
      if (weeks[weekKey] !== undefined) {
        weeks[weekKey]++;
      }
    }

    // Find gaps
    const gaps: { week: string; deficit: number; startDate: string }[] = [];
    for (const [week, count] of Object.entries(weeks)) {
      if (count < min_posts_per_week) {
        gaps.push({
          week,
          deficit: min_posts_per_week - count,
          startDate: getWeekStartDate(week),
        });
      }
    }

    // If there are gaps, generate suggestions
    let suggestions: any[] = [];
    if (gaps.length > 0) {
      const brandContext = await getBrandContext(client_id);

      const agent = new Agent({
        id: 'gap_filler',
        name: 'Content Gap Filler',
        role: 'Preenchedor de Gaps de Conteúdo',
        goal: 'Sugerir conteúdo para preencher lacunas no calendário',
        backstory: `Você sugere conteúdo relevante para preencher gaps no calendário.
${brandContext ? `\n\nCONTEXTO DA MARCA:\n${brandContext}` : ''}`,
        model: 'gpt-4o',
        temperature: 0.8,
        maxTokens: 1500,
      });

      const totalNeeded = gaps.reduce((sum, g) => sum + g.deficit, 0);

      const prompt = `O calendário tem gaps. Sugira ${totalNeeded} posts para preencher:

GAPS DETECTADOS:
${gaps.map(g => `- Semana ${g.week}: faltam ${g.deficit} posts`).join('\n')}

Retorne em JSON:
{
  "suggestions": [
    {
      "week": "semana do gap",
      "title": "...",
      "format": "post|carousel|video",
      "platform": "instagram|linkedin",
      "suggested_day": "segunda|terça|...",
      "hook": "..."
    }
  ]
}`;

      const result = await agent.execute(prompt);

      try {
        const jsonMatch = result.output.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          suggestions = parsed.suggestions || [];
        }
      } catch {
        // Ignore parse errors
      }
    }

    return NextResponse.json({
      success: true,
      analysis: {
        period: `${startDate.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]}`,
        totalScheduled: scheduledPosts?.length || 0,
        minRequired: Math.ceil(days_ahead / 7) * min_posts_per_week,
        gaps,
        hasGaps: gaps.length > 0,
      },
      suggestions,
    });
  } catch (error: any) {
    console.error('Gap analysis error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Analysis failed' },
      { status: 500 }
    );
  }
}

function getWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay()); // Start of week (Sunday)
  return d.toISOString().split('T')[0];
}

function getWeekStartDate(weekKey: string): string {
  return weekKey;
}
