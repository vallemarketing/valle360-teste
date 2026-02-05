-- =====================================================================================
-- CORRIGIR USUÁRIO: Shane Santiago
-- Email: shane.santiago.12@gmail.com
-- Problema: Usuário existe em auth.users mas não em public.users
-- =====================================================================================

-- 1. VERIFICAR SE JÁ EXISTE
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = '82431ba3-68cc-4fb2-bb4f-562b7fc79e91') THEN
        -- 2. INSERIR NA TABELA USERS
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
            '82431ba3-68cc-4fb2-bb4f-562b7fc79e91',
            'shane.santiago.12@gmail.com',
            'Shane Santiago',
            'super_admin',
            'super_admin',
            true,
            true,
            false,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE '✅ Usuário Shane Santiago criado na tabela users!';
    ELSE
        RAISE NOTICE '⚠️  Usuário Shane Santiago já existe na tabela users!';
    END IF;
END $$;

-- 3. VERIFICAR SE TEM PERFIL EM user_profiles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = '82431ba3-68cc-4fb2-bb4f-562b7fc79e91') THEN
        INSERT INTO user_profiles (
            id,
            user_id,
            full_name,
            email,
            role,
            user_type,
            is_active,
            avatar,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            '82431ba3-68cc-4fb2-bb4f-562b7fc79e91',
            'Shane Santiago',
            'shane.santiago.12@gmail.com',
            'super_admin',
            'super_admin',
            true,
            'https://api.dicebear.com/7.x/avataaars/svg?seed=shane',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE '✅ Perfil do Shane Santiago criado em user_profiles!';
    ELSE
        -- Atualizar role se já existir
        UPDATE user_profiles 
        SET 
            role = 'super_admin',
            user_type = 'super_admin',
            is_active = true,
            updated_at = NOW()
        WHERE user_id = '82431ba3-68cc-4fb2-bb4f-562b7fc79e91';
        
        RAISE NOTICE '✅ Perfil do Shane Santiago atualizado em user_profiles!';
    END IF;
END $$;

-- 4. VERIFICAR RESULTADO
SELECT 
    '✅ VERIFICAÇÃO FINAL' as status,
    u.id,
    u.email,
    u.full_name,
    u.role,
    up.user_type,
    up.is_active
FROM users u
LEFT JOIN user_profiles up ON up.user_id = u.id
WHERE u.id = '82431ba3-68cc-4fb2-bb4f-562b7fc79e91';

-- MENSAGEM FINAL
DO $$
BEGIN
    RAISE NOTICE '════════════════════════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ TUDO PRONTO!';
    RAISE NOTICE '📧 Email: shane.santiago.12@gmail.com';
    RAISE NOTICE '🔑 Senha: @Shane5799';
    RAISE NOTICE '🔗 Login: http://localhost:3000/login';
    RAISE NOTICE '════════════════════════════════════════════════════════════════════════════';
END $$;
