import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { resolveSocialUploadAccess } from '@/lib/social/uploadAccess';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const access = await resolveSocialUploadAccess({ supabase });
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason || 'Acesso negado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = String(searchParams.get('client_id') || '').trim();
    if (!clientId) return NextResponse.json({ error: 'client_id é obrigatório' }, { status: 400 });

    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from('social_connected_accounts')
      .select('id, client_id, platform, external_account_id, username, display_name, profile_picture_url, status, metadata, updated_at')
      .eq('client_id', clientId)
      .order('platform', { ascending: true })
      .limit(200);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const accounts = (data || []).map((a: any) => ({
      id: String(a.id),
      client_id: String(a.client_id),
      platform: String(a.platform),
      external_account_id: String(a.external_account_id),
      username: a.username ? String(a.username) : null,
      display_name: a.display_name ? String(a.display_name) : null,
      profile_picture_url: a.profile_picture_url ? String(a.profile_picture_url) : null,
      status: a.status ? String(a.status) : 'active',
      metadata: a.metadata || {},
      updated_at: a.updated_at || null,
    }));

    return NextResponse.json({ success: true, accounts });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
  }
}


