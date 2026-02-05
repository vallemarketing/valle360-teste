import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/google/callback`;

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

    // Google Drive and Calendar scopes
    const scopes = [
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events',
    ].join(' ');

    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.set('client_id', GOOGLE_CLIENT_ID);
    url.searchParams.set('redirect_uri', GOOGLE_REDIRECT_URI);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', scopes);
    url.searchParams.set('access_type', 'offline');
    url.searchParams.set('prompt', 'consent');
    url.searchParams.set('state', state);

    return NextResponse.redirect(url.toString());
  } catch (error: any) {
    console.error('Google OAuth error:', error);
    return NextResponse.redirect(new URL('/error?message=oauth_error', request.url));
  }
}
