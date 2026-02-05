import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

type ForwardBody = {
  action: 'forward';
  sourceTaskId: string;
  targetAreaKey: string;
  targetUserId?: string;
  note?: string;
};

type ReturnBody = {
  action: 'return';
  taskId: string;
  note?: string;
};

type MessageOriginBody = {
  action: 'message_origin';
  taskId: string;
  message: string;
};

type Body = ForwardBody | ReturnBody | MessageOriginBody;

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function jsonError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const { data: auth, error: authErr } = await supabase.auth.getUser();
  const user = auth?.user;
  if (authErr || !user) return jsonError('Não autorizado', 401);

  const { data: isAdmin } = await supabase.rpc('is_admin');
  const { data: isEmployee } = await supabase.rpc('is_employee');
  if (!isAdmin && !isEmployee) return jsonError('Acesso negado', 403);

  const service = getServiceSupabase();
  if (!service) return jsonError('SUPABASE_SERVICE_ROLE_KEY não configurada no servidor', 500);

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return jsonError('Body inválido (JSON)', 400);
  }

  if (body.action === 'message_origin') {
    const { taskId, message } = body as MessageOriginBody;
    if (!taskId) return jsonError('taskId obrigatório', 400);
    if (!message?.trim()) return jsonError('message obrigatório', 400);

    // Precisa conseguir ler a tarefa atual via RLS
    const { data: currentTask, error: curErr } = await supabase
      .from('kanban_tasks')
      .select('id, title, board_id, assigned_to, created_by, reference_links')
      .eq('id', taskId)
      .single();
    if (curErr || !currentTask) return jsonError('Tarefa não encontrada ou sem permissão', 404);

    const handoff = ((currentTask as any).reference_links || {})?.handoff as any | undefined;
    const originTaskId = handoff?.source_task_id as string | undefined;
    if (!originTaskId) return jsonError('Esta tarefa não tem vínculo de handoff (origem)', 400);

    const { data: originTask } = await service.from('kanban_tasks').select('id, board_id, assigned_to, created_by').eq('id', originTaskId).maybeSingle();
    if (!originTask) return jsonError('Tarefa de origem não encontrada (service)', 500);

    const { data: originBoard } = await service
      .from('kanban_boards')
      .select('id, area_key, name')
      .eq('id', originTask.board_id)
      .maybeSingle();

    const now = new Date().toISOString();
    const originComment = [
      `Mensagem sobre a tarefa executora: ${currentTask.id}`,
      '',
      message.trim(),
    ].join('\n');

    // Replicar a mensagem como comentário na tarefa de origem (Head/origem)
    await service.from('kanban_task_comments').insert({
      task_id: originTaskId,
      user_id: user.id,
      comment: originComment,
      created_at: now,
    });

    // Notificar origem (se houver usuário), senão inbox por área para admins
    const notifyUserId = originTask.assigned_to || originTask.created_by;
    if (notifyUserId) {
      await service.from('notifications').insert({
        user_id: notifyUserId,
        type: 'kanban_question',
        title: 'Pergunta na demanda',
        message: `Nova mensagem na demanda: ${(currentTask as any).title || 'Tarefa'}`,
        is_read: false,
        link: '/colaborador/kanban',
        metadata: { task_id: originTaskId, from_task_id: currentTask.id },
        created_at: now,
      });
    } else {
      await service.from('notifications').insert({
        user_id: null,
        type: 'kanban_question',
        title: 'Pergunta na demanda (área)',
        message: `Nova mensagem em ${originBoard?.name || 'origem'}: ${(currentTask as any).title || 'Tarefa'}`,
        is_read: false,
        link: '/admin/kanban-app',
        metadata: {
          audience: 'area',
          area: originBoard?.area_key || null,
          task_id: originTaskId,
          from_task_id: currentTask.id,
        },
        created_at: now,
      });
    }

    return NextResponse.json({ success: true });
  }

  if (body.action === 'forward') {
    const { sourceTaskId, targetAreaKey, targetUserId, note } = body;
    if (!sourceTaskId) return jsonError('sourceTaskId obrigatório', 400);
    if (!targetAreaKey) return jsonError('targetAreaKey obrigatório', 400);

    // Permissão: precisa conseguir ler a tarefa origem via RLS
    const { data: sourceTask, error: srcErr } = await supabase
      .from('kanban_tasks')
      .select('*')
      .eq('id', sourceTaskId)
      .single();
    if (srcErr || !sourceTask) return jsonError('Tarefa de origem não encontrada ou sem permissão', 404);

    // Board/coluna destino
    const { data: targetBoard, error: tbErr } = await service
      .from('kanban_boards')
      .select('id, area_key, name')
      .eq('area_key', targetAreaKey)
      .maybeSingle();
    if (tbErr || !targetBoard) return jsonError('Board de destino não encontrado para a área informada', 400);

    const { data: demandCol, error: colErr } = await service
      .from('kanban_columns')
      .select('id, stage_key, name')
      .eq('board_id', targetBoard.id)
      .eq('stage_key', 'demanda')
      .maybeSingle();
    if (colErr || !demandCol) return jsonError('Coluna "Demanda" não encontrada no board de destino', 500);

    // Board/coluna origem (para rastreabilidade)
    const { data: sourceBoard } = await service
      .from('kanban_boards')
      .select('id, area_key, name')
      .eq('id', sourceTask.board_id)
      .maybeSingle();
    const { data: sourceColumn } = await service
      .from('kanban_columns')
      .select('id, stage_key, name')
      .eq('id', sourceTask.column_id)
      .maybeSingle();

    const now = new Date().toISOString();
    const existingLinks = (sourceTask.reference_links || {}) as any;
    const childEntry = {
      target_task_id: null as string | null,
      target_board_id: targetBoard.id,
      target_area_key: targetAreaKey,
      target_user_id: targetUserId || null,
      note: note || null,
      forwarded_by: user.id,
      forwarded_at: now,
    };

    // Criar clone
    const cloneTitle = sourceTask.title;
    const cloneDesc = [
      sourceTask.description || '',
      note ? `\n\nNota do solicitante: ${note}` : '',
      `\n\nOrigem: ${sourceBoard?.name || 'Board'} • Tarefa ${sourceTask.id}`,
    ]
      .join('')
      .trim();

    const cloneReferenceLinks = {
      ...(sourceTask.reference_links || {}),
      handoff: {
        source_task_id: sourceTask.id,
        source_board_id: sourceTask.board_id,
        source_column_id: sourceTask.column_id,
        source_area_key: sourceBoard?.area_key || null,
        source_board_name: sourceBoard?.name || null,
        source_stage_key: sourceColumn?.stage_key || null,
        target_area_key: targetAreaKey,
        target_board_id: targetBoard.id,
        target_board_name: targetBoard.name || null,
        note: note || null,
        forwarded_by: user.id,
        forwarded_at: now,
      },
    };

    const { data: created, error: insErr } = await service
      .from('kanban_tasks')
      .insert({
        board_id: targetBoard.id,
        column_id: demandCol.id,
        title: cloneTitle,
        description: cloneDesc,
        priority: sourceTask.priority,
        status: sourceTask.status || 'todo',
        tags: sourceTask.tags || [],
        due_date: sourceTask.due_date || null,
        client_id: sourceTask.client_id || null,
        area: targetAreaKey,
        reference_links: cloneReferenceLinks,
        assigned_to: targetUserId || null,
        created_by: user.id,
        position: 0,
      })
      .select('*')
      .single();
    if (insErr || !created) return jsonError(insErr?.message || 'Falha ao criar clone', 500);

    // Atualizar origem com histórico de handoffs
    childEntry.target_task_id = created.id;
    const updatedLinks = {
      ...existingLinks,
      handoff_children: Array.isArray(existingLinks.handoff_children)
        ? [...existingLinks.handoff_children, childEntry]
        : [childEntry],
    };

    await service.from('kanban_tasks').update({ reference_links: updatedLinks }).eq('id', sourceTask.id);

    // Notificar usuário destino (se houver)
    if (targetUserId) {
      await service.from('notifications').insert({
        user_id: targetUserId,
        type: 'kanban_handoff',
        title: 'Nova demanda recebida',
        message: `Você recebeu uma demanda: ${cloneTitle}`,
        is_read: false,
        link: '/colaborador/kanban',
        metadata: { task_id: created.id, source_task_id: sourceTask.id, target_area_key: targetAreaKey },
        created_at: now,
      });
    } else {
      // Sem usuário específico: inbox por área (visível para admins)
      await service.from('notifications').insert({
        user_id: null,
        type: 'kanban_handoff',
        title: 'Nova demanda por área',
        message: `Nova demanda para a área ${targetBoard.name}: ${cloneTitle}`,
        is_read: false,
        link: '/admin/kanban-app',
        metadata: {
          audience: 'area',
          area: targetAreaKey,
          task_id: created.id,
          source_task_id: sourceTask.id,
          target_area_key: targetAreaKey,
        },
        created_at: now,
      });
    }

    return NextResponse.json({ success: true, task: created });
  }

  // action === 'return'
  const { taskId, note } = body as ReturnBody;
  if (!taskId) return jsonError('taskId obrigatório', 400);

  const { data: currentTask, error: curErr } = await supabase
    .from('kanban_tasks')
    .select('*')
    .eq('id', taskId)
    .single();
  if (curErr || !currentTask) return jsonError('Tarefa não encontrada ou sem permissão', 404);

  const handoff = (currentTask.reference_links || {})?.handoff as any | undefined;
  const originTaskId = handoff?.source_task_id as string | undefined;
  if (!originTaskId) return jsonError('Esta tarefa não tem vínculo de handoff (origem) para retornar', 400);

  const { data: originTask } = await service.from('kanban_tasks').select('*').eq('id', originTaskId).maybeSingle();
  if (!originTask) return jsonError('Tarefa de origem não encontrada (service)', 500);

  const { data: originBoard } = await service
    .from('kanban_boards')
    .select('id, area_key, name')
    .eq('id', originTask.board_id)
    .maybeSingle();

  // coluna de retorno: preferir "aprovacao" no board de origem; senão "demanda"
  const { data: returnCol } = await service
    .from('kanban_columns')
    .select('id, stage_key, name')
    .eq('board_id', originTask.board_id)
    .in('stage_key', ['aprovacao', 'demanda'])
    .order('stage_key', { ascending: true })
    .maybeSingle();
  if (!returnCol) return jsonError('Não encontrei coluna de retorno no board de origem', 500);

  const now = new Date().toISOString();
  const returnTitle = `Retorno: ${currentTask.title}`;
  const returnDesc = [
    note ? `Nota: ${note}\n\n` : '',
    `Relacionado à tarefa executada: ${currentTask.id}\n`,
    `Origem (handoff): ${originTask.id}\n`,
  ].join('');

  const returnReferenceLinks = {
    handoff_return: {
      from_task_id: currentTask.id,
      origin_task_id: originTask.id,
      returned_by: user.id,
      returned_at: now,
      note: note || null,
    },
  };

  const { data: createdReturn, error: retErr } = await service
    .from('kanban_tasks')
    .insert({
      board_id: originTask.board_id,
      column_id: returnCol.id,
      title: returnTitle,
      description: returnDesc,
      priority: currentTask.priority,
      status: 'todo',
      tags: Array.isArray(currentTask.tags) ? Array.from(new Set([...currentTask.tags, 'retorno'])) : ['retorno'],
      due_date: null,
      client_id: currentTask.client_id || originTask.client_id || null,
      area: originBoard?.area_key || null,
      reference_links: returnReferenceLinks,
      assigned_to: originTask.assigned_to || null,
      created_by: user.id,
      position: 0,
    })
    .select('*')
    .single();
  if (retErr || !createdReturn) return jsonError(retErr?.message || 'Falha ao criar retorno', 500);

  // Notificar o responsável/origem (se existir)
  const notifyUserId = originTask.assigned_to || originTask.created_by;
  if (notifyUserId) {
    await service.from('notifications').insert({
      user_id: notifyUserId,
      type: 'kanban_return',
      title: 'Retorno recebido',
      message: `Retorno da área: ${currentTask.title}`,
      is_read: false,
      link: '/admin/kanban-app',
      metadata: { task_id: createdReturn.id, from_task_id: currentTask.id, origin_task_id: originTask.id },
      created_at: now,
    });
  } else {
    // Sem responsável definido: inbox por área (visível para admins)
    await service.from('notifications').insert({
      user_id: null,
      type: 'kanban_return',
      title: 'Retorno recebido (área)',
      message: `Retorno criado no board ${originBoard?.name || 'origem'}: ${currentTask.title}`,
      is_read: false,
      link: '/admin/kanban-app',
      metadata: {
        audience: 'area',
        area: originBoard?.area_key || null,
        task_id: createdReturn.id,
        from_task_id: currentTask.id,
        origin_task_id: originTask.id,
      },
      created_at: now,
    });
  }

  return NextResponse.json({ success: true, task: createdReturn });
}


