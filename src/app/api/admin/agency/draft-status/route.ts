import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  const { searchParams } = new URL(request.url);
  const draftId = String(searchParams.get('draft_id') || '').trim();

  if (!draftId) {
    return NextResponse.json({ success: false, error: 'draft_id é obrigatório' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('ai_executive_action_drafts')
      .select('id, status, executed_at, execution_result')
      .eq('id', draftId)
      .limit(1)
      .single();

    if (error || !data) {
      return NextResponse.json({ success: false, error: 'Draft não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, draft: data });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: String(e?.message || 'Falha') }, { status: 500 });
  }
}
