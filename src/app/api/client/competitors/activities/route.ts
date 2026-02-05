import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// GET: Listar atividades de concorrentes
export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const competitorId = searchParams.get('competitor_id');
  const limit = parseInt(searchParams.get('limit') || '20');

  try {
    // Buscar client_id
    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!client) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    // Buscar concorrentes do cliente
    let query = supabase
      .from('competitor_activities')
      .select(`
        *,
        competitor:competitor_id (
          id,
          instagram_username,
          display_name,
          profile_picture_url
        )
      `)
      .order('detected_at', { ascending: false })
      .limit(limit);

    // Filtrar por concorrente específico se fornecido
    if (competitorId) {
      query = query.eq('competitor_id', competitorId);
    } else {
      // Buscar todos os concorrentes do cliente
      const { data: competitors } = await supabase
        .from('client_competitors')
        .select('id')
        .eq('client_id', client.id)
        .eq('is_active', true);

      if (competitors && competitors.length > 0) {
        query = query.in('competitor_id', competitors.map(c => c.id));
      } else {
        return NextResponse.json({ success: true, activities: [] });
      }
    }

    const { data: activities, error } = await query;

    if (error) throw error;

    // Separar atividades por tipo
    const viral = activities?.filter(a => a.is_viral) || [];
    const recent = activities?.filter(a => !a.is_viral) || [];

    return NextResponse.json({ 
      success: true, 
      activities,
      viral,
      recent,
      total: activities?.length || 0
    });
  } catch (error: any) {
    console.error('Erro ao listar atividades:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Registrar nova atividade (usado pelo cron/scraper)
export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  // Verificar se é uma chamada autorizada (cron ou admin)
  const authHeader = request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    // Verificar se é admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();
    
    if (!profile || !['admin', 'super_admin'].includes(profile.user_type)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }
  }

  const body = await request.json();
  const { 
    competitor_id, 
    activity_type, 
    content_url, 
    thumbnail_url,
    caption,
    likes_count,
    comments_count,
    shares_count,
    engagement_rate,
    posted_at
  } = body;

  if (!competitor_id || !activity_type) {
    return NextResponse.json({ 
      error: 'competitor_id e activity_type são obrigatórios' 
    }, { status: 400 });
  }

  try {
    // Determinar se é viral (>10% engagement ou >1000 likes)
    const isViral = (engagement_rate && engagement_rate > 10) || 
                   (likes_count && likes_count > 1000);

    const { data: activity, error } = await supabase
      .from('competitor_activities')
      .insert({
        competitor_id,
        activity_type,
        content_url,
        thumbnail_url,
        caption,
        likes_count: likes_count || 0,
        comments_count: comments_count || 0,
        shares_count: shares_count || 0,
        engagement_rate: engagement_rate || 0,
        is_viral: isViral,
        posted_at: posted_at || new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Se for viral, gerar alerta
    if (isViral) {
      // Buscar o concorrente para pegar o client_id
      const { data: competitor } = await supabase
        .from('client_competitors')
        .select('client_id, display_name')
        .eq('id', competitor_id)
        .single();

      if (competitor) {
        // Criar notificação para o cliente
        await supabase.from('notifications').insert({
          user_id: competitor.client_id, // Pode precisar buscar o user_id real
          type: 'competitor_viral',
          title: '🔥 Concorrente com post viral!',
          message: `${competitor.display_name} teve um post com alto engajamento. Confira!`,
          data: { activity_id: activity.id, competitor_id },
          is_read: false
        });
      }
    }

    return NextResponse.json({ success: true, activity });
  } catch (error: any) {
    console.error('Erro ao registrar atividade:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
