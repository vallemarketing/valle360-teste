import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/predictions/hiring
 * Retorna predições de necessidades de contratação
 */
export async function GET(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || 'monthly';
  const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
  const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : new Date().getMonth() + 1;

  try {
    const supabase = getSupabaseAdmin();

    // Calcular predição de contratação
    const { data, error } = await supabase.rpc('calculate_hiring_needs_prediction', {
      p_period: period,
      p_year: year,
      p_month: month,
    });

    if (error) throw error;

    // Buscar histórico
    const { data: history, error: historyError } = await supabase
      .from('hiring_needs_predictions')
      .select('*')
      .eq('target_year', year)
      .order('period_start_date', { ascending: false })
      .limit(12);

    if (historyError) console.error('Error fetching hiring history:', historyError);

    return NextResponse.json({
      success: true,
      prediction: data,
      history: history || [],
    });
  } catch (error: any) {
    console.error('Error fetching hiring predictions:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao buscar predições de contratação' },
      { status: 500 }
    );
  }
}
