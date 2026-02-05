/**
 * Valle 360 - API Route: Google Business Reviews
 * GET /api/reputation/google - Buscar reviews e métricas do Google
 * POST /api/reputation/google - Responder a um review
 */

import { NextRequest, NextResponse } from 'next/server';
import { googleBusinessClient } from '@/lib/integrations/reputation/google-business';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'reviews';
    const locationId = searchParams.get('locationId') || 'loc_1';

    switch (action) {
      case 'reviews': {
        const reviews = await googleBusinessClient.getReviews(locationId);
        return NextResponse.json({ success: true, data: reviews });
      }

      case 'metrics': {
        const metrics = await googleBusinessClient.getMetrics(locationId);
        return NextResponse.json({ success: true, data: metrics });
      }

      case 'insights': {
        const insights = await googleBusinessClient.getInsights(locationId);
        return NextResponse.json({ success: true, data: insights });
      }

      case 'unreplied': {
        const unreplied = await googleBusinessClient.getUnrepliedReviews(locationId);
        return NextResponse.json({ success: true, data: unreplied });
      }

      case 'negative': {
        const negative = await googleBusinessClient.getNegativeReviews(locationId);
        return NextResponse.json({ success: true, data: negative });
      }

      case 'locations': {
        const locations = await googleBusinessClient.getLocations();
        return NextResponse.json({ success: true, data: locations });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Ação inválida' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Erro ao buscar dados do Google:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, locationId, reviewId, text } = body;

    if (action === 'reply') {
      if (!locationId || !reviewId || !text) {
        return NextResponse.json(
          { success: false, error: 'Campos obrigatórios: locationId, reviewId, text' },
          { status: 400 }
        );
      }

      const success = await googleBusinessClient.replyToReview(locationId, reviewId, text);
      return NextResponse.json({ success });
    }

    return NextResponse.json(
      { success: false, error: 'Ação inválida' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Erro ao processar ação do Google:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

