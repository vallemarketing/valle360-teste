-- 1. View de Oportunidades de Upsell (Radar de Vendas)
-- Cruza clientes ativos com serviços que eles ainda não contrataram
CREATE OR REPLACE VIEW view_upsell_opportunities AS
WITH active_clients AS (
    SELECT DISTINCT client_email, client_name
    FROM proposals
    WHERE active = TRUE
),
client_current_services AS (
    SELECT 
        p.client_email,
        (item->>'id')::UUID as service_id
    FROM proposals p
    CROSS JOIN jsonb_array_elements(p.items) as item
    WHERE p.active = TRUE
),
available_services AS (
    SELECT id, name, base_price, category FROM services WHERE active = TRUE
)
SELECT 
    ac.client_name,
    ac.client_email,
    s.id as service_id,
    s.name as service_name,
    s.category,
    s.base_price as potential_revenue,
    85 as probability_score -- Score fictício por enquanto, poderia ser calc baseado em categoria
FROM active_clients ac
CROSS JOIN available_services s
LEFT JOIN client_current_services ccs ON ac.client_email = ccs.client_email AND s.id = ccs.service_id
WHERE ccs.service_id IS NULL;

-- 2. View de Renovação de Contratos (Alertas de Vencimento)
-- Lista contratos vencendo nos próximos 45 dias
CREATE OR REPLACE VIEW view_expiring_contracts AS
SELECT 
    id as contract_id,
    client_name,
    client_email,
    total_value as contract_value,
    valid_until as expiration_date,
    EXTRACT(DAY FROM (valid_until - NOW()))::INT as days_remaining,
    CASE 
        WHEN EXTRACT(DAY FROM (valid_until - NOW())) < 15 THEN 'critical'
        WHEN EXTRACT(DAY FROM (valid_until - NOW())) < 30 THEN 'warning'
        ELSE 'info'
    END as urgency_level
FROM proposals
WHERE 
    active = TRUE 
    AND valid_until IS NOT NULL
    AND valid_until BETWEEN NOW() AND (NOW() + INTERVAL '45 days');

