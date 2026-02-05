import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';
import { generateWithAI, getProviderStatus } from '@/lib/ai/aiRouter';
import { buildExecutiveContext, csuitePromptPreamble, llmTaskForRole } from '@/lib/csuite/executiveContext';
import { normalizeExecutiveRole } from '@/lib/csuite/executiveTypes';

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

  const meetingId = String(body?.meeting_id || '').trim();
  if (!meetingId || !isUuid(meetingId)) return NextResponse.json({ success: false, error: 'meeting_id inválido' }, { status: 400 });

  const admin = getSupabaseAdmin();

  const { data: meeting } = await admin.from('ai_executive_meetings').select('*').eq('id', meetingId).maybeSingle();
  if (!meeting?.id) return NextResponse.json({ success: false, error: 'Reunião não encontrada' }, { status: 404 });

  // Resolve participantes
  const participantIds: string[] = Array.isArray(meeting.participants) ? meeting.participants.map((x: any) => String(x)) : [];
  const { data: execs } = await admin.from('ai_executives').select('*').in('id', participantIds);
  const participants = (execs || []) as any[];
  if (!participants.length) return NextResponse.json({ success: false, error: 'Reunião sem participantes válidos' }, { status: 400 });

  // Ordena para o CEO por último (ele sintetiza)
  participants.sort((a, b) => (String(a.role) === 'ceo' ? 1 : 0) - (String(b.role) === 'ceo' ? 1 : 0));

  // Marca como running
  await admin.from('ai_executive_meetings').update({ status: 'running', started_at: new Date().toISOString() }).eq('id', meetingId);

  const agenda = meeting.agenda ?? [];
  const statements: Array<{ role: string; executive_id: string; content: string }> = [];

  try {
    for (const e of participants) {
      const role = normalizeExecutiveRole(e.role);
      if (!role) continue;
      // Reuniões não contam como "memória ativa" (evita inflar times_referenced em execuções internas)
      const ctx = await buildExecutiveContext({ role, actorUserId: gate.userId, includePredictions: true, touchKnowledge: false });

      const systemPrompt = `${String(e.system_prompt || '').trim()}\n\n${csuitePromptPreamble}\n\n` +
        `Você está em uma REUNIÃO executiva. Contribua com um posicionamento objetivo (máx. 12 linhas).\n` +
        `Se houver conflito com outro executivo, explicite o trade-off.\n`;

      const result = await generateWithAI({
        task: llmTaskForRole(role),
        temperature: 0.35,
        maxTokens: 650,
        actorUserId: gate.userId,
        entityType: 'ai_executive_meeting',
        entityId: meetingId,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              `Reunião: ${meeting.title} (type=${meeting.meeting_type})`,
              `Agenda: ${JSON.stringify(agenda)}`,
              `Contexto interno (JSON):\n${JSON.stringify(ctx).slice(0, 16_000)}`,
              `Pergunta: qual sua recomendação e por quê?`,
            ].join('\n\n'),
          },
        ],
      });

      const content = String(result.text || '').trim();
      if (content) {
        statements.push({ role, executive_id: String(e.id), content });
        await admin.from('ai_executive_meeting_messages').insert({
          meeting_id: meetingId,
          executive_id: e.id,
          message_type: 'statement',
          content,
          data_presented: { used_market: false, missing: ctx.missing, predictions_count: ctx.signals.predictions.length },
          confidence_level: 0.75,
        });
      }
    }

    // CEO síntese + decisão
    const ceo = participants.find((p) => String(p.role).toLowerCase() === 'ceo') || participants[participants.length - 1];
    const ceoRole = String(ceo.role || '').toLowerCase();
    const systemPrompt =
      `${String(ceo.system_prompt || '').trim()}\n\n${csuitePromptPreamble}\n\n` +
      `Agora você é o mediador. Gere uma síntese e uma decisão consultiva.\n` +
      `Saída em JSON válido com chaves: summary, decision{decision_type,category,title,description,rationale,options_considered,chosen_option,success_metrics,implementation_plan,human_approval_required}.\n`;

    const ceoResult = await generateWithAI({
      task: 'strategy',
      json: true,
      temperature: 0.25,
      maxTokens: 900,
      actorUserId: gate.userId,
      entityType: 'ai_executive_meeting_ceo',
      entityId: meetingId,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            `Reunião: ${meeting.title} (${meeting.meeting_type})`,
            `Agenda: ${JSON.stringify(agenda)}`,
            `Declarações:\n${statements.map((s) => `- ${s.role.toUpperCase()}: ${s.content}`).join('\n')}`,
            `Gere a síntese e a decisão (consultiva).`,
          ].join('\n\n'),
        },
      ],
    });

    const ceoJson = (ceoResult.json || {}) as any;
    const summary = String(ceoJson?.summary || '').trim() || 'Síntese indisponível.';
    const decision = ceoJson?.decision || {};

    await admin.from('ai_executive_meeting_messages').insert({
      meeting_id: meetingId,
      executive_id: ceo.id,
      message_type: 'summary',
      content: summary,
      data_presented: { decision },
      confidence_level: 0.8,
    });

    const decisionRow = {
      decision_type: String(decision?.decision_type || 'strategy'),
      category: String(decision?.category || 'general'),
      title: String(decision?.title || `Decisão — ${meeting.title}`),
      description: String(decision?.description || summary),
      proposed_by: ceo.id,
      approved_by: [],
      meeting_id: meetingId,
      insight_ids: [],
      options_considered: decision?.options_considered ?? [],
      chosen_option: decision?.chosen_option ? String(decision.chosen_option) : null,
      rationale: decision?.rationale ? String(decision.rationale) : null,
      expected_impact: decision?.expected_impact ?? {},
      success_metrics: decision?.success_metrics ?? {},
      implementation_plan: decision?.implementation_plan ?? {},
      status: 'proposed',
      human_approval_required: decision?.human_approval_required !== false,
    };

    const { data: decisionInserted } = await admin.from('ai_executive_decisions').insert(decisionRow).select('id').single();

    // Auto-aprendizado (best-effort): transformar decisão em "memória" para os executivos
    try {
      const nowIso = new Date().toISOString();
      const decisionId = decisionInserted?.id ? String(decisionInserted.id) : null;
      const participantExecIds = Array.from(new Set(participants.map((p) => String(p.id)).filter(Boolean)));
      const participantsRoles = participants.map((p) => String(p.role || '').toLowerCase()).filter(Boolean);

      if (decisionId) {
        const payload = {
          meeting_id: meetingId,
          meeting_title: meeting.title,
          meeting_type: meeting.meeting_type,
          agenda,
          participants_roles: participantsRoles,
          summary,
          decision: {
            id: decisionId,
            decision_type: decisionRow.decision_type,
            category: decisionRow.category,
            title: decisionRow.title,
            description: decisionRow.description,
            chosen_option: decisionRow.chosen_option,
            rationale: decisionRow.rationale,
            options_considered: decisionRow.options_considered,
            success_metrics: decisionRow.success_metrics,
            implementation_plan: decisionRow.implementation_plan,
            human_approval_required: decisionRow.human_approval_required,
          },
          captured_at: nowIso,
        };

        const knowledgeRows = participantExecIds.map((execId) => ({
          executive_id: execId,
          knowledge_type: 'decision',
          category: decisionRow.category,
          key: `decision:${decisionId}`,
          value: payload,
          confidence: 0.9,
          source: 'ai_executive_meetings',
          source_id: meetingId,
          valid_from: nowIso,
        }));

        await admin.from('ai_executive_knowledge').upsert(knowledgeRows, { onConflict: 'executive_id,knowledge_type,key' });
      }
    } catch {
      // ignore (não pode derrubar reunião)
    }

    await admin
      .from('ai_executive_meetings')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        outcome_summary: summary,
        decisions_made: [{ decision_id: decisionInserted?.id || null, title: decisionRow.title }],
      })
      .eq('id', meetingId);

    return NextResponse.json({ success: true, meeting_id: meetingId, summary, decision_id: decisionInserted?.id || null });
  } catch (e: any) {
    const status = getProviderStatus();
    const hint =
      !status.openrouter && !status.claude && !status.openai && !status.gemini
        ? 'Integrações de IA não estão configuradas. Configure em Integrações (OpenRouter/Claude/OpenAI/Gemini).'
        : 'Falha ao conduzir reunião agora. Tente novamente.';

    await admin.from('ai_executive_meetings').update({ status: 'scheduled' }).eq('id', meetingId);
    return NextResponse.json({ success: false, error: hint }, { status: 500 });
  }
}

