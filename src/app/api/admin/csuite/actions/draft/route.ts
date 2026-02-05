import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';
import { normalizeExecutiveRole } from '@/lib/csuite/executiveTypes';

export const dynamic = 'force-dynamic';

const ALLOWED_ACTION_TYPES = new Set([
  'create_kanban_task',
  'send_direct_message',
  'schedule_meeting',
  'n8n_webhook',
  'external_email',
]);

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

function classifyAction(actionType: string): { requires_external: boolean; is_executable: boolean } {
  if (actionType === 'n8n_webhook' || actionType === 'external_email') return { requires_external: true, is_executable: false };
  if (actionType === 'create_kanban_task' || actionType === 'send_direct_message' || actionType === 'schedule_meeting') {
    return { requires_external: false, is_executable: true };
  }
  return { requires_external: true, is_executable: false };
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

  const role = normalizeExecutiveRole(body?.role);
  const actionType = String(body?.action_type || '').trim();
  const sourceInsightId = body?.source_insight_id ? String(body.source_insight_id) : null;
  const actionPayload = body?.payload ?? null;
  const riskLevel = String(body?.risk_level || 'medium').trim();

  if (!role) return NextResponse.json({ success: false, error: 'role inválido' }, { status: 400 });
  if (!ALLOWED_ACTION_TYPES.has(actionType)) {
    return NextResponse.json({ success: false, error: 'action_type inválido' }, { status: 400 });
  }
  if (sourceInsightId && !isUuid(sourceInsightId)) {
    return NextResponse.json({ success: false, error: 'source_insight_id inválido' }, { status: 400 });
  }
  if (!actionPayload || typeof actionPayload !== 'object') {
    return NextResponse.json({ success: false, error: 'payload inválido' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { data: exec } = await admin.from('ai_executives').select('id').eq('role', role).maybeSingle();
  if (!exec?.id) return NextResponse.json({ success: false, error: 'Executivo não encontrado' }, { status: 400 });

  const flags = classifyAction(actionType);

  const { data: draft, error } = await admin
    .from('ai_executive_action_drafts')
    .insert({
      executive_id: exec.id,
      created_by_user_id: gate.userId,
      source_insight_id: sourceInsightId,
      action_type: actionType,
      action_payload: actionPayload,
      preview: body?.preview ?? {},
      risk_level: ['low', 'medium', 'high'].includes(riskLevel) ? riskLevel : 'medium',
      requires_external: flags.requires_external,
      is_executable: flags.is_executable,
      status: 'draft',
    })
    .select('*')
    .single();

  if (error || !draft) return NextResponse.json({ success: false, error: error?.message || 'Falha ao criar draft' }, { status: 500 });
  return NextResponse.json({ success: true, draft });
}

