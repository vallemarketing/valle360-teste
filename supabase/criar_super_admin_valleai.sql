-- =====================================================================================
-- CRIAR SUPER ADMIN: valleai@gmail.com
-- Descrição: Cria/atualiza usuário com acesso total ao sistema
-- =====================================================================================

-- IMPORTANTE: Primeiro você DEVE criar o usuário no Supabase Authentication:
-- 1. Vá em: https://supabase.com/dashboard > seu projeto > Authentication > Users
-- 2. Clique em "Add User"
-- 3. Email: valleai@gmail.com
-- 4. Senha: sua senha escolhida
-- 5. Marque "Auto Confirm User"
-- 6. Copie o UUID gerado
-- 7. Substitua 'UUID-DO-USUARIO' abaixo pelo UUID copiado
-- 8. Execute este script no SQL Editor

-- =====================================================================================
-- SUBSTITUA 'UUID-DO-USUARIO' PELO UUID REAL DO AUTHENTICATION
-- =====================================================================================

DO $$
DECLARE
    v_user_id UUID := 'UUID-DO-USUARIO';  -- ⚠️ SUBSTITUIR PELO UUID DO AUTH.USERS
    v_email TEXT := 'valleai@gmail.com';
    v_full_name TEXT := 'Valle AI Admin';
BEGIN
    -- 1. VERIFICAR/CRIAR NA TABELA USERS
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = v_user_id) THEN
        INSERT INTO users (
            id,
            email,
            full_name,
            role,
            user_type,
            is_active,
            email_verified,
            two_factor_enabled,
            created_at,
            updated_at
        ) VALUES (
            v_user_id,
            v_email,
            v_full_name,
            'super_admin',
            'super_admin',
            true,
            true,
            false,
            NOW(),
            NOW()
        );
        RAISE NOTICE '✅ Usuário criado na tabela users!';
    ELSE
        -- Atualizar para super_admin se já existe
        UPDATE users 
        SET 
            role = 'super_admin',
            user_type = 'super_admin',
            is_active = true,
            updated_at = NOW()
        WHERE id = v_user_id;
        RAISE NOTICE '✅ Usuário atualizado para super_admin na tabela users!';
    END IF;

    -- 2. VERIFICAR/CRIAR PERFIL EM user_profiles
    IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = v_user_id) THEN
        INSERT INTO user_profiles (
            id,
            user_id,
            full_name,
            email,
            role,
            avatar_url,
            created_at,
            updated_at
        ) VALUES (
            v_user_id,
            v_user_id,
            v_full_name,
            v_email,
            'super_admin',
            'https://api.dicebear.com/7.x/avataaars/svg?seed=valleai',
            NOW(),
            NOW()
        );
        RAISE NOTICE '✅ Perfil criado em user_profiles!';
    ELSE
        -- Atualizar perfil para super_admin
        UPDATE user_profiles 
        SET 
            role = 'super_admin',
            updated_at = NOW()
        WHERE user_id = v_user_id;
        RAISE NOTICE '✅ Perfil atualizado para super_admin em user_profiles!';
    END IF;

    -- 3. GARANTIR PERMISSÕES DE SUPER ADMIN
    -- Remover permissões antigas se existirem
    DELETE FROM user_permissions WHERE user_id = v_user_id;
    
    -- Adicionar todas as permissões de super admin
    INSERT INTO user_permissions (user_id, permission_id)
    SELECT v_user_id, id FROM permissions
    ON CONFLICT (user_id, permission_id) DO NOTHING;
    
    RAISE NOTICE '✅ Permissões de super_admin aplicadas!';

    -- 4. RESUMO FINAL
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE '🎉 SUPER ADMIN CRIADO COM SUCESSO!';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '📧 Email: %', v_email;
    RAISE NOTICE '🔑 Senha: (a que você definiu no Authentication)';
    RAISE NOTICE '👤 Nome: %', v_full_name;
    RAISE NOTICE '🎖️  Role: super_admin';
    RAISE NOTICE '✅ Status: Ativo';
    RAISE NOTICE '';
    RAISE NOTICE '🌐 Fazer login em: http://localhost:3000/login';
    RAISE NOTICE '📍 Será redirecionado para: /admin/dashboard';
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ ERRO: %', SQLERRM;
        RAISE NOTICE 'Verifique se o UUID está correto e se o usuário foi criado no Authentication.';
END $$;

-- =====================================================================================
-- VERIFICAÇÃO (execute separadamente para conferir)
-- =====================================================================================

-- Verificar se o usuário foi criado corretamente
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.role,
    u.user_type,
    u.is_active,
    up.role as profile_role,
    COUNT(up2.permission_id) as total_permissions
FROM users u
LEFT JOIN user_profiles up ON up.user_id = u.id
LEFT JOIN user_permissions up2 ON up2.user_id = u.id
WHERE u.email = 'valleai@gmail.com'
GROUP BY u.id, u.email, u.full_name, u.role, u.user_type, u.is_active, up.role;
