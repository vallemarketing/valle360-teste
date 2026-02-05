-- =====================================================================================
-- MIGRATION: Hiring Needs Predictions System
-- Data: 23/01/2026
-- Descrição: Sistema de predição de necessidades de contratação
-- =====================================================================================

-- Criar tabela de predições de contratação
CREATE TABLE IF NOT EXISTS public.hiring_needs_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Período da Predição
  prediction_period text NOT NULL CHECK (prediction_period IN ('monthly', 'quarterly', 'annual')),
  target_month integer CHECK (target_month BETWEEN 1 AND 12),
  target_quarter integer CHECK (target_quarter BETWEEN 1 AND 4),
  target_year integer NOT NULL,
  period_start_date date NOT NULL,
  period_end_date date NOT NULL,
  
  -- Predições de Contratação
  recommended_hires integer DEFAULT 0,
  priority_level text DEFAULT 'low' CHECK (priority_level IN ('low', 'medium', 'high', 'urgent')),
  
  -- Por Cargo/Área
  positions_needed jsonb DEFAULT '{}'::jsonb,
  -- Exemplo: {
  --   "designer": 2,
  --   "copywriter": 1,
  --   "social_media_manager": 1,
  --   "account_manager": 1,
  --   "developer": 1
  -- }
  
  skills_gaps text[] DEFAULT '{}',
  -- Exemplo: ["Motion Design", "Google Ads Avançado", "Gestão de E-commerce"]
  
  -- Análise de Capacidade
  current_team_size integer DEFAULT 0,
  current_capacity_utilization decimal(5,2) DEFAULT 0 CHECK (current_capacity_utilization >= 0 AND current_capacity_utilization <= 200),
  -- < 70% = subutilizado, 70-90% = ideal, 90-100% = máxima, > 100% = sobrecarga
  
  projected_workload_hours integer DEFAULT 0,
  available_capacity_hours integer DEFAULT 0,
  capacity_gap_hours integer DEFAULT 0, -- Negativo = falta de capacidade
  
  capacity_status text CHECK (capacity_status IN ('underutilized', 'optimal', 'near_capacity', 'overloaded', 'critical')),
  
  -- Fatores que Justificam Contratação
  hiring_drivers jsonb DEFAULT '{}'::jsonb,
  -- Exemplo: {
  --   "revenue_growth": 25,
  --   "new_clients": 8,
  --   "team_overload": true,
  --   "expansion_plans": true,
  --   "quality_decline": false
  -- }
  
  trigger_events text[] DEFAULT '{}',
  -- Exemplo: ["Receita cresceu 30%", "3 novos clientes grandes", "Equipe trabalhando >50h/semana"]
  
  -- Análise de Crescimento
  projected_revenue_growth decimal(5,2) DEFAULT 0,
  projected_client_growth integer DEFAULT 0,
  projected_project_volume_increase decimal(5,2) DEFAULT 0,
  
  -- Impacto no Negócio
  revenue_at_risk decimal(12,2) DEFAULT 0, -- Receita em risco por falta de equipe
  quality_risk_score decimal(5,2) DEFAULT 0 CHECK (quality_risk_score >= 0 AND quality_risk_score <= 100),
  burnout_risk_score decimal(5,2) DEFAULT 0 CHECK (burnout_risk_score >= 0 AND burnout_risk_score <= 100),
  
  estimated_revenue_impact decimal(12,2) DEFAULT 0, -- Receita adicional com novas contratações
  
  -- Custo de Contratação
  estimated_hiring_cost decimal(10,2) DEFAULT 0,
  estimated_monthly_payroll_increase decimal(10,2) DEFAULT 0,
  break_even_months integer DEFAULT 0, -- Meses para recuperar investimento
  
  roi_projection decimal(5,2) DEFAULT 0, -- ROI da contratação
  
  -- Priorização de Vagas
  most_critical_position text,
  hiring_urgency text CHECK (hiring_urgency IN ('immediate', 'short_term', 'medium_term', 'long_term', 'optional')),
  recommended_hiring_timeline text,
  
  -- Alternativas à Contratação
  alternative_solutions text[] DEFAULT '{}',
  -- Exemplo: ["Terceirizar design", "Contratar freelancers", "Automatizar processos", "Redistribuir tarefas"]
  
  outsourcing_feasibility decimal(5,2) DEFAULT 0 CHECK (outsourcing_feasibility >= 0 AND outsourcing_feasibility <= 100),
  
  -- Análise de Churn de Funcionários
  predicted_employee_churn integer DEFAULT 0,
  churn_replacement_priority text[] DEFAULT '{}',
  
  historical_turnover_rate decimal(5,2) DEFAULT 0,
  
  -- Métricas de Equipe
  team_performance_metrics jsonb DEFAULT '{}'::jsonb,
  -- Exemplo: {
  --   "avg_hours_week": 45,
  --   "overtime_frequency": "high",
  --   "project_delays": 3,
  --   "client_satisfaction": 8.5,
  --   "employee_satisfaction": 7.2
  -- }
  
  -- Recomendações
  recommended_actions text[] DEFAULT '{}',
  -- Exemplo: ["Contratar 2 designers em 30 dias", "Abrir vaga de gerente de projetos", "Treinar equipe em automação"]
  
  mitigation_strategies text[] DEFAULT '{}',
  -- Exemplo: ["Negociar prazos mais longos", "Pausar prospecção", "Aumentar preços"]
  
  -- Comparação com Benchmark
  industry_avg_team_size integer,
  industry_avg_revenue_per_employee decimal(10,2),
  company_revenue_per_employee decimal(10,2),
  
  benchmark_comparison text CHECK (benchmark_comparison IN ('above', 'at', 'below')),
  -- above: mais eficiente, at: na média, below: menos eficiente
  
  -- Confiança da Predição
  confidence_level decimal(5,2) NOT NULL CHECK (confidence_level >= 0 AND confidence_level <= 100),
  
  -- Resultado Real
  actual_hires integer,
  actual_positions_filled jsonb,
  prediction_accuracy decimal(5,2),
  
  -- Metadata
  calculation_method text DEFAULT 'capacity_based',
  model_version text DEFAULT '1.0',
  last_calculated_at timestamptz DEFAULT now(),
  
  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- Constraints
  UNIQUE(prediction_period, target_year, target_month, target_quarter)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_hiring_needs_predictions_period ON public.hiring_needs_predictions(prediction_period);
CREATE INDEX IF NOT EXISTS idx_hiring_needs_predictions_year ON public.hiring_needs_predictions(target_year);
CREATE INDEX IF NOT EXISTS idx_hiring_needs_predictions_priority ON public.hiring_needs_predictions(priority_level);
CREATE INDEX IF NOT EXISTS idx_hiring_needs_predictions_urgency ON public.hiring_needs_predictions(hiring_urgency);
CREATE INDEX IF NOT EXISTS idx_hiring_needs_predictions_capacity ON public.hiring_needs_predictions(capacity_status);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trg_hiring_needs_predictions_updated_at ON public.hiring_needs_predictions;
CREATE TRIGGER trg_hiring_needs_predictions_updated_at
  BEFORE UPDATE ON public.hiring_needs_predictions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.hiring_needs_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin pode gerenciar predições de contratação"
  ON public.hiring_needs_predictions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Função para calcular necessidade de contratação
CREATE OR REPLACE FUNCTION public.calculate_hiring_needs_prediction(
  p_period text,
  p_year integer,
  p_month integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_team_size integer;
  v_active_clients integer;
  v_current_mrr decimal(12,2);
  v_capacity_utilization decimal(5,2);
  v_recommended_hires integer;
  v_priority text;
  v_capacity_status text;
  v_revenue_per_employee decimal(10,2);
BEGIN
  -- 1. Contar funcionários ativos
  SELECT COUNT(*) 
  INTO v_current_team_size
  FROM public.employees
  WHERE status = 'active';
  
  -- 2. Contar clientes ativos e receita
  SELECT 
    COUNT(*),
    COALESCE(SUM(monthly_value), 0)
  INTO v_active_clients, v_current_mrr
  FROM public.clients
  WHERE status = 'active' AND is_active = true;
  
  -- 3. Calcular receita por funcionário
  v_revenue_per_employee := CASE 
    WHEN v_current_team_size > 0 THEN v_current_mrr / v_current_team_size 
    ELSE 0 
  END;
  
  -- 4. Estimar utilização de capacidade (simplificado)
  -- Ideal: 1 funcionário para cada R$10k de MRR
  v_capacity_utilization := (v_current_mrr / NULLIF((v_current_team_size * 10000), 0)) * 100;
  
  -- 5. Determinar status de capacidade
  v_capacity_status := CASE
    WHEN v_capacity_utilization < 70 THEN 'underutilized'
    WHEN v_capacity_utilization < 90 THEN 'optimal'
    WHEN v_capacity_utilization < 100 THEN 'near_capacity'
    WHEN v_capacity_utilization < 120 THEN 'overloaded'
    ELSE 'critical'
  END;
  
  -- 6. Calcular contratações recomendadas
  v_recommended_hires := CASE
    WHEN v_capacity_utilization >= 120 THEN 3
    WHEN v_capacity_utilization >= 100 THEN 2
    WHEN v_capacity_utilization >= 90 THEN 1
    ELSE 0
  END;
  
  -- 7. Determinar prioridade
  v_priority := CASE
    WHEN v_capacity_utilization >= 120 THEN 'urgent'
    WHEN v_capacity_utilization >= 100 THEN 'high'
    WHEN v_capacity_utilization >= 90 THEN 'medium'
    ELSE 'low'
  END;
  
  -- Retornar resultado
  RETURN jsonb_build_object(
    'recommended_hires', v_recommended_hires,
    'priority_level', v_priority,
    'current_team_size', v_current_team_size,
    'current_capacity_utilization', ROUND(v_capacity_utilization, 2),
    'capacity_status', v_capacity_status,
    'revenue_per_employee', ROUND(v_revenue_per_employee, 2),
    'active_clients', v_active_clients,
    'current_mrr', ROUND(v_current_mrr, 2),
    'confidence_level', CASE
      WHEN v_current_team_size >= 10 THEN 80
      WHEN v_current_team_size >= 5 THEN 65
      ELSE 50
    END,
    'hiring_urgency', CASE
      WHEN v_recommended_hires >= 3 THEN 'immediate'
      WHEN v_recommended_hires >= 2 THEN 'short_term'
      WHEN v_recommended_hires >= 1 THEN 'medium_term'
      ELSE 'optional'
    END
  );
END;
$$;

-- View para dashboard de contratações
CREATE OR REPLACE VIEW public.v_hiring_needs_dashboard AS
SELECT 
  prediction_period,
  target_year,
  target_month,
  recommended_hires,
  priority_level,
  hiring_urgency,
  capacity_status,
  current_capacity_utilization,
  burnout_risk_score,
  most_critical_position,
  estimated_monthly_payroll_increase,
  created_at
FROM public.hiring_needs_predictions
ORDER BY period_start_date DESC;

-- View para posições críticas
CREATE OR REPLACE VIEW public.v_critical_hiring_needs AS
SELECT 
  hnp.*,
  CASE
    WHEN capacity_status = 'critical' THEN 'Sobrecarga Crítica'
    WHEN burnout_risk_score > 70 THEN 'Alto Risco de Burnout'
    WHEN revenue_at_risk > 10000 THEN 'Receita em Risco'
    ELSE 'Crescimento Planejado'
  END as hiring_reason
FROM public.hiring_needs_predictions hnp
WHERE priority_level IN ('high', 'urgent')
   OR hiring_urgency IN ('immediate', 'short_term')
   OR capacity_status IN ('overloaded', 'critical')
ORDER BY priority_level DESC, hiring_urgency;

-- Comentários
COMMENT ON TABLE public.hiring_needs_predictions IS 'Predições de necessidades de contratação baseadas em capacidade e crescimento';
COMMENT ON COLUMN public.hiring_needs_predictions.capacity_utilization IS 'Utilização de capacidade da equipe (%)';
COMMENT ON COLUMN public.hiring_needs_predictions.recommended_hires IS 'Número recomendado de contratações';
COMMENT ON COLUMN public.hiring_needs_predictions.burnout_risk_score IS 'Risco de burnout da equipe (0-100)';

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Sistema de Predição de Contratação criado com sucesso!';
  RAISE NOTICE '📊 Funcionalidades:';
  RAISE NOTICE '   - Tabela: hiring_needs_predictions';
  RAISE NOTICE '   - Função: calculate_hiring_needs_prediction()';
  RAISE NOTICE '   - Views: v_hiring_needs_dashboard, v_critical_hiring_needs';
  RAISE NOTICE '   - Análise: Capacidade, Burnout, ROI, Priorização';
END $$;
