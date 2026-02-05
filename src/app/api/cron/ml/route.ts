import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';
import { predictiveEngine } from '@/lib/ai/predictive-engine';
import { clientHealthScore } from '@/lib/ai/client-health-score';
import { logCronRun, requireCronAuth } from '@/lib/cron/cronUtils';
import { requireAdmin } from '@/lib/auth/requireAdmin';

export const dynamic = 'force-dynamic';

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

async function runMlJobs() {
  const supabase = getSupabaseAdmin();
  const nowIso = new Date().toISOString();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayStartIso = todayStart.toISOString();

  async function insertInsightOncePerDay(input: {
    insight_category: string;
    insight_priority: string;
    insight_title: string;
    insight_description: string;
    affected_area?: string;
    confidence_score?: number;
    urgency_score?: number;
    source_type?: string;
    generated_by?: string;
  }) {
    try {
      const { data: existing } = await supabase
        .from('super_admin_insights')
        .select('id')
        .eq('insight_title', input.insight_title)
        .gte('created_at', todayStartIso)
        .limit(1);
      if (existing && existing.length > 0) return;
      await supabase.from('super_admin_insights').insert({
        insight_category: input.insight_category,
        insight_priority: input.insight_priority,
        insight_title: input.insight_title,
        insight_description: input.insight_description,
        affected_area: input.affected_area || null,
        confidence_score: input.confidence_score ?? 70,
        urgency_score: input.urgency_score ?? 65,
        source_type: input.source_type || 'system',
        generated_by: input.generated_by || 'system',
        status: 'new',
      });
    } catch {
      // ignore (best-effort)
    }
  }

  // 1) Recalcular health score para todos (base para churn/risk)
  const recalculated = await clientHealthScore.recalculateAllScores();

  // 1.1) Atualizar padrões de comportamento (ml_client_behavior_patterns) baseado no health score
  const { data: healthRows } = await supabase
    .from('client_health_scores')
    .select('client_id, client_name, overall_score, churn_probability, risk_level')
    .order('churn_probability', { ascending: false })
    .limit(5000);

  const clientIds = (healthRows || []).map((r: any) => String(r.client_id)).filter((id) => isUuid(id));

  // Mapear padrões existentes (evita duplicar rows a cada cron)
  const existingByClientId = new Map<string, string>();
  for (let i = 0; i < clientIds.length; i += 500) {
    const chunk = clientIds.slice(i, i + 500);
    const { data: existing } = await supabase
      .from('ml_client_behavior_patterns')
      .select('id, client_id')
      .in('client_id', chunk);
    for (const row of existing || []) {
      if (row?.client_id && row?.id) existingByClientId.set(String(row.client_id), String(row.id));
    }
  }

  const toSegment = (risk: string) => {
    const r = String(risk || '').toLowerCase();
    if (r === 'critical' || r === 'high') return 'churn_risk';
    if (r === 'low') return 'satisfied';
    return 'needs_attention';
  };

  const inserts: any[] = [];
  const updates: any[] = [];

  for (const r of healthRows || []) {
    const clientId = String(r.client_id || '');
    if (!isUuid(clientId)) continue;

    const churnProb = Number(r.churn_probability || 0);
    const churnRisk = Math.max(0, Math.min(100, churnProb));
    const renewalProb = Math.max(0, Math.min(100, 100 - churnRisk));
    const overall = Number(r.overall_score || 0);
    const upsellProb = Math.max(0, Math.min(100, overall >= 80 ? 55 : overall >= 65 ? 35 : 15));

    const payload = {
      client_id: clientId,
      behavior_segment: toSegment(r.risk_level),
      churn_risk_score: churnRisk,
      renewal_probability: renewalProb,
      upsell_probability: upsellProb,
      recommended_actions: [
        churnRisk >= 70 ? 'Agendar reunião de retenção' : null,
        churnRisk >= 50 ? 'Aumentar cadência de contato' : null,
        overall >= 80 ? 'Avaliar oportunidade de upsell' : null,
      ].filter(Boolean),
      confidence_score: 70,
      last_analyzed_at: nowIso,
      updated_at: nowIso,
    };

    const existingId = existingByClientId.get(clientId);
    if (existingId) {
      updates.push({ id: existingId, ...payload });
    } else {
      inserts.push(payload);
    }
  }

  // Inserir novos padrões
  for (let i = 0; i < inserts.length; i += 500) {
    const chunk = inserts.slice(i, i + 500);
    if (!chunk.length) continue;
    await supabase.from('ml_client_behavior_patterns').insert(chunk);
  }

  // Atualizar padrões existentes (upsert por PK id)
  for (let i = 0; i < updates.length; i += 500) {
    const chunk = updates.slice(i, i + 500);
    if (!chunk.length) continue;
    await supabase.from('ml_client_behavior_patterns').upsert(chunk, { onConflict: 'id' });
  }

  // 2) Predições de churn (por cliente)
  const { data: clients } = await supabase.from('clients').select('id').limit(5000);
  let churnPredicted = 0;
  for (const c of clients || []) {
    if (!c?.id || !isUuid(String(c.id))) continue;
    const p = await predictiveEngine.predictChurn(String(c.id));
    if (p) churnPredicted++;
  }

  // 2.1) Predições de risco de pagamento (clientes com faturas em aberto/vencidas)
  let paymentRiskPredicted = 0;
  try {
    const { data: openInv } = await supabase
      .from('invoices')
      .select('client_id')
      .is('paid_at', null)
      .limit(5000);
    const uniqueClientIds = Array.from(
      new Set((openInv || []).map((r: any) => String(r.client_id || '')).filter((id) => isUuid(id)))
    ).slice(0, 500);

    for (const cid of uniqueClientIds) {
      const p = await predictiveEngine.predictPaymentRisk(cid);
      if (p) paymentRiskPredicted++;
    }
  } catch {
    // ignore (graceful degradation)
  }

  // 2.2) Predições de LTV (top clientes por MRR)
  let ltvPredicted = 0;
  try {
    const { data: contracts } = await supabase
      .from('contracts')
      .select('client_id, value, status')
      .eq('status', 'active')
      .limit(5000);
    const mrrByClient = new Map<string, number>();
    for (const c of contracts || []) {
      const cid = String((c as any)?.client_id || '');
      if (!isUuid(cid)) continue;
      mrrByClient.set(cid, (mrrByClient.get(cid) || 0) + Number((c as any)?.value || 0));
    }
    const top = Array.from(mrrByClient.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 200)
      .map(([cid]) => cid);
    for (const cid of top) {
      const p = await predictiveEngine.predictLtv(cid);
      if (p) ltvPredicted++;
    }
  } catch {
    // ignore
  }

  // 2.3) Forecast de receita + demanda/capacidade (sistema)
  let revenuePredicted = 0;
  let demandCapacityPredicted = 0;
  const revM = await predictiveEngine.predictRevenue('month');
  const revQ = await predictiveEngine.predictRevenue('quarter');
  if (revM) revenuePredicted++;
  if (revQ) revenuePredicted++;
  const dcM = await predictiveEngine.predictDemandCapacity('month');
  const dcQ = await predictiveEngine.predictDemandCapacity('quarter');
  if (dcM) demandCapacityPredicted++;
  if (dcQ) demandCapacityPredicted++;

  // 3) Predições de atraso (por tarefa em aberto)
  const { data: tasks } = await supabase
    .from('kanban_tasks')
    .select('id')
    .neq('status', 'done')
    .limit(5000);

  let delayPredicted = 0;
  for (const t of tasks || []) {
    if (!t?.id || !isUuid(String(t.id))) continue;
    const p = await predictiveEngine.predictDelay(String(t.id));
    if (p) delayPredicted++;
  }

  // 3.2) Predições de risco de estouro de orçamento (campanhas)
  let budgetOverrunPredicted = 0;
  try {
    const { data: budgets } = await supabase
      .from('campaign_budgets')
      .select('campaign_id, remaining_amount, budget_amount, spent_amount')
      .order('remaining_amount', { ascending: true })
      .limit(200);
    const ids = Array.from(
      new Set((budgets || []).map((r: any) => String(r.campaign_id || '')).filter((id) => isUuid(id)))
    ).slice(0, 60);
    for (const id of ids) {
      const p = await predictiveEngine.predictBudgetOverrun(id);
      if (p) budgetOverrunPredicted++;
    }
  } catch {
    // ignore (graceful degradation)
  }

  // 3.1) Predição de conversão (leads recentes da prospecção)
  let conversionPredicted = 0;
  try {
    const { data: leads } = await supabase
      .from('prospecting_leads')
      .select('id')
      .order('qualification_score', { ascending: false })
      .limit(200);
    for (const l of leads || []) {
      const id = String((l as any)?.id || '');
      if (!isUuid(id)) continue;
      const p = await predictiveEngine.predictConversion(id);
      if (p) conversionPredicted++;
    }
  } catch {
    // ignore
  }
  // 4) Insights simples para Super Admin (sem IA ainda): volume de risco
  const { data: risky } = await supabase
    .from('client_health_scores')
    .select('client_id, client_name, overall_score, churn_probability, risk_level')
    .in('risk_level', ['high', 'critical'])
    .order('churn_probability', { ascending: false })
    .limit(10);

  const topNames = (risky || []).map((r: any) => `${r.client_name || r.client_id} (${r.churn_probability || 0}%)`);
  if (topNames.length > 0) {
    await insertInsightOncePerDay({
      insight_category: 'risk',
      insight_priority: 'high',
      insight_title: 'Clientes com risco elevado (ML/heurística)',
      insight_description: `Top clientes em risco (baseado em Health Score):\n- ${topNames.join('\n- ')}`,
      affected_area: 'clients',
      confidence_score: 70,
      urgency_score: 75,
      source_type: 'system',
      generated_by: 'system',
    });
  }

  // 4.1) Insight: risco de pagamento (top clientes)
  try {
    const { data: payPreds } = await supabase
      .from('ml_predictions_log')
      .select('target_id, predicted_value, predicted_at')
      .eq('prediction_type', 'payment_risk')
      .order('predicted_at', { ascending: false })
      .limit(200);

    const byClient = new Map<string, { id: string; name: string; risk: number }>();
    for (const p of (payPreds || []) as any[]) {
      const cid = p?.target_id ? String(p.target_id) : '';
      if (!cid || !isUuid(cid) || byClient.has(cid)) continue;
      const pv = p?.predicted_value;
      const risk = typeof pv === 'object' && pv && 'value' in pv ? Number((pv as any).value) : Number(pv);
      const name = typeof pv === 'object' && pv ? String((pv as any).entity_name || cid) : cid;
      byClient.set(cid, { id: cid, name, risk: Number.isFinite(risk) ? risk : 0 });
    }
    const top = Array.from(byClient.values()).sort((a, b) => b.risk - a.risk).slice(0, 5);
    if (top.length > 0 && top[0].risk >= 70) {
      await insertInsightOncePerDay({
        insight_category: 'risk',
        insight_priority: 'high',
        insight_title: 'Risco de pagamento (clientes)',
        insight_description: `Top clientes com risco de pagamento elevado:\n- ${top
          .map((x) => `${x.name} (${Math.round(x.risk)}%)`)
          .join('\n- ')}`,
        affected_area: 'finance',
        confidence_score: 75,
        urgency_score: 80,
      });
    }
  } catch {
    // ignore
  }

  // 4.2) Insight: risco de estouro de orçamento (campanhas)
  try {
    const { data: bPreds } = await supabase
      .from('ml_predictions_log')
      .select('target_id, predicted_value, predicted_at')
      .eq('prediction_type', 'budget_overrun')
      .order('predicted_at', { ascending: false })
      .limit(200);

    const byCampaign = new Map<string, { id: string; name: string; risk: number }>();
    for (const p of (bPreds || []) as any[]) {
      const cid = p?.target_id ? String(p.target_id) : '';
      if (!cid || !isUuid(cid) || byCampaign.has(cid)) continue;
      const pv = p?.predicted_value;
      const risk = typeof pv === 'object' && pv && 'value' in pv ? Number((pv as any).value) : Number(pv);
      const name = typeof pv === 'object' && pv ? String((pv as any).entity_name || cid) : cid;
      byCampaign.set(cid, { id: cid, name, risk: Number.isFinite(risk) ? risk : 0 });
    }
    const top = Array.from(byCampaign.values()).sort((a, b) => b.risk - a.risk).slice(0, 5);
    if (top.length > 0 && top[0].risk >= 75) {
      await insertInsightOncePerDay({
        insight_category: 'risk',
        insight_priority: 'high',
        insight_title: 'Risco de estouro de orçamento (campanhas)',
        insight_description: `Campanhas com maior risco de estourar orçamento:\n- ${top
          .map((x) => `${x.name} (${Math.round(x.risk)}%)`)
          .join('\n- ')}`,
        affected_area: 'marketing',
        confidence_score: 70,
        urgency_score: 75,
      });
    }
  } catch {
    // ignore
  }

  // 4.3) Insight: demanda/capacidade crítica (sistema)
  try {
    const { data: dc } = await supabase
      .from('ml_predictions_log')
      .select('predicted_value, predicted_at')
      .eq('prediction_type', 'demand_capacity')
      .order('predicted_at', { ascending: false })
      .limit(10);
    const best = (dc || [])
      .map((p: any) => {
        const pv = p?.predicted_value;
        const v = typeof pv === 'object' && pv && 'value' in pv ? Number((pv as any).value) : Number(pv);
        const rec = typeof pv === 'object' && pv ? String((pv as any).recommendation || '') : '';
        return { v: Number.isFinite(v) ? v : 0, rec };
      })
      .sort((a, b) => b.v - a.v)[0];
    if (best && best.v >= 85) {
      await insertInsightOncePerDay({
        insight_category: 'alert',
        insight_priority: 'critical',
        insight_title: 'Capacidade crítica (demanda vs capacidade)',
        insight_description: `Utilização estimada: ${Math.round(best.v)}%.\n${best.rec || 'Revisar prioridades e redistribuir demandas.'}`,
        affected_area: 'operations',
        confidence_score: 70,
        urgency_score: 90,
      });
    }
  } catch {
    // ignore
  }

  return {
    recalculatedHealthScores: recalculated,
    behaviorPatternsInserted: inserts.length,
    behaviorPatternsUpdated: updates.length,
    churnPredicted,
    paymentRiskPredicted,
    ltvPredicted,
    revenuePredicted,
    demandCapacityPredicted,
    delayPredicted,
    budgetOverrunPredicted,
    conversionPredicted,
    insertedInsight: topNames.length > 0,
  };
}

export async function GET(request: NextRequest) {
  const started = Date.now();
  const admin = getSupabaseAdmin();
  try {
    const auth = requireCronAuth(request);
    if (auth) return auth;

    const result = await runMlJobs();
    await logCronRun({
      supabase: admin,
      action: 'ml',
      status: 'ok',
      durationMs: Date.now() - started,
      responseData: result,
    });
    return NextResponse.json({ success: true, result });
  } catch (e: any) {
    await logCronRun({
      supabase: admin,
      action: 'ml',
      status: 'error',
      durationMs: Date.now() - started,
      errorMessage: e?.message || 'Erro interno',
    });
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
  }
}

// POST manual (admin) — mantemos simples e protegido por sessão no passo do dashboard
export async function POST(request: NextRequest) {
  const started = Date.now();
  const admin = getSupabaseAdmin();
  try {
    const gate = await requireAdmin(request);
    if (!gate.ok) return gate.res;

    const result = await runMlJobs();
    await logCronRun({
      supabase: admin,
      action: 'ml',
      status: 'ok',
      durationMs: Date.now() - started,
      requestData: { manual: true, by: gate.userId },
      responseData: result,
    });
    return NextResponse.json({ success: true, result });
  } catch (e: any) {
    await logCronRun({
      supabase: admin,
      action: 'ml',
      status: 'error',
      durationMs: Date.now() - started,
      errorMessage: e?.message || 'Erro interno',
    });
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
  }
}


