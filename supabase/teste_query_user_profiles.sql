-- ============================================================
-- TESTE RÁPIDO: O QUE A QUERY ESTÁ RETORNANDO?
-- ============================================================
-- Execute este SQL EXATAMENTE como o código faz
-- ============================================================

-- Esta é a MESMA query que o código executa
SELECT 
  id, 
  user_id, 
  full_name, 
  email, 
  user_type, 
  avatar_url, 
  avatar, 
  is_active,
  CASE 
    WHEN user_type = 'client' THEN '👤 CLIENTE'
    WHEN user_type = '' OR user_type IS NULL THEN '⚠️ SEM TIPO'
    ELSE '👨‍💼 EQUIPE (' || user_type || ')'
  END as categoria
FROM user_profiles
WHERE is_active = true
ORDER BY full_name;

-- ============================================================
-- ANÁLISE: O que você deveria ver?
-- ============================================================
-- Se retornar 0 linhas: NENHUM user_profile ativo existe
-- Se retornar linhas mas sem colaboradores: is_active pode estar false
-- Se retornar colaboradores mas com user_type='': filtro vai remover
-- Se retornar colaboradores com user_type='client': filtro "team" vai remover
-- Se retornar colaboradores com user_type='employee' ou outros: DEVERIA APARECER

-- ============================================================
-- ME ENVIE UM PRINT DO RESULTADO
-- ============================================================
