/**
 * API para resgate de recompensas
 * Cliente troca pontos por recompensas
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

async function getAuthUser() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
  
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// POST - Resgatar recompensa
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const db = getSupabaseAdmin();

    // Buscar cliente
    const { data: client, error: clientError } = await db
      .from('clients')
      .select('id, total_points, level')
      .eq('user_id', user.id)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const { rewardId } = body;

    if (!rewardId) {
      return NextResponse.json({ error: 'ID da recompensa é obrigatório' }, { status: 400 });
    }

    // Buscar recompensa
    const { data: reward, error: rewardError } = await db
      .from('rewards')
      .select('*')
      .eq('id', rewardId)
      .eq('is_active', true)
      .single();

    // Se não encontrar no banco, usar mock
    const mockRewards: Record<string, any> = {
      '1': { id: '1', name: 'Consultoria de Marca (1h)', points_cost: 500, stock: 10 },
      '2': { id: '2', name: 'Desconto 10% no Próximo Mês', points_cost: 300, stock: 50 },
      '3': { id: '3', name: 'Post Extra no Instagram', points_cost: 150, stock: 20 },
      '4': { id: '4', name: 'Stories Destacados', points_cost: 200, stock: 15 },
      '5': { id: '5', name: 'Análise de Concorrentes', points_cost: 400, stock: 5 },
      '6': { id: '6', name: 'Vídeo Institucional (30s)', points_cost: 800, stock: 3, tier_required: 'gold' },
      '7': { id: '7', name: 'Prioridade no Atendimento', points_cost: 250, stock: 100 },
      '8': { id: '8', name: 'Kit Valle Exclusivo', points_cost: 600, stock: 10, tier_required: 'silver' },
    };

    const rewardData = reward || mockRewards[rewardId];

    if (!rewardData) {
      return NextResponse.json({ error: 'Recompensa não encontrada' }, { status: 404 });
    }

    // Verificar pontos suficientes
    const clientPoints = client.total_points || 0;
    if (clientPoints < rewardData.points_cost) {
      return NextResponse.json({ 
        error: 'Pontos insuficientes',
        required: rewardData.points_cost,
        available: clientPoints
      }, { status: 400 });
    }

    // Verificar estoque (se aplicável)
    if (rewardData.stock !== undefined && rewardData.stock <= 0) {
      return NextResponse.json({ error: 'Recompensa esgotada' }, { status: 400 });
    }

    // Verificar tier (se aplicável)
    if (rewardData.tier_required) {
      const tierOrder = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
      const clientTier = client.level || 'bronze';
      const clientTierIndex = tierOrder.indexOf(clientTier);
      const requiredTierIndex = tierOrder.indexOf(rewardData.tier_required);
      
      if (clientTierIndex < requiredTierIndex) {
        return NextResponse.json({ 
          error: `Requer nível ${rewardData.tier_required} ou superior`,
          required_tier: rewardData.tier_required,
          current_tier: clientTier
        }, { status: 400 });
      }
    }

    // Debitar pontos
    const newPoints = clientPoints - rewardData.points_cost;
    const { error: updateError } = await db
      .from('clients')
      .update({ total_points: newPoints })
      .eq('id', client.id);

    if (updateError) {
      console.error('[RewardRedeem] Erro ao debitar pontos:', updateError);
      return NextResponse.json({ error: 'Erro ao processar resgate' }, { status: 500 });
    }

    // Registrar resgate
    await db
      .from('client_redeemed_rewards')
      .insert({
        client_id: client.id,
        reward_id: rewardId,
        reward_name: rewardData.name,
        points_spent: rewardData.points_cost,
        status: 'pending',
        redeemed_at: new Date().toISOString(),
      });

    // Registrar no histórico de pontos
    await db
      .from('client_points_history')
      .insert({
        client_id: client.id,
        points: -rewardData.points_cost,
        action: 'reward_redemption',
        description: `Resgate: ${rewardData.name}`,
        reference_id: rewardId,
        reference_type: 'reward',
        created_at: new Date().toISOString(),
      });

    // Atualizar estoque (se tabela de rewards existir)
    if (reward) {
      await db
        .from('rewards')
        .update({ stock: rewardData.stock - 1 })
        .eq('id', rewardId);
    }

    return NextResponse.json({
      success: true,
      message: 'Recompensa resgatada com sucesso!',
      reward: {
        id: rewardId,
        name: rewardData.name,
        points_spent: rewardData.points_cost,
      },
      new_balance: newPoints,
    });

  } catch (error: any) {
    console.error('[RewardRedeem] Erro:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro interno' },
      { status: 500 }
    );
  }
}

// GET - Listar resgates do cliente
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const db = getSupabaseAdmin();

    // Buscar cliente
    const { data: client } = await db
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!client) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    // Buscar resgates
    const { data: redemptions, error } = await db
      .from('client_redeemed_rewards')
      .select('*')
      .eq('client_id', client.id)
      .order('redeemed_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[RewardRedeem GET] Erro:', error);
      return NextResponse.json({ error: 'Erro ao buscar resgates' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      redemptions: redemptions || [],
    });

  } catch (error: any) {
    console.error('[RewardRedeem GET] Erro:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro interno' },
      { status: 500 }
    );
  }
}
