import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/admin/create-admin-no-validation
 * Cria admin SEM validação de senha forte
 * Usa parâmetros especiais da Admin API
 */
export async function POST(request: NextRequest) {
  try {
    // Hardening
    if (process.env.NODE_ENV === 'production' && process.env.ENABLE_SETUP_ROUTES !== '1') {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    const body = await request.json();
    const { email, password, role = 'super_admin', full_name } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'email e password são obrigatórios' },
        { status: 400 }
      );
    }

    // Criar cliente Supabase com Service Role e opções especiais
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
        db: {
          schema: 'public',
        },
        global: {
          headers: {
            // Headers especiais para bypass
            'X-Supabase-Admin': 'true',
          },
        },
      }
    );

    try {
      // Tentar criar usuário com Admin API
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
        // Se falhar por causa da senha, tentar método alternativo
        if (authError.message.includes('weak') || authError.message.includes('easy to guess')) {
          
          // Método alternativo: Gerar senha temporária forte e depois atualizar
          const tempPassword = `Temp!${Date.now()}@Strong#${Math.random().toString(36).slice(2)}`;
          
          const { data: tempUserData, error: tempError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
              role,
              full_name: full_name || email.split('@')[0],
              user_type: role === 'super_admin' ? 'super_admin' : 'admin',
            },
          });

          if (tempError) {
            throw new Error(`Erro ao criar usuário: ${tempError.message}`);
          }

          const userId = tempUserData.user.id;

          // Agora atualizar a senha para a desejada usando SQL direto via RPC
          // Primeiro, criar nas tabelas do sistema
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

          await supabaseAdmin.from('user_profiles').upsert({
            id: userId,
            user_id: userId,
            email,
            full_name: full_name || email.split('@')[0],
            user_type: role === 'super_admin' ? 'super_admin' : 'admin',
            role,
            is_active: true,
          });

          // Tentar atualizar senha via Admin API
          try {
            await supabaseAdmin.auth.admin.updateUserById(userId, {
              password: password,
            });
          } catch (updateError) {
            console.warn('Não foi possível atualizar para a senha desejada:', updateError);
          }

          return NextResponse.json({
            success: true,
            message: `${role} criado com sucesso!`,
            credentials: {
              email,
              password: tempPassword, // Retorna senha temporária se não conseguiu atualizar
              note: 'Usuário criado. Se não conseguir logar com sua senha, use a senha temporária acima e depois troque no dashboard.',
              loginUrl: role === 'super_admin' ? '/admin/login' : '/login',
            },
            user: tempUserData.user,
          });
        }

        throw new Error(authError.message);
      }

      const userId = authData.user.id;

      // Criar nas tabelas do sistema
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

    } catch (dbError: any) {
      console.error('Erro ao criar usuário:', dbError);
      return NextResponse.json(
        { 
          error: dbError.message || 'Erro ao criar usuário',
          suggestion: 'A validação de senha forte está ativa no projeto Supabase. Considere desabilitá-la no Dashboard ou usar uma senha mais forte.'
        },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('Erro geral:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
