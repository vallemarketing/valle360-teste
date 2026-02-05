-- ═══════════════════════════════════════════════════════════════════════
-- CRIAR USUÁRIOS DE TESTE - VERSÃO COMPLETA E ROBUSTA
-- ═══════════════════════════════════════════════════════════════════════

-- Garantir extensão pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Função para criar usuário completo
CREATE OR REPLACE FUNCTION create_valle_user_complete(
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
  v_profile_id UUID;
BEGIN
  -- 1. Verificar se já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
  
  -- Se já existe, remover para recriar limpo (opcional, mas bom para testes)
  -- IF v_user_id IS NOT NULL THEN
  --   DELETE FROM auth.users WHERE id = v_user_id;
  -- END IF;

  IF v_user_id IS NOT NULL THEN
    RETURN '⚠️  Usuário já existe: ' || p_email;
  END IF;
  
  -- 2. Criar no auth.users
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

  -- 3. Tentar criar na tabela public.users se existir (para satisfazer FKs)
  BEGIN
    INSERT INTO public.users (id, email, name, role, created_at, updated_at)
    VALUES (v_user_id, p_email, p_first_name || ' ' || p_last_name, p_role, NOW(), NOW());
  EXCEPTION WHEN OTHERS THEN
    -- Ignorar erro se tabela não existir ou já tiver o registro via trigger
    NULL;
  END;
  
  -- 4. Criar no user_profiles (usado pelo login)
  BEGIN
    INSERT INTO public.user_profiles (
      user_id, full_name, email, user_type, is_active
    ) VALUES (
      v_user_id,
      p_first_name || ' ' || p_last_name,
      p_email,
      CASE WHEN p_role = 'super_admin' THEN 'super_admin' ELSE 'employee' END, -- Ajustar user_type conforme enum
      true
    ) RETURNING id INTO v_profile_id;
  EXCEPTION WHEN OTHERS THEN
     -- Tentar com valores padrão se falhar validação do enum
     INSERT INTO public.user_profiles (
      user_id, full_name, email, user_type, is_active
    ) VALUES (
      v_user_id,
      p_first_name || ' ' || p_last_name,
      p_email,
      'commercial', -- Fallback seguro
      true
    );
  END;

  -- 5. Criar no employees (usado pelo dashboard)
  INSERT INTO public.employees (
    user_id, first_name, last_name, role, area, active, created_at
  ) VALUES (
    v_user_id,
    p_first_name,
    p_last_name,
    p_role,
    p_area,
    true,
    NOW()
  ) RETURNING id INTO v_employee_id;
  
  -- 6. Criar gamificação
  BEGIN
    INSERT INTO public.employee_gamification (
      employee_id, level, total_score, current_streak
    ) VALUES (
      v_employee_id, 'Iniciante', 0, 0
    );
  EXCEPTION WHEN OTHERS THEN
    NULL; -- Ignorar se tabela não existir
  END;
  
  RETURN '✅ Criado: ' || p_email || ' (ID: ' || v_user_id || ')';
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN '❌ Erro ao criar ' || p_email || ': ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════
-- EXECUTAR CRIAÇÃO
-- ═══════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Criando usuários de teste...';
  RAISE NOTICE '───────────────────────────────────────────────────────────────';
  
  -- 1. Super Admin
  RAISE NOTICE '%', create_valle_user_complete('admin@valle360.com', 'Valle@2024', 'Administrador', 'Valle', 'super_admin', 'Gestão');
  
  -- 2. Designer
  RAISE NOTICE '%', create_valle_user_complete('designer@valle360.com', 'Valle@2024', 'Designer', 'Valle', 'colaborador', 'Designer');
  
  -- 3. Web Designer
  RAISE NOTICE '%', create_valle_user_complete('webdesigner@valle360.com', 'Valle@2024', 'Web Designer', 'Valle', 'colaborador', 'Web Designer');
  
  -- 4. Head de Marketing
  RAISE NOTICE '%', create_valle_user_complete('headmarketing@valle360.com', 'Valle@2024', 'Head Marketing', 'Valle', 'colaborador', 'Head de Marketing');
  
  -- 5. RH
  RAISE NOTICE '%', create_valle_user_complete('rh@valle360.com', 'Valle@2024', 'RH', 'Valle', 'colaborador', 'RH');
  
  -- 6. Financeiro
  RAISE NOTICE '%', create_valle_user_complete('financeiro@valle360.com', 'Valle@2024', 'Financeiro', 'Valle', 'colaborador', 'Financeiro');
  
  -- 7. Videomaker
  RAISE NOTICE '%', create_valle_user_complete('videomaker@valle360.com', 'Valle@2024', 'Videomaker', 'Valle', 'colaborador', 'Videomaker');
  
  -- 8. Social Media
  RAISE NOTICE '%', create_valle_user_complete('social@valle360.com', 'Valle@2024', 'Social Media', 'Valle', 'colaborador', 'Social Media');
  
  -- 9. Tráfego Pago
  RAISE NOTICE '%', create_valle_user_complete('trafego@valle360.com', 'Valle@2024', 'Tráfego Pago', 'Valle', 'colaborador', 'Tráfego Pago');
  
  -- 10. Comercial
  RAISE NOTICE '%', create_valle_user_complete('comercial@valle360.com', 'Valle@2024', 'Comercial', 'Valle', 'colaborador', 'Comercial');
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ FINALIZADO!';
END $$;

-- Limpar função
DROP FUNCTION IF EXISTS create_valle_user_complete;

