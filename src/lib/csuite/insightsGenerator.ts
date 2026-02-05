import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';
import { generateWithAI } from '@/lib/ai/aiRouter';
import { buildExecutiveContext, csuitePromptPreamble, llmTaskForRole, runMarketWebSearch } from '@/lib/csuite/executiveContext';
import type { ExecutiveRole } from '@/lib/csuite/executiveTypes';

type InsightJson = {
  insight_type: string;
  category: string;
  title: string;
  description: string;
  confidence_score?: number;
  impact_level?: string;
  urgency?: string;
  requires_discussion?: boolean;
  supporting_data?: any;
  data_sources?: any;
  recommended_actions?: any;
};

function clamp01(n: any) {
  const v = Number(n);
  if (!Number.isFinite(v)) return null;
  if (v > 1) return Math.max(0, Math.min(1, v / 100));
  return Math.max(0, Math.min(1, v));
}

async function existsSimilarTitle(params: { executiveId: string; title: string; sinceIso: string }) {
  try {
    const db = getSupabaseAdmin();
    const { data } = await db
      .from('ai_executive_insights')
      .select('id')
      .eq('executive_id', params.executiveId)
      .eq('title', params.title)
      .gte('created_at', params.sinceIso)
      .limit(1);
    return (data || []).length > 0;
  } catch {
    return false;
  }
}

export async function generateInsights(params: {
  role: ExecutiveRole;
  actorUserId: string | null;
  includeMarket?: boolean;
}): Promise<{ created: number; warning?: string | null }> {
  const db = getSupabaseAdmin();

  const { data: exec } = await db.from('ai_executives').select('*').eq('role', params.role).maybeSingle();
  if (!exec?.id) return { created: 0, warning: `Executivo ${params.role} não encontrado em ai_executives.` };

  // Memória ativa: conta uso apenas quando a geração é manual (actorUserId != null). No cron, actorUserId é null.
  const ctx = await buildExecutiveContext({
    role: params.role,
    actorUserId: params.actorUserId,
    includePredictions: true,
    touchKnowledge: Boolean(params.actorUserId),
  });

  const market = params.includeMarket
    ? await runMarketWebSearch({
        executiveId: String(exec.id),
        role: params.role,
        query: `Tendências e benchmarks relevantes para ${params.role.toUpperCase()} em agência de marketing (Brasil). Foque em 2025/2026.`,
        purpose: `Geração de insights de mercado (${params.role})`,
      })
    : null;

  const systemPrompt = `${String(exec.system_prompt || '').trim()}\n\n${csuitePromptPreamble}\n\n` +
    `Você vai gerar INSIGHTS PROATIVOS em JSON para o executivo.\n` +
    `Regras: sem mocks, sem inventar números. Se faltar dado, cite isso e proponha como coletar.\n` +
    `Formato de saída: um JSON válido com a chave "insights" (array).`;

  const result = await generateWithAI({
    task: llmTaskForRole(params.role),
    json: true,
    temperature: 0.35,
    maxTokens: 1200,
    actorUserId: params.actorUserId,
    entityType: 'ai_executive_insights_generate',
    entityId: params.role,
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          `Executivo: ${params.role.toUpperCase()} (${exec.name} — ${exec.title})`,
          `Contexto interno (JSON):\n${JSON.stringify(ctx).slice(0, 18_000)}`,
          market ? `Contexto de mercado (Perplexity Sonar):\n${market.answer}\nFontes:\n${market.sources.join('\n')}` : null,
          `Gere de 3 a 6 insights com recommended_actions (CTAs consultivos).`,
          `Cada insight deve incluir:\n- insight_type (risk|opportunity|performance|strategy)\n- category (financial|operational|marketing|customer|hr|tech|general)\n- title\n- description\n- confidence_score (0.00-1.00)\n- impact_level (low|medium|high|critical)\n- urgency (low|medium|high)\n- requires_discussion (boolean)\n- recommended_actions: array de objetos {label, action_type, payload, requires_external, risk_level}\n`,
          `action_type permitido:\n- create_kanban_task (interno)\n- send_direct_message (interno)\n- schedule_meeting (interno)\n- n8n_webhook (EXTERNO; requires_external=true)\n- external_email (EXTERNO; requires_external=true)\n`,
          `IMPORTANTE: nada executa automaticamente. Apenas sugira CTAs e payloads.`,
        ]
          .filter(Boolean)
          .join('\n\n'),
      },
    ],
  });

  const parsed = (result.json || {}) as any;
  const insights: InsightJson[] = Array.isArray(parsed?.insights) ? parsed.insights : Array.isArray(parsed) ? parsed : [];

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  let created = 0;

  for (const i of insights) {
    const title = String(i?.title || '').trim();
    const description = String(i?.description || '').trim();
    if (!title || !description) continue;

    // evita spam por título repetido no mesmo dia
    const dup = await existsSimilarTitle({ executiveId: String(exec.id), title, sinceIso: since });
    if (dup) continue;

    const confidence = clamp01(i?.confidence_score);
    const row = {
      executive_id: exec.id,
      insight_type: String(i?.insight_type || 'strategy'),
      category: String(i?.category || 'general'),
      title,
      description,
      supporting_data: i?.supporting_data ?? {},
      data_sources: i?.data_sources ?? [],
      confidence_score: confidence,
      impact_level: i?.impact_level ? String(i.impact_level) : null,
      urgency: i?.urgency ? String(i.urgency) : null,
      recommended_actions: i?.recommended_actions ?? [],
      requires_discussion: Boolean(i?.requires_discussion),
      status: 'new',
    };

    try {
      const { error } = await db.from('ai_executive_insights').insert(row);
      if (!error) created++;
    } catch {
      // ignore
    }
  }

  return { created, warning: null };
}

