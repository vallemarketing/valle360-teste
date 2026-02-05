-- ═══════════════════════════════════════════════════════════════════════
-- CRIAR USUÁRIOS DE TESTE - VALLE 360 (VERSÃO SIMPLIFICADA)
-- Execute este script no SQL Editor do Supabase
-- ═══════════════════════════════════════════════════════════════════════

-- Função auxiliar para criar usuário
CREATE OR REPLACE FUNCTION create_test_user(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT,
  p_role TEXT,
  p_area TEXT,
  p_is_client BOOLEAN DEFAULT FALSE
) RETURNS void AS $$
DECLARE
  v_user_id uuid;
  v_encrypted_password TEXT;
BEGIN
  -- Verificar se usuário já existe
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
  
  IF v_user_id IS NOT NULL THEN
    RAISE NOTICE '⚠️  Usuário já existe: %', p_email;
    RETURN;
  END IF;
  
  -- Criptografar senha
  v_encrypted_password := crypt(p_password, gen_salt('bf'));
  
  -- Criar usuário no auth
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    p_email,
    v_encrypted_password,
    NOW(),
    '{"provider":"email","providers":["email"]}',
    json_build_object('full_name', p_full_name)::jsonb,
    NOW(),
    NOW(),
    '',
    ''
  )
  RETURNING id INTO v_user_id;
  
  -- Criar perfil (cliente ou colaborador)
  IF p_is_client THEN
    INSERT INTO clients (id, name, email, company_name, active)
    VALUES (v_user_id, p_full_name, p_email, 'Empresa Teste LTDA', true);
  ELSE
    INSERT INTO employees (id, name, email, role, area, active)
    VALUES (v_user_id, p_full_name, p_email, p_role, p_area, true);
    
    -- Criar gamificação
    INSERT INTO employee_gamification (
      employee_id, level, total_score, productivity_score, 
      quality_score, collaboration_score, well_being_score,
      weekly_score, monthly_score, current_streak
    ) VALUES (
      v_user_id, 'Iniciante', 0, 0, 0, 0, 0, 0, 0, 0
    );
  END IF;
  
  RAISE NOTICE '✅ Criado: % (%, %)', p_email, p_role, p_area;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Erro ao criar %: %', p_email, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════
-- CRIAR TODOS OS USUÁRIOS
-- ═══════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Criando usuários de teste...';
  RAISE NOTICE '───────────────────────────────────────────────────────────────';
  
  -- Super Admin
  PERFORM create_test_user(
    'admin@valle360.com',
    'Valle@2024',
    'Administrador Valle',
    'super_admin',
    'Gestão'
  );
  
  -- Designer
  PERFORM create_test_user(
    'designer@valle360.com',
    'Valle@2024',
    'Designer Valle',
    'colaborador',
    'Designer'
  );
  
  -- Web Designer
  PERFORM create_test_user(
    'webdesigner@valle360.com',
    'Valle@2024',
    'Web Designer Valle',
    'colaborador',
    'Web Designer'
  );
  
  -- Head de Marketing
  PERFORM create_test_user(
    'headmarketing@valle360.com',
    'Valle@2024',
    'Head de Marketing Valle',
    'colaborador',
    'Head de Marketing'
  );
  
  -- RH
  PERFORM create_test_user(
    'rh@valle360.com',
    'Valle@2024',
    'RH Valle',
    'colaborador',
    'RH'
  );
  
  -- Financeiro
  PERFORM create_test_user(
    'financeiro@valle360.com',
    'Valle@2024',
    'Financeiro Valle',
    'colaborador',
    'Financeiro'
  );
  
  -- Videomaker
  PERFORM create_test_user(
    'videomaker@valle360.com',
    'Valle@2024',
    'Videomaker Valle',
    'colaborador',
    'Videomaker'
  );
  
  -- Social Media
  PERFORM create_test_user(
    'social@valle360.com',
    'Valle@2024',
    'Social Media Valle',
    'colaborador',
    'Social Media'
  );
  
  -- Tráfego Pago
  PERFORM create_test_user(
    'trafego@valle360.com',
    'Valle@2024',
    'Tráfego Pago Valle',
    'colaborador',
    'Tráfego Pago'
  );
  
  -- Comercial
  PERFORM create_test_user(
    'comercial@valle360.com',
    'Valle@2024',
    'Comercial Valle',
    'colaborador',
    'Comercial'
  );
  
  -- Cliente
  PERFORM create_test_user(
    'cliente@valle360.com',
    'Valle@2024',
    'Cliente Teste Valle',
    'cliente',
    'Cliente',
    TRUE
  );
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ PROCESSO CONCLUÍDO!';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '🔐 CREDENCIAIS (Senha: Valle@2024 para todos):';
  RAISE NOTICE '';
  RAISE NOTICE '👑 SUPER ADMIN:';
  RAISE NOTICE '   admin@valle360.com - Gestão';
  RAISE NOTICE '';
  RAISE NOTICE '👤 COLABORADORES:';
  RAISE NOTICE '   designer@valle360.com - Designer';
  RAISE NOTICE '   webdesigner@valle360.com - Web Designer';
  RAISE NOTICE '   headmarketing@valle360.com - Head de Marketing';
  RAISE NOTICE '   rh@valle360.com - RH';
  RAISE NOTICE '   financeiro@valle360.com - Financeiro';
  RAISE NOTICE '   videomaker@valle360.com - Videomaker';
  RAISE NOTICE '   social@valle360.com - Social Media';
  RAISE NOTICE '   trafego@valle360.com - Tráfego Pago';
  RAISE NOTICE '   comercial@valle360.com - Comercial';
  RAISE NOTICE '';
  RAISE NOTICE '🏢 CLIENTE:';
  RAISE NOTICE '   cliente@valle360.com - Portal do Cliente';
  RAISE NOTICE '';
  RAISE NOTICE '🌐 Acesse: http://localhost:3000/login';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;

-- Limpar função auxiliar
DROP FUNCTION IF EXISTS create_test_user;

-- ═══════════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO
-- ═══════════════════════════════════════════════════════════════════════

