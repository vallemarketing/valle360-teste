import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

export const dynamic = 'force-dynamic';

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

function buildCallbackRedirect(request: NextRequest, params: { platform: string; ok: boolean; error?: string }) {
  const origin = (APP_URL ? new URL(APP_URL).origin : new URL(request.url).origin).replace(/\/+$/, '');
  const url = new URL('/cliente/redes/callback', origin);
  url.searchParams.set('platform', params.platform);
  url.searchParams.set('ok', params.ok ? '1' : '0');
  if (params.error) url.searchParams.set('error', params.error.slice(0, 180));
  return url.toString();
}

function parseState(raw: string | null) {
  if (!raw) return { clientId: null as string | null };
  try {
    const j = JSON.parse(raw);
    const clientId = j?.clientId ? String(j.clientId) : null;
    return { clientId };
  } catch {
    return { clientId: raw };
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
      return NextResponse.redirect(buildCallbackRedirect(request, { platform: 'facebook', ok: false, error: 'Credenciais do app não configuradas' }));
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const stateRaw = searchParams.get('state');
    const { clientId } = parseState(stateRaw);

    if (!code) {
      return NextResponse.redirect(buildCallbackRedirect(request, { platform: 'facebook', ok: false, error: 'Código de autorização não fornecido' }));
    }
    if (!clientId) {
      return NextResponse.redirect(buildCallbackRedirect(request, { platform: 'facebook', ok: false, error: 'client_id ausente no state' }));
    }

    const appUrl = (APP_URL || new URL(request.url).origin).replace(/\/+$/, '');
    const redirectUri = `${appUrl}/api/oauth/facebook/callback`;

    const tokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
        `client_id=${encodeURIComponent(FACEBOOK_APP_ID)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&client_secret=${encodeURIComponent(FACEBOOK_APP_SECRET)}` +
        `&code=${encodeURIComponent(code)}`
    );
    const tokenData = await tokenResponse.json();
    if (tokenData?.error) {
      return NextResponse.redirect(buildCallbackRedirect(request, { platform: 'facebook', ok: false, error: tokenData.error.message || 'Erro ao obter token' }));
    }

    const longLivedTokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
        `grant_type=fb_exchange_token` +
        `&client_id=${encodeURIComponent(FACEBOOK_APP_ID)}` +
        `&client_secret=${encodeURIComponent(FACEBOOK_APP_SECRET)}` +
        `&fb_exchange_token=${encodeURIComponent(tokenData.access_token)}`
    );
    const longLivedToken = await longLivedTokenResponse.json();
    if (longLivedToken?.error) {
      return NextResponse.redirect(buildCallbackRedirect(request, { platform: 'facebook', ok: false, error: longLivedToken.error.message || 'Erro token longa duração' }));
    }

    const expiresIn = Number(longLivedToken.expires_in || 0);
    const expiresAtIso = expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null;

    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,picture&access_token=${encodeURIComponent(longLivedToken.access_token)}`
    );
    const pagesData = await pagesResponse.json();

    const admin = getSupabaseAdmin();

    for (const page of pagesData?.data || []) {
      const pageId = String(page.id);
      const pageName = page?.name ? String(page.name) : 'Facebook Page';
      const pageAccessToken = String(page.access_token || '');
      const pictureUrl = page?.picture?.data?.url ? String(page.picture.data.url) : null;

      const { data: row, error: upErr } = await admin
        .from('social_connected_accounts')
        .upsert(
          {
            client_id: clientId,
            platform: 'facebook',
            external_account_id: pageId,
            username: null,
            display_name: pageName,
            profile_picture_url: pictureUrl,
            status: expiresAtIso ? 'active' : 'active',
            metadata: {},
          } as any,
          { onConflict: 'client_id,platform,external_account_id' }
        )
        .select('id')
        .single();
      if (upErr) throw upErr;

      await admin.from('social_connected_account_secrets').upsert(
        {
          account_id: row.id,
          access_token: pageAccessToken || null,
          token_type: 'bearer',
          scopes: [],
          expires_at: expiresAtIso,
        } as any,
        { onConflict: 'account_id' }
      );
    }

    return NextResponse.redirect(buildCallbackRedirect(request, { platform: 'facebook', ok: true }));
  } catch (e: any) {
    return NextResponse.redirect(buildCallbackRedirect(request, { platform: 'facebook', ok: false, error: e?.message || 'Erro no callback' }));
  }
}


