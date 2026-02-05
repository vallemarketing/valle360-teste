import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/predictions/dashboard
 * Retorna resumo de todas as predições para o dashboard principal
 */
export async function GET(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  try {
    const supabase = getSupabaseAdmin();

    // 1. Churn - Clientes em alto risco
    const { data: churnData } = await supabase
      .from('client_churn_predictions')
      .select('*')
      .in('risk_level', ['high', 'critical'])
      .order('churn_probability', { ascending: false })
      .limit(10);

    // 2. LTV - Oportunidades de upsell
    const { data: ltvData } = await supabase
      .from('client_ltv_predictions')
      .select(`
        *,
        clients:client_id (
          id,
          company_name,
          monthly_value
        )
      `)
      .gte('upsell_probability', 60)
      .order('upsell_probability', { ascending: false })
      .limit(10);

    // 3. Receita - Predição atual
    const { data: revenueData } = await supabase.rpc('calculate_revenue_prediction', {
      p_period: 'monthly',
      p_year: new Date().getFullYear(),
      p_month: new Date().getMonth() + 1,
      p_quarter: null,
    });

    // 4. Contratação - Necessidades atuais
    const { data: hiringData } = await supabase.rpc('calculate_hiring_needs_prediction', {
      p_period: 'monthly',
      p_year: new Date().getFullYear(),
      p_month: new Date().getMonth() + 1,
    });

    // 5. Estatísticas gerais
    const { count: totalClients } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    const { count: totalEmployees } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    return NextResponse.json({
      success: true,
      dashboard: {
        churn: {
          high_risk_count: churnData?.length || 0,
          clients: churnData || [],
          total_revenue_at_risk: churnData?.reduce((sum, c) => {
            return sum + (c.predicted_revenue_loss || 0);
          }, 0) || 0,
        },
        ltv: {
          upsell_opportunities: ltvData?.length || 0,
          clients: ltvData || [],
          total_upsell_potential: ltvData?.reduce((sum, l) => {
            return sum + (l.estimated_upsell_value || 0);
          }, 0) || 0,
        },
        revenue: {
          predicted_mrr: revenueData?.predicted_mrr || 0,
          predicted_arr: revenueData?.predicted_arr || 0,
          growth_rate: revenueData?.revenue_growth_rate || 0,
          trend: revenueData?.trend || 'stable',
          confidence: revenueData?.confidence_level || 0,
        },
        hiring: {
          recommended_hires: hiringData?.recommended_hires || 0,
          priority_level: hiringData?.priority_level || 'low',
          capacity_utilization: hiringData?.current_capacity_utilization || 0,
          capacity_status: hiringData?.capacity_status || 'optimal',
        },
        general: {
          total_clients: totalClients || 0,
          total_employees: totalEmployees || 0,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching dashboard predictions:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao buscar dashboard de predições' },
      { status: 500 }
    );
  }
}
