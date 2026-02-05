import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/predictions/ltv
 * Retorna predições de LTV e oportunidades de upsell
 */
export async function GET(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('clientId');
  const segment = searchParams.get('segment'); // 'vip', 'high', etc

  try {
    const supabase = getSupabaseAdmin();

    if (clientId) {
      // Calcular LTV para cliente específico
      const { data, error } = await supabase.rpc('calculate_client_ltv_prediction', {
        p_client_id: clientId,
        p_months: 12,
      });

      if (error) throw error;

      return NextResponse.json({ success: true, prediction: data });
    }

    // Buscar todas as predições de LTV
    let query = supabase
      .from('client_ltv_predictions')
      .select(`
        *,
        clients:client_id (
          id,
          company_name,
          contact_name,
          contact_email,
          monthly_value,
          status
        )
      `)
      .order('predicted_ltv', { ascending: false });

    if (segment) {
      query = query.eq('value_segment', segment);
    }

    const { data: predictions, error: fetchError } = await query.limit(50);

    if (fetchError) throw fetchError;

    // Estatísticas
    const stats = {
      total: predictions?.length || 0,
      vip_clients: predictions?.filter(p => p.value_segment === 'vip').length || 0,
      high_value: predictions?.filter(p => p.value_segment === 'high').length || 0,
      avg_ltv: predictions?.length
        ? (predictions.reduce((sum, p) => sum + (p.predicted_ltv || 0), 0) / predictions.length).toFixed(2)
        : 0,
      total_predicted_ltv: predictions?.reduce((sum, p) => sum + (p.predicted_ltv || 0), 0) || 0,
      upsell_opportunities: predictions?.filter(p => (p.upsell_probability || 0) >= 50).length || 0,
      total_upsell_potential: predictions?.reduce((sum, p) => sum + (p.estimated_upsell_value || 0), 0) || 0,
    };

    return NextResponse.json({
      success: true,
      predictions,
      stats,
    });
  } catch (error: any) {
    console.error('Error fetching LTV predictions:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao buscar predições de LTV' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/predictions/ltv
 * Calcula predição de LTV para um cliente
 */
export async function POST(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  try {
    const body = await request.json();
    const { clientId, months = 12 } = body;

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'clientId é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Calcular predição
    const { data: prediction, error } = await supabase.rpc('calculate_client_ltv_prediction', {
      p_client_id: clientId,
      p_months: months,
    });

    if (error) throw error;

    // Salvar na tabela
    const { data: saved, error: saveError } = await supabase
      .from('client_ltv_predictions')
      .insert({
        client_id: clientId,
        predicted_ltv: prediction.predicted_ltv,
        current_ltv: prediction.current_ltv,
        predicted_monthly_spend: prediction.predicted_monthly_spend,
        time_horizon_months: prediction.time_horizon_months,
        upsell_probability: prediction.upsell_probability,
        recommended_upsell_services: prediction.recommended_upsell_services || [],
        expansion_opportunities: prediction.expansion_opportunities || [],
        calculation_factors: prediction.calculation_factors || {},
        value_segment: prediction.value_segment,
        confidence_level: prediction.confidence_level || 50,
      })
      .select()
      .single();

    if (saveError) throw saveError;

    return NextResponse.json({
      success: true,
      prediction: saved,
      message: 'Predição de LTV calculada com sucesso',
    });
  } catch (error: any) {
    console.error('Error calculating LTV prediction:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao calcular predição de LTV' },
      { status: 500 }
    );
  }
}
