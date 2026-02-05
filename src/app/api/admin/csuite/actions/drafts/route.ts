import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';
import { normalizeExecutiveRole } from '@/lib/csuite/executiveTypes';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  const url = new URL(request.url);
  const roleParam = url.searchParams.get('role');
  const role = roleParam ? normalizeExecutiveRole(roleParam) : null;

  const admin = getSupabaseAdmin();
  try {
    if (role) {
      const { data: exec } = await admin.from('ai_executives').select('id').eq('role', role).maybeSingle();
      if (!exec?.id) return NextResponse.json({ success: true, drafts: [] });

      const { data, error } = await admin
        .from('ai_executive_action_drafts')
        .select('*')
        .eq('executive_id', exec.id)
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return NextResponse.json({ success: true, drafts: data || [] });
    }

    const { data, error } = await admin
      .from('ai_executive_action_drafts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(40);
    if (error) throw error;
    return NextResponse.json({ success: true, drafts: data || [] });
  } catch (e: any) {
    return NextResponse.json({ success: true, drafts: [], warning: String(e?.message || '') }, { status: 200 });
  }
}

