/**
 * API CHRO IA - Endpoints de Pessoas e RH
 */

import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import {
  getCHRODashboard,
  chatWithCHRO,
  analyzeEmployees,
  predictTurnover,
  generateCareerPlan,
  analyzeSalaryCompetitiveness,
  analyzeTeamHealth
} from '@/lib/csuite/chro-ai';

export const dynamic = 'force-dynamic';

// GET - Dashboard e dados do CHRO
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
        const dashboard = await getCHRODashboard();
        return NextResponse.json(dashboard);

      case 'employees':
        const employees = await analyzeEmployees();
        return NextResponse.json(employees);

      case 'turnover':
        const turnover = await predictTurnover();
        return NextResponse.json(turnover);

      case 'salaries':
        const salaries = await analyzeSalaryCompetitiveness();
        return NextResponse.json(salaries);

      case 'team-health':
        const health = await analyzeTeamHealth();
        return NextResponse.json(health);

      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }
  } catch (error) {
    console.error('Erro na API CHRO:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Ações do CHRO
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
        const chatResponse = await chatWithCHRO(message, context);
        return NextResponse.json({ response: chatResponse });

      case 'generate-career-plan':
        const { userId, targetPosition } = body;
        if (!userId || !targetPosition) {
          return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
        }
        const careerPlan = await generateCareerPlan(userId, targetPosition);
        return NextResponse.json(careerPlan);

      case 'approve-salary-adjustment':
        const { recommendationId, approved } = body;
        if (!recommendationId) {
          return NextResponse.json({ error: 'ID da recomendação obrigatório' }, { status: 400 });
        }
        await supabase
          .from('salary_recommendations')
          .update({ status: approved ? 'approved' : 'rejected' })
          .eq('id', recommendationId);
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }
  } catch (error) {
    console.error('Erro na API CHRO:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

