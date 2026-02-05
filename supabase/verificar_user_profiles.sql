-- ============================================================
-- VERIFICAR E CORRIGIR user_profiles
-- ============================================================
-- Execute este script no Supabase SQL Editor
-- Ele verifica se todos os colaboradores têm user_profiles
-- ============================================================

-- 1. Ver quantos colaboradores existem
SELECT 
  'Total de Colaboradores (employees)' as info,
  COUNT(*) as quantidade
FROM employees;

-- 2. Ver quantos user_profiles existem
SELECT 
  'Total de user_profiles' as info,
  COUNT(*) as quantidade
FROM user_profiles;

-- 3. Ver quantos users (auth) existem
SELECT 
  'Total de auth.users' as info,
  COUNT(*) as quantidade
FROM auth.users;

-- 4. Listar colaboradores SEM user_profile
SELECT 
  e.id as employee_id,
  e.name as employee_name,
  e.email as employee_email,
  e.user_id as auth_user_id,
  u.email as auth_email,
  CASE 
    WHEN u.id IS NULL THEN '❌ Auth user não existe'
    WHEN up.id IS NULL THEN '❌ user_profile não existe'
    ELSE '✅ OK'
  END as status
FROM employees e
LEFT JOIN auth.users u ON e.user_id = u.id
LEFT JOIN user_profiles up ON u.id = up.user_id
ORDER BY status, e.name;

-- 5. Ver user_profiles ativos (que deveriam aparecer na lista)
SELECT 
  up.id,
  up.user_id,
  up.full_name,
  up.email,
  up.user_type,
  up.is_active,
  CASE 
    WHEN up.user_type = 'client' THEN '👤 Cliente'
    ELSE '👨‍💼 Equipe'
  END as categoria
FROM user_profiles up
WHERE up.is_active = true
ORDER BY 
  CASE 
    WHEN up.user_type = 'client' THEN 2
    ELSE 1
  END,
  up.full_name;

-- ============================================================
-- COPIE E ME ENVIE OS RESULTADOS DE TODAS AS QUERIES ACIMA
-- ============================================================
