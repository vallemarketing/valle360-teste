-- ============================================================
-- VERIFICAR POR QUE LEONARDO E GUSTAVO NÃO APARECEM
-- ============================================================

-- 1. Ver todos os colaboradores da tabela employees
SELECT 
  'EMPLOYEES' as tabela,
  id as employee_id,
  email,
  user_id,
  CASE 
    WHEN user_id IS NULL THEN '❌ SEM user_id'
    ELSE '✅ Tem user_id'
  END as status
FROM employees
WHERE email IN (
  'leonardo@valle360.com.br',
  'joaoviana@valle360.com.br',
  'gustavo@valle360.com.br',
  'shane.santiago@valle360.com.br'
)
ORDER BY email;

-- 2. Ver se existem em auth.users
SELECT 
  'AUTH.USERS' as tabela,
  u.id as auth_user_id,
  u.email,
  u.email_confirmed_at,
  CASE 
    WHEN u.email_confirmed_at IS NULL THEN '⚠️ Email não confirmado'
    ELSE '✅ Email confirmado'
  END as status
FROM auth.users u
WHERE u.email IN (
  'leonardo@valle360.com.br',
  'joaoviana@valle360.com.br',
  'gustavo@valle360.com.br',
  'shane.santiago@valle360.com.br'
)
ORDER BY u.email;

-- 3. Ver se existem em user_profiles
SELECT 
  'USER_PROFILES' as tabela,
  up.id,
  up.user_id,
  up.full_name,
  up.email,
  up.user_type,
  up.is_active,
  CASE 
    WHEN up.is_active = false THEN '❌ INATIVO'
    WHEN up.user_type IS NULL OR up.user_type = '' THEN '❌ SEM user_type'
    WHEN up.user_type = 'client' THEN '⚠️ TIPO CLIENTE (não aparece em Equipe)'
    ELSE '✅ OK'
  END as status
FROM user_profiles up
WHERE up.email IN (
  'leonardo@valle360.com.br',
  'joaoviana@valle360.com.br',
  'gustavo@valle360.com.br',
  'shane.santiago@valle360.com.br'
)
ORDER BY up.full_name;

-- 4. Query EXATA que o código executa (só equipe, is_active=true)
SELECT 
  'QUERY DO CÓDIGO (filtro team)' as tabela,
  up.id,
  up.user_id,
  up.full_name,
  up.email,
  up.user_type,
  up.is_active,
  '✅ DEVERIA APARECER' as status
FROM user_profiles up
WHERE up.is_active = true
  AND up.user_type IS NOT NULL 
  AND up.user_type != ''
  AND LOWER(up.user_type) != 'client'
  AND up.email IN (
    'leonardo@valle360.com.br',
    'joaoviana@valle360.com.br',
    'gustavo@valle360.com.br',
    'shane.santiago@valle360.com.br'
  )
ORDER BY up.full_name;

-- ============================================================
-- ME ENVIE UM PRINT DE TODOS OS RESULTADOS
-- ============================================================
-- Isso vai mostrar exatamente onde está o problema para Leonardo e Gustavo
