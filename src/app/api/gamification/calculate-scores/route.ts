import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { calculateAllScores } from '@/lib/gamification/scoreCalculator'

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { employee_id, task_metrics, quality_metrics, collaboration_metrics, wellbeing_metrics } = body

    // Only super_admin or the employee themselves can calculate scores
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('user_id', user.id)
      .single()

    if (profile?.user_type !== 'super_admin' && employee_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Calculate scores
    const scores = calculateAllScores(
      task_metrics,
      quality_metrics,
      collaboration_metrics,
      wellbeing_metrics
    )

    // Update database
    const { data, error } = await supabase
      .from('employee_gamification')
      .upsert({
        employee_id: employee_id || user.id,
        productivity_score: scores.productivity_score,
        quality_score: scores.quality_score,
        collaboration_score: scores.collaboration_score,
        wellbeing_score: scores.wellbeing_score,
        level: scores.level,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'employee_id'
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update scores' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      scores,
      data
    })
  } catch (error) {
    console.error('Error calculating scores:', error)
    return NextResponse.json(
      { error: 'Failed to calculate scores' },
      { status: 500 }
    )
  }
}


