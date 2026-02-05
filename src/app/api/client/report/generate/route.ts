import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// POST: Gerar relatório sob demanda
export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const body = await request.json();
  const { 
    report_type = 'monthly', // 'weekly', 'monthly', 'quarterly', 'custom'
    start_date,
    end_date,
    include_sections = ['overview', 'social', 'engagement', 'competitors', 'recommendations']
  } = body;

  try {
    // Buscar dados do cliente
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, company_name, segment, user_id')
      .eq('user_id', user.id)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    // Calcular período
    const now = new Date();
    let periodStart: Date;
    let periodEnd = end_date ? new Date(end_date) : now;

    if (start_date) {
      periodStart = new Date(start_date);
    } else {
      switch (report_type) {
        case 'weekly':
          periodStart = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'quarterly':
          periodStart = new Date(now.setMonth(now.getMonth() - 3));
          break;
        case 'monthly':
        default:
          periodStart = new Date(now.setMonth(now.getMonth() - 1));
      }
    }

    // Coletar dados para o relatório
    const reportData: any = {
      client: {
        name: client.company_name,
        segment: client.segment,
        period: {
          start: periodStart.toISOString(),
          end: periodEnd.toISOString(),
          type: report_type
        }
      },
      generated_at: new Date().toISOString()
    };

    // 1. Dados de aprovações
    if (include_sections.includes('overview')) {
      const { data: approvals } = await supabase
        .from('post_approvals')
        .select('*')
        .eq('client_id', client.id)
        .gte('created_at', periodStart.toISOString())
        .lte('created_at', periodEnd.toISOString());

      const approved = approvals?.filter(a => a.status === 'approved').length || 0;
      const rejected = approvals?.filter(a => a.status === 'rejected').length || 0;
      const pending = approvals?.filter(a => a.status === 'pending').length || 0;
      const total = approvals?.length || 0;

      reportData.approvals = {
        total,
        approved,
        rejected,
        pending,
        approval_rate: total > 0 ? Math.round((approved / total) * 100) : 0
      };
    }

    // 2. Dados de redes sociais
    if (include_sections.includes('social')) {
      const { data: socialAccounts } = await supabase
        .from('client_social_accounts')
        .select('*')
        .eq('client_id', client.id);

      reportData.social = {
        accounts: socialAccounts?.length || 0,
        platforms: [...new Set(socialAccounts?.map(a => a.platform) || [])],
        metrics: {
          total_followers: socialAccounts?.reduce((sum, a) => sum + (a.followers_count || 0), 0) || 0,
          total_posts: 0, // Seria calculado de dados reais
          avg_engagement: 0
        }
      };
    }

    // 3. Dados de engajamento
    if (include_sections.includes('engagement')) {
      // Buscar métricas de engajamento do período
      const { data: metrics } = await supabase
        .from('social_metrics')
        .select('*')
        .eq('client_id', client.id)
        .gte('date', periodStart.toISOString().split('T')[0])
        .lte('date', periodEnd.toISOString().split('T')[0])
        .order('date', { ascending: true });

      const avgLikes = metrics?.reduce((sum, m) => sum + (m.likes || 0), 0) / (metrics?.length || 1);
      const avgComments = metrics?.reduce((sum, m) => sum + (m.comments || 0), 0) / (metrics?.length || 1);
      const avgReach = metrics?.reduce((sum, m) => sum + (m.reach || 0), 0) / (metrics?.length || 1);

      reportData.engagement = {
        average_likes: Math.round(avgLikes),
        average_comments: Math.round(avgComments),
        average_reach: Math.round(avgReach),
        trend: metrics?.length && metrics.length > 1 
          ? (metrics[metrics.length - 1]?.likes > metrics[0]?.likes ? 'up' : 'down')
          : 'stable',
        daily_data: metrics?.slice(-7) || []
      };
    }

    // 4. Dados de concorrentes
    if (include_sections.includes('competitors')) {
      const { data: competitors } = await supabase
        .from('client_competitors')
        .select(`
          *,
          activities:competitor_activities(
            activity_type,
            likes_count,
            comments_count,
            is_viral,
            detected_at
          )
        `)
        .eq('client_id', client.id)
        .eq('is_active', true);

      reportData.competitors = {
        total_monitored: competitors?.length || 0,
        competitors: competitors?.map(c => ({
          name: c.display_name,
          username: c.instagram_username,
          followers: c.followers_count,
          viral_posts: c.activities?.filter((a: any) => a.is_viral).length || 0,
          total_activities: c.activities?.length || 0
        })) || []
      };
    }

    // 5. Recomendações da IA
    if (include_sections.includes('recommendations')) {
      reportData.recommendations = [
        {
          type: 'engagement',
          priority: 'high',
          title: 'Aumentar frequência de posts',
          description: 'Baseado na análise, recomendamos aumentar de 3 para 5 posts por semana.'
        },
        {
          type: 'content',
          priority: 'medium',
          title: 'Investir em Reels',
          description: 'Reels têm 2x mais alcance que posts estáticos no seu segmento.'
        },
        {
          type: 'timing',
          priority: 'medium',
          title: 'Melhor horário: 19h',
          description: 'Seu público está mais ativo entre 18h e 21h.'
        }
      ];
    }

    // 6. Metas e progresso
    const { data: goals } = await supabase
      .from('client_goals')
      .select('*')
      .eq('client_id', client.id)
      .eq('status', 'active');

    reportData.goals = goals?.map(g => ({
      title: g.title,
      type: g.goal_type,
      target: g.target_value,
      current: g.current_value,
      progress: Math.round((g.current_value / g.target_value) * 100),
      deadline: g.deadline
    })) || [];

    // Salvar relatório no histórico
    await supabase.from('client_reports').insert({
      client_id: client.id,
      report_type,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      data: reportData,
      created_by: user.id
    });

    return NextResponse.json({ 
      success: true, 
      report: reportData,
      download_url: null // TODO: Implementar geração de PDF
    });
  } catch (error: any) {
    console.error('Erro ao gerar relatório:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET: Listar relatórios anteriores
export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!client) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    const { data: reports, error } = await supabase
      .from('client_reports')
      .select('id, report_type, period_start, period_end, created_at')
      .eq('client_id', client.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    return NextResponse.json({ success: true, reports });
  } catch (error: any) {
    console.error('Erro ao listar relatórios:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
