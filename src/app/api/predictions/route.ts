import { NextRequest, NextResponse } from 'next/server';
import { predictiveEngine, type Prediction } from '@/lib/ai/predictive-engine';
import { clientHealthScore } from '@/lib/ai/client-health-score';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user?.id) {
    return { ok: false as const, res: NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 }) };
  }

  const { data: isAdmin, error: isAdminError } = await supabase.rpc('is_admin');
  if (isAdminError || !isAdmin) {
    return { ok: false as const, res: NextResponse.json({ success: false, error: 'Acesso negado (admin)' }, { status: 403 }) };
  }

  return { ok: true as const, userId: auth.user.id };
}

// GET - Buscar previsões
export async function GET(request: NextRequest) {
  try {
    const gate = await requireAdmin();
    if (!gate.ok) return gate.res;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as Prediction['type'] | null;
    const entity_type = searchParams.get('entity_type') || undefined;
    const entity_id = searchParams.get('entity_id') || undefined;
    const min_confidence = searchParams.get('min_confidence');

    const predictions = await predictiveEngine.getPredictions({
      type: type || undefined,
      entity_type,
      entity_id,
      min_confidence: min_confidence ? parseInt(min_confidence) : undefined
    });

    return NextResponse.json({ success: true, predictions });
  } catch (error) {
    console.error('Erro ao buscar previsões:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar previsões' },
      { status: 500 }
    );
  }
}

// POST - Gerar previsões
export async function POST(request: NextRequest) {
  try {
    const gate = await requireAdmin();
    if (!gate.ok) return gate.res;

    const body = await request.json();
    const { action, entity_id, entity_type, period } = body;

    let result: any = null;

    switch (action) {
      case 'predict_churn':
        if (!entity_id) {
          return NextResponse.json(
            { success: false, error: 'entity_id é obrigatório para previsão de churn' },
            { status: 400 }
          );
        }
        result = await predictiveEngine.predictChurn(entity_id);
        break;

      case 'predict_conversion':
        if (!entity_id) {
          return NextResponse.json(
            { success: false, error: 'entity_id é obrigatório para previsão de conversão' },
            { status: 400 }
          );
        }
        result = await predictiveEngine.predictConversion(entity_id);
        break;

      case 'predict_delay':
        if (!entity_id) {
          return NextResponse.json(
            { success: false, error: 'entity_id é obrigatório para previsão de atraso' },
            { status: 400 }
          );
        }
        result = await predictiveEngine.predictDelay(entity_id);
        break;

      case 'predict_revenue':
        result = await predictiveEngine.predictRevenue(period || 'month');
        break;

      case 'predict_upsell':
        if (!entity_id) {
          return NextResponse.json(
            { success: false, error: 'entity_id é obrigatório para previsão de upsell' },
            { status: 400 }
          );
        }
        result = await predictiveEngine.predictUpsellOpportunities(entity_id);
        break;

      case 'calculate_health_score':
        if (!entity_id) {
          return NextResponse.json(
            { success: false, error: 'entity_id é obrigatório para Health Score' },
            { status: 400 }
          );
        }
        result = await clientHealthScore.calculateHealthScore(entity_id);
        break;

      case 'get_all_health_scores':
        const risk_level = body.risk_level;
        const min_churn = body.min_churn_probability;
        result = await clientHealthScore.getAllHealthScores({
          risk_level,
          min_churn_probability: min_churn
        });
        break;

      case 'recalculate_all_scores':
        const count = await clientHealthScore.recalculateAllScores();
        result = { recalculated: count };
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Ação não reconhecida' },
          { status: 400 }
        );
    }

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Não foi possível gerar a previsão' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Erro na API de previsões:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}

// PUT - Registrar feedback de previsão
export async function PUT(request: NextRequest) {
  try {
    const gate = await requireAdmin();
    if (!gate.ok) return gate.res;

    const body = await request.json();
    const { prediction_id, was_correct, actual_outcome } = body;

    if (!prediction_id) {
      return NextResponse.json(
        { success: false, error: 'prediction_id é obrigatório' },
        { status: 400 }
      );
    }

    await predictiveEngine.recordPredictionOutcome(
      prediction_id,
      was_correct,
      actual_outcome
    );

    return NextResponse.json({ success: true, message: 'Feedback registrado' });
  } catch (error) {
    console.error('Erro ao registrar feedback:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao registrar feedback' },
      { status: 500 }
    );
  }
}




