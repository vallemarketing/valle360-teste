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

    if (!userId) {
      const authHeader = _request.headers.get('authorization') || _request.headers.get('Authorization');
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
      if (token) {
        const { data } = await admin.auth.getUser(token);
        if (data?.user?.id) userId = String(data.user.id);
      }
    }

    if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const db = usedCookieAuth ? (supabase as any) : (admin as any);
    const { data: client } = await db.from('clients').select('id').eq('user_id', userId).maybeSingle();
    const clientId = client?.id ? String(client.id) : null;
    if (!clientId) return NextResponse.json({ error: 'Cliente não vinculado (clients.user_id)' }, { status: 400 });

    const { data, error } = await db
      .from('social_connected_accounts')
      .select('id, client_id, platform, external_account_id, username, display_name, profile_picture_url, status, metadata, updated_at')
      .eq('client_id', clientId)
      .order('platform', { ascending: true })
      .limit(200);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const accounts = (data || []).map((a: any) => ({
      id: String(a.id),
      platform: String(a.platform),
      external_account_id: String(a.external_account_id),
      username: a.username ? String(a.username) : null,
      display_name: a.display_name ? String(a.display_name) : null,
      profile_picture_url: a.profile_picture_url ? String(a.profile_picture_url) : null,
      status: a.status ? String(a.status) : 'active',
      metadata: a.metadata || {},
      updated_at: a.updated_at || null,
    }));

    return NextResponse.json({ success: true, client_id: clientId, accounts });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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

    if (!userId) {
      const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
      if (token) {
        const { data } = await admin.auth.getUser(token);
        if (data?.user?.id) userId = String(data.user.id);
      }
    }

    if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const db = usedCookieAuth ? (supabase as any) : (admin as any);
    const { data: client } = await db.from('clients').select('id').eq('user_id', userId).maybeSingle();
    const clientId = client?.id ? String(client.id) : null;
    if (!clientId) return NextResponse.json({ error: 'Cliente não vinculado (clients.user_id)' }, { status: 400 });

    const { searchParams } = new URL(request.url);
    const accountId = String(searchParams.get('account_id') || '').trim();
    if (!accountId) return NextResponse.json({ error: 'account_id é obrigatório' }, { status: 400 });

    // Se usamos service role, garantimos ownership manualmente via client_id
    const { error } = await db.from('social_connected_accounts').delete().eq('id', accountId).eq('client_id', clientId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
  }
}


