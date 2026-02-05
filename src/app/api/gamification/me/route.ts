import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getLevelInfo } from '@/lib/gamification/levels'
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin'

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
            },
        }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = getSupabaseAdmin()

    // Resolve employee_id (employees.id) from auth user
    const { data: employee, error: employeeError } = await admin
      .from('employees')
      .select('id, user_id, full_name, area_of_expertise')
      .eq('user_id', user.id)
      .maybeSingle()

    if (employeeError) {
      console.error('Employee lookup error:', employeeError)
    }

    const employeeId = employee?.id ? String(employee.id) : null

    // Load gamification scores (employee_gamification is the canonical table in this repo)
    const { data: gamificationData } = employeeId
      ? await admin.from('employee_gamification').select('*').eq('employee_id', employeeId).maybeSingle()
      : { data: null }

    const points = Number(gamificationData?.total_points || 0)
    const productivity = Number(gamificationData?.productivity_score || 0)
    const quality = Number(gamificationData?.quality_score || 0)
    const collaboration = Number(gamificationData?.collaboration_score || 0)
    const wellbeing = Number(gamificationData?.wellbeing_score || 0)

    // Level info (based on points)
    const levelInfo = getLevelInfo(points)

    // Achievements/badges: stored in employee_achievements (best-effort)
    const { data: achievements } = employeeId
      ? await admin
          .from('employee_achievements')
          .select('achievement_type, title, description, icon, points_awarded, earned_at')
          .eq('employee_id', employeeId)
          .order('earned_at', { ascending: false })
          .limit(50)
      : { data: [] as any[] }

    const badges = (achievements || []).map((a: any) => ({
      badge_id: a.achievement_type,
      title: a.title,
      description: a.description,
      icon: a.icon,
      points_awarded: a.points_awarded,
      earned_at: a.earned_at,
    }))

    // Rank (best-effort) via view
    let rank: number | null = null
    try {
      const { data: rankRow } = await admin
        .from('ranking_ops_view')
        .select('rank_position')
        .eq('user_id', user.id)
        .maybeSingle()
      rank = rankRow?.rank_position ? Number(rankRow.rank_position) : null
    } catch {
      rank = null
    }

    return NextResponse.json({
      employee_id: employeeId,
      employee_name: employee?.full_name || user.email || 'Colaborador',
      points,
      level: levelInfo.level,
      tier: levelInfo.tier,
      productivity_score: productivity,
      quality_score: quality,
      collaboration_score: collaboration,
      wellbeing_score: wellbeing,
      badges,
      rank,
      levelInfo
    })
  } catch (error) {
    console.error('Error fetching gamification data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch gamification data' },
      { status: 500 }
    )
  }
}
