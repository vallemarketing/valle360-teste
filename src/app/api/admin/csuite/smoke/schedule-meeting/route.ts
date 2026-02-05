import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';
import { executeActionDraft } from '@/lib/csuite/actionDraftExecutor';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    // ok (defaults)
  }

  const admin = getSupabaseAdmin();

  // Prefer CEO as the creator/executor, but allow overriding role
  const role = String(body?.role || 'ceo').toLowerCase();
  const { data: exec } = await admin.from('ai_executives').select('id, role').eq('role', role).maybeSingle();
  if (!exec?.id) {
    return NextResponse.json({ success: false, error: `Executivo não encontrado (role=${role})` }, { status: 400 });
  }

  const title = String(body?.title || '[SMOKE] Reunião executiva (schedule_meeting)').trim();
  const meetingType = String(body?.meeting_type || 'review').trim();
  const participants = Array.isArray(body?.participants) ? body.participants.map((x: any) => String(x).toLowerCase()) : ['ceo', 'cfo', 'cto', 'cmo', 'coo', 'cco', 'chro'];
  const agenda = Array.isArray(body?.agenda)
    ? body.agenda
    : [
        'Validar criação de reunião via draft schedule_meeting',
        'Confirmar exibição no Histórico/Audit',
        'Confirmar rastreabilidade (trigger_data.draft_id)',
      ];

  const { data: draft, error: draftErr } = await admin
    .from('ai_executive_action_drafts')
    .insert({
      executive_id: exec.id,
      created_by_user_id: gate.userId,
      action_type: 'schedule_meeting',
      action_payload: {
        title,
        meeting_type: meetingType,
        participants,
        agenda,
        metadata: { source: 'smoke', kind: 'schedule_meeting' },
      },
      preview: { label: 'Smoke: schedule_meeting', title, meeting_type: meetingType, participants, agenda },
      risk_level: 'low',
      requires_external: false,
      is_executable: true,
      status: 'draft',
    })
    .select('id')
    .single();

  if (draftErr || !draft?.id) {
    return NextResponse.json({ success: false, error: draftErr?.message || 'Falha ao criar draft' }, { status: 500 });
  }

  const execRes = await executeActionDraft({ draftId: String(draft.id), actorUserId: gate.userId });
  if (!execRes.ok) {
    return NextResponse.json({ success: false, error: execRes.executionResult?.error || 'Falha ao executar draft', draft_id: draft.id }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    draft_id: draft.id,
    executed_at: execRes.executedAt,
    execution_result: execRes.executionResult,
  });
}

