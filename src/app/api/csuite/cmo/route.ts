/**
 * API CMO IA - Endpoints de Clientes e Marketing
 */

import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import {
  getCMODashboard,
  chatWithCMO,
  analyzeSegments,
  identifyUpsellOpportunities,
  analyzeChurnRisk,
  generateRetentionCampaign
} from '@/lib/csuite/cmo-ai';

export const dynamic = 'force-dynamic';

// GET - Dashboard e dados do CMO
export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'dashboard';

    switch (action) {
      case 'dashboard':
        const dashboard = await getCMODashboard();
        return NextResponse.json(dashboard);

      case 'segments':
        const segments = await analyzeSegments();
        return NextResponse.json(segments);

      case 'upsell':
        const upsell = await identifyUpsellOpportunities();
        return NextResponse.json(upsell);

      case 'churn':
        const churn = await analyzeChurnRisk();
        return NextResponse.json(churn);

      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }
  } catch (error) {
    console.error('Erro na API CMO:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Ações do CMO
export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'chat':
        const { message, context } = body;
        if (!message) {
          return NextResponse.json({ error: 'Mensagem obrigatória' }, { status: 400 });
        }
        const chatResponse = await chatWithCMO(message, context);
        return NextResponse.json({ response: chatResponse });

      case 'generate-retention-campaign':
        const churnRisks = await analyzeChurnRisk();
        const campaign = await generateRetentionCampaign(churnRisks);
        return NextResponse.json(campaign);

      case 'update-opportunity-status':
        const { opportunityId, status } = body;
        if (!opportunityId || !status) {
          return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
        }
        // Atualizar no banco
        await supabase
          .from('upsell_opportunities')
          .update({ status })
          .eq('id', opportunityId);
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }
  } catch (error) {
    console.error('Erro na API CMO:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

