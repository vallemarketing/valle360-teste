/**
 * API C-Suite Virtual - Endpoints Consolidados
 */

import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import {
  getCSuiteDashboard,
  chatWithCSuite,
  generateExecutiveReport,
  ExecutiveType
} from '@/lib/csuite';

export const dynamic = 'force-dynamic';

// GET - Dashboard consolidado
export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'dashboard';

    switch (type) {
      case 'dashboard':
        const dashboard = await getCSuiteDashboard();
        return NextResponse.json(dashboard);

      case 'report':
        const report = await generateExecutiveReport();
        return NextResponse.json(report);

      default:
        return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
    }
  } catch (error) {
    console.error('Erro na API C-Suite:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Chat com C-Suite
export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { message, executive = 'all', context } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Mensagem é obrigatória' },
        { status: 400 }
      );
    }

    const response = await chatWithCSuite(
      message,
      executive as ExecutiveType,
      context
    );

    // Registrar conversa
    try {
      await supabase.from('csuite_conversations').insert({
        user_id: user.id,
        executive_type: executive,
        title: message.slice(0, 100)
      });
    } catch (logError) {
      console.warn('Erro ao registrar conversa:', logError);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Erro no chat C-Suite:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

