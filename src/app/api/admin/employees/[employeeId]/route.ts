import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

export const dynamic = 'force-dynamic';

// ============================================
// FUNÇÃO: Deletar email do cPanel
// ============================================
async function deleteCpanelEmail(email: string): Promise<{ success: boolean; message: string }> {
  const cpanelUser = process.env.CPANEL_USER;
  const cpanelPassword = process.env.CPANEL_PASSWORD;
  const cpanelDomain = process.env.CPANEL_DOMAIN;

  console.log(`🗑️ Tentando deletar email do cPanel: ${email}`);
  console.log(`📋 cPanel configurado: ${!!cpanelUser && !!cpanelPassword && !!cpanelDomain}`);

  if (!cpanelUser || !cpanelPassword || !cpanelDomain) {
    console.warn('⚠️ Credenciais do cPanel não configuradas');
    return { success: false, message: 'cPanel não configurado' };
  }

  try {
    const [username, domain] = email.split('@');
    if (!username || !domain) {
      return { success: false, message: 'Email inválido' };
    }

    const basicAuth = Buffer.from(`${cpanelUser}:${cpanelPassword}`).toString('base64');
    
    // Normalizar URL do cPanel
    let baseUrl = cpanelDomain.trim();
    if (!/^https?:\/\//i.test(baseUrl)) {
      baseUrl = `https://${baseUrl}`;
    }
    baseUrl = baseUrl.replace(/\/+$/, '');

    // Garantir que tem a porta 2083
    if (!baseUrl.includes(':2083') && !baseUrl.includes(':2087')) {
      baseUrl = baseUrl.replace(/:\d+$/, '') + ':2083';
    }

    const apiUrl = `${baseUrl}/execute/Email/delete_pop?email=${encodeURIComponent(username)}&domain=${encodeURIComponent(domain)}`;

    console.log(`🔗 URL cPanel: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
      }
    });

    const contentType = response.headers.get('content-type') || '';
    const responseText = await response.text();
    
    console.log(`📥 cPanel response status: ${response.status}`);
    console.log(`📥 cPanel response type: ${contentType}`);
    console.log(`📥 cPanel response: ${responseText.substring(0, 500)}`);

    // Se não for JSON, retorna erro
    if (!contentType.includes('application/json')) {
      console.error('❌ cPanel retornou HTML (provavelmente URL incorreta ou auth falhou)');
      return { success: false, message: 'cPanel retornou HTML - verifique CPANEL_DOMAIN' };
    }

    const data = JSON.parse(responseText);

    if (data.status === 1 || data.result?.status === 1) {
      console.log(`✅ Email deletado do cPanel: ${email}`);
      return { success: true, message: 'Email deletado do cPanel' };
    } else {
      const errors = data.errors || data.result?.errors || [];
      const errorMsg = Array.isArray(errors) ? errors.join(', ') : String(errors);
      
      // Se o email não existe, considerar como sucesso
      if (errorMsg.toLowerCase().includes('does not exist') || 
          errorMsg.toLowerCase().includes('not found')) {
        console.log(`ℹ️ Email já não existe no cPanel: ${email}`);
        return { success: true, message: 'Email não existe no cPanel' };
      }

      console.error('❌ Erro ao deletar email do cPanel:', errorMsg);
      return { success: false, message: errorMsg || 'Erro desconhecido' };
    }
  } catch (error: any) {
    console.error('❌ Exceção ao deletar email do cPanel:', error);
    return { success: false, message: error.message };
  }
}

// ============================================
// GET - Obter detalhes de um colaborador
// ============================================
export async function GET(
  request: NextRequest,
  { params }: { params: { employeeId: string } }
) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  const { employeeId } = params;
  const db = getSupabaseAdmin();

  try {
    let employee: any = null;
    const { data: byUserId } = await db
      .from('employees')
      .select('*')
      .eq('user_id', employeeId)
      .single();
    if (byUserId) {
      employee = byUserId;
    } else {
      const { data: byId } = await db
        .from('employees')
        .select('*')
        .eq('id', employeeId)
        .single();
      if (byId) employee = byId;
    }

    if (!employee) {
      return NextResponse.json({ error: 'Colaborador não encontrado' }, { status: 404 });
    }

    const userId = employee.user_id;
    const { data: user } = await db
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    const { data: profile } = await db
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    return NextResponse.json({ employee, user, profile });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================
// DELETE - Excluir colaborador COMPLETAMENTE
// ============================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: { employeeId: string } }
) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  const { employeeId } = params;
  const db = getSupabaseAdmin();

  console.log(`\n${'='.repeat(50)}`);
  console.log(`🗑️ INICIANDO EXCLUSÃO DO COLABORADOR: ${employeeId}`);
  console.log(`${'='.repeat(50)}\n`);

  const deletionLog: string[] = [];
  let userEmail = '';

  try {
    // 1. BUSCAR DADOS DO COLABORADOR
    console.log('📋 1. Buscando dados do colaborador...');
    
    const { data: employee, error: empError } = await db
      .from('employees')
      .select('id, user_id, first_name, last_name')
      .eq('user_id', employeeId)
      .single();

    if (empError || !employee) {
      // Tentar buscar por id em vez de user_id
      const { data: emp2 } = await db
        .from('employees')
        .select('id, user_id, first_name, last_name')
        .eq('id', employeeId)
        .single();
      
      if (!emp2) {
        console.log('❌ Colaborador não encontrado');
        return NextResponse.json({ error: 'Colaborador não encontrado' }, { status: 404 });
      }
    }

    const userId = employee?.user_id || employeeId;
    deletionLog.push(`Colaborador encontrado: ${employee?.first_name} ${employee?.last_name}`);

    // 2. BUSCAR EMAIL DO USUÁRIO (de múltiplas fontes)
    console.log('📧 2. Buscando email do usuário...');
    
    // Tentar da tabela users
    const { data: userData } = await db
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();
    
    if (userData?.email) {
      userEmail = userData.email;
      console.log(`   Email encontrado (users): ${userEmail}`);
    }
    
    // Se não encontrou, tentar do user_profiles
    if (!userEmail) {
      const { data: profileData } = await db
        .from('user_profiles')
        .select('email')
        .eq('user_id', userId)
        .single();
      
      if (profileData?.email) {
        userEmail = profileData.email;
        console.log(`   Email encontrado (user_profiles): ${userEmail}`);
      }
    }

    // Se não encontrou, tentar do auth
    if (!userEmail) {
      try {
        const { data: authUser } = await db.auth.admin.getUserById(userId);
        if (authUser?.user?.email) {
          userEmail = authUser.user.email;
          console.log(`   Email encontrado (auth): ${userEmail}`);
        }
      } catch (e) {
        console.log('   Não foi possível buscar do auth');
      }
    }

    deletionLog.push(`Email: ${userEmail || 'não encontrado'}`);

    // 3. DELETAR EMAIL DO CPANEL
    if (userEmail && userEmail.includes('@')) {
      console.log('🗑️ 3. Deletando email do cPanel...');
      const cpanelResult = await deleteCpanelEmail(userEmail);
      deletionLog.push(`cPanel: ${cpanelResult.message}`);
      console.log(`   Resultado: ${cpanelResult.message}`);
    } else {
      console.log('⚠️ 3. Email não encontrado, pulando cPanel');
      deletionLog.push('cPanel: pulado (sem email)');
    }

    // 4. DELETAR REGISTROS DO BANCO (em ordem de dependência)
    console.log('🗃️ 4. Deletando registros do banco...');

    // 4.1 Deletar atribuições de clientes
    const { error: assignError } = await db
      .from('employee_client_assignments')
      .delete()
      .eq('employee_id', userId);
    
    if (!assignError) {
      deletionLog.push('employee_client_assignments: deletado');
      console.log('   ✅ employee_client_assignments deletado');
    }

    // 4.2 Deletar mensagens (opcional - pode manter histórico)
    // await db.from('messages').delete().eq('sender_id', userId);

    // 4.3 Deletar da tabela employees
    const { error: empDelError } = await db
      .from('employees')
      .delete()
      .eq('user_id', userId);
    
    if (!empDelError) {
      deletionLog.push('employees: deletado');
      console.log('   ✅ employees deletado');
    } else {
      console.error('   ❌ Erro ao deletar employees:', empDelError);
    }

    // 4.4 Deletar do user_profiles
    const { error: profileError } = await db
      .from('user_profiles')
      .delete()
      .eq('user_id', userId);
    
    if (!profileError) {
      deletionLog.push('user_profiles: deletado');
      console.log('   ✅ user_profiles deletado');
    } else {
      console.error('   ❌ Erro ao deletar user_profiles:', profileError);
    }

    // 4.5 Deletar da tabela users (se existir)
    const { error: usersError } = await db
      .from('users')
      .delete()
      .eq('id', userId);
    
    if (!usersError) {
      deletionLog.push('users: deletado');
      console.log('   ✅ users deletado');
    } else {
      console.error('   ❌ Erro ao deletar users:', usersError);
    }

    // 5. DELETAR DO SUPABASE AUTH (hard delete)
    console.log('🔐 5. Deletando do Supabase Auth...');
    try {
      const { error: authError } = await db.auth.admin.deleteUser(userId);
      if (!authError) {
        deletionLog.push('auth.users: deletado');
        console.log('   ✅ auth.users deletado');
      } else {
        deletionLog.push(`auth.users: erro - ${authError.message}`);
        console.error('   ❌ Erro ao deletar auth:', authError.message);
      }
    } catch (authErr: any) {
      deletionLog.push(`auth.users: exceção - ${authErr.message}`);
      console.error('   ❌ Exceção ao deletar auth:', authErr.message);
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log(`✅ EXCLUSÃO FINALIZADA`);
    console.log(`${'='.repeat(50)}\n`);

    return NextResponse.json({
      success: true,
      message: 'Colaborador excluído completamente',
      deleted: {
        id: userId,
        name: `${employee?.first_name || ''} ${employee?.last_name || ''}`.trim(),
        email: userEmail,
      },
      log: deletionLog,
    });

  } catch (error: any) {
    console.error('❌ ERRO FATAL na exclusão:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      log: deletionLog,
    }, { status: 500 });
  }
}

// ============================================
// PATCH - Atualizar dados do colaborador
// ============================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: { employeeId: string } }
) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  const { employeeId } = params;
  const db = getSupabaseAdmin();
  const body = await request.json();

  try {
    let employee: any = null;
    const { data: byUserId } = await db
      .from('employees')
      .select('id,user_id')
      .eq('user_id', employeeId)
      .single();
    if (byUserId) {
      employee = byUserId;
    } else {
      const { data: byId } = await db
        .from('employees')
        .select('id,user_id')
        .eq('id', employeeId)
        .single();
      if (byId) employee = byId;
    }

    if (!employee?.user_id) {
      return NextResponse.json({ error: 'Colaborador não encontrado' }, { status: 404 });
    }

    const userId = employee.user_id;

    if (
      body.first_name || body.last_name || body.areas || body.whatsapp ||
      body.personal_email || body.phone || body.cpf || body.birth_date ||
      body.hierarchy_level || body.salary !== undefined || body.work_schedule ||
      body.pix_key || body.pix_type || body.bank_name || body.bank_agency ||
      body.bank_account || body.bank_account_type ||
      body.emergency_contact_name || body.emergency_contact_phone ||
      body.emergency_contact_relation || body.is_active !== undefined
    ) {
      await db
        .from('employees')
        .update({
          ...(body.first_name && { first_name: body.first_name }),
          ...(body.last_name && { last_name: body.last_name }),
          ...(body.areas && { areas: body.areas }),
          ...(body.whatsapp && { whatsapp: body.whatsapp }),
          ...(body.personal_email && { personal_email: body.personal_email }),
          ...(body.phone && { phone: body.phone }),
          ...(body.cpf && { cpf: body.cpf }),
          ...(body.birth_date && { birth_date: body.birth_date }),
          ...(body.hierarchy_level && { hierarchy_level: body.hierarchy_level }),
          ...(body.salary !== undefined && { salary: body.salary }),
          ...(body.work_schedule && { work_schedule: body.work_schedule }),
          ...(body.pix_key && { pix_key: body.pix_key }),
          ...(body.pix_type && { pix_type: body.pix_type }),
          ...(body.bank_name && { bank_name: body.bank_name }),
          ...(body.bank_agency && { bank_agency: body.bank_agency }),
          ...(body.bank_account && { bank_account: body.bank_account }),
          ...(body.bank_account_type && { bank_account_type: body.bank_account_type }),
          ...(body.emergency_contact_name && { emergency_contact_name: body.emergency_contact_name }),
          ...(body.emergency_contact_phone && { emergency_contact_phone: body.emergency_contact_phone }),
          ...(body.emergency_contact_relation && { emergency_contact_relation: body.emergency_contact_relation }),
          ...(body.is_active !== undefined && { is_active: body.is_active }),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
    }

    let mergedMetadata: Record<string, any> | null = null;
    if (body.personal_email) {
      const { data: metaRow } = await db
        .from('user_profiles')
        .select('metadata')
        .eq('user_id', userId)
        .single();
      mergedMetadata = { ...(metaRow?.metadata || {}), personal_email: body.personal_email };
    }

    if (body.full_name || body.phone || body.avatar_url !== undefined || mergedMetadata) {
      await db
        .from('user_profiles')
        .update({
          ...(body.full_name && { full_name: body.full_name }),
          ...(body.phone && { phone: body.phone }),
          ...(body.avatar_url !== undefined && { avatar_url: body.avatar_url }),
          ...(mergedMetadata ? { metadata: mergedMetadata } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
    }

    if (body.full_name || body.phone) {
      await db
        .from('users')
        .update({
          ...(body.full_name && { full_name: body.full_name, name: body.full_name }),
          ...(body.phone && { phone: body.phone }),
          ...(body.account_status && { account_status: body.account_status }),
        })
        .eq('id', userId);
    }

    if (body.password) {
      await db.auth.admin.updateUserById(userId, { password: body.password });
    }

    return NextResponse.json({ success: true, message: 'Colaborador atualizado' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
