/*
  Hub (event_log + workflow_transitions)
  - Fonte da verdade para tabelas e índices usados pelo Admin Hub (/admin/fluxos)
  - Idempotente: CREATE TABLE IF NOT EXISTS + CREATE INDEX IF NOT EXISTS
*/

-- ============================================
-- event_log (hub)
-- ============================================

CREATE TABLE IF NOT EXISTS public.event_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  entity_type text,
  entity_id uuid,
  actor_user_id uuid,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  correlation_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

-- Índices básicos
CREATE INDEX IF NOT EXISTS event_log_status_idx ON public.event_log (status);
CREATE INDEX IF NOT EXISTS event_log_event_type_idx ON public.event_log (event_type);
CREATE INDEX IF NOT EXISTS event_log_created_at_idx ON public.event_log (created_at DESC);
CREATE INDEX IF NOT EXISTS event_log_correlation_id_idx ON public.event_log (correlation_id);
CREATE INDEX IF NOT EXISTS event_log_entity_id_idx ON public.event_log (entity_id);

-- Índices no payload (busca/filtragem por chaves mais comuns)
CREATE INDEX IF NOT EXISTS event_log_payload_client_id_idx ON public.event_log ((payload->>'client_id'));
CREATE INDEX IF NOT EXISTS event_log_payload_clientId_idx ON public.event_log ((payload->>'clientId'));
CREATE INDEX IF NOT EXISTS event_log_payload_invoice_id_idx ON public.event_log ((payload->>'invoice_id'));
CREATE INDEX IF NOT EXISTS event_log_payload_contract_id_idx ON public.event_log ((payload->>'contract_id'));
CREATE INDEX IF NOT EXISTS event_log_payload_proposal_id_idx ON public.event_log ((payload->>'proposal_id'));
CREATE INDEX IF NOT EXISTS event_log_payload_stripe_invoice_id_idx ON public.event_log ((payload->>'stripe_invoice_id'));

-- ============================================
-- workflow_transitions (hub)
-- ============================================

CREATE TABLE IF NOT EXISTS public.workflow_transitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_area varchar NOT NULL,
  to_area varchar NOT NULL,
  trigger_event varchar NOT NULL,
  data_payload jsonb DEFAULT '{}'::jsonb,
  status varchar DEFAULT 'pending',
  error_message text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_by uuid
);

-- Índices básicos
CREATE INDEX IF NOT EXISTS idx_workflow_transitions_status ON public.workflow_transitions (status);
CREATE INDEX IF NOT EXISTS idx_workflow_transitions_areas ON public.workflow_transitions (from_area, to_area);
CREATE INDEX IF NOT EXISTS idx_workflow_transitions_trigger_event ON public.workflow_transitions (trigger_event);
CREATE INDEX IF NOT EXISTS idx_workflow_transitions_created_at ON public.workflow_transitions (created_at DESC);

-- Índices no payload (idempotência + filtros)
CREATE INDEX IF NOT EXISTS idx_workflow_transitions_payload_source_event_id
  ON public.workflow_transitions ((data_payload->>'source_event_id'));
CREATE INDEX IF NOT EXISTS idx_workflow_transitions_payload_client_id
  ON public.workflow_transitions ((data_payload->>'client_id'));
CREATE INDEX IF NOT EXISTS idx_workflow_transitions_payload_invoice_id
  ON public.workflow_transitions ((data_payload->>'invoice_id'));
CREATE INDEX IF NOT EXISTS idx_workflow_transitions_payload_contract_id
  ON public.workflow_transitions ((data_payload->>'contract_id'));
CREATE INDEX IF NOT EXISTS idx_workflow_transitions_payload_proposal_id
  ON public.workflow_transitions ((data_payload->>'proposal_id'));
CREATE INDEX IF NOT EXISTS idx_workflow_transitions_payload_correlation_id
  ON public.workflow_transitions ((data_payload->>'correlation_id'));
CREATE INDEX IF NOT EXISTS idx_workflow_transitions_payload_kanban_task_id
  ON public.workflow_transitions ((data_payload->>'kanban_task_id'));
CREATE INDEX IF NOT EXISTS idx_workflow_transitions_payload_kanban_board_id
  ON public.workflow_transitions ((data_payload->>'kanban_board_id'));


