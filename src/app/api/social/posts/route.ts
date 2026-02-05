import { NextRequest, NextResponse } from 'next/server';
import { postScheduler, type ScheduledPost, type Platform } from '@/lib/social/post-scheduler';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET - Buscar posts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const client_id = searchParams.get('client_id') || undefined;
    const status = searchParams.get('status') || undefined;
    const approval_status = searchParams.get('approval_status') || undefined;
    const platform = searchParams.get('platform') || undefined;
    const from_date = searchParams.get('from_date') || undefined;
    const to_date = searchParams.get('to_date') || undefined;
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    // Calendário de conteúdo
    if (action === 'calendar' && client_id && month && year) {
      const calendar = await postScheduler.getContentCalendar(
        client_id,
        parseInt(month),
        parseInt(year)
      );
      return NextResponse.json({ success: true, calendar });
    }

    // Melhores horários
    if (action === 'best_times' && platform) {
      const times = postScheduler.getBestPostingTimes(platform);
      return NextResponse.json({ success: true, times });
    }

    // Lista de posts
    const posts = await postScheduler.getScheduledPosts({
      client_id,
      status,
      approval_status,
      platform,
      from_date,
      to_date
    });

    return NextResponse.json({ success: true, posts });
  } catch (error) {
    console.error('Erro ao buscar posts:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar posts' },
      { status: 500 }
    );
  }
}

// POST - Criar post ou executar ação
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    // Gerar sugestões de conteúdo
    if (action === 'generate_suggestions') {
      const suggestions = await postScheduler.generateContentSuggestions({
        client_id: data.client_id,
        platform: data.platform,
        theme: data.theme,
        tone: data.tone
      });
      return NextResponse.json({ success: true, suggestions });
    }

    // Processar posts agendados
    if (action === 'process_scheduled') {
      const result = await postScheduler.processScheduledPosts();
      return NextResponse.json({ success: true, result });
    }

    // Publicar post específico
    if (action === 'publish') {
      const result = await postScheduler.publishPost(data.post_id);
      return NextResponse.json({ success: result.success, result });
    }

    // Coletar métricas de performance
    if (action === 'collect_performance') {
      const performance = await postScheduler.collectPostPerformance(data.post_id);
      return NextResponse.json({ success: !!performance, performance });
    }

    // Agendar novo post
    const platforms: Platform[] = data.platforms || [];
    
    const post: Omit<ScheduledPost, 'id' | 'created_at'> = {
      client_id: data.client_id,
      client_name: data.client_name,
      title: data.title,
      content: data.content,
      media_urls: data.media_urls,
      platforms,
      scheduled_for: data.scheduled_for,
      timezone: data.timezone || 'America/Sao_Paulo',
      status: 'scheduled',
      created_by: data.created_by,
      approval_status: data.approval_status || 'pending',
      hashtags: data.hashtags,
      mentions: data.mentions,
      link: data.link,
      campaign_id: data.campaign_id,
      ai_generated: data.ai_generated || false,
      ai_suggestions: data.ai_suggestions
    };

    const savedPost = await postScheduler.schedulePost(post);

    if (!savedPost) {
      return NextResponse.json(
        { success: false, error: 'Erro ao agendar post' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, post: savedPost });
  } catch (error) {
    console.error('Erro na API de posts:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar post
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID do post é obrigatório' },
        { status: 400 }
      );
    }

    // Aprovar post
    if (action === 'approve') {
      const success = await postScheduler.approvePost(id, data.approved_by);
      return NextResponse.json({ 
        success, 
        message: success ? 'Post aprovado' : 'Erro ao aprovar' 
      });
    }

    // Rejeitar post
    if (action === 'reject') {
      const success = await postScheduler.rejectPost(id, data.reason, data.rejected_by);
      return NextResponse.json({ 
        success, 
        message: success ? 'Post rejeitado' : 'Erro ao rejeitar' 
      });
    }

    // Cancelar post
    if (action === 'cancel') {
      const { error } = await supabase
        .from('scheduled_posts')
        .update({ status: 'cancelled' })
        .eq('id', id);

      return NextResponse.json({ 
        success: !error, 
        message: error ? 'Erro ao cancelar' : 'Post cancelado' 
      });
    }

    // Atualização geral
    const { error } = await supabase
      .from('scheduled_posts')
      .update(data)
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar post' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Post atualizado' });
  } catch (error) {
    console.error('Erro ao atualizar post:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar post' },
      { status: 500 }
    );
  }
}

// DELETE - Remover post
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID do post é obrigatório' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('scheduled_posts')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Erro ao remover post' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Post removido' });
  } catch (error) {
    console.error('Erro ao remover post:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao remover post' },
      { status: 500 }
    );
  }
}




