import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

export const dynamic = 'force-dynamic';

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export async function POST(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Body inválido (JSON)' }, { status: 400 });
  }

  const decisionId = String(body?.decision_id || '').trim();
  if (!decisionId || !isUuid(decisionId)) return NextResponse.json({ success: false, error: 'decision_id inválido' }, { status: 400 });

  const admin = getSupabaseAdmin();
  const { data: row, error } = await admin.from('ai_executive_decisions').select('*').eq('id', decisionId).maybeSingle();
  if (error || !row) return NextResponse.json({ success: false, error: error?.message || 'Decisão não encontrada' }, { status: 404 });

  const status = String(row.status || '').toLowerCase();
  if (status !== 'proposed') return NextResponse.json({ success: false, error: `Decisão não está em proposed (status=${row.status})` }, { status: 400 });

  const now = new Date().toISOString();
  try {
    const { error: updErr } = await admin
      .from('ai_executive_decisions')
      .update({
        status: 'approved',
        human_approved_by: gate.userId,
        human_approved_at: now,
      })
      .eq('id', decisionId);
    if (updErr) throw updErr;

    return NextResponse.json({ success: true, approved_at: now });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: String(e?.message || 'Falha ao aprovar') }, { status: 400 });
  }
}

