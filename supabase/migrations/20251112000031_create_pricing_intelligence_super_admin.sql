-- =====================================================================================
-- Migration: Pricing Intelligence - Super Admin
-- Descrição: Sistema completo de precificação inteligente com IA para super admin
--            Monitora mercado, sugere valores, timing de aumentos, simulações, A/B tests
-- Versão: 1.0
-- Data: 2025-11-12
-- =====================================================================================

-- =====================================================================================
-- 1. ESTRATÉGIAS DE PRECIFICAÇÃO
-- =====================================================================================

CREATE TABLE IF NOT EXISTS pricing_strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Estratégia
    strategy_name VARCHAR(100) NOT NULL,
    strategy_type VARCHAR(50) NOT NULL, -- 'value_based', 'competitive', 'cost_plus', 'penetration', 'premium', 'dynamic'
    strategy_description TEXT,
    
    -- Posicionamento
    target_market_position VARCHAR(50), -- 'premium', 'mid_market', 'value', 'economy'
    target_profit_margin_percent DECIMAL(5,2),
    
    -- Regras
    pricing_rules JSONB, -- [{rule: 'sempre X% acima do custo', formula: '...'}]
    discount_rules JSONB, -- [{condition: 'contrato anual', discount: 15}]
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    
    -- Histórico
    implemented_from DATE,
    implemented_until DATE,
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pricing_strategies_active ON pricing_strategies(is_active) WHERE is_active = true;
CREATE INDEX idx_pricing_strategies_default ON pricing_strategies(is_default) WHERE is_default = true;

COMMENT ON TABLE pricing_strategies IS 'Estratégias de precificação configuradas';

-- =====================================================================================
-- 2. HISTÓRICO DE PREÇOS POR SERVIÇO
-- =====================================================================================

CREATE TABLE IF NOT EXISTS service_pricing_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID REFERENCES service_catalog(id) ON DELETE CASCADE,
    
    -- Preço
    price_before DECIMAL(10,2),
    price_after DECIMAL(10,2) NOT NULL,
    price_change_percent DECIMAL(6,2) GENERATED ALWAYS AS (
        CASE WHEN price_before > 0 
        THEN ((price_after - price_before) / price_before * 100)
        ELSE 0 END
    ) STORED,
    
    -- Razão da mudança
    change_reason VARCHAR(50), -- 'market_adjustment', 'cost_increase', 'strategic', 'competitive', 'seasonal', 'test'
    change_justification TEXT,
    
    -- Comunicação
    clients_notified BOOLEAN DEFAULT false,
    notification_sent_at TIMESTAMP WITH TIME ZONE,
    notification_method JSONB, -- ['email', 'whatsapp', 'dashboard']
    
    -- Impacto previsto vs real
    predicted_churn_rate DECIMAL(5,2),
    predicted_revenue_impact DECIMAL(12,2),
    actual_churn_rate DECIMAL(5,2),
    actual_revenue_impact DECIMAL(12,2),
    
    -- Temporal
    effective_from DATE NOT NULL,
    announced_on DATE,
    
    -- Quem fez
    changed_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_service_pricing_history_service ON service_pricing_history(service_id);
CREATE INDEX idx_service_pricing_history_effective ON service_pricing_history(effective_from DESC);
CREATE INDEX idx_service_pricing_history_change_percent ON service_pricing_history(price_change_percent);

COMMENT ON TABLE service_pricing_history IS 'Histórico completo de mudanças de preço por serviço';

-- =====================================================================================
-- 3. DADOS DE PREÇOS DO MERCADO (Scraping/API)
-- =====================================================================================

CREATE TABLE IF NOT EXISTS market_pricing_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Serviço
    service_category VARCHAR(100) NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    service_description TEXT,
    
    -- Fonte
    source_type VARCHAR(50) NOT NULL, -- 'competitor_website', 'marketplace', 'proposal_received', 'survey', 'api'
    source_name VARCHAR(255), -- Nome do site/concorrente
    source_url VARCHAR(500),
    competitor_id UUID REFERENCES competitors(id) ON DELETE SET NULL,
    
    -- Preço coletado
    price DECIMAL(10,2) NOT NULL,
    pricing_model VARCHAR(50), -- 'monthly', 'annual', 'one_time', 'hourly'
    currency VARCHAR(3) DEFAULT 'BRL',
    
    -- Detalhes
    whats_included JSONB,
    contract_terms TEXT,
    
    -- Qualidade da fonte
    confidence_score DECIMAL(5,2) DEFAULT 0, -- 0-100
    is_verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Temporal
    collected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    valid_until DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_market_pricing_category ON market_pricing_data(service_category);
CREATE INDEX idx_market_pricing_source ON market_pricing_data(source_type);
CREATE INDEX idx_market_pricing_competitor ON market_pricing_data(competitor_id);
CREATE INDEX idx_market_pricing_collected ON market_pricing_data(collected_at DESC);

COMMENT ON TABLE market_pricing_data IS 'Dados de preços coletados do mercado';

-- =====================================================================================
-- 4. SIMULAÇÕES DE IMPACTO DE MUDANÇA DE PREÇO
-- =====================================================================================

CREATE TABLE IF NOT EXISTS pricing_simulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Escopo
    simulation_name VARCHAR(255) NOT NULL,
    simulation_type VARCHAR(50), -- 'increase', 'decrease', 'restructure', 'new_pricing'
    
    -- Cenário
    services_affected JSONB NOT NULL, -- [{service_id: UUID, current_price: 2500, new_price: 2900}]
    price_change_percent DECIMAL(6,2),
    
    -- Premissas
    assumptions JSONB, -- {churn_elasticity: 0.05, demand_elasticity: -0.3, ...}
    
    -- Previsões da IA
    predicted_results JSONB, -- {revenue: 150000, churn: 3, new_clients: 5, ...}
    
    -- Detalhamento
    current_mrr DECIMAL(12,2), -- Monthly Recurring Revenue
    predicted_mrr DECIMAL(12,2),
    mrr_change_percent DECIMAL(6,2),
    
    current_arr DECIMAL(12,2), -- Annual Recurring Revenue
    predicted_arr DECIMAL(12,2),
    arr_change_percent DECIMAL(6,2),
    
    predicted_clients_lost INTEGER DEFAULT 0,
    predicted_clients_retained INTEGER DEFAULT 0,
    predicted_new_clients INTEGER DEFAULT 0,
    
    -- Confiança
    confidence_level DECIMAL(5,2) DEFAULT 0, -- 0-100
    risk_level VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'running', 'implemented', 'cancelled'
    
    -- Resultados reais (após implementar)
    actual_results JSONB,
    accuracy_score DECIMAL(5,2), -- Quão acurada foi a previsão
    
    -- Quem criou
    created_by UUID REFERENCES users(id),
    simulated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    implemented_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pricing_simulations_status ON pricing_simulations(status);
CREATE INDEX idx_pricing_simulations_created ON pricing_simulations(simulated_at DESC);
CREATE INDEX idx_pricing_simulations_risk ON pricing_simulations(risk_level);

COMMENT ON TABLE pricing_simulations IS 'Simulações de impacto de mudanças de preço';

-- =====================================================================================
-- 5. TESTES A/B DE PRECIFICAÇÃO
-- =====================================================================================

CREATE TABLE IF NOT EXISTS pricing_ab_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Teste
    test_name VARCHAR(255) NOT NULL,
    test_hypothesis TEXT NOT NULL,
    service_id UUID REFERENCES service_catalog(id) ON DELETE CASCADE,
    
    -- Grupos
    control_group_price DECIMAL(10,2) NOT NULL, -- Grupo A (preço atual)
    variant_group_price DECIMAL(10,2) NOT NULL, -- Grupo B (novo preço)
    
    -- Configuração
    test_duration_days INTEGER NOT NULL,
    min_sample_size INTEGER DEFAULT 30,
    traffic_split_percent INTEGER DEFAULT 50, -- % que vai ver o novo preço
    
    -- Critério de sucesso
    success_metric VARCHAR(50), -- 'revenue', 'conversion_rate', 'customer_acquisition_cost', 'profit_margin'
    target_improvement_percent DECIMAL(6,2),
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'running', 'paused', 'completed', 'cancelled'
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    
    -- Resultados
    control_group_conversions INTEGER DEFAULT 0,
    control_group_revenue DECIMAL(12,2) DEFAULT 0,
    control_group_clients INTEGER DEFAULT 0,
    
    variant_group_conversions INTEGER DEFAULT 0,
    variant_group_revenue DECIMAL(12,2) DEFAULT 0,
    variant_group_clients INTEGER DEFAULT 0,
    
    -- Análise estatística
    statistical_significance DECIMAL(5,2), -- p-value
    confidence_interval JSONB, -- {lower: X, upper: Y}
    winner VARCHAR(20), -- 'control', 'variant', 'inconclusive'
    
    -- Decisão
    decision VARCHAR(20), -- 'implement_variant', 'keep_control', 'run_longer', 'redesign'
    decision_reason TEXT,
    decided_by UUID REFERENCES users(id),
    decided_at TIMESTAMP WITH TIME ZONE,
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pricing_ab_tests_service ON pricing_ab_tests(service_id);
CREATE INDEX idx_pricing_ab_tests_status ON pricing_ab_tests(status);
CREATE INDEX idx_pricing_ab_tests_started ON pricing_ab_tests(started_at DESC);

COMMENT ON TABLE pricing_ab_tests IS 'Testes A/B de diferentes preços';

-- =====================================================================================
-- 6. AGENDAMENTO DE AUMENTOS DE PREÇO
-- =====================================================================================

CREATE TABLE IF NOT EXISTS price_increase_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Agendamento
    schedule_name VARCHAR(255) NOT NULL,
    increase_type VARCHAR(50) NOT NULL, -- 'general', 'selective', 'grandfathered', 'progressive', 'value_add'
    
    -- Escopo
    services_affected JSONB NOT NULL, -- [{service_id: UUID, current: 2500, new: 2900, increase: 16%}]
    clients_affected JSONB, -- Se null, aplica a todos
    
    -- Estratégia
    strategy_description TEXT,
    increase_justification TEXT,
    value_added JSONB, -- Se aplicável, o que foi adicionado
    
    -- Timing
    announcement_date DATE NOT NULL,
    effective_date DATE NOT NULL,
    notice_period_days INTEGER GENERATED ALWAYS AS (effective_date - announcement_date) STORED,
    
    -- Comunicação
    communication_plan JSONB, -- [{channel: 'email', date: '2025-12-01', template: '...'}]
    email_template TEXT,
    whatsapp_template TEXT,
    dashboard_message TEXT,
    faq_items JSONB,
    
    -- Retenção
    retention_strategy JSONB, -- [{segment: 'at_risk', action: 'offer_discount'}]
    predicted_churn_rate DECIMAL(5,2),
    predicted_churn_count INTEGER,
    
    -- Status
    status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'announced', 'in_effect', 'cancelled'
    
    announced_at TIMESTAMP WITH TIME ZONE,
    effective_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    
    -- Resultados
    actual_churn_count INTEGER,
    actual_revenue_impact DECIMAL(12,2),
    
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_price_increase_schedules_status ON price_increase_schedules(status);
CREATE INDEX idx_price_increase_schedules_announcement ON price_increase_schedules(announcement_date);
CREATE INDEX idx_price_increase_schedules_effective ON price_increase_schedules(effective_date);

COMMENT ON TABLE price_increase_schedules IS 'Agendamento de aumentos de preço';

-- =====================================================================================
-- 7. COMUNICAÇÕES DE AUMENTO ENVIADAS
-- =====================================================================================

CREATE TABLE IF NOT EXISTS price_increase_communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID NOT NULL REFERENCES price_increase_schedules(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Comunicação
    communication_type VARCHAR(50) NOT NULL, -- 'initial_notice', 'reminder_30d', 'reminder_7d', 'day_of', 'thank_you'
    channel VARCHAR(50) NOT NULL, -- 'email', 'whatsapp', 'sms', 'in_app', 'call'
    
    -- Conteúdo
    subject VARCHAR(255),
    message_body TEXT NOT NULL,
    attachments JSONB,
    
    -- Personalização
    personalization_data JSONB, -- Dados específicos do cliente
    
    -- Status
    status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'sent', 'delivered', 'read', 'failed'
    scheduled_for TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Resposta do cliente
    client_responded BOOLEAN DEFAULT false,
    client_response TEXT,
    client_sentiment VARCHAR(20), -- 'positive', 'neutral', 'negative', 'angry'
    responded_at TIMESTAMP WITH TIME ZONE,
    
    -- Ação tomada
    action_required BOOLEAN DEFAULT false,
    action_taken TEXT,
    handled_by UUID REFERENCES users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_price_communications_schedule ON price_increase_communications(schedule_id);
CREATE INDEX idx_price_communications_client ON price_increase_communications(client_id);
CREATE INDEX idx_price_communications_status ON price_increase_communications(status);
CREATE INDEX idx_price_communications_sent ON price_increase_communications(sent_at DESC);

COMMENT ON TABLE price_increase_communications IS 'Tracking de comunicações de aumento de preço';

-- =====================================================================================
-- 8. RENTABILIDADE POR SERVIÇO
-- =====================================================================================

CREATE TABLE IF NOT EXISTS service_profitability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES service_catalog(id) ON DELETE CASCADE,
    
    -- Período
    analysis_date DATE NOT NULL,
    period_type VARCHAR(20) DEFAULT 'monthly', -- 'monthly', 'quarterly', 'annual'
    
    -- Receita
    total_revenue DECIMAL(12,2) DEFAULT 0,
    clients_count INTEGER DEFAULT 0,
    average_revenue_per_client DECIMAL(10,2) DEFAULT 0,
    
    -- Custos
    direct_costs DECIMAL(10,2) DEFAULT 0, -- Custos diretos (hora trabalhada, ferramentas)
    indirect_costs DECIMAL(10,2) DEFAULT 0, -- Custos indiretos rateados
    total_costs DECIMAL(10,2) DEFAULT 0,
    
    -- Margens
    gross_profit DECIMAL(10,2) GENERATED ALWAYS AS (total_revenue - total_costs) STORED,
    gross_margin_percent DECIMAL(6,2) GENERATED ALWAYS AS (
        CASE WHEN total_revenue > 0 
        THEN ((total_revenue - total_costs) / total_revenue * 100)
        ELSE 0 END
    ) STORED,
    
    -- Tempo
    avg_hours_per_client DECIMAL(6,2) DEFAULT 0,
    total_hours_spent DECIMAL(8,2) DEFAULT 0,
    revenue_per_hour DECIMAL(10,2) GENERATED ALWAYS AS (
        CASE WHEN total_hours_spent > 0 
        THEN (total_revenue / total_hours_spent)
        ELSE 0 END
    ) STORED,
    
    -- ROI
    roi_percent DECIMAL(6,2) GENERATED ALWAYS AS (
        CASE WHEN total_costs > 0 
        THEN ((total_revenue - total_costs) / total_costs * 100)
        ELSE 0 END
    ) STORED,
    
    -- Status
    profitability_status VARCHAR(20), -- 'highly_profitable', 'profitable', 'break_even', 'loss'
    
    -- Recomendações da IA
    ai_recommendation TEXT,
    suggested_price_adjustment DECIMAL(6,2), -- % de ajuste sugerido
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(service_id, analysis_date, period_type)
);

CREATE INDEX idx_service_profitability_service ON service_profitability(service_id);
CREATE INDEX idx_service_profitability_date ON service_profitability(analysis_date DESC);
CREATE INDEX idx_service_profitability_margin ON service_profitability(gross_margin_percent DESC);
CREATE INDEX idx_service_profitability_status ON service_profitability(profitability_status);

COMMENT ON TABLE service_profitability IS 'Análise de rentabilidade por serviço';

-- =====================================================================================
-- 9. ANÁLISE COMPARATIVA DE PREÇOS (Benchmarking)
-- =====================================================================================

CREATE TABLE IF NOT EXISTS competitive_pricing_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Serviço sendo analisado
    our_service_id UUID NOT NULL REFERENCES service_catalog(id) ON DELETE CASCADE,
    our_current_price DECIMAL(10,2) NOT NULL,
    
    -- Mercado
    market_min_price DECIMAL(10,2),
    market_max_price DECIMAL(10,2),
    market_average_price DECIMAL(10,2),
    market_median_price DECIMAL(10,2),
    
    -- Nossa posição
    our_price_percentile INTEGER, -- Em que percentil estamos (0-100)
    our_price_vs_average_percent DECIMAL(6,2),
    price_positioning VARCHAR(50), -- 'budget', 'value', 'mid_market', 'premium', 'luxury'
    
    -- Análise por concorrente
    competitor_prices JSONB, -- [{competitor: 'X', price: 3000, tier: 'similar'}]
    
    -- Qualidade vs Preço
    our_value_score DECIMAL(5,2), -- 0-100 (qualidade percebida)
    market_avg_value_score DECIMAL(5,2),
    value_for_money_rating VARCHAR(20), -- 'excellent', 'good', 'fair', 'poor'
    
    -- Recomendação
    recommended_action VARCHAR(50), -- 'increase', 'decrease', 'maintain', 'restructure'
    recommended_price DECIMAL(10,2),
    recommended_price_justification TEXT,
    
    -- Oportunidades
    pricing_opportunities JSONB, -- [{opportunity: 'criar tier premium', potential_revenue: 50000}]
    competitive_gaps JSONB, -- Gaps que podemos explorar
    
    -- Análise temporal
    analysis_date DATE NOT NULL,
    previous_analysis_id UUID REFERENCES competitive_pricing_analysis(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_competitive_pricing_service ON competitive_pricing_analysis(our_service_id);
CREATE INDEX idx_competitive_pricing_date ON competitive_pricing_analysis(analysis_date DESC);

COMMENT ON TABLE competitive_pricing_analysis IS 'Análise comparativa de preços vs mercado';

-- =====================================================================================
-- 10. ALERTAS DE PRICING PARA SUPER ADMIN
-- =====================================================================================

CREATE TABLE IF NOT EXISTS pricing_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Alerta
    alert_type VARCHAR(50) NOT NULL, -- 'competitor_price_drop', 'inflation_threshold', 'margin_decline', 'opportunity_detected', 'optimal_time'
    alert_priority VARCHAR(20) DEFAULT 'medium', -- 'critical', 'high', 'medium', 'low'
    
    -- Detalhes
    alert_title VARCHAR(255) NOT NULL,
    alert_description TEXT NOT NULL,
    alert_data JSONB,
    
    -- Impacto
    estimated_revenue_impact DECIMAL(12,2),
    urgency_score DECIMAL(5,2), -- 0-100
    
    -- Recomendação
    recommended_action TEXT,
    action_deadline DATE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'new', -- 'new', 'viewed', 'in_progress', 'resolved', 'dismissed'
    viewed_by UUID REFERENCES users(id),
    viewed_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    
    -- Origem
    triggered_by VARCHAR(50) DEFAULT 'ai', -- 'ai', 'system', 'threshold', 'manual'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pricing_alerts_priority ON pricing_alerts(alert_priority);
CREATE INDEX idx_pricing_alerts_status ON pricing_alerts(status);
CREATE INDEX idx_pricing_alerts_created ON pricing_alerts(created_at DESC);
CREATE INDEX idx_pricing_alerts_urgency ON pricing_alerts(urgency_score DESC);

COMMENT ON TABLE pricing_alerts IS 'Alertas de pricing para o super admin';

-- =====================================================================================
-- 11. RECOMENDAÇÕES DE IA SOBRE PREÇOS
-- =====================================================================================

CREATE TABLE IF NOT EXISTS pricing_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Recomendação
    recommendation_type VARCHAR(50) NOT NULL, -- 'price_increase', 'price_decrease', 'new_tier', 'bundle_creation', 'seasonal_adjustment'
    service_id UUID REFERENCES service_catalog(id) ON DELETE CASCADE,
    
    -- Detalhes
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    rationale TEXT NOT NULL,
    
    -- Números
    current_state JSONB, -- Estado atual
    recommended_state JSONB, -- Estado recomendado
    predicted_impact JSONB, -- Impacto previsto
    
    -- Confiança
    confidence_score DECIMAL(5,2) DEFAULT 0, -- 0-100
    risk_level VARCHAR(20), -- 'low', 'medium', 'high'
    
    -- Prioridade
    priority_score DECIMAL(5,2) DEFAULT 0, -- 0-100
    estimated_roi DECIMAL(10,2),
    
    -- Implementação
    implementation_complexity VARCHAR(20), -- 'easy', 'medium', 'complex'
    estimated_time_to_implement_days INTEGER,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'under_review', 'approved', 'implemented', 'rejected'
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    
    -- IA
    model_version VARCHAR(50),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pricing_recommendations_service ON pricing_recommendations(service_id);
CREATE INDEX idx_pricing_recommendations_status ON pricing_recommendations(status);
CREATE INDEX idx_pricing_recommendations_priority ON pricing_recommendations(priority_score DESC);

COMMENT ON TABLE pricing_recommendations IS 'Recomendações de IA sobre precificação';

-- =====================================================================================
-- 12. RELATÓRIOS DE PRICING INTELLIGENCE
-- =====================================================================================

CREATE TABLE IF NOT EXISTS pricing_intelligence_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relatório
    report_name VARCHAR(255) NOT NULL,
    report_type VARCHAR(50) DEFAULT 'weekly', -- 'daily', 'weekly', 'monthly', 'quarterly', 'ad_hoc'
    report_period_start DATE NOT NULL,
    report_period_end DATE NOT NULL,
    
    -- Conteúdo
    executive_summary TEXT,
    
    -- Seções
    market_overview JSONB, -- Visão geral do mercado
    our_positioning JSONB, -- Nossa posição
    competitor_moves JSONB, -- Movimentações dos concorrentes
    opportunities JSONB, -- Oportunidades identificadas
    risks JSONB, -- Riscos identificados
    recommendations JSONB, -- Top recomendações
    
    -- KPIs
    kpis JSONB, -- {avg_price_change: 5%, market_share: 12%, ...}
    
    -- Anexos
    charts_urls JSONB,
    detailed_data_url VARCHAR(500),
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'published', 'archived'
    published_at TIMESTAMP WITH TIME ZONE,
    published_by UUID REFERENCES users(id),
    
    -- Distribuição
    recipients JSONB, -- [user_ids] que devem receber
    sent_to_recipients BOOLEAN DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Geração
    generated_by VARCHAR(20) DEFAULT 'ai', -- 'ai', 'manual'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pricing_reports_type ON pricing_intelligence_reports(report_type);
CREATE INDEX idx_pricing_reports_period ON pricing_intelligence_reports(report_period_end DESC);
CREATE INDEX idx_pricing_reports_status ON pricing_intelligence_reports(status);

COMMENT ON TABLE pricing_intelligence_reports IS 'Relatórios de inteligência de precificação';

-- =====================================================================================
-- TRIGGERS
-- =====================================================================================

CREATE TRIGGER update_pricing_strategies_timestamp
    BEFORE UPDATE ON pricing_strategies
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER update_pricing_simulations_timestamp
    BEFORE UPDATE ON pricing_simulations
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER update_pricing_ab_tests_timestamp
    BEFORE UPDATE ON pricing_ab_tests
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER update_price_increase_schedules_timestamp
    BEFORE UPDATE ON price_increase_schedules
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER update_pricing_alerts_timestamp
    BEFORE UPDATE ON pricing_alerts
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER update_pricing_recommendations_timestamp
    BEFORE UPDATE ON pricing_recommendations
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER update_pricing_reports_timestamp
    BEFORE UPDATE ON pricing_intelligence_reports
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

-- =====================================================================================
-- RLS (Row Level Security) - Apenas super admin
-- =====================================================================================

ALTER TABLE pricing_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_pricing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_pricing_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_increase_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_increase_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_profitability ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitive_pricing_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_intelligence_reports ENABLE ROW LEVEL SECURITY;

-- Apenas super admin tem acesso (tudo muito sensível)
CREATE POLICY super_admin_pricing_strategies ON pricing_strategies FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'super_admin')
);

CREATE POLICY super_admin_pricing_history ON service_pricing_history FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'super_admin')
);

CREATE POLICY super_admin_market_pricing ON market_pricing_data FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'super_admin')
);

CREATE POLICY super_admin_pricing_simulations ON pricing_simulations FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'super_admin')
);

CREATE POLICY super_admin_pricing_ab_tests ON pricing_ab_tests FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'super_admin')
);

CREATE POLICY super_admin_price_increases ON price_increase_schedules FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'super_admin')
);

CREATE POLICY super_admin_price_communications ON price_increase_communications FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'super_admin')
);

CREATE POLICY super_admin_service_profitability ON service_profitability FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'super_admin')
);

CREATE POLICY super_admin_competitive_pricing ON competitive_pricing_analysis FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'super_admin')
);

CREATE POLICY super_admin_pricing_alerts ON pricing_alerts FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'super_admin')
);

CREATE POLICY super_admin_pricing_recommendations ON pricing_recommendations FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'super_admin')
);

CREATE POLICY super_admin_pricing_reports ON pricing_intelligence_reports FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'super_admin')
);

-- =====================================================================================
-- FIM DA MIGRATION
-- =====================================================================================

COMMENT ON SCHEMA public IS 'Migration 31: Pricing Intelligence - Super Admin - Sistema completo de precificação inteligente';

