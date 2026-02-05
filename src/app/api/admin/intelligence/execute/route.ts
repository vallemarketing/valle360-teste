import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';
import { createKanbanTaskFromHub, getOrCreateSuperAdminBoardId } from '@/lib/kanban/hub';

export const dynamic = 'force-dynamic';

type Priority = 'low' | 'medium' | 'high' | 'urgent';

function normalizePriority(v: any): Priority {
  const s = String(v || '').toLowerCase();
  if (s === 'urgent') return 'urgent';
  if (s === 'high') return 'high';
  if (s === 'low') return 'low';
  return 'medium';
}

/**
 * POST /api/admin/intelligence/execute
 * Cria uma tarefa no Kanban "Super Admin" para materializar a execução de uma recomendação.
 * body: { actionId, title, description?, category?, priority? }
 */
export async function POST(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  const admin = getSupabaseAdmin();

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido (JSON)' }, { status: 400 });
  }

  const actionId = String(body?.actionId || body?.id || '').trim();
  const title = String(body?.title || '').trim();
  const description = String(body?.description || '').trim();
  const category = String(body?.category || '').trim();
  const priority = normalizePriority(body?.priority);

  if (!title) return NextResponse.json({ error: 'title é obrigatório' }, { status: 400 });

  try {
    // Idempotência best-effort: se já existe task com mesmo actionId, retorna.
    if (actionId) {
      const { data: existing } = await admin
        .from('kanban_tasks')
        .select('id, board_id')
        .eq('reference_links->>ci_action_id', actionId)
        .limit(1)
        .maybeSingle();
      if (existing?.id && existing?.board_id) {
        return NextResponse.json({
          success: true,
          already_executed: true,
          task: { id: String(existing.id), board_id: String(existing.board_id) },
          link: `/admin/meu-kanban?boardId=${encodeURIComponent(String(existing.board_id))}&taskId=${encodeURIComponent(String(existing.id))}`,
        });
      }
    }

    const boardId = await getOrCreateSuperAdminBoardId(admin as any, gate.userId);

    const fullDesc = [
      description ? description : null,
      category ? `Categoria: ${category}` : null,
      actionId ? `CI Action ID: ${actionId}` : null,
      `Executado por: ${gate.userId}`,
      `Executado em: ${new Date().toISOString()}`,
    ]
      .filter(Boolean)
      .join('\n');

    const task = await createKanbanTaskFromHub(admin as any, {
      boardId,
      clientId: null,
      title,
      description: fullDesc,
      status: 'todo',
      priority,
      area: 'admin',
      createdBy: gate.userId,
      referenceLinks: {
        source: 'intelligence_center',
        ci_action_id: actionId || null,
        category: category || null,
      },
    });

    return NextResponse.json({
      success: true,
      already_executed: false,
      task,
      link: `/admin/meu-kanban?boardId=${encodeURIComponent(String(task.board_id))}&taskId=${encodeURIComponent(String(task.id))}`,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro ao executar ação' }, { status: 500 });
  }
}




