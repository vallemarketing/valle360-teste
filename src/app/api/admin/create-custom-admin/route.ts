import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

/**
 * POST /api/admin/create-custom-admin
 * Cria um admin com email, senha e role personalizados
 * Usa Admin API para bypassar validação de senha fraca
 */
export async function POST(request: NextRequest) {
  try {
    // Hardening: por padrão, rotas de setup ficam bloqueadas em produção.
    if (process.env.NODE_ENV === 'production' && process.env.ENABLE_SETUP_ROUTES !== '1') {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    const body = await request.json();
    const { email, password, role = 'super_admin', full_name } = body;

    // Validações
    if (!email || !password) {
      return NextResponse.json(
        { error: 'email e password são obrigatórios' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 8 caracteres' },
        { status: 400 }
      );
    }

    // Usar Admin API (bypassa validação de senha fraca)
    const supabaseAdmin = getSupabaseAdmin();

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role,
        full_name: full_name || email.split('@')[0],
        user_type: role === 'super_admin' ? 'super_admin' : 'admin',
      },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData.user.id;

    // Criar na tabela users
    await supabaseAdmin.from('users').upsert({
      id: userId,
      email,
      full_name: full_name || email.split('@')[0],
      name: full_name || email.split('@')[0],
      role,
      user_type: role === 'super_admin' ? 'super_admin' : 'admin',
      account_status: 'active',
      is_active: true,
      email_verified: true,
      created_at: new Date().toISOString(),
    });

    // Criar na tabela user_profiles
    await supabaseAdmin.from('user_profiles').upsert({
      id: userId,
      user_id: userId,
      email,
      full_name: full_name || email.split('@')[0],
      user_type: role === 'super_admin' ? 'super_admin' : 'admin',
      role,
      is_active: true,
    });

    return NextResponse.json({
      success: true,
      message: `${role} criado com sucesso!`,
      credentials: {
        email,
        password,
        loginUrl: role === 'super_admin' ? '/admin/login' : '/login',
      },
      user: authData.user,
    });
  } catch (error: any) {
    console.error('Erro ao criar admin:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
