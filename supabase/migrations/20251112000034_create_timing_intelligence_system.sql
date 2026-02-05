-- =====================================================================================
-- Migration: Inteligência de Timing (Quando Vender)
-- Descrição: IA prevê melhor momento para contatar, propor, fechar
-- Versão: 1.0
-- Data: 2025-11-12
-- =====================================================================================

CREATE TABLE IF NOT EXISTS contact_timing_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Padrões identificados
    best_day_of_week INTEGER, -- 0=domingo, 6=sábado
    best_time_of_day TIME,
    best_channel VARCHAR(50), -- 'whatsapp', 'email', 'call'
    
    -- Comportamento
    response_time_hours DECIMAL(6,2), -- Tempo médio de resposta
    engagement_window_hours INTEGER, -- Janela onde está mais engajado
    
    -- Análise
    response_rate_by_day JSONB, -- {monday: 0.75, tuesday: 0.85, ...}
    response_rate_by_hour JSONB, -- {9: 0.45, 10: 0.65, ...}
    response_rate_by_channel JSONB,
    
    -- Predições
    optimal_next_contact TIMESTAMP WITH TIME ZONE,
    confidence_score DECIMAL(5,2),
    
    last_analyzed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS optimal_timing_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    
    -- Sugestão
    suggestion_type VARCHAR(50), -- 'call_now', 'send_proposal_tomorrow', 'wait_3_days', 'follow_up_friday'
    suggested_action VARCHAR(255) NOT NULL,
    suggested_timing TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Razão
    reasoning TEXT,
    supporting_data JSONB,
    
    -- Scoring
    urgency_score DECIMAL(5,2), -- 0-100
    success_probability DECIMAL(5,2), -- 0-100
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'dismissed', 'executed'
    executed_at TIMESTAMP WITH TIME ZONE,
    execution_result TEXT,
    
    -- IA
    model_version VARCHAR(50),
    confidence_score DECIMAL(5,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_timing_patterns_lead ON contact_timing_patterns(lead_id);
CREATE INDEX idx_timing_patterns_client ON contact_timing_patterns(client_id);
CREATE INDEX idx_timing_suggestions_lead ON optimal_timing_suggestions(lead_id);
CREATE INDEX idx_timing_suggestions_status ON optimal_timing_suggestions(status);
CREATE INDEX idx_timing_suggestions_timing ON optimal_timing_suggestions(suggested_timing);

COMMENT ON TABLE contact_timing_patterns IS 'Padrões de melhor timing para contatar cada lead/cliente';
COMMENT ON TABLE optimal_timing_suggestions IS 'Sugestões de timing ótimo geradas pela IA';

-- RLS
ALTER TABLE contact_timing_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimal_timing_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY sales_team_timing_patterns ON contact_timing_patterns FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role IN ('super_admin', 'admin', 'comercial'))
);

CREATE POLICY sales_team_timing_suggestions ON optimal_timing_suggestions FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role IN ('super_admin', 'admin', 'comercial'))
);

CREATE TRIGGER update_timing_patterns_timestamp BEFORE UPDATE ON contact_timing_patterns FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
CREATE TRIGGER update_timing_suggestions_timestamp BEFORE UPDATE ON optimal_timing_suggestions FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

COMMENT ON SCHEMA public IS 'Migration 34: Inteligência de Timing';

