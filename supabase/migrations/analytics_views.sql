-- =============================================
-- ANALYTICS VIEWS FOR DASHBOARD & GAMIFICATION
-- =============================================

-- 1. View: Gamificação Comercial (Foco: Receita e Vendas)
-- Calcula pontuação baseada em propostas aceitas e valor total vendido
CREATE OR REPLACE VIEW ranking_sales_view AS
SELECT 
    u.id as user_id,
    up.full_name,
    up.avatar,
    COUNT(p.id) FILTER (WHERE p.status = 'accepted') as deals_closed,
    COALESCE(SUM(p.total_value) FILTER (WHERE p.status = 'accepted'), 0) as total_revenue,
    -- Fórmula de Pontos: 100pts por venda + 1pt a cada R$100 vendidos
    (COUNT(p.id) FILTER (WHERE p.status = 'accepted') * 100) + 
    FLOOR(COALESCE(SUM(p.total_value) FILTER (WHERE p.status = 'accepted'), 0) / 100) as total_points,
    RANK() OVER (ORDER BY (COUNT(p.id) FILTER (WHERE p.status = 'accepted') * 100) + FLOOR(COALESCE(SUM(p.total_value) FILTER (WHERE p.status = 'accepted'), 0) / 100) DESC) as rank_position
FROM 
    auth.users u
JOIN 
    user_profiles up ON u.id = up.user_id
LEFT JOIN 
    proposals p ON u.id = p.sales_rep_id
WHERE 
    up.role::text IN ('comercial', 'sales', 'admin', 'super_admin')
GROUP BY 
    u.id, up.full_name, up.avatar;

-- 2. View: Gamificação Operacional (Foco: Eficiência e Qualidade)
-- Calcula pontuação baseada em tarefas concluídas, entregas no prazo e NPS
CREATE OR REPLACE VIEW ranking_ops_view AS
SELECT 
    u.id as user_id,
    up.full_name,
    up.avatar,
    COUNT(t.id) FILTER (WHERE t.status = 'done') as tasks_completed,
    -- Taxa de entrega no prazo (exemplo simplificado)
    COALESCE(AVG(CASE WHEN t.completed_at <= t.due_date THEN 100 ELSE 0 END) FILTER (WHERE t.status = 'done' AND t.due_date IS NOT NULL), 0) as on_time_rate,
    -- Pontuação simulada baseada em tarefas e conquistas
    (COUNT(t.id) FILTER (WHERE t.status = 'done') * 10) +
    COALESCE((SELECT SUM(points_awarded) FROM employee_achievements ea WHERE ea.employee_id = e.id), 0) as total_points,
    RANK() OVER (ORDER BY (COUNT(t.id) FILTER (WHERE t.status = 'done') * 10) + COALESCE((SELECT SUM(points_awarded) FROM employee_achievements ea WHERE ea.employee_id = e.id), 0) DESC) as rank_position
FROM 
    auth.users u
JOIN 
    user_profiles up ON u.id = up.user_id
JOIN
    employees e ON u.id = e.user_id
LEFT JOIN 
    kanban_tasks t ON u.id = t.assigned_to
WHERE 
    up.role::text NOT IN ('comercial', 'sales', 'client')
GROUP BY 
    u.id, e.id, up.full_name, up.avatar;

-- 3. View: Insights Web Designer (Tempo e Gargalos)
CREATE OR REPLACE VIEW designer_insights_view AS
SELECT 
    t.assigned_to as designer_id,
    t.column_id, -- Fase do processo
    kc.name as phase_name,
    COUNT(t.id) as task_count,
    AVG(EXTRACT(EPOCH FROM (NOW() - t.updated_at))/3600) as avg_hours_in_phase
FROM 
    kanban_tasks t
JOIN
    kanban_columns kc ON t.column_id = kc.id
JOIN
    user_profiles up ON t.assigned_to = up.user_id
WHERE 
    up.role::text IN ('web_designer', 'designer', 'employee')
    AND up.full_name ILIKE '%design%'
GROUP BY 
    t.assigned_to, t.column_id, kc.name;

-- 4. View: Alerta de Gargalos (Kanban Bottlenecks)
CREATE OR REPLACE VIEW kanban_bottlenecks_view AS
SELECT 
    b.name as board_name,
    c.name as column_name,
    COUNT(t.id) as card_count,
    CASE 
        WHEN COUNT(t.id) > 5 THEN 'critical'
        WHEN COUNT(t.id) > 3 THEN 'warning'
        ELSE 'normal'
    END as status
FROM 
    kanban_boards b
JOIN 
    kanban_columns c ON b.id = c.board_id
LEFT JOIN 
    kanban_tasks t ON c.id = t.column_id
WHERE 
    t.status != 'done' -- Ignora tarefas concluídas
GROUP BY 
    b.name, c.name
ORDER BY 
    card_count DESC;
