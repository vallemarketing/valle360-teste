import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  try {
    // Hardening: rotas de setup ficam bloqueadas por padrão (em qualquer ambiente).
    // Para habilitar, defina ENABLE_SETUP_ROUTES=1.
    if (process.env.ENABLE_SETUP_ROUTES !== '1') {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 })
    }

    // Criar cliente Supabase com Service Role (admin powers)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const email = process.env.SETUP_ADMIN_EMAIL
    const password = process.env.SETUP_ADMIN_PASSWORD
    const fullName = process.env.SETUP_ADMIN_FULL_NAME || 'Super Admin'

    if (!email || !password) {
      return NextResponse.json(
        { error: 'SETUP_ADMIN_EMAIL e SETUP_ADMIN_PASSWORD são obrigatórios quando ENABLE_SETUP_ROUTES=1' },
        { status: 400 }
      )
    }

    // 1) Encontrar usuário existente por email (idempotência)
    let resolvedUserId: string | null = null
    let authUser: any = null

    try {
      // Busca simples (primeira página) — suficiente para ambientes pequenos.
      // Se crescer, dá para paginar.
      const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 200
      })
      if (!listError) {
        const found = (listData?.users || []).find((u: any) => String(u?.email || '').toLowerCase() === email.toLowerCase())
        if (found?.id) {
          resolvedUserId = String(found.id)
          authUser = found
        }
      }
    } catch {
      // ignore (best-effort)
    }

    // 2) Se já existe, atualiza senha/metadata. Senão, cria usuário novo.
    if (resolvedUserId) {
      const { data: updated, error: updErr } = await supabaseAdmin.auth.admin.updateUserById(resolvedUserId, {
        password,
        email_confirm: true,
        user_metadata: {
          full_name: 'Guilherme Valle',
          role: 'super_admin'
        },
        app_metadata: {
          provider: 'email',
          providers: ['email'],
          role: 'super_admin'
        }
      })

      if (updErr) {
        console.error('Erro ao atualizar usuário auth:', updErr)
        return NextResponse.json({ error: updErr.message }, { status: 400 })
      }

      authUser = updated.user
    } else {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role: 'super_admin'
        },
        app_metadata: {
          provider: 'email',
          providers: ['email'],
          role: 'super_admin'
        }
      })

      if (authError) {
        console.error('Erro ao criar usuário auth:', authError)
        return NextResponse.json({ error: authError.message }, { status: 400 })
      }

      resolvedUserId = authData.user.id
      authUser = authData.user
    }

    if (!resolvedUserId) {
      return NextResponse.json({ error: 'Não foi possível resolver/criar o usuário admin' }, { status: 500 })
    }

    console.log('✅ Usuário admin pronto no auth.users:', resolvedUserId)

    // 3. Atualizar user_profiles
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .upsert({
        id: resolvedUserId,
        user_id: resolvedUserId,
        full_name: fullName,
        email,
        role: 'super_admin',
        user_type: 'super_admin',
        is_active: true,
        phone: '(00) 00000-0000',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('Erro ao criar perfil:', profileError)
    } else {
      console.log('✅ Perfil criado/atualizado')
    }

    // 4. Atualizar users
    const { error: usersError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: resolvedUserId,
        email,
        full_name: fullName,
        role: 'super_admin',
        is_active: true,
        email_verified: true,
        two_factor_enabled: false,
        last_login_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (usersError) {
      console.error('Erro ao criar user:', usersError)
    } else {
      console.log('✅ User criado/atualizado')
    }

    // 5. Verificar se employee existe
    const { data: existingEmployee } = await supabaseAdmin
      .from('employees')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    let employeeId = existingEmployee?.id

    if (!employeeId) {
      // Criar employee se não existir
      const { data: newEmployee, error: employeeError } = await supabaseAdmin
        .from('employees')
        .insert({
          user_id: resolvedUserId,
          full_name: 'Guilherme Valle',
          email,
          phone: '(11) 99999-9999',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=guilherme',
          department: 'Administração',
          position: 'CEO',
          area_of_expertise: 'Gestão',
          hire_date: '2020-01-01',
          birth_date: '1985-01-01',
          emergency_contact: 'Contato Emergência',
          emergency_phone: '(11) 98888-8888',
          pix_key: email,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (employeeError) {
        console.error('Erro ao criar employee:', employeeError)
      } else {
        employeeId = newEmployee.id
        console.log('✅ Employee criado:', employeeId)
      }
    }

    return NextResponse.json({
      success: true,
      message: '✅ Admin criado/atualizado com sucesso!',
      user: {
        id: resolvedUserId,
        email: (authUser as any)?.email || email,
        role: 'super_admin'
      },
      credentials: { email, loginUrl: '/login', passwordConfigured: true }
    })

  } catch (error: any) {
    console.error('Erro geral:', error)
    return NextResponse.json({
      error: error.message || 'Erro desconhecido'
    }, { status: 500 })
  }
}



