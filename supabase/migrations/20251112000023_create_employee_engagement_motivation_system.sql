-- =====================================================
-- MIGRATION 23: Employee Engagement & Motivation System
-- Descrição: Sistema completo de engajamento e motivação de colaboradores
-- Dependências: 20251112000022_create_employee_intelligence_retention_system.sql
-- =====================================================

-- =====================================================
-- 1. TABELA: employee_wellbeing_checkins
-- Check-ins de bem-estar e humor
-- =====================================================

CREATE TABLE IF NOT EXISTS employee_wellbeing_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  
  checkin_date DATE NOT NULL,
  
  -- Mood/Humor
  mood VARCHAR(20) NOT NULL CHECK (mood IN ('very_happy', 'happy', 'neutral', 'sad', 'very_sad', 'stressed', 'anxious', 'excited')),
  mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 10),
  
  -- Energia
  energy_level VARCHAR(20) CHECK (energy_level IN ('very_high', 'high', 'medium', 'low', 'very_low')),
  energy_score INTEGER CHECK (energy_score >= 1 AND energy_score <= 10),
  
  -- Motivação
  motivation_level VARCHAR(20) CHECK (motivation_level IN ('very_motivated', 'motivated', 'neutral', 'demotivated', 'burned_out')),
  motivation_score INTEGER CHECK (motivation_score >= 1 AND motivation_score <= 10),
  
  -- Carga de trabalho
  workload_perception VARCHAR(20) CHECK (workload_perception IN ('too_much', 'just_right', 'too_little')),
  
  -- Satisfação
  job_satisfaction_score INTEGER CHECK (job_satisfaction_score >= 1 AND job_satisfaction_score <= 10),
  
  -- Feedback aberto
  feelings TEXT,
  challenges TEXT,
  wins TEXT,
  needs_help_with TEXT,
  
  -- Tags
  tags TEXT[],
  
  -- Resposta automática da IA
  ai_response TEXT,
  ai_suggestions JSONB DEFAULT '[]'::jsonb,
  
  -- Follow-up necessário?
  requires_manager_attention BOOLEAN DEFAULT false,
  manager_notified BOOLEAN DEFAULT false,
  manager_response TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  UNIQUE(employee_id, checkin_date)
);

CREATE INDEX idx_wellbeing_checkins_employee ON employee_wellbeing_checkins(employee_id);
CREATE INDEX idx_wellbeing_checkins_date ON employee_wellbeing_checkins(checkin_date DESC);
CREATE INDEX idx_wellbeing_checkins_mood ON employee_wellbeing_checkins(mood);
CREATE INDEX idx_wellbeing_checkins_attention ON employee_wellbeing_checkins(requires_manager_attention) WHERE requires_manager_attention = true;

COMMENT ON TABLE employee_wellbeing_checkins IS 'Check-ins diários de bem-estar e humor dos colaboradores';

-- =====================================================
-- 2. TABELA: employee_recognition_events
-- Eventos de reconhecimento e celebração
-- =====================================================

CREATE TABLE IF NOT EXISTS employee_recognition_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  recognized_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  recognition_type VARCHAR(50) NOT NULL CHECK (recognition_type IN (
    'peer_recognition', -- Colega reconheceu
    'manager_recognition', -- Gestor reconheceu
    'client_praise', -- Elogio de cliente
    'achievement', -- Conquista
    'milestone', -- Marco importante
    'innovation', -- Inovação
    'helping_others', -- Ajudou outros
    'leadership', -- Liderança
    'quality_work', -- Trabalho de qualidade
    'going_extra_mile' -- Foi além
  )),
  
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  
  -- Visibilidade
  is_public BOOLEAN DEFAULT true, -- Aparece no feed público
  
  -- Reações
  reactions JSONB DEFAULT '{"likes": 0, "loves": 0, "claps": 0, "fires": 0}'::jsonb,
  
  -- Comentários
  comments_count INTEGER DEFAULT 0,
  
  -- Pontos de gamificação
  points_awarded INTEGER DEFAULT 0,
  
  -- Anexos (fotos, vídeos do reconhecimento)
  attachments JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_recognition_employee ON employee_recognition_events(employee_id);
CREATE INDEX idx_recognition_type ON employee_recognition_events(recognition_type);
CREATE INDEX idx_recognition_public ON employee_recognition_events(is_public) WHERE is_public = true;
CREATE INDEX idx_recognition_date ON employee_recognition_events(created_at DESC);

COMMENT ON TABLE employee_recognition_events IS 'Eventos de reconhecimento e celebração de colaboradores';

-- =====================================================
-- 3. TABELA: employee_learning_development
-- Aprendizado e desenvolvimento profissional
-- =====================================================

CREATE TABLE IF NOT EXISTS employee_learning_development (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  
  item_type VARCHAR(50) NOT NULL CHECK (item_type IN (
    'course', -- Curso
    'workshop', -- Workshop
    'book', -- Livro
    'certification', -- Certificação
    'conference', -- Conferência
    'mentorship', -- Mentoria
    'project', -- Projeto de aprendizado
    'skill' -- Habilidade adquirida
  )),
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  provider VARCHAR(255), -- Udemy, Coursera, etc
  url TEXT,
  
  -- Skill relacionada
  skill_name VARCHAR(100),
  skill_level_before VARCHAR(20) CHECK (skill_level_before IN ('beginner', 'intermediate', 'advanced', 'expert')),
  skill_level_after VARCHAR(20) CHECK (skill_level_after IN ('beginner', 'intermediate', 'advanced', 'expert')),
  
  -- Status
  status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('planned', 'in_progress', 'completed', 'abandoned')),
  
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  
  started_at DATE,
  completed_at DATE,
  
  -- Investimento
  cost NUMERIC(10, 2),
  time_invested_hours INTEGER,
  
  -- Certificado
  has_certificate BOOLEAN DEFAULT false,
  certificate_url TEXT,
  
  -- Aplicação prática
  applied_in_project TEXT,
  impact_description TEXT,
  
  -- Feedback
  employee_rating INTEGER CHECK (employee_rating >= 1 AND employee_rating <= 5),
  employee_review TEXT,
  
  -- Recomendado pela IA?
  recommended_by_ai BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_learning_employee ON employee_learning_development(employee_id);
CREATE INDEX idx_learning_type ON employee_learning_development(item_type);
CREATE INDEX idx_learning_status ON employee_learning_development(status);
CREATE INDEX idx_learning_skill ON employee_learning_development(skill_name);

COMMENT ON TABLE employee_learning_development IS 'Aprendizado e desenvolvimento profissional de colaboradores';

-- =====================================================
-- 4. TABELA: employee_career_path
-- Plano de carreira e crescimento
-- =====================================================

CREATE TABLE IF NOT EXISTS employee_career_path (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  
  current_level VARCHAR(50) NOT NULL,
  target_level VARCHAR(50) NOT NULL,
  
  target_position VARCHAR(100),
  estimated_timeline_months INTEGER,
  
  -- Requisitos para promoção
  requirements JSONB DEFAULT '[]'::jsonb,
  -- Exemplo: [
  --   {"requirement": "Liderar 3 projetos", "status": "in_progress", "progress": 33},
  --   {"requirement": "Certificação em X", "status": "completed", "progress": 100}
  -- ]
  
  -- Skills necessárias
  required_skills JSONB DEFAULT '[]'::jsonb,
  -- Exemplo: [
  --   {"skill": "Leadership", "current_level": "intermediate", "required_level": "advanced"},
  --   {"skill": "Project Management", "current_level": "beginner", "required_level": "intermediate"}
  -- ]
  
  -- Milestones
  milestones JSONB DEFAULT '[]'::jsonb,
  
  -- Progress geral
  overall_progress NUMERIC(5, 2) DEFAULT 0,
  
  -- Next steps (sugeridos por IA)
  ai_suggested_next_steps JSONB DEFAULT '[]'::jsonb,
  
  -- Mentoria
  mentor_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'revised')),
  
  -- Review dates
  last_review_date DATE,
  next_review_date DATE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  UNIQUE(employee_id)
);

CREATE INDEX idx_career_path_employee ON employee_career_path(employee_id);
CREATE INDEX idx_career_path_status ON employee_career_path(status);

COMMENT ON TABLE employee_career_path IS 'Plano de carreira e desenvolvimento de colaboradores';

-- =====================================================
-- 5. TABELA: employee_feedback_360
-- Feedback 360 graus
-- =====================================================

CREATE TABLE IF NOT EXISTS employee_feedback_360 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL NOT NULL,
  
  feedback_cycle VARCHAR(100), -- "2024-Q1", "Annual 2024"
  
  reviewer_relationship VARCHAR(50) CHECK (reviewer_relationship IN ('manager', 'peer', 'direct_report', 'client', 'self')),
  
  -- Avaliações por categoria (1-5)
  technical_skills_rating INTEGER CHECK (technical_skills_rating >= 1 AND technical_skills_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  teamwork_rating INTEGER CHECK (teamwork_rating >= 1 AND teamwork_rating <= 5),
  leadership_rating INTEGER CHECK (leadership_rating >= 1 AND leadership_rating <= 5),
  problem_solving_rating INTEGER CHECK (problem_solving_rating >= 1 AND problem_solving_rating <= 5),
  time_management_rating INTEGER CHECK (time_management_rating >= 1 AND time_management_rating <= 5),
  adaptability_rating INTEGER CHECK (adaptability_rating >= 1 AND adaptability_rating <= 5),
  
  -- Feedback qualitativo
  strengths TEXT,
  areas_for_improvement TEXT,
  specific_examples TEXT,
  
  -- Recomendações
  development_suggestions TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'reviewed')),
  
  is_anonymous BOOLEAN DEFAULT false,
  
  submitted_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_feedback_360_employee ON employee_feedback_360(employee_id);
CREATE INDEX idx_feedback_360_reviewer ON employee_feedback_360(reviewer_id);
CREATE INDEX idx_feedback_360_cycle ON employee_feedback_360(feedback_cycle);
CREATE INDEX idx_feedback_360_relationship ON employee_feedback_360(reviewer_relationship);

COMMENT ON TABLE employee_feedback_360 IS 'Feedback 360 graus de colaboradores';

-- =====================================================
-- 6. TABELA: employee_celebration_events
-- Eventos de celebração (aniversário, conquistas, etc)
-- =====================================================

CREATE TABLE IF NOT EXISTS employee_celebration_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
    'birthday', -- Aniversário
    'work_anniversary', -- Aniversário na empresa
    'promotion', -- Promoção
    'achievement', -- Conquista
    'milestone', -- Marco
    'team_win', -- Vitória do time
    'personal_achievement' -- Realização pessoal
  )),
  
  event_date DATE NOT NULL,
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Auto-celebração pela IA?
  auto_generated BOOLEAN DEFAULT false,
  
  -- Notificações enviadas
  team_notified BOOLEAN DEFAULT false,
  public_announcement BOOLEAN DEFAULT false,
  
  -- Celebração
  celebration_message TEXT,
  celebration_gif_url TEXT,
  
  -- Reações do time
  reactions JSONB DEFAULT '{"likes": 0, "loves": 0, "congrats": 0, "fires": 0}'::jsonb,
  
  comments JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_celebration_employee ON employee_celebration_events(employee_id);
CREATE INDEX idx_celebration_type ON employee_celebration_events(event_type);
CREATE INDEX idx_celebration_date ON employee_celebration_events(event_date);

COMMENT ON TABLE employee_celebration_events IS 'Eventos de celebração de colaboradores';

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER update_employee_learning_development_updated_at
  BEFORE UPDATE ON employee_learning_development
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_career_path_updated_at
  BEFORE UPDATE ON employee_career_path
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_feedback_360_updated_at
  BEFORE UPDATE ON employee_feedback_360
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TRIGGER: Auto-celebrar conquistas de gamificação
-- =====================================================

CREATE OR REPLACE FUNCTION auto_celebrate_achievement()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando colaborador ganha achievement, criar celebração
  INSERT INTO employee_celebration_events (
    employee_id,
    event_type,
    event_date,
    title,
    description,
    auto_generated,
    celebration_message
  ) 
  SELECT 
    NEW.employee_id,
    'achievement',
    CURRENT_DATE,
    'Nova Conquista: ' || ga.achievement_name,
    ga.achievement_description,
    true,
    '🎉 Parabéns! Você desbloqueou: ' || ga.achievement_name || '! +' || ga.points_awarded || ' pontos!'
  FROM gamification_achievements ga
  WHERE ga.id = NEW.achievement_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_celebrate_achievement
  AFTER INSERT ON employee_gamification_achievements
  FOR EACH ROW
  EXECUTE FUNCTION auto_celebrate_achievement();

-- =====================================================
-- FUNCTION: Enviar Mensagem Motivacional Automática
-- =====================================================

CREATE OR REPLACE FUNCTION send_automatic_motivation_message(
  p_employee_id UUID,
  p_message_type VARCHAR,
  p_trigger_event VARCHAR,
  p_custom_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_message_id UUID;
  v_employee RECORD;
  v_final_message TEXT;
BEGIN
  -- Buscar informações do colaborador
  SELECT e.*, up.full_name
  INTO v_employee
  FROM employees e
  JOIN user_profiles up ON up.id = e.user_id
  WHERE e.id = p_employee_id;
  
  -- Gerar mensagem baseada no tipo
  IF p_custom_message IS NOT NULL THEN
    v_final_message := p_custom_message;
  ELSE
    v_final_message := CASE p_message_type
      WHEN 'motivation' THEN 'Olá ' || v_employee.full_name || '! 💪 Continue com o ótimo trabalho! Sua dedicação faz a diferença!'
      WHEN 'congratulation' THEN 'Parabéns, ' || v_employee.full_name || '! 🎉 Você está arrasando!'
      WHEN 'reminder' THEN 'Oi ' || v_employee.full_name || '! 📋 Lembrete amigável: você tem tarefas pendentes.'
      WHEN 'check_in' THEN 'Olá ' || v_employee.full_name || '! 😊 Como você está se sentindo hoje?'
      ELSE 'Olá ' || v_employee.full_name || '!'
    END;
  END IF;
  
  -- Inserir mensagem
  INSERT INTO employee_motivation_messages (
    employee_id,
    message_type,
    trigger_event,
    message_content,
    channel,
    status
  ) VALUES (
    p_employee_id,
    p_message_type,
    p_trigger_event,
    v_final_message,
    'in_app',
    'pending'
  ) RETURNING id INTO v_message_id;
  
  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION send_automatic_motivation_message IS 'Envia mensagem motivacional automática para colaborador';

-- =====================================================
-- FUNCTION: Calcular Score Geral de Bem-Estar
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_employee_wellbeing_score(p_employee_id UUID, p_days INTEGER DEFAULT 30)
RETURNS NUMERIC AS $$
DECLARE
  v_avg_mood NUMERIC;
  v_avg_energy NUMERIC;
  v_avg_motivation NUMERIC;
  v_avg_satisfaction NUMERIC;
  v_overall_score NUMERIC;
BEGIN
  SELECT 
    AVG(mood_score),
    AVG(energy_score),
    AVG(motivation_score),
    AVG(job_satisfaction_score)
  INTO v_avg_mood, v_avg_energy, v_avg_motivation, v_avg_satisfaction
  FROM employee_wellbeing_checkins
  WHERE employee_id = p_employee_id
  AND checkin_date > CURRENT_DATE - p_days;
  
  -- Calcular score geral (média ponderada)
  v_overall_score := (
    COALESCE(v_avg_mood, 5) * 0.25 +
    COALESCE(v_avg_energy, 5) * 0.20 +
    COALESCE(v_avg_motivation, 5) * 0.30 +
    COALESCE(v_avg_satisfaction, 5) * 0.25
  ) * 10; -- Converter para escala 0-100
  
  RETURN v_overall_score;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_employee_wellbeing_score IS 'Calcula score geral de bem-estar do colaborador';

-- =====================================================
-- FUNCTION: Detectar Colaboradores Precisando de Atenção
-- =====================================================

CREATE OR REPLACE FUNCTION detect_employees_needing_attention()
RETURNS TABLE(employee_id UUID, reason TEXT, urgency VARCHAR, suggested_action TEXT) AS $$
BEGIN
  RETURN QUERY
  
  -- 1. Colaboradores com humor baixo consistente
  SELECT DISTINCT
    wc.employee_id,
    'Humor baixo por 3+ dias consecutivos'::TEXT,
    'high'::VARCHAR,
    'Agendar 1-on-1 para conversar sobre bem-estar'::TEXT
  FROM employee_wellbeing_checkins wc
  WHERE wc.checkin_date > CURRENT_DATE - 3
  AND wc.mood IN ('sad', 'very_sad', 'stressed', 'anxious')
  GROUP BY wc.employee_id
  HAVING COUNT(*) >= 3
  
  UNION
  
  -- 2. Colaboradores com muitas tarefas atrasadas
  SELECT DISTINCT
    tr.employee_id,
    format('%s tarefas atrasadas', COUNT(tr.id))::TEXT,
    'medium'::VARCHAR,
    'Oferecer ajuda e redistribuir carga de trabalho'::TEXT
  FROM employee_task_reminders tr
  WHERE tr.reminder_type = 'overdue'
  AND tr.status NOT IN ('task_completed', 'acknowledged')
  GROUP BY tr.employee_id
  HAVING COUNT(*) >= 5
  
  UNION
  
  -- 3. Colaboradores em alto risco de churn
  SELECT 
    ecp.employee_id,
    format('Alto risco de saída (%s%%)', ecp.churn_probability)::TEXT,
    'critical'::VARCHAR,
    'Intervenção urgente: revisar compensação e plano de carreira'::TEXT
  FROM employee_churn_predictions ecp
  WHERE ecp.risk_level IN ('high', 'critical')
  AND ecp.intervention_status = 'pending';
  
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION detect_employees_needing_attention IS 'Detecta colaboradores que precisam de atenção urgente';

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE employee_wellbeing_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_recognition_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_learning_development ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_career_path ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_feedback_360 ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_celebration_events ENABLE ROW LEVEL SECURITY;

-- Colaborador vê apenas seus próprios check-ins
CREATE POLICY "Colaborador vê seus check-ins"
  ON employee_wellbeing_checkins FOR ALL
  USING (
    employee_id = (SELECT id FROM employees WHERE user_id = auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type IN ('super_admin', 'hr')
    )
  );

-- Todos veem reconhecimentos públicos
CREATE POLICY "Ver reconhecimentos públicos"
  ON employee_recognition_events FOR SELECT
  USING (
    is_public = true
    OR
    employee_id = (SELECT id FROM employees WHERE user_id = auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type IN ('super_admin', 'hr')
    )
  );

-- Todos veem celebrações
CREATE POLICY "Ver celebrações"
  ON employee_celebration_events FOR SELECT
  USING (true);

-- Colaborador vê seu próprio plano de carreira
CREATE POLICY "Ver plano de carreira"
  ON employee_career_path FOR SELECT
  USING (
    employee_id = (SELECT id FROM employees WHERE user_id = auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type IN ('super_admin', 'hr')
    )
  );

-- =====================================================
-- Fim da Migration 23: Employee Engagement & Motivation
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 23: Employee Engagement & Motivation System concluída!';
  RAISE NOTICE '📊 6 tabelas criadas para engajamento e motivação';
  RAISE NOTICE '🎉 Sistema completo de bem-estar, reconhecimento e desenvolvimento';
END $$;

