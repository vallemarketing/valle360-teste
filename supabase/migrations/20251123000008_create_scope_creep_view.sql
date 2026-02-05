-- View para Detector de Scope Creep
CREATE OR REPLACE VIEW view_scope_creep AS
WITH contract_deliverables AS (
    SELECT 
        c.client_id,
        cl.company_name as client_name,
        s.name as service_name,
        d.key as deliverable_type,
        d.value::int as contracted_qty
    FROM contracts c
    JOIN clients cl ON c.client_id = cl.id
    JOIN proposals p ON c.proposal_id = p.id
    CROSS JOIN jsonb_array_elements(p.items) as item
    JOIN services s ON (item->>'id')::UUID = s.id
    CROSS JOIN jsonb_each_text(s.deliverables) as d
    WHERE c.active = TRUE
),
task_counts AS (
    SELECT 
        client_id,
        CASE 
            WHEN title ILIKE '%vídeo%' OR title ILIKE '%video%' THEN 'videos'
            WHEN title ILIKE '%post%' THEN 'posts'
            WHEN title ILIKE '%story%' OR title ILIKE '%stories%' THEN 'stories'
            ELSE 'other'
        END as deliverable_type,
        COUNT(*) as produced_qty
    FROM kanban_tasks
    WHERE status IN ('done') -- Considerar concluídos
    GROUP BY 1, 2
)
SELECT 
    cd.client_id,
    cd.client_name,
    cd.service_name,
    cd.deliverable_type,
    cd.contracted_qty,
    COALESCE(tc.produced_qty, 0) as produced_qty,
    COALESCE(tc.produced_qty, 0) - cd.contracted_qty as excess_qty,
    CASE 
        WHEN COALESCE(tc.produced_qty, 0) > cd.contracted_qty THEN 'critical'
        WHEN COALESCE(tc.produced_qty, 0) = cd.contracted_qty THEN 'warning'
        ELSE 'normal'
    END as status
FROM contract_deliverables cd
LEFT JOIN task_counts tc ON cd.client_id = tc.client_id AND cd.deliverable_type = tc.deliverable_type;

