import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// GET: Buscar streak atual do cliente
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
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!client) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    // Buscar ou criar streak
    let { data: streak, error: streakError } = await supabase
      .from('client_approval_streaks')
      .select('*')
      .eq('client_id', client.id)
      .single();

    if (streakError && streakError.code === 'PGRST116') {
      // Não existe, criar
      const { data: newStreak, error: createError } = await supabase
        .from('client_approval_streaks')
        .insert({ client_id: client.id })
        .select()
        .single();

      if (createError) throw createError;
      streak = newStreak;
    } else if (streakError) {
      throw streakError;
    }

    // Verificar se o streak ainda é válido (última aprovação foi ontem ou hoje)
    if (streak?.last_approval_at) {
      const lastApproval = new Date(streak.last_approval_at);
      const today = new Date();
      const diffDays = Math.floor((today.getTime() - lastApproval.getTime()) / (1000 * 60 * 60 * 24));
      
      // Se passou mais de 1 dia, resetar streak
      if (diffDays > 1 && streak.current_streak > 0) {
        const { data: resetStreak } = await supabase
          .from('client_approval_streaks')
          .update({ 
            current_streak: 0,
            streak_start_date: null,
            updated_at: new Date().toISOString()
          })
          .eq('client_id', client.id)
          .select()
          .single();
        
        streak = resetStreak;
      }
    }

    // Calcular próximo milestone
    const milestones = [7, 14, 30, 60, 90, 180, 365];
    const nextMilestone = milestones.find(m => m > (streak?.current_streak || 0)) || 365;
    const daysToMilestone = nextMilestone - (streak?.current_streak || 0);

    return NextResponse.json({ 
      success: true, 
      streak: {
        current: streak?.current_streak || 0,
        best: streak?.best_streak || 0,
        total_approvals: streak?.total_approvals || 0,
        last_approval: streak?.last_approval_at,
        streak_start: streak?.streak_start_date
      },
      nextMilestone,
      daysToMilestone
    });
  } catch (error: any) {
    console.error('Erro ao buscar streak:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Registrar nova aprovação (chamado após aprovar post)
export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    // Buscar client_id
    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!client) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    // Buscar streak atual
    let { data: streak } = await supabase
      .from('client_approval_streaks')
      .select('*')
      .eq('client_id', client.id)
      .single();

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    let newStreak = 1;
    let streakStartDate = todayStr;
    let shouldIncrement = true;

    if (streak) {
      const lastApproval = streak.last_approval_at ? new Date(streak.last_approval_at) : null;
      
      if (lastApproval) {
        const lastApprovalDate = lastApproval.toISOString().split('T')[0];
        const diffDays = Math.floor((today.getTime() - lastApproval.getTime()) / (1000 * 60 * 60 * 24));
        
        if (lastApprovalDate === todayStr) {
          // Já aprovou hoje, não incrementar streak mas contar aprovação
          shouldIncrement = false;
          newStreak = streak.current_streak;
          streakStartDate = streak.streak_start_date;
        } else if (diffDays === 1) {
          // Aprovou ontem, continuar streak
          newStreak = streak.current_streak + 1;
          streakStartDate = streak.streak_start_date || todayStr;
        } else {
          // Mais de 1 dia, resetar streak
          newStreak = 1;
          streakStartDate = todayStr;
        }
      }
    }

    const bestStreak = Math.max(newStreak, streak?.best_streak || 0);
    const totalApprovals = (streak?.total_approvals || 0) + 1;

    // Atualizar streak
    const { data: updatedStreak, error: updateError } = await supabase
      .from('client_approval_streaks')
      .upsert({
        client_id: client.id,
        current_streak: newStreak,
        best_streak: bestStreak,
        total_approvals: totalApprovals,
        last_approval_at: today.toISOString(),
        streak_start_date: streakStartDate,
        updated_at: today.toISOString()
      }, { onConflict: 'client_id' })
      .select()
      .single();

    if (updateError) throw updateError;

    // Verificar se atingiu milestone e dar pontos
    const milestones = [7, 30, 60, 90, 180, 365];
    const achievedMilestone = milestones.find(m => newStreak === m);
    
    let bonusPoints = 0;
    if (achievedMilestone) {
      bonusPoints = achievedMilestone >= 30 ? 200 : 50;
      
      // Registrar achievement
      await supabase.from('client_achievements').upsert({
        client_id: client.id,
        achievement_type: 'streak',
        achievement_code: `streak_${achievedMilestone}`,
        title: `${achievedMilestone} Dias de Streak!`,
        description: `Você aprovou conteúdos por ${achievedMilestone} dias consecutivos!`,
        points: bonusPoints,
        earned_at: today.toISOString()
      }, { onConflict: 'client_id,achievement_code' });
    }

    return NextResponse.json({ 
      success: true, 
      streak: {
        current: newStreak,
        best: bestStreak,
        total_approvals: totalApprovals,
        incremented: shouldIncrement
      },
      achievedMilestone,
      bonusPoints
    });
  } catch (error: any) {
    console.error('Erro ao atualizar streak:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
