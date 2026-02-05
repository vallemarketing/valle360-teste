import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';
import { createMetaClient } from '@/lib/integrations/meta/client';

type Channel = { account_id: string; platform: 'instagram' | 'facebook' | string };

function coerceChannels(input: any): Channel[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((c) => ({
      account_id: String(c?.account_id || c?.accountId || c?.id || ''),
      platform: String(c?.platform || ''),
    }))
    .filter((c) => c.account_id && c.platform) as any;
}

export async function publishMetaPost(params: { post: any }) {
  const admin = getSupabaseAdmin();

  const post = params.post || {};
  const postType = String(post.post_type || post.postType || 'image');
  const caption = String(post.caption || post.legenda || '');
  const mediaUrls: string[] = Array.isArray(post.media_urls) ? post.media_urls.map(String) : [];
  const channels = coerceChannels(post.channels);

  const isVideoUrl = (u: string) => /\.(mp4|mov|m4v|webm)(\?|#|$)/i.test(u);

  const results: any[] = [];
  let ok = true;
  let errorMessage: string | null = null;

  for (const ch of channels) {
    try {
      const { data: acct, error: acctErr } = await admin
        .from('social_connected_accounts')
        .select('id, platform, external_account_id')
        .eq('id', ch.account_id)
        .maybeSingle();
      if (acctErr || !acct) throw new Error('Canal não encontrado');

      const { data: sec } = await admin
        .from('social_connected_account_secrets')
        .select('access_token, expires_at')
        .eq('account_id', ch.account_id)
        .maybeSingle();
      const token = sec?.access_token ? String(sec.access_token) : '';
      if (!token) throw new Error('Token ausente para este canal');

      if (acct.platform === 'instagram') {
        const igId = String(acct.external_account_id);
        const client = createMetaClient({ accessToken: token });

        if (postType === 'video') {
          if (!mediaUrls[0]) throw new Error('media_urls[0] ausente');
          const r = await client.createInstagramVideoPost(igId, mediaUrls[0], caption);
          results.push({ platform: 'instagram', account_id: ch.account_id, ok: true, result: r });
        } else if (postType === 'carousel') {
          const items = mediaUrls.slice(0, 10).map((u) => ({ type: isVideoUrl(u) ? ('video' as const) : ('image' as const), url: u }));
          const r = await client.createInstagramCarouselPost(igId, items, caption);
          results.push({ platform: 'instagram', account_id: ch.account_id, ok: true, result: r });
        } else {
          if (!mediaUrls[0]) throw new Error('media_urls[0] ausente');
          const r = await client.createInstagramPost(igId, mediaUrls[0], caption);
          results.push({ platform: 'instagram', account_id: ch.account_id, ok: true, result: r });
        }
      } else if (acct.platform === 'facebook') {
        const pageId = String(acct.external_account_id);
        const client = createMetaClient({ accessToken: token });

        if (postType === 'video') {
          if (!mediaUrls[0]) throw new Error('media_urls[0] ausente');
          const r = await client.createPageVideoPost(pageId, token, mediaUrls[0], caption);
          results.push({ platform: 'facebook', account_id: ch.account_id, ok: true, result: r });
        } else if (postType === 'carousel') {
          // FB multi-mídia é mais complexo (attached_media); por enquanto publica a primeira imagem e registra aviso.
          if (!mediaUrls[0]) throw new Error('media_urls[0] ausente');
          const r = await client.createPagePhotoPost(pageId, token, mediaUrls[0], caption);
          results.push({
            platform: 'facebook',
            account_id: ch.account_id,
            ok: true,
            warning: 'Carrossel Facebook: publicado apenas a primeira mídia (suporte completo será adicionado).',
            result: r,
          });
        } else {
          if (!mediaUrls[0]) {
            // texto puro
            const r = await client.createPagePost(pageId, token, caption);
            results.push({ platform: 'facebook', account_id: ch.account_id, ok: true, result: r });
          } else {
            const r = await client.createPagePhotoPost(pageId, token, mediaUrls[0], caption);
            results.push({ platform: 'facebook', account_id: ch.account_id, ok: true, result: r });
          }
        }
      } else {
        results.push({ platform: acct.platform, account_id: ch.account_id, ok: false, error: 'Plataforma não suportada no publish' });
        ok = false;
      }
    } catch (e: any) {
      ok = false;
      const msg = e?.message || 'Falha ao publicar';
      errorMessage = errorMessage || msg;
      results.push({ platform: ch.platform, account_id: ch.account_id, ok: false, error: msg });
    }
  }

  return { ok, results, error: errorMessage };
}


