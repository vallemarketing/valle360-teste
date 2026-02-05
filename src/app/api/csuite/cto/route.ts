/**
 * API CTO IA - Endpoints Operacionais
 */

import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import {
  getCTODashboard,
  chatWithCTO,
  getDepartmentCapacity,
  forecastCapacity,
  getToolRecommendations,
  analyzeHiringNeed,
  analyzeAutomationPotential
} from '@/lib/csuite/cto-ai';

export const dynamic = 'force-dynamic';

// GET - Dashboard e dados do CTO
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
        const dashboard = await getCTODashboard();
        return NextResponse.json(dashboard);

      case 'capacity':
        const department = searchParams.get('department') || undefined;
        const capacity = await getDepartmentCapacity(department);
        return NextResponse.json(capacity);

      case 'forecast':
        const weeks = parseInt(searchParams.get('weeks') || '4');
        const forecast = await forecastCapacity(weeks);
        return NextResponse.json(forecast);

      case 'tools':
        const toolDept = searchParams.get('department') || undefined;
        const tools = await getToolRecommendations(toolDept);
        return NextResponse.json(tools);

      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }
  } catch (error) {
    console.error('Erro na API CTO:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Ações do CTO
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
        const chatResponse = await chatWithCTO(message, context);
        return NextResponse.json({ response: chatResponse });

      case 'analyze-hiring':
        const { department } = body;
        if (!department) {
          return NextResponse.json({ error: 'Departamento obrigatório' }, { status: 400 });
        }
        const hiring = await analyzeHiringNeed(department);
        return NextResponse.json(hiring);

      case 'analyze-automation':
        const { processDescription } = body;
        if (!processDescription) {
          return NextResponse.json({ error: 'Descrição do processo obrigatória' }, { status: 400 });
        }
        const automation = await analyzeAutomationPotential(processDescription);
        return NextResponse.json(automation);

      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }
  } catch (error) {
    console.error('Erro na API CTO:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

