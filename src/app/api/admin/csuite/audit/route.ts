import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';
import { normalizeExecutiveRole } from '@/lib/csuite/executiveTypes';

export const dynamic = 'force-dynamic';

function clampInt(v: any, min: number, max: number, fallback: number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

export async function GET(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  const url = new URL(request.url);
  const roleParam = url.searchParams.get('role');
  const role = roleParam ? normalizeExecutiveRole(roleParam) : null;
  const limit = clampInt(url.searchParams.get('limit'), 5, 60, 25);

  const admin = getSupabaseAdmin();

  try {
    const [{ data: executives }, meetingsRes, decisionsRes, draftsRes] = await Promise.all([
      admin.from('ai_executives').select('id, role, name, title').order('role'),
      admin
        .from('ai_executive_meetings')
        .select(
          'id, created_at, title, meeting_type, initiated_by, participants, status, priority, scheduled_at, started_at, completed_at, outcome_summary, decisions_made, action_items, trigger_reason'
        )
        .order('created_at', { ascending: false })
        .limit(limit),
      admin
        .from('ai_executive_decisions')
        .select(
          'id, created_at, decision_type, category, title, description, proposed_by, approved_by, meeting_id, status, rationale, chosen_option, success_metrics, implementation_plan, deadline, lessons_learned, human_approval_required, human_approved_by, human_approved_at'
        )
        .order('created_at', { ascending: false })
        .limit(limit),
      admin
        .from('ai_executive_action_drafts')
        .select(
          'id, created_at, executive_id, created_by_user_id, source_insight_id, action_type, action_payload, preview, risk_level, requires_external, is_executable, status, executed_at, execution_result'
        )
        .order('created_at', { ascending: false })
        .limit(limit),
    ]);

    const execMap = new Map<string, { id: string; role: string; name: string; title: string }>();
    for (const e of (executives || []) as any[]) {
      if (e?.id) execMap.set(String(e.id), { id: String(e.id), role: String(e.role || ''), name: String(e.name || ''), title: String(e.title || '') });
    }

    let meetings = ((meetingsRes.data || []) as any[]).map((m) => ({
      ...m,
      initiated_by_executive: m?.initiated_by ? execMap.get(String(m.initiated_by)) || null : null,
      participants_executives: Array.isArray(m?.participants)
        ? (m.participants as any[]).map((id) => execMap.get(String(id)) || { id: String(id), role: '', name: '', title: '' })
        : [],
    }));

    let decisions = ((decisionsRes.data || []) as any[]).map((d) => ({
      ...d,
      proposed_by_executive: d?.proposed_by ? execMap.get(String(d.proposed_by)) || null : null,
      approved_by_executives: Array.isArray(d?.approved_by)
        ? (d.approved_by as any[]).map((id) => execMap.get(String(id)) || { id: String(id), role: '', name: '', title: '' })
        : [],
    }));

    let drafts = ((draftsRes.data || []) as any[]).map((a) => ({
      ...a,
      executive: a?.executive_id ? execMap.get(String(a.executive_id)) || null : null,
    }));

    // Opcional: filtro por role
    if (role) {
      const execId = Array.from(execMap.values()).find((x) => String(x.role).toLowerCase() === role)?.id || null;
      if (execId) {
        meetings = meetings.filter((m) => {
          const initiatedBy = String(m?.initiated_by || '');
          const participants = Array.isArray(m?.participants) ? (m.participants as any[]).map((x) => String(x)) : [];
          return initiatedBy === execId || participants.includes(execId);
        });
        decisions = decisions.filter((d) => String(d?.proposed_by || '') === execId);
        drafts = drafts.filter((a) => String(a?.executive_id || '') === execId);
      }
    }

    return NextResponse.json({
      success: true,
      role,
      limit,
      executives: Array.from(execMap.values()),
      meetings,
      decisions,
      drafts,
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: true, role, limit, executives: [], meetings: [], decisions: [], drafts: [], warning: String(e?.message || '') },
      { status: 200 }
    );
  }
}

