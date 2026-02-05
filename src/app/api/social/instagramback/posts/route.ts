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
    // aceita CSV legado
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

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const access = await resolveSocialUploadAccess({ supabase });
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason || 'Acesso negado' }, { status: 403 });
    }

    const { baseUrl, accessToken } = await getInstagramBackIntegration(supabase);
    const client = createInstagramBackClient({ baseUrl, accessToken });

    const posts = await client.listPosts();

    // Espelhamento best-effort (não bloquear listagem se falhar)
    try {
      const list = Array.isArray((posts as any)?.data) ? (posts as any).data : Array.isArray(posts) ? posts : [];
      if (list.length) {
        const rows = list.map((p: any) => ({
          external_id: String(p?.id || p?._id || p?.external_id || ''),
          post_type: inferPostType(p),
          caption: p?.caption ?? p?.legenda ?? null,
          collaborators: p?.collaborators ?? p?.colaboradores ?? null,
          status: p?.status ?? null,
          scheduled_at: p?.scheduled_at ?? p?.scheduledAt ?? null,
          media_urls: coerceMediaUrls(p?.media_urls ?? p?.mediaUrls ?? p?.carrossel ?? p?.urlimagem ?? p?.urlvideo),
          created_by: access.userId,
          raw_payload: p,
        }));
        const filtered = rows.filter((r: any) => r.external_id);
        if (filtered.length) {
          await supabase.from('instagram_posts').upsert(filtered, { onConflict: 'external_id' });
        }
      }
    } catch {
      // best-effort
    }

    return NextResponse.json({ success: true, posts });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const access = await resolveSocialUploadAccess({ supabase });
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason || 'Acesso negado' }, { status: 403 });
    }

    const body = await request.json();

    const { baseUrl, accessToken } = await getInstagramBackIntegration(supabase);
    const client = createInstagramBackClient({ baseUrl, accessToken });

    const created = await client.createPost(body);

    // Dual-write (espelho)
    try {
      const payload = (created as any)?.data ?? created;
      const externalId = String(payload?.id || payload?._id || body?.id || '');
      const clientId = body?.client_id ? String(body.client_id) : null;
      const platforms = Array.isArray(body?.platforms) ? body.platforms.map(String) : [];
      const channels = body?.channels || [];
      const backend = 'instagramback';
      const isDraft = Boolean(body?.is_draft);
      const approvalStatus = String(body?.approval_status || 'approved');
      const boostRequested = Boolean(body?.boost_requested);
      await supabase.from('instagram_posts').upsert(
        {
          external_id: externalId || null,
          client_id: clientId,
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
          platforms,
          channels,
          backend,
          is_draft: isDraft,
          approval_status: approvalStatus,
          boost_requested: boostRequested,
        } as any,
        { onConflict: 'external_id' }
      );
    } catch {
      // best-effort
    }

    return NextResponse.json({ success: true, created });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
  }
}


