-- =====================================================================================
-- Migration: Inteligência de Concorrência
-- Descrição: Sistema completo de monitoramento, análise e inteligência competitiva
--            Monitora concorrentes, analisa sentimento, identifica tendências do setor
-- Versão: 1.0
-- Data: 2025-11-12
-- =====================================================================================

-- =====================================================================================
-- 1. CADASTRO DE CONCORRENTES
-- =====================================================================================

CREATE TABLE IF NOT EXISTS competitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação
    company_name VARCHAR(255) NOT NULL,
    trading_name VARCHAR(255),
    brand_name VARCHAR(255),
    
    -- Localização
    city VARCHAR(100),
    state VARCHAR(50),
    country VARCHAR(50) DEFAULT 'Brasil',
    
    -- Contatos
    website_url VARCHAR(500),
    email VARCHAR(255),
    phone VARCHAR(50),
    
    -- Redes sociais
    instagram_handle VARCHAR(100),
    facebook_page VARCHAR(255),
    linkedin_page VARCHAR(255),
    tiktok_handle VARCHAR(100),
    youtube_channel VARCHAR(255),
    twitter_handle VARCHAR(100),
    
    -- Classificação
    competitor_tier VARCHAR(20) DEFAULT 'medium', -- 'top', 'medium', 'small', 'emerging'
    threat_level VARCHAR(20) DEFAULT 'medium', -- 'critical', 'high', 'medium', 'low'
    market_position VARCHAR(50), -- 'leader', 'challenger', 'follower', 'niche'
    
    -- Dados de negócio
    estimated_revenue_annual DECIMAL(12,2),
    estimated_employees_count INTEGER,
    years_in_business INTEGER,
    service_areas JSONB, -- ['social_media', 'paid_ads', 'design', ...]
    target_industries JSONB,
    
    -- Análise
    strengths JSONB, -- ['preço competitivo', 'atendimento rápido', ...]
    weaknesses JSONB, -- ['site desatualizado', 'poucas reviews', ...]
    differentials JSONB,
    
    -- Monitoramento
    is_actively_monitored BOOLEAN DEFAULT true,
    monitoring_frequency VARCHAR(20) DEFAULT 'daily', -- 'realtime', 'hourly', 'daily', 'weekly'
    last_monitored_at TIMESTAMP WITH TIME ZONE,
    
    -- Relacionamento com nossos clientes
    shared_clients_count INTEGER DEFAULT 0,
    clients_won_from_them INTEGER DEFAULT 0,
    clients_lost_to_them INTEGER DEFAULT 0,
    
    -- Metadados
    notes TEXT,
    added_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_competitors_tier ON competitors(competitor_tier);
CREATE INDEX idx_competitors_threat ON competitors(threat_level);
CREATE INDEX idx_competitors_monitored ON competitors(is_actively_monitored) WHERE is_actively_monitored = true;
CREATE INDEX idx_competitors_name ON competitors(company_name);

COMMENT ON TABLE competitors IS 'Cadastro de concorrentes para monitoramento';

-- =====================================================================================
-- 2. PERFIS SOCIAIS DOS CONCORRENTES
-- =====================================================================================

CREATE TABLE IF NOT EXISTS competitor_social_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
    
    -- Plataforma
    platform VARCHAR(50) NOT NULL, -- 'instagram', 'facebook', 'linkedin', 'tiktok', 'youtube', 'twitter'
    profile_url VARCHAR(500) NOT NULL,
    profile_username VARCHAR(255),
    
    -- Métricas atuais
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    posts_count INTEGER DEFAULT 0,
    avg_likes_per_post INTEGER DEFAULT 0,
    avg_comments_per_post INTEGER DEFAULT 0,
    avg_shares_per_post INTEGER DEFAULT 0,
    engagement_rate DECIMAL(8,4) DEFAULT 0,
    
    -- Crescimento
    followers_growth_30d INTEGER DEFAULT 0,
    followers_growth_90d INTEGER DEFAULT 0,
    posts_frequency_per_week DECIMAL(4,1) DEFAULT 0,
    
    -- Análise de conteúdo
    most_common_post_types JSONB, -- ['image', 'video', 'carousel']
    most_used_hashtags JSONB,
    posting_schedule JSONB, -- [{day: 'monday', times: ['09:00', '15:00']}]
    content_themes JSONB, -- ['cases', 'tips', 'behind_the_scenes', ...]
    
    -- Status
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    last_post_date TIMESTAMP WITH TIME ZONE,
    
    -- Monitoramento
    last_scraped_at TIMESTAMP WITH TIME ZONE,
    scraping_status VARCHAR(20) DEFAULT 'active', -- 'active', 'paused', 'error', 'blocked'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(competitor_id, platform)
);

CREATE INDEX idx_competitor_social_competitor ON competitor_social_profiles(competitor_id);
CREATE INDEX idx_competitor_social_platform ON competitor_social_profiles(platform);
CREATE INDEX idx_competitor_social_engagement ON competitor_social_profiles(engagement_rate DESC);

COMMENT ON TABLE competitor_social_profiles IS 'Perfis de redes sociais dos concorrentes';

-- =====================================================================================
-- 3. RASTREAMENTO DE CONTEÚDO DOS CONCORRENTES
-- =====================================================================================

CREATE TABLE IF NOT EXISTS competitor_content_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
    social_profile_id UUID REFERENCES competitor_social_profiles(id) ON DELETE SET NULL,
    
    -- Identificação do conteúdo
    platform VARCHAR(50) NOT NULL,
    post_id VARCHAR(255), -- ID do post na plataforma
    post_url VARCHAR(500),
    post_type VARCHAR(50), -- 'image', 'video', 'carousel', 'reel', 'story', 'article'
    
    -- Conteúdo
    caption TEXT,
    media_urls JSONB, -- [urls das imagens/vídeos]
    hashtags JSONB,
    mentions JSONB,
    
    -- Métricas
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    saves_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    engagement_rate DECIMAL(8,4) DEFAULT 0,
    
    -- Análise de performance
    performance_score DECIMAL(5,2), -- 0-100 (comparado com média deles)
    is_high_performer BOOLEAN DEFAULT false,
    virality_score DECIMAL(5,2),
    
    -- Análise de conteúdo
    sentiment VARCHAR(20), -- 'positive', 'neutral', 'negative'
    content_category VARCHAR(50), -- 'promotional', 'educational', 'entertaining', 'news'
    detected_topics JSONB,
    
    -- Timing
    published_at TIMESTAMP WITH TIME ZONE,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Flag para aprender
    marked_for_learning BOOLEAN DEFAULT false, -- Se true, nosso ML vai analisar e aprender
    learning_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_competitor_content_competitor ON competitor_content_tracking(competitor_id);
CREATE INDEX idx_competitor_content_platform ON competitor_content_tracking(platform);
CREATE INDEX idx_competitor_content_performance ON competitor_content_tracking(is_high_performer) WHERE is_high_performer = true;
CREATE INDEX idx_competitor_content_published ON competitor_content_tracking(published_at DESC);

COMMENT ON TABLE competitor_content_tracking IS 'Rastreamento de conteúdo publicado pelos concorrentes';

-- =====================================================================================
-- 4. MÉTRICAS DOS CONCORRENTES (Snapshot periódico)
-- =====================================================================================

CREATE TABLE IF NOT EXISTS competitor_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
    
    -- Período
    snapshot_date DATE NOT NULL,
    snapshot_type VARCHAR(20) DEFAULT 'daily', -- 'daily', 'weekly', 'monthly'
    
    -- Métricas agregadas de todas as plataformas
    total_followers INTEGER DEFAULT 0,
    total_posts INTEGER DEFAULT 0,
    total_engagement INTEGER DEFAULT 0,
    avg_engagement_rate DECIMAL(8,4) DEFAULT 0,
    
    -- Por plataforma
    instagram_followers INTEGER DEFAULT 0,
    facebook_followers INTEGER DEFAULT 0,
    linkedin_followers INTEGER DEFAULT 0,
    tiktok_followers INTEGER DEFAULT 0,
    youtube_subscribers INTEGER DEFAULT 0,
    
    -- Crescimento
    followers_growth_vs_previous INTEGER DEFAULT 0,
    posts_published_count INTEGER DEFAULT 0,
    
    -- Análise
    estimated_reach INTEGER DEFAULT 0,
    estimated_impressions INTEGER DEFAULT 0,
    estimated_ad_spend DECIMAL(10,2), -- Estimativa de quanto estão investindo em ads
    
    -- Comparação com a gente
    our_followers_vs_theirs_percent DECIMAL(6,2),
    our_engagement_vs_theirs_percent DECIMAL(6,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(competitor_id, snapshot_date, snapshot_type)
);

CREATE INDEX idx_competitor_metrics_competitor ON competitor_metrics(competitor_id);
CREATE INDEX idx_competitor_metrics_date ON competitor_metrics(snapshot_date DESC);

COMMENT ON TABLE competitor_metrics IS 'Snapshots periódicos de métricas dos concorrentes';

-- =====================================================================================
-- 5. ANÁLISE COMPARATIVA (Relatórios de comparação)
-- =====================================================================================

CREATE TABLE IF NOT EXISTS competitor_analysis_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação
    report_title VARCHAR(255) NOT NULL,
    report_type VARCHAR(50) DEFAULT 'benchmark', -- 'benchmark', 'swot', 'gap_analysis', 'trend_analysis'
    
    -- Escopo
    competitors_analyzed JSONB, -- [competitor_ids]
    analysis_period_start DATE,
    analysis_period_end DATE,
    
    -- Resultados
    executive_summary TEXT,
    key_findings JSONB, -- [{finding: 'string', impact: 'high|medium|low', evidence: 'string'}]
    
    -- Comparações
    market_share_analysis JSONB,
    pricing_comparison JSONB,
    service_offerings_comparison JSONB,
    content_strategy_comparison JSONB,
    
    -- Rankings
    overall_ranking JSONB, -- [{competitor_id: UUID, rank: 1, score: 85}]
    category_rankings JSONB, -- {social_media: [...], content_quality: [...], engagement: [...]}
    
    -- Oportunidades e ameaças
    opportunities JSONB, -- [{opportunity: 'string', priority: 'high', action: 'string'}]
    threats JSONB, -- [{threat: 'string', severity: 'high', mitigation: 'string'}]
    
    -- Recomendações
    strategic_recommendations TEXT,
    tactical_actions JSONB,
    
    -- Métricas
    confidence_score DECIMAL(5,2),
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'published', 'archived'
    generated_by VARCHAR(50) DEFAULT 'ai', -- 'ai', 'manual'
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP WITH TIME ZONE,
    published_by UUID REFERENCES users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_competitor_reports_type ON competitor_analysis_reports(report_type);
CREATE INDEX idx_competitor_reports_status ON competitor_analysis_reports(status);
CREATE INDEX idx_competitor_reports_published ON competitor_analysis_reports(published_at DESC);

COMMENT ON TABLE competitor_analysis_reports IS 'Relatórios de análise comparativa com concorrentes';

-- =====================================================================================
-- 6. ALERTAS DE CONCORRENTES
-- =====================================================================================

CREATE TABLE IF NOT EXISTS competitor_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
    
    -- Tipo de alerta
    alert_type VARCHAR(50) NOT NULL, -- 'price_drop', 'new_service', 'viral_content', 'negative_reviews', 'staff_change', 'follower_spike', 'campaign_launch'
    alert_severity VARCHAR(20) DEFAULT 'medium', -- 'critical', 'high', 'medium', 'low'
    
    -- Detalhes
    alert_title VARCHAR(255) NOT NULL,
    alert_description TEXT NOT NULL,
    alert_data JSONB, -- Dados específicos do alerta
    
    -- Impacto
    potential_impact VARCHAR(20), -- 'positive', 'neutral', 'negative'
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
    detected_by VARCHAR(50) DEFAULT 'ai', -- 'ai', 'system', 'manual'
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_competitor_alerts_competitor ON competitor_alerts(competitor_id);
CREATE INDEX idx_competitor_alerts_severity ON competitor_alerts(alert_severity);
CREATE INDEX idx_competitor_alerts_status ON competitor_alerts(status);
CREATE INDEX idx_competitor_alerts_detected ON competitor_alerts(detected_at DESC);

COMMENT ON TABLE competitor_alerts IS 'Alertas sobre movimentações importantes dos concorrentes';

-- =====================================================================================
-- 7. TENDÊNCIAS POR SETOR/INDÚSTRIA
-- =====================================================================================

CREATE TABLE IF NOT EXISTS market_trends_by_industry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Indústria
    industry_name VARCHAR(100) NOT NULL,
    industry_category VARCHAR(50), -- 'B2B', 'B2C', 'SaaS', 'ecommerce', 'services', ...
    
    -- Tendência
    trend_name VARCHAR(255) NOT NULL,
    trend_description TEXT,
    trend_type VARCHAR(50), -- 'content', 'platform', 'strategy', 'technology', 'consumer_behavior'
    
    -- Status
    trend_phase VARCHAR(20) DEFAULT 'emerging', -- 'emerging', 'growth', 'mature', 'declining'
    adoption_rate DECIMAL(5,2), -- % de empresas do setor adotando
    
    -- Dados
    supporting_data JSONB,
    examples JSONB, -- [{company: 'X', implementation: 'Y', result: 'Z'}]
    
    -- Análise
    opportunity_score DECIMAL(5,2), -- 0-100
    difficulty_score DECIMAL(5,2), -- 0-100 (quão difícil é implementar)
    investment_required VARCHAR(20), -- 'low', 'medium', 'high'
    time_to_implement_days INTEGER,
    
    -- Previsões
    predicted_peak_date DATE,
    predicted_longevity_months INTEGER,
    
    -- Recomendações
    should_we_adopt BOOLEAN,
    recommended_approach TEXT,
    risks TEXT,
    
    -- Fontes
    data_sources JSONB,
    confidence_score DECIMAL(5,2),
    
    -- Temporal
    first_detected_at TIMESTAMP WITH TIME ZONE,
    last_updated_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_market_trends_industry ON market_trends_by_industry(industry_name);
CREATE INDEX idx_market_trends_phase ON market_trends_by_industry(trend_phase);
CREATE INDEX idx_market_trends_opportunity ON market_trends_by_industry(opportunity_score DESC);

COMMENT ON TABLE market_trends_by_industry IS 'Tendências específicas por setor/indústria';

-- =====================================================================================
-- 8. NOTÍCIAS DO SETOR
-- =====================================================================================

CREATE TABLE IF NOT EXISTS industry_news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Notícia
    headline VARCHAR(500) NOT NULL,
    summary TEXT,
    full_content TEXT,
    source_url VARCHAR(500),
    
    -- Fonte
    source_name VARCHAR(255), -- 'TechCrunch', 'G1', 'Valor Econômico', etc
    author VARCHAR(255),
    published_date TIMESTAMP WITH TIME ZONE,
    
    -- Classificação
    industry VARCHAR(100),
    news_category VARCHAR(50), -- 'technology', 'regulation', 'market', 'company', 'trend'
    relevance_score DECIMAL(5,2), -- 0-100 (quão relevante é para nós)
    
    -- Sentimento
    sentiment VARCHAR(20), -- 'positive', 'neutral', 'negative'
    sentiment_confidence DECIMAL(5,2),
    
    -- Análise
    key_points JSONB,
    potential_impact TEXT,
    related_competitors JSONB, -- [competitor_ids] se menciona concorrentes
    
    -- Tags
    tags JSONB,
    keywords JSONB,
    
    -- Interação
    marked_as_important BOOLEAN DEFAULT false,
    marked_by UUID REFERENCES users(id),
    notes TEXT,
    
    -- Detecção
    detected_by VARCHAR(50) DEFAULT 'ai', -- 'ai', 'rss', 'api', 'manual'
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_industry_news_industry ON industry_news(industry);
CREATE INDEX idx_industry_news_relevance ON industry_news(relevance_score DESC);
CREATE INDEX idx_industry_news_published ON industry_news(published_date DESC);
CREATE INDEX idx_industry_news_important ON industry_news(marked_as_important) WHERE marked_as_important = true;

COMMENT ON TABLE industry_news IS 'Notícias relevantes do setor e mercado';

-- =====================================================================================
-- TRIGGERS
-- =====================================================================================

CREATE TRIGGER update_competitors_timestamp
    BEFORE UPDATE ON competitors
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER update_competitor_social_profiles_timestamp
    BEFORE UPDATE ON competitor_social_profiles
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER update_competitor_content_tracking_timestamp
    BEFORE UPDATE ON competitor_content_tracking
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER update_competitor_analysis_reports_timestamp
    BEFORE UPDATE ON competitor_analysis_reports
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER update_competitor_alerts_timestamp
    BEFORE UPDATE ON competitor_alerts
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER update_market_trends_by_industry_timestamp
    BEFORE UPDATE ON market_trends_by_industry
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

-- =====================================================================================
-- RLS (Row Level Security)
-- =====================================================================================

ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_social_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_content_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_analysis_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_trends_by_industry ENABLE ROW LEVEL SECURITY;
ALTER TABLE industry_news ENABLE ROW LEVEL SECURITY;

-- Super admin e comercial têm acesso total
CREATE POLICY admin_comercial_competitors ON competitors FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('super_admin', 'admin', 'comercial')
    )
);

CREATE POLICY admin_comercial_competitor_social ON competitor_social_profiles FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('super_admin', 'admin', 'comercial')
    )
);

CREATE POLICY admin_comercial_competitor_content ON competitor_content_tracking FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('super_admin', 'admin', 'comercial')
    )
);

CREATE POLICY admin_comercial_competitor_metrics ON competitor_metrics FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('super_admin', 'admin', 'comercial')
    )
);

CREATE POLICY admin_comercial_competitor_reports ON competitor_analysis_reports FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('super_admin', 'admin', 'comercial')
    )
);

CREATE POLICY admin_comercial_competitor_alerts ON competitor_alerts FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('super_admin', 'admin', 'comercial')
    )
);

CREATE POLICY admin_market_trends ON market_trends_by_industry FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('super_admin', 'admin')
    )
);

CREATE POLICY admin_industry_news ON industry_news FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('super_admin', 'admin')
    )
);

-- Gestores podem visualizar
CREATE POLICY gestores_view_competitors ON competitors FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role = 'gestor'
    )
);

-- =====================================================================================
-- FIM DA MIGRATION
-- =====================================================================================

COMMENT ON SCHEMA public IS 'Migration 27: Inteligência de Concorrência - Sistema completo de monitoramento competitivo';

