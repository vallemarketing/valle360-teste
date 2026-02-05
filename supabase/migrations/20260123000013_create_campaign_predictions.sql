-- =====================================================================================
-- MIGRATION: Campaign Performance Predictions System
-- Data: 23/01/2026
-- Descrição: Sistema de predição de performance de campanhas de marketing
-- =====================================================================================

-- Criar tabela de predições de campanhas
CREATE TABLE IF NOT EXISTS public.campaign_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  campaign_id uuid, -- Referência opcional à campanha real
  
  -- Identificação da Campanha
  campaign_name text NOT NULL,
  campaign_type text CHECK (campaign_type IN ('social_media', 'google_ads', 'email', 'content', 'influencer', 'seo', 'other')),
  platform text, -- Facebook, Instagram, Google, LinkedIn, etc
  
  -- Predições de Performance
  predicted_reach integer DEFAULT 0,
  predicted_impressions integer DEFAULT 0,
  predicted_clicks integer DEFAULT 0,
  predicted_conversions integer DEFAULT 0,
  predicted_ctr decimal(5,2) DEFAULT 0 CHECK (predicted_ctr >= 0 AND predicted_ctr <= 100), -- Click-Through Rate
  predicted_conversion_rate decimal(5,2) DEFAULT 0 CHECK (predicted_conversion_rate >= 0 AND predicted_conversion_rate <= 100),
  
  -- Predições Financeiras
  estimated_budget decimal(12,2) NOT NULL DEFAULT 0,
  predicted_cost_per_click decimal(10,2) DEFAULT 0,
  predicted_cost_per_conversion decimal(10,2) DEFAULT 0,
  predicted_roi decimal(10,2) DEFAULT 0, -- Return on Investment (pode ser negativo)
  predicted_revenue decimal(12,2) DEFAULT 0,
  
  -- Nível de Confiança
  confidence_level decimal(5,2) NOT NULL CHECK (confidence_level >= 0 AND confidence_level <= 100),
  prediction_accuracy decimal(5,2), -- Comparação com resultado real
  
  -- Período da Campanha
  campaign_start_date date,
  campaign_end_date date,
  duration_days integer,
  
  -- Fatores de Sucesso
  success_probability decimal(5,2) DEFAULT 0 CHECK (success_probability >= 0 AND success_probability <= 100),
  success_factors text[] DEFAULT '{}',
  -- Exemplo: ["Público bem segmentado", "Criativo forte", "Budget adequado", "Sazonalidade favorável"]
  
  -- Riscos e Alertas
  risk_factors text[] DEFAULT '{}',
  -- Exemplo: ["Budget baixo", "Público muito amplo", "Concorrência alta", "Sazonalidade desfavorável"]
  
  warning_level text DEFAULT 'low' CHECK (warning_level IN ('low', 'medium', 'high', 'critical')),
  
  -- Recomendações
  recommended_optimizations text[] DEFAULT '{}',
  -- Exemplo: ["Aumentar budget em 20%", "Segmentar melhor o público", "Testar novos criativos", "Mudar horário dos posts"]
  
  suggested_budget_adjustment decimal(5,2) DEFAULT 0, -- Porcentagem de ajuste (+/- %)
  
  -- Comparação com Campanhas Similares
  similar_campaigns_avg_performance jsonb DEFAULT '{}'::jsonb,
  -- Exemplo: {
  --   "avg_ctr": 2.5,
  --   "avg_conversion_rate": 3.2,
  --   "avg_roi": 150,
  --   "sample_size": 10
  -- }
  
  benchmark_comparison text CHECK (benchmark_comparison IN ('above', 'at', 'below')),
  -- above: acima da média, at: na média, below: abaixo da média
  
  -- Segmentação e Target
  target_audience jsonb DEFAULT '{}'::jsonb,
  -- Exemplo: {
  --   "age_range": "25-45",
  --   "gender": "all",
  --   "location": "São Paulo",
  --   "interests": ["marketing", "business", "tech"]
  -- }
  
  -- Resultado Real (para comparação)
  actual_reach integer,
  actual_impressions integer,
  actual_clicks integer,
  actual_conversions integer,
  actual_ctr decimal(5,2),
  actual_conversion_rate decimal(5,2),
  actual_spent decimal(12,2),
  actual_roi decimal(10,2),
  actual_revenue decimal(12,2),
  
  -- Status da Campanha
  campaign_status text DEFAULT 'planned' CHECK (campaign_status IN ('planned', 'running', 'paused', 'completed', 'cancelled')),
  
  -- Metadata
  calculation_method text DEFAULT 'historical_ml',
  model_version text DEFAULT '1.0',
  last_calculated_at timestamptz DEFAULT now(),
  
  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- Constraints
  UNIQUE(campaign_id, created_at)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_campaign_predictions_client_id ON public.campaign_predictions(client_id);
CREATE INDEX IF NOT EXISTS idx_campaign_predictions_campaign_type ON public.campaign_predictions(campaign_type);
CREATE INDEX IF NOT EXISTS idx_campaign_predictions_status ON public.campaign_predictions(campaign_status);
CREATE INDEX IF NOT EXISTS idx_campaign_predictions_success_prob ON public.campaign_predictions(success_probability DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_predictions_roi ON public.campaign_predictions(predicted_roi DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_predictions_warning ON public.campaign_predictions(warning_level);
CREATE INDEX IF NOT EXISTS idx_campaign_predictions_dates ON public.campaign_predictions(campaign_start_date, campaign_end_date);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trg_campaign_predictions_updated_at ON public.campaign_predictions;
CREATE TRIGGER trg_campaign_predictions_updated_at
  BEFORE UPDATE ON public.campaign_predictions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.campaign_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin pode gerenciar predições de campanhas"
  ON public.campaign_predictions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Clientes podem ver suas predições de campanhas"
  ON public.campaign_predictions
  FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  );

-- Função para calcular predição de campanha
CREATE OR REPLACE FUNCTION public.calculate_campaign_prediction(
  p_client_id uuid,
  p_campaign_type text,
  p_budget decimal,
  p_duration_days integer DEFAULT 30
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_avg_ctr decimal(5,2);
  v_avg_conversion_rate decimal(5,2);
  v_avg_cpc decimal(10,2);
  v_predicted_clicks integer;
  v_predicted_conversions integer;
  v_predicted_revenue decimal(12,2);
  v_predicted_roi decimal(10,2);
  v_success_prob decimal(5,2);
  v_similar_count integer;
BEGIN
  -- 1. Buscar média de performance de campanhas similares
  SELECT 
    COALESCE(AVG(actual_ctr), 2.0),
    COALESCE(AVG(actual_conversion_rate), 2.5),
    COALESCE(AVG(actual_spent / NULLIF(actual_clicks, 0)), 1.5),
    COUNT(*)
  INTO v_avg_ctr, v_avg_conversion_rate, v_avg_cpc, v_similar_count
  FROM public.campaign_predictions
  WHERE campaign_type = p_campaign_type
  AND actual_ctr IS NOT NULL
  AND campaign_status = 'completed'
  AND created_at > NOW() - INTERVAL '6 months';
  
  -- Se não houver dados históricos, usar médias padrão
  IF v_similar_count = 0 THEN
    v_avg_ctr := 2.0;
    v_avg_conversion_rate := 2.5;
    v_avg_cpc := 1.5;
  END IF;
  
  -- 2. Calcular predições baseadas no budget
  v_predicted_clicks := FLOOR(p_budget / v_avg_cpc);
  v_predicted_conversions := FLOOR(v_predicted_clicks * (v_avg_conversion_rate / 100));
  
  -- 3. Estimar receita (assumindo ticket médio de R$500)
  v_predicted_revenue := v_predicted_conversions * 500;
  
  -- 4. Calcular ROI
  v_predicted_roi := ((v_predicted_revenue - p_budget) / NULLIF(p_budget, 0)) * 100;
  
  -- 5. Calcular probabilidade de sucesso
  v_success_prob := CASE
    WHEN v_predicted_roi >= 100 THEN 85
    WHEN v_predicted_roi >= 50 THEN 70
    WHEN v_predicted_roi >= 0 THEN 50
    ELSE 30
  END;
  
  -- Retornar resultado
  RETURN jsonb_build_object(
    'predicted_clicks', v_predicted_clicks,
    'predicted_conversions', v_predicted_conversions,
    'predicted_ctr', ROUND(v_avg_ctr, 2),
    'predicted_conversion_rate', ROUND(v_avg_conversion_rate, 2),
    'predicted_cost_per_click', ROUND(v_avg_cpc, 2),
    'predicted_cost_per_conversion', ROUND(p_budget / NULLIF(v_predicted_conversions, 0), 2),
    'predicted_revenue', ROUND(v_predicted_revenue, 2),
    'predicted_roi', ROUND(v_predicted_roi, 2),
    'success_probability', v_success_prob,
    'confidence_level', CASE 
      WHEN v_similar_count >= 10 THEN 80
      WHEN v_similar_count >= 5 THEN 60
      ELSE 40
    END,
    'similar_campaigns_count', v_similar_count
  );
END;
$$;

-- View para campanhas em risco
CREATE OR REPLACE VIEW public.v_campaigns_at_risk AS
SELECT 
  cp.*,
  c.company_name,
  c.contact_email,
  CASE
    WHEN cp.predicted_roi < 0 THEN 'ROI Negativo Previsto'
    WHEN cp.success_probability < 30 THEN 'Baixa Probabilidade de Sucesso'
    WHEN cp.warning_level IN ('high', 'critical') THEN 'Alertas Críticos'
    ELSE 'Outros Riscos'
  END as primary_risk
FROM public.campaign_predictions cp
JOIN public.clients c ON c.id = cp.client_id
WHERE cp.warning_level IN ('high', 'critical')
   OR cp.predicted_roi < 0
   OR cp.success_probability < 30
ORDER BY cp.warning_level DESC, cp.predicted_roi ASC;

-- View para top campanhas previstas
CREATE OR REPLACE VIEW public.v_top_predicted_campaigns AS
SELECT 
  cp.*,
  c.company_name,
  c.monthly_value as client_value
FROM public.campaign_predictions cp
JOIN public.clients c ON c.id = cp.client_id
WHERE cp.predicted_roi >= 50
AND cp.success_probability >= 60
ORDER BY cp.predicted_roi DESC, cp.predicted_revenue DESC
LIMIT 20;

-- Comentários
COMMENT ON TABLE public.campaign_predictions IS 'Predições de performance de campanhas de marketing';
COMMENT ON COLUMN public.campaign_predictions.predicted_roi IS 'Return on Investment previsto (%)';
COMMENT ON COLUMN public.campaign_predictions.success_probability IS 'Probabilidade de sucesso da campanha (0-100%)';
COMMENT ON COLUMN public.campaign_predictions.warning_level IS 'Nível de alerta: low, medium, high, critical';
COMMENT ON COLUMN public.campaign_predictions.benchmark_comparison IS 'Comparação com benchmark: above (acima), at (na média), below (abaixo)';

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Sistema de Predição de Campanhas criado com sucesso!';
  RAISE NOTICE '📊 Funcionalidades:';
  RAISE NOTICE '   - Tabela: campaign_predictions';
  RAISE NOTICE '   - Função: calculate_campaign_prediction()';
  RAISE NOTICE '   - Views: v_campaigns_at_risk, v_top_predicted_campaigns';
  RAISE NOTICE '   - Tipos: social_media, google_ads, email, content, influencer, seo';
END $$;
