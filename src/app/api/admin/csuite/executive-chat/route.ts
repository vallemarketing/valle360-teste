import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';
import { generateWithAI, getProviderStatus } from '@/lib/ai/aiRouter';
import { buildExecutiveContext, csuitePromptPreamble, llmTaskForRole, runMarketWebSearch } from '@/lib/csuite/executiveContext';
import { normalizeExecutiveRole } from '@/lib/csuite/executiveTypes';

export const dynamic = 'force-dynamic';

type ChatMsg = { role: 'user' | 'assistant' | 'system'; content: string };

function trimHistory(history: any[]): ChatMsg[] {
  return (history || [])
    .slice(-12)
    .map((m) => ({ role: m?.role, content: String(m?.content || '').slice(0, 1200) }))
    .filter((m) => m.role === 'user' || m.role === 'assistant' || m.role === 'system');
}

function shouldDoMarketSearch(role: string, message: string, force?: boolean) {
  if (force) return true;
  const m = String(message || '').toLowerCase();
  if (!m) return false;
  if (m.includes('perplexity') || m.includes('sonar')) return true;
  // gatilhos comuns de “mercado”
  const triggers = ['mercado', 'tendência', 'tendencias', 'benchmark', 'concorr', 'preço', 'pricing', 'média', 'media', 'custo', 'roi'];
  if (triggers.some((t) => m.includes(t))) return true;
  // por padrão, CMO tende a precisar mais de web
  return role === 'cmo' && (m.includes('campanha') || m.includes('tráfego') || m.includes('trafego'));
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

  const role = normalizeExecutiveRole(body?.role);
  const message = String(body?.message || '').trim();
  const conversationId = body?.conversation_id ? String(body.conversation_id) : null;
  const history = Array.isArray(body?.history) ? body.history : [];
  const forceMarket = Boolean(body?.include_market);

  if (!role) return NextResponse.json({ success: false, error: 'role inválido' }, { status: 400 });
  if (!message) return NextResponse.json({ success: false, error: 'message vazio' }, { status: 400 });

  const admin = getSupabaseAdmin();

  // 1) Carregar executivo (prompt no DB)
  const { data: execRow } = await admin.from('ai_executives').select('*').eq('role', role).maybeSingle();
  if (!execRow?.id) {
    return NextResponse.json(
      { success: false, error: `Executivo ${role} não encontrado em ai_executives. Rode a migration/seed.` },
      { status: 400 }
    );
  }

  // 2) Resolver/abrir conversa
  let convId = conversationId;
  if (convId) {
    const { data: conv } = await admin
      .from('ai_executive_conversations')
      .select('id, executive_id')
      .eq('id', convId)
      .maybeSingle();
    if (!conv?.id || String(conv.executive_id) !== String(execRow.id)) {
      convId = null;
    }
  }
  if (!convId) {
    const { data: created } = await admin
      .from('ai_executive_conversations')
      .insert({
        executive_id: execRow.id,
        user_id: gate.userId,
        title: message.slice(0, 80),
        context: {},
        status: 'active',
      })
      .select('id')
      .single();
    convId = created?.id ? String(created.id) : null;
  }
  if (!convId) return NextResponse.json({ success: false, error: 'Falha ao criar conversa' }, { status: 500 });

  // 3) Contexto interno + ML/preditivo (+ memória ativa)
  const context = await buildExecutiveContext({ role, actorUserId: gate.userId, includePredictions: true, touchKnowledge: true });

  // 4) Mercado (Perplexity Sonar) quando fizer sentido
  const doMarket = shouldDoMarketSearch(role, message, forceMarket);
  const market = doMarket
    ? await runMarketWebSearch({
        executiveId: String(execRow.id),
        role,
        query: message,
        purpose: `Suporte de mercado para chat (${role})`,
      })
    : null;

  // 5) Persistir mensagem do usuário (best-effort)
  try {
    await admin.from('ai_executive_messages').insert({
      conversation_id: convId,
      role: 'user',
      content: message,
      metadata: { source: 'ui' },
      data_sources_used: ['internal_best_effort', 'ml_predictions_log'],
      web_searches: market ? [{ provider: 'perplexity', model: market.model, sources: market.sources }] : [],
    });
  } catch {
    // ignore
  }

  const systemPrompt = `${String(execRow.system_prompt || '').trim()}\n\n${csuitePromptPreamble}`;
  const trimmedHistory = trimHistory(history);

  // 6) Chamar LLM (generateWithAI)
  const startedAt = Date.now();
  try {
    const result = await generateWithAI({
      task: llmTaskForRole(role),
      temperature: 0.4,
      maxTokens: 950,
      actorUserId: gate.userId,
      entityType: 'ai_executive_chat',
      entityId: role,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            `Executivo: ${role.toUpperCase()} (${execRow.name} — ${execRow.title})`,
            `Contexto interno (JSON):\n${JSON.stringify(context).slice(0, 18_000)}`,
            market
              ? `Contexto de mercado (Perplexity Sonar):\n${market.answer}\nFontes:\n${
                  market.sources.length ? market.sources.join('\n') : '(sem fontes)'
                }\n\nRegras adicionais (MUITO IMPORTANTE):\n- Se \"Fontes\" estiver vazio, NÃO invente links nem números.\n- Se \"Fontes\" tiver URLs, cite 2–5 URLs explicitamente na resposta.\n`
              : null,
            trimmedHistory.length ? `Histórico recente:\n${JSON.stringify(trimmedHistory)}` : null,
            `Pergunta:\n${message}`,
          ]
            .filter(Boolean)
            .join('\n\n'),
        },
      ],
    });

    const durationMs = Date.now() - startedAt;

    // 7) Persistir resposta
    let replyText = String(result.text || '').trim();
    // Se usamos Perplexity e temos fontes, garantimos que o usuário receba URLs (sem depender do LLM “lembrar”).
    if (market?.sources?.length && !replyText.match(/https?:\/\//i)) {
      replyText += `\n\nFontes:\n${market.sources.slice(0, 6).join('\n')}`;
    }
    try {
      await admin.from('ai_executive_messages').insert({
        conversation_id: convId,
        role: 'assistant',
        content: replyText,
        metadata: { provider: result.provider, model: result.model },
        data_sources_used: ['internal_best_effort', 'ml_predictions_log'],
        web_searches: market ? [{ provider: 'perplexity', model: market.model, sources: market.sources }] : [],
        tokens_used: result.usage ? null : null,
        processing_time_ms: durationMs,
      });
    } catch {
      // ignore
    }

    // 8) Audit log (best-effort)
    try {
      await admin.from('ai_executive_data_access_log').insert({
        executive_id: execRow.id,
        actor_user_id: gate.userId,
        action: 'chat',
        entity_type: 'ai_executive_conversations',
        entity_id: convId,
        details: {
          role,
          used_market: Boolean(market),
          missing: context.missing,
        },
      });
    } catch {
      // ignore
    }

    return NextResponse.json({
      success: true,
      conversation_id: convId,
      reply: replyText,
      provider: result.provider,
      model: result.model,
      market: market ? { sources: market.sources } : null,
    });
  } catch (e: any) {
    const status = getProviderStatus();
    const hint =
      !status.openrouter && !status.claude && !status.openai && !status.gemini
        ? 'Integrações de IA não estão configuradas. Configure em Integrações (OpenRouter/Claude/OpenAI/Gemini) para habilitar respostas automáticas.'
        : 'Não consegui obter resposta do provedor de IA agora. Tente novamente em instantes.';

    return NextResponse.json({
      success: true,
      conversation_id: convId,
      reply: `${hint}\n\nSe você quiser, me diga qual objetivo você quer atingir (ex.: reduzir churn, aumentar margem, destravar operação) que eu estruturo um plano consultivo com CTAs.`,
      provider: null,
      model: null,
    });
  }
}

