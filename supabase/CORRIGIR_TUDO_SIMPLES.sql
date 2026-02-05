-- ============================================================
-- SQL SIMPLIFICADO E GARANTIDO - CORRIGIR TODOS COLABORADORES
-- ============================================================

-- PASSO 1: Ver todos os auth.users que são colaboradores
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

-- PASSO 2: Inserir user_profiles para TODOS colaboradores que não têm
INSERT INTO user_profiles (
  user_id,
  full_name,
  email,
  user_type,
  is_active
)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email) as full_name,
  u.email,
  'employee' as user_type,
  true as is_active
FROM auth.users u
WHERE u.email LIKE '%@valle360.com.br'
  AND NOT EXISTS (
    SELECT 1 FROM user_profiles WHERE user_id = u.id
  );

-- PASSO 3: Garantir que todos estão ativos
UPDATE user_profiles
SET is_active = true
WHERE email LIKE '%@valle360.com.br';

-- PASSO 4: Garantir que todos têm user_type
UPDATE user_profiles
SET user_type = 'employee'
WHERE email LIKE '%@valle360.com.br'
  AND (user_type IS NULL OR user_type = '');

-- PASSO 5: Verificar resultado final
SELECT 
  up.full_name,
  up.email,
  up.user_type,
  up.is_active,
  CASE 
    WHEN up.is_active = true AND up.user_type = 'employee' THEN '✅ VAI APARECER'
    ELSE '❌ PROBLEMA'
  END as status
FROM user_profiles up
WHERE up.email LIKE '%@valle360.com.br'
ORDER BY up.full_name;

-- ============================================================
-- DEPOIS DE EXECUTAR:
-- 1. Recarregue a página (Ctrl+Shift+R)
-- 2. Vá em Mensagens → Equipe → Nova Conversa
-- 3. TODOS os 4 deveriam aparecer agora
-- ============================================================
