import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const admin = createClient(supabaseUrl || 'https://setup-missing.supabase.co', serviceKey || 'setup-missing', {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    let userId: string | null = null;
    let usedCookieAuth = false;
    {
      const { data: auth, error: authErr } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!authErr && user?.id) {
        userId = String(user.id);
        usedCookieAuth = true;
      }
    }

    // Fallback: aceitar Bearer token (quando sessão em cookie não existe)
    if (!userId) {
      const authHeader = _request.headers.get('authorization') || _request.headers.get('Authorization');
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
      if (token) {
        const { data } = await admin.auth.getUser(token);
        if (data?.user?.id) userId = String(data.user.id);
      }
    }

    if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    // RLS: cliente pode ler a própria linha (clients.user_id = auth.uid())
    const db = usedCookieAuth ? (supabase as any) : (admin as any);
    const { data: client, error } = await db
      .from('clients')
      .select('id, company_name, nome_fantasia, razao_social, cidade, estado')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!client?.id) return NextResponse.json({ error: 'Cliente não vinculado (clients.user_id)' }, { status: 400 });

    const name = client.company_name || (client as any).nome_fantasia || (client as any).razao_social || 'Cliente';
    return NextResponse.json({
      success: true,
      client: { id: String(client.id), name, city: (client as any).cidade || null, state: (client as any).estado || null },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
  }
}


