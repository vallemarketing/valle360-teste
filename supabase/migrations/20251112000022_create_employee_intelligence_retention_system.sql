-- =====================================================
-- MIGRATION 22: Employee Intelligence & Retention System
-- Descrição: Sistema de IA para prever saída, analisar comportamento e recomendar ações
-- Dependências: 20251112000008_create_employees_hr_system.sql
-- =====================================================

-- =====================================================
-- 1. TABELA: employee_churn_predictions
-- Predição de saída de colaboradores (similar ao de clientes)
-- =====================================================

CREATE TABLE IF NOT EXISTS employee_churn_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  
  -- Predição
  churn_probability NUMERIC(5, 2) NOT NULL CHECK (churn_probability >= 0 AND churn_probability <= 100),
  risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  
  days_until_churn INTEGER,
  predicted_churn_date DATE,
  
  confidence_level NUMERIC(5, 2) CHECK (confidence_level >= 0 AND confidence_level <= 100),
  
  -- Fatores que contribuem
  contributing_factors JSONB DEFAULT '[]'::jsonb,
  -- Exemplo: [
  --   {"factor": "Baixa performance recente", "weight": "high", "impact": 0.25},
  --   {"factor": "Salário abaixo do mercado", "weight": "medium", "impact": 0.15},
  --   {"factor": "Falta de crescimento", "weight": "high", "impact": 0.20}
  -- ]
  
  -- Sinais de alerta
  warning_signals JSONB DEFAULT '[]'::jsonb,
  -- Exemplo: ["Atrasos frequentes", "Baixo engajamento", "Recusa de projetos"]
  
  -- Ações recomendadas
  recommended_actions JSONB DEFAULT '[]'::jsonb,
  -- Exemplo: [
  --   {"action": "immediate_1on1", "urgency": "high", "description": "Agendar 1-on-1 hoje"},
  --   {"action": "salary_review", "urgency": "medium", "description": "Revisar compensação"},
  --   {"action": "growth_plan", "urgency": "high", "description": "Criar plano de carreira"}
  -- ]
  
  -- Intervenção
  intervention_status VARCHAR(20) DEFAULT 'pending' CHECK (intervention_status IN ('pending', 'in_progress', 'completed', 'no_action')),
  
  intervention_date TIMESTAMP WITH TIME ZONE,
  intervention_notes TEXT,
  intervention_outcome VARCHAR(50),
  
  -- Timestamps
  predicted_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_employee_churn_employee ON employee_churn_predictions(employee_id);
CREATE INDEX idx_employee_churn_risk_level ON employee_churn_predictions(risk_level);
CREATE INDEX idx_employee_churn_status ON employee_churn_predictions(intervention_status);
CREATE INDEX idx_employee_churn_active ON employee_churn_predictions(risk_level, intervention_status) 
  WHERE risk_level IN ('high', 'critical') AND intervention_status = 'pending';

COMMENT ON TABLE employee_churn_predictions IS 'Predições de saída de colaboradores usando IA';

-- =====================================================
-- 2. TABELA: employee_behavioral_analysis
-- Análise comportamental profunda por IA
-- =====================================================

CREATE TABLE IF NOT EXISTS employee_behavioral_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  
  analysis_date DATE NOT NULL,
  
  -- Métricas de Engajamento
  engagement_score INTEGER CHECK (engagement_score >= 0 AND engagement_score <= 100),
  engagement_trend VARCHAR(20) CHECK (engagement_trend IN ('improving', 'stable', 'declining')),
  
  -- Métricas de Produtividade
  productivity_score INTEGER CHECK (productivity_score >= 0 AND productivity_score <= 100),
  tasks_completed INTEGER DEFAULT 0,
  tasks_overdue INTEGER DEFAULT 0,
  avg_task_completion_time INTERVAL,
  
  -- Métricas de Qualidade
  quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
  rework_rate NUMERIC(5, 2),
  client_satisfaction_avg NUMERIC(3, 2),
  
  -- Métricas de Colaboração
  collaboration_score INTEGER CHECK (collaboration_score >= 0 AND collaboration_score <= 100),
  meetings_attended INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  team_interactions INTEGER DEFAULT 0,
  
  -- Métricas de Bem-Estar
  wellbeing_score INTEGER CHECK (wellbeing_score >= 0 AND wellbeing <= 100),
  stress_level VARCHAR(20) CHECK (stress_level IN ('low', 'medium', 'high', 'critical')),
  work_life_balance_score INTEGER,
  
  -- Sinais de Alerta
  red_flags JSONB DEFAULT '[]'::jsonb,
  -- Exemplo: ["Queda de 30% em produtividade", "5 dias sem interação no Slack"]
  
  -- Pontos Positivos
  strengths JSONB DEFAULT '[]'::jsonb,
  -- Exemplo: ["Excelente colaboração", "Sempre pontual", "Feedback positivo de clientes"]
  
  -- Análise de Sentimento (de mensagens, emails, etc)
  sentiment_score NUMERIC(5, 2), -- -1 (muito negativo) a +1 (muito positivo)
  sentiment_trend VARCHAR(20),
  
  -- Recomendações da IA
  ai_recommendations JSONB DEFAULT '[]'::jsonb,
  -- Exemplo: [
  --   {"type": "motivate", "priority": "high", "message": "Elogiar publicamente pelo projeto X"},
  --   {"type": "support", "priority": "medium", "message": "Oferecer ajuda com tarefas"}
  -- ]
  
  -- Score geral (calculado)
  overall_health_score INTEGER GENERATED ALWAYS AS (
    (COALESCE(engagement_score, 0) * 0.3 + 
     COALESCE(productivity_score, 0) * 0.25 + 
     COALESCE(quality_score, 0) * 0.20 + 
     COALESCE(collaboration_score, 0) * 0.15 + 
     COALESCE(wellbeing_score, 0) * 0.10)::INTEGER
  ) STORED,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  UNIQUE(employee_id, analysis_date)
);

CREATE INDEX idx_employee_behavior_employee ON employee_behavioral_analysis(employee_id);
CREATE INDEX idx_employee_behavior_date ON employee_behavioral_analysis(analysis_date DESC);
CREATE INDEX idx_employee_behavior_health ON employee_behavioral_analysis(overall_health_score);
CREATE INDEX idx_employee_behavior_trend ON employee_behavioral_analysis(engagement_trend);

COMMENT ON TABLE employee_behavioral_analysis IS 'Análise comportamental profunda de colaboradores por IA';

-- =====================================================
-- 3. TABELA: employee_intervention_recommendations
-- Recomendações de ações de RH geradas por IA
-- =====================================================

CREATE TABLE IF NOT EXISTS employee_intervention_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  
  recommendation_type VARCHAR(50) NOT NULL CHECK (recommendation_type IN (
    'terminate', -- Demitir
    'pip', -- Performance Improvement Plan
    'promote', -- Promover
    'praise', -- Elogiar
    'coach', -- Coaching
    'mentor', -- Mentoria
    'train', -- Treinamento
    'salary_review', -- Revisão salarial
    'one_on_one', -- Conversa 1-on-1
    'workload_adjustment', -- Ajustar carga de trabalho
    'role_change', -- Mudança de função
    'team_change' -- Mudança de time
  )),
  
  priority INTEGER NOT NULL CHECK (priority >= 1 AND priority <= 10),
  urgency VARCHAR(20) CHECK (urgency IN ('immediate', 'this_week', 'this_month', 'low')),
  
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  
  -- Justificativa da IA
  reasoning TEXT NOT NULL,
  supporting_data JSONB DEFAULT '{}'::jsonb,
  
  -- Impacto estimado
  estimated_impact VARCHAR(20) CHECK (estimated_impact IN ('high', 'medium', 'low')),
  estimated_cost NUMERIC(10, 2),
  estimated_time_hours INTEGER,
  
  -- Script/Orientação
  suggested_approach TEXT,
  conversation_script TEXT,
  resources_needed TEXT[],
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'in_progress', 'completed', 'rejected', 'postponed')),
  
  assigned_to UUID REFERENCES user_profiles(id) ON DELETE SET NULL, -- RH responsável
  
  approved_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  
  executed_at TIMESTAMP WITH TIME ZONE,
  execution_notes TEXT,
  
  -- Resultado
  outcome VARCHAR(50),
  outcome_notes TEXT,
  was_effective BOOLEAN,
  
  -- Expires
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_employee_intervention_employee ON employee_intervention_recommendations(employee_id);
CREATE INDEX idx_employee_intervention_type ON employee_intervention_recommendations(recommendation_type);
CREATE INDEX idx_employee_intervention_priority ON employee_intervention_recommendations(priority DESC);
CREATE INDEX idx_employee_intervention_status ON employee_intervention_recommendations(status);
CREATE INDEX idx_employee_intervention_urgency ON employee_intervention_recommendations(urgency);

COMMENT ON TABLE employee_intervention_recommendations IS 'Recomendações de ações de RH geradas por IA';

-- =====================================================
-- 4. TABELA: employee_one_on_one_meetings
-- Reuniões 1-on-1 com colaboradores
-- =====================================================

CREATE TABLE IF NOT EXISTS employee_one_on_one_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  manager_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL NOT NULL,
  
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  
  meeting_type VARCHAR(50) CHECK (meeting_type IN ('regular', 'performance_review', 'feedback', 'career_development', 'urgent', 'exit_interview')),
  
  -- Preparação (sugerida por IA)
  ai_suggested_topics JSONB DEFAULT '[]'::jsonb,
  -- Exemplo: ["Discutir queda de produtividade", "Agradecer pelo projeto X", "Perguntar sobre bem-estar"]
  
  ai_suggested_questions JSONB DEFAULT '[]'::jsonb,
  -- Exemplo: ["Como você está se sentindo com a carga de trabalho?", "O que posso fazer para te ajudar?"]
  
  -- Tópicos a discutir
  agenda JSONB DEFAULT '[]'::jsonb,
  
  -- Notas da reunião
  notes TEXT,
  mood_before VARCHAR(20),
  mood_after VARCHAR(20),
  
  -- Action items gerados
  action_items JSONB DEFAULT '[]'::jsonb,
  
  -- Feedback
  employee_feedback TEXT,
  manager_feedback TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Follow-up
  requires_followup BOOLEAN DEFAULT false,
  followup_date DATE,
  followup_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_one_on_one_employee ON employee_one_on_one_meetings(employee_id);
CREATE INDEX idx_one_on_one_manager ON employee_one_on_one_meetings(manager_id);
CREATE INDEX idx_one_on_one_date ON employee_one_on_one_meetings(scheduled_date);
CREATE INDEX idx_one_on_one_status ON employee_one_on_one_meetings(status);

COMMENT ON TABLE employee_one_on_one_meetings IS 'Reuniões 1-on-1 com colaboradores, com sugestões de IA';

-- =====================================================
-- 5. TABELA: employee_motivation_messages
-- Mensagens automáticas enviadas pela IA
-- =====================================================

CREATE TABLE IF NOT EXISTS employee_motivation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  
  message_type VARCHAR(50) NOT NULL CHECK (message_type IN (
    'motivation', -- Mensagem motivacional
    'congratulation', -- Parabéns
    'reminder', -- Lembrete
    'encouragement', -- Encorajamento
    'recognition', -- Reconhecimento
    'support', -- Apoio
    'check_in', -- Check-in de bem-estar
    'achievement', -- Conquista
    'milestone' -- Marco importante
  )),
  
  trigger_event VARCHAR(100), -- O que causou o envio
  -- Exemplo: "goal_achieved", "task_overdue", "low_engagement_detected"
  
  subject VARCHAR(255),
  message_content TEXT NOT NULL,
  
  -- Canal de envio
  channel VARCHAR(20) DEFAULT 'email' CHECK (channel IN ('email', 'slack', 'whatsapp', 'in_app', 'sms')),
  
  -- Personalização
  is_personalized BOOLEAN DEFAULT true,
  personalization_data JSONB DEFAULT '{}'::jsonb,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Resposta do colaborador
  employee_response TEXT,
  employee_sentiment VARCHAR(20), -- positivo, neutro, negativo
  
  -- Efetividade
  was_effective BOOLEAN,
  effectiveness_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_motivation_messages_employee ON employee_motivation_messages(employee_id);
CREATE INDEX idx_motivation_messages_type ON employee_motivation_messages(message_type);
CREATE INDEX idx_motivation_messages_status ON employee_motivation_messages(status);
CREATE INDEX idx_motivation_messages_scheduled ON employee_motivation_messages(scheduled_for);

COMMENT ON TABLE employee_motivation_messages IS 'Mensagens automáticas de motivação enviadas pela IA';

-- =====================================================
-- 6. TABELA: employee_task_reminders
-- Lembretes inteligentes de tarefas não concluídas
-- =====================================================

CREATE TABLE IF NOT EXISTS employee_task_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  
  task_id UUID, -- Referência genérica a qualquer task (kanban, goal, etc)
  task_type VARCHAR(50), -- 'kanban_card', 'employee_goal', 'action_item'
  task_title VARCHAR(255) NOT NULL,
  task_due_date TIMESTAMP WITH TIME ZONE,
  
  -- Configuração do lembrete
  reminder_type VARCHAR(50) CHECK (reminder_type IN ('overdue', 'due_soon', 'gentle_nudge', 'urgent', 'final_warning')),
  
  priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  message TEXT NOT NULL,
  
  -- Canal
  channel VARCHAR(20) DEFAULT 'in_app' CHECK (channel IN ('email', 'slack', 'whatsapp', 'in_app', 'sms')),
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'acknowledged', 'task_completed', 'snoozed', 'ignored')),
  
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  
  -- Snooze
  snoozed_until TIMESTAMP WITH TIME ZONE,
  snooze_count INTEGER DEFAULT 0,
  
  -- Recorrência
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule VARCHAR(100), -- Exemplo: "every_day_at_9am", "every_monday"
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_task_reminders_employee ON employee_task_reminders(employee_id);
CREATE INDEX idx_task_reminders_status ON employee_task_reminders(status);
CREATE INDEX idx_task_reminders_scheduled ON employee_task_reminders(scheduled_for);
CREATE INDEX idx_task_reminders_task ON employee_task_reminders(task_id, task_type);

COMMENT ON TABLE employee_task_reminders IS 'Lembretes inteligentes de tarefas não concluídas';

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER update_employee_churn_predictions_updated_at
  BEFORE UPDATE ON employee_churn_predictions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_intervention_recommendations_updated_at
  BEFORE UPDATE ON employee_intervention_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_one_on_one_meetings_updated_at
  BEFORE UPDATE ON employee_one_on_one_meetings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION: Analisar Comportamento de Colaborador
-- =====================================================

CREATE OR REPLACE FUNCTION analyze_employee_behavior(p_employee_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS UUID AS $$
DECLARE
  v_analysis_id UUID;
  v_tasks_completed INTEGER;
  v_tasks_overdue INTEGER;
  v_engagement_score INTEGER;
  v_productivity_score INTEGER;
BEGIN
  -- Contar tarefas do Kanban
  SELECT 
    COUNT(*) FILTER (WHERE completed_at IS NOT NULL),
    COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND completed_at IS NULL)
  INTO v_tasks_completed, v_tasks_overdue
  FROM kanban_cards
  WHERE p_employee_id = ANY(assignees)
  AND created_at::DATE = p_date;
  
  -- Calcular scores (simplificado, na produção seria mais complexo)
  v_productivity_score := LEAST(100, v_tasks_completed * 10);
  v_engagement_score := GREATEST(0, 100 - (v_tasks_overdue * 15));
  
  -- Inserir ou atualizar análise
  INSERT INTO employee_behavioral_analysis (
    employee_id,
    analysis_date,
    engagement_score,
    productivity_score,
    tasks_completed,
    tasks_overdue
  ) VALUES (
    p_employee_id,
    p_date,
    v_engagement_score,
    v_productivity_score,
    v_tasks_completed,
    v_tasks_overdue
  )
  ON CONFLICT (employee_id, analysis_date)
  DO UPDATE SET
    engagement_score = EXCLUDED.engagement_score,
    productivity_score = EXCLUDED.productivity_score,
    tasks_completed = EXCLUDED.tasks_completed,
    tasks_overdue = EXCLUDED.tasks_overdue
  RETURNING id INTO v_analysis_id;
  
  RETURN v_analysis_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION analyze_employee_behavior IS 'Analisa comportamento e performance de colaborador';

-- =====================================================
-- FUNCTION: Prever Churn de Colaborador
-- =====================================================

CREATE OR REPLACE FUNCTION predict_employee_churn(p_employee_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_churn_probability NUMERIC := 0;
  v_risk_level VARCHAR(20);
  v_factors JSONB := '[]'::jsonb;
  v_performance_avg NUMERIC;
  v_engagement_avg NUMERIC;
  v_days_without_task INTEGER;
BEGIN
  -- Buscar métricas recentes (últimos 30 dias)
  SELECT 
    AVG(productivity_score),
    AVG(engagement_score)
  INTO v_performance_avg, v_engagement_avg
  FROM employee_behavioral_analysis
  WHERE employee_id = p_employee_id
  AND analysis_date > CURRENT_DATE - INTERVAL '30 days';
  
  -- Calcular dias sem completar tarefas
  SELECT 
    EXTRACT(DAY FROM (CURRENT_DATE - MAX(completed_at::DATE)))::INTEGER
  INTO v_days_without_task
  FROM kanban_cards
  WHERE p_employee_id = ANY(assignees)
  AND completed_at IS NOT NULL;
  
  -- Lógica simplificada de predição (na produção usaria ML real)
  IF v_performance_avg < 40 THEN
    v_churn_probability := v_churn_probability + 30;
    v_factors := v_factors || jsonb_build_object('factor', 'Performance muito baixa', 'weight', 'high', 'impact', 0.30);
  ELSIF v_performance_avg < 60 THEN
    v_churn_probability := v_churn_probability + 15;
    v_factors := v_factors || jsonb_build_object('factor', 'Performance abaixo da média', 'weight', 'medium', 'impact', 0.15);
  END IF;
  
  IF v_engagement_avg < 40 THEN
    v_churn_probability := v_churn_probability + 25;
    v_factors := v_factors || jsonb_build_object('factor', 'Engajamento muito baixo', 'weight', 'high', 'impact', 0.25);
  END IF;
  
  IF v_days_without_task > 7 THEN
    v_churn_probability := v_churn_probability + 20;
    v_factors := v_factors || jsonb_build_object('factor', format('%s dias sem completar tarefas', v_days_without_task), 'weight', 'high', 'impact', 0.20);
  END IF;
  
  -- Determinar nível de risco
  v_risk_level := CASE
    WHEN v_churn_probability >= 70 THEN 'critical'
    WHEN v_churn_probability >= 50 THEN 'high'
    WHEN v_churn_probability >= 30 THEN 'medium'
    ELSE 'low'
  END;
  
  -- Inserir ou atualizar predição
  INSERT INTO employee_churn_predictions (
    employee_id,
    churn_probability,
    risk_level,
    days_until_churn,
    predicted_churn_date,
    confidence_level,
    contributing_factors
  ) VALUES (
    p_employee_id,
    v_churn_probability,
    v_risk_level,
    CASE WHEN v_churn_probability > 50 THEN 30 ELSE NULL END,
    CASE WHEN v_churn_probability > 50 THEN CURRENT_DATE + INTERVAL '30 days' ELSE NULL END,
    75.0,
    v_factors
  )
  ON CONFLICT (employee_id)
  DO UPDATE SET
    churn_probability = EXCLUDED.churn_probability,
    risk_level = EXCLUDED.risk_level,
    days_until_churn = EXCLUDED.days_until_churn,
    predicted_churn_date = EXCLUDED.predicted_churn_date,
    contributing_factors = EXCLUDED.contributing_factors,
    updated_at = now();
  
  RETURN v_churn_probability;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION predict_employee_churn IS 'Prediz probabilidade de saída de colaborador';

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE employee_churn_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_behavioral_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_intervention_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_one_on_one_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_motivation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_task_reminders ENABLE ROW LEVEL SECURITY;

-- RH e Super Admins veem tudo
CREATE POLICY "RH vê análises de colaboradores"
  ON employee_churn_predictions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type IN ('super_admin', 'hr')
    )
  );

CREATE POLICY "RH vê análises comportamentais"
  ON employee_behavioral_analysis FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type IN ('super_admin', 'hr')
    )
  );

-- Colaborador vê apenas suas próprias mensagens
CREATE POLICY "Colaborador vê suas mensagens"
  ON employee_motivation_messages FOR SELECT
  USING (
    employee_id = (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type IN ('super_admin', 'hr')
    )
  );

-- Colaborador vê seus próprios lembretes
CREATE POLICY "Colaborador vê seus lembretes"
  ON employee_task_reminders FOR SELECT
  USING (
    employee_id = (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type IN ('super_admin', 'hr')
    )
  );

-- =====================================================
-- Fim da Migration 22: Employee Intelligence & Retention
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 22: Employee Intelligence & Retention System concluída!';
  RAISE NOTICE '📊 6 tabelas criadas para IA de colaboradores';
  RAISE NOTICE '🤖 Sistema completo de predição, análise e intervenção';
END $$;

