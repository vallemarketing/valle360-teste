-- Fix: legacy Kanban triggers assumed `kanban_tasks.column_id` was TEXT (e.g. 'done', 'todo').
-- Current schema uses UUID (FK -> public.kanban_columns.id). Old comparisons like:
--   IF NEW.column_id = 'done' THEN ...
-- force Postgres to cast 'done'::uuid and raise 22P02, breaking any Kanban move.
--
-- This migration:
-- - Drops the legacy triggers/functions (if present)
-- - Recreates safe versions that key off `status` instead of `column_id`
--
-- Safe to run multiple times.

-- 1) Drop legacy triggers/functions (if they exist)
DROP TRIGGER IF EXISTS trg_gamification_points ON public.kanban_tasks;
DROP FUNCTION IF EXISTS public.calculate_task_points();

DROP TRIGGER IF EXISTS trg_apply_gamification_penalty ON public.kanban_tasks;
DROP FUNCTION IF EXISTS public.apply_gamification_penalty();

DROP TRIGGER IF EXISTS trg_nps_survey ON public.kanban_tasks;
DROP FUNCTION IF EXISTS public.trigger_nps_survey();

DROP TRIGGER IF EXISTS trg_nps_on_complete ON public.kanban_tasks;
DROP FUNCTION IF EXISTS public.trigger_nps_request();

-- Some databases may contain an extra legacy trigger created outside migrations
-- (e.g. trg_penalty_late -> trigger_penalty_late_task) that also compares NEW.column_id to strings.
-- Drop it defensively if present.
DROP TRIGGER IF EXISTS trg_penalty_late ON public.kanban_tasks;
DROP FUNCTION IF EXISTS public.trigger_penalty_late_task();

-- 2) Recreate corrected versions (status-based)
CREATE OR REPLACE FUNCTION public.calculate_task_points()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_points INTEGER := 10;
  v_bonus INTEGER := 0;
  v_user_id UUID;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status = 'done' AND OLD.status IS DISTINCT FROM 'done' THEN
    IF NEW.created_at IS NOT NULL AND (EXTRACT(EPOCH FROM (NOW() - NEW.created_at)) < 172800) THEN
      v_bonus := 5;
    END IF;

    v_user_id := COALESCE(NEW.assigned_to, NEW.created_by);

    IF v_user_id IS NOT NULL THEN
      BEGIN
        INSERT INTO public.employee_gamification (user_id, points, reason, created_at)
        VALUES (v_user_id, v_points + v_bonus, 'Tarefa Concluída: ' || COALESCE(NEW.title, ''), NOW());
      EXCEPTION
        WHEN undefined_table OR undefined_column THEN
          NULL;
        WHEN OTHERS THEN
          NULL;
      END;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_gamification_points
AFTER UPDATE OF status ON public.kanban_tasks
FOR EACH ROW
EXECUTE FUNCTION public.calculate_task_points();

CREATE OR REPLACE FUNCTION public.apply_gamification_penalty()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  xp_loss INTEGER := 10;
  v_user_id UUID;
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.status = 'done'
     AND OLD.status IS DISTINCT FROM 'done'
     AND NEW.due_date IS NOT NULL
     AND NOW() > NEW.due_date THEN

    v_user_id := COALESCE(NEW.assigned_to, NEW.created_by);

    IF v_user_id IS NOT NULL THEN
      BEGIN
        INSERT INTO public.gamification_penalties (user_id, card_id, penalty_type, xp_deducted, reason, applied_at)
        VALUES (v_user_id, NEW.id::text, 'delay', xp_loss, 'Tarefa entregue com atraso', NOW());
      EXCEPTION
        WHEN undefined_table OR undefined_column THEN
          NULL;
        WHEN OTHERS THEN
          NULL;
      END;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_apply_gamification_penalty
AFTER UPDATE OF status ON public.kanban_tasks
FOR EACH ROW
EXECUTE FUNCTION public.apply_gamification_penalty();

CREATE OR REPLACE FUNCTION public.trigger_nps_survey()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status = 'done' AND OLD.status IS DISTINCT FROM 'done' THEN
    BEGIN
      INSERT INTO public.nps_surveys (task_id, status)
      VALUES (NEW.id, 'pending');
    EXCEPTION
      WHEN undefined_table OR undefined_column THEN
        NULL;
      WHEN OTHERS THEN
        NULL;
    END;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_nps_survey
AFTER UPDATE OF status ON public.kanban_tasks
FOR EACH ROW
EXECUTE FUNCTION public.trigger_nps_survey();

CREATE OR REPLACE FUNCTION public.trigger_nps_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status = 'done' AND OLD.status IS DISTINCT FROM 'done' THEN
    v_user_id := COALESCE(NEW.assigned_to, NEW.created_by);

    IF v_user_id IS NOT NULL THEN
      BEGIN
        INSERT INTO public.smart_alerts (user_id, type, message, severity)
        VALUES (
          v_user_id,
          'opportunity',
          'Tarefa concluída. Pesquisa de NPS enviada ao cliente.',
          'low'
        );
      EXCEPTION
        WHEN undefined_table OR undefined_column THEN
          NULL;
        WHEN OTHERS THEN
          NULL;
      END;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_nps_on_complete
AFTER UPDATE OF status ON public.kanban_tasks
FOR EACH ROW
EXECUTE FUNCTION public.trigger_nps_request();


