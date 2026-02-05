-- =====================================================
-- VALLE 360 - SISTEMA C-SUITE VIRTUAL
-- CFO, CTO, CMO, CHRO com IA
-- =====================================================

-- =====================================================
-- TABELAS DE SOLICITAÇÕES DE COLABORADORES
-- =====================================================

-- Solicitações (férias, home office, folgas, etc.)
CREATE TABLE IF NOT EXISTS employee_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('vacation', 'home_office', 'day_off', 'sick_leave', 'maternity', 'paternity', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_count INTEGER GENERATED ALWAYS AS (end_date - start_date + 1) STORED,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  impacts_goals BOOLEAN DEFAULT true,
  ai_recommendation TEXT,
  ai_risk_score DECIMAL(5, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Histórico de ausências
CREATE TABLE IF NOT EXISTS absence_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  request_id UUID REFERENCES public.employee_requests(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  date DATE NOT NULL,
  hours_absent DECIMAL(4, 2) DEFAULT 8,
  was_planned BOOLEAN DEFAULT true,
  impact_on_goals DECIMAL(5, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Previsões de ausências/turnover
CREATE TABLE IF NOT EXISTS absence_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prediction_type TEXT NOT NULL CHECK (prediction_type IN ('absence', 'turnover', 'burnout', 'productivity_drop')),
  probability DECIMAL(5, 2) NOT NULL,
  predicted_date DATE,
  confidence_level DECIMAL(5, 2),
  factors JSONB,
  recommendation TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELAS DO CFO IA
-- =====================================================

-- Precificação de serviços
CREATE TABLE IF NOT EXISTS service_pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  service_category TEXT NOT NULL,
  base_cost DECIMAL(12, 2) NOT NULL,
  hours_estimate DECIMAL(6, 2),
  suggested_price DECIMAL(12, 2),
  current_price DECIMAL(12, 2),
  margin_percentage DECIMAL(5, 2),
  market_benchmark DECIMAL(12, 2),
  last_ai_analysis TIMESTAMP WITH TIME ZONE,
  ai_recommendation TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Custos por colaborador
CREATE TABLE IF NOT EXISTS employee_costs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  salary DECIMAL(12, 2) NOT NULL,
  benefits DECIMAL(12, 2) DEFAULT 0,
  taxes DECIMAL(12, 2) DEFAULT 0,
  equipment DECIMAL(12, 2) DEFAULT 0,
  tools_subscriptions DECIMAL(12, 2) DEFAULT 0,
  total_monthly_cost DECIMAL(12, 2) GENERATED ALWAYS AS (salary + benefits + taxes + equipment + tools_subscriptions) STORED,
  hourly_cost DECIMAL(8, 2),
  billable_hours_month INTEGER DEFAULT 160,
  effective_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rentabilidade por cliente
CREATE TABLE IF NOT EXISTS client_profitability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  period_month DATE NOT NULL,
  revenue DECIMAL(12, 2) NOT NULL,
  direct_costs DECIMAL(12, 2) DEFAULT 0,
  hours_spent DECIMAL(8, 2) DEFAULT 0,
  gross_margin DECIMAL(12, 2),
  margin_percentage DECIMAL(5, 2),
  profitability_score DECIMAL(5, 2),
  ai_insights JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_client_period UNIQUE (client_id, period_month)
);

-- Previsões financeiras
CREATE TABLE IF NOT EXISTS financial_forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  forecast_type TEXT NOT NULL CHECK (forecast_type IN ('revenue', 'expense', 'profit', 'cash_flow')),
  period_month DATE NOT NULL,
  scenario TEXT NOT NULL CHECK (scenario IN ('optimistic', 'expected', 'conservative')),
  predicted_value DECIMAL(14, 2) NOT NULL,
  confidence_level DECIMAL(5, 2),
  factors JSONB,
  actual_value DECIMAL(14, 2),
  variance_percentage DECIMAL(5, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alertas do CFO
CREATE TABLE IF NOT EXISTS cfo_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  recommended_action TEXT,
  potential_impact DECIMAL(12, 2),
  is_read BOOLEAN DEFAULT false,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELAS DO CTO IA
-- =====================================================

-- Capacidade produtiva por setor
CREATE TABLE IF NOT EXISTS capacity_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  department TEXT NOT NULL,
  period_week DATE NOT NULL,
  total_available_hours DECIMAL(8, 2) NOT NULL,
  total_allocated_hours DECIMAL(8, 2) NOT NULL,
  total_delivered_hours DECIMAL(8, 2) DEFAULT 0,
  utilization_rate DECIMAL(5, 2) GENERATED ALWAYS AS (
    CASE WHEN total_available_hours > 0 
    THEN (total_allocated_hours / total_available_hours) * 100 
    ELSE 0 END
  ) STORED,
  efficiency_rate DECIMAL(5, 2),
  bottleneck_score DECIMAL(5, 2),
  ai_forecast_next_week DECIMAL(5, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_dept_week UNIQUE (org_id, department, period_week)
);

-- Previsões de capacidade
CREATE TABLE IF NOT EXISTS capacity_forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  department TEXT NOT NULL,
  forecast_date DATE NOT NULL,
  predicted_utilization DECIMAL(5, 2) NOT NULL,
  will_exceed_capacity BOOLEAN DEFAULT false,
  days_until_overload INTEGER,
  recommended_action TEXT,
  hiring_recommendation JSONB,
  tool_recommendation JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ferramentas e automações sugeridas
CREATE TABLE IF NOT EXISTS tool_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  department TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  tool_category TEXT NOT NULL,
  monthly_cost DECIMAL(10, 2),
  estimated_time_savings_hours DECIMAL(6, 2),
  estimated_roi_percentage DECIMAL(6, 2),
  payback_months INTEGER,
  implementation_effort TEXT CHECK (implementation_effort IN ('low', 'medium', 'high')),
  description TEXT,
  pros JSONB,
  cons JSONB,
  status TEXT DEFAULT 'suggested' CHECK (status IN ('suggested', 'evaluating', 'approved', 'implemented', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Decisões de contratação
CREATE TABLE IF NOT EXISTS hiring_decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  department TEXT NOT NULL,
  position_title TEXT NOT NULL,
  decision_type TEXT NOT NULL CHECK (decision_type IN ('hire', 'outsource', 'automate', 'redistribute')),
  urgency TEXT DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
  expected_cost DECIMAL(12, 2),
  expected_roi_months INTEGER,
  justification TEXT,
  ai_analysis JSONB,
  status TEXT DEFAULT 'proposed' CHECK (status IN ('proposed', 'approved', 'in_progress', 'completed', 'rejected')),
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELAS DO CMO IA
-- =====================================================

-- Análise de segmentos
CREATE TABLE IF NOT EXISTS segment_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  segment_name TEXT NOT NULL,
  client_count INTEGER DEFAULT 0,
  total_revenue DECIMAL(14, 2) DEFAULT 0,
  average_ticket DECIMAL(12, 2),
  average_ltv DECIMAL(12, 2),
  churn_rate DECIMAL(5, 2),
  acquisition_cost DECIMAL(12, 2),
  profitability_score DECIMAL(5, 2),
  growth_potential TEXT CHECK (growth_potential IN ('low', 'medium', 'high', 'very_high')),
  ai_recommendation TEXT,
  last_analysis TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Oportunidades de upsell
CREATE TABLE IF NOT EXISTS upsell_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  opportunity_type TEXT NOT NULL CHECK (opportunity_type IN ('upsell', 'cross_sell', 'upgrade')),
  service_suggested TEXT NOT NULL,
  estimated_value DECIMAL(12, 2),
  probability DECIMAL(5, 2),
  best_timing TEXT,
  approach_script TEXT,
  status TEXT DEFAULT 'identified' CHECK (status IN ('identified', 'contacted', 'negotiating', 'won', 'lost')),
  contacted_at TIMESTAMP WITH TIME ZONE,
  result_value DECIMAL(12, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Risco de churn
CREATE TABLE IF NOT EXISTS churn_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  risk_score DECIMAL(5, 2) NOT NULL,
  risk_level TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN risk_score >= 80 THEN 'critical'
      WHEN risk_score >= 60 THEN 'high'
      WHEN risk_score >= 40 THEN 'medium'
      ELSE 'low'
    END
  ) STORED,
  factors JSONB,
  recommended_actions JSONB,
  predicted_churn_date DATE,
  potential_revenue_loss DECIMAL(12, 2),
  retention_campaign_sent BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELAS DO CHRO IA
-- =====================================================

-- Análise de colaboradores (complementa existing)
CREATE TABLE IF NOT EXISTS employee_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  analysis_date DATE NOT NULL,
  performance_score DECIMAL(5, 2),
  engagement_score DECIMAL(5, 2),
  satisfaction_score DECIMAL(5, 2),
  cultural_fit_score DECIMAL(5, 2),
  growth_potential TEXT CHECK (growth_potential IN ('low', 'medium', 'high', 'exceptional')),
  turnover_risk DECIMAL(5, 2),
  burnout_risk DECIMAL(5, 2),
  promotion_readiness DECIMAL(5, 2),
  salary_competitiveness DECIMAL(5, 2),
  ai_insights JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Planos de carreira sugeridos
CREATE TABLE IF NOT EXISTS career_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  current_position TEXT NOT NULL,
  target_position TEXT NOT NULL,
  timeline_months INTEGER,
  required_skills JSONB,
  current_progress DECIMAL(5, 2) DEFAULT 0,
  milestones JSONB,
  recommended_trainings JSONB,
  mentor_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recomendações de salário
CREATE TABLE IF NOT EXISTS salary_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  current_salary DECIMAL(12, 2) NOT NULL,
  market_average DECIMAL(12, 2),
  recommended_salary DECIMAL(12, 2),
  adjustment_percentage DECIMAL(5, 2),
  justification TEXT,
  market_data_source TEXT,
  performance_factor DECIMAL(5, 2),
  tenure_factor DECIMAL(5, 2),
  status TEXT DEFAULT 'proposed' CHECK (status IN ('proposed', 'approved', 'implemented', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELAS DO C-SUITE CHAT
-- =====================================================

-- Conversas com C-Suite
CREATE TABLE IF NOT EXISTS csuite_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  executive_type TEXT NOT NULL CHECK (executive_type IN ('cfo', 'cto', 'cmo', 'chro', 'all')),
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mensagens do chat
CREATE TABLE IF NOT EXISTS csuite_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES public.csuite_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  executive_type TEXT CHECK (executive_type IN ('cfo', 'cto', 'cmo', 'chro')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insights consolidados do C-Suite
CREATE TABLE IF NOT EXISTS csuite_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  executive_type TEXT NOT NULL CHECK (executive_type IN ('cfo', 'cto', 'cmo', 'chro')),
  insight_type TEXT NOT NULL,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical', 'opportunity')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  data JSONB,
  recommended_action TEXT,
  action_taken BOOLEAN DEFAULT false,
  action_result TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_employee_requests_user ON employee_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_employee_requests_status ON employee_requests(status);
CREATE INDEX IF NOT EXISTS idx_employee_requests_dates ON employee_requests(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_absence_history_user ON absence_history(user_id);
CREATE INDEX IF NOT EXISTS idx_absence_history_date ON absence_history(date);

CREATE INDEX IF NOT EXISTS idx_service_pricing_org ON service_pricing(org_id);
CREATE INDEX IF NOT EXISTS idx_client_profitability_client ON client_profitability(client_id);
CREATE INDEX IF NOT EXISTS idx_client_profitability_period ON client_profitability(period_month);

CREATE INDEX IF NOT EXISTS idx_capacity_metrics_org ON capacity_metrics(org_id);
CREATE INDEX IF NOT EXISTS idx_capacity_metrics_dept ON capacity_metrics(department);

CREATE INDEX IF NOT EXISTS idx_upsell_opportunities_client ON upsell_opportunities(client_id);
CREATE INDEX IF NOT EXISTS idx_churn_predictions_client ON churn_predictions(client_id);
CREATE INDEX IF NOT EXISTS idx_churn_predictions_risk ON churn_predictions(risk_score DESC);

CREATE INDEX IF NOT EXISTS idx_employee_analytics_user ON employee_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_csuite_conversations_user ON csuite_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_csuite_messages_conv ON csuite_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_csuite_insights_org ON csuite_insights(org_id);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE employee_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE absence_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE absence_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_profitability ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cfo_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE capacity_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE capacity_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE hiring_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE segment_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE upsell_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE churn_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE csuite_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE csuite_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE csuite_insights ENABLE ROW LEVEL SECURITY;

-- Políticas para super_admin (acesso total)
CREATE POLICY "Super admin full access employee_requests" ON employee_requests TO public 
  USING (true) WITH CHECK (true);

CREATE POLICY "Super admin full access absence_history" ON absence_history TO public 
  USING (true) WITH CHECK (true);

CREATE POLICY "Super admin full access service_pricing" ON service_pricing TO public 
  USING (true) WITH CHECK (true);

CREATE POLICY "Super admin full access client_profitability" ON client_profitability TO public 
  USING (true) WITH CHECK (true);

CREATE POLICY "Super admin full access financial_forecasts" ON financial_forecasts TO public 
  USING (true) WITH CHECK (true);

CREATE POLICY "Super admin full access cfo_alerts" ON cfo_alerts TO public 
  USING (true) WITH CHECK (true);

CREATE POLICY "Super admin full access capacity_metrics" ON capacity_metrics TO public 
  USING (true) WITH CHECK (true);

CREATE POLICY "Super admin full access capacity_forecasts" ON capacity_forecasts TO public 
  USING (true) WITH CHECK (true);

CREATE POLICY "Super admin full access tool_recommendations" ON tool_recommendations TO public 
  USING (true) WITH CHECK (true);

CREATE POLICY "Super admin full access hiring_decisions" ON hiring_decisions TO public 
  USING (true) WITH CHECK (true);

CREATE POLICY "Super admin full access segment_analysis" ON segment_analysis TO public 
  USING (true) WITH CHECK (true);

CREATE POLICY "Super admin full access upsell_opportunities" ON upsell_opportunities TO public 
  USING (true) WITH CHECK (true);

CREATE POLICY "Super admin full access churn_predictions" ON churn_predictions TO public 
  USING (true) WITH CHECK (true);

CREATE POLICY "Super admin full access employee_analytics" ON employee_analytics TO public 
  USING (true) WITH CHECK (true);

CREATE POLICY "Super admin full access career_plans" ON career_plans TO public 
  USING (true) WITH CHECK (true);

CREATE POLICY "Super admin full access salary_recommendations" ON salary_recommendations TO public 
  USING (true) WITH CHECK (true);

CREATE POLICY "Super admin full access csuite_conversations" ON csuite_conversations TO public 
  USING (true) WITH CHECK (true);

CREATE POLICY "Super admin full access csuite_messages" ON csuite_messages TO public 
  USING (true) WITH CHECK (true);

CREATE POLICY "Super admin full access csuite_insights" ON csuite_insights TO public 
  USING (true) WITH CHECK (true);

CREATE POLICY "Super admin full access absence_predictions" ON absence_predictions TO public 
  USING (true) WITH CHECK (true);

-- =====================================================
-- DADOS INICIAIS
-- =====================================================

-- Ferramentas recomendadas iniciais
INSERT INTO tool_recommendations (org_id, department, tool_name, tool_category, monthly_cost, estimated_time_savings_hours, estimated_roi_percentage, payback_months, implementation_effort, description, pros, cons, status)
SELECT 
  (SELECT id FROM organizations LIMIT 1),
  dept,
  tool,
  category,
  cost,
  hours,
  roi,
  payback,
  effort,
  desc_text,
  pros,
  cons,
  'suggested'
FROM (VALUES
  ('designer', 'Midjourney', 'AI Image Generation', 30, 40, 300, 1, 'low', 'Geração de imagens com IA para referências e conceitos', '["Rápido para conceitos", "Qualidade alta", "Inspiração ilimitada"]'::jsonb, '["Custo por imagem", "Curva de aprendizado"]'::jsonb),
  ('designer', 'Figma AI', 'Design Automation', 15, 20, 200, 1, 'low', 'Recursos de IA integrados ao Figma', '["Integrado ao workflow", "Auto-layout", "Sugestões automáticas"]'::jsonb, '["Funcionalidades limitadas"]'::jsonb),
  ('social_media', 'ChatGPT Plus', 'Content Generation', 20, 60, 400, 1, 'low', 'Geração de textos e legendas', '["Rápido", "Versátil", "Qualidade alta"]'::jsonb, '["Precisa revisão", "Pode parecer genérico"]'::jsonb),
  ('social_media', 'Canva Pro', 'Design Templates', 13, 30, 350, 1, 'low', 'Templates e design rápido', '["Fácil de usar", "Muitos templates", "Brand kit"]'::jsonb, '["Limitado para design complexo"]'::jsonb),
  ('trafego', 'Supermetrics', 'Data Integration', 99, 25, 150, 4, 'medium', 'Integração de dados de múltiplas plataformas', '["Automação de relatórios", "Múltiplas integrações"]'::jsonb, '["Custo alto", "Setup complexo"]'::jsonb),
  ('video_maker', 'RunwayML', 'AI Video Editing', 35, 50, 250, 2, 'medium', 'Edição de vídeo com IA', '["Remove background", "Gera cenas", "Estende clipes"]'::jsonb, '["Qualidade variável", "Limitações de tempo"]'::jsonb),
  ('comercial', 'Apollo.io', 'Sales Intelligence', 99, 40, 300, 3, 'medium', 'Prospecção e enriquecimento de leads', '["Database grande", "Automação de emails", "LinkedIn integration"]'::jsonb, '["Custo alto", "Dados nem sempre atualizados"]'::jsonb),
  ('rh', 'Gupy', 'ATS & Recruitment', 200, 60, 200, 4, 'high', 'Sistema de recrutamento com IA', '["Triagem automática", "Employer branding", "Analytics"]'::jsonb, '["Custo alto", "Implementação demorada"]'::jsonb)
) AS t(dept, tool, category, cost, hours, roi, payback, effort, desc_text, pros, cons)
WHERE EXISTS (SELECT 1 FROM organizations LIMIT 1);

