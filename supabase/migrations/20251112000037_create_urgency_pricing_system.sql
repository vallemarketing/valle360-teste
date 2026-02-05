-- =====================================================================================
-- Migration: Leilão Reverso / Sistema de Urgência
-- Descrição: Propostas com validade dinâmica e táticas de urgência para fechar
-- Versão: 1.0
-- Data: 2025-11-12
-- =====================================================================================

CREATE TABLE IF NOT EXISTS urgency_tactics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tactic_name VARCHAR(255) NOT NULL,
    tactic_type VARCHAR(50), -- 'time_limited', 'quantity_limited', 'price_increase', 'bonus_offer'
    
    -- Configuração
    description TEXT,
    urgency_level VARCHAR(20), -- 'low', 'medium', 'high'
    
    -- Mensagens
    urgency_message_template TEXT,
    countdown_display_type VARCHAR(50), -- 'timer', 'date', 'slots_remaining'
    
    -- Efetividade
    times_used INTEGER DEFAULT 0,
    times_worked INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE WHEN times_used > 0 THEN (times_worked::DECIMAL / times_used * 100) ELSE 0 END
    ) STORED,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS time_limited_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID NOT NULL REFERENCES generated_proposals(id) ON DELETE CASCADE,
    urgency_tactic_id UUID REFERENCES urgency_tactics(id),
    
    -- Validade
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    extended_until TIMESTAMP WITH TIME ZONE, -- Se estender
    extension_reason TEXT,
    
    -- Tática de urgência
    urgency_type VARCHAR(50) NOT NULL, -- 'expiring_discount', 'limited_slots', 'price_increase_after'
    
    -- Detalhes
    current_price DECIMAL(10,2) NOT NULL,
    price_after_expiry DECIMAL(10,2), -- Preço que será após expirar
    price_increase_percent DECIMAL(5,2),
    
    discount_amount DECIMAL(10,2),
    discount_expires_message TEXT,
    
    slots_available INTEGER, -- Vagas disponíveis
    slots_message TEXT,
    
    -- Bônus condicional
    bonus_if_accept_today JSONB, -- [{bonus: 'consultoria grátis', value: 500}]
    
    -- Status
    is_expired BOOLEAN GENERATED ALWAYS AS (CURRENT_TIMESTAMP > valid_until) STORED,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'accepted', 'expired', 'extended'
    
    -- Resultado
    accepted_at TIMESTAMP WITH TIME ZONE,
    accepted_before_expiry BOOLEAN,
    
    -- Tracking
    countdown_views INTEGER DEFAULT 0,
    urgency_message_shown_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS urgency_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    time_limited_proposal_id UUID NOT NULL REFERENCES time_limited_proposals(id) ON DELETE CASCADE,
    
    -- Notificação
    notification_type VARCHAR(50), -- 'expiring_soon', 'last_chance', 'expired', 'slots_running_out'
    notification_trigger VARCHAR(50), -- '24h_before', '1h_before', 'on_expiry'
    
    -- Mensagem
    message_subject VARCHAR(255),
    message_body TEXT,
    
    -- Envio
    channels JSONB, -- ['email', 'whatsapp', 'sms', 'push']
    scheduled_for TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Resultado
    notification_opened BOOLEAN DEFAULT false,
    opened_at TIMESTAMP WITH TIME ZONE,
    resulted_in_action BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_time_limited_proposals_proposal ON time_limited_proposals(proposal_id);
CREATE INDEX idx_time_limited_proposals_valid ON time_limited_proposals(valid_until);
CREATE INDEX idx_time_limited_proposals_expired ON time_limited_proposals(is_expired);
CREATE INDEX idx_urgency_notifications_proposal ON urgency_notifications(time_limited_proposal_id);
CREATE INDEX idx_urgency_notifications_scheduled ON urgency_notifications(scheduled_for);

COMMENT ON TABLE time_limited_proposals IS 'Propostas com validade e urgência dinâmica';

-- RLS
ALTER TABLE urgency_tactics ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_limited_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE urgency_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_urgency_tactics ON urgency_tactics FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role IN ('super_admin', 'admin', 'comercial'))
);

CREATE POLICY sales_time_limited_proposals ON time_limited_proposals FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role IN ('super_admin', 'admin', 'comercial'))
);

CREATE POLICY sales_urgency_notifications ON urgency_notifications FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role IN ('super_admin', 'admin', 'comercial'))
);

CREATE TRIGGER update_time_limited_proposals_timestamp BEFORE UPDATE ON time_limited_proposals FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

COMMENT ON SCHEMA public IS 'Migration 37: Sistema de Urgência';

