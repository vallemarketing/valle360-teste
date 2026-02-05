import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/predictions/revenue
 * Retorna predições de receita
 */
export async function GET(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || 'monthly';
  const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
  const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : null;

  try {
    const supabase = getSupabaseAdmin();

    // Calcular predição de receita
    const { data, error } = await supabase.rpc('calculate_revenue_prediction', {
      p_period: period,
      p_year: year,
      p_month: month,
      p_quarter: null,
    });

    if (error) throw error;

    // Buscar histórico de predições
    const { data: history, error: historyError } = await supabase
      .from('revenue_predictions')
      .select('*')
      .eq('target_year', year)
      .order('period_start_date', { ascending: false })
      .limit(12);

    if (historyError) console.error('Error fetching revenue history:', historyError);

    return NextResponse.json({
      success: true,
      prediction: data,
      history: history || [],
    });
  } catch (error: any) {
    console.error('Error fetching revenue predictions:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao buscar predições de receita' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/predictions/revenue
 * Salva uma predição de receita
 */
export async function POST(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  try {
    const body = await request.json();
    const { period = 'monthly', year, month, quarter } = body;

    const supabase = getSupabaseAdmin();

    // Calcular predição
    const { data: prediction, error } = await supabase.rpc('calculate_revenue_prediction', {
      p_period: period,
      p_year: year || new Date().getFullYear(),
      p_month: month || null,
      p_quarter: quarter || null,
    });

    if (error) throw error;

    // Determinar datas do período
    const currentDate = new Date();
    const targetYear = year || currentDate.getFullYear();
    const targetMonth = month || currentDate.getMonth() + 1;

    let periodStartDate, periodEndDate;
    
    if (period === 'monthly') {
      periodStartDate = new Date(targetYear, targetMonth - 1, 1);
      periodEndDate = new Date(targetYear, targetMonth, 0);
    } else if (period === 'quarterly') {
      const q = quarter || Math.ceil(targetMonth / 3);
      periodStartDate = new Date(targetYear, (q - 1) * 3, 1);
      periodEndDate = new Date(targetYear, q * 3, 0);
    } else {
      periodStartDate = new Date(targetYear, 0, 1);
      periodEndDate = new Date(targetYear, 11, 31);
    }

    // Salvar na tabela
    const { data: saved, error: saveError } = await supabase
      .from('revenue_predictions')
      .upsert({
        prediction_period: period,
        target_year: targetYear,
        target_month: month || null,
        target_quarter: quarter || null,
        period_start_date: periodStartDate.toISOString().split('T')[0],
        period_end_date: periodEndDate.toISOString().split('T')[0],
        predicted_revenue: prediction.predicted_revenue,
        predicted_mrr: prediction.predicted_mrr,
        predicted_arr: prediction.predicted_arr,
        revenue_growth_rate: prediction.revenue_growth_rate,
        current_revenue: prediction.current_revenue,
        predicted_active_clients: prediction.predicted_active_clients,
        predicted_avg_ticket: prediction.predicted_avg_ticket,
        confidence_level: prediction.confidence_level,
        trend: prediction.trend,
        performance_status: prediction.performance_status,
      }, {
        onConflict: 'prediction_period,target_year,target_month,target_quarter',
      })
      .select()
      .single();

    if (saveError) throw saveError;

    return NextResponse.json({
      success: true,
      prediction: saved,
      message: 'Predição de receita salva com sucesso',
    });
  } catch (error: any) {
    console.error('Error saving revenue prediction:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao salvar predição de receita' },
      { status: 500 }
    );
  }
}
