-- Epic 10: Enforce required fields server-side on Kanban stage moves
-- Goal: prevent bypassing UI validation by updating kanban_tasks.column_id directly.

-- 1) Source-of-truth table for requirements per stage_key
CREATE TABLE IF NOT EXISTS public.kanban_stage_requirements (
  stage_key text PRIMARY KEY,
  stage_group text NOT NULL,
  require_description boolean NOT NULL DEFAULT false,
  require_assigned_to boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2) Seed/Upsert mapping (derived from src/lib/kanban/areaBoards.ts)
WITH rows(stage_key, stage_group) AS (
  VALUES
    ('agendamento_publicacao', 'publicacao_entrega'),
    ('ajustes', 'ajustes'),
    ('ajustes_pos_aprovacao', 'ajustes'),
    ('analise', 'escopo'),
    ('aprovacao', 'aprovacao'),
    ('bloqueado', 'bloqueado'),
    ('briefing_escopo', 'escopo'),
    ('captacao_assets', 'producao'),
    ('criacao_campanhas', 'producao'),
    ('demanda', 'demanda'),
    ('design_figma', 'producao'),
    ('diagnostico', 'escopo'),
    ('edicao', 'producao'),
    ('elaboracao', 'producao'),
    ('enviar', 'publicacao_entrega'),
    ('escopo', 'escopo'),
    ('escrita', 'producao'),
    ('estrategia', 'planejamento'),
    ('execucao', 'producao'),
    ('fechamento', 'publicacao_entrega'),
    ('finalizado', 'finalizado'),
    ('handoff_passagem', 'publicacao_entrega'),
    ('implementacao', 'producao'),
    ('inbox', 'demanda'),
    ('lancamento', 'publicacao_entrega'),
    ('lead_demanda', 'demanda'),
    ('negociacao', 'producao'),
    ('otimizacao', 'producao'),
    ('pesquisa', 'planejamento'),
    ('planejamento', 'planejamento'),
    ('preparar', 'producao'),
    ('processamento', 'producao'),
    ('producao', 'producao'),
    ('proposta', 'producao'),
    ('publicacao', 'publicacao_entrega'),
    ('qualificacao', 'escopo'),
    ('relatorio', 'revisao_interna'),
    ('revisao_checklist', 'revisao_interna'),
    ('revisao_interna', 'revisao_interna'),
    ('roteiro_storyboard', 'planejamento'),
    ('seo_tracking_integracoes', 'revisao_interna'),
    ('setup_tracking', 'planejamento'),
    ('timeline', 'planejamento'),
    ('validacao', 'revisao_interna'),
    ('wireframe_estrutura', 'planejamento')
)
INSERT INTO public.kanban_stage_requirements (
  stage_key,
  stage_group,
  require_description,
  require_assigned_to
)
SELECT
  stage_key,
  stage_group,
  (stage_group <> 'demanda') AS require_description,
  (stage_group IN ('producao', 'revisao_interna', 'aprovacao', 'publicacao_entrega', 'finalizado')) AS require_assigned_to
FROM rows
ON CONFLICT (stage_key) DO UPDATE
SET
  stage_group = EXCLUDED.stage_group,
  require_description = EXCLUDED.require_description,
  require_assigned_to = EXCLUDED.require_assigned_to,
  updated_at = now();

-- 3) Trigger function
CREATE OR REPLACE FUNCTION public.validate_kanban_task_required_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_stage_key text;
  v_col_name text;
  v_req_desc boolean;
  v_req_assignee boolean;
BEGIN
  -- Resolve target stage_key/name from NEW.column_id
  SELECT c.stage_key, c.name
  INTO v_stage_key, v_col_name
  FROM public.kanban_columns c
  WHERE c.id = NEW.column_id;

  IF v_stage_key IS NULL THEN
    RETURN NEW;
  END IF;

  -- Load requirements (best-effort; if missing mapping, allow)
  SELECT r.require_description, r.require_assigned_to
  INTO v_req_desc, v_req_assignee
  FROM public.kanban_stage_requirements r
  WHERE r.stage_key = v_stage_key;

  IF v_req_desc IS NULL AND v_req_assignee IS NULL THEN
    RETURN NEW;
  END IF;

  IF COALESCE(v_req_desc, false) THEN
    IF NEW.description IS NULL OR btrim(NEW.description) = '' THEN
      RAISE EXCEPTION 'Descrição é obrigatória para mover para "%" (stage_key=%).', COALESCE(v_col_name, 'fase'), v_stage_key
        USING ERRCODE = '23514';
    END IF;
  END IF;

  IF COALESCE(v_req_assignee, false) THEN
    IF NEW.assigned_to IS NULL OR btrim(NEW.assigned_to::text) = '' THEN
      RAISE EXCEPTION 'Responsável é obrigatório para mover para "%" (stage_key=%).', COALESCE(v_col_name, 'fase'), v_stage_key
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 4) Triggers
DROP TRIGGER IF EXISTS trg_kanban_tasks_validate_required_fields_on_insert ON public.kanban_tasks;
CREATE TRIGGER trg_kanban_tasks_validate_required_fields_on_insert
BEFORE INSERT ON public.kanban_tasks
FOR EACH ROW
EXECUTE FUNCTION public.validate_kanban_task_required_fields();

DROP TRIGGER IF EXISTS trg_kanban_tasks_validate_required_fields_on_move ON public.kanban_tasks;
CREATE TRIGGER trg_kanban_tasks_validate_required_fields_on_move
BEFORE UPDATE OF column_id ON public.kanban_tasks
FOR EACH ROW
WHEN (NEW.column_id IS DISTINCT FROM OLD.column_id)
EXECUTE FUNCTION public.validate_kanban_task_required_fields();


