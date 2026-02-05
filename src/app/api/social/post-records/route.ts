import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { resolveSocialUploadAccess } from '@/lib/social/uploadAccess';
import { notifyAdmins } from '@/lib/admin/notifyAdmins';
import { notifyAreaUsers } from '@/lib/admin/notifyArea';

export const dynamic = 'force-dynamic';

function coerceTextArray(input: any): string[] {
  if (!input) return [];
  if (Array.isArray(input)) return input.map(String).filter(Boolean);
  return [];
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const access = await resolveSocialUploadAccess({ supabase });
    if (!access.allowed) return NextResponse.json({ error: access.reason || 'Acesso negado' }, { status: 403 });

    const body = await request.json();
    const client_id = body?.client_id ? String(body.client_id) : null;
    const caption = body?.caption ?? body?.legenda ?? null;
    const collaborators = body?.collaborators ?? body?.colaboradores ?? null;
    const post_type = String(body?.post_type || body?.type || 'image');
    const scheduled_at = body?.scheduled_at || body?.scheduledAt || null;
    const media_urls = Array.isArray(body?.media_urls) ? body.media_urls : Array.isArray(body?.mediaUrls) ? body.mediaUrls : [];
    const backend = String(body?.backend || 'instagramback');
    const platforms = coerceTextArray(body?.platforms);
    const channels = body?.channels || [];
    const is_draft = Boolean(body?.is_draft);
    const approval_status = String(body?.approval_status || 'approved');
    const boost_requested = Boolean(body?.boost_requested);

    // Status inicial coerente
    const status = is_draft
      ? 'draft'
      : approval_status === 'pending'
        ? 'pending_approval'
        : scheduled_at
          ? 'scheduled'
          : 'ready';

    const { data, error } = await supabase
      .from('instagram_posts')
      .insert({
        external_id: null,
        client_id,
        post_type,
        caption,
        collaborators,
        status,
        scheduled_at,
        media_urls,
        created_by: access.userId,
        raw_payload: { ...body, _source: 'post-records' },
        platforms,
        channels,
        backend,
        is_draft,
        approval_status,
        boost_requested,
      } as any)
      .select('*')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Notificações best-effort
    try {
      if (approval_status === 'pending') {
        await notifyAdmins(supabase as any, {
          title: 'Post aguardando aprovação',
          message: 'Um post foi enviado para aprovação na Central de Agendar Postagem.',
          link: '/app/social-media/upload',
          type: 'workflow',
          metadata: { post_id: data.id, client_id, backend },
        });
      }
      if (boost_requested) {
        await notifyAreaUsers({
          area: 'Marketing',
          title: 'Impulsionamento solicitado',
          message: 'Um post foi marcado para impulsionar.',
          link: '/app/social-media/upload',
          type: 'workflow',
          metadata: { post_id: data.id, client_id, backend },
        });
      }
    } catch {
      // ignore
    }

    return NextResponse.json({ success: true, post: data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
  }
}


