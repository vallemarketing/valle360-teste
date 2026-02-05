-- ============================================================
-- VERSÃO FINAL SEM ERROS - EXECUTE UMA POR VEZ
-- ============================================================

-- ============================================================
-- QUERY 1: DIAGNÓSTICO
-- ============================================================
SELECT 
  u.id,
  u.email,
  CASE 
    WHEN EXISTS (SELECT 1 FROM user_profiles WHERE user_id = u.id) THEN '✅ Tem user_profile'
    ELSE '❌ SEM user_profile'
  END as tem_profile
FROM auth.users u
WHERE u.email LIKE '%@valle360.com.br'
ORDER BY u.email;

-- ============================================================
-- QUERY 2: CRIAR user_profiles FALTANTES
-- ============================================================
INSERT INTO user_profiles (
  user_id,
  full_name,
  email,
  user_type,
  is_active
)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', SPLIT_PART(u.email, '@', 1)) as full_name,
  u.email,
  'employee',
  true
FROM auth.users u
WHERE u.email LIKE '%@valle360.com.br'
  AND NOT EXISTS (
    SELECT 1 FROM user_profiles WHERE user_id = u.id
  );

-- ============================================================
-- QUERY 3: ATIVAR TODOS
-- ============================================================
UPDATE user_profiles
SET is_active = true
WHERE email LIKE '%@valle360.com.br';

-- ============================================================
-- QUERY 4: CORRIGIR user_type NULL (se houver)
-- ============================================================
UPDATE user_profiles
SET user_type = 'employee'
WHERE email LIKE '%@valle360.com.br'
  AND user_type IS NULL;

-- ============================================================
-- QUERY 5: VERIFICAR RESULTADO FINAL
-- ============================================================
SELECT 
  full_name,
  email,
  user_type,
  is_active,
  CASE 
    WHEN is_active = true AND user_type IS NOT NULL THEN '✅ VAI APARECER'
    WHEN is_active = false THEN '❌ INATIVO'
    WHEN user_type IS NULL THEN '❌ SEM user_type'
    ELSE '❌ PROBLEMA'
  END as status
FROM user_profiles
WHERE email LIKE '%@valle360.com.br'
ORDER BY full_name;
