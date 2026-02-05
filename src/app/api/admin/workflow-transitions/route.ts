import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

type WorkflowStatus = 'pending' | 'completed' | 'error';

function asWorkflowStatus(v: any): WorkflowStatus | null {
  const s = String(v || '').toLowerCase();
  if (s === 'pending' || s === 'completed' || s === 'error') return s;
  return null;
}

function uuidOrNull(v: any): string | null {
  if (!v) return null;
  const s = String(v);
  // UUID v4-ish (aceita v1..v5)
  const ok = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
  return ok ? s : null;
}

/**
 * GET /api/admin/workflow-transitions
 * Lista transições de fluxo (hub).
 */
export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { data: isAdmin, error: isAdminError } = await supabase.rpc('is_admin');
  if (isAdminError || !isAdmin) return NextResponse.json({ error: 'Acesso negado (admin)' }, { status: 403 });

  try {
    const { searchParams } = new URL(request.url);
    const status = asWorkflowStatus(searchParams.get('status')) || undefined;
    const fromArea = searchParams.get('from_area') || undefined;
    const toArea = searchParams.get('to_area') || undefined;
    const triggerEvent = searchParams.get('trigger_event') || undefined;
    const limit = Math.max(1, Math.min(500, Number(searchParams.get('limit') || 100)));

    let q = supabase
      .from('workflow_transitions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) q = q.eq('status', status);
    if (fromArea) q = q.eq('from_area', fromArea);
    if (toArea) q = q.eq('to_area', toArea);
    if (triggerEvent) q = q.eq('trigger_event', triggerEvent);

    const { data, error } = await q;
    if (error) throw error;

    return NextResponse.json({ transitions: data || [] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/workflow-transitions
 * Atualiza status de uma transição.
 * body: { id, status, error_message? }
 */
export async function PATCH(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const actorUserId = authData.user.id;

  const { data: isAdmin, error: isAdminError } = await supabase.rpc('is_admin');
  if (isAdminError || !isAdmin) return NextResponse.json({ error: 'Acesso negado (admin)' }, { status: 403 });

  try {
    const body = await request.json();
    const id = body?.id as string | undefined;
    const status = asWorkflowStatus(body?.status);
    const errorMessage = (body?.error_message ?? body?.errorMessage) as string | null | undefined;
    const note = (body?.note ?? body?.completed_note ?? body?.completion_note) as string | null | undefined;
    const action = String(body?.action || '').toLowerCase() || null; // reopen | resolve_error | reroute | mark_error | null
    const nextToArea =
      (body?.to_area ?? body?.toArea ?? body?.new_to_area ?? body?.newToArea ?? null) as string | null | undefined;

    if (!id || !status) {
      return NextResponse.json({ error: 'id e status são obrigatórios' }, { status: 400 });
    }

    const { data: existingRow } = await supabase
      .from('workflow_transitions')
      .select('status,to_area,data_payload')
      .eq('id', id)
      .maybeSingle();

    const prevStatus = String((existingRow as any)?.status || '').toLowerCase();
    const prevToArea = String((existingRow as any)?.to_area || '');
    const prevPayload = ((existingRow as any)?.data_payload || {}) as Record<string, any>;

    const now = new Date().toISOString();

    // Normaliza ação (com fallback compatível)
    const inferredAction =
      action ||
      (status === 'pending' && prevStatus === 'completed'
        ? 'reopen'
        : status === 'pending' && prevStatus === 'error'
          ? 'resolve_error'
          : null);

    // Validações por ação/status atual (robustez do modo manual)
    if (status === 'pending' && inferredAction === 'reopen' && prevStatus !== 'completed') {
      return NextResponse.json({ error: 'Ação inválida: só é possível reabrir quando o status atual é completed' }, { status: 400 });
    }
    if (status === 'pending' && inferredAction === 'resolve_error' && prevStatus !== 'error') {
      return NextResponse.json({ error: 'Ação inválida: só é possível resolver erro quando o status atual é error' }, { status: 400 });
    }
    if (status === 'pending' && inferredAction === 'reroute' && prevStatus !== 'pending') {
      return NextResponse.json({ error: 'Ação inválida: só é possível encaminhar quando o status atual é pending' }, { status: 400 });
    }
    if (status === 'error' && (action === 'mark_error' || action === null) && prevStatus === 'error') {
      return NextResponse.json({ error: 'Ação inválida: transição já está em error' }, { status: 400 });
    }

    const patch: Record<string, any> = {
      status,
      error_message: status === 'error' ? (errorMessage || 'Erro informado pelo admin') : null,
      completed_at: status === 'completed' ? now : null,
    };

    // Marcar como erro (manual): registra nota/auditoria em data_payload e usa nota como error_message (se não vier error_message explícito)
    if (status === 'error') {
      const trimmed = note && String(note).trim() ? String(note).trim() : null;
      if (trimmed) {
        patch.data_payload = {
          ...(prevPayload || {}),
          marked_error_note: trimmed,
          marked_error_by: actorUserId,
          marked_error_at: now,
        };
        patch.error_message = errorMessage || trimmed;
      }
    }

    // Persistir notas/auditoria no data_payload (best-effort + merge)
    if (status === 'completed' && note && String(note).trim()) {
      patch.data_payload = {
        ...(prevPayload || {}),
        completed_note: String(note),
        completed_by: actorUserId,
        completed_at: now,
      };
    }

    // Voltar para pendente (manual): distingue reabrir vs resolver erro + reseta execução do Kanban (sem perder histórico)
    if (status === 'pending') {
      // Limpar completed_at e também limpar error_message
      patch.completed_at = null;
      patch.error_message = null;

      const nextPayload: Record<string, any> = { ...(prevPayload || {}) };

      const kanbanTaskId = nextPayload.kanban_task_id || null;
      const kanbanBoardId = nextPayload.kanban_board_id || null;
      const executedAt = nextPayload.executed_at || null;
      const executedBy = nextPayload.executed_by || null;

      if (kanbanTaskId || kanbanBoardId || executedAt || executedBy) {
        const prevExec = Array.isArray(nextPayload.previous_executions) ? nextPayload.previous_executions : [];
        prevExec.push({
          kanban_task_id: kanbanTaskId,
          kanban_board_id: kanbanBoardId,
          executed_at: executedAt,
          executed_by: executedBy,
          reset_at: now,
          reset_by: actorUserId,
        });
        nextPayload.previous_executions = prevExec;

        delete nextPayload.kanban_task_id;
        delete nextPayload.kanban_board_id;
        delete nextPayload.executed_at;
        delete nextPayload.executed_by;
      }

      const trimmedNote = note && String(note).trim() ? String(note).trim() : null;
      if (trimmedNote) {
        if (inferredAction === 'resolve_error') {
          nextPayload.error_resolved_note = trimmedNote;
          nextPayload.error_resolved_by = actorUserId;
          nextPayload.error_resolved_at = now;
        } else if (inferredAction === 'reroute') {
          // Encaminhar (pending -> pending): muda to_area e registra histórico
          if (!nextToArea || !String(nextToArea).trim()) {
            return NextResponse.json({ error: 'to_area é obrigatório para encaminhar' }, { status: 400 });
          }

          const toArea = String(nextToArea).trim();
          patch.to_area = toArea;

          const history = Array.isArray(nextPayload.reroute_history) ? nextPayload.reroute_history : [];
          history.push({
            from_area: prevToArea,
            to_area: toArea,
            note: trimmedNote,
            rerouted_at: now,
            rerouted_by: actorUserId,
          });
          nextPayload.reroute_history = history;

          nextPayload.rerouted_from_area = prevToArea;
          nextPayload.rerouted_to_area = toArea;
          nextPayload.rerouted_note = trimmedNote;
          nextPayload.rerouted_by = actorUserId;
          nextPayload.rerouted_at = now;
        } else {
          // default: reopen
          nextPayload.reopened_note = trimmedNote;
          nextPayload.reopened_by = actorUserId;
          nextPayload.reopened_at = now;
        }
      } else if (inferredAction === 'reroute') {
        // Encaminhar sem nota: permitido, mas exige to_area
        if (!nextToArea || !String(nextToArea).trim()) {
          return NextResponse.json({ error: 'to_area é obrigatório para encaminhar' }, { status: 400 });
        }
        const toArea = String(nextToArea).trim();
        patch.to_area = toArea;
        const history = Array.isArray(nextPayload.reroute_history) ? nextPayload.reroute_history : [];
        history.push({
          from_area: prevToArea,
          to_area: toArea,
          note: null,
          rerouted_at: now,
          rerouted_by: actorUserId,
        });
        nextPayload.reroute_history = history;
        nextPayload.rerouted_from_area = prevToArea;
        nextPayload.rerouted_to_area = toArea;
        nextPayload.rerouted_note = null;
        nextPayload.rerouted_by = actorUserId;
        nextPayload.rerouted_at = now;
      }

      patch.data_payload = nextPayload;
    }

    const { data, error } = await supabase
      .from('workflow_transitions')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    // Observabilidade/auditoria mínima: grava ação manual no event_log (já como processed)
    try {
      const p: any = patch.data_payload || prevPayload || {};
      const corr = uuidOrNull(p?.correlation_id);

      const eventType =
        status === 'completed'
          ? 'workflow_transition.completed'
          : status === 'error'
            ? 'workflow_transition.marked_error'
            : status === 'pending' && inferredAction === 'reopen'
              ? 'workflow_transition.reopened'
              : status === 'pending' && inferredAction === 'resolve_error'
                ? 'workflow_transition.error_resolved'
                : status === 'pending' && inferredAction === 'reroute'
                  ? 'workflow_transition.rerouted'
                  : 'workflow_transition.updated';

      await supabase.from('event_log').insert({
        event_type: eventType,
        entity_type: 'workflow_transition',
        entity_id: id,
        actor_user_id: actorUserId,
        payload: {
          transition_id: id,
          action: inferredAction,
          prev_status: prevStatus,
          next_status: status,
          prev_to_area: prevToArea,
          next_to_area: patch.to_area || prevToArea,
          note: note || null,
          at: now,
          correlation_id: p?.correlation_id || null,
          client_id: p?.client_id || p?.clientId || null,
          proposal_id: p?.proposal_id || null,
          contract_id: p?.contract_id || null,
          invoice_id: p?.invoice_id || null,
        },
        correlation_id: corr,
        status: 'processed',
        processed_at: now,
      });
    } catch {
      // best-effort: não bloquear a ação manual por falha de auditoria
    }

    return NextResponse.json({ success: true, transition: data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
  }
}


