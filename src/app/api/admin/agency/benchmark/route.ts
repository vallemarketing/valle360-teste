/**
 * Benchmark API
 * Industry benchmark and growth predictions
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { Agent } from '@/lib/agency/core/agent';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';
import { getBrandContext } from '@/lib/agency/brandMemory';

export const dynamic = 'force-dynamic';
export const maxDuration = 90;

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
    industry,
    include_predictions = true,
  } = body;

  if (!client_id) {
    return NextResponse.json({ success: false, error: 'client_id is required' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    
    // Get client's current metrics (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: posts } = await supabase
      .from('content_calendar_posts')
      .select('platform, metrics, scheduled_for')
      .eq('client_id', client_id)
      .eq('status', 'published')
      .gte('scheduled_for', thirtyDaysAgo.toISOString());

    // Calculate current metrics
    const currentMetrics = {
      postsPerWeek: ((posts?.length || 0) / 4.3).toFixed(1),
      avgEngagementRate: 0,
      platforms: {} as Record<string, { posts: number; avgEngagement: number }>,
    };

    if (posts && posts.length > 0) {
      const rates: number[] = [];
      
      for (const post of posts) {
        const metrics = post.metrics as any;
        const rate = metrics?.engagement_rate || 0;
        rates.push(rate);

        if (!currentMetrics.platforms[post.platform]) {
          currentMetrics.platforms[post.platform] = { posts: 0, avgEngagement: 0 };
        }
        currentMetrics.platforms[post.platform].posts++;
        currentMetrics.platforms[post.platform].avgEngagement += rate;
      }

      currentMetrics.avgEngagementRate = rates.reduce((a, b) => a + b, 0) / rates.length;

      for (const platform of Object.keys(currentMetrics.platforms)) {
        const p = currentMetrics.platforms[platform];
        p.avgEngagement = p.avgEngagement / p.posts;
      }
    }

    // Get AI benchmark analysis
    const brandContext = await getBrandContext(client_id);

    const agent = new Agent({
      id: 'benchmark_analyst',
      name: 'Benchmark Analyst',
      role: 'Analista de Benchmark',
      goal: 'Comparar performance com benchmarks do setor e prever crescimento',
      backstory: `Você é um analista de marketing digital com conhecimento profundo de benchmarks por indústria.
${brandContext ? `\n\nCONTEXTO DA MARCA:\n${brandContext}` : ''}

Benchmarks de referência por setor (Instagram):
- E-commerce: 1-3% engagement
- B2B/SaaS: 0.5-1.5% engagement
- Moda: 2-4% engagement
- Alimentação: 2-5% engagement
- Saúde/Fitness: 3-6% engagement
- Serviços Profissionais: 1-2% engagement`,
      model: 'gpt-4o',
      temperature: 0.6,
      maxTokens: 2000,
    });

    const prompt = `Analise o desempenho do cliente comparado ao benchmark do setor:

SETOR: ${industry || 'Não especificado'}
MÉTRICAS ATUAIS:
- Posts por semana: ${currentMetrics.postsPerWeek}
- Taxa média de engajamento: ${currentMetrics.avgEngagementRate.toFixed(2)}%
- Por plataforma: ${JSON.stringify(currentMetrics.platforms)}

Retorne em JSON:
{
  "benchmark": {
    "industry": "${industry || 'geral'}",
    "avg_engagement_rate": X,
    "avg_posts_per_week": X,
    "comparison": {
      "engagement": "above|below|average",
      "frequency": "above|below|average",
      "percentage_diff": X
    }
  },
  "analysis": "Análise comparativa detalhada...",
  ${include_predictions ? `"predictions": {
    "30_days": {
      "expected_engagement": X,
      "expected_reach_growth": "X%",
      "confidence": "high|medium|low"
    },
    "90_days": {
      "expected_engagement": X,
      "expected_reach_growth": "X%",
      "confidence": "high|medium|low"
    },
    "factors": ["fator 1", "fator 2"]
  },` : ''}
  "recommendations": [
    "recomendação para melhorar vs benchmark"
  ]
}`;

    const result = await agent.execute(prompt);

    let analysis;
    try {
      const jsonMatch = result.output.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      }
    } catch {
      analysis = { analysis: result.output };
    }

    return NextResponse.json({
      success: true,
      result: {
        currentMetrics,
        ...analysis,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Benchmark analysis error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Analysis failed' },
      { status: 500 }
    );
  }
}
