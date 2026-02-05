import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Instagram OAuth Configuration
const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID;
const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET;

// Scopes necessários para publicação
const SCOPES = [
  'instagram_basic',
  'instagram_content_publish',
  'instagram_manage_comments',
  'instagram_manage_insights',
  'pages_show_list',
  'pages_read_engagement'
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

  if (!INSTAGRAM_APP_ID) {
    return NextResponse.redirect(buildClientCallbackUrl(request, { platform: 'instagram', ok: false, error: 'Instagram App ID não configurado' }));
  }
  if (!clientId) {
    return NextResponse.redirect(buildClientCallbackUrl(request, { platform: 'instagram', ok: false, error: 'client_id é obrigatório' }));
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin).replace(/\/+$/, '');
  const REDIRECT_URI = `${appUrl}/api/oauth/instagram/callback`;

  // Construir URL de autorização do Facebook (Instagram usa Facebook OAuth)
  const authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
  authUrl.searchParams.set('client_id', INSTAGRAM_APP_ID);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('scope', SCOPES);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('state', JSON.stringify({ clientId, state }));

  return NextResponse.redirect(authUrl.toString());
}

// Callback do OAuth
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, state } = body;

    if (!INSTAGRAM_APP_ID || !INSTAGRAM_APP_SECRET) {
      return NextResponse.json({ error: 'Credenciais do Instagram não configuradas' }, { status: 500 });
    }

    if (!code) {
      return NextResponse.json(
        { error: 'Código de autorização não fornecido' },
        { status: 400 }
      );
    }

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin).replace(/\/+$/, '');
    const redirectUri = `${appUrl}/api/oauth/instagram/callback`;

    // Trocar código por token de acesso
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `client_id=${INSTAGRAM_APP_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&client_secret=${INSTAGRAM_APP_SECRET}` +
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
      `&client_id=${INSTAGRAM_APP_ID}` +
      `&client_secret=${INSTAGRAM_APP_SECRET}` +
      `&fb_exchange_token=${tokenData.access_token}`
    );

    const longLivedToken = await longLivedTokenResponse.json();

    // Obter informações do usuário e páginas
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${longLivedToken.access_token}`
    );
    const pagesData = await pagesResponse.json();

    // Obter conta do Instagram Business vinculada
    const instagramAccounts = [];
    for (const page of pagesData.data || []) {
      const igResponse = await fetch(
        `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
      );
      const igData = await igResponse.json();
      
      if (igData.instagram_business_account) {
        // Obter detalhes da conta do Instagram
        const igDetailsResponse = await fetch(
          `https://graph.facebook.com/v18.0/${igData.instagram_business_account.id}?fields=username,name,profile_picture_url&access_token=${page.access_token}`
        );
        const igDetails = await igDetailsResponse.json();

        instagramAccounts.push({
          id: igData.instagram_business_account.id,
          username: igDetails.username,
          name: igDetails.name,
          profilePicture: igDetails.profile_picture_url,
          pageId: page.id,
          pageAccessToken: page.access_token
        });
      }
    }

    // Parsear state para obter clientId
    let clientId;
    try {
      const stateData = JSON.parse(state);
      clientId = stateData.clientId;
    } catch {
      clientId = state;
    }

    return NextResponse.json({
      success: true,
      accounts: instagramAccounts,
      expiresIn: longLivedToken.expires_in,
      clientId
    });

  } catch (error) {
    console.error('Erro no OAuth do Instagram:', error);
    return NextResponse.json(
      { error: 'Erro ao processar autenticação' },
      { status: 500 }
    );
  }
}









