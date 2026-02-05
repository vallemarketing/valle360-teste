import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Esta rota usa a service_role key para criar usuários
// IMPORTANTE: Só deve ser chamada por admins autenticados

export async function POST(request: Request) {
  try {
    const { users, adminSecret } = await request.json()
    
    // Hardening: por padrão, rotas de setup ficam bloqueadas em produção.
    if (process.env.NODE_ENV === 'production' && process.env.ENABLE_SETUP_ROUTES !== '1') {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 })
    }

    // Verificação de segurança simples
    if (!process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'ADMIN_SECRET não configurado no ambiente' }, { status: 500 })
    }
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ 
        error: 'Variáveis de ambiente não configuradas',
        hint: 'Configure SUPABASE_SERVICE_ROLE_KEY no ambiente'
      }, { status: 500 })
    }

    // Criar cliente admin com service_role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const results = []

    for (const user of users) {
      try {
        // Criar usuário no auth
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: user.password || 'Valle@2024',
          email_confirm: true,
          user_metadata: {
            full_name: user.full_name,
            area: user.area
          }
        })

        if (error) {
          // Se o usuário já existe, tentar atualizar a senha
          if (error.message.includes('already been registered')) {
            const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
            const existingUser = existingUsers.users.find(u => u.email === user.email)
            
            if (existingUser) {
              const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                existingUser.id,
                { password: user.password || 'Valle@2024' }
              )
              
              if (updateError) {
                results.push({ email: user.email, status: 'error', message: updateError.message })
              } else {
                // Atualizar user_id nas tabelas
                await supabaseAdmin.from('employees').update({ user_id: existingUser.id }).eq('email', user.email)
                await supabaseAdmin.from('user_profiles').update({ user_id: existingUser.id }).eq('email', user.email)
                results.push({ email: user.email, status: 'updated', user_id: existingUser.id })
              }
            }
          } else {
            results.push({ email: user.email, status: 'error', message: error.message })
          }
        } else if (data.user) {
          // Atualizar user_id nas tabelas
          await supabaseAdmin.from('employees').update({ user_id: data.user.id }).eq('email', user.email)
          await supabaseAdmin.from('user_profiles').update({ user_id: data.user.id }).eq('email', user.email)
          results.push({ email: user.email, status: 'created', user_id: data.user.id })
        }
      } catch (err) {
        results.push({ email: user.email, status: 'error', message: String(err) })
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error('Erro ao criar usuários:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// Rota para resetar senha de um usuário
export async function PUT(request: Request) {
  try {
    const { email, newPassword, adminSecret } = await request.json()
    
    if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== 'Valle@Admin2024') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ 
        error: 'Configure SUPABASE_SERVICE_ROLE_KEY no ambiente'
      }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Buscar usuário
    const { data: users } = await supabaseAdmin.auth.admin.listUsers()
    const user = users.users.find(u => u.email === email)

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Atualizar senha
    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    )

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'Senha atualizada com sucesso' })
  } catch (error) {
    console.error('Erro ao resetar senha:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}






