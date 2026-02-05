import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { POINT_ACTIONS, PointAction } from '@/lib/gamification/levels';

// GET: Buscar pontos do cliente
export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    // Buscar client_id
    const { data: client } = await supabase
      .from('clients')
      .select('id, total_points, level')
      .eq('user_id', user.id)
      .single();

    if (!client) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    // Buscar histórico de pontos recentes
    const { data: history } = await supabase
      .from('client_points_history')
      .select('*')
      .eq('client_id', client.id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Buscar achievements
    const { data: achievements } = await supabase
      .from('client_achievements')
      .select('*')
      .eq('client_id', client.id)
      .order('earned_at', { ascending: false });

    return NextResponse.json({ 
      success: true, 
      points: client.total_points || 0,
      level: client.level || 'bronze',
      history: history || [],
      achievements: achievements || []
    });
  } catch (error: any) {
    console.error('Erro ao buscar pontos:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Adicionar pontos ao cliente
export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { action, metadata } = await request.json();

    if (!action || !POINT_ACTIONS[action as PointAction]) {
      return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }

    const pointsToAdd = POINT_ACTIONS[action as PointAction];

    // Buscar client_id
    const { data: client } = await supabase
      .from('clients')
      .select('id, total_points')
      .eq('user_id', user.id)
      .single();

    if (!client) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    const newTotal = (client.total_points || 0) + pointsToAdd;

    // Determinar novo nível
    let newLevel = 'bronze';
    if (newTotal >= 15000) newLevel = 'diamond';
    else if (newTotal >= 5000) newLevel = 'platinum';
    else if (newTotal >= 2000) newLevel = 'gold';
    else if (newTotal >= 500) newLevel = 'silver';

    // Atualizar pontos do cliente
    const { error: updateError } = await supabase
      .from('clients')
      .update({ 
        total_points: newTotal,
        level: newLevel,
        updated_at: new Date().toISOString()
      })
      .eq('id', client.id);

    if (updateError) throw updateError;

    // Registrar no histórico
    await supabase.from('client_points_history').insert({
      client_id: client.id,
      action: action,
      points: pointsToAdd,
      balance_after: newTotal,
      metadata: metadata || {}
    });

    return NextResponse.json({ 
      success: true, 
      pointsAdded: pointsToAdd,
      newTotal,
      newLevel,
      action
    });
  } catch (error: any) {
    console.error('Erro ao adicionar pontos:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
