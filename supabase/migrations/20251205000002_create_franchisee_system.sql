-- =====================================================
-- VALLE 360 - SISTEMA DE FRANQUEADOS
-- Gestão de franquias, recrutamento e análise
-- =====================================================

-- Tabela de Franqueados (franquias vinculadas a um cliente franqueador)
CREATE TABLE IF NOT EXISTS franchisees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL, -- cliente franqueador (dona da rede)
  
  -- Dados da Franquia
  unit_name TEXT NOT NULL, -- nome da unidade
  unit_code TEXT, -- código interno da unidade
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  phone TEXT,
  email TEXT,
  
  -- Dados do Franqueado (responsável)
  owner_name TEXT NOT NULL,
  owner_email TEXT,
  owner_phone TEXT,
  owner_cpf TEXT,
  
  -- Status
  status TEXT DEFAULT 'candidate', -- candidate, active, inactive, suspended
  pipeline_stage TEXT, -- screening, interview, test, analysis, approved, rejected, onboarding
  
  -- Datas
  contract_start_date DATE,
  contract_end_date DATE,
  last_evaluation_date DATE,
  
  -- Métricas atuais
  current_nps INTEGER,
  performance_score INTEGER,
  churn_risk INTEGER,
  health_status TEXT DEFAULT 'healthy', -- healthy, attention, critical
  
  -- Perfil comportamental
  disc_profile JSONB,
  cultural_fit_score INTEGER,
  entrepreneur_score INTEGER,
  
  -- IA
  ai_score INTEGER, -- score geral calculado por IA
  ai_recommendation TEXT, -- approve, review, reject
  ai_notes TEXT,
  
  -- Metadados
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Testes aplicados aos franqueados
CREATE TABLE IF NOT EXISTS franchisee_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchisee_id UUID REFERENCES franchisees(id) ON DELETE CASCADE,
  
  -- Tipo do teste
  test_type TEXT NOT NULL, -- disc, cultural_fit, entrepreneur, custom, financial_capacity
  test_name TEXT,
  
  -- Respostas e resultados
  questions JSONB, -- perguntas do teste
  answers JSONB, -- respostas do candidato
  results JSONB, -- resultados calculados
  score INTEGER, -- nota geral 0-100
  
  -- Análise IA
  ai_analysis TEXT,
  ai_insights JSONB,
  
  -- Status
  status TEXT DEFAULT 'pending', -- pending, in_progress, completed
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Quem aplicou
  applied_by_user_id UUID,
  applied_by_name TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Performance histórica das franquias
CREATE TABLE IF NOT EXISTS franchisee_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchisee_id UUID REFERENCES franchisees(id) ON DELETE CASCADE,
  period DATE NOT NULL, -- mês/ano da medição
  
  -- Métricas de Marketing
  followers_instagram INTEGER,
  followers_facebook INTEGER,
  followers_tiktok INTEGER,
  engagement_rate DECIMAL(5,2),
  reach_total INTEGER,
  impressions_total INTEGER,
  posts_count INTEGER,
  
  -- Leads e Conversão
  leads_generated INTEGER,
  leads_qualified INTEGER,
  conversion_rate DECIMAL(5,2),
  
  -- Financeiro (se disponível)
  revenue DECIMAL(12,2),
  growth_rate DECIMAL(5,2),
  
  -- NPS e Satisfação
  nps_score INTEGER,
  customer_satisfaction DECIMAL(3,2),
  complaints_count INTEGER,
  
  -- Ranking
  ranking_position INTEGER,
  ranking_total INTEGER,
  
  -- Comparativos
  vs_network_average DECIMAL(5,2), -- % em relação à média da rede
  vs_previous_period DECIMAL(5,2), -- % em relação ao período anterior
  
  -- IA
  health_score INTEGER,
  churn_risk INTEGER,
  ai_insights JSONB,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Candidatos a Franqueado (pipeline de recrutamento)
CREATE TABLE IF NOT EXISTS franchisee_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL, -- cliente franqueador
  
  -- Dados do Candidato
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  cpf TEXT,
  city TEXT,
  state TEXT,
  
  -- Informações de Interesse
  capital_available DECIMAL(12,2),
  investment_timeline TEXT, -- immediate, 3_months, 6_months, 1_year
  preferred_region TEXT,
  previous_experience TEXT,
  motivation TEXT,
  how_found_us TEXT, -- website, referral, event, social_media, other
  
  -- Pipeline
  stage TEXT DEFAULT 'new', -- new, screening, interview, tests, analysis, approved, rejected, converted
  stage_changed_at TIMESTAMPTZ DEFAULT now(),
  
  -- Responsável
  assigned_to_user_id UUID,
  assigned_to_name TEXT,
  
  -- Avaliações
  screening_score INTEGER,
  interview_score INTEGER,
  interview_notes TEXT,
  interview_date TIMESTAMPTZ,
  
  -- IA
  ai_fit_score INTEGER, -- compatibilidade com a marca
  ai_success_probability INTEGER, -- chance de sucesso como franqueado
  ai_recommendation TEXT,
  ai_analysis TEXT,
  
  -- Resultado
  final_decision TEXT, -- approved, rejected, on_hold
  decision_date TIMESTAMPTZ,
  decision_by_user_id UUID,
  decision_notes TEXT,
  
  -- Se convertido
  converted_to_franchisee_id UUID REFERENCES franchisees(id),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Templates de Testes
CREATE TABLE IF NOT EXISTS franchisee_test_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID, -- NULL = template global, preenchido = template do cliente
  
  test_type TEXT NOT NULL, -- disc, cultural_fit, entrepreneur, custom
  name TEXT NOT NULL,
  description TEXT,
  
  -- Estrutura do teste
  questions JSONB NOT NULL, -- array de perguntas com opções
  scoring_rules JSONB, -- regras de pontuação
  time_limit_minutes INTEGER,
  
  -- Configurações
  is_active BOOLEAN DEFAULT true,
  is_required BOOLEAN DEFAULT false, -- obrigatório no pipeline
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Alertas de Franquias
CREATE TABLE IF NOT EXISTS franchisee_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchisee_id UUID REFERENCES franchisees(id) ON DELETE CASCADE,
  client_id UUID NOT NULL,
  
  type TEXT NOT NULL, -- performance_drop, churn_risk, inactive, missed_target, opportunity
  severity TEXT DEFAULT 'medium', -- low, medium, high, critical
  
  title TEXT NOT NULL,
  description TEXT,
  
  -- Métricas relacionadas
  metric_name TEXT,
  metric_value DECIMAL,
  metric_threshold DECIMAL,
  
  -- Ação sugerida
  suggested_action TEXT,
  action_url TEXT,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by_user_id UUID,
  resolution_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_franchisees_client ON franchisees(client_id);
CREATE INDEX IF NOT EXISTS idx_franchisees_status ON franchisees(status);
CREATE INDEX IF NOT EXISTS idx_franchisees_pipeline ON franchisees(pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_franchisee_tests_franchisee ON franchisee_tests(franchisee_id);
CREATE INDEX IF NOT EXISTS idx_franchisee_performance_franchisee ON franchisee_performance(franchisee_id);
CREATE INDEX IF NOT EXISTS idx_franchisee_performance_period ON franchisee_performance(period);
CREATE INDEX IF NOT EXISTS idx_franchisee_candidates_client ON franchisee_candidates(client_id);
CREATE INDEX IF NOT EXISTS idx_franchisee_candidates_stage ON franchisee_candidates(stage);
CREATE INDEX IF NOT EXISTS idx_franchisee_alerts_client ON franchisee_alerts(client_id);
CREATE INDEX IF NOT EXISTS idx_franchisee_alerts_unread ON franchisee_alerts(client_id, is_read) WHERE is_read = false;

-- Triggers para atualizar updated_at
CREATE OR REPLACE FUNCTION update_franchisee_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_franchisees_updated_at
  BEFORE UPDATE ON franchisees
  FOR EACH ROW EXECUTE FUNCTION update_franchisee_updated_at();

CREATE TRIGGER trigger_franchisee_candidates_updated_at
  BEFORE UPDATE ON franchisee_candidates
  FOR EACH ROW EXECUTE FUNCTION update_franchisee_updated_at();

CREATE TRIGGER trigger_franchisee_test_templates_updated_at
  BEFORE UPDATE ON franchisee_test_templates
  FOR EACH ROW EXECUTE FUNCTION update_franchisee_updated_at();

-- =====================================================
-- SEED: Templates de Testes Padrão
-- =====================================================

INSERT INTO franchisee_test_templates (test_type, name, description, questions, scoring_rules) VALUES
(
  'disc',
  'Perfil DISC',
  'Avaliação do perfil comportamental baseado na metodologia DISC',
  '[
    {
      "id": "q1",
      "text": "Em uma reunião de equipe, você geralmente:",
      "options": [
        {"id": "a", "text": "Assume a liderança e direciona as discussões", "profile": "D"},
        {"id": "b", "text": "Procura motivar e engajar todos os participantes", "profile": "I"},
        {"id": "c", "text": "Escuta atentamente e busca consenso", "profile": "S"},
        {"id": "d", "text": "Analisa dados e faz perguntas detalhadas", "profile": "C"}
      ]
    },
    {
      "id": "q2",
      "text": "Quando enfrenta um problema complexo, você prefere:",
      "options": [
        {"id": "a", "text": "Tomar decisões rápidas e agir imediatamente", "profile": "D"},
        {"id": "b", "text": "Discutir com outros e buscar soluções criativas", "profile": "I"},
        {"id": "c", "text": "Avaliar calmamente todas as opções disponíveis", "profile": "S"},
        {"id": "d", "text": "Pesquisar e analisar todos os dados relevantes", "profile": "C"}
      ]
    },
    {
      "id": "q3",
      "text": "O que mais te motiva no trabalho?",
      "options": [
        {"id": "a", "text": "Alcançar resultados e superar metas", "profile": "D"},
        {"id": "b", "text": "Reconhecimento e interação com pessoas", "profile": "I"},
        {"id": "c", "text": "Estabilidade e ambiente harmonioso", "profile": "S"},
        {"id": "d", "text": "Precisão e qualidade no trabalho", "profile": "C"}
      ]
    }
  ]',
  '{"D": "Dominância", "I": "Influência", "S": "Estabilidade", "C": "Conformidade"}'
),
(
  'cultural_fit',
  'Fit Cultural',
  'Avaliação de alinhamento com os valores e cultura da marca',
  '[
    {
      "id": "q1",
      "text": "Como você lida com feedback negativo de clientes?",
      "options": [
        {"id": "a", "text": "Ouço atentamente e busco resolver o problema", "score": 10},
        {"id": "b", "text": "Fico chateado mas tento melhorar", "score": 7},
        {"id": "c", "text": "Acho que nem todo cliente tem razão", "score": 4},
        {"id": "d", "text": "Prefiro evitar esse tipo de situação", "score": 2}
      ]
    },
    {
      "id": "q2",
      "text": "Qual sua visão sobre seguir padrões e processos da franqueadora?",
      "options": [
        {"id": "a", "text": "Essencial para manter a qualidade da marca", "score": 10},
        {"id": "b", "text": "Importante, mas precisa de flexibilidade", "score": 7},
        {"id": "c", "text": "Prefiro ter mais autonomia", "score": 4},
        {"id": "d", "text": "Processos muito rígidos limitam a criatividade", "score": 2}
      ]
    }
  ]',
  '{"min_score": 0, "max_score": 100, "passing_score": 70}'
),
(
  'entrepreneur',
  'Perfil Empreendedor',
  'Avaliação do perfil e potencial empreendedor do candidato',
  '[
    {
      "id": "q1",
      "text": "Você já empreendeu antes?",
      "type": "multiple_choice",
      "options": [
        {"id": "a", "text": "Sim, tenho ou tive um negócio próprio", "score": 10},
        {"id": "b", "text": "Sim, participei de um negócio da família", "score": 8},
        {"id": "c", "text": "Não, mas sempre quis empreender", "score": 6},
        {"id": "d", "text": "Não, esta seria minha primeira experiência", "score": 4}
      ]
    },
    {
      "id": "q2",
      "text": "Como você reage a riscos financeiros?",
      "type": "multiple_choice",
      "options": [
        {"id": "a", "text": "Aceito riscos calculados com planejamento", "score": 10},
        {"id": "b", "text": "Prefiro riscos menores e mais seguros", "score": 7},
        {"id": "c", "text": "Evito riscos sempre que possível", "score": 4},
        {"id": "d", "text": "Riscos me deixam muito ansioso", "score": 2}
      ]
    },
    {
      "id": "q3",
      "text": "Quantas horas por semana você está disposto a dedicar ao negócio?",
      "type": "multiple_choice",
      "options": [
        {"id": "a", "text": "Mais de 50 horas - dedicação total", "score": 10},
        {"id": "b", "text": "40-50 horas - horário comercial completo", "score": 8},
        {"id": "c", "text": "30-40 horas - preciso de flexibilidade", "score": 5},
        {"id": "d", "text": "Menos de 30 horas - tenho outras atividades", "score": 2}
      ]
    }
  ]',
  '{"min_score": 0, "max_score": 100, "passing_score": 60}'
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- RLS Policies
-- =====================================================

ALTER TABLE franchisees ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchisee_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchisee_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchisee_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchisee_test_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchisee_alerts ENABLE ROW LEVEL SECURITY;

-- Franqueados: cliente vê os seus, admin vê todos
CREATE POLICY "franchisees_read" ON franchisees FOR SELECT TO authenticated 
  USING (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND user_type IN ('super_admin', 'admin', 'rh'))
  );

CREATE POLICY "franchisees_write" ON franchisees FOR ALL TO authenticated 
  USING (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND user_type IN ('super_admin', 'admin', 'rh'))
  );

-- Testes
CREATE POLICY "franchisee_tests_read" ON franchisee_tests FOR SELECT TO authenticated 
  USING (
    franchisee_id IN (SELECT id FROM franchisees WHERE client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()))
    OR EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND user_type IN ('super_admin', 'admin', 'rh'))
  );

CREATE POLICY "franchisee_tests_write" ON franchisee_tests FOR ALL TO authenticated 
  USING (
    franchisee_id IN (SELECT id FROM franchisees WHERE client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()))
    OR EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND user_type IN ('super_admin', 'admin', 'rh'))
  );

-- Performance
CREATE POLICY "franchisee_performance_read" ON franchisee_performance FOR SELECT TO authenticated 
  USING (
    franchisee_id IN (SELECT id FROM franchisees WHERE client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()))
    OR EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND user_type IN ('super_admin', 'admin', 'rh'))
  );

-- Candidatos
CREATE POLICY "franchisee_candidates_read" ON franchisee_candidates FOR SELECT TO authenticated 
  USING (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND user_type IN ('super_admin', 'admin', 'rh'))
  );

CREATE POLICY "franchisee_candidates_write" ON franchisee_candidates FOR ALL TO authenticated 
  USING (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND user_type IN ('super_admin', 'admin', 'rh'))
  );

-- Templates: leitura para todos, escrita para admin
CREATE POLICY "franchisee_test_templates_read" ON franchisee_test_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "franchisee_test_templates_write" ON franchisee_test_templates FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND user_type IN ('super_admin', 'admin')));

-- Alertas
CREATE POLICY "franchisee_alerts_read" ON franchisee_alerts FOR SELECT TO authenticated 
  USING (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND user_type IN ('super_admin', 'admin', 'rh'))
  );

-- =====================================================
-- FUNÇÕES UTILITÁRIAS
-- =====================================================

-- Função para calcular ranking de franquias
CREATE OR REPLACE FUNCTION calculate_franchisee_ranking(p_client_id UUID, p_period DATE)
RETURNS TABLE (
  franchisee_id UUID,
  ranking_position INTEGER,
  total_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH scores AS (
    SELECT 
      fp.franchisee_id,
      COALESCE(fp.nps_score, 0) * 0.3 +
      COALESCE(fp.engagement_rate, 0) * 10 * 0.2 +
      COALESCE(fp.leads_generated, 0) * 0.1 +
      COALESCE(fp.health_score, 0) * 0.4 AS total_score
    FROM franchisee_performance fp
    JOIN franchisees f ON f.id = fp.franchisee_id
    WHERE f.client_id = p_client_id 
      AND fp.period = p_period
      AND f.status = 'active'
  )
  SELECT 
    s.franchisee_id,
    ROW_NUMBER() OVER (ORDER BY s.total_score DESC)::INTEGER AS ranking_position,
    s.total_score::INTEGER
  FROM scores s;
END;
$$ LANGUAGE plpgsql;

-- Função para identificar franquias em risco
CREATE OR REPLACE FUNCTION get_at_risk_franchisees(p_client_id UUID)
RETURNS TABLE (
  franchisee_id UUID,
  unit_name TEXT,
  risk_level TEXT,
  risk_factors TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id AS franchisee_id,
    f.unit_name,
    CASE 
      WHEN f.churn_risk >= 70 THEN 'critical'
      WHEN f.churn_risk >= 50 THEN 'high'
      WHEN f.churn_risk >= 30 THEN 'medium'
      ELSE 'low'
    END AS risk_level,
    ARRAY_REMOVE(ARRAY[
      CASE WHEN f.current_nps < 50 THEN 'NPS baixo' END,
      CASE WHEN f.performance_score < 60 THEN 'Performance abaixo da média' END,
      CASE WHEN f.churn_risk >= 50 THEN 'Alto risco de churn' END,
      CASE WHEN f.health_status = 'critical' THEN 'Saúde crítica' END
    ], NULL) AS risk_factors
  FROM franchisees f
  WHERE f.client_id = p_client_id
    AND f.status = 'active'
    AND (f.churn_risk >= 30 OR f.health_status IN ('attention', 'critical'))
  ORDER BY f.churn_risk DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Comentários
-- =====================================================

COMMENT ON TABLE franchisees IS 'Franquias vinculadas a um cliente franqueador';
COMMENT ON TABLE franchisee_tests IS 'Testes comportamentais aplicados aos franqueados/candidatos';
COMMENT ON TABLE franchisee_performance IS 'Histórico de performance mensal das franquias';
COMMENT ON TABLE franchisee_candidates IS 'Pipeline de candidatos a franqueado';
COMMENT ON TABLE franchisee_test_templates IS 'Templates de testes disponíveis';
COMMENT ON TABLE franchisee_alerts IS 'Alertas e notificações sobre franquias';

