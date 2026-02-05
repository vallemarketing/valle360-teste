-- =====================================================
-- MIGRATION: Executive Dashboard Intelligence
-- Descrição: Dashboard inteligente com IA para super admins
-- Dependências: 20251112000019_create_predictive_intelligence_system.sql
-- =====================================================

-- =====================================================
-- 1. TABELA: executive_insights
-- Insights priorizados por IA
-- =====================================================

CREATE TABLE IF NOT EXISTS executive_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  insight_type VARCHAR(50) NOT NULL CHECK (insight_type IN (
    'opportunity',
    'risk',
    'achievement',
    'anomaly',
    'trend',
    'recommendation'
  )),
  
  priority INTEGER NOT NULL CHECK (priority >= 1 AND priority <= 10),
  
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  
  impact VARCHAR(20) CHECK (impact IN ('critical', 'high', 'medium', 'low')),
  
  -- Entidade relacionada
  related_entity_type VARCHAR(50),
  related_entity_id UUID,
  
  -- Métricas
  metric_name VARCHAR(100),
  metric_value NUMERIC(12, 2),
  metric_change NUMERIC(12, 2),
  metric_change_percentage NUMERIC(5, 2),
  
  -- Ações sugeridas
  suggested_actions JSONB DEFAULT '[]'::jsonb,
  quick_action_available BOOLEAN DEFAULT false,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'acted_on', 'dismissed', 'expired')),
  
  acted_on_at TIMESTAMP WITH TIME ZONE,
  acted_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  -- Relevância temporal
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_executive_insights_type ON executive_insights(insight_type);
CREATE INDEX idx_executive_insights_priority ON executive_insights(priority DESC);
CREATE INDEX idx_executive_insights_status ON executive_insights(status);
CREATE INDEX idx_executive_insights_active ON executive_insights(status, expires_at) WHERE status = 'active';

COMMENT ON TABLE executive_insights IS 'Insights priorizados por IA para dashboard executivo';

-- =====================================================
-- 2. TABELA: daily_executive_summary
-- Resumo diário automático
-- =====================================================

CREATE TABLE IF NOT EXISTS daily_executive_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  summary_date DATE NOT NULL UNIQUE,
  
  -- Resumo textual gerado por IA
  summary_text TEXT NOT NULL,
  highlights JSONB DEFAULT '[]'::jsonb,
  
  -- Métricas principais
  total_revenue NUMERIC(12, 2),
  revenue_vs_yesterday NUMERIC(5, 2),
  revenue_vs_last_week NUMERIC(5, 2),
  
  active_clients INTEGER,
  new_clients INTEGER,
  churned_clients INTEGER,
  
  high_risk_clients INTEGER,
  critical_alerts INTEGER,
  
  opportunities_identified INTEGER,
  opportunities_value NUMERIC(12, 2),
  
  -- Top ações do dia
  top_actions JSONB DEFAULT '[]'::jsonb,
  
  -- Celebrações
  achievements JSONB DEFAULT '[]'::jsonb,
  
  -- Comparações
  comparison_data JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_daily_summary_date ON daily_executive_summary(summary_date DESC);

COMMENT ON TABLE daily_executive_summary IS 'Resumo executivo diário gerado automaticamente';

-- =====================================================
-- 3. TABELA: dashboard_widgets
-- Widgets customizáveis do dashboard
-- =====================================================

CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  widget_type VARCHAR(50) NOT NULL CHECK (widget_type IN (
    'kpi_card',
    'chart',
    'alert_list',
    'insight_card',
    'action_items',
    'trend_indicator',
    'health_overview',
    'revenue_forecast'
  )),
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Configuração
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Dados (cache)
  cached_data JSONB,
  last_refresh_at TIMESTAMP WITH TIME ZONE,
  
  -- Visibilidade
  is_active BOOLEAN DEFAULT true,
  
  -- Ordem
  display_order INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_dashboard_widgets_type ON dashboard_widgets(widget_type);
CREATE INDEX idx_dashboard_widgets_active ON dashboard_widgets(is_active) WHERE is_active = true;

COMMENT ON TABLE dashboard_widgets IS 'Widgets configuráveis do dashboard executivo';

-- =====================================================
-- 4. TABELA: user_dashboard_preferences
-- Preferências de dashboard por usuário
-- =====================================================

CREATE TABLE IF NOT EXISTS user_dashboard_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Layout
  layout_config JSONB DEFAULT '{}'::jsonb,
  
  -- Widgets favoritos
  pinned_widgets UUID[] DEFAULT ARRAY[]::UUID[],
  hidden_widgets UUID[] DEFAULT ARRAY[]::UUID[],
  
  -- Preferências de notificação no dashboard
  show_celebrations BOOLEAN DEFAULT true,
  show_insights BOOLEAN DEFAULT true,
  show_alerts BOOLEAN DEFAULT true,
  
  -- Tema e visualização
  preferred_view VARCHAR(20) DEFAULT 'grid' CHECK (preferred_view IN ('grid', 'list', 'compact')),
  
  -- Aprendizado
  viewed_insights UUID[] DEFAULT ARRAY[]::UUID[],
  dismissed_insights UUID[] DEFAULT ARRAY[]::UUID[],
  
  -- Timestamps
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_user_dashboard_preferences_user ON user_dashboard_preferences(user_id);

COMMENT ON TABLE user_dashboard_preferences IS 'Preferências personalizadas de dashboard';

-- =====================================================
-- 5. TABELA: priority_action_items
-- Itens de ação priorizados por IA
-- =====================================================

CREATE TABLE IF NOT EXISTS priority_action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  action_type VARCHAR(50) NOT NULL,
  
  priority_score INTEGER NOT NULL CHECK (priority_score >= 1 AND priority_score <= 100),
  
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  
  -- Cliente/entidade relacionada
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  related_entity_type VARCHAR(50),
  related_entity_id UUID,
  
  -- Impacto estimado
  estimated_revenue_impact NUMERIC(12, 2),
  estimated_time_required INTEGER, -- minutos
  
  -- Urgência
  urgency VARCHAR(20) CHECK (urgency IN ('immediate', 'today', 'this_week', 'this_month')),
  deadline DATE,
  
  -- Ações sugeridas
  suggested_approach TEXT,
  resources_needed TEXT[],
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  
  assigned_to UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Resultado
  outcome TEXT,
  actual_revenue_impact NUMERIC(12, 2),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_priority_actions_priority ON priority_action_items(priority_score DESC);
CREATE INDEX idx_priority_actions_urgency ON priority_action_items(urgency);
CREATE INDEX idx_priority_actions_status ON priority_action_items(status);
CREATE INDEX idx_priority_actions_assigned ON priority_action_items(assigned_to);

COMMENT ON TABLE priority_action_items IS 'Ações priorizadas automaticamente por IA';

-- =====================================================
-- 6. TABELA: anomaly_detections
-- Detecção automática de anomalias
-- =====================================================

CREATE TABLE IF NOT EXISTS anomaly_detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  anomaly_type VARCHAR(50) NOT NULL,
  
  severity VARCHAR(20) CHECK (severity IN ('info', 'warning', 'critical')),
  
  metric_name VARCHAR(100) NOT NULL,
  expected_value NUMERIC(12, 2),
  actual_value NUMERIC(12, 2),
  deviation_percentage NUMERIC(5, 2),
  
  description TEXT NOT NULL,
  
  -- Contexto
  entity_type VARCHAR(50),
  entity_id UUID,
  
  time_period_start TIMESTAMP WITH TIME ZONE,
  time_period_end TIMESTAMP WITH TIME ZONE,
  
  -- Análise
  potential_causes JSONB DEFAULT '[]'::jsonb,
  recommended_investigation TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'detected' CHECK (status IN ('detected', 'investigating', 'explained', 'resolved', 'false_positive')),
  
  investigated_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  
  -- Timestamps
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_anomaly_detections_type ON anomaly_detections(anomaly_type);
CREATE INDEX idx_anomaly_detections_severity ON anomaly_detections(severity);
CREATE INDEX idx_anomaly_detections_status ON anomaly_detections(status);
CREATE INDEX idx_anomaly_detections_detected ON anomaly_detections(detected_at DESC);

COMMENT ON TABLE anomaly_detections IS 'Anomalias detectadas automaticamente por IA';

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER update_dashboard_widgets_updated_at
  BEFORE UPDATE ON dashboard_widgets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_dashboard_preferences_updated_at
  BEFORE UPDATE ON user_dashboard_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION: Gerar Summary Diário
-- =====================================================

CREATE OR REPLACE FUNCTION generate_daily_executive_summary(p_date DATE DEFAULT CURRENT_DATE)
RETURNS UUID AS $$
DECLARE
  v_summary_id UUID;
  v_revenue NUMERIC;
  v_active_clients INTEGER;
  v_high_risk INTEGER;
  v_summary_text TEXT;
BEGIN
  -- Calcular métricas
  SELECT COALESCE(SUM(amount), 0) INTO v_revenue
  FROM financial_transactions
  WHERE DATE(created_at) = p_date AND status = 'paid';
  
  SELECT COUNT(*) INTO v_active_clients
  FROM clients WHERE is_active = true;
  
  SELECT COUNT(*) INTO v_high_risk
  FROM churn_predictions WHERE risk_level IN ('critical', 'high');
  
  -- Gerar texto do resumo
  v_summary_text := format(
    'Receita do dia: R$ %s. %s clientes ativos. %s clientes em alto risco.',
    v_revenue, v_active_clients, v_high_risk
  );
  
  -- Inserir summary
  INSERT INTO daily_executive_summary (
    summary_date,
    summary_text,
    total_revenue,
    active_clients,
    high_risk_clients
  ) VALUES (
    p_date,
    v_summary_text,
    v_revenue,
    v_active_clients,
    v_high_risk
  )
  ON CONFLICT (summary_date)
  DO UPDATE SET
    summary_text = EXCLUDED.summary_text,
    total_revenue = EXCLUDED.total_revenue,
    active_clients = EXCLUDED.active_clients,
    high_risk_clients = EXCLUDED.high_risk_clients,
    generated_at = now()
  RETURNING id INTO v_summary_id;
  
  RETURN v_summary_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_daily_executive_summary IS 'Gera resumo executivo diário automaticamente';

-- =====================================================
-- FUNCTION: Priorizar Action Items
-- =====================================================

CREATE OR REPLACE FUNCTION prioritize_action_items()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_client RECORD;
BEGIN
  -- Limpar action items expirados
  DELETE FROM priority_action_items
  WHERE status = 'pending' AND expires_at < now();
  
  -- Criar action items para clientes em risco crítico
  FOR v_client IN
    SELECT c.id, c.name, cp.churn_probability, cp.days_until_churn
    FROM clients c
    JOIN churn_predictions cp ON cp.client_id = c.id
    WHERE cp.risk_level = 'critical'
    AND NOT EXISTS (
      SELECT 1 FROM priority_action_items
      WHERE client_id = c.id
      AND status = 'pending'
      AND action_type = 'prevent_churn'
    )
  LOOP
    INSERT INTO priority_action_items (
      action_type,
      priority_score,
      title,
      description,
      client_id,
      estimated_revenue_impact,
      urgency,
      deadline,
      suggested_approach
    ) VALUES (
      'prevent_churn',
      90 + (v_client.churn_probability * 0.1)::INTEGER,
      'URGENTE: Prevenir Churn - ' || v_client.name,
      'Cliente com ' || v_client.churn_probability || '% de probabilidade de churn em ' || v_client.days_until_churn || ' dias.',
      v_client.id,
      10000.00, -- Valor médio de contrato
      'immediate',
      CURRENT_DATE + 3,
      'Ligar imediatamente, agendar reunião, revisar entregas.'
    );
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION prioritize_action_items IS 'Prioriza automaticamente itens de ação';

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE executive_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_executive_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE priority_action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomaly_detections ENABLE ROW LEVEL SECURITY;

-- Super admins e heads veem insights
CREATE POLICY "Executives veem insights"
  ON executive_insights FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type IN ('super_admin', 'marketing_head')
    )
  );

-- Todos veem widgets
CREATE POLICY "Ver widgets"
  ON dashboard_widgets FOR SELECT
  USING (is_active = true);

-- Super admins gerenciam action items
CREATE POLICY "Executives gerenciam actions"
  ON priority_action_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type IN ('super_admin', 'marketing_head', 'commercial')
    )
  );

-- =====================================================
-- Fim da Migration: Executive Dashboard Intelligence
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 20: Executive Dashboard Intelligence concluída!';
  RAISE NOTICE '📊 6 tabelas criadas';
  RAISE NOTICE '🤖 Dashboard inteligente com IA implementado';
END $$;

