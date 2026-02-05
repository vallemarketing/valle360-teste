/**
 * Valle 360 - API Route: Reclame Aqui
 * GET /api/reputation/reclame-aqui - Buscar reclamações e métricas do Reclame Aqui
 */

import { NextRequest, NextResponse } from 'next/server';
import { reclameAquiClient } from '@/lib/integrations/reputation/reclame-aqui';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'complaints';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    switch (action) {
      case 'complaints': {
        const complaints = await reclameAquiClient.getComplaints(page, limit);
        return NextResponse.json({ success: true, data: complaints });
      }

      case 'metrics': {
        const metrics = await reclameAquiClient.getMetrics();
        return NextResponse.json({ success: true, data: metrics });
      }

      case 'profile': {
        const profile = await reclameAquiClient.getCompanyProfile();
        return NextResponse.json({ success: true, data: profile });
      }

      case 'pending': {
        const pending = await reclameAquiClient.getPendingComplaints();
        return NextResponse.json({ success: true, data: pending });
      }

      case 'categories': {
        const categories = await reclameAquiClient.getComplaintsByCategory();
        return NextResponse.json({ success: true, data: categories });
      }

      case 'health': {
        const health = await reclameAquiClient.calculateHealthScore();
        return NextResponse.json({ success: true, data: health });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Ação inválida' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Erro ao buscar dados do Reclame Aqui:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

