import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const CANVA_CLIENT_ID = process.env.CANVA_CLIENT_ID || '';
const CANVA_REDIRECT_URI = process.env.CANVA_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/canva/callback`;

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const searchParams = request.nextUrl.searchParams;
    const clientId = searchParams.get('clientId');
    const redirect = searchParams.get('redirect') || '/admin/integracoes';

    // Create state with user and redirect info
    const stateData = {
      userId: user.id,
      clientId,
      redirect,
      timestamp: Date.now(),
    };
    const state = Buffer.from(JSON.stringify(stateData)).toString('base64url');

    // Canva scopes
    const scopes = [
      'design:content:read',
      'design:content:write',
      'design:meta:read',
      'folder:read',
      'asset:read',
      'asset:write',
    ].join(' ');

    const url = new URL('https://www.canva.com/api/oauth/authorize');
    url.searchParams.set('client_id', CANVA_CLIENT_ID);
    url.searchParams.set('redirect_uri', CANVA_REDIRECT_URI);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', scopes);
    url.searchParams.set('state', state);

    return NextResponse.redirect(url.toString());
  } catch (error: any) {
    console.error('Canva OAuth error:', error);
    return NextResponse.redirect(new URL('/error?message=oauth_error', request.url));
  }
}
