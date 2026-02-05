-- =====================================================================================
-- CRIAR SUPER ADMIN: valleai@gmail.com
-- Baseado no script que funcionou com Shane Santiago
-- =====================================================================================

-- IMPORTANTE: Primeiro criar o usuário no Supabase Authentication:
-- 1. Vá em: https://supabase.com/dashboard > seu projeto > Authentication > Users
-- 2. Clique em "Add User"
-- 3. Email: valleai@gmail.com
-- 4. Senha: sua senha escolhida (ex: *Valle2307)
-- 5. Marque "Auto Confirm User"
-- 6. Copie o UUID gerado
-- 7. Substitua na linha 16 abaixo
-- 8. Execute este script

-- =====================================================================================
-- ⚠️ SUBSTITUA O UUID ABAIXO PELO UUID DO AUTH.USERS
-- =====================================================================================

DO $$
DECLARE
    v_user_id UUID := '17e4cae0-a965-4352-bdc2-1d0ffb38bd5d';  -- ⚠️ COLAR O UUID AQUI
    v_email TEXT := 'valleai@gmail.com';
    v_full_name TEXT := 'Valle AI Admin';
BEGIN
    -- 1. INSERIR/VERIFICAR NA TABELA USERS
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
        
        RAISE NOTICE '✅ Usuário valleai@gmail.com criado na tabela users!';
    ELSE
        -- Atualizar para super_admin se já existe
        UPDATE users 
        SET 
            role = 'super_admin',
            user_type = 'super_admin',
            is_active = true,
            updated_at = NOW()
        WHERE id = v_user_id;
        
        RAISE NOTICE '⚠️  Usuário já existia - atualizado para super_admin!';
    END IF;
END $$;

-- 2. VERIFICAR SE TEM PERFIL EM user_profiles
DO $$
DECLARE
    v_user_id UUID := '17e4cae0-a965-4352-bdc2-1d0ffb38bd5d';  -- ⚠️ COLAR O MESMO UUID AQUI
    v_email TEXT := 'valleai@gmail.com';
    v_full_name TEXT := 'Valle AI Admin';
BEGIN
    IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = v_user_id) THEN
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
            v_user_id,
            v_full_name,
            v_email,
            'super_admin',
            'super_admin',
            true,
            'https://api.dicebear.com/7.x/avataaars/svg?seed=valleai',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE '✅ Perfil do valleai@gmail.com criado em user_profiles!';
    ELSE
        -- Atualizar role se já existir
        UPDATE user_profiles 
        SET 
            role = 'super_admin',
            user_type = 'super_admin',
            is_active = true,
            updated_at = NOW()
        WHERE user_id = v_user_id;
        
        RAISE NOTICE '✅ Perfil do valleai@gmail.com atualizado em user_profiles!';
    END IF;
END $$;

-- 3. VERIFICAR RESULTADO
DO $$
DECLARE
    v_user_id UUID := '17e4cae0-a965-4352-bdc2-1d0ffb38bd5d';  -- ⚠️ COLAR O MESMO UUID AQUI
BEGIN
    PERFORM 1 FROM users WHERE id = v_user_id;
    IF FOUND THEN
        RAISE NOTICE '';
        RAISE NOTICE '════════════════════════════════════════════════════════════════════════════';
        RAISE NOTICE '✅ TUDO PRONTO!';
        RAISE NOTICE '📧 Email: valleai@gmail.com';
        RAISE NOTICE '🔑 Senha: (a que você definiu no Authentication)';
        RAISE NOTICE '🔗 Login: http://localhost:3000/login';
        RAISE NOTICE '📍 Será redirecionado para: /admin/dashboard';
        RAISE NOTICE '════════════════════════════════════════════════════════════════════════════';
        RAISE NOTICE '';
    END IF;
END $$;

-- 4. CONSULTA FINAL PARA VERIFICAR
SELECT 
    '✅ VERIFICAÇÃO FINAL' as status,
    u.id,
    u.email,
    u.full_name,
    u.role as user_role,
    u.user_type as user_type_users,
    up.role as profile_role,
    up.user_type as user_type_profile,
    up.is_active
FROM users u
LEFT JOIN user_profiles up ON up.user_id = u.id
WHERE u.email = 'valleai@gmail.com';
