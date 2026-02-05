-- =====================================================================================
-- Migration: Comercial & Vendas Inteligente (Parte 2)
-- Descrição: Propostas automáticas, battle cards, pipeline, objections handling,
--            performance tracking e assistente de vendas com IA
-- Versão: 1.0
-- Data: 2025-11-12
-- =====================================================================================

-- =====================================================================================
-- 1. PRICING DOS CONCORRENTES (Para battle cards)
-- =====================================================================================

CREATE TABLE IF NOT EXISTS competitor_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
    
    -- Serviço
    service_name VARCHAR(255) NOT NULL,
    service_category VARCHAR(100),
    service_description TEXT,
    
    -- Preço
    price_min DECIMAL(10,2),
    price_max DECIMAL(10,2),
    price_average DECIMAL(10,2),
    pricing_model VARCHAR(50), -- 'monthly', 'project', 'hourly', 'performance'
    
    -- Incluso no preço
    whats_included JSONB,
    
    -- Comparação com a gente
    our_equivalent_service VARCHAR(255),
    our_price DECIMAL(10,2),
    price_difference_percent DECIMAL(6,2),
    value_advantage TEXT, -- Por que somos melhor/pior
    
    -- Fonte
    data_source VARCHAR(100), -- 'website', 'proposal_received', 'client_feedback', 'market_research'
    last_verified_date DATE,
    confidence_level VARCHAR(20) DEFAULT 'medium', -- 'high', 'medium', 'low'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_competitor_pricing_competitor ON competitor_pricing(competitor_id);
CREATE INDEX idx_competitor_pricing_service ON competitor_pricing(service_name);

COMMENT ON TABLE competitor_pricing IS 'Preços praticados pelos concorrentes por serviço';

-- =====================================================================================
-- 2. ANÁLISE DE SENTIMENTO DOS CONCORRENTES
-- =====================================================================================

CREATE TABLE IF NOT EXISTS competitor_sentiment_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
    
    -- Período de análise
    analysis_date DATE NOT NULL,
    analysis_period VARCHAR(20) DEFAULT 'last_30_days', -- 'last_7_days', 'last_30_days', 'last_90_days'
    
    -- Sentimento geral
    overall_sentiment VARCHAR(20), -- 'very_positive', 'positive', 'neutral', 'negative', 'very_negative'
    sentiment_score DECIMAL(5,2), -- -100 (muito negativo) a +100 (muito positivo)
    
    -- Por fonte
    google_reviews_sentiment DECIMAL(5,2),
    google_reviews_count INTEGER DEFAULT 0,
    google_average_rating DECIMAL(3,2),
    
    reclame_aqui_sentiment DECIMAL(5,2),
    reclame_aqui_complaints INTEGER DEFAULT 0,
    reclame_aqui_response_rate DECIMAL(5,2),
    
    social_media_sentiment DECIMAL(5,2),
    social_media_mentions INTEGER DEFAULT 0,
    
    -- Principais reclamações
    top_complaints JSONB, -- [{complaint: 'atraso nas entregas', frequency: 45, severity: 'high'}]
    top_praises JSONB, -- [{praise: 'atendimento rápido', frequency: 32}]
    
    -- Palavras-chave
    negative_keywords JSONB,
    positive_keywords JSONB,
    
    -- Oportunidades para nós
    their_weaknesses_our_strengths JSONB, -- O que eles fazem mal e nós fazemos bem
    sales_ammunition TEXT, -- Argumentos prontos para usar
    
    -- Tendência
    sentiment_trend VARCHAR(20), -- 'improving', 'stable', 'declining'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(competitor_id, analysis_date)
);

CREATE INDEX idx_competitor_sentiment_competitor ON competitor_sentiment_analysis(competitor_id);
CREATE INDEX idx_competitor_sentiment_date ON competitor_sentiment_analysis(analysis_date DESC);
CREATE INDEX idx_competitor_sentiment_score ON competitor_sentiment_analysis(sentiment_score);

COMMENT ON TABLE competitor_sentiment_analysis IS 'Análise de sentimento do mercado sobre os concorrentes';

-- =====================================================================================
-- 3. BATTLE CARDS (Comparação nós vs concorrentes)
-- =====================================================================================

CREATE TABLE IF NOT EXISTS competitor_battle_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
    
    -- Identificação
    card_title VARCHAR(255) NOT NULL,
    last_updated_date DATE NOT NULL,
    
    -- Posicionamento
    their_positioning TEXT,
    our_positioning TEXT,
    
    -- Forças e fraquezas
    their_strengths JSONB, -- [{strength: 'preço baixo', impact: 'high'}]
    their_weaknesses JSONB, -- [{weakness: 'atendimento lento', impact: 'high'}]
    our_advantages JSONB, -- [{advantage: 'suporte 24/7', proof: '...'}]
    our_disadvantages JSONB,
    
    -- Comparação de features
    feature_comparison JSONB, -- [{feature: 'relatórios', us: 'yes', them: 'no', importance: 'high'}]
    
    -- Pricing
    pricing_comparison JSONB,
    price_positioning TEXT, -- 'premium', 'competitive', 'value'
    
    -- Objeções comuns e respostas
    common_objections JSONB, -- [{objection: 'vocês são mais caros', response: '...', success_rate: 0.75}]
    
    -- Táticas de venda
    how_to_win_against_them TEXT,
    landmines_to_avoid TEXT, -- O que NÃO falar
    
    -- Proof points
    case_studies_vs_them JSONB, -- Clientes que vieram deles
    testimonials JSONB,
    metrics_that_matter JSONB, -- Métricas que nos favorecem
    
    -- Inteligência competitiva
    recent_moves TEXT, -- Últimas movimentações deles
    anticipated_moves TEXT, -- O que esperamos que façam
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    confidence_level VARCHAR(20) DEFAULT 'high', -- 'high', 'medium', 'low'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_battle_cards_competitor ON competitor_battle_cards(competitor_id);
CREATE INDEX idx_battle_cards_active ON competitor_battle_cards(is_active) WHERE is_active = true;

COMMENT ON TABLE competitor_battle_cards IS 'Battle cards para vendas: como ganhar de cada concorrente';

-- =====================================================================================
-- 4. OBJEÇÕES DE VENDAS (Base de conhecimento)
-- =====================================================================================

CREATE TABLE IF NOT EXISTS sales_objections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Objeção
    objection_text TEXT NOT NULL,
    objection_category VARCHAR(50), -- 'price', 'timing', 'trust', 'need', 'authority', 'competitor'
    objection_severity VARCHAR(20) DEFAULT 'medium', -- 'deal_breaker', 'high', 'medium', 'low'
    
    -- Frequência
    times_encountered INTEGER DEFAULT 0,
    last_encountered_at TIMESTAMP WITH TIME ZONE,
    
    -- Contexto
    typical_deal_stage VARCHAR(50), -- 'prospecting', 'qualification', 'proposal', 'negotiation', 'closing'
    client_segment JSONB, -- Em quais tipos de cliente é mais comum
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sales_objections_category ON sales_objections(objection_category);
CREATE INDEX idx_sales_objections_frequency ON sales_objections(times_encountered DESC);

COMMENT ON TABLE sales_objections IS 'Base de conhecimento de objeções de vendas';

-- =====================================================================================
-- 5. RESPOSTAS PARA OBJEÇÕES (O que funciona)
-- =====================================================================================

CREATE TABLE IF NOT EXISTS sales_objection_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    objection_id UUID NOT NULL REFERENCES sales_objections(id) ON DELETE CASCADE,
    
    -- Resposta
    response_text TEXT NOT NULL,
    response_approach VARCHAR(50), -- 'direct', 'question', 'story', 'data', 'social_proof', 'reframe'
    
    -- Efetividade
    times_used INTEGER DEFAULT 0,
    times_worked INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE WHEN times_used > 0 THEN (times_worked::DECIMAL / times_used * 100) ELSE 0 END
    ) STORED,
    
    -- Contexto
    works_best_for JSONB, -- Tipos de cliente/situação onde funciona melhor
    
    -- Materiais de apoio
    supporting_materials JSONB, -- Links para cases, dados, etc
    
    -- Rating
    average_rating DECIMAL(3,2), -- Rating dado pelos vendedores (1-5)
    rating_count INTEGER DEFAULT 0,
    
    -- Status
    is_recommended BOOLEAN DEFAULT true,
    recommended_by UUID REFERENCES users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_objection_responses_objection ON sales_objection_responses(objection_id);
CREATE INDEX idx_objection_responses_success ON sales_objection_responses(success_rate DESC);
CREATE INDEX idx_objection_responses_recommended ON sales_objection_responses(is_recommended) WHERE is_recommended = true;

COMMENT ON TABLE sales_objection_responses IS 'Respostas efetivas para objeções de vendas';

-- =====================================================================================
-- 6. LEMBRETES INTELIGENTES DO COMERCIAL
-- =====================================================================================

CREATE TABLE IF NOT EXISTS sales_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Para quem
    assigned_to UUID NOT NULL REFERENCES users(id),
    
    -- Sobre o quê
    reminder_type VARCHAR(50) NOT NULL, -- 'follow_up_lead', 'proposal_expiring', 'client_birthday', 'contract_renewal', 'no_response', 'meeting_prep', 'task'
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    
    -- Conteúdo
    reminder_title VARCHAR(255) NOT NULL,
    reminder_description TEXT,
    priority VARCHAR(20) DEFAULT 'medium', -- 'urgent', 'high', 'medium', 'low'
    
    -- Ação sugerida
    suggested_action TEXT,
    action_link VARCHAR(500), -- Link direto para realizar a ação
    
    -- Timing
    remind_at TIMESTAMP WITH TIME ZONE NOT NULL,
    snoozed_until TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'snoozed', 'completed', 'dismissed'
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by UUID REFERENCES users(id),
    dismissed_at TIMESTAMP WITH TIME ZONE,
    dismissal_reason TEXT,
    
    -- Gerado por
    created_by_type VARCHAR(20) DEFAULT 'ai', -- 'ai', 'system', 'manual'
    ai_confidence_score DECIMAL(5,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sales_reminders_assigned ON sales_reminders(assigned_to);
CREATE INDEX idx_sales_reminders_remind_at ON sales_reminders(remind_at);
CREATE INDEX idx_sales_reminders_status ON sales_reminders(status);
CREATE INDEX idx_sales_reminders_priority ON sales_reminders(priority);
CREATE INDEX idx_sales_reminders_lead ON sales_reminders(lead_id);
CREATE INDEX idx_sales_reminders_client ON sales_reminders(client_id);

COMMENT ON TABLE sales_reminders IS 'Lembretes inteligentes para o time comercial';

-- =====================================================================================
-- 7. CATÁLOGO DE SERVIÇOS (Para geração rápida de propostas)
-- =====================================================================================

CREATE TABLE IF NOT EXISTS service_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Serviço
    service_name VARCHAR(255) NOT NULL,
    service_category VARCHAR(100),
    service_description_short TEXT,
    service_description_long TEXT, -- Para incluir na proposta
    
    -- Precificação
    base_price DECIMAL(10,2) NOT NULL,
    min_price DECIMAL(10,2) NOT NULL, -- Mínimo para negociação
    max_price DECIMAL(10,2), -- Premium
    pricing_model VARCHAR(50) DEFAULT 'monthly', -- 'monthly', 'one_time', 'hourly', 'project'
    
    -- Entregáveis
    deliverables JSONB, -- ['10 posts/mês', '2 reuniões', ...]
    turnaround_time_days INTEGER,
    
    -- Add-ons e upsells
    optional_add_ons JSONB, -- [{name: 'Story extra', price: 150}]
    recommended_upsells JSONB, -- Serviços que costumam ser vendidos juntos
    
    -- Requisitos
    minimum_contract_months INTEGER DEFAULT 1,
    setup_fee DECIMAL(10,2) DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    
    -- Metadados
    tags JSONB,
    created_by UUID REFERENCES users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_service_catalog_active ON service_catalog(is_active) WHERE is_active = true;
CREATE INDEX idx_service_catalog_category ON service_catalog(service_category);
CREATE INDEX idx_service_catalog_order ON service_catalog(display_order);

COMMENT ON TABLE service_catalog IS 'Catálogo de serviços com preços pré-fixados';

-- =====================================================================================
-- 8. TEMPLATES DE PROPOSTAS
-- =====================================================================================

CREATE TABLE IF NOT EXISTS proposal_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Template
    template_name VARCHAR(255) NOT NULL,
    template_description TEXT,
    template_type VARCHAR(50) DEFAULT 'standard', -- 'standard', 'premium', 'simplified', 'custom'
    
    -- Estrutura da proposta
    sections JSONB, -- [{order: 1, section: 'cover', required: true}, ...]
    
    -- Design
    cover_image_url VARCHAR(500),
    logo_url VARCHAR(500),
    color_scheme JSONB, -- {primary: '#FF5733', secondary: '#C70039'}
    font_family VARCHAR(50),
    
    -- Conteúdo padrão
    intro_text TEXT,
    about_us_text TEXT,
    terms_and_conditions TEXT,
    payment_terms TEXT,
    footer_text TEXT,
    
    -- Configurações
    include_case_studies BOOLEAN DEFAULT true,
    include_testimonials BOOLEAN DEFAULT true,
    include_team_info BOOLEAN DEFAULT false,
    
    -- Status
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_proposal_templates_active ON proposal_templates(is_active) WHERE is_active = true;
CREATE INDEX idx_proposal_templates_default ON proposal_templates(is_default) WHERE is_default = true;

COMMENT ON TABLE proposal_templates IS 'Templates para geração automática de propostas';

-- =====================================================================================
-- 9. PROPOSTAS GERADAS
-- =====================================================================================

CREATE TABLE IF NOT EXISTS generated_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relacionamentos
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
    template_id UUID REFERENCES proposal_templates(id) ON DELETE SET NULL,
    
    -- Identificação
    proposal_number VARCHAR(50) UNIQUE NOT NULL,
    proposal_title VARCHAR(255) NOT NULL,
    
    -- Destinatário
    recipient_name VARCHAR(255) NOT NULL,
    recipient_company VARCHAR(255),
    recipient_email VARCHAR(255) NOT NULL,
    
    -- Serviços incluídos
    services_included JSONB NOT NULL, -- [{service_id: UUID, quantity: 1, price: 2500}]
    total_value DECIMAL(10,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_value DECIMAL(10,2) DEFAULT 0,
    final_value DECIMAL(10,2) NOT NULL,
    
    -- Pagamento
    payment_terms VARCHAR(100),
    payment_methods JSONB, -- ['pix', 'boleto', 'credit_card']
    
    -- Validade
    expires_at TIMESTAMP WITH TIME ZONE,
    is_expired BOOLEAN GENERATED ALWAYS AS (expires_at IS NOT NULL AND expires_at < CURRENT_TIMESTAMP) STORED,
    
    -- Arquivos
    pdf_url VARCHAR(500),
    pdf_generated_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'cancelled'
    
    -- Envio
    sent_at TIMESTAMP WITH TIME ZONE,
    sent_by UUID REFERENCES users(id),
    sent_channels JSONB, -- ['email', 'whatsapp']
    
    -- Resultado
    accepted_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    
    -- Customizações
    custom_notes TEXT,
    special_conditions TEXT,
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_generated_proposals_number ON generated_proposals(proposal_number);
CREATE INDEX idx_generated_proposals_lead ON generated_proposals(lead_id);
CREATE INDEX idx_generated_proposals_client ON generated_proposals(client_id);
CREATE INDEX idx_generated_proposals_status ON generated_proposals(status);
CREATE INDEX idx_generated_proposals_expires ON generated_proposals(expires_at);
CREATE INDEX idx_generated_proposals_sent ON generated_proposals(sent_at DESC);

COMMENT ON TABLE generated_proposals IS 'Propostas comerciais geradas automaticamente';

-- =====================================================================================
-- 10. TRACKING DE VISUALIZAÇÕES DE PROPOSTAS
-- =====================================================================================

CREATE TABLE IF NOT EXISTS proposal_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID NOT NULL REFERENCES generated_proposals(id) ON DELETE CASCADE,
    
    -- Evento
    event_type VARCHAR(50) NOT NULL, -- 'email_opened', 'link_clicked', 'pdf_opened', 'pdf_downloaded', 'page_viewed', 'section_viewed'
    event_details JSONB,
    
    -- Tempo
    time_spent_seconds INTEGER DEFAULT 0,
    
    -- Dispositivo/Localização
    device_type VARCHAR(50), -- 'desktop', 'mobile', 'tablet'
    browser VARCHAR(50),
    ip_address VARCHAR(50),
    location_city VARCHAR(100),
    location_country VARCHAR(100),
    
    -- Timestamp
    event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_proposal_tracking_proposal ON proposal_tracking(proposal_id);
CREATE INDEX idx_proposal_tracking_event ON proposal_tracking(event_type);
CREATE INDEX idx_proposal_tracking_timestamp ON proposal_tracking(event_timestamp DESC);

COMMENT ON TABLE proposal_tracking IS 'Tracking de como clientes interagem com propostas';

-- =====================================================================================
-- 11. ASSINATURAS DE PROPOSTAS
-- =====================================================================================

CREATE TABLE IF NOT EXISTS proposal_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID NOT NULL REFERENCES generated_proposals(id) ON DELETE CASCADE,
    
    -- Signatário
    signer_name VARCHAR(255) NOT NULL,
    signer_email VARCHAR(255) NOT NULL,
    signer_cpf VARCHAR(14), -- CRIPTOGRAFADO
    signer_ip_address VARCHAR(50),
    
    -- Assinatura
    signature_type VARCHAR(20) DEFAULT 'digital', -- 'digital', 'electronic', 'wet' (física escaneada)
    signature_data TEXT, -- Base64 da assinatura ou token
    signature_image_url VARCHAR(500),
    
    -- Verificação
    is_verified BOOLEAN DEFAULT false,
    verification_method VARCHAR(50), -- 'email', 'sms', 'document', 'biometric'
    verification_token VARCHAR(255),
    verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamp
    signed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Certificado
    certificate_url VARCHAR(500), -- Certificado digital da assinatura
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_proposal_signatures_proposal ON proposal_signatures(proposal_id);
CREATE INDEX idx_proposal_signatures_signed ON proposal_signatures(signed_at DESC);
CREATE INDEX idx_proposal_signatures_verified ON proposal_signatures(is_verified);

COMMENT ON TABLE proposal_signatures IS 'Assinaturas digitais de propostas aceitas';

-- =====================================================================================
-- 12. SUGESTÕES DE COACHING DA IA
-- =====================================================================================

CREATE TABLE IF NOT EXISTS sales_coaching_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Para quem
    sales_rep_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Contexto
    context_type VARCHAR(50), -- 'deal_in_progress', 'lost_deal', 'pattern_detected', 'performance_review'
    deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    
    -- Sugestão
    suggestion_category VARCHAR(50), -- 'objection_handling', 'timing', 'approach', 'pricing', 'follow_up', 'closing'
    suggestion_title VARCHAR(255) NOT NULL,
    suggestion_text TEXT NOT NULL,
    
    -- Análise
    what_went_wrong TEXT,
    what_to_do_differently TEXT,
    example_scenario TEXT,
    
    -- Prioridade
    priority VARCHAR(20) DEFAULT 'medium', -- 'critical', 'high', 'medium', 'low'
    impact_potential VARCHAR(20), -- 'high', 'medium', 'low'
    
    -- Recursos
    training_materials JSONB, -- Links para artigos, vídeos, etc
    
    -- Status
    status VARCHAR(20) DEFAULT 'new', -- 'new', 'viewed', 'applied', 'dismissed'
    viewed_at TIMESTAMP WITH TIME ZONE,
    feedback_rating INTEGER, -- 1-5
    feedback_text TEXT,
    
    -- IA
    generated_by_model VARCHAR(50),
    confidence_score DECIMAL(5,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_coaching_suggestions_rep ON sales_coaching_suggestions(sales_rep_id);
CREATE INDEX idx_coaching_suggestions_status ON sales_coaching_suggestions(status);
CREATE INDEX idx_coaching_suggestions_priority ON sales_coaching_suggestions(priority);

COMMENT ON TABLE sales_coaching_suggestions IS 'Sugestões de coaching da IA para vendedores';

-- =====================================================================================
-- 13. MÉTRICAS DE PERFORMANCE DO COMERCIAL
-- =====================================================================================

CREATE TABLE IF NOT EXISTS sales_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_rep_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Período
    metric_date DATE NOT NULL,
    period_type VARCHAR(20) DEFAULT 'daily', -- 'daily', 'weekly', 'monthly', 'quarterly'
    
    -- Pipeline
    leads_created INTEGER DEFAULT 0,
    leads_qualified INTEGER DEFAULT 0,
    leads_contacted INTEGER DEFAULT 0,
    meetings_scheduled INTEGER DEFAULT 0,
    meetings_held INTEGER DEFAULT 0,
    proposals_sent INTEGER DEFAULT 0,
    deals_won INTEGER DEFAULT 0,
    deals_lost INTEGER DEFAULT 0,
    
    -- Valores
    total_pipeline_value DECIMAL(12,2) DEFAULT 0,
    total_won_value DECIMAL(12,2) DEFAULT 0,
    average_deal_size DECIMAL(10,2) DEFAULT 0,
    
    -- Taxas de conversão
    lead_to_meeting_rate DECIMAL(5,2) DEFAULT 0,
    meeting_to_proposal_rate DECIMAL(5,2) DEFAULT 0,
    proposal_to_close_rate DECIMAL(5,2) DEFAULT 0,
    overall_win_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Tempos médios
    avg_days_to_first_contact DECIMAL(6,2) DEFAULT 0,
    avg_days_to_meeting DECIMAL(6,2) DEFAULT 0,
    avg_days_to_proposal DECIMAL(6,2) DEFAULT 0,
    avg_days_to_close DECIMAL(6,2) DEFAULT 0,
    
    -- Atividades
    calls_made INTEGER DEFAULT 0,
    emails_sent INTEGER DEFAULT 0,
    whatsapp_messages INTEGER DEFAULT 0,
    total_interactions INTEGER DEFAULT 0,
    
    -- Qualidade
    nps_from_clients DECIMAL(3,1),
    client_satisfaction_score DECIMAL(3,1),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(sales_rep_id, metric_date, period_type)
);

CREATE INDEX idx_sales_performance_rep ON sales_performance_metrics(sales_rep_id);
CREATE INDEX idx_sales_performance_date ON sales_performance_metrics(metric_date DESC);
CREATE INDEX idx_sales_performance_win_rate ON sales_performance_metrics(overall_win_rate DESC);

COMMENT ON TABLE sales_performance_metrics IS 'Métricas de performance do time comercial';

-- =====================================================================================
-- TRIGGERS
-- =====================================================================================

CREATE TRIGGER update_competitor_pricing_timestamp
    BEFORE UPDATE ON competitor_pricing
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER update_competitor_sentiment_timestamp
    BEFORE UPDATE ON competitor_sentiment_analysis
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER update_battle_cards_timestamp
    BEFORE UPDATE ON competitor_battle_cards
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER update_sales_objections_timestamp
    BEFORE UPDATE ON sales_objections
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER update_objection_responses_timestamp
    BEFORE UPDATE ON sales_objection_responses
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER update_sales_reminders_timestamp
    BEFORE UPDATE ON sales_reminders
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER update_service_catalog_timestamp
    BEFORE UPDATE ON service_catalog
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER update_proposal_templates_timestamp
    BEFORE UPDATE ON proposal_templates
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER update_generated_proposals_timestamp
    BEFORE UPDATE ON generated_proposals
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER update_coaching_suggestions_timestamp
    BEFORE UPDATE ON sales_coaching_suggestions
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

-- =====================================================================================
-- RLS (Row Level Security)
-- =====================================================================================

ALTER TABLE competitor_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_sentiment_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_battle_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_objections ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_objection_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_coaching_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_performance_metrics ENABLE ROW LEVEL SECURITY;

-- Comercial e admin acessam tudo
CREATE POLICY sales_team_competitor_pricing ON competitor_pricing FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('super_admin', 'admin', 'comercial')
    )
);

CREATE POLICY sales_team_sentiment ON competitor_sentiment_analysis FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('super_admin', 'admin', 'comercial')
    )
);

CREATE POLICY sales_team_battle_cards ON competitor_battle_cards FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('super_admin', 'admin', 'comercial')
    )
);

CREATE POLICY sales_team_objections ON sales_objections FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('super_admin', 'admin', 'comercial')
    )
);

CREATE POLICY sales_team_objection_responses ON sales_objection_responses FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('super_admin', 'admin', 'comercial')
    )
);

-- Lembretes: vê só os seus (ou admin vê tudo)
CREATE POLICY own_sales_reminders ON sales_reminders FOR SELECT TO authenticated USING (
    assigned_to = auth.uid()
    OR EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('super_admin', 'admin')
    )
);

CREATE POLICY manage_own_sales_reminders ON sales_reminders FOR UPDATE TO authenticated USING (
    assigned_to = auth.uid()
);

-- Catálogo de serviços: todos veem, só admin edita
CREATE POLICY all_view_service_catalog ON service_catalog FOR SELECT TO authenticated USING (true);

CREATE POLICY admin_manage_service_catalog ON service_catalog FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('super_admin', 'admin')
    )
);

-- Templates de proposta
CREATE POLICY all_view_proposal_templates ON proposal_templates FOR SELECT TO authenticated USING (true);

CREATE POLICY admin_manage_proposal_templates ON proposal_templates FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('super_admin', 'admin')
    )
);

-- Propostas: comercial gerencia
CREATE POLICY sales_team_proposals ON generated_proposals FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('super_admin', 'admin', 'comercial')
    )
);

CREATE POLICY sales_team_proposal_tracking ON proposal_tracking FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('super_admin', 'admin', 'comercial')
    )
);

CREATE POLICY sales_team_proposal_signatures ON proposal_signatures FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('super_admin', 'admin', 'comercial')
    )
);

-- Coaching: vê só o seu (ou admin vê tudo)
CREATE POLICY own_coaching_suggestions ON sales_coaching_suggestions FOR SELECT TO authenticated USING (
    sales_rep_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('super_admin', 'admin')
    )
);

-- Performance: vê só a sua (ou admin vê tudo)
CREATE POLICY own_sales_performance ON sales_performance_metrics FOR SELECT TO authenticated USING (
    sales_rep_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('super_admin', 'admin')
    )
);

-- =====================================================================================
-- FIM DA MIGRATION - PARTE 2
-- =====================================================================================

COMMENT ON SCHEMA public IS 'Migration 30: Comercial & Vendas Inteligente (Parte 2) - Propostas, Battle Cards, Pipeline, Performance';

