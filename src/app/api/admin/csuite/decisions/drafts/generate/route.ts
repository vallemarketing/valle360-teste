import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';
import { inferAreaKeyFromLabel } from '@/lib/kanban/areaBoards';

export const dynamic = 'force-dynamic';

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

function toStepStrings(plan: any): string[] {
  if (!plan) return [];
  if (typeof plan === 'string') return [plan.trim()].filter(Boolean);
  if (Array.isArray(plan)) {
    const out: string[] = [];
    for (const x of plan) {
      if (typeof x === 'string') {
        const s = x.trim();
        if (s) out.push(s);
        continue;
      }
      if (x && typeof x === 'object') {
        const s = String((x as any).step || (x as any).title || (x as any).name || '').trim();
        if (s) out.push(s);
      }
    }
    return out;
  }
  if (typeof plan === 'object') {
    const maybe = (plan as any).steps || (plan as any).plan || (plan as any).items;
    return toStepStrings(maybe);
  }
  return [];
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

  const decisionId = String(body?.decision_id || '').trim();
  if (!decisionId || !isUuid(decisionId)) return NextResponse.json({ success: false, error: 'decision_id inválido' }, { status: 400 });

  const admin = getSupabaseAdmin();
  try {
    const { data: decision, error: dErr } = await admin.from('ai_executive_decisions').select('*').eq('id', decisionId).maybeSingle();
    if (dErr || !decision) return NextResponse.json({ success: false, error: dErr?.message || 'Decisão não encontrada' }, { status: 404 });

    const status = String(decision.status || '').toLowerCase();
    if (status !== 'approved') {
      return NextResponse.json({ success: false, error: `Decisão não está em approved (status=${decision.status})` }, { status: 400 });
    }

    const execId = decision.proposed_by ? String(decision.proposed_by) : null;
    if (!execId || !isUuid(execId)) return NextResponse.json({ success: false, error: 'Decisão sem proposed_by válido' }, { status: 400 });

    // Idempotência sem mexer no schema:
    // buscamos drafts recentes do executivo e verificamos no payload.metadata.source_decision_id.
    const { data: recentDrafts } = await admin
      .from('ai_executive_action_drafts')
      .select('id, action_type, status, action_payload, created_at')
      .eq('executive_id', execId)
      .order('created_at', { ascending: false })
      .limit(120);

    // Considera "já existe" apenas se houver rascunho útil (draft/executed) para essa decisão.
    // Se só houver failed/cancelled, permitimos regenerar (para o usuário tentar novamente).
    const already = (recentDrafts || []).some((r: any) => {
      const meta = r?.action_payload?.metadata || r?.action_payload?.meta || null;
      const sameDecision = String(meta?.source_decision_id || meta?.decision_id || '') === decisionId;
      if (!sameDecision) return false;
      const st = String(r?.status || '').toLowerCase();
      return st !== 'failed' && st !== 'cancelled';
    });
    if (already) {
      return NextResponse.json({ success: true, created: 0, skipped: true, reason: 'drafts já existem para esta decisão' });
    }

    const title = String(decision.title || 'Decisão aprovada').trim();
    const description = String(decision.description || '').trim();
    const rationale = decision.rationale != null ? String(decision.rationale) : '';
    const category = String(decision.category || 'general');
    const inferredAreaKey =
      inferAreaKeyFromLabel([category, title, description].filter(Boolean).join(' ')) ||
      inferAreaKeyFromLabel(String(title || '')) ||
      null;

    const planSteps = toStepStrings(decision.implementation_plan);
    const steps = planSteps.length ? planSteps.slice(0, 5) : [`Executar plano da decisão: ${title}`];

    const commonMeta = {
      metadata: {
        source: 'approved_decision',
        source_decision_id: decisionId,
        meeting_id: decision.meeting_id || null,
        ...(inferredAreaKey ? { area_key: inferredAreaKey } : {}),
        // default seguro: tasks começam em "Demanda" se o board suportar stage_key
        stage_key: 'demanda',
      },
    };

    const draftsToInsert: any[] = [];
    const baseDesc = [
      `Origem: decisão aprovada`,
      `Decisão: ${title}`,
      description ? `Descrição: ${description}` : null,
      rationale ? `Racional: ${rationale}` : null,
      `Categoria: ${category}`,
    ]
      .filter(Boolean)
      .join('\n');

    // 1) Criar tasks no Kanban a partir do plano
    steps.forEach((s, idx) => {
      draftsToInsert.push({
        executive_id: execId,
        created_by_user_id: gate.userId,
        source_insight_id: null,
        action_type: 'create_kanban_task',
        action_payload: {
          title: `${title} — Passo ${idx + 1}`,
          priority: idx === 0 ? 'high' : 'media',
          description: `${baseDesc}\n\nPasso: ${s}\n`,
          ...commonMeta,
        },
        preview: {
          label: `Criar task: ${title} (passo ${idx + 1})`,
          decision_id: decisionId,
        },
        risk_level: 'low',
        requires_external: false,
        is_executable: true,
        status: 'draft',
      });
    });

    // 2) Opcional: sugerir reunião de alinhamento se o plano mencionar alinhamento/reunião
    const planText = steps.join(' ').toLowerCase();
    if (planText.includes('reuni') || planText.includes('alinh')) {
      draftsToInsert.push({
        executive_id: execId,
        created_by_user_id: gate.userId,
        source_insight_id: null,
        action_type: 'schedule_meeting',
        action_payload: {
          title: `Alinhamento: ${title}`,
          meeting_type: 'review',
          participants: ['ceo', 'cfo', 'cto', 'cmo', 'coo', 'cco', 'chro'],
          agenda: [`Aprovação: ${title}`, ...(steps.slice(0, 4).map((x) => `Passo: ${x}`))],
          ...commonMeta,
        },
        preview: { label: `Agendar alinhamento: ${title}`, decision_id: decisionId },
        risk_level: 'low',
        requires_external: false,
        is_executable: true,
        status: 'draft',
      });
    }

    const { data: inserted, error: insErr } = await admin.from('ai_executive_action_drafts').insert(draftsToInsert).select('id, action_type');
    if (insErr) throw insErr;

    return NextResponse.json({
      success: true,
      created: (inserted || []).length,
      draft_ids: (inserted || []).map((x: any) => String(x.id)),
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: String(e?.message || 'Falha') }, { status: 400 });
  }
}

