import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';
import { normalizeExecutiveRole, EXECUTIVE_ROLES } from '@/lib/csuite/executiveTypes';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  let body: any;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const title = String(body?.title || 'Reunião executiva').trim();
  const meetingType = String(body?.meeting_type || 'review').trim();
  const initiatedByRole = normalizeExecutiveRole(body?.initiated_by_role) || 'ceo';
  const participantsRolesRaw = Array.isArray(body?.participants) ? body.participants : [];
  const participantsRoles = participantsRolesRaw
    .map((x: any) => normalizeExecutiveRole(x))
    .filter(Boolean) as any[];
  const agenda = body?.agenda ?? [];

  const admin = getSupabaseAdmin();
  const allRoles = participantsRoles.length ? participantsRoles : EXECUTIVE_ROLES;
  const { data: execs } = await admin.from('ai_executives').select('id, role').in('role', allRoles);
  const participantIds = (execs || []).map((e: any) => String(e.id));

  const { data: initiator } = await admin.from('ai_executives').select('id').eq('role', initiatedByRole).maybeSingle();

  const { data: meeting, error } = await admin
    .from('ai_executive_meetings')
    .insert({
      title,
      meeting_type: meetingType,
      initiated_by: initiator?.id || null,
      trigger_reason: 'manual',
      trigger_data: {},
      participants: participantIds,
      agenda,
      status: 'scheduled',
      priority: 'normal',
      scheduled_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error || !meeting) return NextResponse.json({ success: false, error: error?.message || 'Falha ao criar reunião' }, { status: 500 });
  return NextResponse.json({ success: true, meeting_id: String(meeting.id) });
}

