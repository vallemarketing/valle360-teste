-- Seed idempotente dos boards por área + colunas reais (Kanban por Área)
-- Fonte de verdade no app: src/lib/kanban/areaBoards.ts

-- 1) Garantir colunas esperadas (para ambientes com drift)
ALTER TABLE public.kanban_boards
  ADD COLUMN IF NOT EXISTS area_key text;

ALTER TABLE public.kanban_columns
  ADD COLUMN IF NOT EXISTS stage_key text;

ALTER TABLE public.kanban_columns
  ADD COLUMN IF NOT EXISTS sla_hours integer;

-- 2) Garantir índices/uniqueness para idempotência
-- Um board global por área (area_key não nulo deve ser único)
CREATE UNIQUE INDEX IF NOT EXISTS kanban_boards_area_key_uniq
  ON public.kanban_boards (area_key)
  WHERE area_key IS NOT NULL;

-- stage_key único por board (apenas quando stage_key não nulo)
CREATE UNIQUE INDEX IF NOT EXISTS kanban_columns_board_stage_key_uniq
  ON public.kanban_columns (board_id, stage_key)
  WHERE stage_key IS NOT NULL;

-- 3) Upsert de boards por área (globais; client_id = NULL)
INSERT INTO public.kanban_boards (name, description, client_id, is_active, area_key)
VALUES
  ('Designer Gráfico', 'Board por área (automático)', NULL, TRUE, 'designer_grafico'),
  ('Social Media', 'Board por área (automático)', NULL, TRUE, 'social_media'),
  ('Head de Marketing', 'Board por área (automático)', NULL, TRUE, 'head_marketing'),
  ('Tráfego Pago', 'Board por área (automático)', NULL, TRUE, 'trafego_pago'),
  ('Vídeo Maker / Editor', 'Board por área (automático)', NULL, TRUE, 'video_maker'),
  ('Webdesigner', 'Board por área (automático)', NULL, TRUE, 'webdesigner'),
  ('Copywriting', 'Board por área (automático)', NULL, TRUE, 'copywriting'),
  ('Comercial', 'Board por área (automático)', NULL, TRUE, 'comercial'),
  ('Jurídico', 'Board por área (automático)', NULL, TRUE, 'juridico'),
  ('Contratos', 'Board por área (automático)', NULL, TRUE, 'contratos'),
  ('Operação', 'Board por área (automático)', NULL, TRUE, 'operacao'),
  ('Notificações', 'Board por área (automático)', NULL, TRUE, 'notificacoes'),
  ('Financeiro (Contas a Pagar)', 'Board por área (automático)', NULL, TRUE, 'financeiro_pagar'),
  ('Financeiro (Contas a Receber)', 'Board por área (automático)', NULL, TRUE, 'financeiro_receber'),
  ('RH', 'Board por área (automático)', NULL, TRUE, 'rh')
ON CONFLICT (area_key)
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = TRUE;

-- 4) Upsert de colunas por área (stage_key único por board)
-- Helper macro: cada bloco "WITH b AS (...)" mantém o SQL simples e idempotente.

-- Designer Gráfico
WITH b AS (SELECT id AS board_id FROM public.kanban_boards WHERE area_key = 'designer_grafico')
INSERT INTO public.kanban_columns (board_id, name, position, color, wip_limit, stage_key, sla_hours)
SELECT board_id, x.name, x.position, x.color, x.wip_limit, x.stage_key, x.sla_hours
FROM b,
LATERAL (VALUES
  ('Demanda', 1, '#6B7280', NULL::int, 'demanda', NULL::int),
  ('Escopo', 2, '#F59E0B', NULL::int, 'escopo', NULL::int),
  ('Produção', 3, '#3B82F6', NULL::int, 'producao', NULL::int),
  ('Revisão Interna', 4, '#8B5CF6', NULL::int, 'revisao_interna', NULL::int),
  ('Envio para Aprovação', 5, '#6366F1', NULL::int, 'aprovacao', 48),
  ('Ajustes', 6, '#EC4899', NULL::int, 'ajustes', NULL::int),
  ('Finalizado', 7, '#10B981', NULL::int, 'finalizado', NULL::int),
  ('Bloqueado', 8, '#EF4444', NULL::int, 'bloqueado', NULL::int)
) AS x(name, position, color, wip_limit, stage_key, sla_hours)
ON CONFLICT (board_id, stage_key)
DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, color = EXCLUDED.color, wip_limit = EXCLUDED.wip_limit, sla_hours = EXCLUDED.sla_hours;

-- Social Media
WITH b AS (SELECT id AS board_id FROM public.kanban_boards WHERE area_key = 'social_media')
INSERT INTO public.kanban_columns (board_id, name, position, color, wip_limit, stage_key, sla_hours)
SELECT board_id, x.name, x.position, x.color, x.wip_limit, x.stage_key, x.sla_hours
FROM b,
LATERAL (VALUES
  ('Demanda', 1, '#6B7280', NULL::int, 'demanda', NULL::int),
  ('Escopo', 2, '#F59E0B', NULL::int, 'escopo', NULL::int),
  ('Planejamento', 3, '#3B82F6', NULL::int, 'planejamento', NULL::int),
  ('Produção', 4, '#8B5CF6', NULL::int, 'producao', NULL::int),
  ('Revisão Interna', 5, '#6366F1', NULL::int, 'revisao_interna', NULL::int),
  ('Aprovação', 6, '#14B8A6', NULL::int, 'aprovacao', 48),
  ('Ajustes', 7, '#EC4899', NULL::int, 'ajustes', NULL::int),
  ('Agendamento/Publicação', 8, '#F59E0B', NULL::int, 'agendamento_publicacao', NULL::int),
  ('Finalizado', 9, '#10B981', NULL::int, 'finalizado', NULL::int),
  ('Bloqueado', 10, '#EF4444', NULL::int, 'bloqueado', NULL::int)
) AS x(name, position, color, wip_limit, stage_key, sla_hours)
ON CONFLICT (board_id, stage_key)
DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, color = EXCLUDED.color, wip_limit = EXCLUDED.wip_limit, sla_hours = EXCLUDED.sla_hours;

-- Head de Marketing
WITH b AS (SELECT id AS board_id FROM public.kanban_boards WHERE area_key = 'head_marketing')
INSERT INTO public.kanban_columns (board_id, name, position, color, wip_limit, stage_key, sla_hours)
SELECT board_id, x.name, x.position, x.color, x.wip_limit, x.stage_key, x.sla_hours
FROM b,
LATERAL (VALUES
  ('Demanda', 1, '#6B7280', 20, 'demanda', NULL::int),
  ('Diagnóstico', 2, '#F59E0B', NULL::int, 'diagnostico', NULL::int),
  ('Briefing/Escopo', 3, '#3B82F6', NULL::int, 'briefing_escopo', NULL::int),
  ('Estratégia', 4, '#8B5CF6', NULL::int, 'estrategia', NULL::int),
  ('Planejamento/Timeline', 5, '#6366F1', NULL::int, 'timeline', NULL::int),
  ('Execução', 6, '#14B8A6', NULL::int, 'execucao', NULL::int),
  ('Revisão Interna', 7, '#EC4899', NULL::int, 'revisao_interna', NULL::int),
  ('Aprovação', 8, '#F59E0B', NULL::int, 'aprovacao', 48),
  ('Ajustes', 9, '#EF4444', NULL::int, 'ajustes', NULL::int),
  ('Lançamento', 10, '#3B82F6', NULL::int, 'lancamento', NULL::int),
  ('Otimização', 11, '#8B5CF6', NULL::int, 'otimizacao', NULL::int),
  ('Finalizado', 12, '#10B981', NULL::int, 'finalizado', NULL::int),
  ('Bloqueado', 13, '#EF4444', NULL::int, 'bloqueado', NULL::int)
) AS x(name, position, color, wip_limit, stage_key, sla_hours)
ON CONFLICT (board_id, stage_key)
DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, color = EXCLUDED.color, wip_limit = EXCLUDED.wip_limit, sla_hours = EXCLUDED.sla_hours;

-- Tráfego Pago
WITH b AS (SELECT id AS board_id FROM public.kanban_boards WHERE area_key = 'trafego_pago')
INSERT INTO public.kanban_columns (board_id, name, position, color, wip_limit, stage_key, sla_hours)
SELECT board_id, x.name, x.position, x.color, x.wip_limit, x.stage_key, x.sla_hours
FROM b,
LATERAL (VALUES
  ('Demanda', 1, '#6B7280', NULL::int, 'demanda', NULL::int),
  ('Escopo', 2, '#F59E0B', NULL::int, 'escopo', NULL::int),
  ('Setup/Tracking', 3, '#3B82F6', NULL::int, 'setup_tracking', NULL::int),
  ('Criação de Campanhas', 4, '#8B5CF6', NULL::int, 'criacao_campanhas', NULL::int),
  ('Revisão/Checklist', 5, '#6366F1', NULL::int, 'revisao_checklist', NULL::int),
  ('Publicação', 6, '#14B8A6', NULL::int, 'publicacao', NULL::int),
  ('Otimização', 7, '#F59E0B', NULL::int, 'otimizacao', NULL::int),
  ('Relatório', 8, '#3B82F6', NULL::int, 'relatorio', NULL::int),
  ('Finalizado', 9, '#10B981', NULL::int, 'finalizado', NULL::int),
  ('Bloqueado', 10, '#EF4444', NULL::int, 'bloqueado', NULL::int)
) AS x(name, position, color, wip_limit, stage_key, sla_hours)
ON CONFLICT (board_id, stage_key)
DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, color = EXCLUDED.color, wip_limit = EXCLUDED.wip_limit, sla_hours = EXCLUDED.sla_hours;

-- Vídeo Maker / Editor
WITH b AS (SELECT id AS board_id FROM public.kanban_boards WHERE area_key = 'video_maker')
INSERT INTO public.kanban_columns (board_id, name, position, color, wip_limit, stage_key, sla_hours)
SELECT board_id, x.name, x.position, x.color, x.wip_limit, x.stage_key, x.sla_hours
FROM b,
LATERAL (VALUES
  ('Demanda', 1, '#6B7280', NULL::int, 'demanda', NULL::int),
  ('Escopo', 2, '#F59E0B', NULL::int, 'escopo', NULL::int),
  ('Roteiro/Storyboard', 3, '#3B82F6', NULL::int, 'roteiro_storyboard', NULL::int),
  ('Captação/Assets', 4, '#8B5CF6', NULL::int, 'captacao_assets', NULL::int),
  ('Edição', 5, '#6366F1', NULL::int, 'edicao', NULL::int),
  ('Revisão Interna', 6, '#EC4899', NULL::int, 'revisao_interna', NULL::int),
  ('Aprovação', 7, '#14B8A6', NULL::int, 'aprovacao', 48),
  ('Ajustes', 8, '#F59E0B', NULL::int, 'ajustes', NULL::int),
  ('Finalizado', 9, '#10B981', NULL::int, 'finalizado', NULL::int),
  ('Bloqueado', 10, '#EF4444', NULL::int, 'bloqueado', NULL::int)
) AS x(name, position, color, wip_limit, stage_key, sla_hours)
ON CONFLICT (board_id, stage_key)
DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, color = EXCLUDED.color, wip_limit = EXCLUDED.wip_limit, sla_hours = EXCLUDED.sla_hours;

-- Webdesigner
WITH b AS (SELECT id AS board_id FROM public.kanban_boards WHERE area_key = 'webdesigner')
INSERT INTO public.kanban_columns (board_id, name, position, color, wip_limit, stage_key, sla_hours)
SELECT board_id, x.name, x.position, x.color, x.wip_limit, x.stage_key, x.sla_hours
FROM b,
LATERAL (VALUES
  ('Demanda', 1, '#6B7280', NULL::int, 'demanda', NULL::int),
  ('Escopo', 2, '#F59E0B', NULL::int, 'escopo', NULL::int),
  ('Wireframe/Estrutura', 3, '#3B82F6', NULL::int, 'wireframe_estrutura', NULL::int),
  ('Design (Figma)', 4, '#8B5CF6', NULL::int, 'design_figma', NULL::int),
  ('Implementação', 5, '#6366F1', NULL::int, 'implementacao', NULL::int),
  ('SEO/Tracking/Integrações', 6, '#14B8A6', NULL::int, 'seo_tracking_integracoes', NULL::int),
  ('Revisão Interna', 7, '#EC4899', NULL::int, 'revisao_interna', NULL::int),
  ('Envio para Aprovação', 8, '#F59E0B', NULL::int, 'aprovacao', 48),
  ('Ajustes Pós-Aprovação', 9, '#8B5CF6', NULL::int, 'ajustes_pos_aprovacao', NULL::int),
  ('Publicação', 10, '#3B82F6', NULL::int, 'publicacao', NULL::int),
  ('Finalizado', 11, '#10B981', NULL::int, 'finalizado', NULL::int),
  ('Bloqueado', 12, '#EF4444', NULL::int, 'bloqueado', NULL::int)
) AS x(name, position, color, wip_limit, stage_key, sla_hours)
ON CONFLICT (board_id, stage_key)
DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, color = EXCLUDED.color, wip_limit = EXCLUDED.wip_limit, sla_hours = EXCLUDED.sla_hours;

-- Copywriting
WITH b AS (SELECT id AS board_id FROM public.kanban_boards WHERE area_key = 'copywriting')
INSERT INTO public.kanban_columns (board_id, name, position, color, wip_limit, stage_key, sla_hours)
SELECT board_id, x.name, x.position, x.color, x.wip_limit, x.stage_key, x.sla_hours
FROM b,
LATERAL (VALUES
  ('Demanda', 1, '#6B7280', NULL::int, 'demanda', NULL::int),
  ('Escopo', 2, '#F59E0B', NULL::int, 'escopo', NULL::int),
  ('Pesquisa', 3, '#3B82F6', NULL::int, 'pesquisa', NULL::int),
  ('Escrita', 4, '#8B5CF6', NULL::int, 'escrita', NULL::int),
  ('Revisão Interna', 5, '#6366F1', NULL::int, 'revisao_interna', NULL::int),
  ('Aprovação', 6, '#14B8A6', NULL::int, 'aprovacao', 48),
  ('Finalizado', 7, '#10B981', NULL::int, 'finalizado', NULL::int),
  ('Bloqueado', 8, '#EF4444', NULL::int, 'bloqueado', NULL::int)
) AS x(name, position, color, wip_limit, stage_key, sla_hours)
ON CONFLICT (board_id, stage_key)
DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, color = EXCLUDED.color, wip_limit = EXCLUDED.wip_limit, sla_hours = EXCLUDED.sla_hours;

-- Comercial
WITH b AS (SELECT id AS board_id FROM public.kanban_boards WHERE area_key = 'comercial')
INSERT INTO public.kanban_columns (board_id, name, position, color, wip_limit, stage_key, sla_hours)
SELECT board_id, x.name, x.position, x.color, x.wip_limit, x.stage_key, x.sla_hours
FROM b,
LATERAL (VALUES
  ('Lead/Demanda', 1, '#6B7280', NULL::int, 'lead_demanda', NULL::int),
  ('Qualificação', 2, '#F59E0B', NULL::int, 'qualificacao', NULL::int),
  ('Proposta', 3, '#3B82F6', NULL::int, 'proposta', NULL::int),
  ('Negociação', 4, '#8B5CF6', NULL::int, 'negociacao', NULL::int),
  ('Fechamento', 5, '#6366F1', NULL::int, 'fechamento', NULL::int),
  ('Handoff (Passagem)', 6, '#14B8A6', NULL::int, 'handoff_passagem', NULL::int),
  ('Finalizado', 7, '#10B981', NULL::int, 'finalizado', NULL::int),
  ('Bloqueado', 8, '#EF4444', NULL::int, 'bloqueado', NULL::int)
) AS x(name, position, color, wip_limit, stage_key, sla_hours)
ON CONFLICT (board_id, stage_key)
DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, color = EXCLUDED.color, wip_limit = EXCLUDED.wip_limit, sla_hours = EXCLUDED.sla_hours;

-- Jurídico
WITH b AS (SELECT id AS board_id FROM public.kanban_boards WHERE area_key = 'juridico')
INSERT INTO public.kanban_columns (board_id, name, position, color, wip_limit, stage_key, sla_hours)
SELECT board_id, x.name, x.position, x.color, x.wip_limit, x.stage_key, x.sla_hours
FROM b,
LATERAL (VALUES
  ('Demanda', 1, '#6B7280', NULL::int, 'demanda', NULL::int),
  ('Escopo', 2, '#F59E0B', NULL::int, 'escopo', NULL::int),
  ('Produção', 3, '#3B82F6', NULL::int, 'producao', NULL::int),
  ('Revisão Interna', 4, '#8B5CF6', NULL::int, 'revisao_interna', NULL::int),
  ('Aprovação', 5, '#14B8A6', NULL::int, 'aprovacao', 48),
  ('Ajustes', 6, '#EC4899', NULL::int, 'ajustes', NULL::int),
  ('Finalizado', 7, '#10B981', NULL::int, 'finalizado', NULL::int),
  ('Bloqueado', 8, '#EF4444', NULL::int, 'bloqueado', NULL::int)
) AS x(name, position, color, wip_limit, stage_key, sla_hours)
ON CONFLICT (board_id, stage_key)
DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, color = EXCLUDED.color, wip_limit = EXCLUDED.wip_limit, sla_hours = EXCLUDED.sla_hours;

-- Contratos
WITH b AS (SELECT id AS board_id FROM public.kanban_boards WHERE area_key = 'contratos')
INSERT INTO public.kanban_columns (board_id, name, position, color, wip_limit, stage_key, sla_hours)
SELECT board_id, x.name, x.position, x.color, x.wip_limit, x.stage_key, x.sla_hours
FROM b,
LATERAL (VALUES
  ('Demanda', 1, '#6B7280', NULL::int, 'demanda', NULL::int),
  ('Escopo', 2, '#F59E0B', NULL::int, 'escopo', NULL::int),
  ('Elaboração', 3, '#3B82F6', NULL::int, 'elaboracao', NULL::int),
  ('Revisão Interna', 4, '#8B5CF6', NULL::int, 'revisao_interna', NULL::int),
  ('Aprovação', 5, '#14B8A6', NULL::int, 'aprovacao', 48),
  ('Ajustes', 6, '#EC4899', NULL::int, 'ajustes', NULL::int),
  ('Finalizado', 7, '#10B981', NULL::int, 'finalizado', NULL::int),
  ('Bloqueado', 8, '#EF4444', NULL::int, 'bloqueado', NULL::int)
) AS x(name, position, color, wip_limit, stage_key, sla_hours)
ON CONFLICT (board_id, stage_key)
DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, color = EXCLUDED.color, wip_limit = EXCLUDED.wip_limit, sla_hours = EXCLUDED.sla_hours;

-- Operação
WITH b AS (SELECT id AS board_id FROM public.kanban_boards WHERE area_key = 'operacao')
INSERT INTO public.kanban_columns (board_id, name, position, color, wip_limit, stage_key, sla_hours)
SELECT board_id, x.name, x.position, x.color, x.wip_limit, x.stage_key, x.sla_hours
FROM b,
LATERAL (VALUES
  ('Demanda', 1, '#6B7280', NULL::int, 'demanda', NULL::int),
  ('Execução', 2, '#3B82F6', NULL::int, 'execucao', NULL::int),
  ('Revisão', 3, '#8B5CF6', NULL::int, 'revisao_interna', NULL::int),
  ('Finalizado', 4, '#10B981', NULL::int, 'finalizado', NULL::int),
  ('Bloqueado', 5, '#EF4444', NULL::int, 'bloqueado', NULL::int)
) AS x(name, position, color, wip_limit, stage_key, sla_hours)
ON CONFLICT (board_id, stage_key)
DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, color = EXCLUDED.color, wip_limit = EXCLUDED.wip_limit, sla_hours = EXCLUDED.sla_hours;

-- Notificações
WITH b AS (SELECT id AS board_id FROM public.kanban_boards WHERE area_key = 'notificacoes')
INSERT INTO public.kanban_columns (board_id, name, position, color, wip_limit, stage_key, sla_hours)
SELECT board_id, x.name, x.position, x.color, x.wip_limit, x.stage_key, x.sla_hours
FROM b,
LATERAL (VALUES
  ('Inbox', 1, '#6B7280', NULL::int, 'inbox', NULL::int),
  ('Preparar', 2, '#F59E0B', NULL::int, 'preparar', NULL::int),
  ('Enviar', 3, '#3B82F6', NULL::int, 'enviar', NULL::int),
  ('Finalizado', 4, '#10B981', NULL::int, 'finalizado', NULL::int),
  ('Bloqueado', 5, '#EF4444', NULL::int, 'bloqueado', NULL::int)
) AS x(name, position, color, wip_limit, stage_key, sla_hours)
ON CONFLICT (board_id, stage_key)
DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, color = EXCLUDED.color, wip_limit = EXCLUDED.wip_limit, sla_hours = EXCLUDED.sla_hours;

-- Financeiro (Pagar)
WITH b AS (SELECT id AS board_id FROM public.kanban_boards WHERE area_key = 'financeiro_pagar')
INSERT INTO public.kanban_columns (board_id, name, position, color, wip_limit, stage_key, sla_hours)
SELECT board_id, x.name, x.position, x.color, x.wip_limit, x.stage_key, x.sla_hours
FROM b,
LATERAL (VALUES
  ('Demanda', 1, '#6B7280', NULL::int, 'demanda', NULL::int),
  ('Escopo', 2, '#F59E0B', NULL::int, 'escopo', NULL::int),
  ('Processamento', 3, '#3B82F6', NULL::int, 'processamento', NULL::int),
  ('Validação', 4, '#8B5CF6', NULL::int, 'validacao', NULL::int),
  ('Aprovação', 5, '#14B8A6', NULL::int, 'aprovacao', 48),
  ('Finalizado', 6, '#10B981', NULL::int, 'finalizado', NULL::int),
  ('Bloqueado', 7, '#EF4444', NULL::int, 'bloqueado', NULL::int)
) AS x(name, position, color, wip_limit, stage_key, sla_hours)
ON CONFLICT (board_id, stage_key)
DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, color = EXCLUDED.color, wip_limit = EXCLUDED.wip_limit, sla_hours = EXCLUDED.sla_hours;

-- Financeiro (Receber)
WITH b AS (SELECT id AS board_id FROM public.kanban_boards WHERE area_key = 'financeiro_receber')
INSERT INTO public.kanban_columns (board_id, name, position, color, wip_limit, stage_key, sla_hours)
SELECT board_id, x.name, x.position, x.color, x.wip_limit, x.stage_key, x.sla_hours
FROM b,
LATERAL (VALUES
  ('Demanda', 1, '#6B7280', NULL::int, 'demanda', NULL::int),
  ('Escopo', 2, '#F59E0B', NULL::int, 'escopo', NULL::int),
  ('Processamento', 3, '#3B82F6', NULL::int, 'processamento', NULL::int),
  ('Validação', 4, '#8B5CF6', NULL::int, 'validacao', NULL::int),
  ('Aprovação', 5, '#14B8A6', NULL::int, 'aprovacao', 48),
  ('Finalizado', 6, '#10B981', NULL::int, 'finalizado', NULL::int),
  ('Bloqueado', 7, '#EF4444', NULL::int, 'bloqueado', NULL::int)
) AS x(name, position, color, wip_limit, stage_key, sla_hours)
ON CONFLICT (board_id, stage_key)
DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, color = EXCLUDED.color, wip_limit = EXCLUDED.wip_limit, sla_hours = EXCLUDED.sla_hours;

-- RH
WITH b AS (SELECT id AS board_id FROM public.kanban_boards WHERE area_key = 'rh')
INSERT INTO public.kanban_columns (board_id, name, position, color, wip_limit, stage_key, sla_hours)
SELECT board_id, x.name, x.position, x.color, x.wip_limit, x.stage_key, x.sla_hours
FROM b,
LATERAL (VALUES
  ('Demanda', 1, '#6B7280', NULL::int, 'demanda', NULL::int),
  ('Análise', 2, '#F59E0B', NULL::int, 'analise', NULL::int),
  ('Aprovação', 3, '#14B8A6', NULL::int, 'aprovacao', 48),
  ('Finalizado', 4, '#10B981', NULL::int, 'finalizado', NULL::int),
  ('Bloqueado', 5, '#EF4444', NULL::int, 'bloqueado', NULL::int)
) AS x(name, position, color, wip_limit, stage_key, sla_hours)
ON CONFLICT (board_id, stage_key)
DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, color = EXCLUDED.color, wip_limit = EXCLUDED.wip_limit, sla_hours = EXCLUDED.sla_hours;


