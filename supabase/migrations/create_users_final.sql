-- ═══════════════════════════════════════════════════════════════════════
-- CRIAR USUÁRIOS DE TESTE - VERSÃO FINAL SIMPLIFICADA
-- ═══════════════════════════════════════════════════════════════════════

-- Limpar usuários de teste existentes (OPCIONAL - descomente se quiser resetar)
-- DELETE FROM employee_gamification WHERE employee_id IN (SELECT id FROM employees WHERE email LIKE '%@valle360.com');
-- DELETE FROM employees WHERE email LIKE '%@valle360.com';
-- DELETE FROM auth.users WHERE email LIKE '%@valle360.com';

-- ═══════════════════════════════════════════════════════════════════════
-- CRIAR USUÁRIOS UM POR UM
-- ═══════════════════════════════════════════════════════════════════════

-- 1. SUPER ADMIN
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Verificar se já existe
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'admin@valle360.com';
  
  IF v_user_id IS NULL THEN
    -- Criar no auth.users
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
      'admin@valle360.com', crypt('Valle@2024', gen_salt('bf')), NOW(),
      '{"provider":"email","providers":["email"]}', '{"full_name":"Administrador Valle"}',
      NOW(), NOW()
    ) RETURNING id INTO v_user_id;
    
    -- Criar no employees
    INSERT INTO employees (id, name, email, role, area, active)
    VALUES (v_user_id, 'Administrador Valle', 'admin@valle360.com', 'super_admin', 'Gestão', true);
    
    -- Criar gamificação
    INSERT INTO employee_gamification (employee_id, level, total_score, productivity_score, quality_score, collaboration_score)
    VALUES (v_user_id, 'Iniciante', 0, 0, 0, 0);
    
    RAISE NOTICE '✅ Super Admin criado: admin@valle360.com';
  ELSE
    RAISE NOTICE '⚠️  Super Admin já existe: admin@valle360.com';
  END IF;
END $$;

-- 2. DESIGNER
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'designer@valle360.com';
  
  IF v_user_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
      'designer@valle360.com', crypt('Valle@2024', gen_salt('bf')), NOW(),
      '{"provider":"email","providers":["email"]}', '{"full_name":"Designer Valle"}',
      NOW(), NOW()
    ) RETURNING id INTO v_user_id;
    
    INSERT INTO employees (id, name, email, role, area, active)
    VALUES (v_user_id, 'Designer Valle', 'designer@valle360.com', 'colaborador', 'Designer', true);
    
    INSERT INTO employee_gamification (employee_id, level, total_score, productivity_score, quality_score, collaboration_score)
    VALUES (v_user_id, 'Iniciante', 0, 0, 0, 0);
    
    RAISE NOTICE '✅ Designer criado: designer@valle360.com';
  ELSE
    RAISE NOTICE '⚠️  Designer já existe: designer@valle360.com';
  END IF;
END $$;

-- 3. WEB DESIGNER
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'webdesigner@valle360.com';
  
  IF v_user_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
      'webdesigner@valle360.com', crypt('Valle@2024', gen_salt('bf')), NOW(),
      '{"provider":"email","providers":["email"]}', '{"full_name":"Web Designer Valle"}',
      NOW(), NOW()
    ) RETURNING id INTO v_user_id;
    
    INSERT INTO employees (id, name, email, role, area, active)
    VALUES (v_user_id, 'Web Designer Valle', 'webdesigner@valle360.com', 'colaborador', 'Web Designer', true);
    
    INSERT INTO employee_gamification (employee_id, level, total_score, productivity_score, quality_score, collaboration_score)
    VALUES (v_user_id, 'Iniciante', 0, 0, 0, 0);
    
    RAISE NOTICE '✅ Web Designer criado: webdesigner@valle360.com';
  ELSE
    RAISE NOTICE '⚠️  Web Designer já existe: webdesigner@valle360.com';
  END IF;
END $$;

-- 4. HEAD DE MARKETING
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'headmarketing@valle360.com';
  
  IF v_user_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
      'headmarketing@valle360.com', crypt('Valle@2024', gen_salt('bf')), NOW(),
      '{"provider":"email","providers":["email"]}', '{"full_name":"Head de Marketing Valle"}',
      NOW(), NOW()
    ) RETURNING id INTO v_user_id;
    
    INSERT INTO employees (id, name, email, role, area, active)
    VALUES (v_user_id, 'Head de Marketing Valle', 'headmarketing@valle360.com', 'colaborador', 'Head de Marketing', true);
    
    INSERT INTO employee_gamification (employee_id, level, total_score, productivity_score, quality_score, collaboration_score)
    VALUES (v_user_id, 'Iniciante', 0, 0, 0, 0);
    
    RAISE NOTICE '✅ Head Marketing criado: headmarketing@valle360.com';
  ELSE
    RAISE NOTICE '⚠️  Head Marketing já existe: headmarketing@valle360.com';
  END IF;
END $$;

-- 5. RH
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'rh@valle360.com';
  
  IF v_user_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
      'rh@valle360.com', crypt('Valle@2024', gen_salt('bf')), NOW(),
      '{"provider":"email","providers":["email"]}', '{"full_name":"RH Valle"}',
      NOW(), NOW()
    ) RETURNING id INTO v_user_id;
    
    INSERT INTO employees (id, name, email, role, area, active)
    VALUES (v_user_id, 'RH Valle', 'rh@valle360.com', 'colaborador', 'RH', true);
    
    INSERT INTO employee_gamification (employee_id, level, total_score, productivity_score, quality_score, collaboration_score)
    VALUES (v_user_id, 'Iniciante', 0, 0, 0, 0);
    
    RAISE NOTICE '✅ RH criado: rh@valle360.com';
  ELSE
    RAISE NOTICE '⚠️  RH já existe: rh@valle360.com';
  END IF;
END $$;

-- 6. FINANCEIRO
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'financeiro@valle360.com';
  
  IF v_user_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
      'financeiro@valle360.com', crypt('Valle@2024', gen_salt('bf')), NOW(),
      '{"provider":"email","providers":["email"]}', '{"full_name":"Financeiro Valle"}',
      NOW(), NOW()
    ) RETURNING id INTO v_user_id;
    
    INSERT INTO employees (id, name, email, role, area, active)
    VALUES (v_user_id, 'Financeiro Valle', 'financeiro@valle360.com', 'colaborador', 'Financeiro', true);
    
    INSERT INTO employee_gamification (employee_id, level, total_score, productivity_score, quality_score, collaboration_score)
    VALUES (v_user_id, 'Iniciante', 0, 0, 0, 0);
    
    RAISE NOTICE '✅ Financeiro criado: financeiro@valle360.com';
  ELSE
    RAISE NOTICE '⚠️  Financeiro já existe: financeiro@valle360.com';
  END IF;
END $$;

-- 7. VIDEOMAKER
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'videomaker@valle360.com';
  
  IF v_user_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
      'videomaker@valle360.com', crypt('Valle@2024', gen_salt('bf')), NOW(),
      '{"provider":"email","providers":["email"]}', '{"full_name":"Videomaker Valle"}',
      NOW(), NOW()
    ) RETURNING id INTO v_user_id;
    
    INSERT INTO employees (id, name, email, role, area, active)
    VALUES (v_user_id, 'Videomaker Valle', 'videomaker@valle360.com', 'colaborador', 'Videomaker', true);
    
    INSERT INTO employee_gamification (employee_id, level, total_score, productivity_score, quality_score, collaboration_score)
    VALUES (v_user_id, 'Iniciante', 0, 0, 0, 0);
    
    RAISE NOTICE '✅ Videomaker criado: videomaker@valle360.com';
  ELSE
    RAISE NOTICE '⚠️  Videomaker já existe: videomaker@valle360.com';
  END IF;
END $$;

-- 8. SOCIAL MEDIA
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'social@valle360.com';
  
  IF v_user_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
      'social@valle360.com', crypt('Valle@2024', gen_salt('bf')), NOW(),
      '{"provider":"email","providers":["email"]}', '{"full_name":"Social Media Valle"}',
      NOW(), NOW()
    ) RETURNING id INTO v_user_id;
    
    INSERT INTO employees (id, name, email, role, area, active)
    VALUES (v_user_id, 'Social Media Valle', 'social@valle360.com', 'colaborador', 'Social Media', true);
    
    INSERT INTO employee_gamification (employee_id, level, total_score, productivity_score, quality_score, collaboration_score)
    VALUES (v_user_id, 'Iniciante', 0, 0, 0, 0);
    
    RAISE NOTICE '✅ Social Media criado: social@valle360.com';
  ELSE
    RAISE NOTICE '⚠️  Social Media já existe: social@valle360.com';
  END IF;
END $$;

-- 9. TRÁFEGO PAGO
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'trafego@valle360.com';
  
  IF v_user_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
      'trafego@valle360.com', crypt('Valle@2024', gen_salt('bf')), NOW(),
      '{"provider":"email","providers":["email"]}', '{"full_name":"Tráfego Pago Valle"}',
      NOW(), NOW()
    ) RETURNING id INTO v_user_id;
    
    INSERT INTO employees (id, name, email, role, area, active)
    VALUES (v_user_id, 'Tráfego Pago Valle', 'trafego@valle360.com', 'colaborador', 'Tráfego Pago', true);
    
    INSERT INTO employee_gamification (employee_id, level, total_score, productivity_score, quality_score, collaboration_score)
    VALUES (v_user_id, 'Iniciante', 0, 0, 0, 0);
    
    RAISE NOTICE '✅ Tráfego Pago criado: trafego@valle360.com';
  ELSE
    RAISE NOTICE '⚠️  Tráfego Pago já existe: trafego@valle360.com';
  END IF;
END $$;

-- 10. COMERCIAL
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'comercial@valle360.com';
  
  IF v_user_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
      'comercial@valle360.com', crypt('Valle@2024', gen_salt('bf')), NOW(),
      '{"provider":"email","providers":["email"]}', '{"full_name":"Comercial Valle"}',
      NOW(), NOW()
    ) RETURNING id INTO v_user_id;
    
    INSERT INTO employees (id, name, email, role, area, active)
    VALUES (v_user_id, 'Comercial Valle', 'comercial@valle360.com', 'colaborador', 'Comercial', true);
    
    INSERT INTO employee_gamification (employee_id, level, total_score, productivity_score, quality_score, collaboration_score)
    VALUES (v_user_id, 'Iniciante', 0, 0, 0, 0);
    
    RAISE NOTICE '✅ Comercial criado: comercial@valle360.com';
  ELSE
    RAISE NOTICE '⚠️  Comercial já existe: comercial@valle360.com';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════
-- MENSAGEM FINAL
-- ═══════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ SCRIPT EXECUTADO COM SUCESSO!';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '🔐 CREDENCIAIS (Senha: Valle@2024 para todos):';
  RAISE NOTICE '';
  RAISE NOTICE 'admin@valle360.com - Super Admin';
  RAISE NOTICE 'designer@valle360.com - Designer';
  RAISE NOTICE 'webdesigner@valle360.com - Web Designer';
  RAISE NOTICE 'headmarketing@valle360.com - Head de Marketing';
  RAISE NOTICE 'rh@valle360.com - RH';
  RAISE NOTICE 'financeiro@valle360.com - Financeiro';
  RAISE NOTICE 'videomaker@valle360.com - Videomaker';
  RAISE NOTICE 'social@valle360.com - Social Media';
  RAISE NOTICE 'trafego@valle360.com - Tráfego Pago';
  RAISE NOTICE 'comercial@valle360.com - Comercial';
  RAISE NOTICE '';
  RAISE NOTICE '🌐 Teste em: http://localhost:3000/login';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;

