-- =====================================================================================
-- Migration: Analytics em Tempo Real
-- Descrição: Sistema de analytics em tempo real com dashboard live, alertas instantâneos,
--            tracking de eventos, visualização de tráfego e conversões ao vivo
-- Versão: 1.0
-- Data: 2025-11-12
-- =====================================================================================

-- =====================================================================================
-- 1. EVENTOS EM TEMPO REAL (Tracking de todas as interações)
-- =====================================================================================

CREATE TABLE IF NOT EXISTS realtime_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação do evento
    event_name VARCHAR(100) NOT NULL, -- 'page_view', 'post_published', 'conversion', 'click', 'form_submit', 'purchase'
    event_category VARCHAR(50), -- 'engagement', 'conversion', 'traffic', 'social', 'campaign'
    event_action VARCHAR(100),
    event_label VARCHAR(255),
    
    -- Contexto
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    campaign_id UUID,
    platform VARCHAR(50), -- 'instagram', 'facebook', 'google_ads', 'website', 'linkedin'
    
    -- Dados do evento
    event_value DECIMAL(10,2), -- Valor monetário se aplicável
    event_data JSONB, -- Dados adicionais do evento
    
    -- Origem/Destino
    source_url TEXT,
    destination_url TEXT,
    referrer TEXT,
    
    -- Usuário/Sessão
    user_id VARCHAR(255), -- ID anônimo do usuário
    session_id VARCHAR(255),
    device_type VARCHAR(20), -- 'desktop', 'mobile', 'tablet'
    browser VARCHAR(50),
    os VARCHAR(50),
    
    -- Localização
    country VARCHAR(100),
    region VARCHAR(100),
    city VARCHAR(100),
    ip_address VARCHAR(50),
    
    -- Timestamp preciso
    event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Processamento
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Particionamento por data para performance
CREATE INDEX idx_realtime_events_timestamp ON realtime_events(event_timestamp DESC);
CREATE INDEX idx_realtime_events_client ON realtime_events(client_id);
CREATE INDEX idx_realtime_events_name ON realtime_events(event_name);
CREATE INDEX idx_realtime_events_platform ON realtime_events(platform);
CREATE INDEX idx_realtime_events_session ON realtime_events(session_id);
CREATE INDEX idx_realtime_events_processed ON realtime_events(processed) WHERE processed = false;

COMMENT ON TABLE realtime_events IS 'Eventos em tempo real para analytics';

-- =====================================================================================
-- 2. MÉTRICAS EM TEMPO REAL (Agregações ao vivo)
-- =====================================================================================

CREATE TABLE IF NOT EXISTS realtime_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Escopo
    metric_scope VARCHAR(50) NOT NULL, -- 'global', 'client', 'campaign', 'platform'
    scope_id UUID, -- client_id, campaign_id, etc
    
    -- Métrica
    metric_name VARCHAR(100) NOT NULL, -- 'active_users', 'conversion_rate', 'engagement_rate', 'revenue'
    metric_value DECIMAL(12,2) NOT NULL,
    metric_unit VARCHAR(20), -- 'count', 'percent', 'currency', 'seconds'
    
    -- Comparação
    previous_value DECIMAL(12,2),
    change_value DECIMAL(12,2) GENERATED ALWAYS AS (metric_value - COALESCE(previous_value, 0)) STORED,
    change_percent DECIMAL(6,2) GENERATED ALWAYS AS (
        CASE WHEN previous_value > 0 
        THEN ((metric_value - previous_value) / previous_value * 100)
        ELSE 0 END
    ) STORED,
    
    -- Tendência
    trend VARCHAR(20), -- 'up', 'down', 'stable', 'spike', 'drop'
    
    -- Período
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    period_type VARCHAR(20) DEFAULT 'realtime', -- 'realtime', 'last_hour', 'last_24h', 'last_7d'
    
    -- Metadados
    breakdown JSONB, -- Detalhamento adicional
    
    -- Atualização
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_realtime_metrics_scope ON realtime_metrics(metric_scope, scope_id);
CREATE INDEX idx_realtime_metrics_name ON realtime_metrics(metric_name);
CREATE INDEX idx_realtime_metrics_updated ON realtime_metrics(last_updated_at DESC);
CREATE INDEX idx_realtime_metrics_trend ON realtime_metrics(trend);

COMMENT ON TABLE realtime_metrics IS 'Métricas agregadas em tempo real';

-- =====================================================================================
-- 3. SESSÕES ATIVAS (Quem está online agora)
-- =====================================================================================

CREATE TABLE IF NOT EXISTS active_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação
    session_id VARCHAR(255) NOT NULL UNIQUE,
    user_id VARCHAR(255),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Localização
    current_page TEXT,
    previous_page TEXT,
    
    -- Dispositivo
    device_type VARCHAR(20),
    browser VARCHAR(50),
    os VARCHAR(50),
    screen_resolution VARCHAR(20),
    
    -- Geografia
    country VARCHAR(100),
    region VARCHAR(100),
    city VARCHAR(100),
    ip_address VARCHAR(50),
    
    -- Comportamento
    page_views_count INTEGER DEFAULT 0,
    events_count INTEGER DEFAULT 0,
    time_on_site_seconds INTEGER DEFAULT 0,
    
    -- Estado
    is_active BOOLEAN DEFAULT true,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Início e fim
    session_started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    session_ended_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_active_sessions_session ON active_sessions(session_id);
CREATE INDEX idx_active_sessions_client ON active_sessions(client_id);
CREATE INDEX idx_active_sessions_active ON active_sessions(is_active) WHERE is_active = true;
CREATE INDEX idx_active_sessions_last_activity ON active_sessions(last_activity_at DESC);

COMMENT ON TABLE active_sessions IS 'Sessões ativas no momento (quem está online)';

-- =====================================================================================
-- 4. TRÁFEGO EM TEMPO REAL
-- =====================================================================================

CREATE TABLE IF NOT EXISTS realtime_traffic (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Agregação temporal (a cada minuto)
    timestamp_minute TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Escopo
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    platform VARCHAR(50),
    
    -- Métricas de tráfego
    active_users INTEGER DEFAULT 0,
    new_users INTEGER DEFAULT 0,
    page_views INTEGER DEFAULT 0,
    unique_page_views INTEGER DEFAULT 0,
    avg_session_duration_seconds INTEGER DEFAULT 0,
    bounce_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Fontes de tráfego
    traffic_sources JSONB, -- {organic: 45, direct: 30, social: 20, paid: 5}
    
    -- Páginas mais visitadas
    top_pages JSONB, -- [{url: '/produto-x', views: 123}, ...]
    
    -- Dispositivos
    desktop_users INTEGER DEFAULT 0,
    mobile_users INTEGER DEFAULT 0,
    tablet_users INTEGER DEFAULT 0,
    
    -- Geografia
    top_countries JSONB, -- {Brazil: 80, USA: 15, ...}
    top_cities JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(timestamp_minute, client_id, platform)
);

CREATE INDEX idx_realtime_traffic_timestamp ON realtime_traffic(timestamp_minute DESC);
CREATE INDEX idx_realtime_traffic_client ON realtime_traffic(client_id);
CREATE INDEX idx_realtime_traffic_platform ON realtime_traffic(platform);

COMMENT ON TABLE realtime_traffic IS 'Agregações de tráfego por minuto para dashboard ao vivo';

-- =====================================================================================
-- 5. CONVERSÕES EM TEMPO REAL
-- =====================================================================================

CREATE TABLE IF NOT EXISTS realtime_conversions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação
    conversion_type VARCHAR(50) NOT NULL, -- 'lead', 'sale', 'signup', 'download', 'form_submit', 'call'
    conversion_value DECIMAL(10,2) DEFAULT 0,
    
    -- Contexto
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    campaign_id UUID,
    platform VARCHAR(50),
    
    -- Origem da conversão
    source VARCHAR(100), -- 'google_ads', 'facebook', 'organic', 'email', 'direct'
    medium VARCHAR(100), -- 'cpc', 'social', 'organic', 'email', 'referral'
    campaign_name VARCHAR(255),
    
    -- Dados da conversão
    conversion_data JSONB, -- Dados específicos da conversão
    
    -- Atribuição
    first_touch_source VARCHAR(100), -- Primeiro contato
    last_touch_source VARCHAR(100), -- Último contato antes da conversão
    attribution_model VARCHAR(50), -- 'first_touch', 'last_touch', 'linear', 'time_decay'
    
    -- Usuário
    user_id VARCHAR(255),
    session_id VARCHAR(255),
    
    -- Timing
    time_to_convert_minutes INTEGER, -- Tempo desde primeiro contato até conversão
    
    -- Timestamp
    converted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_realtime_conversions_client ON realtime_conversions(client_id);
CREATE INDEX idx_realtime_conversions_type ON realtime_conversions(conversion_type);
CREATE INDEX idx_realtime_conversions_campaign ON realtime_conversions(campaign_id);
CREATE INDEX idx_realtime_conversions_converted ON realtime_conversions(converted_at DESC);
CREATE INDEX idx_realtime_conversions_platform ON realtime_conversions(platform);

COMMENT ON TABLE realtime_conversions IS 'Conversões acontecendo em tempo real';

-- =====================================================================================
-- 6. CAMPANHAS ATIVAS (Status ao vivo)
-- =====================================================================================

CREATE TABLE IF NOT EXISTS active_campaigns_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Campanha
    campaign_id UUID NOT NULL,
    campaign_name VARCHAR(255) NOT NULL,
    campaign_type VARCHAR(50), -- 'paid_ads', 'social_organic', 'email', 'influencer'
    
    -- Cliente
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    platform VARCHAR(50),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    status VARCHAR(20) DEFAULT 'running', -- 'running', 'paused', 'ended', 'scheduled'
    
    -- Métricas ao vivo
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    spend DECIMAL(10,2) DEFAULT 0,
    revenue DECIMAL(10,2) DEFAULT 0,
    
    -- Calculadas
    ctr DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE WHEN impressions > 0 THEN (clicks::DECIMAL / impressions * 100) ELSE 0 END
    ) STORED,
    cpc DECIMAL(10,2) GENERATED ALWAYS AS (
        CASE WHEN clicks > 0 THEN (spend / clicks) ELSE 0 END
    ) STORED,
    roas DECIMAL(10,2) GENERATED ALWAYS AS (
        CASE WHEN spend > 0 THEN (revenue / spend) ELSE 0 END
    ) STORED,
    
    -- Budget
    daily_budget DECIMAL(10,2),
    total_budget DECIMAL(10,2),
    budget_used_percent DECIMAL(5,2),
    budget_pace VARCHAR(20), -- 'under_pace', 'on_pace', 'over_pace'
    
    -- Performance
    performance_score DECIMAL(5,2), -- 0-100
    performance_status VARCHAR(20), -- 'excellent', 'good', 'average', 'poor'
    
    -- Alertas
    has_alerts BOOLEAN DEFAULT false,
    alerts JSONB, -- [{alert: 'budget_exceeded', severity: 'high'}]
    
    -- Temporal
    started_at TIMESTAMP WITH TIME ZONE,
    ends_at TIMESTAMP WITH TIME ZONE,
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_active_campaigns_client ON active_campaigns_status(client_id);
CREATE INDEX idx_active_campaigns_active ON active_campaigns_status(is_active) WHERE is_active = true;
CREATE INDEX idx_active_campaigns_platform ON active_campaigns_status(platform);
CREATE INDEX idx_active_campaigns_performance ON active_campaigns_status(performance_score DESC);

COMMENT ON TABLE active_campaigns_status IS 'Status em tempo real de campanhas ativas';

-- =====================================================================================
-- 7. ALERTAS INSTANTÂNEOS
-- =====================================================================================

CREATE TABLE IF NOT EXISTS realtime_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Alerta
    alert_type VARCHAR(50) NOT NULL, -- 'spike_traffic', 'drop_conversions', 'budget_exceeded', 'viral_post', 'negative_comment', 'website_down'
    alert_severity VARCHAR(20) DEFAULT 'medium', -- 'critical', 'high', 'medium', 'low', 'info'
    
    -- Contexto
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    campaign_id UUID,
    platform VARCHAR(50),
    
    -- Detalhes
    alert_title VARCHAR(255) NOT NULL,
    alert_message TEXT NOT NULL,
    alert_data JSONB,
    
    -- Métrica que disparou
    metric_name VARCHAR(100),
    current_value DECIMAL(12,2),
    threshold_value DECIMAL(12,2),
    threshold_exceeded_by_percent DECIMAL(6,2),
    
    -- Ação recomendada
    recommended_action TEXT,
    action_url VARCHAR(500),
    
    -- Status
    status VARCHAR(20) DEFAULT 'new', -- 'new', 'acknowledged', 'investigating', 'resolved', 'dismissed'
    acknowledged_by UUID REFERENCES users(id),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    
    -- Notificações
    notification_sent BOOLEAN DEFAULT false,
    notification_channels JSONB, -- ['email', 'sms', 'push', 'slack']
    notified_users JSONB, -- [user_ids]
    
    -- Timestamp
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_realtime_alerts_client ON realtime_alerts(client_id);
CREATE INDEX idx_realtime_alerts_severity ON realtime_alerts(alert_severity);
CREATE INDEX idx_realtime_alerts_status ON realtime_alerts(status);
CREATE INDEX idx_realtime_alerts_triggered ON realtime_alerts(triggered_at DESC);
CREATE INDEX idx_realtime_alerts_type ON realtime_alerts(alert_type);

COMMENT ON TABLE realtime_alerts IS 'Alertas instantâneos de analytics em tempo real';

-- =====================================================================================
-- 8. PERFORMANCE DE POSTS EM TEMPO REAL
-- =====================================================================================

CREATE TABLE IF NOT EXISTS realtime_post_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Post
    post_id VARCHAR(255) NOT NULL,
    post_type VARCHAR(50), -- 'feed', 'story', 'reel', 'video', 'carousel'
    post_url TEXT,
    
    -- Cliente/Plataforma
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    
    -- Publicação
    published_at TIMESTAMP WITH TIME ZONE NOT NULL,
    age_minutes INTEGER GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - published_at)) / 60
    ) STORED,
    
    -- Métricas ao vivo
    impressions INTEGER DEFAULT 0,
    reach INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    
    -- Taxas calculadas
    engagement_rate DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE WHEN reach > 0 
        THEN ((likes + comments + shares + saves)::DECIMAL / reach * 100)
        ELSE 0 END
    ) STORED,
    
    -- Velocidade de engajamento
    engagement_velocity INTEGER DEFAULT 0, -- Engajamentos por hora
    is_trending BOOLEAN DEFAULT false,
    virality_score DECIMAL(5,2) DEFAULT 0, -- 0-100
    
    -- Sentimento dos comentários
    positive_comments_percent DECIMAL(5,2) DEFAULT 0,
    negative_comments_percent DECIMAL(5,2) DEFAULT 0,
    sentiment_score DECIMAL(5,2) DEFAULT 0, -- -100 a +100
    
    -- Comparação
    performance_vs_average VARCHAR(20), -- 'much_better', 'better', 'average', 'worse', 'much_worse'
    
    -- Última atualização
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(post_id, platform, client_id)
);

CREATE INDEX idx_realtime_post_client ON realtime_post_performance(client_id);
CREATE INDEX idx_realtime_post_platform ON realtime_post_performance(platform);
CREATE INDEX idx_realtime_post_published ON realtime_post_performance(published_at DESC);
CREATE INDEX idx_realtime_post_trending ON realtime_post_performance(is_trending) WHERE is_trending = true;
CREATE INDEX idx_realtime_post_engagement ON realtime_post_performance(engagement_rate DESC);

COMMENT ON TABLE realtime_post_performance IS 'Performance de posts em tempo real';

-- =====================================================================================
-- 9. DASHBOARD DE ANOMALIAS (Detecção automática)
-- =====================================================================================

CREATE TABLE IF NOT EXISTS anomaly_detections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Anomalia
    anomaly_type VARCHAR(50) NOT NULL, -- 'traffic_spike', 'traffic_drop', 'conversion_spike', 'conversion_drop', 'unusual_pattern'
    
    -- Contexto
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    platform VARCHAR(50),
    
    -- Valores
    expected_value DECIMAL(12,2) NOT NULL,
    actual_value DECIMAL(12,2) NOT NULL,
    deviation_percent DECIMAL(6,2) GENERATED ALWAYS AS (
        CASE WHEN expected_value > 0 
        THEN ((actual_value - expected_value) / expected_value * 100)
        ELSE 0 END
    ) STORED,
    
    -- Severidade
    severity_score DECIMAL(5,2), -- 0-100
    severity_level VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
    
    -- Análise
    possible_causes JSONB, -- [{cause: 'viral post', probability: 0.85}, ...]
    recommended_actions JSONB,
    
    -- Status
    status VARCHAR(20) DEFAULT 'detected', -- 'detected', 'investigating', 'explained', 'false_positive'
    investigated_by UUID REFERENCES users(id),
    investigation_notes TEXT,
    
    -- Detecção
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    detection_method VARCHAR(50) DEFAULT 'ml', -- 'ml', 'threshold', 'statistical'
    confidence_score DECIMAL(5,2), -- 0-100
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_anomaly_detections_client ON anomaly_detections(client_id);
CREATE INDEX idx_anomaly_detections_type ON anomaly_detections(anomaly_type);
CREATE INDEX idx_anomaly_detections_severity ON anomaly_detections(severity_level);
CREATE INDEX idx_anomaly_detections_detected ON anomaly_detections(detected_at DESC);

COMMENT ON TABLE anomaly_detections IS 'Detecção automática de anomalias em métricas';

-- =====================================================================================
-- TRIGGERS
-- =====================================================================================

CREATE TRIGGER update_active_sessions_timestamp
    BEFORE UPDATE ON active_sessions
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER update_active_campaigns_status_timestamp
    BEFORE UPDATE ON active_campaigns_status
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER update_realtime_alerts_timestamp
    BEFORE UPDATE ON realtime_alerts
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER update_anomaly_detections_timestamp
    BEFORE UPDATE ON anomaly_detections
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

-- =====================================================================================
-- RLS (Row Level Security)
-- =====================================================================================

ALTER TABLE realtime_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE realtime_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE realtime_traffic ENABLE ROW LEVEL SECURITY;
ALTER TABLE realtime_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_campaigns_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE realtime_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE realtime_post_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomaly_detections ENABLE ROW LEVEL SECURITY;

-- Admin, gestores e analistas veem tudo
CREATE POLICY admin_realtime_events ON realtime_events FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('super_admin', 'admin', 'gestor', 'analista')
    )
);

CREATE POLICY admin_realtime_metrics ON realtime_metrics FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('super_admin', 'admin', 'gestor', 'analista')
    )
);

CREATE POLICY admin_active_sessions ON active_sessions FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('super_admin', 'admin', 'gestor', 'analista')
    )
);

CREATE POLICY admin_realtime_traffic ON realtime_traffic FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('super_admin', 'admin', 'gestor', 'analista')
    )
);

CREATE POLICY admin_realtime_conversions ON realtime_conversions FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('super_admin', 'admin', 'gestor', 'analista')
    )
);

CREATE POLICY admin_active_campaigns ON active_campaigns_status FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('super_admin', 'admin', 'gestor')
    )
);

CREATE POLICY admin_realtime_alerts ON realtime_alerts FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('super_admin', 'admin', 'gestor')
    )
);

CREATE POLICY admin_realtime_post_performance ON realtime_post_performance FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('super_admin', 'admin', 'gestor', 'social_media')
    )
);

CREATE POLICY admin_anomaly_detections ON anomaly_detections FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('super_admin', 'admin', 'gestor', 'analista')
    )
);

-- =====================================================================================
-- FIM DA MIGRATION
-- =====================================================================================

COMMENT ON SCHEMA public IS 'Migration 32: Analytics em Tempo Real - Dashboard live, alertas instantâneos, tracking ao vivo';

