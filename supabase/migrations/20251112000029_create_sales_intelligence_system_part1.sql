-- =====================================================================================
-- Migration: Comercial & Vendas Inteligente (Parte 1)
-- Descrição: Sistema inteligente de vendas com IA fazendo SDR, captação automática,
--            qualificação de leads, scoring, inteligência de mercado e pipeline
-- Versão: 1.0
-- Data: 2025-11-12
-- =====================================================================================

-- =====================================================================================
-- 1. INTELIGÊNCIA DE MERCADO COMERCIAL
-- =====================================================================================

CREATE TABLE IF NOT EXISTS commercial_market_intelligence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Inteligência de mercado
    intelligence_type VARCHAR(50) NOT NULL, -- 'pricing_trend', 'demand_forecast', 'competitor_move', 'market_opportunity', 'seasonal_pattern'
    industry VARCHAR(100),
    region VARCHAR(100),
    
    -- Dados
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    data_points JSONB, -- Dados brutos que geraram o insight
    
    -- Análise
    trend_direction VARCHAR(20), -- 'up', 'down', 'stable', 'volatile'
    confidence_score DECIMAL(5,2) DEFAULT 0, -- 0-100
    impact_score DECIMAL(5,2) DEFAULT 0, -- 0-100 (impacto potencial no negócio)
    
    -- Recomendações
    recommended_action TEXT,
    urgency VARCHAR(20) DEFAULT 'medium', -- 'critical', 'high', 'medium', 'low'
    
    -- Temporal
    valid_from DATE,
    valid_until DATE,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_commercial_intelligence_type ON commercial_market_intelligence(intelligence_type);
CREATE INDEX idx_commercial_intelligence_industry ON commercial_market_intelligence(industry);
CREATE INDEX idx_commercial_intelligence_impact ON commercial_market_intelligence(impact_score DESC);

COMMENT ON TABLE commercial_market_intelligence IS 'Inteligência de mercado para o time comercial';

-- =====================================================================================
-- 2. INTELIGÊNCIA DE PREÇOS
-- =====================================================================================

CREATE TABLE IF NOT EXISTS pricing_intelligence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Serviço/Produto
    service_name VARCHAR(255) NOT NULL,
    service_category VARCHAR(100),
    
    -- Nossa precificação
    our_current_price DECIMAL(10,2),
    our_min_price DECIMAL(10,2),
    our_max_price DECIMAL(10,2),
    
    -- Mercado
    market_average_price DECIMAL(10,2),
    market_min_price DECIMAL(10,2),
    market_max_price DECIMAL(10,2),
    
    -- Análise
    price_position VARCHAR(20), -- 'below', 'at', 'above' (em relação ao mercado)
    price_competitiveness_score DECIMAL(5,2), -- 0-100
    
    -- Recomendação
    suggested_price DECIMAL(10,2),
    suggested_price_justification TEXT,
    estimated_conversion_impact_percent DECIMAL(6,2),
    estimated_revenue_impact DECIMAL(10,2),
    
    -- Elasticidade de preço
    price_elasticity DECIMAL(6,4), -- Quanto a demanda muda com variação de 1% no preço
    optimal_price_point DECIMAL(10,2), -- Sweet spot de máximo lucro
    
    -- Dados de suporte
    sample_size INTEGER DEFAULT 0,
    competitors_analyzed INTEGER DEFAULT 0,
    data_sources JSONB,
    
    -- Temporal
    analysis_date DATE NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pricing_intelligence_service ON pricing_intelligence(service_name);
CREATE INDEX idx_pricing_intelligence_date ON pricing_intelligence(analysis_date DESC);
CREATE INDEX idx_pricing_intelligence_position ON pricing_intelligence(price_position);

COMMENT ON TABLE pricing_intelligence IS 'Inteligência de preços do mercado vs nossos preços';

-- =====================================================================================
-- 3. SUGESTÕES DE UPSELL (IA identifica oportunidades)
-- =====================================================================================

CREATE TABLE IF NOT EXISTS upsell_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Sugestão
    suggested_service VARCHAR(255) NOT NULL,
    suggested_price DECIMAL(10,2) NOT NULL,
    suggested_discount_percent DECIMAL(5,2) DEFAULT 0,
    final_suggested_price DECIMAL(10,2) NOT NULL,
    
    -- Razão da sugestão
    suggestion_reason TEXT NOT NULL,
    supporting_evidence JSONB, -- [{evidence: 'Cliente cresceu 50%', data_point: '...'}]
    
    -- Scoring
    success_probability DECIMAL(5,2) DEFAULT 0, -- 0-100
    urgency_score DECIMAL(5,2) DEFAULT 0, -- 0-100
    value_score DECIMAL(5,2) DEFAULT 0, -- 0-100 (valor do upsell)
    overall_priority DECIMAL(5,2) DEFAULT 0, -- 0-100
    
    -- Argumentação pronta
    sales_pitch TEXT, -- Pitch de vendas sugerido pela IA
    objection_handling JSONB, -- [{objection: 'está caro', response: '...'}]
    recommended_channel VARCHAR(50), -- 'whatsapp', 'email', 'call', 'meeting'
    best_time_to_approach TIME,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'sent', 'accepted', 'rejected', 'dismissed'
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    sent_by UUID REFERENCES users(id),
    sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Resultado
    client_response VARCHAR(20), -- 'accepted', 'negotiating', 'rejected', 'no_response'
    client_feedback TEXT,
    actual_closed_value DECIMAL(10,2),
    closed_by UUID REFERENCES users(id),
    closed_at TIMESTAMP WITH TIME ZONE,
    
    -- IA tracking
    generated_by VARCHAR(50) DEFAULT 'ai',
    model_version VARCHAR(50),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_upsell_suggestions_client ON upsell_suggestions(client_id);
CREATE INDEX idx_upsell_suggestions_status ON upsell_suggestions(status);
CREATE INDEX idx_upsell_suggestions_priority ON upsell_suggestions(overall_priority DESC);
CREATE INDEX idx_upsell_suggestions_sent ON upsell_suggestions(sent_at DESC);

COMMENT ON TABLE upsell_suggestions IS 'Sugestões de upsell geradas automaticamente pela IA';

-- =====================================================================================
-- 4. OFERTAS ENVIADAS (Tracking de ofertas de upsell)
-- =====================================================================================

CREATE TABLE IF NOT EXISTS upsell_offers_sent (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upsell_suggestion_id UUID NOT NULL REFERENCES upsell_suggestions(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Canal de envio
    channel VARCHAR(50) NOT NULL, -- 'whatsapp', 'email', 'sms', 'in_person', 'call'
    
    -- Mensagem enviada
    message_subject VARCHAR(255),
    message_body TEXT NOT NULL,
    attachments JSONB, -- URLs de PDFs, imagens, etc
    
    -- Link de aceite
    offer_link VARCHAR(500),
    offer_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Tracking
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sent_by UUID REFERENCES users(id),
    
    -- Visualização
    viewed BOOLEAN DEFAULT false,
    first_viewed_at TIMESTAMP WITH TIME ZONE,
    view_count INTEGER DEFAULT 0,
    time_spent_viewing_seconds INTEGER DEFAULT 0,
    
    -- Interação
    clicked_offer_link BOOLEAN DEFAULT false,
    clicked_at TIMESTAMP WITH TIME ZONE,
    
    -- Resposta
    client_responded BOOLEAN DEFAULT false,
    client_response_text TEXT,
    responded_at TIMESTAMP WITH TIME ZONE,
    
    -- Resultado
    result VARCHAR(20), -- 'accepted', 'rejected', 'no_response', 'expired'
    result_recorded_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_upsell_offers_suggestion ON upsell_offers_sent(upsell_suggestion_id);
CREATE INDEX idx_upsell_offers_client ON upsell_offers_sent(client_id);
CREATE INDEX idx_upsell_offers_sent_at ON upsell_offers_sent(sent_at DESC);
CREATE INDEX idx_upsell_offers_viewed ON upsell_offers_sent(viewed);

COMMENT ON TABLE upsell_offers_sent IS 'Tracking de todas as ofertas de upsell enviadas';

-- =====================================================================================
-- 5. PROGRAMA DE INDICAÇÕES
-- =====================================================================================

CREATE TABLE IF NOT EXISTS referral_program (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Configuração do programa
    program_name VARCHAR(255) NOT NULL,
    program_description TEXT,
    is_active BOOLEAN DEFAULT true,
    
    -- Recompensas para quem indica
    referrer_reward_type VARCHAR(50), -- 'discount', 'credits', 'cash', 'upgrade', 'gift'
    referrer_reward_value DECIMAL(10,2),
    referrer_reward_description TEXT,
    
    -- Recompensas para quem foi indicado
    referee_reward_type VARCHAR(50),
    referee_reward_value DECIMAL(10,2),
    referee_reward_description TEXT,
    
    -- Requisitos
    min_contract_value_for_reward DECIMAL(10,2),
    min_contract_duration_months INTEGER,
    max_referrals_per_client INTEGER, -- NULL = ilimitado
    
    -- Validade
    valid_from DATE,
    valid_until DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_referral_program_active ON referral_program(is_active) WHERE is_active = true;

COMMENT ON TABLE referral_program IS 'Configuração do programa de indicações';

-- =====================================================================================
-- 6. RECOMPENSAS POR INDICAÇÃO
-- =====================================================================================

CREATE TABLE IF NOT EXISTS referral_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID REFERENCES referral_program(id) ON DELETE SET NULL,
    
    -- Quem indicou
    referrer_client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    referrer_name VARCHAR(255) NOT NULL,
    
    -- Quem foi indicado
    referee_name VARCHAR(255) NOT NULL,
    referee_email VARCHAR(255),
    referee_phone VARCHAR(50),
    referee_client_id UUID REFERENCES clients(id) ON DELETE SET NULL, -- Se virou cliente
    
    -- Link personalizado de indicação
    referral_link VARCHAR(500),
    referral_code VARCHAR(50) UNIQUE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'contacted', 'qualified', 'converted', 'rewarded', 'expired'
    
    -- Conversão
    converted_to_client BOOLEAN DEFAULT false,
    converted_at TIMESTAMP WITH TIME ZONE,
    contract_value DECIMAL(10,2),
    
    -- Recompensa
    referrer_reward_given BOOLEAN DEFAULT false,
    referrer_reward_type VARCHAR(50),
    referrer_reward_value DECIMAL(10,2),
    referrer_reward_given_at TIMESTAMP WITH TIME ZONE,
    
    referee_reward_given BOOLEAN DEFAULT false,
    referee_reward_type VARCHAR(50),
    referee_reward_value DECIMAL(10,2),
    referee_reward_given_at TIMESTAMP WITH TIME ZONE,
    
    -- Tracking
    link_clicks INTEGER DEFAULT 0,
    last_clicked_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_referral_rewards_referrer ON referral_rewards(referrer_client_id);
CREATE INDEX idx_referral_rewards_referee ON referral_rewards(referee_client_id);
CREATE INDEX idx_referral_rewards_status ON referral_rewards(status);
CREATE INDEX idx_referral_rewards_code ON referral_rewards(referral_code);
CREATE INDEX idx_referral_rewards_converted ON referral_rewards(converted_to_client) WHERE converted_to_client = true;

COMMENT ON TABLE referral_rewards IS 'Tracking de indicações e recompensas';

-- =====================================================================================
-- 7. INTERAÇÕES COM LEADS (Histórico completo)
-- =====================================================================================

CREATE TABLE IF NOT EXISTS lead_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    
    -- Tipo de interação
    interaction_type VARCHAR(50) NOT NULL, -- 'email_sent', 'email_opened', 'email_clicked', 'whatsapp_sent', 'whatsapp_replied', 'call_made', 'meeting_scheduled', 'meeting_held', 'proposal_sent', 'proposal_viewed', 'follow_up'
    channel VARCHAR(50), -- 'email', 'whatsapp', 'call', 'meeting', 'linkedin', 'sms'
    
    -- Detalhes
    subject VARCHAR(255),
    content TEXT,
    duration_minutes INTEGER, -- Para calls e meetings
    outcome VARCHAR(100),
    notes TEXT,
    
    -- Anexos/Links
    attachments JSONB,
    links_shared JSONB,
    
    -- Sentimento
    lead_sentiment VARCHAR(20), -- 'positive', 'neutral', 'negative', 'interested', 'not_interested'
    lead_engagement_level VARCHAR(20), -- 'high', 'medium', 'low', 'none'
    
    -- Próximos passos
    next_step VARCHAR(255),
    next_follow_up_date DATE,
    
    -- Quem fez a interação
    performed_by UUID REFERENCES users(id),
    performed_by_type VARCHAR(20) DEFAULT 'human', -- 'human', 'ai', 'automated'
    
    -- Timestamp
    interaction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lead_interactions_lead ON lead_interactions(lead_id);
CREATE INDEX idx_lead_interactions_type ON lead_interactions(interaction_type);
CREATE INDEX idx_lead_interactions_date ON lead_interactions(interaction_date DESC);
CREATE INDEX idx_lead_interactions_next_followup ON lead_interactions(next_follow_up_date);

COMMENT ON TABLE lead_interactions IS 'Histórico completo de todas as interações com leads';

-- =====================================================================================
-- 8. HISTÓRICO DE LEAD SCORING
-- =====================================================================================

CREATE TABLE IF NOT EXISTS lead_scoring_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    
    -- Score
    score_value INTEGER NOT NULL, -- 0-100
    score_tier VARCHAR(10) NOT NULL, -- 'A', 'B', 'C', 'D'
    
    -- Razão da mudança
    score_change_reason TEXT,
    factors_evaluated JSONB, -- [{factor: 'budget', weight: 0.3, score: 80}, ...]
    
    -- Comparação
    previous_score INTEGER,
    score_change INTEGER GENERATED ALWAYS AS (score_value - COALESCE(previous_score, 0)) STORED,
    
    -- Modelo
    scoring_model_version VARCHAR(50),
    calculated_by VARCHAR(20) DEFAULT 'ai', -- 'ai', 'manual', 'system'
    
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lead_scoring_lead ON lead_scoring_history(lead_id);
CREATE INDEX idx_lead_scoring_calculated ON lead_scoring_history(calculated_at DESC);
CREATE INDEX idx_lead_scoring_tier ON lead_scoring_history(score_tier);

COMMENT ON TABLE lead_scoring_history IS 'Histórico de mudanças no score dos leads';

-- =====================================================================================
-- 9. MENSAGENS AUTOMÁTICAS DA IA SDR
-- =====================================================================================

CREATE TABLE IF NOT EXISTS sdr_automated_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    
    -- Sequência
    sequence_name VARCHAR(100), -- 'first_contact', 'follow_up_1', 'follow_up_2', 'reengagement', 'nurturing'
    sequence_step INTEGER DEFAULT 1,
    
    -- Canal e conteúdo
    channel VARCHAR(50) NOT NULL, -- 'email', 'whatsapp', 'sms', 'linkedin'
    subject VARCHAR(255),
    message_body TEXT NOT NULL,
    personalization_data JSONB, -- Dados usados para personalizar a mensagem
    
    -- Template
    template_id UUID,
    template_name VARCHAR(100),
    
    -- Status
    status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'sent', 'delivered', 'failed', 'cancelled'
    scheduled_for TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    
    -- Resposta do lead
    lead_responded BOOLEAN DEFAULT false,
    responded_at TIMESTAMP WITH TIME ZONE,
    response_text TEXT,
    response_sentiment VARCHAR(20),
    
    -- Ações
    triggered_by VARCHAR(50) DEFAULT 'ai', -- 'ai', 'schedule', 'trigger_event', 'manual'
    trigger_event VARCHAR(100), -- 'lead_created', 'form_submitted', 'no_response_3days', etc
    
    -- AI tracking
    ai_model_used VARCHAR(50),
    ai_confidence_score DECIMAL(5,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sdr_messages_lead ON sdr_automated_messages(lead_id);
CREATE INDEX idx_sdr_messages_status ON sdr_automated_messages(status);
CREATE INDEX idx_sdr_messages_scheduled ON sdr_automated_messages(scheduled_for);
CREATE INDEX idx_sdr_messages_sent ON sdr_automated_messages(sent_at DESC);
CREATE INDEX idx_sdr_messages_responded ON sdr_automated_messages(lead_responded) WHERE lead_responded = true;

COMMENT ON TABLE sdr_automated_messages IS 'Mensagens automáticas enviadas pela IA SDR';

-- =====================================================================================
-- TRIGGERS
-- =====================================================================================

CREATE TRIGGER update_commercial_intelligence_timestamp
    BEFORE UPDATE ON commercial_market_intelligence
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER update_pricing_intelligence_timestamp
    BEFORE UPDATE ON pricing_intelligence
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER update_upsell_suggestions_timestamp
    BEFORE UPDATE ON upsell_suggestions
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER update_referral_program_timestamp
    BEFORE UPDATE ON referral_program
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER update_referral_rewards_timestamp
    BEFORE UPDATE ON referral_rewards
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER update_sdr_automated_messages_timestamp
    BEFORE UPDATE ON sdr_automated_messages
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

-- =====================================================================================
-- RLS (Row Level Security)
-- =====================================================================================

ALTER TABLE commercial_market_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE upsell_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE upsell_offers_sent ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_program ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_scoring_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE sdr_automated_messages ENABLE ROW LEVEL SECURITY;

-- Comercial, super admin e gestores acessam inteligência
CREATE POLICY sales_team_commercial_intelligence ON commercial_market_intelligence FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('super_admin', 'admin', 'comercial', 'gestor')
    )
);

CREATE POLICY sales_team_pricing_intelligence ON pricing_intelligence FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('super_admin', 'admin', 'comercial')
    )
);

CREATE POLICY sales_team_upsell_suggestions ON upsell_suggestions FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('super_admin', 'admin', 'comercial')
    )
);

CREATE POLICY sales_team_upsell_offers ON upsell_offers_sent FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('super_admin', 'admin', 'comercial')
    )
);

CREATE POLICY all_view_referral_program ON referral_program FOR SELECT TO authenticated USING (true);
CREATE POLICY admin_manage_referral_program ON referral_program FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('super_admin', 'admin')
    )
);

CREATE POLICY sales_team_referral_rewards ON referral_rewards FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('super_admin', 'admin', 'comercial')
    )
);

CREATE POLICY sales_team_lead_interactions ON lead_interactions FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('super_admin', 'admin', 'comercial')
    )
);

CREATE POLICY sales_team_lead_scoring ON lead_scoring_history FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('super_admin', 'admin', 'comercial')
    )
);

CREATE POLICY sales_team_sdr_messages ON sdr_automated_messages FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('super_admin', 'admin', 'comercial')
    )
);

-- =====================================================================================
-- FIM DA MIGRATION - PARTE 1
-- =====================================================================================

COMMENT ON SCHEMA public IS 'Migration 29: Comercial & Vendas Inteligente (Parte 1) - SDR AI, Leads, Upsell, Indicações';

