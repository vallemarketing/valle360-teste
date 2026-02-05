import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { resolveSocialUploadAccess } from '@/lib/social/uploadAccess';
import { publishMetaPost } from '@/lib/social/metaPublisher';

export const dynamic = 'force-dynamic';

function inferPostType(payload: any): 'image' | 'video' | 'carousel' {
  const t = String(payload?.post_type || payload?.type || '').toLowerCase();
  if (t.includes('carousel')) return 'carousel';
  if (t.includes('video')) return 'video';
  return 'image';
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const access = await resolveSocialUploadAccess({ supabase });
    if (!access.allowed) return NextResponse.json({ error: access.reason || 'Acesso negado' }, { status: 403 });

    const body = await request.json();

    const client_id = body?.client_id ? String(body.client_id) : null;
    const scheduled_at = body?.scheduled_at || body?.scheduledAt || null;
    const media_urls = Array.isArray(body?.media_urls) ? body.media_urls : Array.isArray(body?.mediaUrls) ? body.mediaUrls : [];
    const caption = body?.caption ?? body?.legenda ?? '';
    const collaborators = body?.collaborators ?? body?.colaboradores ?? null;
    const platforms = Array.isArray(body?.platforms) ? body.platforms.map(String) : [];
    const channels = Array.isArray(body?.channels) ? body.channels : [];
    const mode = String(body?.mode || (scheduled_at ? 'schedule' : 'publish_now')); // schedule|publish_now
    const is_draft = Boolean(body?.is_draft);
    const approval_status = String(body?.approval_status || 'approved');
    const boost_requested = Boolean(body?.boost_requested);

    if (!client_id) return NextResponse.json({ error: 'client_id é obrigatório' }, { status: 400 });
    if (!Array.isArray(channels) || channels.length === 0) return NextResponse.json({ error: 'Selecione ao menos um canal' }, { status: 400 });

    const post_type = inferPostType(body);

    // Criar registro no espelho (serve para UX/cron/histórico)
    const initialStatus =
      is_draft ? 'draft' : approval_status === 'pending' ? 'pending_approval' : mode === 'schedule' ? 'scheduled' : 'publishing';

    const { data: inserted, error: insErr } = await supabase
      .from('instagram_posts')
      .insert({
        external_id: null,
        client_id,
        post_type,
        caption,
        collaborators,
        status: initialStatus,
        scheduled_at: mode === 'schedule' ? scheduled_at : null,
        media_urls,
        created_by: access.userId,
        raw_payload: { ...body, _backend: 'meta' },
        platforms,
        channels,
        backend: 'meta',
        is_draft,
        approval_status,
        boost_requested,
      } as any)
      .select('*')
      .single();

    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

    // Se for rascunho ou aguardando aprovação, não publica agora.
    if (is_draft || approval_status !== 'approved') {
      return NextResponse.json({ success: true, post: inserted, published: false });
    }

    // Se agendado, cron publica depois.
    if (mode === 'schedule') {
      return NextResponse.json({ success: true, post: inserted, scheduled: true });
    }

    // Publicar agora
    const published = await publishMetaPost({ post: inserted });

    const nextStatus = published.ok ? 'published' : 'failed';
    await supabase
      .from('instagram_posts')
      .update({
        status: nextStatus,
        published_at: published.ok ? new Date().toISOString() : null,
        error_message: published.ok ? null : published.error || 'Falha ao publicar',
        raw_payload: { ...(inserted as any)?.raw_payload, publish_results: published.results },
      } as any)
      .eq('id', inserted.id);

    return NextResponse.json({
      success: published.ok,
      post_id: inserted.id,
      results: published.results,
      error: published.ok ? undefined : published.error,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
  }
}


