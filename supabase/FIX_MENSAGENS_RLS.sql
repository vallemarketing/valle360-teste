-- =====================================================
-- CORREÇÃO DEFINITIVA: Políticas RLS user_profiles
-- =====================================================
-- Remove TODAS as políticas de SELECT e recria usando
-- funções SECURITY DEFINER (sem recursão infinita)
-- =====================================================

BEGIN;

-- =====================================================
-- PASSO 1: Criar funções SECURITY DEFINER
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_collaborator()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles up
    WHERE up.user_id = auth.uid()
      AND lower(COALESCE(up.user_type::text, '')) IN (
        'super_admin', 'admin', 'hr', 'finance', 'manager', 'employee'
      )
      AND up.is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_client()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles up
    WHERE up.user_id = auth.uid()
      AND lower(COALESCE(up.user_type::text, '')) = 'client'
      AND up.is_active = true
  );
$$;

-- =====================================================
-- PASSO 2: Remover TODAS as políticas de SELECT
-- (lista completa de todos os nomes possíveis)
-- =====================================================

DROP POLICY IF EXISTS "Usuários veem seu próprio perfil" ON user_profiles;
DROP POLICY IF EXISTS "Super admins veem todos os perfis" ON user_profiles;
DROP POLICY IF EXISTS "Colaboradores veem outros colaboradores" ON user_profiles;
DROP POLICY IF EXISTS "Colaboradores veem todos os perfis" ON user_profiles;
DROP POLICY IF EXISTS "Clientes veem colaboradores" ON user_profiles;
DROP POLICY IF EXISTS "colaboradores_veem_todos_perfis_v2" ON user_profiles;
DROP POLICY IF EXISTS "clientes_veem_colaboradores_v2" ON user_profiles;
DROP POLICY IF EXISTS "colaboradores_select_all_profiles" ON user_profiles;
DROP POLICY IF EXISTS "clientes_select_collaborator_profiles" ON user_profiles;
DROP POLICY IF EXISTS "users_select_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_select_own" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_select_admin" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_select_all" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_select_authenticated" ON user_profiles;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON user_profiles;

-- =====================================================
-- PASSO 3: Criar 3 políticas limpas (sem recursão)
-- =====================================================

-- 1. Qualquer pessoa vê seu próprio perfil
CREATE POLICY "own_profile_select"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 2. Colaboradores veem TODOS os perfis
CREATE POLICY "collaborator_select_all"
  ON user_profiles FOR SELECT
  TO authenticated
  USING ((SELECT public.is_collaborator()));

-- 3. Clientes veem apenas colaboradores
CREATE POLICY "client_select_collaborators"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    (SELECT public.is_client())
    AND lower(COALESCE(user_type::text, '')) IN (
      'super_admin', 'admin', 'hr', 'finance', 'manager', 'employee'
    )
  );

-- =====================================================
-- PASSO 4: Verificação
-- =====================================================

DO $$
DECLARE
  policy_record RECORD;
  cnt INTEGER := 0;
BEGIN
  RAISE NOTICE '===================================================================';
  RAISE NOTICE 'POLITICAS SELECT em user_profiles:';
  RAISE NOTICE '===================================================================';
  FOR policy_record IN 
    SELECT policyname, cmd
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_profiles'
    AND cmd = 'SELECT'
    ORDER BY policyname
  LOOP
    RAISE NOTICE '  - %', policy_record.policyname;
    cnt := cnt + 1;
  END LOOP;
  RAISE NOTICE '===================================================================';
  RAISE NOTICE 'Total: % politicas SELECT', cnt;
  RAISE NOTICE 'CORRECAO APLICADA! Recarregue a pagina (F5)';
  RAISE NOTICE '===================================================================';
END $$;

COMMIT;
