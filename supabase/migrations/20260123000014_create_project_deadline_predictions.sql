-- =====================================================================================
-- MIGRATION: Project Deadline Predictions System
-- Data: 23/01/2026
-- Descrição: Sistema de predição de prazos e conclusão de projetos
-- =====================================================================================

-- Criar tabela de predições de prazos de projetos
CREATE TABLE IF NOT EXISTS public.project_deadline_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  project_id uuid, -- Referência opcional ao projeto real (kanban_tasks, por exemplo)
  
  -- Identificação do Projeto
  project_name text NOT NULL,
  project_type text CHECK (project_type IN ('website', 'branding', 'campaign', 'content', 'social_media', 'video', 'other')),
  project_scope text CHECK (project_scope IN ('small', 'medium', 'large', 'enterprise')),
  
  -- Prazos
  original_deadline date NOT NULL,
  predicted_completion_date date NOT NULL,
  predicted_delay_days integer DEFAULT 0, -- Positivo = atraso, Negativo = antecipação
  
  -- Probabilidades
  on_time_probability decimal(5,2) DEFAULT 0 CHECK (on_time_probability >= 0 AND on_time_probability <= 100),
  delay_probability decimal(5,2) DEFAULT 0 CHECK (delay_probability >= 0 AND delay_probability <= 100),
  early_completion_probability decimal(5,2) DEFAULT 0 CHECK (early_completion_probability >= 0 AND early_completion_probability <= 100),
  
  -- Status e Progresso
  current_progress_percent decimal(5,2) DEFAULT 0 CHECK (current_progress_percent >= 0 AND current_progress_percent <= 100),
  expected_progress_percent decimal(5,2) DEFAULT 0 CHECK (expected_progress_percent >= 0 AND expected_progress_percent <= 100),
  progress_status text CHECK (progress_status IN ('ahead', 'on_track', 'slightly_behind', 'significantly_behind', 'critical')),
  
  -- Risco de Atraso
  risk_level text DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  risk_score decimal(5,2) DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  
  -- Fatores de Risco
  risk_factors jsonb DEFAULT '{}'::jsonb,
  -- Exemplo: {
  --   "team_overload": true,
  --   "client_delays": true,
  --   "scope_creep": true,
  --   "technical_issues": false,
  --   "resource_shortage": true
  -- }
  
  blocking_issues text[] DEFAULT '{}',
  -- Exemplo: ["Aguardando aprovação do cliente", "Falta de briefing completo", "Dependência externa"]
  
  -- Fatores Positivos
  success_factors text[] DEFAULT '{}',
  -- Exemplo: ["Equipe experiente", "Cliente responsivo", "Escopo bem definido", "Budget adequado"]
  
  -- Equipe e Recursos
  assigned_team_size integer DEFAULT 0,
  required_team_size integer DEFAULT 0,
  resource_adequacy text CHECK (resource_adequacy IN ('insufficient', 'adequate', 'optimal', 'over_allocated')),
  
  team_performance_score decimal(5,2) DEFAULT 0 CHECK (team_performance_score >= 0 AND team_performance_score <= 100),
  team_experience_level text CHECK (team_experience_level IN ('junior', 'mid', 'senior', 'expert')),
  
  -- Estimativas de Esforço
  estimated_hours_total integer DEFAULT 0,
  hours_completed integer DEFAULT 0,
  hours_remaining integer DEFAULT 0,
  daily_velocity decimal(5,2) DEFAULT 0, -- Horas completadas por dia
  required_velocity decimal(5,2) DEFAULT 0, -- Horas necessárias por dia para cumprir prazo
  
  -- Dependências
  dependencies_count integer DEFAULT 0,
  blocked_dependencies_count integer DEFAULT 0,
  critical_path_tasks integer DEFAULT 0,
  
  -- Cliente
  client_responsiveness text CHECK (client_responsiveness IN ('excellent', 'good', 'fair', 'poor', 'critical')),
  client_feedback_delay_avg_days integer DEFAULT 0,
  pending_client_approvals integer DEFAULT 0,
  
  -- Recomendações
  recommended_actions text[] DEFAULT '{}',
  -- Exemplo: ["Adicionar mais 1 designer", "Solicitar feedback urgente do cliente", "Reduzir escopo", "Estender prazo"]
  
  mitigation_strategies text[] DEFAULT '{}',
  -- Exemplo: ["Priorizar tasks críticas", "Aumentar horas diárias", "Escalar com cliente"]
  
  suggested_deadline_extension_days integer DEFAULT 0,
  
  -- Comparação com Projetos Similares
  similar_projects_avg_duration integer, -- dias
  similar_projects_avg_delay integer, -- dias
  benchmark_comparison text CHECK (benchmark_comparison IN ('faster', 'typical', 'slower')),
  
  historical_performance jsonb DEFAULT '{}'::jsonb,
  -- Exemplo: {
  --   "similar_projects_count": 15,
  --   "avg_completion_time": 45,
  --   "on_time_rate": 73,
  --   "avg_delay": 5
  -- }
  
  -- Impacto Financeiro
  estimated_delay_cost decimal(10,2) DEFAULT 0, -- Custo adicional por atraso
  revenue_at_risk decimal(10,2) DEFAULT 0, -- Receita em risco
  penalty_risk decimal(10,2) DEFAULT 0, -- Multas contratuais possíveis
  
  -- Resultado Real
  actual_completion_date date,
  actual_delay_days integer,
  actual_hours_spent integer,
  prediction_accuracy decimal(5,2), -- % de acurácia da predição
  
  -- Metadata
  calculation_method text DEFAULT 'velocity_based',
  model_version text DEFAULT '1.0',
  last_calculated_at timestamptz DEFAULT now(),
  
  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- Constraints
  UNIQUE(project_id, created_at)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_project_deadline_predictions_client_id ON public.project_deadline_predictions(client_id);
CREATE INDEX IF NOT EXISTS idx_project_deadline_predictions_project_id ON public.project_deadline_predictions(project_id);
CREATE INDEX IF NOT EXISTS idx_project_deadline_predictions_risk_level ON public.project_deadline_predictions(risk_level);
CREATE INDEX IF NOT EXISTS idx_project_deadline_predictions_progress_status ON public.project_deadline_predictions(progress_status);
CREATE INDEX IF NOT EXISTS idx_project_deadline_predictions_deadline ON public.project_deadline_predictions(original_deadline);
CREATE INDEX IF NOT EXISTS idx_project_deadline_predictions_predicted_date ON public.project_deadline_predictions(predicted_completion_date);
CREATE INDEX IF NOT EXISTS idx_project_deadline_predictions_delay ON public.project_deadline_predictions(predicted_delay_days DESC);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trg_project_deadline_predictions_updated_at ON public.project_deadline_predictions;
CREATE TRIGGER trg_project_deadline_predictions_updated_at
  BEFORE UPDATE ON public.project_deadline_predictions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.project_deadline_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin pode gerenciar predições de prazos"
  ON public.project_deadline_predictions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Clientes podem ver predições de seus projetos"
  ON public.project_deadline_predictions
  FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  );

-- Função para calcular predição de prazo
CREATE OR REPLACE FUNCTION public.calculate_project_deadline_prediction(
  p_project_id uuid,
  p_original_deadline date,
  p_current_progress decimal,
  p_hours_completed integer,
  p_hours_total integer
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_days_remaining integer;
  v_progress_required decimal(5,2);
  v_daily_velocity decimal(5,2);
  v_required_velocity decimal(5,2);
  v_predicted_delay integer;
  v_on_time_prob decimal(5,2);
  v_risk_level text;
  v_progress_status text;
BEGIN
  -- 1. Calcular dias restantes até o prazo
  v_days_remaining := p_original_deadline - CURRENT_DATE;
  
  -- 2. Calcular progresso esperado (assumindo linear)
  v_progress_required := 100.0 * (1 - (v_days_remaining::decimal / NULLIF((p_original_deadline - CURRENT_DATE + 30), 0)));
  
  -- 3. Calcular velocidade atual (horas por dia)
  v_daily_velocity := CASE 
    WHEN p_hours_completed > 0 THEN p_hours_completed::decimal / NULLIF(30, 0) -- Últimos 30 dias
    ELSE 0
  END;
  
  -- 4. Calcular velocidade necessária
  v_required_velocity := (p_hours_total - p_hours_completed)::decimal / NULLIF(v_days_remaining, 0);
  
  -- 5. Prever atraso baseado na velocidade
  IF v_required_velocity > v_daily_velocity AND v_daily_velocity > 0 THEN
    v_predicted_delay := CEIL((p_hours_total - p_hours_completed) / NULLIF(v_daily_velocity, 0) - v_days_remaining);
  ELSE
    v_predicted_delay := 0;
  END IF;
  
  -- 6. Calcular probabilidade de entregar no prazo
  v_on_time_prob := CASE
    WHEN p_current_progress >= v_progress_required THEN 85
    WHEN p_current_progress >= (v_progress_required * 0.9) THEN 70
    WHEN p_current_progress >= (v_progress_required * 0.8) THEN 50
    WHEN p_current_progress >= (v_progress_required * 0.7) THEN 30
    ELSE 15
  END;
  
  -- 7. Determinar nível de risco
  v_risk_level := CASE
    WHEN v_on_time_prob >= 70 THEN 'low'
    WHEN v_on_time_prob >= 50 THEN 'medium'
    WHEN v_on_time_prob >= 30 THEN 'high'
    ELSE 'critical'
  END;
  
  -- 8. Determinar status de progresso
  v_progress_status := CASE
    WHEN p_current_progress >= (v_progress_required * 1.1) THEN 'ahead'
    WHEN p_current_progress >= (v_progress_required * 0.95) THEN 'on_track'
    WHEN p_current_progress >= (v_progress_required * 0.85) THEN 'slightly_behind'
    WHEN p_current_progress >= (v_progress_required * 0.70) THEN 'significantly_behind'
    ELSE 'critical'
  END;
  
  -- Retornar resultado
  RETURN jsonb_build_object(
    'predicted_delay_days', v_predicted_delay,
    'predicted_completion_date', p_original_deadline + v_predicted_delay,
    'on_time_probability', v_on_time_prob,
    'delay_probability', 100 - v_on_time_prob,
    'risk_level', v_risk_level,
    'progress_status', v_progress_status,
    'current_progress_percent', ROUND(p_current_progress, 2),
    'expected_progress_percent', ROUND(v_progress_required, 2),
    'daily_velocity', ROUND(v_daily_velocity, 2),
    'required_velocity', ROUND(v_required_velocity, 2),
    'days_remaining', v_days_remaining,
    'hours_remaining', p_hours_total - p_hours_completed
  );
END;
$$;

-- View para projetos em risco de atraso
CREATE OR REPLACE VIEW public.v_projects_at_risk AS
SELECT 
  pdp.*,
  c.company_name,
  c.contact_name,
  c.contact_email,
  CASE
    WHEN pdp.progress_status = 'critical' THEN 'Progresso Crítico'
    WHEN pdp.predicted_delay_days > 7 THEN 'Atraso Significativo Previsto'
    WHEN pdp.blocked_dependencies_count > 0 THEN 'Dependências Bloqueadas'
    WHEN pdp.pending_client_approvals > 2 THEN 'Aguardando Cliente'
    ELSE 'Outros Riscos'
  END as primary_concern
FROM public.project_deadline_predictions pdp
JOIN public.clients c ON c.id = pdp.client_id
WHERE pdp.risk_level IN ('high', 'critical')
   OR pdp.progress_status IN ('significantly_behind', 'critical')
   OR pdp.predicted_delay_days > 5
ORDER BY pdp.risk_level DESC, pdp.predicted_delay_days DESC;

-- View para dashboard de projetos
CREATE OR REPLACE VIEW public.v_project_deadlines_dashboard AS
SELECT 
  COUNT(*) as total_projects,
  COUNT(*) FILTER (WHERE progress_status = 'on_track') as on_track,
  COUNT(*) FILTER (WHERE progress_status IN ('slightly_behind', 'significantly_behind', 'critical')) as at_risk,
  COUNT(*) FILTER (WHERE risk_level IN ('high', 'critical')) as high_risk,
  AVG(on_time_probability) as avg_on_time_probability,
  AVG(predicted_delay_days) FILTER (WHERE predicted_delay_days > 0) as avg_predicted_delay,
  SUM(revenue_at_risk) as total_revenue_at_risk
FROM public.project_deadline_predictions
WHERE actual_completion_date IS NULL; -- Apenas projetos em andamento

-- Comentários
COMMENT ON TABLE public.project_deadline_predictions IS 'Predições de prazos e conclusão de projetos';
COMMENT ON COLUMN public.project_deadline_predictions.on_time_probability IS 'Probabilidade de entregar no prazo (0-100%)';
COMMENT ON COLUMN public.project_deadline_predictions.predicted_delay_days IS 'Dias de atraso previstos (positivo = atraso, negativo = antecipação)';
COMMENT ON COLUMN public.project_deadline_predictions.progress_status IS 'Status: ahead, on_track, slightly_behind, significantly_behind, critical';
COMMENT ON COLUMN public.project_deadline_predictions.daily_velocity IS 'Horas completadas por dia (velocidade atual da equipe)';

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Sistema de Predição de Prazos criado com sucesso!';
  RAISE NOTICE '📊 Funcionalidades:';
  RAISE NOTICE '   - Tabela: project_deadline_predictions';
  RAISE NOTICE '   - Função: calculate_project_deadline_prediction()';
  RAISE NOTICE '   - Views: v_projects_at_risk, v_project_deadlines_dashboard';
  RAISE NOTICE '   - Status: ahead, on_track, slightly_behind, significantly_behind, critical';
END $$;
