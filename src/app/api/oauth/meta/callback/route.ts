import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

/**
 * Meta OAuth Callback Endpoint
 * Receives authorization code and exchanges for tokens
 */

const META_APP_ID = process.env.META_APP_ID || '';
const META_APP_SECRET = process.env.META_APP_SECRET || '';
const META_REDIRECT_URI = process.env.META_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/meta/callback`;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface MetaTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

interface MetaPageResponse {
  data: Array<{
    id: string;
    name: string;
    access_token: string;
    instagram_business_account?: {
      id: string;
    };
  }>;
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
    const tokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
    tokenUrl.searchParams.set('client_id', META_APP_ID);
    tokenUrl.searchParams.set('client_secret', META_APP_SECRET);
    tokenUrl.searchParams.set('redirect_uri', META_REDIRECT_URI);
    tokenUrl.searchParams.set('code', code);

    const tokenResponse = await fetch(tokenUrl.toString());
    const tokenData: MetaTokenResponse = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error('Meta token exchange failed:', tokenData);
      return NextResponse.redirect(`${APP_URL}/cliente/redes-sociais?error=Falha ao obter token`);
    }

    // Get long-lived token
    const longLivedUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
    longLivedUrl.searchParams.set('grant_type', 'fb_exchange_token');
    longLivedUrl.searchParams.set('client_id', META_APP_ID);
    longLivedUrl.searchParams.set('client_secret', META_APP_SECRET);
    longLivedUrl.searchParams.set('fb_exchange_token', tokenData.access_token);

    const longLivedResponse = await fetch(longLivedUrl.toString());
    const longLivedData: MetaTokenResponse = await longLivedResponse.json();

    const finalToken = longLivedData.access_token || tokenData.access_token;
    const expiresIn = longLivedData.expires_in || tokenData.expires_in || 3600;

    // Get Facebook pages and Instagram accounts
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${finalToken}`
    );
    const pagesData: MetaPageResponse = await pagesResponse.json();

    // Store connections
    const connectionsToStore: any[] = [];

    for (const page of pagesData.data || []) {
      // Store Facebook page
      connectionsToStore.push({
        client_id: stateData.clientId,
        platform: 'facebook',
        account_id: page.id,
        account_name: page.name,
        access_token: page.access_token,
        token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
        is_active: true,
        connected_by: stateData.userId,
        connected_by_role: stateData.role,
      });

      // Store Instagram if connected
      if (page.instagram_business_account) {
        // Get Instagram account details
        const igResponse = await fetch(
          `https://graph.facebook.com/v18.0/${page.instagram_business_account.id}?fields=id,username,profile_picture_url&access_token=${page.access_token}`
        );
        const igData = await igResponse.json();

        connectionsToStore.push({
          client_id: stateData.clientId,
          platform: 'instagram',
          account_id: page.instagram_business_account.id,
          account_name: igData.username ? `@${igData.username}` : page.name,
          account_avatar: igData.profile_picture_url,
          access_token: page.access_token,
          token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
          is_active: true,
          connected_by: stateData.userId,
          connected_by_role: stateData.role,
        });
      }
    }

    // Upsert connections
    for (const conn of connectionsToStore) {
      const { error: upsertError } = await supabase
        .from('client_social_connections')
        .upsert(conn, {
          onConflict: 'client_id,platform,account_id',
        });

      if (upsertError) {
        console.error('Error storing connection:', upsertError);
      }

      // Log to audit
      await supabase.from('social_connection_audit').insert({
        client_id: stateData.clientId,
        platform: conn.platform,
        account_id: conn.account_id,
        account_name: conn.account_name,
        action: 'connected',
        performed_by: stateData.userId,
        performed_by_role: stateData.role,
        metadata: { scopes: ['instagram_basic', 'instagram_content_publish', 'pages_manage_posts'] },
      });
    }

    // Redirect back with success
    const successCount = connectionsToStore.length;
    return NextResponse.redirect(
      `${APP_URL}/cliente/${stateData.clientId}/redes-sociais?success=true&connected=${successCount}`
    );
  } catch (error: any) {
    console.error('Meta OAuth callback error:', error);
    return NextResponse.redirect(`${APP_URL}/cliente/redes-sociais?error=${encodeURIComponent(error.message || 'Erro desconhecido')}`);
  }
}
