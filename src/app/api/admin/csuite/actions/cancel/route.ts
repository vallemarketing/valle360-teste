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

  const draftId = String(body?.draft_id || '').trim();
  const reason = body?.reason != null ? String(body.reason).slice(0, 500) : null;
  if (!draftId || !isUuid(draftId)) return NextResponse.json({ success: false, error: 'draft_id inválido' }, { status: 400 });

  const admin = getSupabaseAdmin();

  const { data: draft, error: draftErr } = await admin.from('ai_executive_action_drafts').select('*').eq('id', draftId).maybeSingle();
  if (draftErr || !draft) return NextResponse.json({ success: false, error: draftErr?.message || 'Draft não encontrado' }, { status: 404 });

  const st = String(draft.status || '').toLowerCase();
  if (st !== 'draft') {
    return NextResponse.json({ success: false, error: `Draft não está em draft (status=${draft.status})` }, { status: 400 });
  }

  try {
    const cancelledAt = new Date().toISOString();
    const nextResult = { cancelled_by: gate.userId, cancelled_at: cancelledAt, reason };

    await admin
      .from('ai_executive_action_drafts')
      .update({
        status: 'cancelled',
        execution_result: { ...(draft.execution_result || {}), ...nextResult },
      })
      .eq('id', draftId);

    return NextResponse.json({ success: true, cancelled_at: cancelledAt });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: String(e?.message || 'Falha ao cancelar') }, { status: 400 });
  }
}

