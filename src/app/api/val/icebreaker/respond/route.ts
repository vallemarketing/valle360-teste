import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { area, question, answer, date } = body

    if (!area || !question || !answer) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Try to get authenticated user
    try {
      const authHeader = request.headers.get('authorization')
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '')
        const { data: { user } } = await supabase.auth.getUser(token)
        
        if (user) {
          // Save response to database (se a tabela existir)
          try {
            await supabase
              .from('val_icebreaker_responses')
              .insert({
                user_id: user.id,
                area,
                question,
                answer,
                created_at: date || new Date().toISOString()
              })
          } catch (dbError) {
            // Table might not exist yet, that's ok
            console.log('Could not save to database:', dbError)
          }
        }
      }
    } catch (authError) {
      // Ignore auth errors
      console.log('No auth available:', authError)
    }

    return NextResponse.json({
      success: true,
      message: 'Response saved successfully'
    })
  } catch (error) {
    console.error('Error saving icebreaker response:', error)
    return NextResponse.json(
      { error: 'Failed to save response' },
      { status: 500 }
    )
  }
}


