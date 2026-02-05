-- =====================================================================================
-- Migration: Machine Learning para Marketing
-- Descrição: Sistema de aprendizado contínuo que analisa padrões de marketing,
--            comportamento de clientes, tendências de mercado e performance de conteúdo
-- Versão: 1.0
-- Data: 2025-11-12
-- =====================================================================================

-- =====================================================================================
-- 1. PADRÕES DE MARKETING (O que funciona melhor)
-- =====================================================================================

CREATE TABLE IF NOT EXISTS ml_marketing_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern_type VARCHAR(50) NOT NULL, -- 'post_type', 'timing', 'hashtag', 'copy_tone', 'channel', 'format'
    pattern_name VARCHAR(255) NOT NULL,
    pattern_description TEXT,
    
    -- Dados de análise
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    industry VARCHAR(100), -- Se null, aplica-se a todos
    
    -- Métricas de performance
    success_rate DECIMAL(5,2) DEFAULT 0, -- % de sucesso
    avg_engagement_rate DECIMAL(8,4) DEFAULT 0,
    avg_conversion_rate DECIMAL(8,4) DEFAULT 0,
    avg_reach INTEGER DEFAULT 0,
    avg_roi DECIMAL(10,2) DEFAULT 0,
    
    -- Dados aprendidos
    best_time_to_post TIME,
    best_day_of_week INTEGER, -- 0=domingo, 6=sábado
    optimal_frequency_per_week INTEGER,
    recommended_budget DECIMAL(10,2),
    
    -- Contexto
    sample_size INTEGER DEFAULT 0, -- Quantos posts/campanhas foram analisados
    confidence_score DECIMAL(5,2) DEFAULT 0, -- 0-100 (confiança da IA)
    last_trained_at TIMESTAMP WITH TIME ZONE,
    
    -- Recomendações
    recommendation TEXT,
    action_items JSONB, -- [{action: 'string', priority: 'high|medium|low', impact: 'string'}]
    
    -- Metadados
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    
    -- Índices
    CONSTRAINT unique_pattern_per_client UNIQUE(pattern_type, pattern_name, client_id)
);

CREATE INDEX idx_ml_marketing_patterns_client ON ml_marketing_patterns(client_id);
CREATE INDEX idx_ml_marketing_patterns_type ON ml_marketing_patterns(pattern_type);
CREATE INDEX idx_ml_marketing_patterns_confidence ON ml_marketing_patterns(confidence_score DESC);
CREATE INDEX idx_ml_marketing_patterns_active ON ml_marketing_patterns(is_active) WHERE is_active = true;

COMMENT ON TABLE ml_marketing_patterns IS 'Padrões de marketing aprendidos pela IA';

-- =====================================================================================
-- 2. PERFORMANCE DE CONTEÚDO (Aprendizado sobre tipos de conteúdo)
-- =====================================================================================

CREATE TABLE IF NOT EXISTS ml_content_performance_learning (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação
    content_type VARCHAR(50) NOT NULL, -- 'post', 'story', 'reel', 'video', 'article', 'ad'
    content_format VARCHAR(50), -- 'image', 'video', 'carousel', 'text', 'link'
    platform VARCHAR(50), -- 'instagram', 'facebook', 'linkedin', 'tiktok', 'youtube'
    
    -- Cliente/Indústria
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    industry VARCHAR(100),
    
    -- Características do conteúdo que performaram bem
    optimal_length_chars INTEGER, -- Tamanho ideal do texto
    optimal_duration_seconds INTEGER, -- Duração ideal de vídeos
    optimal_image_ratio VARCHAR(20), -- '1:1', '16:9', '9:16', '4:5'
    optimal_hashtag_count INTEGER,
    optimal_cta_type VARCHAR(50), -- 'link', 'comment', 'share', 'save', 'like'
    
    -- Elementos visuais
    color_palette JSONB, -- ['#FF5733', '#C70039', ...] cores que funcionam
    visual_style VARCHAR(50), -- 'minimal', 'bold', 'professional', 'playful'
    
    -- Copy writing
    tone_of_voice VARCHAR(50), -- 'formal', 'casual', 'humorous', 'inspirational', 'educational'
    emoji_usage VARCHAR(20), -- 'none', 'minimal', 'moderate', 'heavy'
    question_in_copy BOOLEAN, -- Fazer pergunta aumenta engajamento?
    urgency_in_copy BOOLEAN, -- Senso de urgência funciona?
    
    -- Métricas agregadas
    avg_engagement_rate DECIMAL(8,4) DEFAULT 0,
    avg_reach INTEGER DEFAULT 0,
    avg_impressions INTEGER DEFAULT 0,
    avg_saves INTEGER DEFAULT 0,
    avg_shares INTEGER DEFAULT 0,
    avg_comments INTEGER DEFAULT 0,
    avg_click_rate DECIMAL(8,4) DEFAULT 0,
    avg_conversion_rate DECIMAL(8,4) DEFAULT 0,
    
    -- Análise
    sample_size INTEGER DEFAULT 0,
    confidence_score DECIMAL(5,2) DEFAULT 0,
    last_analyzed_at TIMESTAMP WITH TIME ZONE,
    
    -- Insights
    key_insights TEXT,
    do_this JSONB, -- ['Use vídeos curtos', 'Poste às 18h', ...]
    dont_do_this JSONB, -- ['Evite textos longos', 'Não poste domingo', ...]
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ml_content_learning_client ON ml_content_performance_learning(client_id);
CREATE INDEX idx_ml_content_learning_platform ON ml_content_performance_learning(platform);
CREATE INDEX idx_ml_content_learning_type ON ml_content_performance_learning(content_type);

COMMENT ON TABLE ml_content_performance_learning IS 'Aprendizado sobre qual tipo de conteúdo performa melhor';

-- =====================================================================================
-- 3. PADRÕES DE COMPORTAMENTO DE CLIENTES
-- =====================================================================================

CREATE TABLE IF NOT EXISTS ml_client_behavior_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Segmentação
    behavior_segment VARCHAR(100) NOT NULL, -- 'high_engagement', 'churn_risk', 'growth_potential', 'satisfied', 'needs_attention'
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    
    -- Características do segmento
    avg_contract_value DECIMAL(10,2),
    avg_lifetime_months INTEGER,
    avg_nps_score DECIMAL(3,1),
    avg_payment_delay_days INTEGER,
    
    -- Padrões identificados
    renewal_probability DECIMAL(5,2), -- 0-100%
    upsell_probability DECIMAL(5,2),
    referral_probability DECIMAL(5,2),
    churn_risk_score DECIMAL(5,2),
    
    -- Gatilhos de comportamento
    positive_triggers JSONB, -- [{'trigger': 'entrega rápida', 'impact': 'high'}, ...]
    negative_triggers JSONB, -- [{'trigger': 'atraso na entrega', 'impact': 'high'}, ...]
    
    -- Recomendações
    recommended_actions JSONB,
    best_time_to_contact TIME,
    best_channel VARCHAR(50), -- 'whatsapp', 'email', 'call', 'meeting'
    
    -- Predições
    predicted_ltv DECIMAL(10,2), -- Lifetime value previsto
    predicted_churn_date DATE,
    optimal_upsell_timing VARCHAR(50), -- 'now', '1_month', '3_months', '6_months'
    
    -- Análise
    sample_size INTEGER DEFAULT 0,
    confidence_score DECIMAL(5,2) DEFAULT 0,
    last_analyzed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ml_client_behavior_client ON ml_client_behavior_patterns(client_id);
CREATE INDEX idx_ml_client_behavior_segment ON ml_client_behavior_patterns(behavior_segment);
CREATE INDEX idx_ml_client_behavior_churn ON ml_client_behavior_patterns(churn_risk_score DESC);

COMMENT ON TABLE ml_client_behavior_patterns IS 'Padrões de comportamento de clientes identificados pela IA';

-- =====================================================================================
-- 4. TENDÊNCIAS DE MERCADO (O que está acontecendo no mercado)
-- =====================================================================================

CREATE TABLE IF NOT EXISTS ml_market_trends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação
    trend_name VARCHAR(255) NOT NULL,
    trend_category VARCHAR(50), -- 'content_format', 'platform', 'hashtag', 'topic', 'behavior', 'technology'
    industry VARCHAR(100),
    
    -- Status da tendência
    trend_status VARCHAR(20) DEFAULT 'emerging', -- 'emerging', 'growing', 'peak', 'declining', 'dead'
    trend_velocity VARCHAR(20), -- 'explosive', 'fast', 'moderate', 'slow'
    
    -- Dados da tendência
    search_volume INTEGER DEFAULT 0,
    search_volume_change_percent DECIMAL(6,2), -- Variação % vs período anterior
    mentions_count INTEGER DEFAULT 0,
    mentions_growth_rate DECIMAL(6,2),
    
    -- Análise de sentimento
    positive_sentiment_percent DECIMAL(5,2),
    negative_sentiment_percent DECIMAL(5,2),
    neutral_sentiment_percent DECIMAL(5,2),
    
    -- Origem dos dados
    data_sources JSONB, -- ['google_trends', 'twitter', 'instagram', 'news', ...]
    geographic_relevance VARCHAR(50), -- 'global', 'brazil', 'sao_paulo', 'regional'
    
    -- Previsões
    predicted_peak_date DATE,
    predicted_longevity_months INTEGER,
    opportunity_score DECIMAL(5,2), -- 0-100 (quão boa é a oportunidade)
    
    -- Recomendações
    recommendation TEXT,
    action_plan JSONB,
    target_audience JSONB,
    
    -- Exemplos
    success_examples JSONB, -- [{brand: 'X', campaign: 'Y', result: 'Z'}, ...]
    related_keywords JSONB,
    
    -- Metadados
    first_detected_at TIMESTAMP WITH TIME ZONE,
    last_updated_at TIMESTAMP WITH TIME ZONE,
    confidence_score DECIMAL(5,2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ml_market_trends_status ON ml_market_trends(trend_status);
CREATE INDEX idx_ml_market_trends_opportunity ON ml_market_trends(opportunity_score DESC);
CREATE INDEX idx_ml_market_trends_industry ON ml_market_trends(industry);
CREATE INDEX idx_ml_market_trends_category ON ml_market_trends(trend_category);

COMMENT ON TABLE ml_market_trends IS 'Tendências de mercado identificadas automaticamente pela IA';

-- =====================================================================================
-- 5. LOG DE PREDIÇÕES (Para medir acurácia da IA)
-- =====================================================================================

CREATE TABLE IF NOT EXISTS ml_predictions_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Tipo de predição
    prediction_type VARCHAR(50) NOT NULL, -- 'churn', 'conversion', 'engagement', 'virality', 'roi', 'optimal_time'
    prediction_target VARCHAR(50), -- 'client', 'post', 'campaign', 'employee'
    target_id UUID,
    
    -- Predição
    predicted_value JSONB, -- Valor previsto (pode ser número, boolean, string, objeto)
    predicted_probability DECIMAL(5,2), -- Confiança na predição (0-100)
    predicted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    predicted_for_date DATE, -- Para quando a predição é válida
    
    -- Resultado real
    actual_value JSONB,
    actual_recorded_at TIMESTAMP WITH TIME ZONE,
    
    -- Acurácia
    was_correct BOOLEAN,
    error_margin DECIMAL(8,4), -- Margem de erro
    accuracy_score DECIMAL(5,2), -- 0-100
    
    -- Contexto
    model_version VARCHAR(50),
    features_used JSONB, -- Quais features foram usadas para a predição
    
    -- Metadados
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ml_predictions_type ON ml_predictions_log(prediction_type);
CREATE INDEX idx_ml_predictions_target ON ml_predictions_log(target_id);
CREATE INDEX idx_ml_predictions_accuracy ON ml_predictions_log(accuracy_score DESC);
CREATE INDEX idx_ml_predictions_date ON ml_predictions_log(predicted_for_date);

COMMENT ON TABLE ml_predictions_log IS 'Log de todas as predições para medir acurácia da IA';

-- =====================================================================================
-- 6. HISTÓRICO DE TREINAMENTO DE MODELOS
-- =====================================================================================

CREATE TABLE IF NOT EXISTS ml_model_training_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação do modelo
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    model_type VARCHAR(50), -- 'classification', 'regression', 'clustering', 'neural_network'
    
    -- Dados de treinamento
    training_dataset_size INTEGER,
    training_started_at TIMESTAMP WITH TIME ZONE,
    training_completed_at TIMESTAMP WITH TIME ZONE,
    training_duration_seconds INTEGER,
    
    -- Features usadas
    features_used JSONB,
    hyperparameters JSONB,
    
    -- Métricas de performance
    accuracy DECIMAL(5,2),
    precision_score DECIMAL(5,2),
    recall DECIMAL(5,2),
    f1_score DECIMAL(5,2),
    rmse DECIMAL(10,4), -- Root Mean Square Error
    mae DECIMAL(10,4), -- Mean Absolute Error
    
    -- Validação
    validation_method VARCHAR(50), -- 'cross_validation', 'train_test_split', 'time_series_split'
    validation_score DECIMAL(5,2),
    
    -- Comparação com versão anterior
    previous_version VARCHAR(50),
    improvement_percent DECIMAL(6,2),
    
    -- Dados de produção
    deployed_to_production BOOLEAN DEFAULT false,
    deployed_at TIMESTAMP WITH TIME ZONE,
    is_active_model BOOLEAN DEFAULT false,
    
    -- Observações
    training_notes TEXT,
    issues_encountered TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_ml_model_training_name ON ml_model_training_history(model_name);
CREATE INDEX idx_ml_model_training_version ON ml_model_training_history(model_version);
CREATE INDEX idx_ml_model_training_active ON ml_model_training_history(is_active_model) WHERE is_active_model = true;

COMMENT ON TABLE ml_model_training_history IS 'Histórico de treinamento dos modelos de ML';

-- =====================================================================================
-- 7. INSIGHTS PARA SUPER ADMIN (Dashboard consolidado)
-- =====================================================================================

CREATE TABLE IF NOT EXISTS super_admin_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Classificação do insight
    insight_category VARCHAR(50) NOT NULL, -- 'opportunity', 'risk', 'trend', 'optimization', 'alert'
    insight_priority VARCHAR(20) DEFAULT 'medium', -- 'critical', 'high', 'medium', 'low'
    insight_title VARCHAR(255) NOT NULL,
    insight_description TEXT NOT NULL,
    
    -- Dados do insight
    affected_area VARCHAR(50), -- 'marketing', 'sales', 'operations', 'finance', 'hr', 'clients'
    affected_clients JSONB, -- [client_ids] se aplicável
    
    -- Métricas
    potential_impact_revenue DECIMAL(10,2), -- Impacto financeiro estimado
    potential_impact_percent DECIMAL(6,2), -- Impacto percentual
    confidence_score DECIMAL(5,2),
    urgency_score DECIMAL(5,2), -- 0-100 (quão urgente é agir)
    
    -- Recomendações
    recommended_actions JSONB, -- [{action: 'string', priority: 'high', effort: 'low', impact: 'high'}]
    estimated_implementation_hours INTEGER,
    estimated_roi DECIMAL(10,2),
    
    -- Dados de origem
    source_type VARCHAR(50), -- 'ml_pattern', 'market_trend', 'client_behavior', 'manual'
    source_id UUID,
    generated_by VARCHAR(50) DEFAULT 'ai', -- 'ai', 'system', 'user'
    
    -- Estado
    status VARCHAR(20) DEFAULT 'new', -- 'new', 'reviewing', 'approved', 'in_progress', 'completed', 'dismissed'
    viewed_by_admin BOOLEAN DEFAULT false,
    viewed_at TIMESTAMP WITH TIME ZONE,
    action_taken TEXT,
    action_taken_at TIMESTAMP WITH TIME ZONE,
    action_taken_by UUID REFERENCES users(id),
    
    -- Resultado (após ação)
    actual_impact_revenue DECIMAL(10,2),
    actual_impact_percent DECIMAL(6,2),
    result_notes TEXT,
    
    -- Metadados
    valid_until DATE, -- Insights podem expirar
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_super_admin_insights_priority ON super_admin_insights(insight_priority);
CREATE INDEX idx_super_admin_insights_status ON super_admin_insights(status);
CREATE INDEX idx_super_admin_insights_viewed ON super_admin_insights(viewed_by_admin);
CREATE INDEX idx_super_admin_insights_category ON super_admin_insights(insight_category);
CREATE INDEX idx_super_admin_insights_urgency ON super_admin_insights(urgency_score DESC);

COMMENT ON TABLE super_admin_insights IS 'Insights consolidados para o super admin';

-- =====================================================================================
-- TRIGGERS
-- =====================================================================================

CREATE TRIGGER update_ml_marketing_patterns_timestamp
    BEFORE UPDATE ON ml_marketing_patterns
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER update_ml_content_performance_learning_timestamp
    BEFORE UPDATE ON ml_content_performance_learning
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER update_ml_client_behavior_patterns_timestamp
    BEFORE UPDATE ON ml_client_behavior_patterns
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER update_ml_market_trends_timestamp
    BEFORE UPDATE ON ml_market_trends
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER update_super_admin_insights_timestamp
    BEFORE UPDATE ON super_admin_insights
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

-- =====================================================================================
-- RLS (Row Level Security)
-- =====================================================================================

ALTER TABLE ml_marketing_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_content_performance_learning ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_client_behavior_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_market_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_predictions_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_model_training_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE super_admin_insights ENABLE ROW LEVEL SECURITY;

-- Super admin vê tudo
CREATE POLICY super_admin_ml_marketing_patterns ON ml_marketing_patterns FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.user_id = auth.uid() AND user_profiles.role::text = 'super_admin')
);

CREATE POLICY super_admin_ml_content_learning ON ml_content_performance_learning FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.user_id = auth.uid() AND user_profiles.role::text = 'super_admin')
);

CREATE POLICY super_admin_ml_client_behavior ON ml_client_behavior_patterns FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.user_id = auth.uid() AND user_profiles.role::text = 'super_admin')
);

CREATE POLICY super_admin_ml_market_trends ON ml_market_trends FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.user_id = auth.uid() AND user_profiles.role::text = 'super_admin')
);

CREATE POLICY super_admin_ml_predictions ON ml_predictions_log FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.user_id = auth.uid() AND user_profiles.role::text = 'super_admin')
);

CREATE POLICY super_admin_ml_model_training ON ml_model_training_history FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.user_id = auth.uid() AND user_profiles.role::text = 'super_admin')
);

CREATE POLICY super_admin_insights ON super_admin_insights FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.user_id = auth.uid() AND user_profiles.role::text = 'super_admin')
);

-- Gestores podem ver patterns e trends gerais
CREATE POLICY gestores_view_ml_patterns ON ml_marketing_patterns FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.user_id = auth.uid() AND user_profiles.role::text IN ('manager', 'admin', 'super_admin'))
);

CREATE POLICY gestores_view_ml_trends ON ml_market_trends FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.user_id = auth.uid() AND user_profiles.role::text IN ('manager', 'admin', 'super_admin'))
);

-- =====================================================================================
-- FIM DA MIGRATION
-- =====================================================================================

COMMENT ON SCHEMA public IS 'Migration 26: Machine Learning para Marketing - Sistema completo de aprendizado';

