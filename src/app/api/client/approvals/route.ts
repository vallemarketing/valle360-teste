import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { notifyAreaUsers } from '@/lib/admin/notifyArea';

export const dynamic = 'force-dynamic';

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function addHours(iso: string, hours: number) {
  const d = new Date(iso);
  d.setHours(d.getHours() + hours);
  return d.toISOString();
}

type ApprovalAction = 'approve' | 'request_changes';

function jsonError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const { data: auth, error: authErr } = await supabase.auth.getUser();
  const user = auth?.user;
  if (authErr || !user) return jsonError('Não autorizado', 401);

  const service = getServiceSupabase();
  if (!service) return jsonError('SUPABASE_SERVICE_ROLE_KEY não configurada no servidor', 500);

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('user_type')
    .eq('user_id', user.id)
    .maybeSingle();

  const { data: isAdmin } = await supabase.rpc('is_admin');
  if (!isAdmin && profile?.user_type !== 'client') return jsonError('Acesso negado', 403);

  const { data: clientRow } = await service.from('clients').select('id').eq('user_id', user.id).maybeSingle();
  const clientId = clientRow?.id || null;
  if (!clientId && !isAdmin) return jsonError('Cliente não vinculado (clients.user_id)', 400);

  // Descobrir todas as colunas "aprovacao" (por área)
  const { data: approvalCols } = await service
    .from('kanban_columns')
    .select('id, sla_hours')
    .eq('stage_key', 'aprovacao')
    .limit(500);

  const approvalColumnIds = (approvalCols || []).map((c: any) => String(c.id));
  if (approvalColumnIds.length === 0) return NextResponse.json({ success: true, approvals: [] });

  const { data: tasks } = await service
    .from('kanban_tasks')
    .select(
      `
        id, title, description, board_id, column_id, due_date, created_at, updated_at, status, priority, tags, reference_links,
        board:kanban_boards ( id, area_key ),
        column:kanban_columns ( id, name, stage_key, position, sla_hours )
      `
    )
    .eq('client_id', clientId)
    .in('column_id', approvalColumnIds)
    .neq('status', 'cancelled')
    .order('updated_at', { ascending: true });

  const now = new Date().toISOString();
  const approvals = (tasks || []).map((t: any) => {
    const ref = (t.reference_links || {}) as any;
    const approval = (ref.client_approval || {}) as any;
    const requestedAt = approval.requested_at || t.updated_at || t.created_at;
    const slaHours = Number(t?.column?.sla_hours || 48);
    const dueAt = approval.due_at || addHours(String(requestedAt), slaHours);
    const overdue = new Date(dueAt).getTime() < new Date(now).getTime();
    return {
      id: t.id,
      title: t.title,
      description: t.description,
      board: t.board || null,
      column: t.column || null,
      requested_at: requestedAt,
      due_at: dueAt,
      overdue,
      reference_links: t.reference_links || null,
    };
  });

  return NextResponse.json({ success: true, approvals });
}

export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const { data: auth, error: authErr } = await supabase.auth.getUser();
  const user = auth?.user;
  if (authErr || !user) return jsonError('Não autorizado', 401);

  const service = getServiceSupabase();
  if (!service) return jsonError('SUPABASE_SERVICE_ROLE_KEY não configurada no servidor', 500);

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('user_type, full_name, email')
    .eq('user_id', user.id)
    .maybeSingle();

  const { data: isAdmin } = await supabase.rpc('is_admin');
  if (!isAdmin && profile?.user_type !== 'client') return jsonError('Acesso negado', 403);

  let body: any;
  try {
    body = await request.json();
  } catch {
    return jsonError('Body inválido (JSON)', 400);
  }

  const taskId = String(body?.taskId || '').trim();
  const action = String(body?.action || '').trim() as ApprovalAction;
  const comment = String(body?.comment || '').trim();

  if (!taskId) return jsonError('taskId obrigatório', 400);
  if (action !== 'approve' && action !== 'request_changes') return jsonError('action inválida', 400);
  if (action === 'request_changes' && !comment) return jsonError('Descreva o que precisa ser ajustado', 400);

  const { data: clientRow } = await service.from('clients').select('id').eq('user_id', user.id).maybeSingle();
  const clientId = clientRow?.id || null;
  if (!clientId && !isAdmin) return jsonError('Cliente não vinculado (clients.user_id)', 400);

  const { data: task, error: tErr } = await service
    .from('kanban_tasks')
    .select('id, title, client_id, board_id, column_id, reference_links, assigned_to, created_by, created_at, updated_at')
    .eq('id', taskId)
    .maybeSingle();
  if (tErr || !task) return jsonError('Tarefa não encontrada', 404);

  if (!isAdmin && String(task.client_id) !== String(clientId)) return jsonError('Acesso negado', 403);

  // Validar que está em "aprovacao"
  const { data: currentCol } = await service
    .from('kanban_columns')
    .select('id, board_id, stage_key, position, sla_hours, name')
    .eq('id', task.column_id)
    .maybeSingle();
  if (!currentCol || currentCol.stage_key !== 'aprovacao') return jsonError('Esta tarefa não está aguardando aprovação', 400);

  const { data: board } = await service.from('kanban_boards').select('id, name, area_key').eq('id', task.board_id).maybeSingle();

  // Carregar colunas do board para escolher destino
  const { data: cols } = await service
    .from('kanban_columns')
    .select('id, stage_key, position, name')
    .eq('board_id', task.board_id)
    .order('position', { ascending: true });

  const colList = (cols || []) as any[];
  const pos = Number(currentCol.position || 0);
  const nextCols = colList.filter((c) => Number(c.position) > pos);

  function pickByStageKey(keys: string[]) {
    return nextCols.find((c) => keys.includes(String(c.stage_key || ''))) || colList.find((c) => keys.includes(String(c.stage_key || '')));
  }

  let targetCol: any | null = null;
  if (action === 'approve') {
    targetCol =
      pickByStageKey(['agendamento_publicacao', 'publicacao', 'enviar', 'lancamento']) ||
      pickByStageKey(['finalizado']) ||
      nextCols[0] ||
      null;
  } else {
    targetCol =
      pickByStageKey(['ajustes', 'ajustes_pos_aprovacao']) ||
      colList.find((c) => String(c.stage_key || '').includes('producao')) ||
      colList.find((c) => String(c.stage_key || '').includes('escopo')) ||
      null;
  }
  if (!targetCol) return jsonError('Não encontrei coluna de destino para esta ação', 500);

  const now = new Date().toISOString();
  const ref = (task.reference_links || {}) as any;
  const approval = (ref.client_approval || {}) as any;
  const slaHours = Number(currentCol.sla_hours || 48);

  const historyEntry = {
    action,
    comment: comment || null,
    by_user_id: user.id,
    by_name: profile?.full_name || null,
    by_email: profile?.email || null,
    at: now,
    from_column_id: task.column_id,
    to_column_id: targetCol.id,
  };

  const nextApproval = {
    ...(approval || {}),
    requested_at: approval.requested_at || task.updated_at || task.created_at || now,
    due_at: approval.due_at || addHours(String(approval.requested_at || task.updated_at || task.created_at || now), slaHours),
    status: action === 'approve' ? 'approved' : 'changes_requested',
    last_action_at: now,
    last_action_by: user.id,
    history: Array.isArray(approval.history) ? [...approval.history, historyEntry] : [historyEntry],
  };

  const nextRef = {
    ...ref,
    client_approval: nextApproval,
  };

  const { error: updErr } = await service
    .from('kanban_tasks')
    .update({
      column_id: targetCol.id,
      status: action === 'approve' ? 'in_progress' : 'in_review',
      reference_links: nextRef,
      updated_at: now,
    })
    .eq('id', task.id);
  if (updErr) return jsonError(updErr.message || 'Falha ao atualizar tarefa', 500);

  // Notificar a área / responsável (best-effort)
  const notifyUserId = task.assigned_to || task.created_by;
  try {
    if (notifyUserId) {
      await service.from('notifications').insert({
        user_id: String(notifyUserId),
        type: 'client_approval',
        title: action === 'approve' ? 'Cliente aprovou' : 'Cliente solicitou ajustes',
        message: `${action === 'approve' ? 'Aprovado' : 'Ajustes solicitados'}: ${task.title}${comment ? ` — ${comment}` : ''}`,
        is_read: false,
        link: '/app/kanban',
        metadata: { task_id: task.id, action, board_id: task.board_id, area_key: board?.area_key || null },
        created_at: now,
      });
    }
  } catch {
    // ignore
  }

  try {
    await notifyAreaUsers({
      area: board?.name || String(board?.area_key || 'Head de Marketing'),
      title: action === 'approve' ? 'Cliente aprovou' : 'Cliente solicitou ajustes',
      message: `${task.title}${comment ? ` — ${comment}` : ''}`,
      link: '/app/kanban',
      type: 'client_approval',
      metadata: { task_id: task.id, action, area_key: board?.area_key || null },
    });
  } catch {
    // ignore
  }

  return NextResponse.json({ success: true });
}


