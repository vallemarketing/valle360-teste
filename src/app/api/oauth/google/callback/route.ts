import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/google/callback`;

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('Google OAuth error:', error);
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
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: GOOGLE_REDIRECT_URI,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error('Failed to get Google tokens:', tokenData);
      return NextResponse.redirect(new URL('/error?message=token_error', request.url));
    }

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const googleUser = await userInfoResponse.json();

    // Store connection
    const connectionData = {
      user_id: stateData.userId,
      client_id: stateData.clientId || null,
      platform: 'google_drive',
      account_id: googleUser.id,
      account_name: googleUser.email,
      account_avatar: googleUser.picture,
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
      console.error('Failed to save Google connection:', dbError);
      // Try alternative table
      await supabase.from('integrations').upsert({
        user_id: stateData.userId,
        type: 'google_drive',
        config: {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
          email: googleUser.email,
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
        resource_type: 'google_drive',
        metadata: {
          email: googleUser.email,
          client_id: stateData.clientId,
        },
        created_at: new Date().toISOString(),
      });
    } catch {
      // Ignore audit log errors
    }

    // Redirect back
    const redirectUrl = new URL(stateData.redirect, request.url);
    redirectUrl.searchParams.set('success', 'google_connected');
    return NextResponse.redirect(redirectUrl);
  } catch (error: any) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(new URL('/error?message=callback_error', request.url));
  }
}
