import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 segundos

/**
 * POST /api/admin/predictions/calculate-all
 * Calcula predições para todos os clientes ativos
 */
export async function POST(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  try {
    const supabase = getSupabaseAdmin();

    // 1. Buscar todos os clientes ativos
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, company_name, monthly_value')
      .eq('is_active', true)
      .limit(50); // Limite para não demorar muito

    if (clientsError) throw clientsError;

    if (!clients || clients.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Nenhum cliente ativo encontrado',
      });
    }

    let churnCreated = 0;
    let ltvCreated = 0;
    const errors = [];

    // 2. Para cada cliente, calcular predições
    for (const client of clients) {
      try {
        // Calcular Churn
        const { data: churnPrediction } = await supabase.rpc('calculate_client_churn_prediction', {
          p_client_id: client.id,
        });

        if (churnPrediction) {
          // Salvar predição de churn
          const { error: churnInsertError } = await supabase
            .from('client_churn_predictions')
            .upsert({
              client_id: client.id,
              churn_probability: churnPrediction.churn_probability || 0,
              risk_level: churnPrediction.risk_level || 'low',
              days_until_churn: churnPrediction.days_until_churn || null,
              predicted_churn_date: churnPrediction.predicted_churn_date || null,
              contributing_factors: churnPrediction.contributing_factors || {},
              warning_signals: churnPrediction.warning_signals || [],
              recommended_actions: churnPrediction.recommended_actions || [],
              confidence_level: churnPrediction.confidence_level || 50,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'client_id',
            });

          if (!churnInsertError) churnCreated++;
        }

        // Calcular LTV
        const { data: ltvPrediction } = await supabase.rpc('calculate_client_ltv_prediction', {
          p_client_id: client.id,
          p_months: 12,
        });

        if (ltvPrediction) {
          // Salvar predição de LTV
          const { error: ltvInsertError } = await supabase
            .from('client_ltv_predictions')
            .upsert({
              client_id: client.id,
              predicted_ltv: ltvPrediction.predicted_ltv || 0,
              current_ltv: ltvPrediction.current_ltv || 0,
              predicted_monthly_spend: ltvPrediction.predicted_monthly_spend || 0,
              time_horizon_months: ltvPrediction.time_horizon_months || 12,
              upsell_probability: ltvPrediction.upsell_probability || 0,
              recommended_upsell_services: ltvPrediction.recommended_upsell_services || [],
              expansion_opportunities: ltvPrediction.expansion_opportunities || [],
              calculation_factors: ltvPrediction.calculation_factors || {},
              value_segment: ltvPrediction.value_segment || null,
              confidence_level: ltvPrediction.confidence_level || 50,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'client_id',
            });

          if (!ltvInsertError) ltvCreated++;
        }
      } catch (clientError: any) {
        console.error(`Error calculating for client ${client.company_name}:`, clientError);
        errors.push(`${client.company_name}: ${clientError.message}`);
      }
    }

    // 3. Calcular predições de receita
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const { data: revenuePrediction } = await supabase.rpc('calculate_revenue_prediction', {
      p_period: 'monthly',
      p_year: currentYear,
      p_month: currentMonth,
      p_quarter: null,
    });

    if (revenuePrediction) {
      await supabase.from('revenue_predictions').upsert({
        prediction_period: 'monthly',
        target_year: currentYear,
        target_month: currentMonth,
        target_quarter: null,
        period_start_date: new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0],
        period_end_date: new Date(currentYear, currentMonth, 0).toISOString().split('T')[0],
        predicted_revenue: revenuePrediction.predicted_revenue || 0,
        predicted_mrr: revenuePrediction.predicted_mrr || 0,
        predicted_arr: revenuePrediction.predicted_arr || 0,
        revenue_growth_rate: revenuePrediction.revenue_growth_rate || 0,
        current_revenue: revenuePrediction.current_revenue || 0,
        predicted_active_clients: revenuePrediction.predicted_active_clients || 0,
        predicted_avg_ticket: revenuePrediction.predicted_avg_ticket || 0,
        confidence_level: revenuePrediction.confidence_level || 50,
        trend: revenuePrediction.trend || 'stable',
        performance_status: revenuePrediction.performance_status || 'on_target',
      }, {
        onConflict: 'prediction_period,target_year,target_month,target_quarter',
      });
    }

    // 4. Calcular predições de contratação
    const { data: hiringPrediction } = await supabase.rpc('calculate_hiring_needs_prediction', {
      p_period: 'monthly',
      p_year: currentYear,
      p_month: currentMonth,
    });

    if (hiringPrediction) {
      await supabase.from('hiring_needs_predictions').upsert({
        prediction_period: 'monthly',
        target_year: currentYear,
        target_month: currentMonth,
        target_quarter: null,
        period_start_date: new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0],
        period_end_date: new Date(currentYear, currentMonth, 0).toISOString().split('T')[0],
        recommended_hires: hiringPrediction.recommended_hires || 0,
        priority_level: hiringPrediction.priority_level || 'low',
        current_team_size: hiringPrediction.current_team_size || 0,
        current_capacity_utilization: hiringPrediction.current_capacity_utilization || 0,
        capacity_status: hiringPrediction.capacity_status || 'optimal',
        confidence_level: hiringPrediction.confidence_level || 50,
        hiring_urgency: hiringPrediction.hiring_urgency || 'optional',
      }, {
        onConflict: 'prediction_period,target_year,target_month,target_quarter',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Predições calculadas com sucesso!',
      stats: {
        total: clients.length,
        churn_predictions: churnCreated,
        ltv_predictions: ltvCreated,
        revenue_calculated: !!revenuePrediction,
        hiring_calculated: !!hiringPrediction,
      },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Error calculating all predictions:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao calcular predições' },
      { status: 500 }
    );
  }
}
