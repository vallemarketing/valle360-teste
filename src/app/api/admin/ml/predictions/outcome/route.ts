import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  try {
    const body = await request.json().catch(() => null);
    const predictionId = String(body?.predictionId || body?.prediction_id || '').trim();
    const wasCorrect = Boolean(body?.wasCorrect ?? body?.was_correct);
    const actualOutcome = body?.actualOutcome ?? body?.actual_outcome ?? null;

    if (!predictionId) {
      return NextResponse.json({ success: false, error: 'predictionId é obrigatório' }, { status: 400 });
    }

    const db = getSupabaseAdmin();
    const nowIso = new Date().toISOString();

    const { error } = await db
      .from('ml_predictions_log')
      .update({
        was_correct: wasCorrect,
        actual_value: actualOutcome,
        actual_recorded_at: nowIso,
        accuracy_score: wasCorrect ? 100 : 0,
      })
      .eq('id', predictionId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Erro interno' }, { status: 500 });
  }
}



