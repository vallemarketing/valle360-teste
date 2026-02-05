-- VERIFICAR TAREFAS CRIADAS POR APROVAÇÃO DE CONTEÚDO
-- Execute este script no SQL Editor do Supabase para ver as tarefas criadas

-- 1. Ver últimas tarefas criadas (geral)
SELECT 
    id,
    title,
    description,
    board_id,
    column_id,
    status,
    created_at,
    reference_links
FROM kanban_tasks
ORDER BY created_at DESC
LIMIT 10;

-- 2. Ver especificamente tarefas criadas por AI Draft (aprovações)
SELECT 
    id,
    title,
    description,
    board_id,
    column_id,
    status,
    created_at,
    reference_links->>'source' as source,
    reference_links->>'draft_id' as draft_id
FROM kanban_tasks
WHERE reference_links->>'source' = 'ai_draft'
ORDER BY created_at DESC;

-- 3. Ver boards disponíveis
SELECT 
    id,
    name,
    area_key,
    is_active,
    created_at
FROM kanban_boards
ORDER BY created_at DESC;

-- 4. Ver colunas por board
SELECT 
    kb.name as board_name,
    kc.id as column_id,
    kc.name as column_name,
    kc.stage_key,
    kc.position
FROM kanban_columns kc
JOIN kanban_boards kb ON kb.id = kc.board_id
ORDER BY kb.name, kc.position;

-- 5. Ver drafts aprovados (executados)
SELECT 
    id,
    action_type,
    action_payload->>'title' as title,
    status,
    executed_at,
    execution_result
FROM ai_executive_action_drafts
WHERE status = 'executed'
AND action_type = 'create_kanban_task'
ORDER BY executed_at DESC
LIMIT 5;
