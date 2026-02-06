-- =====================================================
-- MIGRATION: Corrigir políticas RLS de user_profiles
-- Descrição: Permite que todos os colaboradores vejam perfis de outros usuários para mensagens
-- Data: 2026-02-06
-- =====================================================

-- =====================================================
-- 1. REMOVER POLÍTICA ANTIGA QUE ESTAVA MUITO RESTRITIVA
-- =====================================================

DROP POLICY IF EXISTS "Colaboradores veem outros colaboradores" ON user_profiles;

-- =====================================================
-- 2. CRIAR NOVA POLÍTICA MAIS ABRANGENTE
-- =====================================================

-- Colaboradores (não-clientes) podem ver TODOS os perfis
-- Isso permite que eles vejam tanto outros colaboradores quanto clientes para mensagens
CREATE POLICY "Colaboradores veem todos os perfis"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND up.user_type IN ('super_admin', 'admin', 'hr', 'finance', 'manager', 'employee')
      AND up.is_active = true
    )
  );

-- =====================================================
-- 3. ADICIONAR POLÍTICA PARA CLIENTES
-- =====================================================

-- Clientes podem ver apenas perfis de colaboradores (não outros clientes)
DROP POLICY IF EXISTS "Clientes veem colaboradores" ON user_profiles;

CREATE POLICY "Clientes veem colaboradores"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND up.user_type = 'client'
      AND up.is_active = true
    )
    AND user_type IN ('super_admin', 'admin', 'hr', 'finance', 'manager', 'employee')
  );

-- =====================================================
-- 4. GARANTIR QUE AS POLÍTICAS EXISTENTES AINDA FUNCIONEM
-- =====================================================

-- Verificar se as políticas básicas existem, se não, criar

DO $$
BEGIN
  -- Política: Usuários veem seu próprio perfil
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_profiles' 
    AND policyname = 'Usuários veem seu próprio perfil'
  ) THEN
    CREATE POLICY "Usuários veem seu próprio perfil"
      ON user_profiles FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  -- Política: Super admins veem todos os perfis
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_profiles' 
    AND policyname = 'Super admins veem todos os perfis'
  ) THEN
    CREATE POLICY "Super admins veem todos os perfis"
      ON user_profiles FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles up
          WHERE up.user_id = auth.uid()
          AND up.user_type = 'super_admin'
          AND up.is_active = true
        )
      );
  END IF;
END $$;

-- =====================================================
-- 5. VERIFICAÇÃO FINAL
-- =====================================================

-- Listar todas as políticas aplicadas à tabela user_profiles
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  RAISE NOTICE '===== POLÍTICAS RLS APLICADAS À TABELA user_profiles =====';
  FOR policy_record IN 
    SELECT policyname, cmd 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_profiles'
    ORDER BY policyname
  LOOP
    RAISE NOTICE 'Política: % (comando: %)', policy_record.policyname, policy_record.cmd;
  END LOOP;
  RAISE NOTICE '========================================================';
END $$;
