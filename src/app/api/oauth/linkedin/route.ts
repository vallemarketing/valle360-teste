import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// LinkedIn OAuth Configuration
const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + '/api/oauth/linkedin/callback';

// Scopes necessários
const SCOPES = [
  'r_liteprofile',
  'r_emailaddress',
  'w_member_social',
  'r_organization_social',
  'w_organization_social'
].join(' ');

// Iniciar fluxo OAuth
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('client_id');
  const state = searchParams.get('state') || Math.random().toString(36).substring(7);

  if (!LINKEDIN_CLIENT_ID) {
    return NextResponse.json(
      { error: 'LinkedIn Client ID não configurado' },
      { status: 500 }
    );
  }

  // Construir URL de autorização
  const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', LINKEDIN_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('scope', SCOPES);
  authUrl.searchParams.set('state', JSON.stringify({ clientId, state }));

  return NextResponse.redirect(authUrl.toString());
}

// Processar callback
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, state } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Código de autorização não fornecido' },
        { status: 400 }
      );
    }

    // Trocar código por token
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        client_id: LINKEDIN_CLIENT_ID!,
        client_secret: LINKEDIN_CLIENT_SECRET!
      })
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return NextResponse.json(
        { error: tokenData.error_description || tokenData.error },
        { status: 400 }
      );
    }

    // Obter informações do perfil
    const profileResponse = await fetch('https://api.linkedin.com/v2/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    });
    const profileData = await profileResponse.json();

    // Obter foto do perfil
    const pictureResponse = await fetch(
      'https://api.linkedin.com/v2/me?projection=(profilePicture(displayImage~:playableStreams))',
      {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`
        }
      }
    );
    const pictureData = await pictureResponse.json();

    const profilePicture = pictureData.profilePicture?.['displayImage~']?.elements?.[0]?.identifiers?.[0]?.identifier;

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
      profile: {
        id: profileData.id,
        firstName: profileData.localizedFirstName,
        lastName: profileData.localizedLastName,
        profilePicture
      },
      accessToken: tokenData.access_token,
      expiresIn: tokenData.expires_in,
      clientId
    });

  } catch (error) {
    console.error('Erro no OAuth do LinkedIn:', error);
    return NextResponse.json(
      { error: 'Erro ao processar autenticação' },
      { status: 500 }
    );
  }
}









