-- Harden RLS para kanban_metrics: colaborador só lê/insere métricas de cards do(s) seu(s) board(s) por área.
-- (evita vazamento cross-área via métricas)

ALTER TABLE public.kanban_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_metrics FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS kanban_metrics_select ON public.kanban_metrics;
DROP POLICY IF EXISTS kanban_metrics_insert ON public.kanban_metrics;
DROP POLICY IF EXISTS kanban_metrics_admin_all ON public.kanban_metrics;
DROP POLICY IF EXISTS kanban_metrics_employee_select ON public.kanban_metrics;
DROP POLICY IF EXISTS kanban_metrics_employee_insert ON public.kanban_metrics;

CREATE POLICY kanban_metrics_admin_all
  ON public.kanban_metrics
  FOR ALL
  TO public
  USING (is_admin())
  WITH CHECK (is_admin());

-- SELECT: somente métricas de cards cujo board pertença à(s) área(s) do colaborador
CREATE POLICY kanban_metrics_employee_select
  ON public.kanban_metrics
  FOR SELECT
  TO public
  USING (
    is_employee()
    AND EXISTS (
      SELECT 1
      FROM public.kanban_tasks t
      JOIN public.kanban_boards b ON b.id = t.board_id
      WHERE t.id::text = kanban_metrics.card_id
        AND b.area_key IS NOT NULL
        AND b.area_key = ANY (employee_area_keys())
    )
  );

-- INSERT: somente para cards do(s) board(s) do colaborador
CREATE POLICY kanban_metrics_employee_insert
  ON public.kanban_metrics
  FOR INSERT
  TO public
  WITH CHECK (
    is_employee()
    AND EXISTS (
      SELECT 1
      FROM public.kanban_tasks t
      JOIN public.kanban_boards b ON b.id = t.board_id
      WHERE t.id::text = kanban_metrics.card_id
        AND b.area_key IS NOT NULL
        AND b.area_key = ANY (employee_area_keys())
    )
  );


