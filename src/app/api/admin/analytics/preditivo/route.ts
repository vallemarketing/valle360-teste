import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';
import { requireAdmin } from '@/lib/auth/requireAdmin';

export const dynamic = 'force-dynamic';

function safeNumber(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function extractPredictedValue(pv: any) {
  // `predicted_value` pode ser jsonb ou number/string dependendo do modelo
  if (pv && typeof pv === 'object') {
    const v = (pv as any).value;
    const n = Number(v);
    return Number.isFinite(n) ? n : v ?? null;
  }
  const n = Number(pv);
  return Number.isFinite(n) ? n : pv ?? null;
}

export async function GET(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  const supabase = getSupabaseAdmin();

  // Top clientes em risco (health score)
  const { data: riskyClients } = await supabase
    .from('client_health_scores')
    .select('client_id, client_name, overall_score, churn_probability, risk_level, last_calculated_at')
    .order('churn_probability', { ascending: false })
    .limit(10);

  // Últimas previsões (ml_predictions_log)
  const { data: preds } = await supabase
    .from('ml_predictions_log')
    .select('id, prediction_type, prediction_target, target_id, predicted_probability, predicted_at, predicted_value, model_version')
    .order('predicted_at', { ascending: false })
    .limit(200);

  const rows = (preds || []) as any[];
  const last30 = rows.slice(0, 60);

  const countsByType: Record<string, number> = {};
  let highConfidence = 0;
  for (const p of last30) {
    const t = String(p.prediction_type || 'unknown');
    countsByType[t] = (countsByType[t] || 0) + 1;
    if (safeNumber(p.predicted_probability) >= 70) highConfidence += 1;
  }

  const summary = {
    latest_predictions: rows.length,
    high_confidence_latest: highConfidence,
    types: countsByType,
    risky_clients: (riskyClients || []).length,
  };

  return NextResponse.json({
    success: true,
    summary,
    riskyClients: (riskyClients || []).map((c: any) => ({
      client_id: c.client_id,
      client_name: c.client_name,
      overall_score: safeNumber(c.overall_score),
      churn_probability: safeNumber(c.churn_probability),
      risk_level: c.risk_level,
      last_calculated_at: c.last_calculated_at,
    })),
    predictions: rows.map((p: any) => ({
      id: p.id,
      type: p.prediction_type,
      target: p.prediction_target,
      target_id: p.target_id,
      probability: safeNumber(p.predicted_probability),
      predicted_at: p.predicted_at,
      model_version: p.model_version,
      predicted_value: p.predicted_value,
      value: extractPredictedValue(p.predicted_value),
      entity_name: p?.predicted_value && typeof p.predicted_value === 'object' ? (p.predicted_value as any).entity_name : null,
    })),
  });
}



