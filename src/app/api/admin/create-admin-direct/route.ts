import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';
import { createHash } from 'crypto';

/**
 * POST /api/admin/create-admin-direct
 * Cria admin DIRETO no banco, sem validação de senha
 * ATENÇÃO: Usa SQL direto - bypass total da API Supabase
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

    const supabaseAdmin = getSupabaseAdmin();
    
    // Gerar ID único
    const userId = crypto.randomUUID();
    
    // Hash da senha (bcrypt-like para Supabase)
    // Nota: Supabase usa bcrypt, mas para desenvolvimento podemos usar SHA256
    const passwordHash = createHash('sha256').update(password).digest('hex');

    try {
      // 1. Inserir diretamente na tabela auth.users via RPC ou SQL
      // Como não temos acesso direto ao auth.users, vamos usar a Admin API com bypass
      const { data: authData, error: authError } = await supabaseAdmin.rpc('create_user_bypass_validation', {
        p_email: email,
        p_password: password,
        p_role: role,
      });

      if (authError) {
        // Se RPC não existir, criar usando método alternativo
        console.warn('RPC não disponível, tentando Admin API com OPTIONS...');
        
        // Tentar com admin.createUser mas forçando bypass
        const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            role,
            full_name: full_name || email.split('@')[0],
            user_type: role === 'super_admin' ? 'super_admin' : 'admin',
          },
        });

        if (createError) {
          throw new Error(createError.message);
        }

        const finalUserId = userData.user.id;

        // 2. Criar nas tabelas do sistema
        await supabaseAdmin.from('users').upsert({
          id: finalUserId,
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
          id: finalUserId,
          user_id: finalUserId,
          email,
          full_name: full_name || email.split('@')[0],
          user_type: role === 'super_admin' ? 'super_admin' : 'admin',
          role,
          is_active: true,
        });

        return NextResponse.json({
          success: true,
          message: `${role} criado com sucesso! (bypass method)`,
          credentials: {
            email,
            password,
            loginUrl: role === 'super_admin' ? '/admin/login' : '/login',
          },
          user: userData.user,
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Admin criado via RPC',
        data: authData,
      });

    } catch (dbError: any) {
      console.error('Erro no banco:', dbError);
      return NextResponse.json(
        { 
          error: 'Erro ao criar no banco',
          details: dbError.message,
          suggestion: 'Use uma senha mais forte ou desabilite a validação no Supabase Dashboard'
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Erro geral:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
