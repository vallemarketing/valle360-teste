import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { generateWithAI } from '@/lib/ai/aiRouter';

export const dynamic = 'force-dynamic';

function jsonError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

type GenerateMessageBody = {
  action: 'generate_message';
  boardId: string;
  messageType: 'praise' | 'charge' | 'approval_reminder';
  collaboratorId?: string;
  taskIds?: string[];
};

type Body = GenerateMessageBody;

function safeListTitles(tasks: Array<{ title?: string | null }>) {
  return tasks
    .map((t) => String(t.title || '').trim())
    .filter(Boolean)
    .slice(0, 20);
}

export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const { data: auth, error: authErr } = await supabase.auth.getUser();
  const user = auth?.user;
  if (authErr || !user) return jsonError('Não autorizado', 401);

  const { data: isAdmin } = await supabase.rpc('is_admin');
  const { data: isEmployee } = await supabase.rpc('is_employee');
  if (!isAdmin && !isEmployee) return jsonError('Acesso negado', 403);

  const { searchParams } = new URL(request.url);
  const boardId = String(searchParams.get('boardId') || '').trim();
  if (!boardId) return jsonError('boardId é obrigatório', 400);

  const { data: board, error: bErr } = await supabase
    .from('kanban_boards')
    .select('id, name, area_key')
    .eq('id', boardId)
    .maybeSingle();
  if (bErr || !board) return jsonError('Board não encontrado', 404);

  const { data: columns, error: cErr } = await supabase
    .from('kanban_columns')
    .select('id, name, stage_key, sla_hours, wip_limit, position, color')
    .eq('board_id', boardId)
    .order('position');
  if (cErr) return jsonError('Falha ao carregar colunas', 500);

  const { data: tasks, error: tErr } = await supabase
    .from('kanban_tasks')
    .select('id, title, due_date, priority, status, assigned_to, column_id, created_at, updated_at, reference_links')
    .eq('board_id', boardId)
    .neq('status', 'cancelled')
    .limit(2000);
  if (tErr) return jsonError('Falha ao carregar tarefas', 500);

  const colById = new Map<string, any>((columns || []).map((c: any) => [String(c.id), c]));
  const now = Date.now();

  const isDoneTask = (t: any) => {
    const col = colById.get(String(t.column_id));
    const sk = String(col?.stage_key || '').toLowerCase();
    const nm = String(col?.name || '').toLowerCase();
    return sk === 'finalizado' || nm.includes('final');
  };

  const total = (tasks || []).length;
  const done = (tasks || []).filter(isDoneTask).length;
  const overdue = (tasks || []).filter((t: any) => {
    if (isDoneTask(t)) return false;
    if (!t.due_date) return false;
    return new Date(String(t.due_date)).getTime() < now;
  }).length;

  function calcRisk(t: any) {
    const reasons: string[] = [];
    let score = 0;

    const col = colById.get(String(t.column_id));
    const stageKey = String(col?.stage_key || '').toLowerCase();

    // Aprovação do cliente (usa due_at do payload, se houver)
    const dueAtIso = (t.reference_links as any)?.client_approval?.due_at;
    const dueAtMs = dueAtIso ? new Date(String(dueAtIso)).getTime() : NaN;
    if (stageKey === 'aprovacao' && Number.isFinite(dueAtMs)) {
      const diff = dueAtMs - now;
      if (diff < 0) {
        score = Math.max(score, 95);
        reasons.push('Aprovação do cliente atrasada');
      } else if (diff <= 12 * 60 * 60 * 1000) {
        score = Math.max(score, 80);
        reasons.push('Aprovação do cliente em risco (≤ 12h)');
      }
    }

    // Prazo (due_date)
    if (t.due_date) {
      const dueMs = new Date(String(t.due_date)).getTime();
      const diff = dueMs - now;
      if (diff < 0) {
        score = Math.max(score, 100);
        reasons.push('Tarefa atrasada');
      } else if (diff <= 24 * 60 * 60 * 1000) {
        score = Math.max(score, 75);
        reasons.push('Vence em 24h');
      } else if (diff <= 72 * 60 * 60 * 1000) {
        score = Math.max(score, 55);
        reasons.push('Vence em 72h');
      }
    }

    // Stale (sem atualização)
    const upd = t.updated_at ? new Date(String(t.updated_at)).getTime() : NaN;
    if (Number.isFinite(upd)) {
      const days = (now - upd) / (24 * 60 * 60 * 1000);
      if (days >= 7) {
        score += 15;
        reasons.push('Sem atualização há 7d+');
      } else if (days >= 3) {
        score += 8;
        reasons.push('Sem atualização há 3d+');
      }
    }

    // Prioridade
    const pr = String(t.priority || '').toLowerCase();
    if (pr === 'urgent') {
      score += 10;
      reasons.push('Prioridade urgente');
    } else if (pr === 'high') {
      score += 6;
      reasons.push('Prioridade alta');
    }

    score = Math.max(0, Math.min(100, Math.round(score)));
    return { score, reasons, stage_key: stageKey || null };
  }

  const risks = (tasks || [])
    .filter((t: any) => !isDoneTask(t))
    .map((t: any) => ({ task: t, ...calcRisk(t) }))
    .sort((a, b) => b.score - a.score);

  const atRisk = risks.filter((r) => r.score >= 70);
  const topRisk = risks
    .filter((r) => r.score > 0)
    .slice(0, 10)
    .map((r) => ({
      id: r.task.id,
      title: r.task.title,
      score: r.score,
      reasons: r.reasons,
      due_date: r.task.due_date || null,
      stage_key: r.stage_key,
    }));

  const bottlenecks = (columns || [])
    .filter((c: any) => Number(c?.wip_limit || 0) > 0)
    .map((c: any) => {
      const count = (tasks || []).filter((t: any) => String(t.column_id) === String(c.id)).length;
      const limit = Number(c.wip_limit);
      return { column_id: c.id, name: c.name, count, wip_limit: limit, is_bottleneck: count >= limit };
    })
    .filter((x) => x.is_bottleneck);

  return NextResponse.json({
    success: true,
    board,
    metrics: {
      total,
      done,
      overdue,
      at_risk: atRisk.length,
      bottlenecks,
    },
    risk: {
      count: atRisk.length,
      top: topRisk,
    },
  });
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

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return jsonError('Body inválido (JSON)', 400);
  }

  if (body.action !== 'generate_message') return jsonError('action inválida', 400);

  const boardId = String(body.boardId || '').trim();
  const messageType = body.messageType;
  const collaboratorId = body.collaboratorId ? String(body.collaboratorId) : undefined;
  const taskIds = Array.isArray(body.taskIds) ? body.taskIds.map((x) => String(x)).filter(Boolean) : [];

  if (!boardId) return jsonError('boardId é obrigatório', 400);
  if (!messageType) return jsonError('messageType é obrigatório', 400);

  const { data: board } = await supabase.from('kanban_boards').select('id, name, area_key').eq('id', boardId).maybeSingle();
  if (!board) return jsonError('Board não encontrado', 404);

  let tasks: any[] = [];
  if (taskIds.length > 0) {
    const { data, error } = await supabase
      .from('kanban_tasks')
      .select('id, title, due_date, priority, status, assigned_to, board_id, column_id')
      .in('id', taskIds)
      .eq('board_id', boardId);
    if (error) return jsonError('Falha ao carregar tarefas', 500);
    tasks = data || [];
  }

  // Fallback determinístico quando IA não estiver conectada
  const fallback = () => {
    const titles = safeListTitles(tasks);
    const list = titles.length ? `\n\nDemandas:\n- ${titles.join('\n- ')}` : '';
    if (messageType === 'praise') {
      return `Olá! Passando para reconhecer seu trabalho — excelente execução e organização. Obrigado por manter o ritmo e a qualidade.${list}\n\nSe precisar de qualquer suporte, me avise.`;
    }
    if (messageType === 'approval_reminder') {
      return `Olá! Tudo bem? Sua aprovação está pendente para seguirmos com a entrega.${list}\n\nVocê consegue aprovar ou pedir ajustes ainda hoje? Isso ajuda a manter o prazo.`;
    }
    return `Olá! Tudo bem? Precisamos alinhar o andamento de algumas demandas para manter os prazos.${list}\n\nConsegue me dizer o status e se existe algum impedimento?`;
  };

  try {
    const titles = safeListTitles(tasks);
    const role = messageType === 'praise' ? 'elogio' : messageType === 'approval_reminder' ? 'cobrança_cliente' : 'cobrança_time';

    const prompt = [
      `Você é um gestor de operações. Escreva uma mensagem curta em pt-BR (${role}).`,
      `Contexto: Board="${board.name}" area_key="${board.area_key || ''}".`,
      collaboratorId ? `Destinatário (user_id): ${collaboratorId}` : '',
      titles.length ? `Demandas:\n- ${titles.join('\n- ')}` : 'Sem lista de demandas.',
      'Regras: tom respeitoso, objetivo, sem emojis, pedir confirmação de status e próximos passos.',
    ]
      .filter(Boolean)
      .join('\n\n');

    const ai = await generateWithAI({
      task: 'kanban_message',
      actorUserId: user.id,
      entityType: 'kanban_board',
      entityId: boardId,
      messages: [
        { role: 'system', content: 'Você é um assistente corporativo para gestão de Kanban.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      maxTokens: 400,
    });

    const text = String(ai.text || '').trim();
    return NextResponse.json({
      success: true,
      message: text || fallback(),
      ai: { used: !!text, provider: ai.provider, model: ai.model },
    });
  } catch (e: any) {
    return NextResponse.json({
      success: true,
      message: fallback(),
      ai: { used: false, error: e?.message || String(e) },
    });
  }
}



