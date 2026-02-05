/*
  Harden Hub RLS
  - workflow_transitions: admin-only
  - event_log: admin-only
  Observação: inserções/updates do event_log também acontecem via service role (getSupabaseAdmin),
  então restringir RLS não quebra o pipeline de eventos.
*/

-- =========================
-- workflow_transitions
-- =========================
ALTER TABLE public.workflow_transitions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS workflow_transitions_all ON public.workflow_transitions;
DROP POLICY IF EXISTS workflow_transitions_select ON public.workflow_transitions;

CREATE POLICY workflow_transitions_admin_select
  ON public.workflow_transitions
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY workflow_transitions_admin_insert
  ON public.workflow_transitions
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY workflow_transitions_admin_update
  ON public.workflow_transitions
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY workflow_transitions_admin_delete
  ON public.workflow_transitions
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- =========================
-- event_log
-- =========================
ALTER TABLE public.event_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS event_log_select ON public.event_log;
DROP POLICY IF EXISTS event_log_insert ON public.event_log;
DROP POLICY IF EXISTS event_log_update ON public.event_log;
DROP POLICY IF EXISTS event_log_delete ON public.event_log;

CREATE POLICY event_log_admin_select
  ON public.event_log
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY event_log_admin_insert
  ON public.event_log
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY event_log_admin_update
  ON public.event_log
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY event_log_admin_delete
  ON public.event_log
  FOR DELETE
  TO authenticated
  USING (is_admin());


