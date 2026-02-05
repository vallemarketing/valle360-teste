-- Cleanup legacy social metrics policies (historical drift)

-- social_account_metrics_daily legacy policies
DROP POLICY IF EXISTS social_metrics_admin_all ON public.social_account_metrics_daily;
DROP POLICY IF EXISTS social_metrics_client_read_own ON public.social_account_metrics_daily;
DROP POLICY IF EXISTS social_metrics_employee_read ON public.social_account_metrics_daily;

-- Ensure desired policies exist (idempotent)
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

-- social_post_metrics policies (ensure idempotent)
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


