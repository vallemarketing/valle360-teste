import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { executeActionDraft } from '@/lib/csuite/actionDraftExecutor';

export const dynamic = 'force-dynamic';

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export async function POST(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Body inválido (JSON)' }, { status: 400 });
  }

  const draftId = String(body?.draft_id || '').trim();
  if (!draftId || !isUuid(draftId)) return NextResponse.json({ success: false, error: 'draft_id inválido' }, { status: 400 });

  const exec = await executeActionDraft({ draftId, actorUserId: gate.userId });
  if (!exec.ok) return NextResponse.json({ success: false, error: exec.executionResult?.error || 'Falha' }, { status: 400 });
  
  // Retornar informações adicionais sobre a tarefa criada
  const result = exec.executionResult;
  const response: any = { 
    success: true, 
    executed_at: exec.executedAt, 
    execution_result: result 
  };

  // Se criou uma tarefa no Kanban, adicionar informações úteis
  if (result.ok && result.entity_type === 'kanban_tasks' && result.entity_id) {
    response.kanban_task_id = result.entity_id;
    response.board_id = result.board_id;
    response.kanban_url = `/admin/kanban-app${result.board_id ? `?boardId=${result.board_id}` : ''}${result.entity_id ? `&taskId=${result.entity_id}` : ''}`;
  }

  return NextResponse.json(response);
}

