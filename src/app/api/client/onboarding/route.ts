import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// GET: Buscar status do onboarding do cliente
export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    // Buscar client_id do usuário
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    // Buscar ou criar onboarding
    let { data: onboarding, error: onboardingError } = await supabase
      .from('client_onboarding')
      .select('*')
      .eq('client_id', client.id)
      .single();

    if (onboardingError && onboardingError.code === 'PGRST116') {
      // Não existe, criar
      const { data: newOnboarding, error: createError } = await supabase
        .from('client_onboarding')
        .insert({ client_id: client.id })
        .select()
        .single();

      if (createError) throw createError;
      onboarding = newOnboarding;
    } else if (onboardingError) {
      throw onboardingError;
    }

    return NextResponse.json({ 
      success: true, 
      onboarding,
      isComplete: !!onboarding?.completed_at
    });
  } catch (error: any) {
    console.error('Erro ao buscar onboarding:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Atualizar passo do onboarding
export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const body = await request.json();
  const { step, data } = body;

  try {
    // Buscar client_id do usuário
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    // Preparar dados de atualização baseado no passo
    let updateData: Record<string, any> = {
      step_completed: step,
      updated_at: new Date().toISOString()
    };

    switch (step) {
      case 1: // Objetivos
        updateData.objectives = data.objectives || [];
        break;
      case 2: // Segmento/Indústria
        updateData.segment = data.segment;
        updateData.industry = data.industry;
        break;
      case 3: // Instagram conectado
        updateData.instagram_connected = data.instagram_connected;
        updateData.instagram_username = data.instagram_username;
        updateData.instagram_access_token = data.instagram_access_token;
        break;
      case 4: // Concorrentes selecionados
        updateData.competitors_selected = true;
        updateData.competitors = data.competitors || [];
        break;
      case 5: // Metas definidas + Conclusão
        updateData.goals_defined = true;
        updateData.completed_at = new Date().toISOString();
        
        // Inserir metas na tabela client_goals
        if (data.goals && data.goals.length > 0) {
          const goalsToInsert = data.goals.map((goal: any) => ({
            client_id: client.id,
            goal_type: goal.type,
            title: goal.title,
            description: goal.description,
            target_value: goal.target_value,
            current_value: goal.current_value || 0,
            start_value: goal.current_value || 0,
            unit: goal.unit || 'number',
            deadline: goal.deadline,
            priority: goal.priority || 2
          }));

          await supabase.from('client_goals').insert(goalsToInsert);
        }
        break;
    }

    // Atualizar onboarding
    const { data: updatedOnboarding, error: updateError } = await supabase
      .from('client_onboarding')
      .update(updateData)
      .eq('client_id', client.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Inserir concorrentes na tabela separada se for passo 4
    if (step === 4 && data.competitors && data.competitors.length > 0) {
      const competitorsToInsert = data.competitors.map((comp: any) => ({
        client_id: client.id,
        instagram_username: comp.username,
        instagram_id: comp.id,
        display_name: comp.name,
        profile_picture_url: comp.profile_picture_url,
        followers_count: comp.followers_count,
        category: comp.category
      }));

      // Upsert para evitar duplicatas
      for (const comp of competitorsToInsert) {
        await supabase
          .from('client_competitors')
          .upsert(comp, { onConflict: 'client_id,instagram_username' });
      }
    }

    return NextResponse.json({ 
      success: true, 
      onboarding: updatedOnboarding,
      isComplete: !!updatedOnboarding?.completed_at
    });
  } catch (error: any) {
    console.error('Erro ao atualizar onboarding:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Pular onboarding
export async function PATCH(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!client) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from('client_onboarding')
      .update({ 
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('client_id', client.id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, skipped: true });
  } catch (error: any) {
    console.error('Erro ao pular onboarding:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
