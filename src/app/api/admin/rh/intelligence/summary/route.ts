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

function toDateOnly(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function startOfMonthISO(now: Date) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01T00:00:00.000Z`;
}

export async function GET(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  const db = getSupabaseAdmin();
  const now = new Date();

  const totals = {
    employees_active: 0,
    requests_pending: 0,
    requests_approved_this_month: 0,
    goals_active: 0,
    goals_avg_progress: 0,
    goals_at_risk: 0,
    open_jobs: 0,
  };

  const insights: Array<{ severity: 'info' | 'warning' | 'critical' | 'success'; title: string; message: string; href?: string }> = [];

  // 1) Colaboradores ativos
  try {
    // best-effort: tenta filtrar por is_active quando existe; se não existir, conta geral
    const activeTry = await db.from('employees').select('id', { count: 'exact', head: true }).eq('is_active', true);
    if (!activeTry.error) {
      totals.employees_active = activeTry.count || 0;
    } else {
      const anyTry = await db.from('employees').select('id', { count: 'exact', head: true });
      if (anyTry.error) throw anyTry.error;
      totals.employees_active = anyTry.count || 0;
    }
  } catch (e: any) {
    if (!isMissingTableError(e?.message || '')) throw e;
  }

  // 2) Metas (progresso + risco)
  try {
    const { data: goals, error } = await db
      .from('collaborator_goals')
      .select('collaborator_id, overall_progress, period_start, period_end, status')
      .eq('status', 'active')
      .limit(5000);
    if (error) throw error;

    const rows = Array.isArray(goals) ? goals : [];
    totals.goals_active = rows.length;

    if (rows.length) {
      const avg = rows.reduce((acc, g: any) => acc + Number(g?.overall_progress || 0), 0) / rows.length;
      totals.goals_avg_progress = Math.round(avg);

      // risco: >20% abaixo do esperado para o período
      const atRisk = rows.filter((g: any) => {
        const start = g?.period_start ? new Date(String(g.period_start)) : null;
        const end = g?.period_end ? new Date(String(g.period_end)) : null;
        if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) return false;
        const totalDays = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const elapsedDays = Math.min(totalDays, Math.max(0, (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
        const expected = (elapsedDays / totalDays) * 100;
        const actual = Number(g?.overall_progress || 0);
        return actual - expected < -20;
      }).length;
      totals.goals_at_risk = atRisk;
    }
  } catch (e: any) {
    if (!isMissingTableError(e?.message || '')) throw e;
  }

  // 3) Solicitações (via kanban_tasks reference_links)
  try {
    const { data: tasks, error } = await db
      .from('kanban_tasks')
      .select('id, created_at, reference_links')
      .contains('reference_links', { source: 'employee_request' })
      .order('created_at', { ascending: false })
      .limit(1500);
    if (error) throw error;

    const monthStart = new Date(startOfMonthISO(now));
    const rows = Array.isArray(tasks) ? tasks : [];
    let pending = 0;
    let approvedThisMonth = 0;

    for (const t of rows) {
      const links: any = (t as any)?.reference_links || {};
      const req = links?.request || {};
      const status = String(req?.status || '').toLowerCase();
      if (status === 'pending') pending += 1;

      const createdAt = (t as any)?.created_at ? new Date(String((t as any).created_at)) : null;
      if (createdAt && !isNaN(createdAt.getTime()) && createdAt >= monthStart && status === 'approved') {
        approvedThisMonth += 1;
      }
    }

    totals.requests_pending = pending;
    totals.requests_approved_this_month = approvedThisMonth;
  } catch (e: any) {
    if (!isMissingTableError(e?.message || '')) throw e;
  }

  // 4) Vagas abertas (job_openings)
  try {
    const { count, error } = await db.from('job_openings').select('id', { count: 'exact', head: true }).eq('status', 'active');
    if (error) throw error;
    totals.open_jobs = count || 0;
  } catch (e: any) {
    if (!isMissingTableError(e?.message || '')) throw e;
    totals.open_jobs = 0;
  }

  // Insights determinísticos (sem LLM)
  if (totals.requests_pending > 0) {
    insights.push({
      severity: totals.requests_pending >= 10 ? 'critical' : 'warning',
      title: 'Solicitações pendentes',
      message: `Você tem ${totals.requests_pending} solicitações de colaboradores pendentes (RH/Operação).`,
      href: '/admin/solicitacoes',
    });
  } else {
    insights.push({
      severity: 'success',
      title: 'Solicitações em dia',
      message: 'Nenhuma solicitação pendente no momento.',
      href: '/admin/solicitacoes',
    });
  }

  if (totals.goals_active > 0) {
    insights.push({
      severity: totals.goals_at_risk > 0 ? 'warning' : 'info',
      title: 'Metas e progresso',
      message: `Progresso médio das metas ativas: ${totals.goals_avg_progress}%. Em risco: ${totals.goals_at_risk}.`,
      href: '/admin/metas',
    });
  } else {
    insights.push({
      severity: 'info',
      title: 'Metas ainda não geradas',
      message: 'Nenhuma meta ativa encontrada. Gere metas para começar a acompanhar performance.',
      href: '/admin/metas',
    });
  }

  if (totals.open_jobs > 0) {
    insights.push({
      severity: 'info',
      title: 'Vagas abertas',
      message: `Existem ${totals.open_jobs} vagas ativas no momento.`,
      href: '/admin/rh/vagas',
    });
  }

  const note =
    totals.employees_active === 0 &&
    totals.goals_active === 0 &&
    totals.requests_pending === 0 &&
    totals.requests_approved_this_month === 0 &&
    totals.open_jobs === 0
      ? 'Sem dados suficientes ainda (ou schema não aplicado).'
      : null;

  return NextResponse.json({
    success: true,
    as_of: now.toISOString(),
    as_of_date: toDateOnly(now),
    totals,
    insights,
    note,
  });
}


