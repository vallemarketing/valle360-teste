-- ═══════════════════════════════════════════════════════════════════════
-- CORREÇÃO DE LOGIN - DESIGNER (EMERGÊNCIA)
-- Execute este script no SQL Editor do Supabase para recriar o usuário
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
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'designer@valle360.com',
  crypt('Valle@2024', gen_salt('bf')), -- Senha: Valle@2024
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Designer Valle"}'::jsonb,
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- 3. Vincular nas tabelas públicas
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Pegar o ID gerado
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'designer@valle360.com';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Erro ao criar usuário no auth.users';
  END IF;

  -- Tabela users
  INSERT INTO public.users (id, email, name, role, created_at, updated_at)
  VALUES (v_user_id, 'designer@valle360.com', 'Designer Valle', 'colaborador', NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET role = 'colaborador';

  -- Tabela employees
  DELETE FROM public.employees WHERE user_id = v_user_id; -- Limpar anterior
  INSERT INTO public.employees (
    user_id, first_name, last_name, role, area, active, created_at
  ) VALUES (
    v_user_id, 'Designer', 'Valle', 'colaborador', 'Designer', true, NOW()
  );

  -- Tabela user_profiles
  DELETE FROM public.user_profiles WHERE user_id = v_user_id; -- Limpar anterior
  INSERT INTO public.user_profiles (
    user_id, full_name, email, user_type, is_active
  ) VALUES (
    v_user_id, 'Designer Valle', 'designer@valle360.com', 'employee', true
  );

  RAISE NOTICE '✅ Usuário designer@valle360.com recriado com sucesso!';
END $$;

