import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/set-session
 * Bridge: grava a sessão do Supabase em cookies (compatível com route handlers usando auth-helpers).
 * body: { access_token, refresh_token }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const access_token = body?.access_token as string | undefined;
    const refresh_token = body?.refresh_token as string | undefined;

    if (!access_token || !refresh_token) {
      return NextResponse.json({ error: 'access_token e refresh_token são obrigatórios' }, { status: 400 });
    }

    const supabase = createRouteHandlerClient({ cookies });
    const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, user: data.user });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
  }
}


