-- ============================================================
-- CORRIGIR LEONARDO E GUSTAVO - CRIAR user_profiles FALTANTES
-- ============================================================
-- Execute DEPOIS de verificar com o SQL anterior
-- ============================================================

-- Inserir user_profiles para Leonardo e Gustavo (se não existirem)
INSERT INTO user_profiles (
  user_id, 
  full_name, 
  email, 
  user_type, 
  avatar_url,
  is_active
)
SELECT 
  u.id as user_id,
  u.email as full_name,
  u.email,
  'employee' as user_type,
  NULL as avatar_url,
  true as is_active
FROM auth.users u
WHERE u.email IN ('leonardo@valle360.com.br', 'gustavo@valle360.com.br')
  AND NOT EXISTS (
    SELECT 1 FROM user_profiles up WHERE up.user_id = u.id
  );

-- Verificar se foi criado
SELECT 
  up.full_name,
  up.email,
  up.user_type,
  up.is_active,
  '✅ Criado/Atualizado' as status
FROM user_profiles up
WHERE up.email IN (
  'leonardo@valle360.com.br',
  'gustavo@valle360.com.br'
);

-- ============================================================
-- SE JÁ EXISTEM MAS ESTÃO COM PROBLEMAS, EXECUTE ISSO:
-- ============================================================

-- Ativar se estiverem inativos
UPDATE user_profiles 
SET is_active = true 
WHERE email IN ('leonardo@valle360.com.br', 'gustavo@valle360.com.br')
  AND is_active = false;

-- Corrigir user_type se estiver vazio ou NULL
UPDATE user_profiles 
SET user_type = 'employee'
WHERE email IN ('leonardo@valle360.com.br', 'gustavo@valle360.com.br')
  AND (user_type IS NULL OR user_type = '');

-- Verificar resultado final
SELECT 
  up.full_name,
  up.email,
  up.user_type,
  up.is_active,
  CASE 
    WHEN up.is_active = true AND up.user_type IS NOT NULL AND up.user_type != '' THEN '✅ OK - VAI APARECER'
    ELSE '❌ AINDA TEM PROBLEMA'
  END as status
FROM user_profiles up
WHERE up.email IN (
  'leonardo@valle360.com.br',
  'joaoviana@valle360.com.br',
  'gustavo@valle360.com.br',
  'shane.santiago@valle360.com.br'
)
ORDER BY up.full_name;
