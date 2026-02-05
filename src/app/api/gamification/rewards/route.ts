import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PREDEFINED_BADGES } from '@/lib/gamification/badges'

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// GET - Listar recompensas do colaborador
export async function GET(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const status = searchParams.get('status')
    const forRH = searchParams.get('forRH') === 'true'

    let query = supabase
      .from('employee_rewards')
      .select(`
        *,
        employee:employees!employee_id(id, full_name, email, avatar),
        approver:employees!approved_by(id, full_name)
      `)
      .order('requested_at', { ascending: false })

    // Se for para RH, busca todas as pendentes
    if (forRH) {
      query = query.eq('status', 'pending')
    } else if (employeeId) {
      query = query.eq('employee_id', employeeId)
    }

    if (status && !forRH) {
      query = query.eq('status', status)
    }

    const { data: rewards, error } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      rewards: rewards || []
    })
  } catch (error: any) {
    console.error('Erro ao buscar recompensas:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST - Solicitar resgate de recompensa ou conceder badge
export async function POST(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    const body = await request.json()
    const { action, employeeId, badgeId, rewardType, rewardValue, rewardDescription } = body

    // Ação: Conceder badge ao colaborador
    if (action === 'grant_badge') {
      const badge = PREDEFINED_BADGES.find(b => b.id === badgeId)
      if (!badge) {
        return NextResponse.json(
          { success: false, error: 'Badge não encontrada' },
          { status: 400 }
        )
      }

      // Verificar se já possui a badge
      const { data: existingBadge } = await supabase
        .from('employee_badges')
        .select('id')
        .eq('employee_id', employeeId)
        .eq('badge_id', badgeId)
        .single()

      if (existingBadge) {
        return NextResponse.json(
          { success: false, error: 'Colaborador já possui esta badge' },
          { status: 400 }
        )
      }

      // Inserir badge
      const { error: badgeError } = await supabase
        .from('employee_badges')
        .insert({
          employee_id: employeeId,
          badge_id: badge.id,
          badge_name: badge.name,
          badge_category: badge.category,
          badge_rarity: badge.rarity,
          points_awarded: badge.pointsAwarded
        })

      if (badgeError) throw badgeError

      // Criar recompensas associadas à badge
      const rewardsToInsert = badge.rewards.map(reward => ({
        employee_id: employeeId,
        badge_id: badge.id,
        badge_name: badge.name,
        reward_type: reward.type,
        reward_value: String(reward.value),
        reward_description: reward.description,
        status: reward.requiresHRApproval ? 'pending' : 'approved',
        expires_at: reward.type === 'time_off' 
          ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 dias
          : null
      }))

      const { error: rewardsError } = await supabase
        .from('employee_rewards')
        .insert(rewardsToInsert)

      if (rewardsError) throw rewardsError

      return NextResponse.json({
        success: true,
        message: `Badge "${badge.name}" concedida com sucesso!`,
        badge,
        rewardsCreated: rewardsToInsert.length
      })
    }

    // Ação: Solicitar resgate de recompensa específica
    if (action === 'request_reward') {
      const { error } = await supabase
        .from('employee_rewards')
        .insert({
          employee_id: employeeId,
          badge_id: badgeId,
          badge_name: body.badgeName || 'Recompensa Manual',
          reward_type: rewardType,
          reward_value: String(rewardValue),
          reward_description: rewardDescription,
          status: 'pending'
        })

      if (error) throw error

      return NextResponse.json({
        success: true,
        message: 'Solicitação de recompensa enviada para aprovação'
      })
    }

    return NextResponse.json(
      { success: false, error: 'Ação inválida' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Erro ao processar recompensa:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// PATCH - Aprovar/Rejeitar/Resgatar recompensa
export async function PATCH(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    const body = await request.json()
    const { rewardId, action, approvedBy, rejectedReason } = body

    if (!rewardId || !action) {
      return NextResponse.json(
        { success: false, error: 'rewardId e action são obrigatórios' },
        { status: 400 }
      )
    }

    let updateData: Record<string, any> = {}

    switch (action) {
      case 'approve':
        updateData = {
          status: 'approved',
          approved_by: approvedBy,
          approved_at: new Date().toISOString()
        }
        break

      case 'reject':
        updateData = {
          status: 'rejected',
          approved_by: approvedBy,
          approved_at: new Date().toISOString(),
          rejected_reason: rejectedReason || 'Não aprovado pelo RH'
        }
        break

      case 'redeem':
        updateData = {
          status: 'redeemed',
          redeemed_at: new Date().toISOString()
        }
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Ação inválida. Use: approve, reject ou redeem' },
          { status: 400 }
        )
    }

    const { data, error } = await supabase
      .from('employee_rewards')
      .update(updateData)
      .eq('id', rewardId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: `Recompensa ${action === 'approve' ? 'aprovada' : action === 'reject' ? 'rejeitada' : 'resgatada'} com sucesso`,
      reward: data
    })
  } catch (error: any) {
    console.error('Erro ao atualizar recompensa:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}








