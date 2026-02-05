import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

export const dynamic = 'force-dynamic';

function toNum(v: any): number | null {
  if (v == null) return null;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'object' && (v as any)?.value != null) {
    const n = Number((v as any).value);
    return Number.isFinite(n) ? n : null;
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function pickTopByType(rows: any[], type: string) {
  const scored = (rows || [])
    .filter((r) => String(r?.prediction_type || '') === type)
    .map((r) => ({ r, v: toNum(r?.predicted_value) }))
    .filter((x) => typeof x.v === 'number' && Number.isFinite(x.v as any));
  scored.sort((a, b) => Number(b.v) - Number(a.v));
  return scored[0]?.r || null;
}

export async function GET(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  const admin = getSupabaseAdmin();

  try {
    // KPIs rápidos
    const { count: totalClients } = await admin.from('clients').select('*', { count: 'exact', head: true });
    const { count: activeClients } = await admin
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .or('status.eq.active,status.eq.ativo,is_active.eq.true');

    const { count: pendingInvoices } = await admin
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .is('paid_at', null);

    // MRR (contracts)
    const { data: contracts } = await admin.from('contracts').select('monthly_value,status,active').limit(2000);
    const mrr = (contracts || [])
      .filter((c: any) => String(c.status || '').toLowerCase() === 'active' || c.active === true)
      .reduce((sum: number, c: any) => sum + Number(c.monthly_value || 0), 0);

    // Predições recentes (amostra)
    let predictions: any[] = [];
    try {
      const { data } = await admin
        .from('ml_predictions_log')
        .select('id,prediction_type,predicted_probability,predicted_at,predicted_for_date,predicted_value')
        .order('predicted_at', { ascending: false })
        .limit(400);
      predictions = (data || []) as any[];
    } catch {
      predictions = [];
    }

    const top = {
      payment_risk: pickTopByType(predictions, 'payment_risk'),
      churn: pickTopByType(predictions, 'churn'),
      demand_capacity: pickTopByType(predictions, 'demand_capacity'),
      budget_overrun: pickTopByType(predictions, 'budget_overrun'),
      revenue: pickTopByType(predictions, 'revenue'),
      conversion: pickTopByType(predictions, 'conversion'),
      ltv: pickTopByType(predictions, 'ltv'),
    };

    const mapItem = (p: any, label: string, href: string) => {
      if (!p) return null;
      const value = toNum(p.predicted_value);
      const prob = Math.round(Number(p.predicted_probability || 0));
      return {
        id: String(p.id),
        type: String(p.prediction_type || ''),
        label,
        value,
        confidence: prob,
        predicted_at: p.predicted_at || null,
        href,
      };
    };

    const highlights = [
      mapItem(top.payment_risk, 'Risco de Pagamento (top)', '/admin/financeiro/clientes'),
      mapItem(top.churn, 'Risco de Churn (top)', '/admin/analytics/preditivo'),
      mapItem(top.demand_capacity, 'Demanda vs Capacidade', '/admin/analytics/preditivo'),
      mapItem(top.budget_overrun, 'Risco de Orçamento (campanha)', '/admin/analytics/preditivo'),
      mapItem(top.revenue, 'Forecast Receita', '/admin/analytics/preditivo'),
      mapItem(top.conversion, 'Conversão (propostas/leads)', '/admin/analytics/preditivo'),
      mapItem(top.ltv, 'LTV (estimativa)', '/admin/analytics/preditivo'),
    ].filter(Boolean);

    return NextResponse.json({
      success: true,
      kpis: {
        totalClients: totalClients || 0,
        activeClients: activeClients || 0,
        pendingInvoices: pendingInvoices || 0,
        mrr,
      },
      highlights,
      links: {
        analytics: '/admin/analytics/preditivo',
        intelligence: '/admin/centro-inteligencia',
        billing: '/admin/financeiro/clientes',
        machineLearning: '/admin/machine-learning',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Erro interno' }, { status: 500 });
  }
}


