import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createInstagramBackClient } from '@/lib/integrations/instagramback/client';
import { resolveSocialUploadAccess } from '@/lib/social/uploadAccess';

export const dynamic = 'force-dynamic';

async function getInstagramBackIntegration(supabase: ReturnType<typeof createRouteHandlerClient>) {
  const { data, error } = await supabase
    .from('integration_configs')
    .select('status, access_token, config')
    .eq('integration_id', 'instagramback')
    .maybeSingle();

  if (error) throw error;
  const row = data as any;
  if (!row || row.status !== 'connected') {
    throw new Error('InstagramBack não está conectado');
  }
  const baseUrl = String(row?.config?.baseUrl || '').trim();
  const accessToken = String(row?.access_token || '').trim();
  if (!baseUrl) throw new Error('InstagramBack: baseUrl não configurado');
  if (!accessToken) throw new Error('InstagramBack: access_token não configurado');
  return { baseUrl, accessToken };
}

function coerceMediaUrls(input: any): string[] {
  if (!input) return [];
  if (Array.isArray(input)) return input.map(String).filter(Boolean);
  if (typeof input === 'string') {
    return input
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function inferPostType(payload: any): 'image' | 'video' | 'carousel' {
  const t = String(payload?.post_type || payload?.type || payload?.mediaType || '').toLowerCase();
  if (t.includes('carousel')) return 'carousel';
  if (t.includes('video')) return 'video';
  return 'image';
}

export async function PUT(request: NextRequest, context: { params: { id: string } }) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const access = await resolveSocialUploadAccess({ supabase });
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason || 'Acesso negado' }, { status: 403 });
    }

    const id = context?.params?.id;
    if (!id) return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });

    const body = await request.json();

    const { baseUrl, accessToken } = await getInstagramBackIntegration(supabase);
    const client = createInstagramBackClient({ baseUrl, accessToken });

    const updated = await client.updatePost(id, body);

    // Dual-write (espelho)
    try {
      const payload = (updated as any)?.data ?? updated;
      await supabase.from('instagram_posts').upsert(
        {
          external_id: String(payload?.id || payload?._id || id),
          post_type: inferPostType({ ...body, ...payload }),
          caption: payload?.caption ?? body?.caption ?? body?.legenda ?? null,
          collaborators: payload?.collaborators ?? body?.collaborators ?? body?.colaboradores ?? null,
          status: payload?.status ?? body?.status ?? null,
          scheduled_at: payload?.scheduled_at ?? payload?.scheduledAt ?? body?.scheduled_at ?? body?.scheduledAt ?? null,
          media_urls: coerceMediaUrls(
            payload?.media_urls ??
              payload?.mediaUrls ??
              body?.media_urls ??
              body?.mediaUrls ??
              body?.carrossel ??
              body?.urlimagem ??
              body?.urlvideo
          ),
          created_by: access.userId,
          raw_payload: payload,
        } as any,
        { onConflict: 'external_id' }
      );
    } catch {
      // best-effort
    }

    return NextResponse.json({ success: true, updated });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const access = await resolveSocialUploadAccess({ supabase });
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason || 'Acesso negado' }, { status: 403 });
    }

    const id = context?.params?.id;
    if (!id) return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });

    const { baseUrl, accessToken } = await getInstagramBackIntegration(supabase);
    const client = createInstagramBackClient({ baseUrl, accessToken });

    const deleted = await client.deletePost(id);

    // Dual-write (espelho)
    try {
      await supabase.from('instagram_posts').delete().eq('external_id', id);
    } catch {
      // best-effort
    }

    return NextResponse.json({ success: true, deleted });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
  }
}


