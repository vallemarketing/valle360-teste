import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

export const dynamic = 'force-dynamic';

function isMissingTableError(message: string) {
  const m = String(message || '').toLowerCase();
  return (
    m.includes('does not exist') ||
    m.includes('relation') ||
    m.includes('schema cache') ||
    m.includes('could not find the table')
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function mapAreasToDepartment(areas?: string[] | null) {
  const a = (areas || []).map((x) => String(x).toLowerCase());
  if (a.some((x) => x.includes('design'))) return 'Design';
  if (a.some((x) => x.includes('social'))) return 'Marketing';
  if (a.some((x) => x.includes('trafego'))) return 'Marketing';
  if (a.some((x) => x.includes('video'))) return 'Marketing';
  if (a.some((x) => x.includes('finance'))) return 'Financeiro';
  if (a.some((x) => x.includes('rh'))) return 'RH';
  if (a.some((x) => x.includes('comercial'))) return 'Comercial';
  if (a.some((x) => x.includes('dev')) || a.some((x) => x.includes('tech'))) return 'Desenvolvimento';
  return 'Geral';
}

function mapAreasToRole(areas?: string[] | null) {
  const joined = (areas || []).join(', ').trim();
  return joined || 'Colaborador';
}

function toDateOnly(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function expectedProgress(now: Date, start: Date, end: Date) {
  const totalDays = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const elapsedDays = clamp((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24), 0, totalDays);
  return (elapsedDays / totalDays) * 100;
}

export async function GET(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  const db = getSupabaseAdmin();
  const now = new Date();

  // =====================================================
  // 0) Jobs (optional) — open jobs count
  // =====================================================
  let openJobsCount: number | null = null;
  try {
    const { count, error } = await db
      .from('job_openings')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active');
    if (error) throw error;
    openJobsCount = count ?? 0;
  } catch (e: any) {
    if (!isMissingTableError(e?.message || '')) throw e;
    openJobsCount = null;
  }

  // =====================================================
  // 1) Employees (base)
  // =====================================================
  let employeesRows: any[] = [];
  try {
    const { data, error } = await db
      .from('employees')
      .select('id,user_id,full_name,first_name,last_name,areas,photo_url,admission_date,created_at,is_active')
      .order('created_at', { ascending: false })
      .limit(800);
    if (error) throw error;
    employeesRows = (data || []) as any[];
  } catch (e: any) {
    if (!isMissingTableError(e?.message || '')) throw e;
    employeesRows = [];
  }

  const employeeByUserId = new Map<string, any>();
  for (const e of employeesRows) {
    if (e?.user_id) employeeByUserId.set(String(e.user_id), e);
  }

  // =====================================================
  // 2) Goals (active) → progress + risk
  // =====================================================
  let goalsRows: any[] = [];
  try {
    const { data, error } = await db
      .from('collaborator_goals')
      .select('id,collaborator_id,overall_progress,period_start,period_end,status,updated_at,created_at')
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(5000);
    if (error) throw error;
    goalsRows = (data || []) as any[];
  } catch (e: any) {
    if (!isMissingTableError(e?.message || '')) throw e;
    goalsRows = [];
  }

  const goalByCollaboratorId = new Map<string, any>();
  for (const g of goalsRows) {
    const cid = String(g?.collaborator_id || '').trim();
    if (!cid) continue;
    if (!goalByCollaboratorId.has(cid)) goalByCollaboratorId.set(cid, g);
  }

  // =====================================================
  // 3) Employee requests (kanban tasks) + optional employee_requests status
  // =====================================================
  let requestTasks: any[] = [];
  try {
    const { data, error } = await db
      .from('kanban_tasks')
      .select(
        `
        id, title, created_at, created_by, reference_links,
        column:kanban_columns ( stage_key )
      `
      )
      .contains('reference_links', { source: 'employee_request' })
      .order('created_at', { ascending: false })
      .limit(1500);
    if (error) throw error;
    requestTasks = (data || []) as any[];
  } catch (e: any) {
    if (!isMissingTableError(e?.message || '')) throw e;
    requestTasks = [];
  }

  const employeeRequestIds = Array.from(
    new Set(
      requestTasks
        .map((t) => String((t?.reference_links as any)?.employee_request_id || '').trim())
        .filter(Boolean)
    )
  );

  let employeeRequestStatus = new Map<string, string>();
  if (employeeRequestIds.length > 0) {
    try {
      const { data, error } = await db.from('employee_requests').select('id,status').in('id', employeeRequestIds);
      if (!error) {
        employeeRequestStatus = new Map((data || []).map((r: any) => [String(r.id), String(r.status || '').toLowerCase()]));
      }
    } catch {
      // optional
    }
  }

  const perUserPendingCount = new Map<string, number>();
  const monthStart = startOfMonth(now);
  let requestsPending = 0;
  let requestsApprovedThisMonth = 0;

  const pendingRequestsList: Array<{
    task_id: string;
    name: string | null;
    type: string;
    date: string;
    status: 'pending' | 'approved' | 'rejected';
  }> = [];

  for (const t of requestTasks) {
    const ref = (t?.reference_links || {}) as any;
    const req = (ref?.request || {}) as any;
    const stageKey = String(t?.column?.stage_key || '').toLowerCase();
    const employeeRequestId = String(ref?.employee_request_id || '').trim();
    const dbStatus = employeeRequestId ? employeeRequestStatus.get(employeeRequestId) : null;
    const statusRaw =
      (dbStatus && String(dbStatus).trim()) ||
      String(req?.status || '').trim() ||
      (stageKey.includes('final') ? 'approved' : stageKey.includes('bloq') ? 'rejected' : 'pending');
    const status = (String(statusRaw).toLowerCase() as any) as 'pending' | 'approved' | 'rejected';

    if (status === 'pending') {
      requestsPending += 1;
      const uid = String(t?.created_by || '').trim();
      if (uid) perUserPendingCount.set(uid, (perUserPendingCount.get(uid) || 0) + 1);

      const emp = uid ? employeeByUserId.get(uid) : null;
      const nm = emp?.full_name || `${emp?.first_name || ''} ${emp?.last_name || ''}`.trim() || null;
      pendingRequestsList.push({
        task_id: String(t?.id || ''),
        name: nm,
        type: String(req?.type || ''),
        date: String(req?.start_date || '').slice(0, 10) || String(t?.created_at || '').slice(0, 10),
        status,
      });
    }

    if (status === 'approved') {
      const createdAt = t?.created_at ? new Date(String(t.created_at)) : null;
      if (createdAt && !isNaN(createdAt.getTime()) && createdAt >= monthStart) {
        requestsApprovedThisMonth += 1;
      }
    }
  }

  // =====================================================
  // 4) Build employee cards (derived scores)
  // =====================================================
  const employees = employeesRows.map((e) => {
    const employeeId = String(e?.id || '');
    const userId = String(e?.user_id || '');

    const name = String(e?.full_name || `${e?.first_name || ''} ${e?.last_name || ''}`.trim() || 'Colaborador');
    const areas = (e?.areas || []) as string[] | null;
    const role = mapAreasToRole(areas);
    const department = mapAreasToDepartment(areas);

    const joinedAtRaw = e?.admission_date || e?.created_at || null;
    const joinedAt = joinedAtRaw ? new Date(String(joinedAtRaw)) : new Date();

    const avatar =
      String(e?.photo_url || '').trim() ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;

    // Goal-derived scores (if available)
    const g = employeeId ? goalByCollaboratorId.get(employeeId) : null;
    const progress = clamp(Math.round(Number(g?.overall_progress || 0)), 0, 100);

    let behindSchedule = false;
    if (g?.period_start && g?.period_end) {
      const start = new Date(String(g.period_start));
      const end = new Date(String(g.period_end));
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end.getTime() > start.getTime()) {
        const expected = expectedProgress(now, start, end);
        behindSchedule = progress - expected < -20;
      }
    }

    const pendingMine = userId ? Number(perUserPendingCount.get(userId) || 0) : 0;
    const riskPenalty = (behindSchedule ? 35 : 0) + pendingMine * 8;

    const retentionScore = clamp(100 - riskPenalty, 0, 100);
    const engagementScore = clamp(60 + Math.round(progress * 0.3) - pendingMine * 6 - (behindSchedule ? 10 : 0), 0, 100);
    const performanceScore = progress;

    const riskLevel: 'low' | 'medium' | 'high' =
      retentionScore < 55 || pendingMine >= 3 || (behindSchedule && progress < 55)
        ? 'high'
        : retentionScore < 75 || pendingMine >= 1 || behindSchedule
          ? 'medium'
          : 'low';

    return {
      id: employeeId,
      userId,
      name,
      avatar,
      role,
      department,
      retentionScore,
      engagementScore,
      performanceScore,
      fitCultural: 0,
      discProfile: { D: 0, I: 0, S: 0, C: 0 },
      riskLevel,
      joinedAt: joinedAt.toISOString(),
      meta: {
        hasGoals: Boolean(g),
        pendingRequests: pendingMine,
        behindSchedule,
      },
    };
  });

  const activeEmployees = employeesRows.filter((e) => e?.is_active === true).length || employeesRows.length;

  const engagementAvg =
    employees.length > 0 ? Math.round(employees.reduce((acc, x) => acc + Number(x.engagementScore || 0), 0) / employees.length) : 0;
  const highRisk = employees.filter((e) => e.riskLevel === 'high').length;

  const note =
    employeesRows.length === 0 && goalsRows.length === 0 && requestTasks.length === 0
      ? 'Sem dados (ou schema ainda não aplicado).'
      : null;

  const insight =
    requestsPending > 0
      ? {
          title: 'Prioridade do dia',
          message: `Você tem ${requestsPending} solicitações pendentes. ${highRisk ? `${highRisk} colaboradores estão em alto risco.` : ''}`.trim(),
        }
      : {
          title: 'RH em dia',
          message: highRisk ? `${highRisk} colaboradores estão em alto risco. Revise metas e agende 1:1.` : 'Nenhuma solicitação pendente no momento.',
        };

  return NextResponse.json({
    success: true,
    as_of: now.toISOString(),
    as_of_date: toDateOnly(now),
    kpis: {
      employees_active: activeEmployees,
      engagement_avg: engagementAvg,
      high_risk: highRisk,
      requests_pending: requestsPending,
      requests_approved_this_month: requestsApprovedThisMonth,
      open_jobs: openJobsCount,
    },
    employees,
    pending_requests: pendingRequestsList.slice(0, 20),
    insight,
    note,
  });
}


