-- Kanban: preencher automaticamente `reference_links.client_approval` quando a tarefa entra na coluna de Aprovação.
-- Isso sustenta o portal do cliente (/cliente/producao + /cliente/aprovacoes) com SLA e cobranças.

-- Garantir coluna reference_links exista (drift)
ALTER TABLE public.kanban_tasks
  ADD COLUMN IF NOT EXISTS reference_links jsonb;

CREATE OR REPLACE FUNCTION public._kanban_set_client_approval()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  new_stage text;
  old_stage text;
  sla integer;
  requested_at timestamptz;
  due_at timestamptz;
  ref jsonb;
  approval jsonb;
BEGIN
  -- stage da coluna nova
  SELECT c.stage_key, COALESCE(c.sla_hours, 48)
    INTO new_stage, sla
  FROM public.kanban_columns c
  WHERE c.id = NEW.column_id;

  -- stage da coluna antiga (se existir)
  IF TG_OP = 'UPDATE' THEN
    SELECT c.stage_key
      INTO old_stage
    FROM public.kanban_columns c
    WHERE c.id = OLD.column_id;
  ELSE
    old_stage := NULL;
  END IF;

  -- Entrou em aprovação agora (não era aprovação antes)
  IF new_stage = 'aprovacao' AND (TG_OP = 'INSERT' OR old_stage IS DISTINCT FROM 'aprovacao') THEN
    ref := COALESCE(NEW.reference_links, '{}'::jsonb);
    approval := COALESCE(ref->'client_approval', '{}'::jsonb);

    -- Sempre "abre" uma nova janela de aprovação ao entrar na coluna (SLA reinicia).
    requested_at := now();
    due_at := requested_at + make_interval(hours => sla);

    approval := jsonb_set(approval, '{requested_at}', to_jsonb(requested_at), true);
    approval := jsonb_set(approval, '{due_at}', to_jsonb(due_at), true);
    approval := jsonb_set(approval, '{status}', to_jsonb('pending'::text), true);
    approval := jsonb_set(approval, '{last_action_at}', 'null'::jsonb, true);
    approval := jsonb_set(approval, '{last_action_by}', 'null'::jsonb, true);

    ref := jsonb_set(ref, '{client_approval}', approval, true);
    NEW.reference_links := ref;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_kanban_set_client_approval_on_update ON public.kanban_tasks;
CREATE TRIGGER trg_kanban_set_client_approval_on_update
BEFORE UPDATE OF column_id ON public.kanban_tasks
FOR EACH ROW
EXECUTE FUNCTION public._kanban_set_client_approval();

DROP TRIGGER IF EXISTS trg_kanban_set_client_approval_on_insert ON public.kanban_tasks;
CREATE TRIGGER trg_kanban_set_client_approval_on_insert
BEFORE INSERT ON public.kanban_tasks
FOR EACH ROW
EXECUTE FUNCTION public._kanban_set_client_approval();


