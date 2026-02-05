-- =====================================================
-- Valle 360 - Sistema de Metas Automáticas e Prospecção
-- Metas inteligentes por setor + Automação comercial
-- =====================================================

-- =====================================================
-- TABELAS DE METAS
-- =====================================================

-- Configuração de metas por setor/cargo
CREATE TABLE IF NOT EXISTS goal_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector VARCHAR(100) NOT NULL, -- social_media, designer, trafego, video_maker, comercial, rh
  role VARCHAR(100), -- cargo específico (opcional)
  
  -- Métricas base para o setor
  metrics JSONB NOT NULL DEFAULT '[]',
  -- Ex: [{"name": "posts_mes", "label": "Posts/Mês", "unit": "posts", "weight": 0.3}]
  
  -- Fórmula de cálculo
  calculation_method VARCHAR(50) DEFAULT 'average_plus_growth', -- average_plus_growth, fixed, benchmark
  growth_rate DECIMAL(5,2) DEFAULT 10.00, -- % de crescimento padrão
  min_growth_rate DECIMAL(5,2) DEFAULT 5.00,
  max_growth_rate DECIMAL(5,2) DEFAULT 30.00,
  
  -- Ajustes sazonais
  seasonal_adjustments JSONB DEFAULT '{}',
  -- Ex: {"11": 1.3, "12": 1.3} para Black Friday/Natal
  
  -- Configurações específicas
  always_increase BOOLEAN DEFAULT false, -- Para comercial: meta sempre cresce
  benchmark_source VARCHAR(100), -- Fonte de benchmark externo
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Metas individuais dos colaboradores
CREATE TABLE IF NOT EXISTS collaborator_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaborator_id UUID NOT NULL,
  collaborator_name VARCHAR(255),
  sector VARCHAR(100) NOT NULL,
  
  -- Período da meta
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period_type VARCHAR(20) DEFAULT 'monthly', -- weekly, monthly, quarterly
  
  -- Meta e progresso
  goals JSONB NOT NULL DEFAULT '{}',
  -- Ex: {"posts_mes": {"target": 30, "current": 25, "unit": "posts"}}
  
  overall_progress DECIMAL(5,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active', -- active, completed, failed, exceeded
  
  -- IA e automação
  ai_suggested BOOLEAN DEFAULT false,
  ai_confidence DECIMAL(5,2),
  ai_reasoning TEXT,
  adjusted_by UUID, -- Se foi ajustada manualmente
  adjustment_reason TEXT,
  
  -- Gamificação
  streak_days INTEGER DEFAULT 0,
  achievements JSONB DEFAULT '[]',
  points_earned INTEGER DEFAULT 0,
  
  -- Notificações enviadas
  notifications_sent JSONB DEFAULT '[]',
  last_reminder_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Histórico de produção (para cálculo de metas)
CREATE TABLE IF NOT EXISTS production_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaborator_id UUID NOT NULL,
  sector VARCHAR(100) NOT NULL,
  
  -- Período
  period_date DATE NOT NULL,
  period_type VARCHAR(20) DEFAULT 'daily',
  
  -- Métricas produzidas
  metrics JSONB NOT NULL DEFAULT '{}',
  -- Ex: {"posts": 5, "engajamento": 1200, "alcance": 5000}
  
  -- Contexto
  notes TEXT,
  tags JSONB DEFAULT '[]',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conquistas e badges
CREATE TABLE IF NOT EXISTS goal_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(20),
  points INTEGER DEFAULT 0,
  
  -- Critérios para desbloquear
  criteria JSONB NOT NULL,
  -- Ex: {"type": "streak", "value": 7} ou {"type": "goals_completed", "value": 3}
  
  sector VARCHAR(100), -- NULL = todas as áreas
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conquistas desbloqueadas pelos colaboradores
CREATE TABLE IF NOT EXISTS collaborator_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaborator_id UUID NOT NULL,
  achievement_id UUID REFERENCES goal_achievements(id),
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  notified BOOLEAN DEFAULT false
);

-- =====================================================
-- TABELAS DE PROSPECÇÃO AUTOMATIZADA
-- =====================================================

-- Leads captados automaticamente
CREATE TABLE IF NOT EXISTS prospecting_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Dados da empresa
  company_name VARCHAR(255) NOT NULL,
  company_website VARCHAR(500),
  company_industry VARCHAR(100),
  company_size VARCHAR(50), -- micro, small, medium, large
  company_location JSONB, -- {city, state, country}
  
  -- Contato
  contact_name VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  contact_linkedin VARCHAR(500),
  contact_role VARCHAR(100),
  
  -- Origem e qualificação
  source VARCHAR(50) NOT NULL, -- tavily, linkedin, google_maps, manual, referral
  source_details JSONB,
  segment VARCHAR(100), -- ecommerce, restaurante, clinica, franquia, etc
  
  -- Score de qualificação (IA)
  qualification_score INTEGER DEFAULT 0, -- 0-100
  qualification_factors JSONB DEFAULT '[]',
  -- Ex: [{"factor": "sem_trafego_pago", "impact": 20}, {"factor": "site_desatualizado", "impact": 15}]
  
  -- Status no funil
  status VARCHAR(50) DEFAULT 'new', -- new, contacted, responding, meeting_scheduled, negotiating, won, lost
  status_history JSONB DEFAULT '[]',
  
  -- Atribuição
  assigned_to UUID,
  assigned_at TIMESTAMPTZ,
  
  -- Valor estimado
  estimated_value DECIMAL(12,2),
  estimated_services JSONB DEFAULT '[]',
  
  -- Interações
  interactions_count INTEGER DEFAULT 0,
  last_interaction_at TIMESTAMPTZ,
  next_action VARCHAR(255),
  next_action_date TIMESTAMPTZ,
  
  -- Tags e notas
  tags JSONB DEFAULT '[]',
  notes TEXT,
  
  -- Conversão
  converted_at TIMESTAMPTZ,
  converted_to_client_id UUID,
  won_value DECIMAL(12,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campanhas de prospecção
CREATE TABLE IF NOT EXISTS prospecting_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Segmento alvo
  target_segment VARCHAR(100) NOT NULL,
  target_criteria JSONB NOT NULL,
  -- Ex: {"industry": "ecommerce", "size": ["small", "medium"], "location": {"state": "SP"}}
  
  -- Sequência de contatos
  sequence JSONB NOT NULL,
  -- Ex: [{"day": 0, "channel": "email", "template": "intro"}, {"day": 3, "channel": "email", "template": "followup1"}]
  
  -- Configurações
  max_leads_per_day INTEGER DEFAULT 10,
  auto_qualify BOOLEAN DEFAULT true,
  min_qualification_score INTEGER DEFAULT 50,
  auto_assign BOOLEAN DEFAULT true,
  assign_to_team JSONB DEFAULT '[]', -- IDs dos comerciais
  
  -- Status
  status VARCHAR(20) DEFAULT 'draft', -- draft, active, paused, completed
  
  -- Métricas
  leads_found INTEGER DEFAULT 0,
  leads_contacted INTEGER DEFAULT 0,
  leads_responded INTEGER DEFAULT 0,
  meetings_scheduled INTEGER DEFAULT 0,
  deals_won INTEGER DEFAULT 0,
  revenue_generated DECIMAL(12,2) DEFAULT 0,
  
  -- Período
  start_date DATE,
  end_date DATE,
  
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Templates de mensagens
CREATE TABLE IF NOT EXISTS prospecting_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  channel VARCHAR(50) NOT NULL, -- email, linkedin, whatsapp
  purpose VARCHAR(50) NOT NULL, -- intro, followup, meeting_request, proposal
  
  subject VARCHAR(500), -- Para emails
  content TEXT NOT NULL, -- Pode conter variáveis: {{company_name}}, {{contact_name}}, etc
  
  -- Variáveis suportadas
  variables JSONB DEFAULT '[]',
  
  -- Performance
  times_used INTEGER DEFAULT 0,
  response_rate DECIMAL(5,2),
  
  is_ai_generated BOOLEAN DEFAULT false,
  sector VARCHAR(100), -- NULL = todos
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Interações com leads
CREATE TABLE IF NOT EXISTS lead_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES prospecting_leads(id) ON DELETE CASCADE,
  
  -- Tipo de interação
  type VARCHAR(50) NOT NULL, -- email_sent, email_opened, email_replied, linkedin_sent, linkedin_accepted, call, meeting, whatsapp
  channel VARCHAR(50),
  
  -- Conteúdo
  subject VARCHAR(500),
  content TEXT,
  template_id UUID REFERENCES prospecting_templates(id),
  
  -- Resultado
  status VARCHAR(50) DEFAULT 'sent', -- sent, delivered, opened, clicked, replied, bounced, failed
  response_content TEXT,
  response_at TIMESTAMPTZ,
  
  -- Detecção de intenção (IA)
  detected_intent VARCHAR(50), -- interested, not_interested, meeting_request, question, unsubscribe
  intent_confidence DECIMAL(5,2),
  
  -- Ação gerada
  action_generated VARCHAR(100), -- create_card, schedule_meeting, send_proposal
  action_details JSONB,
  
  sent_by UUID, -- Colaborador ou 'system'
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reuniões agendadas
CREATE TABLE IF NOT EXISTS prospecting_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES prospecting_leads(id),
  
  -- Dados da reunião
  title VARCHAR(255) NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  meeting_link VARCHAR(500),
  location VARCHAR(255),
  
  -- Participantes
  attendees JSONB DEFAULT '[]',
  -- Ex: [{"email": "...", "name": "...", "role": "lead"}, {"email": "...", "name": "...", "role": "sales"}]
  
  -- Status
  status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, confirmed, completed, cancelled, no_show
  
  -- Resultado
  outcome VARCHAR(50), -- qualified, not_qualified, proposal_sent, deal_closed, follow_up_needed
  outcome_notes TEXT,
  next_steps TEXT,
  
  -- Criação automática
  auto_created BOOLEAN DEFAULT false,
  source_interaction_id UUID,
  kanban_card_id UUID,
  
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABELAS DE NOTIFICAÇÕES E ALERTAS
-- =====================================================

-- Alertas de metas
CREATE TABLE IF NOT EXISTS goal_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaborator_id UUID NOT NULL,
  goal_id UUID REFERENCES collaborator_goals(id),
  
  type VARCHAR(50) NOT NULL, -- behind_schedule, on_track, exceeding, streak_broken, achievement_unlocked
  severity VARCHAR(20) DEFAULT 'info', -- info, warning, critical, success
  
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Ação sugerida
  suggested_action VARCHAR(255),
  action_url VARCHAR(500),
  
  -- Status
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  dismissed BOOLEAN DEFAULT false,
  
  -- Para gerentes
  escalated_to UUID,
  escalated_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- DADOS INICIAIS
-- =====================================================

-- Configurações de metas por setor
INSERT INTO goal_configs (sector, metrics, calculation_method, growth_rate, always_increase, seasonal_adjustments) VALUES
('social_media', '[
  {"name": "posts", "label": "Posts Publicados", "unit": "posts", "weight": 0.3},
  {"name": "stories", "label": "Stories", "unit": "stories", "weight": 0.2},
  {"name": "engajamento", "label": "Taxa de Engajamento", "unit": "%", "weight": 0.3},
  {"name": "alcance", "label": "Alcance Total", "unit": "pessoas", "weight": 0.2}
]', 'average_plus_growth', 10.00, false, '{"11": 1.2, "12": 1.3}'),

('designer', '[
  {"name": "pecas", "label": "Peças Entregues", "unit": "peças", "weight": 0.4},
  {"name": "revisoes", "label": "Revisões (menos é melhor)", "unit": "revisões", "weight": 0.2, "inverse": true},
  {"name": "tempo_medio", "label": "Tempo Médio por Peça", "unit": "horas", "weight": 0.2, "inverse": true},
  {"name": "satisfacao", "label": "Satisfação do Cliente", "unit": "%", "weight": 0.2}
]', 'average_plus_growth', 8.00, false, '{"11": 1.3, "12": 1.4}'),

('trafego', '[
  {"name": "roas", "label": "ROAS Médio", "unit": "x", "weight": 0.35},
  {"name": "conversoes", "label": "Conversões Totais", "unit": "conversões", "weight": 0.25},
  {"name": "cpc", "label": "CPC Médio", "unit": "R$", "weight": 0.2, "inverse": true},
  {"name": "investimento_gerenciado", "label": "Investimento Gerenciado", "unit": "R$", "weight": 0.2}
]', 'benchmark', 12.00, false, '{"11": 1.4, "12": 1.5}'),

('video_maker', '[
  {"name": "videos", "label": "Vídeos Entregues", "unit": "vídeos", "weight": 0.4},
  {"name": "minutos_produzidos", "label": "Minutos Produzidos", "unit": "min", "weight": 0.3},
  {"name": "views_total", "label": "Views Totais", "unit": "views", "weight": 0.2},
  {"name": "satisfacao", "label": "Satisfação", "unit": "%", "weight": 0.1}
]', 'average_plus_growth', 10.00, false, '{"11": 1.2, "12": 1.2}'),

('comercial', '[
  {"name": "leads_qualificados", "label": "Leads Qualificados", "unit": "leads", "weight": 0.25},
  {"name": "reunioes", "label": "Reuniões Realizadas", "unit": "reuniões", "weight": 0.25},
  {"name": "propostas", "label": "Propostas Enviadas", "unit": "propostas", "weight": 0.2},
  {"name": "fechamentos", "label": "Fechamentos", "unit": "contratos", "weight": 0.3}
]', 'average_plus_growth', 15.00, true, '{"1": 1.2, "7": 1.1, "11": 1.3, "12": 1.2}'),

('rh', '[
  {"name": "contratacoes", "label": "Contratações", "unit": "pessoas", "weight": 0.4},
  {"name": "tempo_vaga", "label": "Tempo Médio de Vaga", "unit": "dias", "weight": 0.3, "inverse": true},
  {"name": "retention_rate", "label": "Taxa de Retenção", "unit": "%", "weight": 0.2},
  {"name": "satisfacao_onboarding", "label": "Satisfação Onboarding", "unit": "%", "weight": 0.1}
]', 'fixed', 5.00, false, '{}');

-- Conquistas
INSERT INTO goal_achievements (code, name, description, icon, color, points, criteria) VALUES
('streak_7', 'Semana Perfeita', 'Bateu a meta diária por 7 dias seguidos', 'flame', 'orange', 100, '{"type": "streak", "value": 7}'),
('streak_30', 'Mês Impecável', 'Bateu a meta diária por 30 dias seguidos', 'fire', 'red', 500, '{"type": "streak", "value": 30}'),
('goals_3', 'Triplo', 'Completou 3 metas mensais consecutivas', 'trophy', 'gold', 300, '{"type": "goals_completed_consecutive", "value": 3}'),
('exceed_20', 'Superação', 'Excedeu a meta em mais de 20%', 'rocket', 'purple', 200, '{"type": "exceed_percentage", "value": 20}'),
('exceed_50', 'Extraordinário', 'Excedeu a meta em mais de 50%', 'star', 'yellow', 500, '{"type": "exceed_percentage", "value": 50}'),
('first_goal', 'Primeira Meta', 'Completou sua primeira meta', 'flag', 'green', 50, '{"type": "first_goal"}'),
('top_performer', 'Top Performer', 'Ficou em 1º lugar no ranking do mês', 'crown', 'gold', 400, '{"type": "ranking", "position": 1}'),
('improvement', 'Evolução', 'Melhorou 25% em relação ao mês anterior', 'trending-up', 'blue', 150, '{"type": "improvement", "value": 25}'),
('team_player', 'Jogador de Equipe', 'Ajudou 3 colegas a baterem suas metas', 'users', 'indigo', 200, '{"type": "helped_colleagues", "value": 3}'),
('early_bird', 'Madrugador', 'Bateu a meta antes do dia 20', 'sunrise', 'amber', 100, '{"type": "early_completion", "day": 20}');

-- Templates de prospecção
INSERT INTO prospecting_templates (name, channel, purpose, subject, content, variables) VALUES
('Introdução Geral', 'email', 'intro', 
 'Potencialize os resultados da {{company_name}} com marketing digital',
 'Olá {{contact_name}},

Meu nome é {{sender_name}} e sou {{sender_role}} na Valle 360.

Notei que a {{company_name}} atua no segmento de {{segment}} e acredito que podemos ajudar vocês a:

✅ Aumentar a presença digital
✅ Gerar mais leads qualificados  
✅ Converter mais vendas

Temos cases de sucesso com empresas similares à sua, com resultados como:
- Aumento de 300% no alcance das redes sociais
- Redução de 40% no custo por lead
- ROI de 5x em campanhas de tráfego pago

Gostaria de agendar uma conversa de 15 minutos para entender melhor suas necessidades?

Abraços,
{{sender_name}}
{{sender_phone}}',
 '["company_name", "contact_name", "segment", "sender_name", "sender_role", "sender_phone"]'),

('Follow-up 1', 'email', 'followup',
 'Re: Potencialize os resultados da {{company_name}}',
 'Olá {{contact_name}},

Espero que esteja bem! 

Enviei uma mensagem há alguns dias sobre como a Valle 360 pode ajudar a {{company_name}} a crescer no digital.

Sei que a agenda é corrida, então vou direto ao ponto: temos um diagnóstico gratuito que identifica oportunidades de melhoria no marketing digital da sua empresa.

O diagnóstico inclui:
📊 Análise das redes sociais
🎯 Avaliação de SEO do site
💰 Estimativa de potencial com tráfego pago

Posso enviar o diagnóstico? Basta responder este email.

Abraços,
{{sender_name}}',
 '["company_name", "contact_name", "sender_name"]'),

('Pedido de Reunião', 'email', 'meeting_request',
 'Vamos conversar? 15 min que podem transformar seus resultados',
 'Olá {{contact_name}},

Última tentativa de contato! 😊

Gostaria muito de apresentar como podemos ajudar a {{company_name}} a:

🚀 Dobrar o engajamento nas redes sociais
📈 Reduzir custo de aquisição de clientes
💼 Automatizar processos de marketing

Tenho horários disponíveis:
- {{slot_1}}
- {{slot_2}}
- {{slot_3}}

Qual funciona melhor para você?

Se preferir, pode agendar direto aqui: {{booking_link}}

Aguardo seu retorno!
{{sender_name}}',
 '["company_name", "contact_name", "sender_name", "slot_1", "slot_2", "slot_3", "booking_link"]'),

('LinkedIn Connection', 'linkedin', 'intro',
 NULL,
 'Olá {{contact_name}}! Vi que você é {{contact_role}} na {{company_name}}. Trabalho com marketing digital para empresas do segmento de {{segment}} e adoraria conectar para trocar experiências. Aceita?',
 '["contact_name", "contact_role", "company_name", "segment"]'),

('WhatsApp Intro', 'whatsapp', 'intro',
 NULL,
 'Olá {{contact_name}}! 👋

Sou {{sender_name}} da Valle 360, agência de marketing digital.

Vi que a {{company_name}} está crescendo e gostaria de oferecer um diagnóstico gratuito do marketing digital de vocês.

Posso enviar? Leva só 2 minutos para você ver os insights! 📊',
 '["contact_name", "sender_name", "company_name"]');

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_collaborator_goals_collaborator ON collaborator_goals(collaborator_id);
CREATE INDEX IF NOT EXISTS idx_collaborator_goals_period ON collaborator_goals(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_collaborator_goals_status ON collaborator_goals(status);
CREATE INDEX IF NOT EXISTS idx_production_history_collaborator ON production_history(collaborator_id);
CREATE INDEX IF NOT EXISTS idx_production_history_date ON production_history(period_date);
CREATE INDEX IF NOT EXISTS idx_prospecting_leads_status ON prospecting_leads(status);
CREATE INDEX IF NOT EXISTS idx_prospecting_leads_assigned ON prospecting_leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_prospecting_leads_segment ON prospecting_leads(segment);
CREATE INDEX IF NOT EXISTS idx_prospecting_leads_score ON prospecting_leads(qualification_score DESC);
CREATE INDEX IF NOT EXISTS idx_lead_interactions_lead ON lead_interactions(lead_id);
CREATE INDEX IF NOT EXISTS idx_goal_alerts_collaborator ON goal_alerts(collaborator_id);
CREATE INDEX IF NOT EXISTS idx_goal_alerts_read ON goal_alerts(read);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE goal_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborator_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborator_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospecting_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospecting_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospecting_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospecting_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_alerts ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (ajustar conforme necessidade)
CREATE POLICY "Allow all for authenticated" ON goal_configs FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated" ON collaborator_goals FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated" ON production_history FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated" ON goal_achievements FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated" ON collaborator_achievements FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated" ON prospecting_leads FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated" ON prospecting_campaigns FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated" ON prospecting_templates FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated" ON lead_interactions FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated" ON prospecting_meetings FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated" ON goal_alerts FOR ALL TO authenticated USING (true);

