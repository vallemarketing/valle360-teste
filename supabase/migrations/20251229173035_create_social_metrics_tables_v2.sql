-- Social Metrics tables (v2)
-- Creates daily account metrics and post-level metrics for connected social accounts.

-- =============================
-- 1) social_account_metrics_daily
-- =============================
CREATE TABLE IF NOT EXISTS public.social_account_metrics_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.social_connected_accounts(id) ON DELETE CASCADE,
  platform text NOT NULL,
  metric_date date NOT NULL,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  raw_payload jsonb,
  collected_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, metric_date)
);

CREATE INDEX IF NOT EXISTS idx_social_account_metrics_daily_client_date
  ON public.social_account_metrics_daily (client_id, metric_date DESC);

CREATE INDEX IF NOT EXISTS idx_social_account_metrics_daily_account_date
  ON public.social_account_metrics_daily (account_id, metric_date DESC);

CREATE INDEX IF NOT EXISTS idx_social_account_metrics_daily_platform
  ON public.social_account_metrics_daily (platform);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.update_social_account_metrics_daily_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_social_account_metrics_daily_updated_at ON public.social_account_metrics_daily;
CREATE TRIGGER trigger_social_account_metrics_daily_updated_at
  BEFORE UPDATE ON public.social_account_metrics_daily
  FOR EACH ROW EXECUTE FUNCTION public.update_social_account_metrics_daily_updated_at();

-- RLS
ALTER TABLE public.social_account_metrics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_account_metrics_daily FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS social_account_metrics_admin_all ON public.social_account_metrics_daily;
DROP POLICY IF EXISTS social_account_metrics_client_read_own ON public.social_account_metrics_daily;
DROP POLICY IF EXISTS social_account_metrics_employee_read ON public.social_account_metrics_daily;

CREATE POLICY social_account_metrics_admin_all
  ON public.social_account_metrics_daily
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY social_account_metrics_client_read_own
  ON public.social_account_metrics_daily
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = social_account_metrics_daily.client_id
        AND c.user_id = auth.uid()
    )
  );

CREATE POLICY social_account_metrics_employee_read
  ON public.social_account_metrics_daily
  FOR SELECT
  TO authenticated
  USING (
    is_employee()
    AND (employee_area_keys() && ARRAY['social_media','head_marketing']::text[])
  );

-- =============================
-- 2) social_post_metrics
-- =============================
CREATE TABLE IF NOT EXISTS public.social_post_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.social_connected_accounts(id) ON DELETE CASCADE,
  platform text NOT NULL,
  external_post_id text NOT NULL,
  instagram_post_id uuid NULL REFERENCES public.instagram_posts(id) ON DELETE SET NULL,
  metric_date date NOT NULL,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  raw_payload jsonb,
  collected_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, external_post_id, metric_date)
);

CREATE INDEX IF NOT EXISTS idx_social_post_metrics_client_date
  ON public.social_post_metrics (client_id, metric_date DESC);

CREATE INDEX IF NOT EXISTS idx_social_post_metrics_account_date
  ON public.social_post_metrics (account_id, metric_date DESC);

CREATE INDEX IF NOT EXISTS idx_social_post_metrics_platform
  ON public.social_post_metrics (platform);

CREATE INDEX IF NOT EXISTS idx_social_post_metrics_external_post_id
  ON public.social_post_metrics (external_post_id);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.update_social_post_metrics_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_social_post_metrics_updated_at ON public.social_post_metrics;
CREATE TRIGGER trigger_social_post_metrics_updated_at
  BEFORE UPDATE ON public.social_post_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_social_post_metrics_updated_at();

-- RLS
ALTER TABLE public.social_post_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_post_metrics FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS social_post_metrics_admin_all ON public.social_post_metrics;
DROP POLICY IF EXISTS social_post_metrics_client_read_own ON public.social_post_metrics;
DROP POLICY IF EXISTS social_post_metrics_employee_read ON public.social_post_metrics;

CREATE POLICY social_post_metrics_admin_all
  ON public.social_post_metrics
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY social_post_metrics_client_read_own
  ON public.social_post_metrics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = social_post_metrics.client_id
        AND c.user_id = auth.uid()
    )
  );

CREATE POLICY social_post_metrics_employee_read
  ON public.social_post_metrics
  FOR SELECT
  TO authenticated
  USING (
    is_employee()
    AND (employee_area_keys() && ARRAY['social_media','head_marketing']::text[])
  );


