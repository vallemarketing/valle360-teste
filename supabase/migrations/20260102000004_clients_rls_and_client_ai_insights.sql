-- Epic 13: Insights IA do Cliente (persistência) + policies mínimas de RLS para clients

-- =====================================================
-- 1) RLS policies mínimas em public.clients (owner/admin)
-- Observação: várias rotas server-side usam service role, mas ter policy aqui ajuda
-- componentes/rotas que leem via sessão do usuário (RLS).
-- =====================================================

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS clients_select_owner_or_admin ON public.clients;
CREATE POLICY clients_select_owner_or_admin
  ON public.clients
  FOR SELECT
  TO authenticated
  USING (
    (SELECT public.is_admin())
    OR user_id = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS clients_update_owner_or_admin ON public.clients;
CREATE POLICY clients_update_owner_or_admin
  ON public.clients
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT public.is_admin())
    OR user_id = (SELECT auth.uid())
  )
  WITH CHECK (
    (SELECT public.is_admin())
    OR user_id = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS clients_insert_admin_only ON public.clients;
CREATE POLICY clients_insert_admin_only
  ON public.clients
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS clients_delete_admin_only ON public.clients;
CREATE POLICY clients_delete_admin_only
  ON public.clients
  FOR DELETE
  TO authenticated
  USING ((SELECT public.is_admin()));

-- =====================================================
-- 2) Tabela: client_ai_insights
-- =====================================================

CREATE TABLE IF NOT EXISTS public.client_ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,

  type text NOT NULL CHECK (type IN ('oportunidade', 'melhoria', 'alerta', 'tendencia')),
  priority text NOT NULL CHECK (priority IN ('alta', 'media', 'baixa')),
  status text NOT NULL DEFAULT 'novo' CHECK (status IN ('novo', 'em_analise', 'implementado', 'ignorado')),

  title text NOT NULL,
  description text NOT NULL,
  impact text,
  action text,

  sources text[] NOT NULL DEFAULT '{}'::text[],
  provider text,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_ai_insights_client_id_created_at
  ON public.client_ai_insights (client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_ai_insights_client_id_status
  ON public.client_ai_insights (client_id, status);

ALTER TABLE public.client_ai_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS client_ai_insights_select_owner_or_admin ON public.client_ai_insights;
CREATE POLICY client_ai_insights_select_owner_or_admin
  ON public.client_ai_insights
  FOR SELECT
  TO authenticated
  USING (
    (SELECT public.is_admin())
    OR EXISTS (
      SELECT 1
      FROM public.clients c
      WHERE c.id = client_ai_insights.client_id
        AND c.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS client_ai_insights_insert_owner_or_admin ON public.client_ai_insights;
CREATE POLICY client_ai_insights_insert_owner_or_admin
  ON public.client_ai_insights
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT public.is_admin())
    OR EXISTS (
      SELECT 1
      FROM public.clients c
      WHERE c.id = client_ai_insights.client_id
        AND c.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS client_ai_insights_update_owner_or_admin ON public.client_ai_insights;
CREATE POLICY client_ai_insights_update_owner_or_admin
  ON public.client_ai_insights
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT public.is_admin())
    OR EXISTS (
      SELECT 1
      FROM public.clients c
      WHERE c.id = client_ai_insights.client_id
        AND c.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    (SELECT public.is_admin())
    OR EXISTS (
      SELECT 1
      FROM public.clients c
      WHERE c.id = client_ai_insights.client_id
        AND c.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS client_ai_insights_delete_admin_only ON public.client_ai_insights;
CREATE POLICY client_ai_insights_delete_admin_only
  ON public.client_ai_insights
  FOR DELETE
  TO authenticated
  USING ((SELECT public.is_admin()));


