import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';
import { generateWithAI, getProviderStatus } from '@/lib/ai/aiRouter';
import { VAL_PERSONAS } from '@/lib/ai/val-personas';

export const dynamic = 'force-dynamic';

type DirectorKey = 'cfo' | 'cto' | 'cmo' | 'chro';

function mapDirectorToPersona(director: DirectorKey) {
  switch (director) {
    case 'cfo':
      return 'financeiro' as const;
    case 'cto':
      return 'operacao' as const;
    case 'cmo':
      return 'head_marketing' as const;
    case 'chro':
      return 'rh' as const;
    default:
      return 'super_admin' as const;
  }
}

async function safeSelect<T = any>(fn: () => any): Promise<T | null> {
  try {
    const res = await fn();
    return (res && typeof res === 'object' && 'data' in res ? (res as any).data : null) as T | null;
  } catch {
    return null;
  }
}

async function buildContext(director: DirectorKey) {
  const db = getSupabaseAdmin();

  const eventLog = await safeSelect<any[]>(() =>
    db
      .from('event_log')
      .select('id, event_type, entity_type, entity_id, created_at, metadata')
      .order('created_at', { ascending: false })
      .limit(30)
  );

  const recentTasks = await safeSelect<any[]>(() =>
    db
      .from('kanban_tasks')
      .select('id, title, status, priority, due_date, updated_at, created_at, board_id, column_id, area, client_id')
      .order('updated_at', { ascending: false })
      .limit(25)
  );

  // Contextos específicos por diretor (best-effort, sem quebrar se tabela não existir)
  const pendingRequests = director === 'chro'
    ? await safeSelect<any[]>(() =>
        db
          .from('employee_requests')
          .select('id, request_type, start_date, end_date, status, created_at, employee_id')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(20)
      )
    : null;

  const overdueInvoices = director === 'cfo'
    ? await safeSelect<any[]>(() =>
        db
          .from('invoices')
          .select('id, client_id, due_date, amount, status, created_at')
          .in('status', ['overdue', 'pending'])
          .order('due_date', { ascending: true })
          .limit(20)
      )
    : null;

  return {
    now: new Date().toISOString(),
    director,
    eventLog: eventLog || [],
    recentTasks: recentTasks || [],
    pendingRequests: pendingRequests || [],
    overdueInvoices: overdueInvoices || [],
  };
}

export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const { data: auth, error: authErr } = await supabase.auth.getUser();
  const user = auth?.user;
  if (authErr || !user) {
    return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
  }

  const { data: isAdmin } = await supabase.rpc('is_admin');
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: 'Acesso negado (admin)' }, { status: 403 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Body inválido (JSON)' }, { status: 400 });
  }

  const director = String(body?.director || '').trim().toLowerCase() as DirectorKey;
  const message = String(body?.message || '').trim();
  const history = Array.isArray(body?.history) ? body.history : [];

  if (!director || !['cfo', 'cto', 'cmo', 'chro'].includes(director)) {
    return NextResponse.json({ success: false, error: 'Director inválido' }, { status: 400 });
  }
  if (!message) {
    return NextResponse.json({ success: false, error: 'Mensagem vazia' }, { status: 400 });
  }

  const personaKey = mapDirectorToPersona(director);
  const persona = (VAL_PERSONAS as any)[personaKey] || (VAL_PERSONAS as any).super_admin;

  const directorPrompt = `Você é a Diretoria Virtual (${director.toUpperCase()}).
Objetivo: avaliar a atividade do site e do sistema (eventos, tarefas, aprovações) e sugerir decisões executivas.
Regras:
- Não invente números. Se faltar dado, diga o que falta e sugira como coletar.
- Sempre retorne: (1) Diagnóstico curto, (2) 3 ações prioritárias, (3) 1 alerta (se houver), (4) como medir.
`;

  const context = await buildContext(director);

  // Montar histórico reduzido (evita prompt gigante)
  const trimmedHistory = history
    .slice(-10)
    .map((m: any) => ({ role: m?.role, content: String(m?.content || '').slice(0, 800) }))
    .filter((m: any) => m.role === 'user' || m.role === 'assistant');

  try {
    const result = await generateWithAI({
      task: director === 'chro' ? 'hr' : director === 'cmo' ? 'strategy' : 'analysis',
      temperature: 0.4,
      maxTokens: 900,
      actorUserId: user.id,
      entityType: 'diretoria_virtual',
      entityId: director,
      messages: [
        { role: 'system', content: `${persona.systemPrompt}\n\n${directorPrompt}` },
        {
          role: 'user',
          content: `Contexto do sistema (JSON):\n${JSON.stringify(context).slice(0, 18_000)}\n\nHistórico recente:\n${JSON.stringify(trimmedHistory)}\n\nPergunta:\n${message}`,
        },
      ],
    });

    return NextResponse.json({
      success: true,
      reply: result.text,
      provider: result.provider,
      model: result.model,
    });
  } catch (e: any) {
    // Degradação graciosa se integrações não estiverem configuradas
    const status = getProviderStatus();
    const hint =
      !status.openrouter && !status.claude && !status.openai && !status.gemini
        ? 'Integrações de IA ainda não estão configuradas. Configure em Integrações (OpenRouter/Claude/OpenAI/Gemini) para habilitar respostas automáticas.'
        : 'Não consegui obter resposta do provedor de IA agora. Tente novamente em instantes.';

    return NextResponse.json({
      success: true,
      reply: `${hint}\n\nEnquanto isso, posso te ajudar se você me disser: qual site/cliente/área quer avaliar e qual métrica importa (leads, conversão, churn, SLA)?`,
      provider: null,
      model: null,
    });
  }
}



