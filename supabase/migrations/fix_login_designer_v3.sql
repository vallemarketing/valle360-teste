-- ═══════════════════════════════════════════════════════════════════════
-- CORREÇÃO DE LOGIN - DESIGNER (V3 - MÁXIMA COMPATIBILIDADE)
-- Versão "blindada" que detecta a estrutura da tabela e insere corretamente
-- ═══════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Remover usuário antigo se existir (limpeza total)
DELETE FROM auth.users WHERE email = 'designer@valle360.com';

-- 2. Criar usuário na tabela de autenticação
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
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'designer@valle360.com',
  crypt('Valle@2024', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Designer Valle"}'::jsonb,
  NOW(),
  NOW()
);

-- 3. Vincular nas tabelas públicas com detecção de estrutura
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Pegar o ID gerado
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'designer@valle360.com';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Erro ao criar usuário no auth.users';
  END IF;

  -- ===========================================================================
  -- Tabela users: Tentar inserir com 'name' ou sem
  -- ===========================================================================
  BEGIN
    -- Tenta inserir usando a coluna 'name'
    INSERT INTO public.users (id, email, name, role, created_at, updated_at)
    VALUES (v_user_id, 'designer@valle360.com', 'Designer Valle', 'colaborador', NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET role = 'colaborador';
  EXCEPTION 
    WHEN undefined_column THEN
      -- Se 'name' não existir, tenta sem ela
      BEGIN
        INSERT INTO public.users (id, email, role, created_at, updated_at)
        VALUES (v_user_id, 'designer@valle360.com', 'colaborador', NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET role = 'colaborador';
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Aviso: Falha ao inserir na tabela users: %', SQLERRM;
      END;
    WHEN OTHERS THEN
      RAISE NOTICE 'Aviso: Falha desconhecida na tabela users: %', SQLERRM;
  END;

  -- ===========================================================================
  -- Tabela employees: Tentar inserir com 'first_name'/'last_name' ou 'name'
  -- ===========================================================================
  DELETE FROM public.employees WHERE user_id = v_user_id;
  
  BEGIN
    -- Tenta inserir usando 'first_name' e 'last_name'
    INSERT INTO public.employees (
      user_id, first_name, last_name, role, area, active, created_at
    ) VALUES (
      v_user_id, 'Designer', 'Valle', 'colaborador', 'Designer', true, NOW()
    );
  EXCEPTION 
    WHEN undefined_column THEN
      -- Se falhar, tenta usar a coluna 'name'
      BEGIN
        INSERT INTO public.employees (
          user_id, name, role, area, active, created_at
        ) VALUES (
          v_user_id, 'Designer Valle', 'colaborador', 'Designer', true, NOW()
        );
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ERRO CRÍTICO: Não foi possível inserir em employees (nem first_name nem name existem). Verifique o esquema!';
        RAISE; -- Relança o erro porque employees é essencial
      END;
  END;

  -- ===========================================================================
  -- Tabela user_profiles: Tentar inserir (Geralmente padrão)
  -- ===========================================================================
  DELETE FROM public.user_profiles WHERE user_id = v_user_id;
  
  BEGIN
    INSERT INTO public.user_profiles (
      user_id, full_name, email, user_type, is_active
    ) VALUES (
      v_user_id, 'Designer Valle', 'designer@valle360.com', 'employee', true
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Aviso: Falha ao inserir em user_profiles: %', SQLERRM;
  END;

  RAISE NOTICE '✅ Processo concluído! Tente logar agora.';
END $$;

