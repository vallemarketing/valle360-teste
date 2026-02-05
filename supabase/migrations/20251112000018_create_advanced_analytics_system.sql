-- =====================================================
-- MIGRATION: Advanced Analytics System
-- Descrição: ROI, funis, atribuição, LTV, CPA e predições
-- Dependências: Migrations anteriores
-- =====================================================

-- =====================================================
-- 1. TABELA: campaigns
-- Campanhas de marketing
-- =====================================================

CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  
  campaign_type VARCHAR(50) CHECK (campaign_type IN ('paid_search', 'paid_social', 'display', 'email', 'seo', 'social_organic', 'referral', 'direct', 'other')),
  
  channel VARCHAR(50) NOT NULL,
  
  start_date DATE NOT NULL,
  end_date DATE,
  
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
  
  objective VARCHAR(50),
  
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  UNIQUE(client_id, slug)
);

CREATE INDEX idx_campaigns_client ON campaigns(client_id);
CREATE INDEX idx_campaigns_type ON campaigns(campaign_type);
CREATE INDEX idx_campaigns_channel ON campaigns(channel);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_dates ON campaigns(start_date, end_date);

COMMENT ON TABLE campaigns IS 'Campanhas de marketing trackadas';

-- =====================================================
-- 2. TABELA: campaign_budgets
-- Orçamentos de campanhas
-- =====================================================

CREATE TABLE IF NOT EXISTS campaign_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  
  budget_type VARCHAR(20) CHECK (budget_type IN ('daily', 'total', 'monthly')),
  
  budget_amount NUMERIC(12, 2) NOT NULL,
  spent_amount NUMERIC(12, 2) DEFAULT 0.00,
  remaining_amount NUMERIC(12, 2) GENERATED ALWAYS AS (budget_amount - spent_amount) STORED,
  
  currency VARCHAR(3) DEFAULT 'BRL',
  
  period_start DATE,
  period_end DATE,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_campaign_budgets_campaign ON campaign_budgets(campaign_id);

COMMENT ON TABLE campaign_budgets IS 'Orçamentos e gastos de campanhas';

-- =====================================================
-- 3. TABELA: campaign_goals
-- Metas de campanhas
-- =====================================================

CREATE TABLE IF NOT EXISTS campaign_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  
  goal_type VARCHAR(50) NOT NULL,
  
  target_value NUMERIC(12, 2) NOT NULL,
  current_value NUMERIC(12, 2) DEFAULT 0.00,
  
  achievement_percentage NUMERIC(5, 2) GENERATED ALWAYS AS (
    CASE 
      WHEN target_value > 0 THEN (current_value / target_value * 100)
      ELSE 0
    END
  ) STORED,
  
  unit VARCHAR(20),
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_campaign_goals_campaign ON campaign_goals(campaign_id);

COMMENT ON TABLE campaign_goals IS 'Metas e objetivos de campanhas';

-- =====================================================
-- 4. TABELA: campaign_metrics_daily
-- Métricas diárias de campanhas
-- =====================================================

CREATE TABLE IF NOT EXISTS campaign_metrics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  
  date DATE NOT NULL,
  
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  
  ctr NUMERIC(5, 2) GENERATED ALWAYS AS (
    CASE 
      WHEN impressions > 0 THEN (clicks::NUMERIC / impressions * 100)
      ELSE 0
    END
  ) STORED,
  
  conversion_rate NUMERIC(5, 2) GENERATED ALWAYS AS (
    CASE 
      WHEN clicks > 0 THEN (conversions::NUMERIC / clicks * 100)
      ELSE 0
    END
  ) STORED,
  
  spend NUMERIC(12, 2) DEFAULT 0.00,
  revenue NUMERIC(12, 2) DEFAULT 0.00,
  
  roi NUMERIC(12, 2) GENERATED ALWAYS AS (
    CASE 
      WHEN spend > 0 THEN ((revenue - spend) / spend * 100)
      ELSE 0
    END
  ) STORED,
  
  cpc NUMERIC(10, 2) GENERATED ALWAYS AS (
    CASE 
      WHEN clicks > 0 THEN (spend / clicks)
      ELSE 0
    END
  ) STORED,
  
  cpa NUMERIC(10, 2) GENERATED ALWAYS AS (
    CASE 
      WHEN conversions > 0 THEN (spend / conversions)
      ELSE 0
    END
  ) STORED,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  UNIQUE(campaign_id, date)
);

CREATE INDEX idx_campaign_metrics_daily_campaign ON campaign_metrics_daily(campaign_id);
CREATE INDEX idx_campaign_metrics_daily_date ON campaign_metrics_daily(date DESC);

COMMENT ON TABLE campaign_metrics_daily IS 'Métricas diárias de performance de campanhas';

-- =====================================================
-- 5. TABELA: conversion_funnels
-- Funis de conversão
-- =====================================================

CREATE TABLE IF NOT EXISTS conversion_funnels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  is_active BOOLEAN DEFAULT true,
  
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_conversion_funnels_client ON conversion_funnels(client_id);

COMMENT ON TABLE conversion_funnels IS 'Funis de conversão definidos';

-- =====================================================
-- 6. TABELA: funnel_steps
-- Etapas dos funis
-- =====================================================

CREATE TABLE IF NOT EXISTS funnel_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id UUID REFERENCES conversion_funnels(id) ON DELETE CASCADE NOT NULL,
  
  step_number INTEGER NOT NULL,
  step_name VARCHAR(255) NOT NULL,
  
  event_name VARCHAR(100) NOT NULL,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  UNIQUE(funnel_id, step_number)
);

CREATE INDEX idx_funnel_steps_funnel ON funnel_steps(funnel_id);

COMMENT ON TABLE funnel_steps IS 'Etapas individuais dos funis';

-- =====================================================
-- 7. TABELA: funnel_events
-- Eventos de conversão no funil
-- =====================================================

CREATE TABLE IF NOT EXISTS funnel_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  funnel_id UUID REFERENCES conversion_funnels(id) ON DELETE CASCADE NOT NULL,
  step_id UUID REFERENCES funnel_steps(id) ON DELETE CASCADE NOT NULL,
  
  session_id VARCHAR(255) NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  
  event_data JSONB DEFAULT '{}'::jsonb,
  
  occurred_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_funnel_events_funnel ON funnel_events(funnel_id);
CREATE INDEX idx_funnel_events_step ON funnel_events(step_id);
CREATE INDEX idx_funnel_events_session ON funnel_events(session_id);
CREATE INDEX idx_funnel_events_occurred ON funnel_events(occurred_at DESC);

COMMENT ON TABLE funnel_events IS 'Eventos registrados em cada etapa do funil';

-- =====================================================
-- 8. TABELA: attribution_models
-- Modelos de atribuição
-- =====================================================

CREATE TABLE IF NOT EXISTS attribution_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name VARCHAR(100) NOT NULL UNIQUE,
  
  model_type VARCHAR(50) NOT NULL CHECK (model_type IN ('first_touch', 'last_touch', 'linear', 'time_decay', 'position_based', 'data_driven')),
  
  description TEXT,
  
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  is_default BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_attribution_models_type ON attribution_models(model_type);

COMMENT ON TABLE attribution_models IS 'Modelos de atribuição de conversões';

-- =====================================================
-- 9. TABELA: touchpoints
-- Pontos de contato do cliente
-- =====================================================

CREATE TABLE IF NOT EXISTS touchpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  session_id VARCHAR(255) NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  
  touchpoint_type VARCHAR(50) NOT NULL,
  
  channel VARCHAR(50) NOT NULL,
  source VARCHAR(100),
  medium VARCHAR(100),
  campaign VARCHAR(255),
  
  page_url TEXT,
  referrer_url TEXT,
  
  device_type VARCHAR(20),
  browser VARCHAR(50),
  
  occurred_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_touchpoints_session ON touchpoints(session_id);
CREATE INDEX idx_touchpoints_user ON touchpoints(user_id);
CREATE INDEX idx_touchpoints_client ON touchpoints(client_id);
CREATE INDEX idx_touchpoints_channel ON touchpoints(channel);
CREATE INDEX idx_touchpoints_occurred ON touchpoints(occurred_at DESC);

COMMENT ON TABLE touchpoints IS 'Pontos de contato na jornada do cliente';

-- =====================================================
-- 10. TABELA: conversion_paths
-- Jornadas completas de conversão
-- =====================================================

CREATE TABLE IF NOT EXISTS conversion_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  session_id VARCHAR(255) NOT NULL UNIQUE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  
  touchpoints JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  converted BOOLEAN DEFAULT false,
  conversion_value NUMERIC(12, 2),
  
  attribution_model_id UUID REFERENCES attribution_models(id) ON DELETE SET NULL,
  
  first_touchpoint_at TIMESTAMP WITH TIME ZONE,
  last_touchpoint_at TIMESTAMP WITH TIME ZONE,
  conversion_at TIMESTAMP WITH TIME ZONE,
  
  days_to_conversion INTEGER GENERATED ALWAYS AS (
    CASE 
      WHEN conversion_at IS NOT NULL AND first_touchpoint_at IS NOT NULL 
      THEN EXTRACT(DAY FROM (conversion_at - first_touchpoint_at))
      ELSE NULL
    END
  ) STORED,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_conversion_paths_session ON conversion_paths(session_id);
CREATE INDEX idx_conversion_paths_user ON conversion_paths(user_id);
CREATE INDEX idx_conversion_paths_client ON conversion_paths(client_id);
CREATE INDEX idx_conversion_paths_converted ON conversion_paths(converted) WHERE converted = true;

COMMENT ON TABLE conversion_paths IS 'Jornadas completas de conversão dos clientes';

-- =====================================================
-- 11. TABELA: utm_tracking
-- Tracking de parâmetros UTM
-- =====================================================

CREATE TABLE IF NOT EXISTS utm_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(255),
  utm_content VARCHAR(255),
  utm_term VARCHAR(255),
  
  full_url TEXT NOT NULL,
  short_url TEXT,
  
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue NUMERIC(12, 2) DEFAULT 0.00,
  
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  UNIQUE(utm_source, utm_medium, utm_campaign, utm_content, utm_term)
);

CREATE INDEX idx_utm_tracking_campaign ON utm_tracking(campaign_id);
CREATE INDEX idx_utm_tracking_source ON utm_tracking(utm_source);
CREATE INDEX idx_utm_tracking_medium ON utm_tracking(utm_medium);

COMMENT ON TABLE utm_tracking IS 'Tracking de UTMs e performance';

-- =====================================================
-- 12. TABELA: roi_calculations
-- Cálculos de ROI detalhados
-- =====================================================

CREATE TABLE IF NOT EXISTS roi_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  
  calculation_date DATE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  total_investment NUMERIC(12, 2) NOT NULL,
  total_revenue NUMERIC(12, 2) NOT NULL,
  
  roi_percentage NUMERIC(12, 2) GENERATED ALWAYS AS (
    CASE 
      WHEN total_investment > 0 THEN ((total_revenue - total_investment) / total_investment * 100)
      ELSE 0
    END
  ) STORED,
  
  profit NUMERIC(12, 2) GENERATED ALWAYS AS (total_revenue - total_investment) STORED,
  
  roas NUMERIC(12, 2) GENERATED ALWAYS AS (
    CASE 
      WHEN total_investment > 0 THEN (total_revenue / total_investment)
      ELSE 0
    END
  ) STORED,
  
  conversions INTEGER DEFAULT 0,
  
  breakdown_by_channel JSONB DEFAULT '{}'::jsonb,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_roi_calculations_client ON roi_calculations(client_id);
CREATE INDEX idx_roi_calculations_campaign ON roi_calculations(campaign_id);
CREATE INDEX idx_roi_calculations_date ON roi_calculations(calculation_date DESC);

COMMENT ON TABLE roi_calculations IS 'Cálculos periódicos de ROI';

-- =====================================================
-- 13. TABELA: cost_per_acquisition
-- CPA por canal e campanha
-- =====================================================

CREATE TABLE IF NOT EXISTS cost_per_acquisition (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  
  date DATE NOT NULL,
  
  channel VARCHAR(50) NOT NULL,
  
  total_spent NUMERIC(12, 2) DEFAULT 0.00,
  total_acquisitions INTEGER DEFAULT 0,
  
  cpa NUMERIC(10, 2) GENERATED ALWAYS AS (
    CASE 
      WHEN total_acquisitions > 0 THEN (total_spent / total_acquisitions)
      ELSE 0
    END
  ) STORED,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  UNIQUE(client_id, campaign_id, channel, date)
);

CREATE INDEX idx_cost_per_acquisition_client ON cost_per_acquisition(client_id);
CREATE INDEX idx_cost_per_acquisition_campaign ON cost_per_acquisition(campaign_id);
CREATE INDEX idx_cost_per_acquisition_channel ON cost_per_acquisition(channel);
CREATE INDEX idx_cost_per_acquisition_date ON cost_per_acquisition(date DESC);

COMMENT ON TABLE cost_per_acquisition IS 'Custo por aquisição por canal';

-- =====================================================
-- 14. TABELA: lifetime_value
-- Lifetime Value dos clientes
-- =====================================================

CREATE TABLE IF NOT EXISTS lifetime_value (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  total_revenue NUMERIC(12, 2) DEFAULT 0.00,
  total_orders INTEGER DEFAULT 0,
  
  average_order_value NUMERIC(10, 2) GENERATED ALWAYS AS (
    CASE 
      WHEN total_orders > 0 THEN (total_revenue / total_orders)
      ELSE 0
    END
  ) STORED,
  
  first_purchase_date DATE,
  last_purchase_date DATE,
  
  customer_lifetime_days INTEGER GENERATED ALWAYS AS (
    CASE 
      WHEN first_purchase_date IS NOT NULL AND last_purchase_date IS NOT NULL
      THEN (last_purchase_date - first_purchase_date)
      ELSE 0
    END
  ) STORED,
  
  predicted_ltv NUMERIC(12, 2),
  
  churn_probability NUMERIC(5, 2),
  churn_predicted_date DATE,
  
  segment VARCHAR(50),
  
  metadata JSONB DEFAULT '{}'::jsonb,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_lifetime_value_client ON lifetime_value(client_id);
CREATE INDEX idx_lifetime_value_segment ON lifetime_value(segment);
CREATE INDEX idx_lifetime_value_churn ON lifetime_value(churn_probability DESC) WHERE churn_probability > 0.5;

COMMENT ON TABLE lifetime_value IS 'Lifetime Value e predições de churn';

-- =====================================================
-- 15. TABELA: channel_performance
-- Performance consolidada por canal
-- =====================================================

CREATE TABLE IF NOT EXISTS channel_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  
  date DATE NOT NULL,
  
  channel VARCHAR(50) NOT NULL,
  
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  
  spend NUMERIC(12, 2) DEFAULT 0.00,
  revenue NUMERIC(12, 2) DEFAULT 0.00,
  
  ctr NUMERIC(5, 2),
  conversion_rate NUMERIC(5, 2),
  cpc NUMERIC(10, 2),
  cpa NUMERIC(10, 2),
  roi NUMERIC(12, 2),
  roas NUMERIC(12, 2),
  
  new_customers INTEGER DEFAULT 0,
  returning_customers INTEGER DEFAULT 0,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  UNIQUE(client_id, channel, date)
);

CREATE INDEX idx_channel_performance_client ON channel_performance(client_id);
CREATE INDEX idx_channel_performance_channel ON channel_performance(channel);
CREATE INDEX idx_channel_performance_date ON channel_performance(date DESC);

COMMENT ON TABLE channel_performance IS 'Performance consolidada por canal de marketing';

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_budgets_updated_at
  BEFORE UPDATE ON campaign_budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversion_funnels_updated_at
  BEFORE UPDATE ON conversion_funnels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversion_paths_updated_at
  BEFORE UPDATE ON conversion_paths
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lifetime_value_updated_at
  BEFORE UPDATE ON lifetime_value
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_metrics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE roi_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE lifetime_value ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_performance ENABLE ROW LEVEL SECURITY;

-- Colaboradores veem analytics de todos os clientes
CREATE POLICY "Colaboradores veem analytics"
  ON campaigns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type NOT IN ('client')
      AND user_profiles.is_active = true
    )
  );

-- Clientes veem seus próprios analytics
CREATE POLICY "Clientes veem seus analytics"
  ON campaigns FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
    )
  );

-- Similar para outras tabelas
CREATE POLICY "Colaboradores veem métricas"
  ON campaign_metrics_daily FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type NOT IN ('client')
    )
  );

CREATE POLICY "Clientes veem suas métricas"
  ON campaign_metrics_daily FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM campaigns c
      JOIN user_profiles up ON up.client_id = c.client_id
      WHERE c.id = campaign_metrics_daily.campaign_id
      AND up.user_id = auth.uid()
    )
  );

-- =====================================================
-- Fim da Migration: Advanced Analytics
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration Advanced Analytics concluída com sucesso!';
  RAISE NOTICE '📊 15 tabelas criadas';
  RAISE NOTICE '💰 ROI, funis, atribuição e LTV implementados';
  RAISE NOTICE '🎯 Sistema completo de analytics pronto!';
  RAISE NOTICE '';
  RAISE NOTICE '🎉🎉🎉 TODAS AS 18 MIGRATIONS FORAM CRIADAS! 🎉🎉🎉';
  RAISE NOTICE '📊 Total: ~160 tabelas no sistema Valle 360';
END $$;

