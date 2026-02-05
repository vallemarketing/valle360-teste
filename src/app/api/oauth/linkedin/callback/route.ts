import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

/**
 * LinkedIn OAuth Callback Endpoint
 * Receives authorization code and exchanges for tokens
 */

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID || '';
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET || '';
const LINKEDIN_REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/linkedin/callback`;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface LinkedInTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  scope: string;
}

interface LinkedInUserInfo {
  sub: string;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email?: string;
}

export async function GET(request: NextRequest) {
  const supabase = getSupabaseAdmin();

  try {
    const code = request.nextUrl.searchParams.get('code');
    const state = request.nextUrl.searchParams.get('state');
    const errorParam = request.nextUrl.searchParams.get('error');

    if (errorParam) {
      const errorDesc = request.nextUrl.searchParams.get('error_description') || 'Autorização negada';
      return NextResponse.redirect(`${APP_URL}/cliente/redes-sociais?error=${encodeURIComponent(errorDesc)}`);
    }

    if (!code || !state) {
      return NextResponse.redirect(`${APP_URL}/cliente/redes-sociais?error=Parâmetros inválidos`);
    }

    // Decode state
    let stateData: { clientId: string; userId: string; role: string; timestamp: number };
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
    } catch {
      return NextResponse.redirect(`${APP_URL}/cliente/redes-sociais?error=State inválido`);
    }

    // Validate timestamp (10 min expiry)
    if (Date.now() - stateData.timestamp > 10 * 60 * 1000) {
      return NextResponse.redirect(`${APP_URL}/cliente/redes-sociais?error=Sessão expirada`);
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: LINKEDIN_REDIRECT_URI,
        client_id: LINKEDIN_CLIENT_ID,
        client_secret: LINKEDIN_CLIENT_SECRET,
      }),
    });

    const tokenData: LinkedInTokenResponse = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error('LinkedIn token exchange failed:', tokenData);
      return NextResponse.redirect(`${APP_URL}/cliente/redes-sociais?error=Falha ao obter token`);
    }

    // Get user info
    const userInfoResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const userInfo: LinkedInUserInfo = await userInfoResponse.json();

    if (!userInfo.sub) {
      console.error('LinkedIn user info failed:', userInfo);
      return NextResponse.redirect(`${APP_URL}/cliente/redes-sociais?error=Falha ao obter informações do usuário`);
    }

    // Calculate token expiry
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

    // Store connection
    const connectionData = {
      client_id: stateData.clientId,
      platform: 'linkedin',
      account_id: userInfo.sub,
      account_name: userInfo.name,
      account_avatar: userInfo.picture,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_expires_at: expiresAt,
      scopes: tokenData.scope.split(' '),
      is_active: true,
      connected_by: stateData.userId,
      connected_by_role: stateData.role,
    };

    const { error: upsertError } = await supabase
      .from('client_social_connections')
      .upsert(connectionData, {
        onConflict: 'client_id,platform,account_id',
      });

    if (upsertError) {
      console.error('Error storing LinkedIn connection:', upsertError);
      return NextResponse.redirect(`${APP_URL}/cliente/redes-sociais?error=Erro ao salvar conexão`);
    }

    // Log to audit
    await supabase.from('social_connection_audit').insert({
      client_id: stateData.clientId,
      platform: 'linkedin',
      account_id: userInfo.sub,
      account_name: userInfo.name,
      action: 'connected',
      performed_by: stateData.userId,
      performed_by_role: stateData.role,
      metadata: { scopes: tokenData.scope.split(' '), email: userInfo.email },
    });

    // Redirect back with success
    return NextResponse.redirect(
      `${APP_URL}/cliente/${stateData.clientId}/redes-sociais?success=true&connected=1`
    );
  } catch (error: any) {
    console.error('LinkedIn OAuth callback error:', error);
    return NextResponse.redirect(`${APP_URL}/cliente/redes-sociais?error=${encodeURIComponent(error.message || 'Erro desconhecido')}`);
  }
}
