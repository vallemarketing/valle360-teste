-- =====================================================================================
-- MIGRATION: Client Churn Predictions System
-- Data: 23/01/2026
-- Descrição: Sistema completo de predição de churn de clientes
-- =====================================================================================

-- Criar tabela de predições de churn de clientes
CREATE TABLE IF NOT EXISTS public.client_churn_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  
  -- Predição
  churn_probability decimal(5,2) NOT NULL CHECK (churn_probability >= 0 AND churn_probability <= 100),
  risk_level text NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  days_until_churn integer,
  predicted_churn_date date,
  confidence_score decimal(5,2) DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  
  -- Fatores Contribuintes
  contributing_factors jsonb DEFAULT '{}'::jsonb,
  -- Exemplo: {
  --   "payment_delays": 3,
  --   "low_engagement": true,
  --   "support_tickets": 5,
  --   "campaign_performance": "declining",
  --   "response_time": "slow",
  --   "satisfaction_score": 3
  -- }
  
  -- Sinais de Alerta
  warning_signals text[] DEFAULT '{}',
  -- Exemplo: ["Atraso de pagamento há 45 dias", "Não responde emails", "Reclamou 3x no último mês"]
  
  -- Ações Recomendadas
  recommended_actions text[] DEFAULT '{}',
  -- Exemplo: ["Ligar urgente", "Oferecer desconto 20%", "Agendar reunião presencial", "Revisar escopo"]
  
  -- Intervenção
  intervention_status text DEFAULT 'pending' CHECK (intervention_status IN ('pending', 'in_progress', 'completed', 'failed', 'dismissed')),
  intervention_notes text,
  intervention_started_at timestamptz,
  intervention_completed_at timestamptz,
  intervention_responsible_id uuid REFERENCES auth.users(id),
  
  -- Resultado da Intervenção
  retention_probability decimal(5,2) DEFAULT 0 CHECK (retention_probability >= 0 AND retention_probability <= 100),
  actual_churned boolean,
  actual_churn_date date,
  
  -- Metadata
  calculation_method text DEFAULT 'rule_based', -- 'rule_based', 'ml_model', 'hybrid'
  model_version text DEFAULT '1.0',
  last_calculated_at timestamptz DEFAULT now(),
  
  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- Constraints
  UNIQUE(client_id, created_at)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_client_churn_predictions_client_id ON public.client_churn_predictions(client_id);
CREATE INDEX IF NOT EXISTS idx_client_churn_predictions_risk_level ON public.client_churn_predictions(risk_level);
CREATE INDEX IF NOT EXISTS idx_client_churn_predictions_intervention_status ON public.client_churn_predictions(intervention_status);
CREATE INDEX IF NOT EXISTS idx_client_churn_predictions_churn_probability ON public.client_churn_predictions(churn_probability DESC);
CREATE INDEX IF NOT EXISTS idx_client_churn_predictions_predicted_date ON public.client_churn_predictions(predicted_churn_date);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trg_client_churn_predictions_updated_at ON public.client_churn_predictions;
CREATE TRIGGER trg_client_churn_predictions_updated_at
  BEFORE UPDATE ON public.client_churn_predictions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies
ALTER TABLE public.client_churn_predictions ENABLE ROW LEVEL SECURITY;

-- Admin pode ver e gerenciar tudo
CREATE POLICY "Admin pode gerenciar predições de churn"
  ON public.client_churn_predictions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Função para calcular risk_level baseado em churn_probability
CREATE OR REPLACE FUNCTION public.calculate_churn_risk_level(probability decimal)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  IF probability >= 75 THEN
    RETURN 'critical';
  ELSIF probability >= 50 THEN
    RETURN 'high';
  ELSIF probability >= 25 THEN
    RETURN 'medium';
  ELSE
    RETURN 'low';
  END IF;
END;
$$;

-- Função para calcular churn prediction (exemplo simplificado)
CREATE OR REPLACE FUNCTION public.calculate_client_churn_prediction(p_client_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_churn_score decimal := 0;
  v_factors jsonb := '{}'::jsonb;
  v_warnings text[] := '{}';
  v_actions text[] := '{}';
  v_payment_delays integer := 0;
  v_avg_response_time interval;
  v_support_tickets integer := 0;
  v_contract_months integer := 0;
  v_last_interaction interval;
BEGIN
  -- 1. Verificar atrasos de pagamento (peso: 30 pontos)
  SELECT COUNT(*)
  INTO v_payment_delays
  FROM financial_transactions
  WHERE client_id = p_client_id
  AND status = 'overdue'
  AND due_date < CURRENT_DATE;
  
  IF v_payment_delays > 0 THEN
    v_churn_score := v_churn_score + LEAST(v_payment_delays * 10, 30);
    v_factors := v_factors || jsonb_build_object('payment_delays', v_payment_delays);
    v_warnings := array_append(v_warnings, format('Cliente com %s pagamento(s) em atraso', v_payment_delays));
    v_actions := array_append(v_actions, 'Entrar em contato urgente sobre pendências financeiras');
  END IF;
  
  -- 2. Tempo sem interação (peso: 25 pontos)
  SELECT CURRENT_TIMESTAMP - MAX(created_at)
  INTO v_last_interaction
  FROM kanban_tasks
  WHERE client_id = p_client_id;
  
  IF v_last_interaction > interval '30 days' THEN
    v_churn_score := v_churn_score + 25;
    v_factors := v_factors || jsonb_build_object('low_engagement', true);
    v_warnings := array_append(v_warnings, 'Cliente sem interação há mais de 30 dias');
    v_actions := array_append(v_actions, 'Agendar reunião de alinhamento');
  ELSIF v_last_interaction > interval '15 days' THEN
    v_churn_score := v_churn_score + 15;
    v_factors := v_factors || jsonb_build_object('low_engagement', 'moderate');
  END IF;
  
  -- 3. Tickets de suporte/reclamações (peso: 20 pontos)
  SELECT COUNT(*)
  INTO v_support_tickets
  FROM kanban_tasks
  WHERE client_id = p_client_id
  AND tags && ARRAY['suporte', 'reclamacao', 'problema']
  AND created_at > CURRENT_DATE - interval '30 days';
  
  IF v_support_tickets >= 3 THEN
    v_churn_score := v_churn_score + 20;
    v_factors := v_factors || jsonb_build_object('support_tickets', v_support_tickets);
    v_warnings := array_append(v_warnings, format('%s reclamações no último mês', v_support_tickets));
    v_actions := array_append(v_actions, 'Reunião de satisfação urgente');
  END IF;
  
  -- 4. Tempo de contrato (clientes novos têm maior risco nos primeiros 3 meses)
  SELECT EXTRACT(MONTH FROM AGE(CURRENT_DATE, created_at))::integer
  INTO v_contract_months
  FROM clients
  WHERE id = p_client_id;
  
  IF v_contract_months < 3 THEN
    v_churn_score := v_churn_score + 15;
    v_factors := v_factors || jsonb_build_object('new_client_risk', true);
    v_warnings := array_append(v_warnings, 'Cliente em período crítico (< 3 meses)');
    v_actions := array_append(v_actions, 'Intensificar onboarding e acompanhamento');
  END IF;
  
  -- 5. Status do cliente
  IF EXISTS (
    SELECT 1 FROM clients
    WHERE id = p_client_id
    AND status IN ('inactive', 'suspended')
  ) THEN
    v_churn_score := v_churn_score + 10;
    v_factors := v_factors || jsonb_build_object('inactive_status', true);
  END IF;
  
  -- Limitar score entre 0 e 100
  v_churn_score := LEAST(v_churn_score, 100);
  
  -- Retornar resultado
  RETURN jsonb_build_object(
    'churn_probability', v_churn_score,
    'risk_level', public.calculate_churn_risk_level(v_churn_score),
    'contributing_factors', v_factors,
    'warning_signals', v_warnings,
    'recommended_actions', v_actions,
    'confidence_score', 75 -- Ajustar baseado na qualidade dos dados
  );
END;
$$;

-- View para clientes em alto risco
CREATE OR REPLACE VIEW public.v_clients_high_churn_risk AS
SELECT 
  ccp.*,
  c.company_name,
  c.contact_name,
  c.contact_email,
  c.monthly_value,
  c.status as client_status,
  c.created_at as client_since
FROM public.client_churn_predictions ccp
JOIN public.clients c ON c.id = ccp.client_id
WHERE ccp.risk_level IN ('high', 'critical')
AND ccp.intervention_status IN ('pending', 'in_progress')
ORDER BY ccp.churn_probability DESC, ccp.predicted_churn_date ASC;

-- Comentários
COMMENT ON TABLE public.client_churn_predictions IS 'Predições de churn de clientes com ML/IA';
COMMENT ON COLUMN public.client_churn_predictions.churn_probability IS 'Probabilidade de churn (0-100%)';
COMMENT ON COLUMN public.client_churn_predictions.risk_level IS 'Nível de risco: low, medium, high, critical';
COMMENT ON COLUMN public.client_churn_predictions.contributing_factors IS 'Fatores que contribuem para o risco (JSON)';
COMMENT ON COLUMN public.client_churn_predictions.retention_probability IS 'Probabilidade de retenção se intervir (0-100%)';

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Sistema de Predição de Churn de Clientes criado com sucesso!';
  RAISE NOTICE '📊 Funcionalidades:';
  RAISE NOTICE '   - Tabela: client_churn_predictions';
  RAISE NOTICE '   - Função: calculate_client_churn_prediction()';
  RAISE NOTICE '   - View: v_clients_high_churn_risk';
  RAISE NOTICE '   - RLS habilitado para admins';
END $$;
