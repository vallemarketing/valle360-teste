import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
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

    // Require auth (leaderboard is internal)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = getSupabaseAdmin()

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const period = searchParams.get('period') || 'alltime' // alltime, month, week

    // Ranking real via view (best-effort)
    const { data, error } = await admin
      .from('ranking_ops_view')
      .select('user_id, full_name, avatar, total_points, rank_position')
      .order('rank_position', { ascending: true })
      .limit(limit)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
    }

    // Transform data
    const leaderboard = (data || []).map((item: any) => ({
      rank: Number(item.rank_position),
      user_id: item.user_id,
      name: item.full_name || 'Unknown',
      total_points: Number(item.total_points || 0),
    }))

    return NextResponse.json({
      period,
      leaderboard,
      updated_at: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}
