-- ============================================================
-- EXECUTE QUERY POR QUERY - UMA DE CADA VEZ
-- ============================================================
-- Copie e execute UMA query de cada vez, na ordem
-- ============================================================

-- ============================================================
-- QUERY 1: DIAGNÓSTICO
-- Execute primeiro para ver a situação atual
-- ============================================================
SELECT 
  u.id,
  u.email,
  u.created_at,
  CASE 
    WHEN EXISTS (SELECT 1 FROM user_profiles WHERE user_id = u.id) THEN '✅ Tem user_profile'
    ELSE '❌ SEM user_profile'
  END as tem_profile
FROM auth.users u
WHERE u.email LIKE '%@valle360.com.br'
ORDER BY u.email;

-- ============================================================
-- QUERY 2: CRIAR user_profiles FALTANTES
-- Execute apenas se a Query 1 mostrou que faltam user_profiles
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
-- Execute para garantir que todos estão ativos
-- ============================================================
UPDATE user_profiles
SET is_active = true
WHERE email LIKE '%@valle360.com.br';

-- ============================================================
-- QUERY 4: VERIFICAR RESULTADO FINAL
-- Execute para ver se todos estão OK
-- ============================================================
SELECT 
  full_name,
  email,
  user_type,
  is_active,
  CASE 
    WHEN is_active = true AND user_type IS NOT NULL AND user_type != '' THEN '✅ VAI APARECER'
    ELSE '❌ PROBLEMA: ' || 
      CASE 
        WHEN is_active = false THEN 'inativo'
        WHEN user_type IS NULL THEN 'sem user_type'
        WHEN user_type = '' THEN 'user_type vazio'
      END
  END as status
FROM user_profiles
WHERE email LIKE '%@valle360.com.br'
ORDER BY full_name;
