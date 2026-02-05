import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';
import { predictiveEngine, type Prediction } from '@/lib/ai/predictive-engine';
import { perplexityWebSearch } from '@/lib/integrations/perplexity';
import type { ExecutiveRole } from '@/lib/csuite/executiveTypes';

function isMissingTableError(message: string) {
  const m = String(message || '').toLowerCase();
  return (
    m.includes('does not exist') ||
    m.includes('relation') ||
    m.includes('schema cache') ||
    m.includes('could not find the table')
  );
}

function pickTaskForRole(role: ExecutiveRole) {
  if (role === 'chro') return 'hr' as const;
  if (role === 'cmo') return 'strategy' as const;
  if (role === 'ceo') return 'strategy' as const;
  return 'analysis' as const;
}

function defaultPredictionTypesForRole(role: ExecutiveRole): Array<Prediction['type']> {
  switch (role) {
    case 'cfo':
      return ['payment_risk', 'revenue', 'ltv', 'churn'];
    case 'cco':
      return ['churn', 'payment_risk', 'ltv'];
    case 'coo':
      return ['demand_capacity', 'delay', 'budget_overrun'];
    case 'cmo':
      return ['conversion', 'churn', 'revenue'];
    case 'cto':
      return ['demand_capacity', 'performance'];
    case 'chro':
      return ['performance', 'demand_capacity'];
    case 'ceo':
    default:
      return ['payment_risk', 'churn', 'revenue', 'demand_capacity', 'budget_overrun', 'conversion'];
  }
}

async function safeSelect<T = any>(fn: () => PromiseLike<any> | any): Promise<T | null> {
  try {
    const res: any = await fn();
    if (res?.error) return null;
    // supabase-js: { data, error } ou alguns clientes retornam direto "data"
    if (res && typeof res === 'object' && 'data' in res) return res.data as T;
    return res as T;
  } catch (e: any) {
    if (!isMissingTableError(e?.message || '')) {
      // best-effort: ignore
    }
    return null;
  }
}

export async function buildExecutiveContext(params: {
  role: ExecutiveRole;
  actorUserId: string | null;
  includePredictions?: boolean;
  predictionMinConfidence?: number;
  includeEventLog?: boolean;
  includeKanban?: boolean;
  // Memória ativa: quando true, incrementa times_referenced dos itens incluídos no contexto (best-effort).
  touchKnowledge?: boolean;
}): Promise<{
  now: string;
  role: ExecutiveRole;
  signals: {
    predictions: Prediction[];
  };
  data: Record<string, any>;
  missing: string[];
}> {
  const db = getSupabaseAdmin();
  const nowIso = new Date().toISOString();
  const missing: string[] = [];

  const includeEventLog = params.includeEventLog ?? true;
  const includeKanban = params.includeKanban ?? true;

  const eventLog = includeEventLog
    ? await safeSelect<any[]>(() =>
        db
          .from('event_log')
          .select('id, event_type, entity_type, entity_id, created_at, metadata')
          .order('created_at', { ascending: false })
          .limit(30)
      )
    : [];
  if (includeEventLog && !eventLog) missing.push('event_log');

  const recentTasks = includeKanban
    ? await safeSelect<any[]>(() =>
        db
          .from('kanban_tasks')
          .select('id, title, status, priority, due_date, updated_at, created_at, board_id, column_id, area, client_id')
          .order('updated_at', { ascending: false })
          .limit(25)
      )
    : [];
  if (includeKanban && !recentTasks) missing.push('kanban_tasks');

  const overdueInvoices =
    params.role === 'cfo'
      ? await safeSelect<any[]>(() =>
          db
            .from('invoices')
            .select('id, client_id, due_date, amount, status, created_at, paid_at')
            .is('paid_at', null)
            .order('due_date', { ascending: true })
            .limit(30)
        )
      : [];
  if (params.role === 'cfo' && !overdueInvoices) missing.push('invoices');

  const pendingRequests =
    params.role === 'chro'
      ? await safeSelect<any[]>(() =>
          db
            .from('employee_requests')
            .select('id, type, title, start_date, end_date, status, created_at, user_id')
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(20)
        )
      : [];
  if (params.role === 'chro' && !pendingRequests) missing.push('employee_requests');

  // Resolver executive_id (para memória/decisões/web searches)
  const execRow = await safeSelect<any>(() => db.from('ai_executives').select('id, role, name, title').eq('role', params.role).maybeSingle());
  const executiveId = execRow?.id ? String(execRow.id) : null;
  if (!executiveId) missing.push('ai_executives');

  const knowledge = executiveId
    ? await safeSelect<any[]>(() =>
        db
          .from('ai_executive_knowledge')
          .select('id, knowledge_type, category, key, value, confidence, source, valid_from, valid_until, times_referenced, updated_at')
          .eq('executive_id', executiveId)
          .order('times_referenced', { ascending: false, nullsFirst: false })
          .order('updated_at', { ascending: false })
          .limit(20)
      )
    : [];
  if (executiveId && !knowledge) missing.push('ai_executive_knowledge');

  // Memória ativa (best-effort): conta uso dos itens incluídos no contexto.
  // Definição de "uso" aqui = "foi incluído no prompt/contexto" (aproximação segura; sem depender do LLM).
  if (executiveId && params.touchKnowledge === true && Array.isArray(knowledge) && knowledge.length) {
    try {
      // Atualiza no máximo 10 por chamada (evita flood de writes)
      const top = knowledge.slice(0, 10);
      await Promise.all(
        top
          .filter((k: any) => k?.id)
          .map((k: any) =>
            db
              .from('ai_executive_knowledge')
              .update({ times_referenced: Number(k?.times_referenced || 0) + 1 })
              .eq('id', String(k.id))
          )
      );
    } catch {
      // ignore
    }
  }

  const recentDecisions = executiveId
    ? await safeSelect<any[]>(() =>
        db
          .from('ai_executive_decisions')
          .select('id, decision_type, category, title, status, rationale, lessons_learned, created_at, updated_at, meeting_id')
          .eq('proposed_by', executiveId)
          .order('created_at', { ascending: false })
          .limit(10)
      )
    : [];
  if (executiveId && !recentDecisions) missing.push('ai_executive_decisions');

  const recentWebSearches = executiveId
    ? await safeSelect<any[]>(() =>
        db
          .from('ai_executive_web_searches')
          .select('id, query, purpose, provider, model, sources, created_at')
          .eq('executive_id', executiveId)
          .order('created_at', { ascending: false })
          .limit(6)
      )
    : [];
  if (executiveId && !recentWebSearches) missing.push('ai_executive_web_searches');

  let predictions: Prediction[] = [];
  if (params.includePredictions ?? true) {
    const types = defaultPredictionTypesForRole(params.role);
    const min = Math.max(0, Math.min(100, Number(params.predictionMinConfidence ?? 55)));
    const batches = await Promise.all(types.map((t) => predictiveEngine.getPredictions({ type: t, min_confidence: min })));
    predictions = batches.flat().slice(0, 60);
  }

  return {
    now: nowIso,
    role: params.role,
    signals: { predictions },
    data: {
      executive: execRow ? { id: executiveId, role: execRow.role, name: execRow.name, title: execRow.title } : null,
      eventLog: eventLog || [],
      recentTasks: recentTasks || [],
      overdueInvoices: overdueInvoices || [],
      pendingRequests: pendingRequests || [],
      knowledge: knowledge || [],
      recentDecisions: recentDecisions || [],
      recentWebSearches: recentWebSearches || [],
    },
    missing,
  };
}

export async function runMarketWebSearch(params: {
  executiveId: string | null;
  role: ExecutiveRole;
  query: string;
  purpose: string;
}): Promise<{ answer: string; sources: string[]; model: string } | null> {
  try {
    const result = await perplexityWebSearch({ query: params.query });
    const db = getSupabaseAdmin();
    const model = 'sonar';
    // best-effort logging (não derruba)
    try {
      await db.from('ai_executive_web_searches').insert({
        executive_id: params.executiveId,
        query: params.query,
        purpose: params.purpose,
        provider: 'perplexity',
        model,
        answer: result.answer,
        sources: result.sources,
      });
    } catch {
      // ignore
    }
    return { answer: result.answer, sources: result.sources, model };
  } catch (e: any) {
    // Se a busca falhar (ex.: Perplexity não configurado), ainda retornamos um "market stub"
    // para evitar que o LLM invente fontes/números quando o usuário pediu mercado.
    const msg = String(e?.message || 'indisponível');
    return {
      answer:
        `⚠️ Contexto de mercado indisponível agora (Perplexity Sonar): ${msg}.\n` +
        `Não invente números nem fontes; se precisar, peça para configurar a integração Perplexity (db/env).`,
      sources: [],
      model: 'sonar',
    };
  }
}

export const csuitePromptPreamble = `MODO CONSULTIVO (IMPORTANTE):
- Você NÃO executa integrações com terceiros automaticamente.
- Você pode sugerir CTAs e rascunhos de ações, mas a execução só acontece após confirmação humana.
- Não invente números. Se faltar dado, diga o que falta e proponha como coletar.
- Sempre entregue: (1) Diagnóstico curto, (2) 3 ações prioritárias, (3) 1 alerta se houver, (4) como medir.`;

export function llmTaskForRole(role: ExecutiveRole) {
  return pickTaskForRole(role);
}

