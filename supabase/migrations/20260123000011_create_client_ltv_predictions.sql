-- =====================================================================================
-- MIGRATION: Client LTV (Lifetime Value) Predictions System
-- Data: 23/01/2026
-- Descrição: Sistema de predição de valor vitalício do cliente
-- =====================================================================================

-- Criar tabela de predições de LTV
CREATE TABLE IF NOT EXISTS public.client_ltv_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  
  -- Predição de Valor
  predicted_ltv decimal(12,2) NOT NULL CHECK (predicted_ltv >= 0),
  current_ltv decimal(12,2) DEFAULT 0 CHECK (current_ltv >= 0),
  ltv_growth_potential decimal(5,2) DEFAULT 0, -- Porcentagem de crescimento possível
  confidence_level decimal(5,2) NOT NULL CHECK (confidence_level >= 0 AND confidence_level <= 100),
  
  -- Horizonte de Tempo
  time_horizon_months integer NOT NULL DEFAULT 12 CHECK (time_horizon_months > 0),
  predicted_retention_months integer,
  churn_risk decimal(5,2) DEFAULT 0 CHECK (churn_risk >= 0 AND churn_risk <= 100),
  
  -- Predições Mensais
  predicted_monthly_spend decimal(10,2),
  current_monthly_spend decimal(10,2),
  spend_trend text CHECK (spend_trend IN ('increasing', 'stable', 'declining')),
  
  -- Oportunidades de Upsell
  upsell_probability decimal(5,2) DEFAULT 0 CHECK (upsell_probability >= 0 AND upsell_probability <= 100),
  recommended_upsell_services text[] DEFAULT '{}',
  -- Exemplo: ["Gestão de Tráfego Pago", "Design Avançado", "Vídeo Marketing"]
  
  estimated_upsell_value decimal(10,2) DEFAULT 0,
  best_time_to_upsell date,
  upsell_readiness_score decimal(5,2) DEFAULT 0 CHECK (upsell_readiness_score >= 0 AND upsell_readiness_score <= 100),
  
  -- Fatores de Cálculo
  calculation_factors jsonb DEFAULT '{}'::jsonb,
  -- Exemplo: {
  --   "payment_consistency": 95,
  --   "engagement_score": 85,
  --   "satisfaction_nps": 9,
  --   "contract_renewals": 2,
  --   "avg_ticket": 5000,
  --   "growth_rate": 15
  -- }
  
  -- Segmentação
  value_segment text CHECK (value_segment IN ('low', 'medium', 'high', 'vip')),
  
  expansion_opportunities text[] DEFAULT '{}',
  -- Exemplo: ["Adicionar redes sociais", "Expandir budget ads", "Contratar SEO"]
  
  -- Riscos e Alertas
  risk_factors text[] DEFAULT '{}',
  -- Exemplo: ["Orçamento limitado", "Sazonalidade", "Concorrente ofereceu desconto"]
  
  -- Metadata
  calculation_method text DEFAULT 'historical_average',
  model_version text DEFAULT '1.0',
  last_calculated_at timestamptz DEFAULT now(),
  
  -- Validação (comparar predição vs realidade)
  actual_ltv decimal(12,2),
  prediction_accuracy decimal(5,2), -- % de acurácia da predição
  
  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- Constraints
  UNIQUE(client_id, created_at)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_client_ltv_predictions_client_id ON public.client_ltv_predictions(client_id);
CREATE INDEX IF NOT EXISTS idx_client_ltv_predictions_value_segment ON public.client_ltv_predictions(value_segment);
CREATE INDEX IF NOT EXISTS idx_client_ltv_predictions_ltv ON public.client_ltv_predictions(predicted_ltv DESC);
CREATE INDEX IF NOT EXISTS idx_client_ltv_predictions_upsell_probability ON public.client_ltv_predictions(upsell_probability DESC);
CREATE INDEX IF NOT EXISTS idx_client_ltv_predictions_best_time_upsell ON public.client_ltv_predictions(best_time_to_upsell);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trg_client_ltv_predictions_updated_at ON public.client_ltv_predictions;
CREATE TRIGGER trg_client_ltv_predictions_updated_at
  BEFORE UPDATE ON public.client_ltv_predictions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.client_ltv_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin pode gerenciar predições de LTV"
  ON public.client_ltv_predictions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Função para calcular segmento de valor
CREATE OR REPLACE FUNCTION public.calculate_value_segment(monthly_value decimal)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  IF monthly_value >= 10000 THEN
    RETURN 'vip';
  ELSIF monthly_value >= 5000 THEN
    RETURN 'high';
  ELSIF monthly_value >= 2000 THEN
    RETURN 'medium';
  ELSE
    RETURN 'low';
  END IF;
END;
$$;

-- Função para calcular LTV prediction
CREATE OR REPLACE FUNCTION public.calculate_client_ltv_prediction(p_client_id uuid, p_months integer DEFAULT 12)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_monthly decimal := 0;
  v_avg_monthly decimal := 0;
  v_months_active integer := 0;
  v_payment_consistency decimal := 0;
  v_predicted_ltv decimal := 0;
  v_upsell_prob decimal := 0;
  v_factors jsonb := '{}'::jsonb;
  v_opportunities text[] := '{}';
  v_recommended_services text[] := '{}';
  v_engagement_score decimal := 0;
BEGIN
  -- 1. Calcular valor mensal atual
  SELECT COALESCE(monthly_value, 0)
  INTO v_current_monthly
  FROM clients
  WHERE id = p_client_id;
  
  -- 2. Calcular média histórica de pagamentos
  SELECT 
    COALESCE(AVG(amount), 0),
    COUNT(DISTINCT DATE_TRUNC('month', paid_at))::integer
  INTO v_avg_monthly, v_months_active
  FROM financial_transactions
  WHERE client_id = p_client_id
  AND status = 'paid'
  AND paid_at IS NOT NULL;
  
  -- Usar o maior entre atual e média
  v_avg_monthly := GREATEST(v_current_monthly, v_avg_monthly);
  
  -- 3. Calcular consistência de pagamentos (0-100)
  SELECT 
    CASE 
      WHEN COUNT(*) = 0 THEN 0
      ELSE (COUNT(*) FILTER (WHERE status = 'paid' AND due_date >= paid_at) * 100.0 / COUNT(*))
    END
  INTO v_payment_consistency
  FROM financial_transactions
  WHERE client_id = p_client_id;
  
  -- 4. Calcular engajamento (baseado em tarefas e interações)
  SELECT 
    CASE 
      WHEN COUNT(*) = 0 THEN 50
      ELSE LEAST(COUNT(*) * 5, 100)
    END
  INTO v_engagement_score
  FROM kanban_tasks
  WHERE client_id = p_client_id
  AND created_at > CURRENT_DATE - interval '30 days';
  
  -- 5. Calcular probabilidade de upsell
  v_upsell_prob := 0;
  
  -- Cliente pagando em dia aumenta chance
  IF v_payment_consistency >= 90 THEN
    v_upsell_prob := v_upsell_prob + 30;
  ELSIF v_payment_consistency >= 70 THEN
    v_upsell_prob := v_upsell_prob + 15;
  END IF;
  
  -- Cliente engajado aumenta chance
  IF v_engagement_score >= 80 THEN
    v_upsell_prob := v_upsell_prob + 25;
    v_opportunities := array_append(v_opportunities, 'Cliente muito engajado - momento ideal para expansão');
  END IF;
  
  -- Cliente há mais de 6 meses
  IF v_months_active >= 6 THEN
    v_upsell_prob := v_upsell_prob + 20;
    v_opportunities := array_append(v_opportunities, 'Relacionamento consolidado - propor novos serviços');
  END IF;
  
  -- Crescimento histórico
  IF v_avg_monthly > v_current_monthly * 0.8 THEN
    v_upsell_prob := v_upsell_prob + 15;
  END IF;
  
  v_upsell_prob := LEAST(v_upsell_prob, 100);
  
  -- 6. Recomendar serviços baseado no perfil
  IF v_current_monthly < 5000 THEN
    v_recommended_services := ARRAY[
      'Gestão de Redes Sociais Completa',
      'Tráfego Pago (Google Ads)',
      'Design de Posts'
    ];
  ELSIF v_current_monthly < 10000 THEN
    v_recommended_services := ARRAY[
      'Expansão para novas redes sociais',
      'Vídeo Marketing',
      'Influencer Marketing',
      'SEO e Blog'
    ];
  ELSE
    v_recommended_services := ARRAY[
      'Branded Content',
      'TV e Mídia Offline',
      'Eventos e Experiências',
      'Consultoria Estratégica'
    ];
  END IF;
  
  -- 7. Calcular LTV previsto
  -- Fórmula: Valor Médio Mensal × Meses Previstos × Fator de Retenção
  v_predicted_ltv := v_avg_monthly * p_months * (v_payment_consistency / 100.0);
  
  -- Ajustar por probabilidade de upsell
  IF v_upsell_prob > 50 THEN
    v_predicted_ltv := v_predicted_ltv * 1.2; -- 20% a mais se alta chance de upsell
  END IF;
  
  -- 8. Montar fatores de cálculo
  v_factors := jsonb_build_object(
    'payment_consistency', v_payment_consistency,
    'engagement_score', v_engagement_score,
    'months_active', v_months_active,
    'avg_monthly_value', v_avg_monthly,
    'current_monthly_value', v_current_monthly
  );
  
  -- Retornar resultado
  RETURN jsonb_build_object(
    'predicted_ltv', ROUND(v_predicted_ltv, 2),
    'current_ltv', ROUND(v_avg_monthly * v_months_active, 2),
    'predicted_monthly_spend', ROUND(v_avg_monthly, 2),
    'time_horizon_months', p_months,
    'upsell_probability', v_upsell_prob,
    'recommended_upsell_services', v_recommended_services,
    'expansion_opportunities', v_opportunities,
    'calculation_factors', v_factors,
    'value_segment', public.calculate_value_segment(v_current_monthly),
    'confidence_level', CASE 
      WHEN v_months_active >= 6 THEN 85
      WHEN v_months_active >= 3 THEN 70
      ELSE 50
    END
  );
END;
$$;

-- View para oportunidades de upsell
CREATE OR REPLACE VIEW public.v_upsell_opportunities AS
SELECT 
  clp.*,
  c.company_name,
  c.contact_name,
  c.contact_email,
  c.monthly_value as current_monthly_value,
  c.created_at as client_since,
  EXTRACT(MONTH FROM AGE(CURRENT_DATE, c.created_at))::integer as months_as_client
FROM public.client_ltv_predictions clp
JOIN public.clients c ON c.id = clp.client_id
WHERE clp.upsell_probability >= 50
AND c.status = 'active'
ORDER BY clp.upsell_probability DESC, clp.estimated_upsell_value DESC;

-- View para clientes VIP
CREATE OR REPLACE VIEW public.v_vip_clients AS
SELECT 
  clp.*,
  c.company_name,
  c.contact_name,
  c.monthly_value,
  c.created_at as client_since
FROM public.client_ltv_predictions clp
JOIN public.clients c ON c.id = clp.client_id
WHERE clp.value_segment = 'vip'
ORDER BY clp.predicted_ltv DESC;

-- Comentários
COMMENT ON TABLE public.client_ltv_predictions IS 'Predições de Lifetime Value (LTV) dos clientes';
COMMENT ON COLUMN public.client_ltv_predictions.predicted_ltv IS 'Valor total previsto que o cliente gerará';
COMMENT ON COLUMN public.client_ltv_predictions.upsell_probability IS 'Probabilidade de aceitar upsell (0-100%)';
COMMENT ON COLUMN public.client_ltv_predictions.value_segment IS 'Segmento de valor: low (<R$2k), medium (R$2-5k), high (R$5-10k), vip (>R$10k)';

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Sistema de Predição de LTV criado com sucesso!';
  RAISE NOTICE '📊 Funcionalidades:';
  RAISE NOTICE '   - Tabela: client_ltv_predictions';
  RAISE NOTICE '   - Função: calculate_client_ltv_prediction()';
  RAISE NOTICE '   - Views: v_upsell_opportunities, v_vip_clients';
  RAISE NOTICE '   - Segmentos: low, medium, high, vip';
END $$;
