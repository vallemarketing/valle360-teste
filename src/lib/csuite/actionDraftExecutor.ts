import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

export type ActionDraftExecutionResult =
  | { ok: true; entity_type: string; entity_id: string | null; [k: string]: any }
  | { ok: false; error: string; [k: string]: any };

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

function normalizeStageKey(v: any): string | null {
  const s = String(v || '').trim().toLowerCase();
  if (!s) return null;
  // normalizar alguns aliases comuns
  if (s === 'a_fazer' || s === 'todo') return 'demanda';
  if (s === 'backlog') return 'demanda';
  return s;
}

function normalizeAreaKey(v: any): string | null {
  const s = String(v || '').trim().toLowerCase();
  return s || null;
}

function extractKanbanHints(payload: any): { areaKey: string | null; stageKey: string | null } {
  const meta = payload?.metadata || payload?.meta || {};
  const areaKey = normalizeAreaKey(meta?.area_key ?? meta?.areaKey ?? payload?.area_key ?? payload?.areaKey);
  const stageKey = normalizeStageKey(meta?.stage_key ?? meta?.stageKey ?? payload?.stage_key ?? payload?.stageKey);
  return { areaKey, stageKey };
}

async function resolveExplicitKanbanTarget(payload: any): Promise<{ column_id: string; board_id: string } | null> {
  const admin = getSupabaseAdmin();

  const boardIdRaw = String(payload?.board_id ?? payload?.boardId ?? '').trim();
  const columnIdRaw = String(payload?.column_id ?? payload?.columnId ?? '').trim();
  const stageKeyRaw = normalizeStageKey(payload?.stage_key ?? payload?.stageKey);

  // 1) Se veio column_id, inferir board_id pelo banco (mais confiável)
  if (columnIdRaw && isUuid(columnIdRaw)) {
    try {
      const { data: col, error } = await admin.from('kanban_columns').select('id, board_id').eq('id', columnIdRaw).maybeSingle();
      if (!error && col?.id && (col as any)?.board_id) {
        const bid = String((col as any).board_id);
        if (isUuid(bid)) return { column_id: columnIdRaw, board_id: bid };
      }
    } catch {
      // ignore
    }
  }

  // 2) Se veio board_id + stage_key, resolver coluna por stage_key
  if (boardIdRaw && isUuid(boardIdRaw) && stageKeyRaw) {
    try {
      const { data: col } = await admin
        .from('kanban_columns')
        .select('id')
        .eq('board_id', boardIdRaw)
        .eq('stage_key', stageKeyRaw)
        .maybeSingle();
      const cid = col?.id ? String(col.id) : '';
      if (cid && isUuid(cid)) return { column_id: cid, board_id: boardIdRaw };
    } catch {
      // ignore
    }
  }

  // 3) Se veio board_id + column_id, confiar (best-effort)
  if (boardIdRaw && columnIdRaw && isUuid(boardIdRaw) && isUuid(columnIdRaw)) {
    return { board_id: boardIdRaw, column_id: columnIdRaw };
  }

  return null;
}

async function pickKanbanTarget(params: {
  areaKey?: string | null;
  stageKey?: string | null;
}): Promise<{ column_id: string; board_id: string } | null> {
  const admin = getSupabaseAdmin();
  const areaKey = normalizeAreaKey(params.areaKey);
  const stageKey = normalizeStageKey(params.stageKey);

  const tryBoardSelect = async (select: string) => {
    try {
      let q = admin.from('kanban_boards').select(select).limit(50);
      if (select.includes('is_active')) q = q.eq('is_active', true);
      const res = areaKey ? await q.eq('area_key', areaKey) : await q;
      if (res.error) return null;
      return (res.data || []) as any[];
    } catch {
      return null;
    }
  };

  // 1) Tentar board por área (se existir)
  const boardRowsByArea =
    (await tryBoardSelect('id, area_key, is_active, created_at')) ||
    (await tryBoardSelect('id, area_key, created_at')) ||
    (await tryBoardSelect('id, area_key')) ||
    null;

  // 2) Se não achou nada por área (ou área não existe no schema), fallback: qualquer board
  const boardRowsAny =
    (await (async () => {
      try {
        const q = admin.from('kanban_boards').select('id, is_active, created_at').eq('is_active', true).order('created_at', { ascending: true }).limit(50);
        const res = await q;
        if (res.error) return null;
        return (res.data || []) as any[];
      } catch {
        return null;
      }
    })()) || (await (async () => {
      try {
        const q = admin.from('kanban_boards').select('id').limit(50);
        const res = await q;
        if (res.error) return null;
        return (res.data || []) as any[];
      } catch {
        return null;
      }
    })());

  // Preferir board ativo quando o campo existir
  const candidateBoards = (boardRowsByArea && boardRowsByArea.length ? boardRowsByArea : boardRowsAny) || [];
  const board =
    candidateBoards.find((b: any) => b?.id && (b?.is_active === true || b?.is_active == null)) ||
    candidateBoards.find((b: any) => b?.id) ||
    null;
  const boardId = board?.id ? String(board.id) : '';
  if (!boardId || !isUuid(boardId)) return null;

  // Se não há área, mas há stageKey, tentar qualquer coluna do sistema com esse stage_key (melhor que escolher board aleatório)
  if (!areaKey && stageKey) {
    try {
      const { data } = await admin
        .from('kanban_columns')
        .select('id, board_id')
        .eq('stage_key', stageKey)
        .order('position', { ascending: true })
        .limit(1);
      const c0 = (data || [])[0] as any;
      const cid = c0?.id ? String(c0.id) : '';
      const bid = c0?.board_id ? String(c0.board_id) : '';
      if (cid && bid && isUuid(cid) && isUuid(bid)) return { board_id: bid, column_id: cid };
    } catch {
      // ignore
    }
  }

  const tryColsSelect = async (select: string) => {
    try {
      const q = admin.from('kanban_columns').select(select).eq('board_id', boardId).limit(80);
      const res = select.includes('position') ? await q.order('position', { ascending: true }) : await q;
      if (res.error) return null;
      return (res.data || []) as any[];
    } catch {
      return null;
    }
  };

  const cols =
    (await tryColsSelect('id, board_id, name, position, stage_key')) ||
    (await tryColsSelect('id, board_id, title, position, stage_key')) ||
    (await tryColsSelect('id, board_id, name, position')) ||
    (await tryColsSelect('id, board_id, title, position')) ||
    (await tryColsSelect('id, board_id, name')) ||
    (await tryColsSelect('id, board_id, title')) ||
    (await tryColsSelect('id, board_id')) ||
    (await tryColsSelect('id'));

  if (!cols || cols.length === 0) return null;

  const lower = (v: any) => String(v || '').toLowerCase();
  const labelOf = (r: any) => lower(r?.name || r?.title || r?.stage_key);

  const byStage =
    (stageKey ? cols.find((c) => String(c?.stage_key || '').toLowerCase() === stageKey) : null) ||
    cols.find((c) => String(c?.stage_key || '').toLowerCase() === 'demanda') ||
    cols.find((c) => labelOf(c).includes('demanda')) ||
    cols.find((c) => labelOf(c).includes('backlog')) ||
    cols.find((c) => labelOf(c).includes('a fazer')) ||
    cols[0];

  const columnId = byStage?.id ? String(byStage.id) : '';
  if (!columnId || !isUuid(columnId)) return null;
  return { board_id: boardId, column_id: columnId };
}

async function pickDefaultKanbanColumn(): Promise<{ column_id: string; board_id: string } | null> {
  const admin = getSupabaseAdmin();
  async function tryQuery(select: string, orderBy?: string) {
    try {
      const q = admin.from('kanban_columns').select(select).limit(50);
      const res = orderBy ? await q.order(orderBy, { ascending: true }) : await q;
      if (res.error) return null;
      return (res.data || []) as any[];
    } catch {
      return null;
    }
  }

  // Tentativas em ordem do schema mais novo (kanban app usa `name`, `position`, `stage_key`)
  const attempts: Array<{ select: string; orderBy?: string }> = [
    { select: 'id, board_id, name, position, stage_key', orderBy: 'position' },
    { select: 'id, board_id, name, position', orderBy: 'position' },
    { select: 'id, board_id, name, stage_key' },
    { select: 'id, board_id, name' },
    { select: 'id, board_id' },
    { select: 'id' },
  ];

  let rows: any[] | null = null;
  for (const a of attempts) {
    rows = await tryQuery(a.select, a.orderBy);
    if (rows && rows.length) break;
  }
  if (!rows || rows.length === 0) return null;

  const lower = (v: any) => String(v || '').toLowerCase();
  const labelOf = (r: any) => lower(r?.name || r?.title || r?.stage_key);

  const preferred =
    rows.find((r) => labelOf(r).includes('backlog')) ||
    rows.find((r) => labelOf(r).includes('a fazer')) ||
    rows.find((r) => labelOf(r).includes('demanda')) ||
    rows[0];

  const columnId = preferred?.id ? String(preferred.id) : '';
  const boardId = preferred?.board_id ? String(preferred.board_id) : '';
  if (!columnId || !isUuid(columnId)) return null;
  if (!boardId || !isUuid(boardId)) {
    // Se não veio board_id (schemas legados), tentamos pegar qualquer board ativo.
    try {
      const { data: boards } = await admin.from('kanban_boards').select('id').order('created_at', { ascending: true }).limit(1);
      const b0 = (boards || [])[0] as any;
      const bid = b0?.id ? String(b0.id) : '';
      if (bid && isUuid(bid)) return { column_id: columnId, board_id: bid };
    } catch {
      // ignore
    }
    return null;
  }
  return { column_id: columnId, board_id: boardId };
}

export async function executeActionDraft(params: { draftId: string; actorUserId: string }) {
  const draftId = String(params.draftId || '').trim();
  const actorUserId = String(params.actorUserId || '').trim();
  if (!isUuid(draftId)) throw new Error('draft_id inválido');
  if (!isUuid(actorUserId)) throw new Error('actorUserId inválido');

  const admin = getSupabaseAdmin();

  const { data: draft, error: draftErr } = await admin.from('ai_executive_action_drafts').select('*').eq('id', draftId).maybeSingle();
  if (draftErr || !draft) throw new Error(draftErr?.message || 'Draft não encontrado');

  if (String(draft.status) !== 'draft') throw new Error(`Draft não está em draft (status=${draft.status})`);
  if (draft.requires_external || !draft.is_executable) {
    throw new Error('Este draft não é executável automaticamente (externo ou bloqueado).');
  }

  const actionType = String(draft.action_type || '').trim();
  const payload = (draft.action_payload || {}) as any;
  const executedAt = new Date().toISOString();
  let executionResult: ActionDraftExecutionResult = { ok: false, error: 'Ação não executada' };

  try {
    if (actionType === 'create_kanban_task') {
      const title = String(payload?.title || payload?.name || '').trim();
      const description = payload?.description != null ? String(payload.description) : null;
      const priorityRaw = String(payload?.priority || 'medium').toLowerCase();
      const dueDate = payload?.due_date ? String(payload.due_date) : null;
      if (!title) throw new Error('payload.title é obrigatório para create_kanban_task');

      const hints = extractKanbanHints(payload);
      const explicit = await resolveExplicitKanbanTarget(payload);
      const hinted = !explicit ? await pickKanbanTarget({ areaKey: hints.areaKey, stageKey: hints.stageKey }) : null;
      const fallback = explicit || hinted || (await pickDefaultKanbanColumn());
      if (!fallback) throw new Error('Não foi possível determinar column_id/board_id do Kanban');

      const assignedIds = Array.isArray(payload?.assigned_user_ids)
        ? payload.assigned_user_ids.map((x: any) => String(x)).filter((x: string) => isUuid(x))
        : [];
      const assignedTo = isUuid(String(payload?.assigned_to || ''))
        ? String(payload.assigned_to)
        : assignedIds.length
          ? assignedIds[0]
          : null;

      const normalizePriority = (p: string) => {
        const v = String(p || '').toLowerCase();
        if (['low', 'medium', 'high', 'urgent'].includes(v)) return v;
        if (v === 'baixa') return 'low';
        if (v === 'media') return 'medium';
        if (v === 'alta') return 'high';
        if (v === 'urgente') return 'urgent';
        return 'medium';
      };
      const priority = normalizePriority(priorityRaw);

      let status = 'in_progress';
      try {
        const { data: col } = await admin
          .from('kanban_columns')
          .select('id, name, stage_key')
          .eq('id', fallback.column_id)
          .maybeSingle();
        const stage = String((col as any)?.stage_key || '').toLowerCase();
        const name = String((col as any)?.name || '').toLowerCase();
        const s = stage || name;
        if (name.includes('backlog')) status = 'backlog';
        else if (name.includes('a fazer')) status = 'todo';
        else if (name.includes('revis')) status = 'in_review';
        else if (name.includes('conclu') || s === 'finalizado' || s.includes('final')) status = 'done';
        else if (name.includes('bloque') || s.includes('bloque')) status = 'blocked';
        else if (name.includes('cancel')) status = 'cancelled';
        else if (s === 'demanda' || s.includes('lead')) status = 'todo';
      } catch {
        // ignore
      }

      let position = 0;
      try {
        const { data: last } = await admin
          .from('kanban_tasks')
          .select('position')
          .eq('board_id', fallback.board_id)
          .eq('column_id', fallback.column_id)
          .order('position', { ascending: false })
          .limit(1);
        const lp = (last || [])[0] as any;
        const n = Number(lp?.position);
        position = Number.isFinite(n) ? n + 1 : 0;
      } catch {
        position = 0;
      }

      const { data: inserted, error } = await admin
        .from('kanban_tasks')
        .insert({
          column_id: fallback.column_id,
          board_id: fallback.board_id,
          title,
          description,
          position,
          assigned_to: assignedTo,
          created_by: actorUserId,
          due_date: dueDate,
          priority,
          status,
          updated_at: executedAt,
          tags: [],
        })
        .select('id, board_id')
        .single();
      if (error) throw error;
      executionResult = { 
        ok: true, 
        entity_type: 'kanban_tasks', 
        entity_id: inserted?.id || null,
        board_id: inserted?.board_id || fallback.board_id
      };
    } else if (actionType === 'send_direct_message') {
      const toUserId = String(payload?.to_user_id || '').trim();
      const text = String(payload?.text || payload?.message || '').trim();
      if (!isUuid(toUserId)) throw new Error('payload.to_user_id inválido');
      if (!text) throw new Error('payload.text é obrigatório');

      const { data: conversationId, error: convErr } = await admin.rpc('get_or_create_direct_conversation', {
        p_user_id_1: actorUserId,
        p_user_id_2: toUserId,
        p_is_client_conversation: false,
      });
      if (convErr || !conversationId) throw new Error(convErr?.message || 'Falha ao criar conversa direta');

      const { data: msg, error: msgErr } = await admin
        .from('direct_messages')
        .insert({
          conversation_id: conversationId,
          from_user_id: actorUserId,
          body: text,
          message_type: 'text',
        })
        .select('id, conversation_id')
        .single();
      if (msgErr || !msg) throw new Error(msgErr?.message || 'Falha ao enviar mensagem');
      executionResult = { ok: true, entity_type: 'direct_messages', entity_id: msg.id, conversation_id: msg.conversation_id };
    } else if (actionType === 'schedule_meeting') {
      const title = String(payload?.title || 'Reunião executiva').trim();
      const meetingType = String(payload?.meeting_type || 'review').trim();
      const participantRoles = Array.isArray(payload?.participants) ? payload.participants.map((x: any) => String(x).toLowerCase()) : [];
      const agenda = payload?.agenda ?? [];

      const { data: execs } = await admin
        .from('ai_executives')
        .select('id, role')
        .in('role', participantRoles.length ? participantRoles : ['ceo', 'cfo', 'cmo', 'cto', 'coo', 'cco', 'chro']);
      const participantIds = (execs || []).map((e: any) => String(e.id));

      const { data: created, error } = await admin
        .from('ai_executive_meetings')
        .insert({
          title,
          meeting_type: meetingType,
          initiated_by: draft.executive_id,
          trigger_reason: 'action_draft',
          trigger_data: { draft_id: draftId },
          participants: participantIds,
          agenda,
          status: 'scheduled',
          priority: 'normal',
          scheduled_at: executedAt,
        })
        .select('id')
        .single();
      if (error) throw error;
      executionResult = { ok: true, entity_type: 'ai_executive_meetings', entity_id: created?.id || null };
    } else {
      throw new Error(`Ação não suportada para execução: ${actionType}`);
    }

    await admin
      .from('ai_executive_action_drafts')
      .update({ status: 'executed', executed_at: executedAt, execution_result: executionResult })
      .eq('id', draftId);

    return { ok: true as const, executedAt, executionResult, draft };
  } catch (e: any) {
    executionResult = { ok: false, error: String(e?.message || 'Falha') };
    try {
      await admin
        .from('ai_executive_action_drafts')
        .update({ status: 'failed', executed_at: executedAt, execution_result: executionResult })
        .eq('id', draftId);
    } catch {
      // ignore
    }
    return { ok: false as const, executedAt, executionResult, draft };
  }
}

