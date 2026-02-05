import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export async function requireAdmin(
  request: NextRequest
): Promise<{ ok: true; userId: string } | { ok: false; res: NextResponse }> {
  const cookieStore = cookies();
  const supabaseCookie = createRouteHandlerClient({ cookies: () => cookieStore });

  // Aceita cookie OU Bearer token (compat com supabase-js no front)
  const authHeader = request.headers.get('authorization') || '';
  const bearer = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : null;

  const supabaseUser = bearer
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        global: { headers: { Authorization: `Bearer ${bearer}` } },
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      })
    : supabaseCookie;

  const { data: auth } = await supabaseUser.auth.getUser();
  if (!auth.user?.id) {
    return { ok: false, res: NextResponse.json({ error: 'Não autorizado' }, { status: 401 }) };
  }

  const { data: isAdmin, error: isAdminError } = await supabaseUser.rpc('is_admin');
  if (isAdminError || !isAdmin) {
    return { ok: false, res: NextResponse.json({ error: 'Acesso negado (admin)' }, { status: 403 }) };
  }

  return { ok: true, userId: auth.user.id };
}


