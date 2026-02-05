/**
 * AI-Generated Reports API
 * Generate automated reports with AI insights
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { Agent } from '@/lib/agency/core/agent';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';
import { getBrandContext } from '@/lib/agency/brandMemory';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

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
    period = 'last_30_days', // last_7_days, last_30_days, last_90_days, custom
    start_date,
    end_date,
    include_insights = true,
    include_recommendations = true,
  } = body;

  if (!client_id) {
    return NextResponse.json({ success: false, error: 'client_id is required' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    
    // Calculate date range
    let startDate: Date;
    let endDate = new Date();
    
    if (period === 'custom' && start_date && end_date) {
      startDate = new Date(start_date);
      endDate = new Date(end_date);
    } else {
      const daysMap: Record<string, number> = {
        last_7_days: 7,
        last_30_days: 30,
        last_90_days: 90,
      };
      startDate = new Date();
      startDate.setDate(startDate.getDate() - (daysMap[period] || 30));
    }

    // Fetch metrics data
    const { data: posts } = await supabase
      .from('content_calendar_posts')
      .select('*')
      .eq('client_id', client_id)
      .eq('status', 'published')
      .gte('scheduled_for', startDate.toISOString())
      .lte('scheduled_for', endDate.toISOString());

    // Aggregate metrics
    const metrics = {
      totalPosts: posts?.length || 0,
      byPlatform: {} as Record<string, number>,
      byType: {} as Record<string, number>,
      totalEngagement: 0,
      avgEngagementRate: 0,
      topPosts: [] as any[],
    };

    if (posts && posts.length > 0) {
      for (const post of posts) {
        // Count by platform
        metrics.byPlatform[post.platform] = (metrics.byPlatform[post.platform] || 0) + 1;
        
        // Count by type
        metrics.byType[post.content_type] = (metrics.byType[post.content_type] || 0) + 1;
        
        // Sum engagement
        const postMetrics = post.metrics as any;
        if (postMetrics) {
          metrics.totalEngagement += (postMetrics.likes || 0) + (postMetrics.comments || 0) + (postMetrics.shares || 0);
        }
      }

      // Calculate average engagement rate
      const rates = posts
        .map(p => (p.metrics as any)?.engagement_rate || 0)
        .filter(r => r > 0);
      metrics.avgEngagementRate = rates.length > 0 
        ? rates.reduce((a, b) => a + b, 0) / rates.length 
        : 0;

      // Get top 5 posts by engagement
      metrics.topPosts = posts
        .filter(p => (p.metrics as any)?.engagement_rate)
        .sort((a, b) => ((b.metrics as any)?.engagement_rate || 0) - ((a.metrics as any)?.engagement_rate || 0))
        .slice(0, 5)
        .map(p => ({
          id: p.id,
          caption: p.caption?.substring(0, 100),
          platform: p.platform,
          engagementRate: (p.metrics as any)?.engagement_rate,
        }));
    }

    // Generate AI insights
    let insights: string | null = null;
    let recommendations: string[] = [];

    if (include_insights || include_recommendations) {
      const brandContext = await getBrandContext(client_id);

      const agent = new Agent({
        id: 'report_analyst',
        name: 'Report Analyst',
        role: 'Analista de Relatórios',
        goal: 'Gerar insights e recomendações baseados em dados de performance',
        backstory: `Você é um analista de marketing digital experiente.
${brandContext ? `\n\nCONTEXTO DA MARCA:\n${brandContext}` : ''}`,
        model: 'gpt-4o',
        temperature: 0.6,
        maxTokens: 2000,
      });

      const prompt = `Analise os seguintes dados de performance:

PERÍODO: ${startDate.toLocaleDateString('pt-BR')} a ${endDate.toLocaleDateString('pt-BR')}

MÉTRICAS:
- Total de posts: ${metrics.totalPosts}
- Por plataforma: ${JSON.stringify(metrics.byPlatform)}
- Por tipo: ${JSON.stringify(metrics.byType)}
- Engajamento total: ${metrics.totalEngagement}
- Taxa média de engajamento: ${metrics.avgEngagementRate.toFixed(2)}%
- Top posts: ${JSON.stringify(metrics.topPosts)}

Retorne em JSON:
{
  ${include_insights ? '"insights": "Parágrafo com análise dos dados, destacando pontos fortes e fracos",' : ''}
  ${include_recommendations ? '"recommendations": ["recomendação 1", "recomendação 2", "recomendação 3"]' : ''}
}`;

      const result = await agent.execute(prompt);

      try {
        const jsonMatch = result.output.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          insights = parsed.insights;
          recommendations = parsed.recommendations || [];
        }
      } catch {
        insights = result.output;
      }
    }

    // Build report
    const report = {
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        label: period,
      },
      metrics,
      insights,
      recommendations,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error: any) {
    console.error('Report generation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Generation failed' },
      { status: 500 }
    );
  }
}
