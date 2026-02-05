/**
 * API CFO IA - Endpoints Financeiros
 */

import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import {
  getCFODashboard,
  chatWithCFO,
  calculateServicePrice,
  analyzeClientProfitability,
  generateFinancialForecast,
  analyzePricingHealth
} from '@/lib/csuite/cfo-ai';

export const dynamic = 'force-dynamic';

// GET - Dashboard e dados do CFO
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
        const dashboard = await getCFODashboard();
        return NextResponse.json(dashboard);

      case 'profitability':
        const profitability = await analyzeClientProfitability();
        return NextResponse.json(profitability);

      case 'forecast':
        const months = parseInt(searchParams.get('months') || '3');
        const forecast = await generateFinancialForecast(months);
        return NextResponse.json(forecast);

      case 'pricing-health':
        const pricing = await analyzePricingHealth();
        return NextResponse.json(pricing);

      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }
  } catch (error) {
    console.error('Erro na API CFO:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Ações do CFO
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
        const chatResponse = await chatWithCFO(message, context);
        return NextResponse.json({ response: chatResponse });

      case 'calculate-price':
        const { serviceName, category, hoursEstimate, complexity, clientSegment, includeTools } = body;
        if (!serviceName || !category || !hoursEstimate) {
          return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
        }
        const pricing = await calculateServicePrice({
          serviceName,
          category,
          hoursEstimate,
          complexity: complexity || 'medium',
          clientSegment,
          includeTools
        });
        return NextResponse.json(pricing);

      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }
  } catch (error) {
    console.error('Erro na API CFO:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

