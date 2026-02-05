-- Harden RLS para Kanban por Área:
-- - Admin (is_admin) tem acesso total
-- - Colaborador (is_employee) só acessa boards/colunas/cards/comentários do(s) seu(s) board(s) por área (area_key ∈ employee_area_keys()).

-- kanban_boards
ALTER TABLE public.kanban_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_boards FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS kanban_boards_admin_all ON public.kanban_boards;
DROP POLICY IF EXISTS kanban_boards_employee_select ON public.kanban_boards;

CREATE POLICY kanban_boards_admin_all
  ON public.kanban_boards
  FOR ALL
  TO public
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY kanban_boards_employee_select
  ON public.kanban_boards
  FOR SELECT
  TO public
  USING (
    is_employee()
    AND area_key IS NOT NULL
    AND area_key = ANY (employee_area_keys())
  );

-- kanban_columns
ALTER TABLE public.kanban_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_columns FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS kanban_columns_admin_all ON public.kanban_columns;
DROP POLICY IF EXISTS kanban_columns_employee_select ON public.kanban_columns;

CREATE POLICY kanban_columns_admin_all
  ON public.kanban_columns
  FOR ALL
  TO public
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY kanban_columns_employee_select
  ON public.kanban_columns
  FOR SELECT
  TO public
  USING (
    is_employee()
    AND EXISTS (
      SELECT 1
      FROM public.kanban_boards b
      WHERE b.id = kanban_columns.board_id
        AND b.area_key IS NOT NULL
        AND b.area_key = ANY (employee_area_keys())
    )
  );

-- kanban_tasks
ALTER TABLE public.kanban_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_tasks FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS kanban_tasks_admin_all ON public.kanban_tasks;
DROP POLICY IF EXISTS kanban_tasks_employee_all ON public.kanban_tasks;

CREATE POLICY kanban_tasks_admin_all
  ON public.kanban_tasks
  FOR ALL
  TO public
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY kanban_tasks_employee_all
  ON public.kanban_tasks
  FOR ALL
  TO public
  USING (
    is_employee()
    AND EXISTS (
      SELECT 1
      FROM public.kanban_boards b
      WHERE b.id = kanban_tasks.board_id
        AND b.area_key IS NOT NULL
        AND b.area_key = ANY (employee_area_keys())
    )
  )
  WITH CHECK (
    is_employee()
    AND EXISTS (
      SELECT 1
      FROM public.kanban_boards b
      WHERE b.id = kanban_tasks.board_id
        AND b.area_key IS NOT NULL
        AND b.area_key = ANY (employee_area_keys())
    )
  );

-- kanban_task_comments
ALTER TABLE public.kanban_task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_task_comments FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS kanban_task_comments_admin_all ON public.kanban_task_comments;
DROP POLICY IF EXISTS kanban_task_comments_employee_all ON public.kanban_task_comments;

CREATE POLICY kanban_task_comments_admin_all
  ON public.kanban_task_comments
  FOR ALL
  TO public
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY kanban_task_comments_employee_all
  ON public.kanban_task_comments
  FOR ALL
  TO public
  USING (
    is_employee()
    AND EXISTS (
      SELECT 1
      FROM public.kanban_tasks t
      JOIN public.kanban_boards b ON b.id = t.board_id
      WHERE t.id = kanban_task_comments.task_id
        AND b.area_key IS NOT NULL
        AND b.area_key = ANY (employee_area_keys())
    )
  )
  WITH CHECK (
    is_employee()
    AND EXISTS (
      SELECT 1
      FROM public.kanban_tasks t
      JOIN public.kanban_boards b ON b.id = t.board_id
      WHERE t.id = kanban_task_comments.task_id
        AND b.area_key IS NOT NULL
        AND b.area_key = ANY (employee_area_keys())
    )
  );



