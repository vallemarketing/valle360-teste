import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Facebook OAuth Configuration
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;

// Scopes necessários
const SCOPES = [
  'pages_show_list',
  'pages_read_engagement',
  'pages_manage_posts',
  'pages_manage_engagement',
  'pages_read_user_content'
].join(',');

function buildClientCallbackUrl(request: NextRequest, params: { platform: string; ok: boolean; error?: string }) {
  const origin = new URL(request.url).origin;
  const url = new URL('/cliente/redes/callback', origin);
  url.searchParams.set('platform', params.platform);
  url.searchParams.set('ok', params.ok ? '1' : '0');
  if (params.error) url.searchParams.set('error', params.error.slice(0, 180));
  return url.toString();
}

// Iniciar fluxo OAuth
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('client_id');
  const state = searchParams.get('state') || Math.random().toString(36).substring(7);

  if (!FACEBOOK_APP_ID) {
    return NextResponse.redirect(buildClientCallbackUrl(request, { platform: 'facebook', ok: false, error: 'Facebook App ID não configurado' }));
  }
  if (!clientId) {
    return NextResponse.redirect(buildClientCallbackUrl(request, { platform: 'facebook', ok: false, error: 'client_id é obrigatório' }));
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin).replace(/\/+$/, '');
  const REDIRECT_URI = `${appUrl}/api/oauth/facebook/callback`;

  // Construir URL de autorização
  const authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
  authUrl.searchParams.set('client_id', FACEBOOK_APP_ID);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('scope', SCOPES);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('state', JSON.stringify({ clientId, state }));

  return NextResponse.redirect(authUrl.toString());
}

// Processar callback
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, state } = body;

    if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
      return NextResponse.json({ error: 'Credenciais do Facebook não configuradas' }, { status: 500 });
    }

    if (!code) {
      return NextResponse.json(
        { error: 'Código de autorização não fornecido' },
        { status: 400 }
      );
    }

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin).replace(/\/+$/, '');
    const redirectUri = `${appUrl}/api/oauth/facebook/callback`;

    // Trocar código por token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `client_id=${FACEBOOK_APP_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&client_secret=${FACEBOOK_APP_SECRET}` +
      `&code=${code}`
    );

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return NextResponse.json(
        { error: tokenData.error.message },
        { status: 400 }
      );
    }

    // Obter token de longa duração
    const longLivedTokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `grant_type=fb_exchange_token` +
      `&client_id=${FACEBOOK_APP_ID}` +
      `&client_secret=${FACEBOOK_APP_SECRET}` +
      `&fb_exchange_token=${tokenData.access_token}`
    );

    const longLivedToken = await longLivedTokenResponse.json();

    // Obter páginas do usuário
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,picture&access_token=${longLivedToken.access_token}`
    );
    const pagesData = await pagesResponse.json();

    const pages = (pagesData.data || []).map((page: any) => ({
      id: page.id,
      name: page.name,
      accessToken: page.access_token,
      picture: page.picture?.data?.url
    }));

    // Parsear state
    let clientId;
    try {
      const stateData = JSON.parse(state);
      clientId = stateData.clientId;
    } catch {
      clientId = state;
    }

    return NextResponse.json({
      success: true,
      pages,
      expiresIn: longLivedToken.expires_in,
      clientId
    });

  } catch (error) {
    console.error('Erro no OAuth do Facebook:', error);
    return NextResponse.json(
      { error: 'Erro ao processar autenticação' },
      { status: 500 }
    );
  }
}









