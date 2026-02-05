-- ═══════════════════════════════════════════════════════════════════════
-- RESET E SEED DESIGNER - SOLUÇÃO DEFINITIVA V2 (Sem coluna role em employees)
-- Apaga e recria o usuário designer garantindo sincronia entre Auth e Tabelas
-- ═══════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- 1. Limpeza: Apagar usuário antigo para evitar conflitos
  
  -- Tentar pegar o ID do usuário se ele existir
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'designer@valle360.com';
  
  IF v_user_id IS NOT NULL THEN
    DELETE FROM public.employees WHERE user_id = v_user_id;
    DELETE FROM public.user_profiles WHERE user_id = v_user_id;
    DELETE FROM public.users WHERE id = v_user_id;
    DELETE FROM auth.users WHERE id = v_user_id;
    RAISE NOTICE 'Usuário antigo removido.';
  END IF;

  -- 2. Criar usuário novo no Auth
  v_user_id := gen_random_uuid();
  
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
    created_at, updated_at, confirmation_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    'designer@valle360.com',
    crypt('Valle@2024', gen_salt('bf')), -- SENHA: Valle@2024
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Designer Valle"}',
    NOW(),
    NOW(),
    ''
  );

  RAISE NOTICE 'Usuário Auth criado com ID: %', v_user_id;

  -- 3. Inserir na Tabela Employees (SEM coluna role)
  BEGIN
    INSERT INTO public.employees (
      user_id, full_name, email, area_of_expertise, department, position, is_active, created_at
    ) VALUES (
      v_user_id, 'Designer Valle', 'designer@valle360.com', 'Designer', 'Design', 'Designer', true, NOW()
    );
    RAISE NOTICE 'Registro criado em employees.';
  EXCEPTION 
    WHEN OTHERS THEN
      RAISE NOTICE 'Erro ao inserir em employees: %', SQLERRM;
  END;

  -- 4. Inserir na Tabela User Profiles
  BEGIN
    INSERT INTO public.user_profiles (
      user_id, full_name, email, user_type, is_active
    ) VALUES (
      v_user_id, 'Designer Valle', 'designer@valle360.com', 'employee', true
    );
    RAISE NOTICE 'Registro criado em user_profiles.';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao inserir em user_profiles: %', SQLERRM;
  END;

  -- 5. Inserir na Tabela Users (Legada/Espelho)
  BEGIN
    INSERT INTO public.users (id, email, role, created_at, updated_at)
    VALUES (v_user_id, 'designer@valle360.com', 'colaborador', NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET role = 'colaborador';
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RAISE NOTICE '✅ CONCLUÍDO! Login liberado para designer@valle360.com';
END $$;

