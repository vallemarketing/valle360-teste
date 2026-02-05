import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { resolveSocialUploadAccess } from '@/lib/social/uploadAccess';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const access = await resolveSocialUploadAccess({ supabase });
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason || 'Acesso negado' }, { status: 403 });
    }

    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from('clients')
      .select('id, company_name, nome_fantasia, razao_social, cidade, estado')
      .order('company_name', { ascending: true })
      .limit(2000);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const clients = (data || []).map((c: any) => {
      const name = c?.company_name || c?.nome_fantasia || c?.razao_social || 'Cliente';
      const city = c?.cidade || c?.city || null;
      const state = c?.estado || c?.state || null;
      return { id: String(c.id), name: String(name), city, state };
    });

    return NextResponse.json({ success: true, clients });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
  }
}


