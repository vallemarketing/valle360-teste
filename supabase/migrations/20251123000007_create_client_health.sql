-- View de Saúde do Cliente (Churn Prediction)
CREATE OR REPLACE VIEW view_client_health AS
WITH active_contracts AS (
    SELECT 
        id as contract_id,
        client_name,
        client_email,
        total_value,
        created_at as contract_start
    FROM proposals
    WHERE active = TRUE
)
SELECT 
    ac.client_name,
    ac.client_email,
    ac.contract_id,
    ac.total_value,
    -- Score Simulado (0-100)
    -- Lógica: Valor mais alto tende a ter score melhor (exemplo)
    -- Em produção: Integrar com tabela de pagamentos e suporte
    GREATEST(LEAST(FLOOR(70 + (RANDOM() * 30)), 100), 0)::INT as health_score,
    
    CASE 
        WHEN RANDOM() > 0.7 THEN 'increasing'
        WHEN RANDOM() < 0.3 THEN 'decreasing'
        ELSE 'stable'
    END as trend,
    
    CASE 
        WHEN RANDOM() < 0.15 THEN 'high'
        WHEN RANDOM() < 0.4 THEN 'medium'
        ELSE 'low'
    END as churn_risk
FROM active_contracts ac;

