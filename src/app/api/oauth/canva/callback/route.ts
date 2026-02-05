import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const CANVA_CLIENT_ID = process.env.CANVA_CLIENT_ID || '';
const CANVA_CLIENT_SECRET = process.env.CANVA_CLIENT_SECRET || '';
const CANVA_REDIRECT_URI = process.env.CANVA_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/canva/callback`;

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('Canva OAuth error:', error);
      return NextResponse.redirect(new URL(`/error?message=${error}`, request.url));
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL('/error?message=missing_params', request.url));
    }

    // Decode state
    let stateData: { userId: string; clientId?: string; redirect: string };
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
    } catch {
      return NextResponse.redirect(new URL('/error?message=invalid_state', request.url));
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://api.canva.com/rest/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${CANVA_CLIENT_ID}:${CANVA_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: CANVA_REDIRECT_URI,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error('Failed to get Canva tokens:', tokenData);
      return NextResponse.redirect(new URL('/error?message=token_error', request.url));
    }

    // Get user info from Canva
    const userInfoResponse = await fetch('https://api.canva.com/rest/v1/users/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const canvaUser = await userInfoResponse.json();

    // Store connection
    const connectionData = {
      user_id: stateData.userId,
      client_id: stateData.clientId || null,
      platform: 'canva',
      account_id: canvaUser.user?.id || 'unknown',
      account_name: canvaUser.user?.display_name || canvaUser.user?.email || 'Canva User',
      access_token_encrypted: tokenData.access_token, // In production, encrypt this
      refresh_token_encrypted: tokenData.refresh_token,
      token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      scopes: tokenData.scope?.split(' ') || [],
      connected_at: new Date().toISOString(),
      connected_by: stateData.userId,
      is_active: true,
    };

    // Upsert connection
    const { error: dbError } = await supabase
      .from('user_integrations')
      .upsert(connectionData, {
        onConflict: 'user_id,platform',
      });

    if (dbError) {
      console.error('Failed to save Canva connection:', dbError);
      // Try alternative table
      await supabase.from('integrations').upsert({
        user_id: stateData.userId,
        type: 'canva',
        config: {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
          user_id: canvaUser.user?.id,
          display_name: canvaUser.user?.display_name,
        },
        is_active: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,type',
      });
    }

    // Log the connection (best-effort)
    try {
      await supabase.from('audit_logs').insert({
        user_id: stateData.userId,
        action: 'integration_connected',
        resource_type: 'canva',
        metadata: {
          display_name: canvaUser.user?.display_name,
          client_id: stateData.clientId,
        },
        created_at: new Date().toISOString(),
      });
    } catch {
      // Ignore audit log errors
    }

    // Redirect back
    const redirectUrl = new URL(stateData.redirect, request.url);
    redirectUrl.searchParams.set('success', 'canva_connected');
    return NextResponse.redirect(redirectUrl);
  } catch (error: any) {
    console.error('Canva OAuth callback error:', error);
    return NextResponse.redirect(new URL('/error?message=callback_error', request.url));
  }
}
