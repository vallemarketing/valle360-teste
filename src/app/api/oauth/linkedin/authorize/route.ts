import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * LinkedIn OAuth Authorization Endpoint
 * Initiates OAuth flow for LinkedIn
 */

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID || '';
const LINKEDIN_REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/linkedin/callback`;

// Scopes for LinkedIn
const SCOPES = [
  'openid',
  'profile',
  'email',
  'w_member_social',
].join(' ');

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Get client_id from query params
    const clientId = request.nextUrl.searchParams.get('client_id');
    if (!clientId) {
      return NextResponse.json({ error: 'client_id é obrigatório' }, { status: 400 });
    }

    // Get user role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const role = profile?.role || 'client';

    // Only clients and super_admins can connect
    if (!['client', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: 'Permissão negada' }, { status: 403 });
    }

    // Create state with encoded data
    const stateData = {
      clientId,
      userId: user.id,
      role,
      timestamp: Date.now(),
    };
    const state = Buffer.from(JSON.stringify(stateData)).toString('base64url');

    // Build LinkedIn OAuth URL
    const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', LINKEDIN_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', LINKEDIN_REDIRECT_URI);
    authUrl.searchParams.set('scope', SCOPES);
    authUrl.searchParams.set('state', state);

    return NextResponse.redirect(authUrl.toString());
  } catch (error: any) {
    console.error('LinkedIn OAuth authorize error:', error);
    return NextResponse.json(
      { error: 'Erro ao iniciar autenticação' },
      { status: 500 }
    );
  }
}
