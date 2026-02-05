import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * Meta OAuth Authorization Endpoint
 * Initiates OAuth flow for Instagram/Facebook
 */

const META_APP_ID = process.env.META_APP_ID || '';
const META_REDIRECT_URI = process.env.META_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/meta/callback`;

// Scopes for Instagram and Facebook
const SCOPES = [
  'instagram_basic',
  'instagram_content_publish',
  'instagram_manage_comments',
  'instagram_manage_insights',
  'pages_show_list',
  'pages_read_engagement',
  'pages_manage_posts',
  'business_management',
].join(',');

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

    // Build Meta OAuth URL
    const authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
    authUrl.searchParams.set('client_id', META_APP_ID);
    authUrl.searchParams.set('redirect_uri', META_REDIRECT_URI);
    authUrl.searchParams.set('scope', SCOPES);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('response_type', 'code');

    return NextResponse.redirect(authUrl.toString());
  } catch (error: any) {
    console.error('Meta OAuth authorize error:', error);
    return NextResponse.json(
      { error: 'Erro ao iniciar autenticação' },
      { status: 500 }
    );
  }
}
