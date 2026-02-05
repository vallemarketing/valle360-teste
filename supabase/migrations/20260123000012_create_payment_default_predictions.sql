-- =====================================================================================
-- MIGRATION: Payment Default Risk Predictions System
-- Data: 23/01/2026
-- Descrição: Sistema de predição de risco de inadimplência
-- =====================================================================================

-- Criar tabela de predições de inadimplência
CREATE TABLE IF NOT EXISTS public.payment_default_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  invoice_id uuid, -- Opcional: predição específica para uma fatura
  
  -- Predição de Risco
  default_probability decimal(5,2) NOT NULL CHECK (default_probability >= 0 AND default_probability <= 100),
  risk_level text NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  confidence_score decimal(5,2) DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  
  -- Histórico de Pagamentos
  payment_history_score decimal(5,2) DEFAULT 0 CHECK (payment_history_score >= 0 AND payment_history_score <= 100),
  days_overdue_average integer DEFAULT 0,
  total_paid_invoices integer DEFAULT 0,
  total_late_invoices integer DEFAULT 0,
  total_overdue_amount decimal(12,2) DEFAULT 0,
  current_overdue_amount decimal(12,2) DEFAULT 0,
  
  -- Padrões de Comportamento
  payment_pattern text CHECK (payment_pattern IN ('excellent', 'good', 'irregular', 'problematic', 'critical')),
  -- excellent: sempre em dia
  -- good: atrasa até 5 dias ocasionalmente
  -- irregular: atrasa 5-15 dias frequentemente
  -- problematic: atrasa 15-30 dias
  -- critical: atrasa > 30 dias
  
  longest_delay_days integer DEFAULT 0,
  recent_delays_count integer DEFAULT 0, -- Últimos 3 meses
  
  -- Fatores de Risco
  risk_factors jsonb DEFAULT '{}'::jsonb,
  -- Exemplo: {
  --   "frequent_delays": true,
  --   "high_outstanding_balance": true,
  --   "poor_communication": true,
  --   "financial_difficulties_reported": true,
  --   "industry_crisis": false
  -- }
  
  -- Sinais de Alerta
  warning_signals text[] DEFAULT '{}',
  -- Exemplo: ["3 faturas em atraso", "Não responde sobre pagamento", "Solicitou parcelamento"]
  
  -- Ações Recomendadas
  recommended_actions text[] DEFAULT '{}',
  -- Exemplo: ["Ligar hoje", "Enviar email formal", "Bloquear novos serviços", "Jurídico"]
  
  escalation_level text DEFAULT 'none' CHECK (escalation_level IN ('none', 'reminder', 'formal_notice', 'legal', 'collection')),
  
  -- Termos de Pagamento Sugeridos
  recommended_payment_terms text,
  -- Exemplo: "Pagamento antecipado", "Parcelamento máximo 2x", "Apenas à vista"
  
  suggested_payment_plan jsonb DEFAULT '{}'::jsonb,
  -- Exemplo: {
  --   "installments": 3,
  --   "down_payment_percent": 50,
  --   "frequency": "monthly",
  --   "discount_for_upfront": 10
  -- }
  
  -- Ações Tomadas
  action_taken text,
  action_taken_at timestamptz,
  action_responsible_id uuid REFERENCES auth.users(id),
  
  -- Resultado Real
  actual_defaulted boolean,
  actual_days_delayed integer,
  recovered boolean DEFAULT false,
  recovery_amount decimal(12,2),
  recovery_date date,
  
  -- Próximos Passos
  next_follow_up_date date,
  follow_up_status text DEFAULT 'pending' CHECK (follow_up_status IN ('pending', 'scheduled', 'completed', 'escalated')),
  
  -- Metadata
  calculation_method text DEFAULT 'behavioral_scoring',
  model_version text DEFAULT '1.0',
  last_calculated_at timestamptz DEFAULT now(),
  
  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- Constraints
  UNIQUE(client_id, created_at)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_payment_default_predictions_client_id ON public.payment_default_predictions(client_id);
CREATE INDEX IF NOT EXISTS idx_payment_default_predictions_risk_level ON public.payment_default_predictions(risk_level);
CREATE INDEX IF NOT EXISTS idx_payment_default_predictions_probability ON public.payment_default_predictions(default_probability DESC);
CREATE INDEX IF NOT EXISTS idx_payment_default_predictions_escalation ON public.payment_default_predictions(escalation_level);
CREATE INDEX IF NOT EXISTS idx_payment_default_predictions_follow_up ON public.payment_default_predictions(next_follow_up_date);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trg_payment_default_predictions_updated_at ON public.payment_default_predictions;
CREATE TRIGGER trg_payment_default_predictions_updated_at
  BEFORE UPDATE ON public.payment_default_predictions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.payment_default_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin pode gerenciar predições de inadimplência"
  ON public.payment_default_predictions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Função para calcular padrão de pagamento
CREATE OR REPLACE FUNCTION public.calculate_payment_pattern(
  p_avg_delay integer,
  p_late_percent decimal
)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_avg_delay = 0 AND p_late_percent = 0 THEN
    RETURN 'excellent';
  ELSIF p_avg_delay <= 5 AND p_late_percent <= 20 THEN
    RETURN 'good';
  ELSIF p_avg_delay <= 15 OR p_late_percent <= 40 THEN
    RETURN 'irregular';
  ELSIF p_avg_delay <= 30 OR p_late_percent <= 60 THEN
    RETURN 'problematic';
  ELSE
    RETURN 'critical';
  END IF;
END;
$$;

-- Função para calcular risk level
CREATE OR REPLACE FUNCTION public.calculate_default_risk_level(probability decimal)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  IF probability >= 70 THEN
    RETURN 'critical';
  ELSIF probability >= 50 THEN
    RETURN 'high';
  ELSIF probability >= 30 THEN
    RETURN 'medium';
  ELSE
    RETURN 'low';
  END IF;
END;
$$;

-- Função principal de cálculo
CREATE OR REPLACE FUNCTION public.calculate_payment_default_prediction(p_client_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_default_score decimal := 0;
  v_factors jsonb := '{}'::jsonb;
  v_warnings text[] := '{}';
  v_actions text[] := '{}';
  
  v_total_invoices integer := 0;
  v_late_invoices integer := 0;
  v_overdue_invoices integer := 0;
  v_avg_delay decimal := 0;
  v_current_overdue decimal := 0;
  v_payment_history_score decimal := 100;
  v_recent_delays integer := 0;
  v_longest_delay integer := 0;
  v_escalation text := 'none';
  v_payment_pattern text;
BEGIN
  -- 1. Contar faturas totais
  SELECT COUNT(*)
  INTO v_total_invoices
  FROM financial_transactions
  WHERE client_id = p_client_id
  AND type = 'invoice';
  
  -- Se não há histórico, retornar risco médio
  IF v_total_invoices = 0 THEN
    RETURN jsonb_build_object(
      'default_probability', 50,
      'risk_level', 'medium',
      'payment_history_score', 50,
      'warning_signals', ARRAY['Cliente novo sem histórico de pagamento'],
      'recommended_actions', ARRAY['Estabelecer termos claros', 'Solicitar pagamento antecipado inicial'],
      'confidence_score', 30
    );
  END IF;
  
  -- 2. Calcular faturas atrasadas
  SELECT 
    COUNT(*) FILTER (WHERE paid_at > due_date),
    COALESCE(AVG(EXTRACT(DAY FROM (paid_at - due_date))) FILTER (WHERE paid_at > due_date), 0)
  INTO v_late_invoices, v_avg_delay
  FROM financial_transactions
  WHERE client_id = p_client_id
  AND status = 'paid'
  AND due_date IS NOT NULL
  AND paid_at IS NOT NULL;
  
  -- 3. Faturas atualmente em atraso
  SELECT 
    COUNT(*),
    COALESCE(SUM(amount), 0)
  INTO v_overdue_invoices, v_current_overdue
  FROM financial_transactions
  WHERE client_id = p_client_id
  AND status IN ('pending', 'overdue')
  AND due_date < CURRENT_DATE;
  
  -- 4. Atrasos recentes (últimos 90 dias)
  SELECT COUNT(*)
  INTO v_recent_delays
  FROM financial_transactions
  WHERE client_id = p_client_id
  AND status = 'paid'
  AND paid_at > due_date
  AND paid_at > CURRENT_DATE - interval '90 days';
  
  -- 5. Maior atraso histórico
  SELECT COALESCE(MAX(EXTRACT(DAY FROM (paid_at - due_date))), 0)::integer
  INTO v_longest_delay
  FROM financial_transactions
  WHERE client_id = p_client_id
  AND status = 'paid'
  AND paid_at > due_date;
  
  -- 6. Calcular score de histórico de pagamento (0-100)
  IF v_total_invoices > 0 THEN
    v_payment_history_score := GREATEST(0, 100 - ((v_late_invoices::decimal / v_total_invoices) * 100));
  END IF;
  
  -- 7. Calcular probabilidade de default (0-100)
  
  -- Fator 1: Faturas atualmente em atraso (peso: 35 pontos)
  IF v_overdue_invoices > 0 THEN
    v_default_score := v_default_score + LEAST(v_overdue_invoices * 15, 35);
    v_factors := v_factors || jsonb_build_object('current_overdue_invoices', v_overdue_invoices);
    v_warnings := array_append(v_warnings, format('%s fatura(s) em atraso', v_overdue_invoices));
    
    IF v_overdue_invoices >= 3 THEN
      v_actions := array_append(v_actions, 'Contato urgente - risco crítico');
      v_escalation := 'legal';
    ELSIF v_overdue_invoices >= 2 THEN
      v_actions := array_append(v_actions, 'Enviar notificação formal');
      v_escalation := 'formal_notice';
    ELSE
      v_actions := array_append(v_actions, 'Lembrete amigável de pagamento');
      v_escalation := 'reminder';
    END IF;
  END IF;
  
  -- Fator 2: Valor em atraso (peso: 25 pontos)
  IF v_current_overdue > 0 THEN
    IF v_current_overdue > 10000 THEN
      v_default_score := v_default_score + 25;
      v_factors := v_factors || jsonb_build_object('high_outstanding_balance', true);
      v_warnings := array_append(v_warnings, format('R$ %.2f em atraso', v_current_overdue));
    ELSIF v_current_overdue > 5000 THEN
      v_default_score := v_default_score + 15;
    ELSIF v_current_overdue > 1000 THEN
      v_default_score := v_default_score + 10;
    END IF;
  END IF;
  
  -- Fator 3: Histórico de atrasos (peso: 20 pontos)
  IF v_payment_history_score < 70 THEN
    v_default_score := v_default_score + 20;
    v_factors := v_factors || jsonb_build_object('poor_payment_history', true);
    v_warnings := array_append(v_warnings, 'Histórico ruim de pagamentos');
    v_actions := array_append(v_actions, 'Revisar termos de pagamento');
  ELSIF v_payment_history_score < 85 THEN
    v_default_score := v_default_score + 10;
  END IF;
  
  -- Fator 4: Atrasos recentes (peso: 15 pontos)
  IF v_recent_delays >= 2 THEN
    v_default_score := v_default_score + 15;
    v_factors := v_factors || jsonb_build_object('recent_payment_issues', true);
    v_warnings := array_append(v_warnings, format('%s atrasos nos últimos 3 meses', v_recent_delays));
  ELSIF v_recent_delays = 1 THEN
    v_default_score := v_default_score + 7;
  END IF;
  
  -- Fator 5: Maior atraso histórico (peso: 5 pontos)
  IF v_longest_delay > 60 THEN
    v_default_score := v_default_score + 5;
    v_factors := v_factors || jsonb_build_object('severe_past_delay', v_longest_delay);
  END IF;
  
  -- Limitar score entre 0 e 100
  v_default_score := LEAST(v_default_score, 100);
  
  -- Calcular padrão de pagamento
  v_payment_pattern := public.calculate_payment_pattern(
    v_avg_delay::integer,
    (v_late_invoices::decimal / NULLIF(v_total_invoices, 0) * 100)
  );
  
  -- Ações adicionais baseadas no score
  IF v_default_score >= 70 THEN
    v_actions := array_append(v_actions, 'Suspender novos serviços até regularização');
    v_actions := array_append(v_actions, 'Considerar cobrança jurídica');
  ELSIF v_default_score >= 50 THEN
    v_actions := array_append(v_actions, 'Propor plano de parcelamento');
    v_actions := array_append(v_actions, 'Reunião urgente com cliente');
  END IF;
  
  -- Retornar resultado
  RETURN jsonb_build_object(
    'default_probability', v_default_score,
    'risk_level', public.calculate_default_risk_level(v_default_score),
    'payment_history_score', ROUND(v_payment_history_score, 2),
    'payment_pattern', v_payment_pattern,
    'days_overdue_average', ROUND(v_avg_delay),
    'total_paid_invoices', v_total_invoices - v_overdue_invoices,
    'total_late_invoices', v_late_invoices,
    'current_overdue_amount', v_current_overdue,
    'longest_delay_days', v_longest_delay,
    'recent_delays_count', v_recent_delays,
    'risk_factors', v_factors,
    'warning_signals', v_warnings,
    'recommended_actions', v_actions,
    'escalation_level', v_escalation,
    'confidence_score', CASE 
      WHEN v_total_invoices >= 12 THEN 90
      WHEN v_total_invoices >= 6 THEN 75
      WHEN v_total_invoices >= 3 THEN 60
      ELSE 40
    END
  );
END;
$$;

-- View para clientes em alto risco de inadimplência
CREATE OR REPLACE VIEW public.v_high_payment_risk_clients AS
SELECT 
  pdp.*,
  c.company_name,
  c.contact_name,
  c.contact_email,
  c.contact_phone,
  c.monthly_value,
  c.status as client_status
FROM public.payment_default_predictions pdp
JOIN public.clients c ON c.id = pdp.client_id
WHERE pdp.risk_level IN ('high', 'critical')
AND pdp.follow_up_status IN ('pending', 'scheduled')
ORDER BY pdp.default_probability DESC, pdp.current_overdue_amount DESC;

-- View para acompanhamento de cobranças
CREATE OR REPLACE VIEW public.v_collections_dashboard AS
SELECT 
  pdp.risk_level,
  COUNT(*) as clients_count,
  SUM(pdp.current_overdue_amount) as total_overdue,
  AVG(pdp.default_probability) as avg_risk_probability,
  COUNT(*) FILTER (WHERE pdp.escalation_level = 'legal') as legal_cases,
  COUNT(*) FILTER (WHERE pdp.follow_up_status = 'pending') as pending_follow_ups
FROM public.payment_default_predictions pdp
WHERE pdp.current_overdue_amount > 0
GROUP BY pdp.risk_level
ORDER BY 
  CASE pdp.risk_level
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    ELSE 4
  END;

-- Comentários
COMMENT ON TABLE public.payment_default_predictions IS 'Predições de risco de inadimplência de clientes';
COMMENT ON COLUMN public.payment_default_predictions.default_probability IS 'Probabilidade de não pagamento (0-100%)';
COMMENT ON COLUMN public.payment_default_predictions.payment_pattern IS 'Padrão: excellent, good, irregular, problematic, critical';
COMMENT ON COLUMN public.payment_default_predictions.escalation_level IS 'Nível de escalação: none, reminder, formal_notice, legal, collection';

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Sistema de Predição de Inadimplência criado com sucesso!';
  RAISE NOTICE '📊 Funcionalidades:';
  RAISE NOTICE '   - Tabela: payment_default_predictions';
  RAISE NOTICE '   - Função: calculate_payment_default_prediction()';
  RAISE NOTICE '   - Views: v_high_payment_risk_clients, v_collections_dashboard';
  RAISE NOTICE '   - Níveis de escalação: reminder → formal_notice → legal → collection';
END $$;
