-- =====================================================
-- MIGRATION: AI Executive System (C‑Suite Virtual consultivo)
-- Descrição: Tabelas canônicas `ai_executive_*` para executivos virtuais + chats + insights + decisões + reuniões + memória + web search + drafts de ações.
-- Observação: modo consultivo (sem execução com terceiros automática). A execução só acontece via confirmação humana no app.
-- =====================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Função padrão para updated_at (usada em vários lugares do projeto)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 1) Executivos
-- =====================================================
CREATE TABLE IF NOT EXISTS public.ai_executives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL UNIQUE, -- canonical: lowercase (ceo/cfo/cmo/cto/coo/cco/chro)
  name text NOT NULL,
  title text NOT NULL,
  avatar_url text,
  personality jsonb DEFAULT '{}'::jsonb,
  expertise_areas jsonb DEFAULT '[]'::jsonb,
  data_access jsonb DEFAULT '{}'::jsonb,
  system_prompt text NOT NULL,
  decision_authority jsonb DEFAULT '{}'::jsonb,
  reports_to text,
  collaboration_preferences jsonb DEFAULT '{}'::jsonb,
  communication_style text,
  risk_tolerance text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_executives_role ON public.ai_executives(role);

DROP TRIGGER IF EXISTS trg_ai_executives_updated_at ON public.ai_executives;
CREATE TRIGGER trg_ai_executives_updated_at
  BEFORE UPDATE ON public.ai_executives
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 2) Conversas (usuário <-> executivo) + mensagens
-- =====================================================
CREATE TABLE IF NOT EXISTS public.ai_executive_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  executive_id uuid REFERENCES public.ai_executives(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text,
  context jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  resolution_summary text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_exec_conversations_exec ON public.ai_executive_conversations(executive_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_exec_conversations_user ON public.ai_executive_conversations(user_id, updated_at DESC);

DROP TRIGGER IF EXISTS trg_ai_exec_conversations_updated_at ON public.ai_executive_conversations;
CREATE TRIGGER trg_ai_exec_conversations_updated_at
  BEFORE UPDATE ON public.ai_executive_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.ai_executive_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.ai_executive_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('system', 'user', 'assistant')),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  data_sources_used jsonb DEFAULT '[]'::jsonb,
  web_searches jsonb DEFAULT '[]'::jsonb,
  tokens_used integer,
  processing_time_ms integer,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_exec_messages_conversation ON public.ai_executive_messages(conversation_id, created_at);

-- =====================================================
-- 3) Reuniões entre executivos + mensagens
-- =====================================================
CREATE TABLE IF NOT EXISTS public.ai_executive_meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  meeting_type text NOT NULL,
  initiated_by uuid REFERENCES public.ai_executives(id),
  trigger_reason text,
  trigger_data jsonb DEFAULT '{}'::jsonb,
  participants uuid[] DEFAULT '{}'::uuid[],
  agenda jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'running', 'completed', 'cancelled')),
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  scheduled_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  outcome_summary text,
  decisions_made jsonb DEFAULT '[]'::jsonb,
  action_items jsonb DEFAULT '[]'::jsonb,
  next_meeting_suggested boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_exec_meetings_status ON public.ai_executive_meetings(status, scheduled_at DESC);

CREATE TABLE IF NOT EXISTS public.ai_executive_meeting_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid REFERENCES public.ai_executive_meetings(id) ON DELETE CASCADE,
  executive_id uuid REFERENCES public.ai_executives(id) ON DELETE SET NULL,
  message_type text DEFAULT 'statement',
  content text NOT NULL,
  references_message_id uuid REFERENCES public.ai_executive_meeting_messages(id) ON DELETE SET NULL,
  data_presented jsonb DEFAULT '{}'::jsonb,
  sentiment text,
  confidence_level numeric(3,2),
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_exec_meeting_messages_meeting ON public.ai_executive_meeting_messages(meeting_id, created_at);

-- =====================================================
-- 4) Insights, decisões, memória, web search, auditoria
-- =====================================================
CREATE TABLE IF NOT EXISTS public.ai_executive_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  executive_id uuid REFERENCES public.ai_executives(id) ON DELETE SET NULL,
  insight_type text NOT NULL,
  category text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  supporting_data jsonb DEFAULT '{}'::jsonb,
  data_sources jsonb DEFAULT '[]'::jsonb,
  confidence_score numeric(3,2),
  impact_level text,
  urgency text,
  recommended_actions jsonb DEFAULT '[]'::jsonb,
  related_insights uuid[] DEFAULT '{}'::uuid[],
  requires_discussion boolean DEFAULT false,
  discussed_in_meeting uuid REFERENCES public.ai_executive_meetings(id) ON DELETE SET NULL,
  status text DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'dismissed', 'acted')),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_exec_insights_exec ON public.ai_executive_insights(executive_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_exec_insights_status ON public.ai_executive_insights(status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.ai_executive_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_type text NOT NULL,
  category text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  proposed_by uuid REFERENCES public.ai_executives(id) ON DELETE SET NULL,
  approved_by uuid[] DEFAULT '{}'::uuid[],
  meeting_id uuid REFERENCES public.ai_executive_meetings(id) ON DELETE SET NULL,
  insight_ids uuid[] DEFAULT '{}'::uuid[],
  options_considered jsonb DEFAULT '[]'::jsonb,
  chosen_option text,
  rationale text,
  expected_impact jsonb DEFAULT '{}'::jsonb,
  success_metrics jsonb DEFAULT '{}'::jsonb,
  implementation_plan jsonb DEFAULT '{}'::jsonb,
  deadline date,
  status text DEFAULT 'proposed' CHECK (status IN ('proposed', 'approved', 'rejected', 'in_progress', 'completed')),
  outcome_actual jsonb DEFAULT '{}'::jsonb,
  lessons_learned text,
  human_approval_required boolean DEFAULT true,
  human_approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  human_approved_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_exec_decisions_status ON public.ai_executive_decisions(status, created_at DESC);

DROP TRIGGER IF EXISTS trg_ai_exec_decisions_updated_at ON public.ai_executive_decisions;
CREATE TRIGGER trg_ai_exec_decisions_updated_at
  BEFORE UPDATE ON public.ai_executive_decisions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.ai_executive_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  executive_id uuid REFERENCES public.ai_executives(id) ON DELETE CASCADE,
  knowledge_type text NOT NULL,
  category text,
  key text NOT NULL,
  value jsonb NOT NULL,
  confidence numeric(3,2) DEFAULT 1.0,
  source text,
  source_id uuid,
  valid_from timestamptz DEFAULT now() NOT NULL,
  valid_until timestamptz,
  times_referenced integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (executive_id, knowledge_type, key)
);

CREATE INDEX IF NOT EXISTS idx_ai_exec_knowledge_exec ON public.ai_executive_knowledge(executive_id, knowledge_type);

DROP TRIGGER IF EXISTS trg_ai_exec_knowledge_updated_at ON public.ai_executive_knowledge;
CREATE TRIGGER trg_ai_exec_knowledge_updated_at
  BEFORE UPDATE ON public.ai_executive_knowledge
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.ai_executive_web_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  executive_id uuid REFERENCES public.ai_executives(id) ON DELETE SET NULL,
  query text NOT NULL,
  purpose text,
  provider text DEFAULT 'perplexity',
  model text,
  answer text,
  sources jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_exec_web_searches_exec ON public.ai_executive_web_searches(executive_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.ai_executive_data_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  executive_id uuid REFERENCES public.ai_executives(id) ON DELETE SET NULL,
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_exec_data_access_exec ON public.ai_executive_data_access_log(executive_id, created_at DESC);

-- =====================================================
-- 5) Alertas internos e triggers (config)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.ai_executive_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_executive_id uuid REFERENCES public.ai_executives(id) ON DELETE SET NULL,
  to_executive_ids uuid[] DEFAULT '{}'::uuid[],
  alert_type text NOT NULL,
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  title text NOT NULL,
  content text NOT NULL,
  related_data jsonb DEFAULT '{}'::jsonb,
  requires_response boolean DEFAULT false,
  response_deadline timestamptz,
  status text DEFAULT 'new' CHECK (status IN ('new', 'read', 'resolved')),
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_exec_alerts_created ON public.ai_executive_alerts(created_at DESC);

CREATE TABLE IF NOT EXISTS public.ai_executive_triggers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  trigger_type text NOT NULL, -- event | threshold | schedule
  trigger_condition jsonb NOT NULL,
  action_type text NOT NULL, -- generate_insight | call_meeting | ...
  action_config jsonb NOT NULL,
  responsible_executive_id uuid REFERENCES public.ai_executives(id) ON DELETE SET NULL,
  enabled boolean DEFAULT true,
  last_triggered_at timestamptz,
  trigger_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_exec_triggers_enabled ON public.ai_executive_triggers(enabled);

-- =====================================================
-- 6) Drafts de ações (consultivo)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.ai_executive_action_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  executive_id uuid REFERENCES public.ai_executives(id) ON DELETE SET NULL,
  created_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  source_insight_id uuid REFERENCES public.ai_executive_insights(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  action_payload jsonb NOT NULL,
  preview jsonb DEFAULT '{}'::jsonb,
  risk_level text DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high')),
  requires_external boolean DEFAULT false,
  is_executable boolean DEFAULT false,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'executed', 'cancelled', 'failed')),
  executed_at timestamptz,
  execution_result jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_exec_action_drafts_exec ON public.ai_executive_action_drafts(executive_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_exec_action_drafts_status ON public.ai_executive_action_drafts(status, created_at DESC);

DROP TRIGGER IF EXISTS trg_ai_exec_action_drafts_updated_at ON public.ai_executive_action_drafts;
CREATE TRIGGER trg_ai_exec_action_drafts_updated_at
  BEFORE UPDATE ON public.ai_executive_action_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- RLS (admin-only)
-- =====================================================
ALTER TABLE public.ai_executives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_executive_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_executive_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_executive_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_executive_meeting_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_executive_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_executive_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_executive_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_executive_web_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_executive_data_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_executive_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_executive_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_executive_action_drafts ENABLE ROW LEVEL SECURITY;

-- Políticas: admins gerenciam tudo (service role bypass RLS)
DO $$
BEGIN
  -- ai_executives
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='ai_executives' AND policyname='Admins manage ai_executives') THEN
    EXECUTE $p$ CREATE POLICY "Admins manage ai_executives" ON public.ai_executives FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin()) $p$;
  END IF;

  -- conversations
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='ai_executive_conversations' AND policyname='Admins manage ai_executive_conversations') THEN
    EXECUTE $p$ CREATE POLICY "Admins manage ai_executive_conversations" ON public.ai_executive_conversations FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin()) $p$;
  END IF;

  -- messages
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='ai_executive_messages' AND policyname='Admins manage ai_executive_messages') THEN
    EXECUTE $p$ CREATE POLICY "Admins manage ai_executive_messages" ON public.ai_executive_messages FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin()) $p$;
  END IF;

  -- meetings
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='ai_executive_meetings' AND policyname='Admins manage ai_executive_meetings') THEN
    EXECUTE $p$ CREATE POLICY "Admins manage ai_executive_meetings" ON public.ai_executive_meetings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin()) $p$;
  END IF;

  -- meeting messages
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='ai_executive_meeting_messages' AND policyname='Admins manage ai_executive_meeting_messages') THEN
    EXECUTE $p$ CREATE POLICY "Admins manage ai_executive_meeting_messages" ON public.ai_executive_meeting_messages FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin()) $p$;
  END IF;

  -- insights
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='ai_executive_insights' AND policyname='Admins manage ai_executive_insights') THEN
    EXECUTE $p$ CREATE POLICY "Admins manage ai_executive_insights" ON public.ai_executive_insights FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin()) $p$;
  END IF;

  -- decisions
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='ai_executive_decisions' AND policyname='Admins manage ai_executive_decisions') THEN
    EXECUTE $p$ CREATE POLICY "Admins manage ai_executive_decisions" ON public.ai_executive_decisions FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin()) $p$;
  END IF;

  -- knowledge
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='ai_executive_knowledge' AND policyname='Admins manage ai_executive_knowledge') THEN
    EXECUTE $p$ CREATE POLICY "Admins manage ai_executive_knowledge" ON public.ai_executive_knowledge FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin()) $p$;
  END IF;

  -- web searches
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='ai_executive_web_searches' AND policyname='Admins manage ai_executive_web_searches') THEN
    EXECUTE $p$ CREATE POLICY "Admins manage ai_executive_web_searches" ON public.ai_executive_web_searches FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin()) $p$;
  END IF;

  -- data access log
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='ai_executive_data_access_log' AND policyname='Admins manage ai_executive_data_access_log') THEN
    EXECUTE $p$ CREATE POLICY "Admins manage ai_executive_data_access_log" ON public.ai_executive_data_access_log FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin()) $p$;
  END IF;

  -- alerts
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='ai_executive_alerts' AND policyname='Admins manage ai_executive_alerts') THEN
    EXECUTE $p$ CREATE POLICY "Admins manage ai_executive_alerts" ON public.ai_executive_alerts FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin()) $p$;
  END IF;

  -- triggers
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='ai_executive_triggers' AND policyname='Admins manage ai_executive_triggers') THEN
    EXECUTE $p$ CREATE POLICY "Admins manage ai_executive_triggers" ON public.ai_executive_triggers FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin()) $p$;
  END IF;

  -- action drafts
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='ai_executive_action_drafts' AND policyname='Admins manage ai_executive_action_drafts') THEN
    EXECUTE $p$ CREATE POLICY "Admins manage ai_executive_action_drafts" ON public.ai_executive_action_drafts FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin()) $p$;
  END IF;
END $$;

-- =====================================================
-- Seeds (idempotentes)
-- =====================================================
INSERT INTO public.ai_executives (role, name, title, system_prompt, communication_style, risk_tolerance, reports_to)
SELECT x.role, x.name, x.title, x.system_prompt, x.communication_style, x.risk_tolerance, x.reports_to
FROM (
  VALUES
    ('ceo','Helena','Chief Executive Officer',
     'Você é Helena, CEO virtual (consultiva). Seu trabalho é sintetizar inputs dos demais C-Levels e orientar decisões estratégicas.\n\nREGRAS IMPORTANTES:\n- Não execute ações com terceiros automaticamente. Você apenas propõe CTAs/rascunhos.\n- Não invente números. Se faltar dado, diga o que falta e proponha como coletar.\n- Sempre entregue: (1) Diagnóstico, (2) Opções com trade-offs, (3) Recomendação, (4) Próximos passos + como medir.\n- Quando houver conflito entre áreas, media e explicita o motivo.\n',
     'inspirational','moderate',NULL),
    ('cfo','Eduardo','Chief Financial Officer',
     'Você é o CFO virtual da Valle 360, uma agência de marketing digital.\nSeu nome é Eduardo.\nSeu papel é analisar dados financeiros e fornecer insights estratégicos como um diretor financeiro experiente.\n\nSuas responsabilidades:\n1. Precificação inteligente de serviços\n2. Análise de rentabilidade por cliente\n3. Previsões financeiras\n4. Identificação de riscos e oportunidades\n5. Recomendações de ajustes de preço\n\nSempre forneça:\n- Números específicos e justificativas\n- Comparações com benchmarks de mercado\n- Ações concretas e priorizadas (como CTAs/rascunhos; sem execução automática com terceiros)\n- Análise de risco vs retorno\n\nSeja direto, analítico e focado em resultados financeiros.',
     'data-driven','conservative','ceo'),
    ('cmo','Marina','Chief Marketing Officer',
     'Você é Marina, CMO virtual (consultiva). Equilibra criatividade com dados. Propõe experimentos e otimizações de aquisição/retenção.\n\nREGRAS:\n- Não invente números.\n- Não execute ações com terceiros automaticamente (somente CTAs/rascunhos).\n- Sempre forneça hipóteses, testes A/B e métricas de sucesso.\n',
     'creative-analytical','moderate','ceo'),
    ('cto','André','Chief Technology Officer',
     'Você é André, CTO virtual (consultivo). Prioriza: segurança > estabilidade > velocidade. Propõe automações e melhorias de arquitetura.\n\nREGRAS:\n- Sem execução automática com terceiros.\n- Explique riscos, custo, payoff e plano incremental.\n',
     'technical-pragmatic','moderate','ceo'),
    ('coo','Fernanda','Chief Operating Officer',
     'Você é Fernanda, COO virtual (consultiva). Foca em execução impecável, prazos, qualidade e eficiência.\n\nREGRAS:\n- Não invente números.\n- Sem execução automática com terceiros.\n- Sempre indique responsáveis, prazos, capacidade e risco.\n',
     'execution-focused','moderate','ceo'),
    ('cco','Juliana','Chief Customer Officer',
     'Você é Juliana, CCO virtual (consultiva). Voz do cliente. Monitora churn/health score, identifica riscos e oportunidades de expansão.\n\nREGRAS:\n- Não invente números.\n- Sem execução automática com terceiros.\n- Sempre proponha ações de retenção e métricas (NPS, churn, LTV, health).\n',
     'customer-centric','moderate','ceo'),
    ('chro','Paulo','Chief Human Resources Officer',
     'Você é Paulo, CHRO virtual (consultivo). Pessoas são o ativo mais importante. Monitora sinais de burnout e turnover.\n\nREGRAS:\n- Não invente números.\n- Sem execução automática com terceiros.\n- Sempre proponha ações com impacto e riscos (cultura, capacidade, performance).\n',
     'people-first','moderate','ceo')
) AS x(role,name,title,system_prompt,communication_style,risk_tolerance,reports_to)
WHERE NOT EXISTS (SELECT 1 FROM public.ai_executives e WHERE e.role = x.role);

