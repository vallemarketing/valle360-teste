import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PREDEFINED_BADGES, BADGE_CATEGORIES, checkBadgeEligibility, getUpcomingBadges } from '@/lib/gamification/badges'

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// GET - Listar badges do colaborador ou todas as badges disponíveis
export async function GET(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const listAll = searchParams.get('listAll') === 'true'

    // Retorna todas as badges disponíveis no sistema
    if (listAll) {
      return NextResponse.json({
        success: true,
        badges: PREDEFINED_BADGES,
        categories: BADGE_CATEGORIES,
        totalBadges: PREDEFINED_BADGES.length
      })
    }

    if (!employeeId) {
      return NextResponse.json(
        { success: false, error: 'employeeId é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar badges conquistadas pelo colaborador
    const { data: earnedBadges, error: badgesError } = await supabase
      .from('employee_badges')
      .select('*')
      .eq('employee_id', employeeId)
      .order('earned_at', { ascending: false })

    if (badgesError) throw badgesError

    // Buscar métricas do colaborador
    const { data: metrics, error: metricsError } = await supabase
      .from('employee_metrics')
      .select('*')
      .eq('employee_id', employeeId)

    if (metricsError) throw metricsError

    // Converter métricas para formato de objeto
    const userMetrics: Record<string, number> = {}
    metrics?.forEach(m => {
      userMetrics[m.metric_name] = m.metric_value
    })

    // Calcular badges que podem ser conquistadas
    const earnedBadgeIds = earnedBadges?.map(b => b.badge_id) || []
    const availableBadges = PREDEFINED_BADGES.filter(b => !earnedBadgeIds.includes(b.id))
    const upcomingBadges = getUpcomingBadges(userMetrics, 10)

    // Calcular total de pontos
    const totalPoints = earnedBadges?.reduce((sum, b) => sum + (b.points_awarded || 0), 0) || 0

    return NextResponse.json({
      success: true,
      earnedBadges: earnedBadges || [],
      availableBadges,
      upcomingBadges,
      totalPoints,
      totalEarned: earnedBadges?.length || 0,
      totalAvailable: PREDEFINED_BADGES.length,
      metrics: userMetrics
    })
  } catch (error: any) {
    console.error('Erro ao buscar badges:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST - Verificar e conceder badges automaticamente
export async function POST(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    const body = await request.json()
    const { employeeId, metricName, metricValue, incrementBy } = body

    if (!employeeId) {
      return NextResponse.json(
        { success: false, error: 'employeeId é obrigatório' },
        { status: 400 }
      )
    }

    // Atualizar métrica se fornecida
    if (metricName) {
      const { data: existingMetric } = await supabase
        .from('employee_metrics')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('metric_name', metricName)
        .eq('period', 'alltime')
        .single()

      if (existingMetric) {
        const newValue = incrementBy 
          ? existingMetric.metric_value + incrementBy 
          : metricValue || existingMetric.metric_value

        await supabase
          .from('employee_metrics')
          .update({ 
            metric_value: newValue,
            last_updated: new Date().toISOString()
          })
          .eq('id', existingMetric.id)
      } else {
        await supabase
          .from('employee_metrics')
          .insert({
            employee_id: employeeId,
            metric_name: metricName,
            metric_value: metricValue || incrementBy || 1,
            period: 'alltime'
          })
      }
    }

    // Buscar todas as métricas atualizadas
    const { data: metrics } = await supabase
      .from('employee_metrics')
      .select('*')
      .eq('employee_id', employeeId)

    const userMetrics: Record<string, number> = {}
    metrics?.forEach(m => {
      userMetrics[m.metric_name] = m.metric_value
    })

    // Buscar badges já conquistadas
    const { data: earnedBadges } = await supabase
      .from('employee_badges')
      .select('badge_id')
      .eq('employee_id', employeeId)

    const earnedBadgeIds = earnedBadges?.map(b => b.badge_id) || []

    // Verificar novas badges elegíveis
    const newBadges: typeof PREDEFINED_BADGES = []
    
    for (const badge of PREDEFINED_BADGES) {
      if (earnedBadgeIds.includes(badge.id)) continue
      
      if (checkBadgeEligibility(badge, userMetrics)) {
        // Conceder badge
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

        if (!badgeError) {
          newBadges.push(badge)

          // Criar recompensas associadas
          const rewardsToInsert = badge.rewards.map(reward => ({
            employee_id: employeeId,
            badge_id: badge.id,
            badge_name: badge.name,
            reward_type: reward.type,
            reward_value: String(reward.value),
            reward_description: reward.description,
            status: reward.requiresHRApproval ? 'pending' : 'approved',
            expires_at: reward.type === 'time_off' 
              ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
              : null
          }))

          await supabase.from('employee_rewards').insert(rewardsToInsert)
        }
      }
    }

    return NextResponse.json({
      success: true,
      newBadgesEarned: newBadges,
      totalNewBadges: newBadges.length,
      message: newBadges.length > 0 
        ? `Parabéns! Você conquistou ${newBadges.length} nova(s) badge(s)!`
        : 'Métricas atualizadas. Continue assim!'
    })
  } catch (error: any) {
    console.error('Erro ao verificar badges:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}








