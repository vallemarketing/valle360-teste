-- ═══════════════════════════════════════════════════════════════════════
-- CRIAR USUÁRIOS DE TESTE - VERSÃO CORRETA COM ESTRUTURA REAL
-- ═══════════════════════════════════════════════════════════════════════

-- Função para criar usuário completo
CREATE OR REPLACE FUNCTION create_valle_user(
  p_email TEXT,
  p_password TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_role TEXT DEFAULT 'colaborador',
  p_area TEXT DEFAULT 'Geral'
) RETURNS TEXT AS $$
DECLARE
  v_user_id UUID;
  v_employee_id UUID;
BEGIN
  -- Verificar se já existe
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
  
  IF v_user_id IS NOT NULL THEN
    RETURN '⚠️  Usuário já existe: ' || p_email;
  END IF;
  
  -- Criar no auth.users
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    p_email,
    crypt(p_password, gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    json_build_object('full_name', p_first_name || ' ' || p_last_name)::jsonb,
    NOW(),
    NOW(),
    '',
    ''
  ) RETURNING id INTO v_user_id;
  
  -- Criar no employees
  INSERT INTO employees (
    id, user_id, first_name, last_name, role, area, active, created_at
  ) VALUES (
    gen_random_uuid(),
    v_user_id,
    p_first_name,
    p_last_name,
    p_role,
    p_area,
    true,
    NOW()
  ) RETURNING id INTO v_employee_id;
  
  -- Criar gamificação
  INSERT INTO employee_gamification (
    employee_id,
    level,
    total_score,
    productivity_score,
    quality_score,
    collaboration_score,
    well_being_score,
    weekly_score,
    monthly_score,
    current_streak
  ) VALUES (
    v_employee_id,
    'Iniciante',
    0, 0, 0, 0, 0, 0, 0, 0
  );
  
  RETURN '✅ Criado: ' || p_email || ' (' || p_role || ', ' || p_area || ')';
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN '❌ Erro ao criar ' || p_email || ': ' || SQLERRM;
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
  
  -- 1. Super Admin
  RAISE NOTICE '%', create_valle_user('admin@valle360.com', 'Valle@2024', 'Administrador', 'Valle', 'super_admin', 'Gestão');
  
  -- 2. Designer
  RAISE NOTICE '%', create_valle_user('designer@valle360.com', 'Valle@2024', 'Designer', 'Valle', 'colaborador', 'Designer');
  
  -- 3. Web Designer
  RAISE NOTICE '%', create_valle_user('webdesigner@valle360.com', 'Valle@2024', 'Web Designer', 'Valle', 'colaborador', 'Web Designer');
  
  -- 4. Head de Marketing
  RAISE NOTICE '%', create_valle_user('headmarketing@valle360.com', 'Valle@2024', 'Head Marketing', 'Valle', 'colaborador', 'Head de Marketing');
  
  -- 5. RH
  RAISE NOTICE '%', create_valle_user('rh@valle360.com', 'Valle@2024', 'RH', 'Valle', 'colaborador', 'RH');
  
  -- 6. Financeiro
  RAISE NOTICE '%', create_valle_user('financeiro@valle360.com', 'Valle@2024', 'Financeiro', 'Valle', 'colaborador', 'Financeiro');
  
  -- 7. Videomaker
  RAISE NOTICE '%', create_valle_user('videomaker@valle360.com', 'Valle@2024', 'Videomaker', 'Valle', 'colaborador', 'Videomaker');
  
  -- 8. Social Media
  RAISE NOTICE '%', create_valle_user('social@valle360.com', 'Valle@2024', 'Social Media', 'Valle', 'colaborador', 'Social Media');
  
  -- 9. Tráfego Pago
  RAISE NOTICE '%', create_valle_user('trafego@valle360.com', 'Valle@2024', 'Tráfego Pago', 'Valle', 'colaborador', 'Tráfego Pago');
  
  -- 10. Comercial
  RAISE NOTICE '%', create_valle_user('comercial@valle360.com', 'Valle@2024', 'Comercial', 'Valle', 'colaborador', 'Comercial');
  
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
  RAISE NOTICE '🌐 Acesse: http://localhost:3000/login';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;

-- Limpar função auxiliar
DROP FUNCTION IF EXISTS create_valle_user;

