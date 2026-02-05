import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';
import { MetaClient } from '@/lib/integrations/meta/client';

/**
 * API para publicação de conteúdo no Instagram e Facebook
 * POST /api/social/publish
 */

interface PublishRequest {
  clientId: string;
  platform: 'instagram' | 'facebook';
  accountId: string;
  contentType: 'image' | 'video' | 'carousel' | 'text';
  caption: string;
  mediaUrl?: string;
  mediaUrls?: Array<{ type: 'image' | 'video'; url: string }>;
  link?: string;
  scheduledFor?: string; // ISO date string for scheduled posts
}

interface PublishResult {
  success: boolean;
  postId?: string;
  error?: string;
  scheduledId?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<PublishResult>> {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const adminSupabase = getSupabaseAdmin();
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    // Verificar role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const role = profile?.role || 'client';
    if (!['client', 'employee', 'super_admin'].includes(role)) {
      return NextResponse.json({ success: false, error: 'Permissão negada' }, { status: 403 });
    }

    const body: PublishRequest = await request.json();
    const { clientId, platform, accountId, contentType, caption, mediaUrl, mediaUrls, link, scheduledFor } = body;

    // Validações
    if (!clientId || !platform || !accountId || !caption) {
      return NextResponse.json(
        { success: false, error: 'clientId, platform, accountId e caption são obrigatórios' },
        { status: 400 }
      );
    }

    if (contentType !== 'text' && !mediaUrl && !mediaUrls?.length) {
      return NextResponse.json(
        { success: false, error: 'mediaUrl ou mediaUrls é obrigatório para posts com mídia' },
        { status: 400 }
      );
    }

    // Buscar conexão social do cliente
    const { data: connection, error: connError } = await adminSupabase
      .from('client_social_connections')
      .select('*')
      .eq('client_id', clientId)
      .eq('platform', platform)
      .eq('account_id', accountId)
      .eq('is_active', true)
      .single();

    if (connError || !connection) {
      return NextResponse.json(
        { success: false, error: 'Conta social não encontrada ou desconectada' },
        { status: 404 }
      );
    }

    // Verificar se token expirou
    if (connection.token_expires_at && new Date(connection.token_expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Token expirado. Reconecte a conta.' },
        { status: 401 }
      );
    }

    // Se for agendado, salvar no banco e retornar
    if (scheduledFor) {
      const scheduledDate = new Date(scheduledFor);
      if (scheduledDate <= new Date()) {
        return NextResponse.json(
          { success: false, error: 'Data de agendamento deve ser no futuro' },
          { status: 400 }
        );
      }

      const { data: scheduled, error: schedError } = await adminSupabase
        .from('scheduled_posts')
        .insert({
          client_id: clientId,
          platform,
          account_id: accountId,
          content_type: contentType,
          caption,
          media_url: mediaUrl,
          media_urls: mediaUrls,
          link,
          scheduled_for: scheduledFor,
          status: 'pending',
          created_by: user.id,
        })
        .select('id')
        .single();

      if (schedError) {
        console.error('Erro ao agendar post:', schedError);
        return NextResponse.json(
          { success: false, error: 'Erro ao agendar publicação' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        scheduledId: scheduled.id,
      });
    }

    // Publicar imediatamente
    const client = new MetaClient({ accessToken: connection.access_token });
    let postId: string | undefined;

    try {
      if (platform === 'instagram') {
        // Instagram publishing
        switch (contentType) {
          case 'image':
            if (!mediaUrl) throw new Error('mediaUrl é obrigatório para imagens');
            const imgResult = await client.createInstagramPost(accountId, mediaUrl, caption);
            postId = imgResult.id;
            break;

          case 'video':
            if (!mediaUrl) throw new Error('mediaUrl é obrigatório para vídeos');
            const vidResult = await client.createInstagramVideoPost(accountId, mediaUrl, caption);
            postId = vidResult.id;
            break;

          case 'carousel':
            if (!mediaUrls?.length) throw new Error('mediaUrls é obrigatório para carrossel');
            const carResult = await client.createInstagramCarouselPost(accountId, mediaUrls, caption);
            postId = carResult.id;
            break;

          default:
            return NextResponse.json(
              { success: false, error: 'Instagram não suporta posts de texto puro' },
              { status: 400 }
            );
        }
      } else if (platform === 'facebook') {
        // Facebook Page publishing
        switch (contentType) {
          case 'text':
            const textResult = await client.createPagePost(accountId, connection.access_token, caption, link);
            postId = textResult.id;
            break;

          case 'image':
            if (!mediaUrl) throw new Error('mediaUrl é obrigatório para imagens');
            const fbImgResult = await client.createPagePhotoPost(accountId, connection.access_token, mediaUrl, caption);
            postId = fbImgResult.id;
            break;

          case 'video':
            if (!mediaUrl) throw new Error('mediaUrl é obrigatório para vídeos');
            const fbVidResult = await client.createPageVideoPost(accountId, connection.access_token, mediaUrl, caption);
            postId = fbVidResult.id;
            break;

          default:
            return NextResponse.json(
              { success: false, error: 'Tipo de conteúdo não suportado para Facebook' },
              { status: 400 }
            );
        }
      }

      // Log da publicação
      await adminSupabase.from('social_posts_log').insert({
        client_id: clientId,
        platform,
        account_id: accountId,
        post_id: postId,
        content_type: contentType,
        caption,
        media_url: mediaUrl,
        status: 'published',
        published_at: new Date().toISOString(),
        published_by: user.id,
      });

      return NextResponse.json({
        success: true,
        postId,
      });
    } catch (publishError: any) {
      console.error('Erro ao publicar:', publishError);

      // Log do erro
      await adminSupabase.from('social_posts_log').insert({
        client_id: clientId,
        platform,
        account_id: accountId,
        content_type: contentType,
        caption,
        media_url: mediaUrl,
        status: 'failed',
        error_message: publishError.message,
        created_by: user.id,
      });

      return NextResponse.json(
        { success: false, error: publishError.message || 'Erro ao publicar' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Social publish error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro interno' },
      { status: 500 }
    );
  }
}

// GET - Listar posts agendados
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const adminSupabase = getSupabaseAdmin();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const clientId = request.nextUrl.searchParams.get('client_id');
    if (!clientId) {
      return NextResponse.json({ error: 'client_id é obrigatório' }, { status: 400 });
    }

    const { data: scheduled, error } = await adminSupabase
      .from('scheduled_posts')
      .select('*')
      .eq('client_id', clientId)
      .eq('status', 'pending')
      .order('scheduled_for', { ascending: true });

    if (error) {
      return NextResponse.json({ error: 'Erro ao buscar posts agendados' }, { status: 500 });
    }

    return NextResponse.json({ posts: scheduled });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Cancelar post agendado
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const adminSupabase = getSupabaseAdmin();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const postId = request.nextUrl.searchParams.get('post_id');
    if (!postId) {
      return NextResponse.json({ error: 'post_id é obrigatório' }, { status: 400 });
    }

    const { error } = await adminSupabase
      .from('scheduled_posts')
      .update({ status: 'cancelled' })
      .eq('id', postId);

    if (error) {
      return NextResponse.json({ error: 'Erro ao cancelar post' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
