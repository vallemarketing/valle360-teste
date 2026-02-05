import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/predictions/churn
 * Retorna predições de churn de clientes
 */
export async function GET(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('clientId');
  const riskLevel = searchParams.get('riskLevel'); // 'high', 'critical'

  try {
    const supabase = getSupabaseAdmin();

    // Se clientId específico foi fornecido
    if (clientId) {
      // Calcular predição para cliente específico
      const { data, error } = await supabase.rpc('calculate_client_churn_prediction', {
        p_client_id: clientId,
      });

      if (error) throw error;

      return NextResponse.json({ success: true, prediction: data });
    }

    // Caso contrário, buscar todos os clientes em risco
    let query = supabase
      .from('client_churn_predictions')
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
      .order('churn_probability', { ascending: false });

    // Filtrar por nível de risco se especificado
    if (riskLevel) {
      if (riskLevel === 'high' || riskLevel === 'critical') {
        query = query.in('risk_level', ['high', 'critical']);
      } else {
        query = query.eq('risk_level', riskLevel);
      }
    }

    const { data: predictions, error: fetchError } = await query.limit(50);

    if (fetchError) throw fetchError;

    // Estatísticas resumidas
    const stats = {
      total: predictions?.length || 0,
      high_risk: predictions?.filter(p => p.risk_level === 'high').length || 0,
      critical_risk: predictions?.filter(p => p.risk_level === 'critical').length || 0,
      avg_churn_probability: predictions?.length
        ? (predictions.reduce((sum, p) => sum + (p.churn_probability || 0), 0) / predictions.length).toFixed(2)
        : 0,
      total_revenue_at_risk: predictions?.reduce((sum, p) => {
        const monthlyValue = p.clients?.monthly_value || 0;
        return sum + (monthlyValue * 12); // ARR at risk
      }, 0) || 0,
    };

    return NextResponse.json({
      success: true,
      predictions,
      stats,
    });
  } catch (error: any) {
    console.error('Error fetching churn predictions:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao buscar predições de churn' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/predictions/churn
 * Calcula predição de churn para um cliente
 */
export async function POST(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  try {
    const body = await request.json();
    const { clientId } = body;

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'clientId é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Calcular predição
    const { data: prediction, error } = await supabase.rpc('calculate_client_churn_prediction', {
      p_client_id: clientId,
    });

    if (error) throw error;

    // Salvar na tabela
    const { data: saved, error: saveError } = await supabase
      .from('client_churn_predictions')
      .insert({
        client_id: clientId,
        churn_probability: prediction.churn_probability,
        risk_level: prediction.risk_level,
        days_until_churn: prediction.days_until_churn,
        predicted_churn_date: prediction.predicted_churn_date,
        contributing_factors: prediction.contributing_factors || {},
        warning_signals: prediction.warning_signals || [],
        recommended_actions: prediction.recommended_actions || [],
        confidence_level: prediction.confidence_level || 50,
      })
      .select()
      .single();

    if (saveError) throw saveError;

    return NextResponse.json({
      success: true,
      prediction: saved,
      message: 'Predição calculada e salva com sucesso',
    });
  } catch (error: any) {
    console.error('Error calculating churn prediction:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao calcular predição de churn' },
      { status: 500 }
    );
  }
}
