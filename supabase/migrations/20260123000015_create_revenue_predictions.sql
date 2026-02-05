-- =====================================================================================
-- MIGRATION: Revenue Predictions System
-- Data: 23/01/2026
-- Descrição: Sistema de predição de receita e faturamento
-- =====================================================================================

-- Criar tabela de predições de receita
CREATE TABLE IF NOT EXISTS public.revenue_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Período da Predição
  prediction_period text NOT NULL CHECK (prediction_period IN ('monthly', 'quarterly', 'annual')),
  target_month integer CHECK (target_month BETWEEN 1 AND 12),
  target_quarter integer CHECK (target_quarter BETWEEN 1 AND 4),
  target_year integer NOT NULL,
  period_start_date date NOT NULL,
  period_end_date date NOT NULL,
  
  -- Predições de Receita
  predicted_revenue decimal(15,2) NOT NULL DEFAULT 0,
  predicted_mrr decimal(12,2) DEFAULT 0, -- Monthly Recurring Revenue
  predicted_arr decimal(15,2) DEFAULT 0, -- Annual Recurring Revenue
  
  current_revenue decimal(15,2) DEFAULT 0,
  revenue_growth_rate decimal(5,2) DEFAULT 0, -- % de crescimento
  
  -- Confiança
  confidence_level decimal(5,2) NOT NULL CHECK (confidence_level >= 0 AND confidence_level <= 100),
  prediction_accuracy decimal(5,2), -- Comparação com resultado real
  
  -- Segmentação de Receita
  recurring_revenue decimal(12,2) DEFAULT 0,
  one_time_revenue decimal(12,2) DEFAULT 0,
  upsell_revenue decimal(12,2) DEFAULT 0,
  new_clients_revenue decimal(12,2) DEFAULT 0,
  
  revenue_by_service jsonb DEFAULT '{}'::jsonb,
  -- Exemplo: {
  --   "social_media": 50000,
  --   "google_ads": 30000,
  --   "branding": 20000,
  --   "content": 15000
  -- }
  
  -- Clientes
  predicted_active_clients integer DEFAULT 0,
  predicted_new_clients integer DEFAULT 0,
  predicted_churned_clients integer DEFAULT 0,
  predicted_avg_ticket decimal(10,2) DEFAULT 0,
  
  -- Fatores de Crescimento
  growth_factors jsonb DEFAULT '{}'::jsonb,
  -- Exemplo: {
  --   "market_expansion": 15,
  --   "upselling": 10,
  --   "new_services": 8,
  --   "referrals": 5
  -- }
  
  -- Riscos à Receita
  revenue_at_risk decimal(12,2) DEFAULT 0,
  risk_factors text[] DEFAULT '{}',
  -- Exemplo: ["Churn de cliente grande", "Sazonalidade baixa", "Crise econômica", "Concorrência"]
  
  churn_impact decimal(10,2) DEFAULT 0, -- Impacto negativo do churn
  market_conditions text CHECK (market_conditions IN ('excellent', 'good', 'neutral', 'challenging', 'crisis')),
  
  -- Oportunidades
  upsell_opportunities_value decimal(12,2) DEFAULT 0,
  expansion_potential decimal(12,2) DEFAULT 0,
  pipeline_value decimal(12,2) DEFAULT 0, -- Valor em negociação
  pipeline_conversion_rate decimal(5,2) DEFAULT 0,
  
  -- Comparação com Metas
  revenue_target decimal(15,2),
  target_achievement_probability decimal(5,2) DEFAULT 0 CHECK (target_achievement_probability >= 0 AND target_achievement_probability <= 100),
  gap_to_target decimal(12,2) DEFAULT 0, -- Diferença para a meta
  
  performance_status text CHECK (performance_status IN ('exceeding', 'on_target', 'slightly_below', 'significantly_below', 'critical')),
  
  -- Histórico e Tendências
  historical_comparison jsonb DEFAULT '{}'::jsonb,
  -- Exemplo: {
  --   "same_period_last_year": 120000,
  --   "growth_vs_last_year": 25,
  --   "avg_last_6_months": 110000,
  --   "trend": "upward"
  -- }
  
  seasonality_factor decimal(5,2) DEFAULT 0, -- Impacto da sazonalidade (% +/-)
  trend text CHECK (trend IN ('upward', 'stable', 'downward', 'volatile')),
  
  -- Ações Recomendadas
  recommended_actions text[] DEFAULT '{}',
  -- Exemplo: ["Focar em upsell", "Campanha de aquisição", "Reter clientes em risco", "Lançar novo serviço"]
  
  optimization_suggestions jsonb DEFAULT '{}'::jsonb,
  -- Exemplo: {
  --   "increase_avg_ticket": "Oferecer pacotes premium",
  --   "reduce_churn": "Programa de fidelidade",
  --   "accelerate_sales": "Desconto para pagamento anual"
  -- }
  
  -- Resultado Real
  actual_revenue decimal(15,2),
  actual_mrr decimal(12,2),
  actual_growth_rate decimal(5,2),
  variance_amount decimal(12,2), -- Diferença real vs previsto
  variance_percent decimal(5,2), -- % de diferença
  
  -- Metadata
  calculation_method text DEFAULT 'time_series_ml',
  model_version text DEFAULT '1.0',
  last_calculated_at timestamptz DEFAULT now(),
  
  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- Constraints
  UNIQUE(prediction_period, target_year, target_month, target_quarter)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_revenue_predictions_period ON public.revenue_predictions(prediction_period);
CREATE INDEX IF NOT EXISTS idx_revenue_predictions_year ON public.revenue_predictions(target_year);
CREATE INDEX IF NOT EXISTS idx_revenue_predictions_dates ON public.revenue_predictions(period_start_date, period_end_date);
CREATE INDEX IF NOT EXISTS idx_revenue_predictions_status ON public.revenue_predictions(performance_status);
CREATE INDEX IF NOT EXISTS idx_revenue_predictions_revenue ON public.revenue_predictions(predicted_revenue DESC);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trg_revenue_predictions_updated_at ON public.revenue_predictions;
CREATE TRIGGER trg_revenue_predictions_updated_at
  BEFORE UPDATE ON public.revenue_predictions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.revenue_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin pode gerenciar predições de receita"
  ON public.revenue_predictions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Função para calcular predição de receita
CREATE OR REPLACE FUNCTION public.calculate_revenue_prediction(
  p_period text,
  p_year integer,
  p_month integer DEFAULT NULL,
  p_quarter integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_mrr decimal(12,2);
  v_avg_growth_rate decimal(5,2);
  v_predicted_revenue decimal(15,2);
  v_predicted_mrr decimal(12,2);
  v_confidence decimal(5,2);
  v_trend text;
  v_active_clients integer;
  v_avg_ticket decimal(10,2);
BEGIN
  -- 1. Calcular MRR atual (soma de monthly_value de clientes ativos)
  SELECT 
    COALESCE(SUM(monthly_value), 0),
    COUNT(*),
    COALESCE(AVG(monthly_value), 0)
  INTO v_current_mrr, v_active_clients, v_avg_ticket
  FROM public.clients
  WHERE status = 'active' AND is_active = true;
  
  -- 2. Calcular taxa de crescimento média (últimos 6 meses)
  -- Simplificado: assumir 5% de crescimento base
  v_avg_growth_rate := 5.0;
  
  -- 3. Aplicar crescimento ao MRR
  v_predicted_mrr := v_current_mrr * (1 + (v_avg_growth_rate / 100));
  
  -- 4. Calcular receita prevista baseada no período
  v_predicted_revenue := CASE 
    WHEN p_period = 'monthly' THEN v_predicted_mrr
    WHEN p_period = 'quarterly' THEN v_predicted_mrr * 3
    WHEN p_period = 'annual' THEN v_predicted_mrr * 12
    ELSE v_predicted_mrr
  END;
  
  -- 5. Determinar tendência
  v_trend := CASE
    WHEN v_avg_growth_rate >= 5 THEN 'upward'
    WHEN v_avg_growth_rate >= -2 THEN 'stable'
    ELSE 'downward'
  END;
  
  -- 6. Calcular confiança
  v_confidence := CASE
    WHEN v_active_clients >= 20 THEN 85
    WHEN v_active_clients >= 10 THEN 70
    WHEN v_active_clients >= 5 THEN 55
    ELSE 40
  END;
  
  -- Retornar resultado
  RETURN jsonb_build_object(
    'predicted_revenue', ROUND(v_predicted_revenue, 2),
    'predicted_mrr', ROUND(v_predicted_mrr, 2),
    'predicted_arr', ROUND(v_predicted_mrr * 12, 2),
    'revenue_growth_rate', ROUND(v_avg_growth_rate, 2),
    'current_revenue', ROUND(v_current_mrr, 2),
    'predicted_active_clients', v_active_clients,
    'predicted_avg_ticket', ROUND(v_avg_ticket, 2),
    'confidence_level', v_confidence,
    'trend', v_trend,
    'performance_status', CASE
      WHEN v_avg_growth_rate >= 10 THEN 'exceeding'
      WHEN v_avg_growth_rate >= 3 THEN 'on_target'
      WHEN v_avg_growth_rate >= 0 THEN 'slightly_below'
      ELSE 'significantly_below'
    END
  );
END;
$$;

-- View para dashboard de receita
CREATE OR REPLACE VIEW public.v_revenue_dashboard AS
SELECT 
  prediction_period,
  target_year,
  target_month,
  predicted_revenue,
  predicted_mrr,
  revenue_growth_rate,
  confidence_level,
  performance_status,
  trend,
  target_achievement_probability,
  gap_to_target,
  created_at
FROM public.revenue_predictions
ORDER BY period_start_date DESC;

-- View para análise de crescimento
CREATE OR REPLACE VIEW public.v_revenue_growth_analysis AS
SELECT 
  target_year,
  SUM(predicted_revenue) FILTER (WHERE prediction_period = 'monthly') as total_predicted_monthly,
  AVG(revenue_growth_rate) as avg_growth_rate,
  AVG(confidence_level) as avg_confidence,
  SUM(revenue_at_risk) as total_at_risk,
  AVG(target_achievement_probability) as avg_target_achievement
FROM public.revenue_predictions
GROUP BY target_year
ORDER BY target_year DESC;

-- Comentários
COMMENT ON TABLE public.revenue_predictions IS 'Predições de receita e faturamento da agência';
COMMENT ON COLUMN public.revenue_predictions.predicted_mrr IS 'Monthly Recurring Revenue previsto';
COMMENT ON COLUMN public.revenue_predictions.predicted_arr IS 'Annual Recurring Revenue previsto';
COMMENT ON COLUMN public.revenue_predictions.revenue_growth_rate IS 'Taxa de crescimento de receita (%)';
COMMENT ON COLUMN public.revenue_predictions.target_achievement_probability IS 'Probabilidade de atingir a meta (0-100%)';

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Sistema de Predição de Receita criado com sucesso!';
  RAISE NOTICE '📊 Funcionalidades:';
  RAISE NOTICE '   - Tabela: revenue_predictions';
  RAISE NOTICE '   - Função: calculate_revenue_prediction()';
  RAISE NOTICE '   - Views: v_revenue_dashboard, v_revenue_growth_analysis';
  RAISE NOTICE '   - Métricas: MRR, ARR, Growth Rate, Target Achievement';
END $$;
