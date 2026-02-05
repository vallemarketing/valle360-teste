import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: Request) {
  try {
    // Pegar o token do header de autorização
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Criar cliente Supabase com service role para bypass RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Criar cliente normal para verificar o token do usuário
    const supabaseClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    })

    // Verificar o usuário autenticado
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Usuário não autenticado',
        details: authError 
      }, { status: 401 })
    }

    // Buscar em auth.users (usando admin)
    const { data: authUser, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(user.id)

    // Buscar em users
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    // Buscar em user_profiles
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Buscar em employees
    const { data: employeeData, error: employeeError } = await supabaseAdmin
      .from('employees')
      .select('*')
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({
      success: true,
      userId: user.id,
      email: user.email,
      data: {
        auth_users: authUser || null,
        auth_error: authUserError?.message || null,
        users: userData || null,
        users_error: userError?.message || null,
        user_profiles: profileData || null,
        profiles_error: profileError?.message || null,
        employees: employeeData || null,
        employees_error: employeeError?.message || null
      }
    })

  } catch (error: any) {
    console.error('Erro no debug:', error)
    return NextResponse.json({ 
      error: 'Erro interno', 
      details: error.message 
    }, { status: 500 })
  }
}



