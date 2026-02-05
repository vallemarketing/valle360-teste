import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const adminSupabase = createClient(
  supabaseUrl || 'https://setup-missing.supabase.co',
  supabaseServiceKey || 'setup-missing',
  { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
);

async function requireUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
  if (!token) return null;
  const { data: { user } } = await adminSupabase.auth.getUser(token);
  return user || null;
}

async function requireAdmin(userId: string) {
  const { data } = await adminSupabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();
  const role = (data?.role || '').toLowerCase();
  return role === 'admin' || role === 'super_admin';
}

function timeAgoPtBR(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return 'Agora';
  if (minutes < 60) return `Há ${minutes} minutos`;
  if (hours < 24) return `Há ${hours} horas`;
  return `Há ${days} dias`;
}

function statusLabelPtBR(status: string | null | undefined) {
  const s = String(status || '').toLowerCase();
  if (s === 'processed') return 'Processado';
  if (s === 'pending') return 'Pendente';
  if (s === 'error') return 'Erro';
  return s || '—';
}

function isNoiseEvent(eventType: string) {
  const t = String(eventType || '').toLowerCase();
  // Não mostrar eventos que não agregam valor no dashboard.
  if (!t) return true;
  if (t.startsWith('telemetry.')) return true;
  if (t.startsWith('page_view')) return true;
  if (t.startsWith('health.')) return true;
  // workflow_transition.updated tende a gerar ruído (muitas edições pequenas).
  if (t === 'workflow_transition.updated') return true;
  return false;
}

function activityPresentation(e: any): { title: string; description: string; icon: 'user' | 'task' | 'money' | 'alert'; link?: string } {
  const type = String(e?.event_type || 'system.event');
  const t = type.toLowerCase();
  const payload = (e?.payload || {}) as any;
  const status = statusLabelPtBR(e?.status);

  // Defaults
  let title = type;
  let description = `Status: ${status}`;
  let icon: 'user' | 'task' | 'money' | 'alert' = 'alert';
  let link: string | undefined = `/admin/fluxos?tab=events&status=${encodeURIComponent(String(e?.status || 'pending'))}&q=${encodeURIComponent(type)}`;

  // Workflow transitions
  if (t.startsWith('workflow_transition.')) {
    icon = 'task';
    link = `/admin/fluxos?tab=transitions`;

    const from = payload?.from_area || payload?.prev_to_area || payload?.from_area_key;
    const to = payload?.to_area || payload?.next_to_area || payload?.to_area_key;
    const note = payload?.note ? String(payload.note) : null;

    if (t === 'workflow_transition.executed_to_kanban') {
      title = 'Demanda enviada para o Kanban';
      const taskId = payload?.kanban_task_id ? String(payload.kanban_task_id) : null;
      const boardId = payload?.kanban_board_id ? String(payload.kanban_board_id) : null;
      if (boardId && taskId) link = `/admin/meu-kanban?boardId=${encodeURIComponent(boardId)}&taskId=${encodeURIComponent(taskId)}`;
      description = `${from && to ? `${from} → ${to}` : 'Transição executada'} • ${status}`;
    } else if (t === 'workflow_transition.rerouted') {
      title = 'Demanda encaminhada';
      description = `${payload?.prev_to_area || from || '—'} → ${payload?.next_to_area || to || '—'}${note ? ` • Nota: ${note}` : ''} • ${status}`;
    } else if (t === 'workflow_transition.reopened') {
      title = 'Demanda reaberta';
      description = `${to || from || 'Transição'}${note ? ` • Nota: ${note}` : ''} • ${status}`;
    } else if (t === 'workflow_transition.error_resolved') {
      title = 'Erro do fluxo resolvido';
      description = `${to || from || 'Transição'}${note ? ` • Nota: ${note}` : ''} • ${status}`;
    } else if (t === 'workflow_transition.marked_error') {
      title = 'Fluxo marcado com erro';
      description = `${to || from || 'Transição'}${note ? ` • Nota: ${note}` : ''} • ${status}`;
    } else if (t === 'workflow_transition.completed') {
      title = 'Fluxo concluído';
      description = `${to || from || 'Transição'} • ${status}`;
    } else {
      title = 'Atualização de fluxo';
      description = `${to || from || 'Transição'} • ${status}`;
    }
  }

  // Financeiro (Stripe)
  if (t === 'invoice.paid') {
    icon = 'money';
    title = 'Pagamento confirmado';
    const num = payload?.invoice_number ? String(payload.invoice_number) : null;
    const amount = payload?.amount ? Number(payload.amount) : null;
    description = `${num ? `Fatura ${num}` : 'Fatura paga'}${amount ? ` • R$ ${amount.toLocaleString('pt-BR')}` : ''} • ${status}`;
    link = '/admin/financeiro';
  }

  if (t === 'invoice.payment_failed') {
    icon = 'money';
    title = 'Falha no pagamento';
    const num = payload?.invoice_number ? String(payload.invoice_number) : null;
    description = `${num ? `Fatura ${num}` : 'Fatura'} • ${status}`;
    link = '/admin/financeiro';
  }

  // Comercial
  if (t === 'proposal.sent') {
    icon = 'task';
    title = 'Proposta enviada';
    const clientName = payload?.client_name ? String(payload.client_name) : null;
    description = `${clientName ? `Cliente: ${clientName}` : 'Proposta marcada como enviada'} • ${status}`;
    link = '/admin/comercial/propostas';
  }
  if (t === 'proposal.accepted') {
    icon = 'task';
    title = 'Proposta aceita';
    const clientName = payload?.client_name ? String(payload.client_name) : null;
    description = `${clientName ? `Cliente: ${clientName}` : 'Cliente aceitou a proposta'} • ${status}`;
    link = '/admin/comercial/propostas';
  }
  if (t === 'proposal.rejected') {
    icon = 'task';
    title = 'Proposta recusada';
    const clientName = payload?.client_name ? String(payload.client_name) : null;
    description = `${clientName ? `Cliente: ${clientName}` : 'Cliente recusou a proposta'} • ${status}`;
    link = '/admin/comercial/propostas';
  }

  // Cadastros
  if (t === 'client.created') {
    icon = 'user';
    title = 'Novo cliente cadastrado';
    const email = payload?.email ? String(payload.email) : null;
    description = `${email ? email : 'Cliente criado'} • ${status}`;
    link = '/admin/clientes';
  }

  if (t === 'employee.created') {
    icon = 'user';
    title = 'Novo colaborador cadastrado';
    const email = payload?.email ? String(payload.email) : null;
    description = `${email ? email : 'Colaborador criado'} • ${status}`;
    link = '/admin/colaboradores';
  }

  // Segurança
  if (t === 'brute_force_detected') {
    icon = 'alert';
    title = 'Alerta de segurança';
    description = `Tentativas suspeitas de login detectadas • ${status}`;
    link = '/admin/monitoramento-sentimento';
  }

  return { title, description, icon, link };
}

function extractPredValue(pv: any) {
  if (pv && typeof pv === 'object') {
    const v = (pv as any).value;
    const n = Number(v);
    return Number.isFinite(n) ? n : v ?? null;
  }
  const n = Number(pv);
  return Number.isFinite(n) ? n : pv ?? null;
}

/**
 * GET /api/admin/dashboard
 * Retorna KPIs reais do Admin (modo teste: com fallback).
 */
export async function GET(request: NextRequest) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  if (!(await requireAdmin(user.id))) return NextResponse.json({ error: 'Acesso negado (admin)' }, { status: 403 });

  try {
    // ===== Clients =====
    const { count: totalClients } = await adminSupabase
      .from('clients')
      .select('*', { count: 'exact', head: true });

    const { count: activeClients } = await adminSupabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .or('status.eq.active,status.eq.ativo,is_active.eq.true');

    // ===== Employees =====
    const { count: totalEmployees } = await adminSupabase
      .from('employees')
      .select('*', { count: 'exact', head: true });

    const { count: activeEmployees } = await adminSupabase
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // ===== Monthly revenue (contracts active) =====
    const { data: contracts } = await adminSupabase
      .from('contracts')
      .select('monthly_value,status,active')
      .limit(500);

    const monthlyRevenue = (contracts || [])
      .filter((c: any) => String(c.status || '').toLowerCase() === 'active' || c.active === true)
      .reduce((sum: number, c: any) => sum + Number(c.monthly_value || 0), 0);

    // ===== Tasks =====
    const pendingStatuses = ['backlog', 'todo', 'in_progress', 'in_review', 'blocked'];
    const { count: pendingTasks } = await adminSupabase
      .from('kanban_tasks')
      .select('*', { count: 'exact', head: true })
      .in('status', pendingStatuses as any);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const { count: completedTasksToday } = await adminSupabase
      .from('kanban_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'done' as any)
      .gte('updated_at', startOfDay.toISOString());

    // ===== Hub pendências (event_log + workflow_transitions) =====
    const { count: pendingEvents } = await adminSupabase
      .from('event_log')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { count: pendingTransitions } = await adminSupabase
      .from('workflow_transitions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const pendingTotal = Number(pendingTasks || 0) + Number(pendingEvents || 0) + Number(pendingTransitions || 0);
    const preferredHubTab = Number(pendingEvents || 0) > 0 ? 'events' : 'transitions';

    // ===== Activity =====
    const { data: lastEvents } = await adminSupabase
      .from('event_log')
      .select('id,event_type,created_at,status,payload,entity_type,entity_id')
      .order('created_at', { ascending: false })
      .limit(20);

    let recentActivity = (lastEvents || [])
      .filter((e: any) => !isNoiseEvent(String(e?.event_type || '')))
      .map((e: any) => {
        const type = String(e?.event_type || 'system.event');
        const p = activityPresentation(e);
        return {
          id: e.id,
          type,
          title: p.title,
          description: p.description,
          time: timeAgoPtBR(e.created_at),
          icon: p.icon,
          link: p.link,
        };
      })
      .slice(0, 6);

    // ===== Preditivo/ML (complemento no dashboard executivo; sem mudar layout) =====
    try {
      const { data: preds } = await adminSupabase
        .from('ml_predictions_log')
        .select('id,prediction_type,predicted_probability,predicted_at,predicted_value')
        .order('predicted_at', { ascending: false })
        .limit(50);

      const rows = (preds || []) as any[];
      const bestOf = (type: string) =>
        rows
          .filter((p) => String(p?.prediction_type || '') === type)
          .map((p) => ({ p, v: extractPredValue(p.predicted_value) }))
          .filter((x) => typeof x.v === 'number' && Number.isFinite(x.v as any))
          .sort((a, b) => Number(b.v) - Number(a.v))[0]?.p || null;

      const churn = bestOf('churn');
      const pay = bestOf('payment_risk');
      const cap = bestOf('demand_capacity');
      const bud = bestOf('budget_overrun');

      const mlActivities: any[] = [];
      const mk = (p: any, title: string, desc: string) => ({
        id: `ml_${String(p.id)}`,
        type: `ml.${String(p.prediction_type || 'prediction')}`,
        title,
        description: desc,
        time: timeAgoPtBR(p.predicted_at || p.created_at || new Date().toISOString()),
        icon: 'alert' as const,
        link: '/admin/analytics/preditivo',
      });

      if (pay) {
        const v = Number(extractPredValue(pay.predicted_value) || 0);
        if (v >= 70) mlActivities.push(mk(pay, 'Risco de pagamento elevado (ML)', `Risco: ${Math.round(v)}% • Ação: cobrar no Financeiro`));
      }
      if (cap) {
        const v = Number(extractPredValue(cap.predicted_value) || 0);
        if (v >= 85) mlActivities.push(mk(cap, 'Capacidade crítica (ML)', `Utilização: ${Math.round(v)}% • Revisar prioridades/RH`));
      }
      if (bud) {
        const v = Number(extractPredValue(bud.predicted_value) || 0);
        if (v >= 80) mlActivities.push(mk(bud, 'Risco de orçamento (campanha) (ML)', `Risco: ${Math.round(v)}% • Revisar budget`));
      }
      if (churn) {
        const v = Number(extractPredValue(churn.predicted_value) || 0);
        if (v >= 70) mlActivities.push(mk(churn, 'Risco de churn (ML)', `Probabilidade: ${Math.round(v)}% • Priorizar retenção`));
      }

      if (mlActivities.length > 0) {
        recentActivity = [...mlActivities.slice(0, 2), ...recentActivity].slice(0, 6);
      }
    } catch {
      // ignore
    }

    // Fallback: se não há eventos ainda, usar audit_logs (ai.request / api.* / system.*)
    if (!recentActivity || recentActivity.length === 0) {
      const { data: auditRows } = await adminSupabase
        .from('audit_logs')
        .select('id,action,created_at,new_values')
        .order('created_at', { ascending: false })
        .limit(6);

      recentActivity = (auditRows || []).map((r: any) => {
        const type = String(r.action || 'audit');
        const nv = r.new_values || {};
        const icon: 'user' | 'task' | 'money' | 'alert' =
          type.includes('invoice') || type.includes('payment') ? 'money' :
          type.includes('client') || type.includes('employee') ? 'user' :
          type.includes('proposal') || type.includes('goal') ? 'task' :
          'alert';

        return {
          id: r.id,
          type,
          title: type.startsWith('workflow_transition.') ? 'Atualização de fluxo' : type,
          description: String(nv.description || 'Log de auditoria'),
          time: timeAgoPtBR(r.created_at),
          icon,
          link: `/admin/auditoria`,
        };
      });
    }

    // ===== Active clients (list) =====
    const { data: clients } = await adminSupabase
      .from('clients')
      .select('id,company_name,nome_fantasia,razao_social,contact_name,contact_email,contact_phone,whatsapp,created_at,monthly_value')
      .order('created_at', { ascending: false })
      .limit(5);

    const activeClientsList = (clients || []).map((c: any) => {
      const company = c.company_name || c.nome_fantasia || c.razao_social || 'Cliente';
      const name = c.contact_name || company;
      const email = c.contact_email || '';
      const phone = c.contact_phone || c.whatsapp || '';

      const createdAt = c.created_at ? new Date(c.created_at) : new Date();
      const days = Math.floor((Date.now() - createdAt.getTime()) / 86400000);
      const status: 'em_dia' | 'atrasado' | 'novo' = days <= 7 ? 'novo' : 'em_dia';

      const monthly = Number(c.monthly_value || 0);
      return {
        id: c.id,
        name,
        company,
        email,
        phone,
        status,
        projectStatus: status === 'novo' ? 'Onboarding' : 'Ativo',
        nextDelivery: '',
        contractValue: monthly ? `R$ ${monthly.toLocaleString('pt-BR')}/mês` : '—',
      };
    });

    return NextResponse.json({
      stats: {
        totalClients: totalClients || 0,
        activeClients: activeClients || 0,
        totalEmployees: totalEmployees || 0,
        activeEmployees: activeEmployees || 0,
        monthlyRevenue,
        pendingTasks: pendingTotal,
        completedTasksToday: completedTasksToday || 0,
        avgClientSatisfaction: 0,
      },
      hub: {
        pending: {
          kanban: Number(pendingTasks || 0),
          events: Number(pendingEvents || 0),
          transitions: Number(pendingTransitions || 0),
          total: pendingTotal,
        },
        preferredTab: preferredHubTab,
        links: {
          pending: `/admin/fluxos?tab=${preferredHubTab}&status=pending`,
        },
      },
      recentActivity,
      activeClients: activeClientsList,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
  }
}


