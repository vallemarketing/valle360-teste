-- =====================================================================================
-- Migration: Simulador de ROI para Cliente
-- Descrição: Calculadora interativa de ROI para vendas, com projeções personalizadas
-- Versão: 1.0
-- Data: 2025-11-12
-- =====================================================================================

CREATE TABLE IF NOT EXISTS roi_simulator_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID REFERENCES service_catalog(id) ON DELETE CASCADE,
    industry VARCHAR(100),
    
    -- Benchmarks históricos
    avg_conversion_rate DECIMAL(5,2) DEFAULT 2.5,
    avg_lead_value DECIMAL(10,2) DEFAULT 500,
    avg_customer_lifetime_value DECIMAL(10,2) DEFAULT 5000,
    avg_roi_percent DECIMAL(6,2) DEFAULT 300,
    avg_payback_period_months INTEGER DEFAULT 6,
    
    -- Fórmulas
    roi_formula TEXT,
    calculation_variables JSONB,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roi_simulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    
    -- Inputs do cliente
    current_revenue DECIMAL(12,2),
    marketing_budget DECIMAL(10,2),
    target_leads INTEGER,
    target_revenue DECIMAL(12,2),
    time_horizon_months INTEGER,
    
    -- Serviços simulados
    services_selected JSONB NOT NULL,
    total_investment DECIMAL(10,2) NOT NULL,
    
    -- Outputs calculados
    projected_leads INTEGER,
    projected_conversions INTEGER,
    projected_revenue DECIMAL(12,2),
    projected_roi_percent DECIMAL(6,2),
    projected_roas DECIMAL(6,2),
    payback_period_months INTEGER,
    
    -- Detalhamento
    monthly_breakdown JSONB,
    confidence_level DECIMAL(5,2) DEFAULT 0,
    
    -- PDF gerado
    pdf_url VARCHAR(500),
    pdf_generated_at TIMESTAMP WITH TIME ZONE,
    
    -- Uso
    created_by UUID REFERENCES users(id),
    presented_to_client BOOLEAN DEFAULT false,
    included_in_proposal BOOLEAN DEFAULT false,
    proposal_id UUID REFERENCES generated_proposals(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_roi_simulations_lead ON roi_simulations(lead_id);
CREATE INDEX idx_roi_simulations_client ON roi_simulations(client_id);
CREATE INDEX idx_roi_simulations_proposal ON roi_simulations(proposal_id);

COMMENT ON TABLE roi_simulations IS 'Simulações de ROI para apresentar em vendas';

-- RLS
ALTER TABLE roi_simulator_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE roi_simulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY sales_team_roi_configs ON roi_simulator_configs FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role IN ('super_admin', 'admin', 'comercial'))
);

CREATE POLICY sales_team_roi_simulations ON roi_simulations FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role IN ('super_admin', 'admin', 'comercial'))
);

-- Trigger
CREATE TRIGGER update_roi_simulations_timestamp BEFORE UPDATE ON roi_simulations FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

COMMENT ON SCHEMA public IS 'Migration 33: Simulador de ROI';

