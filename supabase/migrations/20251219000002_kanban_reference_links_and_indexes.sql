/*
  Kanban (padronização + índices)
  - Garante coluna reference_links e adiciona índices usados pela idempotência do Hub/Kanban.
*/

-- Garante referência para links externos (Hub, Stripe, etc.)
ALTER TABLE IF EXISTS public.kanban_tasks
  ADD COLUMN IF NOT EXISTS reference_links jsonb;

-- Índices úteis para o Kanban operar rápido (board/column/posição e filtros)
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_client_id ON public.kanban_tasks (client_id);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_status ON public.kanban_tasks (status);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_priority ON public.kanban_tasks (priority);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_board_column_position ON public.kanban_tasks (board_id, column_id, position);

-- Índice para idempotência: achar tarefa criada a partir de workflow_transition
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_reference_links_workflow_transition_id
  ON public.kanban_tasks ((reference_links->>'workflow_transition_id'));


