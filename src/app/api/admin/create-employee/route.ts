import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin'
import { emitEvent, markEventError, markEventProcessed } from '@/lib/admin/eventBus'
import { handleEvent } from '@/lib/admin/eventHandlers'

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabaseAuth = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: sessionAuth } = await supabaseAuth.auth.getUser()
    const actorUserId = sessionAuth.user?.id
    if (!actorUserId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Somente admin pode criar colaboradores (hub)
    const { data: isAdmin, error: isAdminError } = await supabaseAuth.rpc('is_admin')
    if (isAdminError || !isAdmin) {
      return NextResponse.json({ error: 'Acesso negado (admin)' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      nome, 
      sobrenome, 
      email, 
      emailPessoal,
      telefone,
      senha,
      areas,
      dataNascimento,
      contatoEmergencia,
      telefoneEmergencia,
      chavePix,
      fotoUrl,
      nivelHierarquico
    } = body

    // Service role (bypass RLS)
    const supabaseAdmin = getSupabaseAdmin()

    // 1. Criar usuário no auth.users usando Admin API
    const { data: createdAuth, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: {
        full_name: `${nome} ${sobrenome}`,
        user_type: 'employee',
        role: 'employee'
      }
    })

    if (authError) {
      console.error('Erro ao criar no auth:', authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const userId = createdAuth.user.id

    // 2. Criar na tabela users (com Service Role bypassa RLS)
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        email,
        full_name: `${nome} ${sobrenome}`,
        name: `${nome} ${sobrenome}`,
        role: 'employee',
        user_type: 'employee',
        phone: telefone || null,
        account_status: 'active',
        created_by: actorUserId,
        is_active: true,
        email_verified: true,
        two_factor_enabled: false,
        last_login_at: null
      })
      .select()
      .single()

    if (userError) {
      console.error('Erro ao criar na tabela users:', userError)
      // Se falhar, deletar o usuário do auth
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: userError.message }, { status: 400 })
    }

    // 3. Criar na tabela employees
    const employeePayload: any = {
      user_id: userId,
      full_name: `${nome} ${sobrenome}`,
      email,
      personal_email: emailPessoal || null,
      phone: telefone,
      avatar: fotoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
      department: areas[0] || 'Geral',
      position: nivelHierarquico === 'lider' ? 'Líder' : 'Colaborador',
      area_of_expertise: areas.join(', '),
      hire_date: new Date().toISOString().split('T')[0],
      birth_date: dataNascimento || null,
      emergency_contact: contatoEmergencia || null,
      emergency_phone: telefoneEmergencia || null,
      pix_key: chavePix || null,
      is_active: true,
      // compat (telas antigas)
      first_name: nome,
      last_name: sobrenome,
      whatsapp: telefone || null,
      admission_date: new Date().toISOString().split('T')[0],
      areas: Array.isArray(areas) ? areas : [],
      photo_url: fotoUrl || null
    }

    let employeeData: any = null
    let employeeError: any = null
    let usedFallback = false

    {
      const insertResult = await supabaseAdmin
        .from('employees')
        .insert(employeePayload)
        .select()
        .single()

      employeeData = insertResult.data
      employeeError = insertResult.error
    }

    if (employeeError && String(employeeError.message || '').toLowerCase().includes('personal_email')) {
      // fallback para schemas sem personal_email
      const { personal_email, ...fallbackPayload } = employeePayload
      const fallbackResult = await supabaseAdmin
        .from('employees')
        .insert(fallbackPayload)
        .select()
        .single()

      employeeData = fallbackResult.data
      employeeError = fallbackResult.error
      usedFallback = true
    }

    if (employeeError) {
      console.error('Erro ao criar employee:', employeeError)
      // Rollback: deletar users e auth
      await supabaseAdmin.from('users').delete().eq('id', userId)
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: employeeError.message }, { status: 400 })
    }

    // 4. Criar permissões básicas
    const permissoesBasicas = [
      { name: 'dashboard', description: 'Acesso ao dashboard' },
      { name: 'kanban', description: 'Acesso ao Kanban' },
      { name: 'messages', description: 'Sistema de mensagens' },
      { name: 'files', description: 'Gerenciador de arquivos' }
    ]

    for (const permissao of permissoesBasicas) {
      await supabaseAdmin.from('employee_permissions').insert({
        employee_id: employeeData.id,
        permission_name: permissao.name,
        permission_description: permissao.description,
        is_active: true
      })
    }

    // 5. user_profiles (hub) - garantir
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .upsert({
        id: userId,
        user_id: userId,
        email,
        full_name: `${nome} ${sobrenome}`,
        user_type: 'employee',
        role: 'employee',
        is_active: true,
        avatar_url: fotoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
      })
      .select()
      .single()

    if (profileError) {
      console.error('❌ Erro ao criar user_profile:', profileError)
      // Rollback completo
      await supabaseAdmin.from('employee_permissions').delete().eq('employee_id', employeeData.id)
      await supabaseAdmin.from('employees').delete().eq('id', employeeData.id)
      await supabaseAdmin.from('users').delete().eq('id', userId)
      await supabaseAdmin.auth.admin.deleteUser(userId)
      
      return NextResponse.json({ 
        error: 'Falha ao criar perfil de usuário: ' + profileError.message,
        details: profileError
      }, { status: 400 })
    }

    console.log('✅ user_profile criado com sucesso:', profileData)

    // 6. Event bus: employee.created
    const event = await emitEvent({
      eventType: 'employee.created',
      entityType: 'employee',
      entityId: employeeData.id,
      actorUserId,
      payload: { employee_id: employeeData.id, user_id: userId, email }
    }, supabaseAdmin)

    const handled = await handleEvent(event)
    if (!handled.ok) {
      await markEventError(event.id, handled.error, supabaseAdmin)
    } else {
      await markEventProcessed(event.id, supabaseAdmin)
    }

    console.log('✅ Colaborador criado com sucesso:', email)

    return NextResponse.json({
      success: true,
      userId,
      employeeId: employeeData.id,
      email,
      emailPessoal,
      event_status: handled.ok ? 'processed' : 'error'
    })

  } catch (error: any) {
    console.error('Erro geral ao criar colaborador:', error)
    return NextResponse.json({
      error: error.message || 'Erro desconhecido'
    }, { status: 500 })
  }
}



