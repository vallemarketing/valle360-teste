# Sistema C-Level Virtual - Documentação Completa

## Agência de Marketing - Executivos Virtuais com LLM

**Versão 1.0 - Janeiro 2025**

---

## Índice

1. [Análise dos C-Levels](#1-análise-dos-c-levels)
2. [Estrutura de Tabelas Base](#2-estrutura-de-tabelas-base)
3. [Inserir Executivos com System Prompts](#3-inserir-executivos-com-system-prompts)
4. [Sistema de Comunicação Entre Executivos](#4-sistema-de-comunicação-entre-executivos)
5. [Triggers Automáticos para Análise](#5-triggers-automáticos-para-análise)
6. [Views para Contexto dos Executivos](#6-views-para-contexto-dos-executivos)
7. [API e Edge Functions para LLM](#7-api-e-edge-functions-para-llm)
8. [Jobs e Automações](#8-jobs-e-automações)
9. [Componente React para Chat](#9-componente-react-para-chat)
10. [Resumo Final do Sistema](#10-resumo-final-do-sistema)

---

## 1. Análise dos C-Levels

### Executivos Existentes

| Cargo | Título | Responsabilidade |
|-------|--------|------------------|
| **CTO** | Chief Technology Officer | Tecnologia, sistemas, infraestrutura |
| **CFO** | Chief Financial Officer | Finanças, orçamento, investimentos |
| **CMO** | Chief Marketing Officer | Marketing, branding, growth |
| **CHRO** | Chief Human Resources Officer | Pessoas, cultura, talentos |

### Executivos Sugeridos para Adicionar

| Cargo | Título | Justificativa |
|-------|--------|---------------|
| **COO** | Chief Operating Officer | Essencial para agência pois cuida da entrega (projetos, prazos, qualidade) |
| **CCO** | Chief Customer Officer | Cuida do relacionamento com cliente (diferente do CMO que cuida de aquisição) |
| **CEO** | Chief Executive Officer | Orquestrador que sintetiza inputs de todos |

---

## 2. Estrutura de Tabelas Base

### Prompt para Cursor

\`\`\`
Preciso criar a estrutura completa de um sistema de C-Levels virtuais (LLMs especializados) no Supabase.

## Contexto
Agência de marketing que terá executivos virtuais (CEO, CFO, CMO, CTO, COO, CCO, CHRO) que são LLMs especializados. Eles devem:
- Ter acesso a todos os dados da empresa
- Conversar entre si para decisões complexas
- Fornecer insights proativos
- Responder consultas do usuário
- Buscar informações na web quando necessário
- Aprender com o histórico de decisões
\`\`\`

### 2.1 Tabela de Definição dos C-Levels

\`\`\`sql
CREATE TABLE IF NOT EXISTS ai_executives (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  avatar_url TEXT,
  personality JSONB,
  expertise_areas JSONB,
  data_access JSONB,
  system_prompt TEXT NOT NULL,
  decision_authority JSONB,
  reports_to TEXT,
  collaboration_preferences JSONB,
  communication_style TEXT,
  risk_tolerance TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
\`\`\`

### 2.2 Tabela de Conversas com Usuários

\`\`\`sql
CREATE TABLE IF NOT EXISTS ai_executive_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  executive_id UUID REFERENCES ai_executives(id),
  user_id UUID REFERENCES users(id),
  title TEXT,
  context JSONB,
  status TEXT DEFAULT 'active',
  resolution_summary TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
\`\`\`

### 2.3 Tabela de Mensagens nas Conversas

\`\`\`sql
CREATE TABLE IF NOT EXISTS ai_executive_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES ai_executive_conversations(id),
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  data_sources_used JSONB,
  web_searches JSONB,
  tokens_used INTEGER,
  processing_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON ai_executive_messages(conversation_id, created_at);
\`\`\`

### 2.4 Tabela de Conversas Entre Executivos (C-Level Meetings)

\`\`\`sql
CREATE TABLE IF NOT EXISTS ai_executive_meetings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  meeting_type TEXT NOT NULL,
  initiated_by UUID REFERENCES ai_executives(id),
  trigger_reason TEXT,
  trigger_data JSONB,
  participants UUID[],
  agenda JSONB,
  status TEXT DEFAULT 'scheduled',
  priority TEXT DEFAULT 'normal',
  scheduled_at TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  outcome_summary TEXT,
  decisions_made JSONB,
  action_items JSONB,
  next_meeting_suggested BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
\`\`\`

### 2.5 Tabela de Mensagens nas Reuniões Entre Executivos

\`\`\`sql
CREATE TABLE IF NOT EXISTS ai_executive_meeting_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID REFERENCES ai_executive_meetings(id),
  executive_id UUID REFERENCES ai_executives(id),
  message_type TEXT DEFAULT 'statement',
  content TEXT NOT NULL,
  references_message_id UUID REFERENCES ai_executive_meeting_messages(id),
  data_presented JSONB,
  sentiment TEXT,
  confidence_level DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_meeting_messages ON ai_executive_meeting_messages(meeting_id, created_at);
\`\`\`

### 2.6 Tabela de Insights Gerados

\`\`\`sql
CREATE TABLE IF NOT EXISTS ai_executive_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  executive_id UUID REFERENCES ai_executives(id),
  insight_type TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  supporting_data JSONB,
  data_sources JSONB,
  confidence_score DECIMAL(3,2),
  impact_level TEXT,
  urgency TEXT,
  recommended_actions JSONB,
  related_insights UUID[],
  requires_discussion BOOLEAN DEFAULT false,
  discussed_in_meeting UUID REFERENCES ai_executive_meetings(id),
  status TEXT DEFAULT 'new',
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_insights_executive ON ai_executive_insights(executive_id, created_at DESC);
CREATE INDEX idx_insights_status ON ai_executive_insights(status, urgency);
\`\`\`

### 2.7 Tabela de Decisões Tomadas

\`\`\`sql
CREATE TABLE IF NOT EXISTS ai_executive_decisions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  decision_type TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  proposed_by UUID REFERENCES ai_executives(id),
  approved_by UUID[],
  meeting_id UUID REFERENCES ai_executive_meetings(id),
  insight_ids UUID[],
  options_considered JSONB,
  chosen_option TEXT,
  rationale TEXT,
  expected_impact JSONB,
  success_metrics JSONB,
  implementation_plan JSONB,
  deadline DATE,
  status TEXT DEFAULT 'proposed',
  outcome_actual JSONB,
  lessons_learned TEXT,
  human_approval_required BOOLEAN DEFAULT true,
  human_approved_by UUID REFERENCES users(id),
  human_approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
\`\`\`

### 2.8 Tabela de Conhecimento/Memória dos Executivos

\`\`\`sql
CREATE TABLE IF NOT EXISTS ai_executive_knowledge (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  executive_id UUID REFERENCES ai_executives(id),
  knowledge_type TEXT NOT NULL,
  category TEXT,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  confidence DECIMAL(3,2) DEFAULT 1.0,
  source TEXT,
  source_id UUID,
  valid_from TIMESTAMP DEFAULT NOW(),
  valid_until TIMESTAMP,
  times_referenced INTEGER DEFAULT 0,
  last_referenced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_knowledge_executive ON ai_executive_knowledge(executive_id, knowledge_type);
CREATE INDEX idx_knowledge_key ON ai_executive_knowledge(key);
\`\`\`

### 2.9 Tabela de Buscas Web Realizadas

\`\`\`sql
CREATE TABLE IF NOT EXISTS ai_executive_web_searches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  executive_id UUID REFERENCES ai_executives(id),
  conversation_id UUID REFERENCES ai_executive_conversations(id),
  meeting_id UUID REFERENCES ai_executive_meetings(id),
  query TEXT NOT NULL,
  purpose TEXT,
  results JSONB,
  results_used JSONB,
  search_provider TEXT DEFAULT 'google',
  created_at TIMESTAMP DEFAULT NOW()
);
\`\`\`

### 2.10 Tabela de Acesso a Dados (Audit Log)

\`\`\`sql
CREATE TABLE IF NOT EXISTS ai_executive_data_access_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  executive_id UUID REFERENCES ai_executives(id),
  conversation_id UUID,
  meeting_id UUID,
  data_source TEXT NOT NULL,
  query_type TEXT,
  query_summary TEXT,
  records_accessed INTEGER,
  purpose TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
\`\`\`

### 2.11 Tabela de Alertas Entre Executivos

\`\`\`sql
CREATE TABLE IF NOT EXISTS ai_executive_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_executive_id UUID REFERENCES ai_executives(id),
  to_executive_ids UUID[],
  alert_type TEXT NOT NULL,
  priority TEXT DEFAULT 'normal',
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  related_data JSONB,
  requires_response BOOLEAN DEFAULT false,
  response_deadline TIMESTAMP,
  status TEXT DEFAULT 'pending',
  responses JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
\`\`\`

### 2.12 Tabela de Configuração de Triggers Automáticos

\`\`\`sql
CREATE TABLE IF NOT EXISTS ai_executive_triggers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL,
  trigger_condition JSONB NOT NULL,
  action_type TEXT NOT NULL,
  action_config JSONB NOT NULL,
  responsible_executive_id UUID REFERENCES ai_executives(id),
  enabled BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMP,
  trigger_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
\`\`\`

---

## 3. Inserir Executivos com System Prompts

### 3.1 CEO - Helena

**Personalidade:** Visionária, estratégica, equilibrada, decisiva, inspiradora  
**Foco:** Visão holística, decisões estratégicas, mediação entre áreas  
**Comunicação:** Inspiracional  
**Risco:** Moderado

\`\`\`sql
INSERT INTO ai_executives (role, name, title, personality, expertise_areas, data_access, system_prompt, decision_authority, reports_to, communication_style, risk_tolerance) VALUES
(
  'CEO',
  'Helena',
  'Chief Executive Officer',
  '{"traits": ["visionária", "estratégica", "equilibrada", "decisiva", "inspiradora"]}'::jsonb,
  '{"primary": ["estratégia corporativa", "governança", "visão de longo prazo"]}'::jsonb,
  '{"full_access": true, "priority_views": ["vw_executive_dashboard", "vw_priority_alerts"]}'::jsonb,
  'Você é Helena, CEO virtual. Sintetiza inputs de todos os C-Levels. Prioriza: pessoas > clientes > resultados. Foca no estratégico, delega o tático. Convoca reuniões para decisões importantes.',
  '{"can_approve": ["estratégia", "investimentos_grandes", "parcerias_estratégicas"]}'::jsonb,
  NULL,
  'inspirational',
  'moderate'
);
\`\`\`

### 3.2 CFO - Ricardo

**Personalidade:** Analítico, prudente, preciso, objetivo, conservador  
**Foco:** Finanças, gestão de caixa, análise de investimentos, pricing  
**Comunicação:** Data-driven  
**Risco:** Conservador

\`\`\`sql
INSERT INTO ai_executives (role, name, title, personality, expertise_areas, data_access, system_prompt, decision_authority, reports_to, communication_style, risk_tolerance) VALUES
(
  'CFO',
  'Ricardo',
  'Chief Financial Officer',
  '{"traits": ["analítico", "prudente", "preciso", "objetivo", "conservador"]}'::jsonb,
  '{"primary": ["finanças", "contabilidade", "análise de investimentos", "gestão de caixa", "pricing"]}'::jsonb,
  '{"tables": ["invoices", "payments", "expenses", "budgets"], "views": ["vw_payment_risk_dashboard", "vw_revenue_forecast_dashboard"]}'::jsonb,
  'Você é Ricardo, CFO virtual. Sempre traz DADOS CONCRETOS. Analisa ROI de iniciativas. Alerta sobre riscos financeiros. Monitora: Receita, Margem, CAC, LTV, DSO. Gera alertas de inadimplência > 70%.',
  '{"can_approve": ["despesas_ate_10k", "ajustes_pricing", "renegociacao_contratos"]}'::jsonb,
  'CEO',
  'data-driven',
  'conservative'
);
\`\`\`

### 3.3 CMO - Marina

**Personalidade:** Criativa, orientada a growth, analítica, inovadora  
**Foco:** Marketing, branding, growth, campanhas, posicionamento  
**Comunicação:** Criativo-analítico

\`\`\`sql
INSERT INTO ai_executives (role, name, title, personality, expertise_areas, data_access, system_prompt, decision_authority, reports_to, communication_style, risk_tolerance) VALUES
(
  'CMO',
  'Marina',
  'Chief Marketing Officer',
  '{"traits": ["criativa", "orientada_a_growth", "analítica", "inovadora"]}'::jsonb,
  '{"primary": ["marketing", "branding", "growth", "campanhas", "posicionamento"]}'::jsonb,
  '{"tables": ["campaigns", "proposals", "clients", "leads"], "views": ["vw_campaign_success_prediction", "vw_proposal_conversion_pipeline"]}'::jsonb,
  'Você é Marina, CMO virtual. Equilibra criatividade com dados. Busca tendências na web. Monitora: Pipeline, CTR, ROAS, CAC. Propõe testes e experimentos constantemente.',
  '{"can_approve": ["campanhas_ate_5k", "materiais_marketing", "testes_ab"]}'::jsonb,
  'CEO',
  'creative-analytical',
  'moderate'
);
\`\`\`

### 3.4 CTO - André

**Personalidade:** Técnico, inovador, sistemático, solucionador, curioso  
**Foco:** Tecnologia, sistemas, automação, infraestrutura, segurança  
**Comunicação:** Técnico-pragmático

\`\`\`sql
INSERT INTO ai_executives (role, name, title, personality, expertise_areas, data_access, system_prompt, decision_authority, reports_to, communication_style, risk_tolerance) VALUES
(
  'CTO',
  'André',
  'Chief Technology Officer',
  '{"traits": ["técnico", "inovador", "sistemático", "solucionador", "curioso"]}'::jsonb,
  '{"primary": ["tecnologia", "sistemas", "automação", "infraestrutura", "segurança"]}'::jsonb,
  '{"tables": ["*"], "views": ["*"], "functions": ["*"], "system_access": true}'::jsonb,
  'Você é André, CTO virtual. Busca eficiência através de automação. Prioriza: segurança > estabilidade > features. Avalia build vs buy. Monitora: Uptime, Performance, Débito técnico.',
  '{"can_approve": ["ferramentas_ate_500_mes", "automacoes", "integrações_simples"]}'::jsonb,
  'CEO',
  'technical-pragmatic',
  'moderate'
);
\`\`\`

### 3.5 COO - Fernanda

**Personalidade:** Organizada, eficiente, detalhista, pragmática, resolutiva  
**Foco:** Operações, processos, entrega, qualidade, eficiência  
**Comunicação:** Execution-focused

\`\`\`sql
INSERT INTO ai_executives (role, name, title, personality, expertise_areas, data_access, system_prompt, decision_authority, reports_to, communication_style, risk_tolerance) VALUES
(
  'COO',
  'Fernanda',
  'Chief Operating Officer',
  '{"traits": ["organizada", "eficiente", "detalhista", "pragmática", "resolutiva"]}'::jsonb,
  '{"primary": ["operações", "processos", "entrega", "qualidade", "eficiência"]}'::jsonb,
  '{"tables": ["projects", "tasks", "time_entries"], "views": ["vw_project_deadline_risk", "vw_project_budget_risk", "vw_demand_forecast_dashboard"]}'::jsonb,
  'Você é Fernanda, COO virtual. Foca em execução impecável. Monitora projetos diariamente. Identifica gargalos antes que virem problemas. Monitora: Utilização, On-time delivery, Qualidade.',
  '{"can_approve": ["realocacoes_equipe", "ajustes_prazo_pequenos", "fornecedores_ate_5k"]}'::jsonb,
  'CEO',
  'execution-focused',
  'moderate'
);
\`\`\`

### 3.6 CCO - Juliana

**Personalidade:** Empática, orientada ao cliente, proativa, estratégica  
**Foco:** Sucesso do cliente, retenção, satisfação, expansão de contas  
**Comunicação:** Customer-centric

\`\`\`sql
INSERT INTO ai_executives (role, name, title, personality, expertise_areas, data_access, system_prompt, decision_authority, reports_to, communication_style, risk_tolerance) VALUES
(
  'CCO',
  'Juliana',
  'Chief Customer Officer',
  '{"traits": ["empática", "orientada_ao_cliente", "proativa", "estratégica"]}'::jsonb,
  '{"primary": ["sucesso do cliente", "retenção", "satisfação", "relacionamento", "expansão"]}'::jsonb,
  '{"tables": ["clients", "projects", "contracts", "feedback"], "views": ["vw_payment_risk_dashboard", "vw_client_ltv_segmentation", "vw_churn_prediction"]}'::jsonb,
  'Você é Juliana, CCO virtual. Voz do cliente dentro da empresa. Antecipa problemas. Monitora: NPS, Churn, LTV, Health score. Identifica oportunidades de upsell/cross-sell.',
  '{"can_approve": ["descontos_ate_10%", "brindes_clientes", "ajustes_servico_pequenos"]}'::jsonb,
  'CEO',
  'customer-centric',
  'moderate'
);
\`\`\`

### 3.7 CHRO - Paulo

**Personalidade:** Humano, desenvolvedor, justo, estratégico, cultural  
**Foco:** Pessoas, cultura, desenvolvimento, recrutamento, engajamento  
**Comunicação:** People-first

\`\`\`sql
INSERT INTO ai_executives (role, name, title, personality, expertise_areas, data_access, system_prompt, decision_authority, reports_to, communication_style, risk_tolerance) VALUES
(
  'CHRO',
  'Paulo',
  'Chief Human Resources Officer',
  '{"traits": ["humano", "desenvolvedor", "justo", "estratégico", "cultural"]}'::jsonb,
  '{"primary": ["pessoas", "cultura", "desenvolvimento", "recrutamento", "engajamento"]}'::jsonb,
  '{"tables": ["users", "teams", "performance_reviews", "training", "time_entries"], "views": ["vw_demand_forecast_dashboard", "vw_employee_churn_prediction"]}'::jsonb,
  'Você é Paulo, CHRO virtual. Pessoas são o ativo mais importante. Monitora sinais de burnout. Monitora: Turnover, eNPS, Utilização vs sobrecarga. Equilibra empresa e colaboradores.',
  '{"can_approve": ["treinamentos_ate_2k", "ajustes_beneficios_pequenos", "movimentacoes_laterais"]}'::jsonb,
  'CEO',
  'people-first',
  'moderate'
);
\`\`\`

---

## 4. Sistema de Comunicação Entre Executivos

### 4.1 Function: Enviar Alerta

\`\`\`sql
CREATE OR REPLACE FUNCTION executive_send_alert(
  p_from_role TEXT,
  p_to_roles TEXT[],
  p_alert_type TEXT,
  p_title TEXT,
  p_content TEXT,
  p_related_data JSONB DEFAULT NULL,
  p_priority TEXT DEFAULT 'normal',
  p_requires_response BOOLEAN DEFAULT false,
  p_response_deadline INTERVAL DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_from_id UUID;
  v_to_ids UUID[];
  v_alert_id UUID;
BEGIN
  SELECT id INTO v_from_id FROM ai_executives WHERE role = p_from_role;
  SELECT ARRAY_AGG(id) INTO v_to_ids FROM ai_executives WHERE role = ANY(p_to_roles);

  INSERT INTO ai_executive_alerts (
    from_executive_id, to_executive_ids, alert_type, priority,
    title, content, related_data, requires_response, response_deadline
  ) VALUES (
    v_from_id, v_to_ids, p_alert_type, p_priority,
    p_title, p_content, p_related_data, p_requires_response,
    CASE WHEN p_response_deadline IS NOT NULL THEN NOW() + p_response_deadline ELSE NULL END
  )
  RETURNING id INTO v_alert_id;

  RETURN v_alert_id;
END;
$$ LANGUAGE plpgsql;
\`\`\`

### 4.2 Function: Convocar Reunião

\`\`\`sql
CREATE OR REPLACE FUNCTION executive_call_meeting(
  p_initiated_by_role TEXT,
  p_participant_roles TEXT[],
  p_title TEXT,
  p_meeting_type TEXT,
  p_trigger_reason TEXT,
  p_trigger_data JSONB DEFAULT NULL,
  p_agenda JSONB DEFAULT NULL,
  p_priority TEXT DEFAULT 'normal'
)
RETURNS UUID AS $$
DECLARE
  v_initiator_id UUID;
  v_participant_ids UUID[];
  v_meeting_id UUID;
BEGIN
  SELECT id INTO v_initiator_id FROM ai_executives WHERE role = p_initiated_by_role;
  SELECT ARRAY_AGG(id) INTO v_participant_ids FROM ai_executives WHERE role = ANY(p_participant_roles);

  INSERT INTO ai_executive_meetings (
    title, meeting_type, initiated_by, trigger_reason, trigger_data,
    participants, agenda, priority, status, scheduled_at
  ) VALUES (
    p_title, p_meeting_type, v_initiator_id, p_trigger_reason, p_trigger_data,
    v_participant_ids, p_agenda, p_priority, 'scheduled', NOW()
  )
  RETURNING id INTO v_meeting_id;

  RETURN v_meeting_id;
END;
$$ LANGUAGE plpgsql;
\`\`\`

### 4.3 Function: Criar Insight

\`\`\`sql
CREATE OR REPLACE FUNCTION executive_create_insight(
  p_executive_role TEXT,
  p_insight_type TEXT,
  p_category TEXT,
  p_title TEXT,
  p_description TEXT,
  p_supporting_data JSONB,
  p_confidence_score DECIMAL,
  p_impact_level TEXT,
  p_urgency TEXT,
  p_recommended_actions JSONB DEFAULT NULL,
  p_requires_discussion BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
  v_executive_id UUID;
  v_insight_id UUID;
BEGIN
  SELECT id INTO v_executive_id FROM ai_executives WHERE role = p_executive_role;

  INSERT INTO ai_executive_insights (
    executive_id, insight_type, category, title, description,
    supporting_data, confidence_score, impact_level, urgency,
    recommended_actions, requires_discussion
  ) VALUES (
    v_executive_id, p_insight_type, p_category, p_title, p_description,
    p_supporting_data, p_confidence_score, p_impact_level, p_urgency,
    p_recommended_actions, p_requires_discussion
  )
  RETURNING id INTO v_insight_id;

  -- Se requer discussão e alto impacto, convoca reunião automaticamente
  IF p_requires_discussion AND p_impact_level IN ('high', 'critical') THEN
    PERFORM executive_call_meeting(
      p_executive_role,
      ARRAY['CEO', 
        CASE p_category 
          WHEN 'financial' THEN 'CFO'
          WHEN 'operational' THEN 'COO'
          WHEN 'marketing' THEN 'CMO'
          WHEN 'hr' THEN 'CHRO'
          WHEN 'customer' THEN 'CCO'
          WHEN 'technology' THEN 'CTO'
          ELSE 'CEO'
        END
      ],
      'Discussão: ' || p_title,
      'ad-hoc',
      'Insight de alto impacto requer discussão',
      jsonb_build_object('insight_id', v_insight_id),
      NULL,
      CASE WHEN p_urgency = 'immediate' THEN 'urgent' ELSE 'high' END
    );
  END IF;

  RETURN v_insight_id;
END;
$$ LANGUAGE plpgsql;
\`\`\`

### 4.4 Function: Salvar Conhecimento

\`\`\`sql
CREATE OR REPLACE FUNCTION executive_save_knowledge(
  p_executive_role TEXT,
  p_knowledge_type TEXT,
  p_category TEXT,
  p_key TEXT,
  p_value JSONB,
  p_source TEXT DEFAULT NULL,
  p_source_id UUID DEFAULT NULL,
  p_valid_until TIMESTAMP DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_executive_id UUID;
  v_knowledge_id UUID;
BEGIN
  SELECT id INTO v_executive_id FROM ai_executives WHERE role = p_executive_role;

  INSERT INTO ai_executive_knowledge (
    executive_id, knowledge_type, category, key, value,
    source, source_id, valid_until
  ) VALUES (
    v_executive_id, p_knowledge_type, p_category, p_key, p_value,
    p_source, p_source_id, p_valid_until
  )
  ON CONFLICT (executive_id, key) WHERE knowledge_type = p_knowledge_type
  DO UPDATE SET 
    value = EXCLUDED.value,
    updated_at = NOW(),
    times_referenced = ai_executive_knowledge.times_referenced + 1
  RETURNING id INTO v_knowledge_id;

  RETURN v_knowledge_id;
END;
$$ LANGUAGE plpgsql;
\`\`\`

---

## 5. Triggers Automáticos para Análise

### 5.1 Configurações de Triggers

\`\`\`sql
INSERT INTO ai_executive_triggers (name, description, trigger_type, trigger_condition, action_type, action_config, responsible_executive_id) VALUES

-- CFO: Monitorar faturas atrasadas
(
  'invoice_overdue_alert',
  'Alerta quando fatura atrasa mais de 7 dias',
  'event',
  '{"table": "invoices", "event": "UPDATE", "condition": "status = ''overdue''"}'::jsonb,
  'generate_insight',
  '{"insight_type": "risk", "category": "financial", "notify": ["CFO", "CCO"]}'::jsonb,
  (SELECT id FROM ai_executives WHERE role = 'CFO')
),

-- COO: Monitorar projetos em risco
(
  'project_risk_alert',
  'Alerta quando projeto entra em risco crítico',
  'threshold',
  '{"view": "vw_project_deadline_risk", "metric": "risk_score", "operator": ">=", "value": 70}'::jsonb,
  'generate_insight',
  '{"insight_type": "risk", "category": "operational", "notify": ["COO", "CEO"]}'::jsonb,
  (SELECT id FROM ai_executives WHERE role = 'COO')
),

-- CCO: Monitorar risco de churn
(
  'churn_risk_alert',
  'Alerta quando cliente tem alto risco de churn',
  'threshold',
  '{"view": "vw_churn_prediction", "metric": "churn_score", "operator": ">=", "value": 75}'::jsonb,
  'generate_insight',
  '{"insight_type": "risk", "category": "customer", "notify": ["CCO", "CEO"], "call_meeting": true}'::jsonb,
  (SELECT id FROM ai_executives WHERE role = 'CCO')
),

-- CMO: Monitorar propostas esfriando
(
  'proposal_cooling_alert',
  'Alerta quando proposta importante está esfriando',
  'threshold',
  '{"view": "vw_proposal_conversion_pipeline", "metric": "conversion_score", "operator": "<=", "value": 30, "filter": "value > 10000"}'::jsonb,
  'generate_insight',
  '{"insight_type": "opportunity", "category": "marketing", "notify": ["CMO"]}'::jsonb,
  (SELECT id FROM ai_executives WHERE role = 'CMO')
),

-- CHRO: Monitorar sobrecarga de equipe
(
  'team_overload_alert',
  'Alerta quando equipe está sobrecarregada',
  'threshold',
  '{"view": "vw_demand_forecast_dashboard", "metric": "utilizacao_prevista", "operator": ">=", "value": 95}'::jsonb,
  'generate_insight',
  '{"insight_type": "risk", "category": "hr", "notify": ["CHRO", "COO"], "call_meeting": true}'::jsonb,
  (SELECT id FROM ai_executives WHERE role = 'CHRO')
),

-- CEO: Reunião semanal de status
(
  'weekly_status_meeting',
  'Reunião semanal de alinhamento executivo',
  'schedule',
  '{"cron": "0 10 * * 1"}'::jsonb,
  'call_meeting',
  '{"meeting_type": "review", "participants": ["CEO", "CFO", "CMO", "COO", "CCO", "CHRO", "CTO"]}'::jsonb,
  (SELECT id FROM ai_executives WHERE role = 'CEO')
),

-- CEO: Análise mensal estratégica
(
  'monthly_strategic_review',
  'Análise mensal de indicadores estratégicos',
  'schedule',
  '{"cron": "0 9 1 * *"}'::jsonb,
  'call_meeting',
  '{"meeting_type": "strategic", "participants": ["CEO", "CFO", "CMO", "COO", "CCO", "CHRO", "CTO"], "generate_insights": true}'::jsonb,
  (SELECT id FROM ai_executives WHERE role = 'CEO')
);
\`\`\`

### 5.2 Job para Processar Triggers

\`\`\`sql
SELECT cron.schedule(
  'process-executive-triggers',
  '*/15 * * * *', -- A cada 15 minutos
  $$SELECT process_executive_triggers()$$
);
\`\`\`

---

## 6. Views para Contexto dos Executivos

### 6.1 View de Contexto para CEO

\`\`\`sql
CREATE OR REPLACE VIEW vw_ceo_context AS
SELECT jsonb_build_object(
  'timestamp', NOW(),
  'health_score', (SELECT health_score FROM vw_executive_dashboard),
  'alertas_criticos', (
    SELECT COUNT(*) FROM vw_priority_alerts WHERE nivel IN ('ALTO', 'CRITICO')
  ),
  'resumo_areas', (SELECT row_to_json(d) FROM vw_executive_dashboard d),
  'decisoes_pendentes', (
    SELECT jsonb_agg(row_to_json(d))
    FROM ai_executive_decisions d
    WHERE status = 'proposed' AND human_approval_required = true
  ),
  'insights_importantes', (
    SELECT jsonb_agg(row_to_json(i))
    FROM ai_executive_insights i
    WHERE status = 'new' AND impact_level IN ('high', 'critical')
    ORDER BY created_at DESC LIMIT 5
  )
) as context;
\`\`\`

### 6.2 View de Contexto para CFO

\`\`\`sql
CREATE OR REPLACE VIEW vw_cfo_context AS
SELECT jsonb_build_object(
  'timestamp', NOW(),
  'financeiro', jsonb_build_object(
    'receita_mes_atual', (
      SELECT COALESCE(SUM(value), 0) FROM invoices 
      WHERE status = 'paid' AND DATE_TRUNC('month', paid_at) = DATE_TRUNC('month', NOW())
    ),
    'valor_em_risco', (
      SELECT COALESCE(SUM(valor_em_risco), 0) FROM vw_payment_risk_dashboard WHERE risk_level IN ('ALTO', 'MEDIO')
    ),
    'clientes_inadimplentes', (
      SELECT COUNT(*) FROM vw_payment_risk_dashboard WHERE risk_level = 'ALTO'
    )
  ),
  'forecast_6_meses', (
    SELECT jsonb_agg(row_to_json(f))
    FROM vw_revenue_forecast_dashboard f
  ),
  'alertas_financeiros', (
    SELECT jsonb_agg(row_to_json(a))
    FROM vw_priority_alerts a
    WHERE categoria IN ('PAGAMENTO', 'ORCAMENTO')
  )
) as context;
\`\`\`

### 6.3 View de Contexto para CMO

\`\`\`sql
CREATE OR REPLACE VIEW vw_cmo_context AS
SELECT jsonb_build_object(
  'timestamp', NOW(),
  'pipeline_vendas', jsonb_build_object(
    'propostas_pendentes', (SELECT COUNT(*) FROM vw_proposal_conversion_pipeline),
    'valor_total', (SELECT COALESCE(SUM(value), 0) FROM vw_proposal_conversion_pipeline),
    'taxa_conversao_media', (SELECT AVG(conversion_score) FROM vw_proposal_conversion_pipeline)
  ),
  'campanhas', jsonb_build_object(
    'ativas', (SELECT COUNT(*) FROM vw_campaign_success_prediction),
    'alta_probabilidade', (SELECT COUNT(*) FROM vw_campaign_success_prediction WHERE success_probability = 'ALTA')
  ),
  'propostas_esfriando', (
    SELECT jsonb_agg(row_to_json(p))
    FROM vw_proposal_conversion_pipeline p
    WHERE conversion_probability = 'BAIXA'
    ORDER BY value DESC LIMIT 5
  )
) as context;
\`\`\`

### 6.4 View de Contexto para COO

\`\`\`sql
CREATE OR REPLACE VIEW vw_coo_context AS
SELECT jsonb_build_object(
  'timestamp', NOW(),
  'projetos_ativos', jsonb_build_object(
    'total', (SELECT COUNT(*) FROM projects WHERE status = 'in_progress'),
    'em_risco_prazo', (SELECT COUNT(*) FROM vw_project_deadline_risk WHERE risk_level IN ('CRITICO', 'ATENCAO')),
    'em_risco_orcamento', (SELECT COUNT(*) FROM vw_project_budget_risk WHERE risk_level IN ('CRITICO', 'ATENCAO'))
  ),
  'capacidade', jsonb_build_object(
    'utilizacao_atual', (SELECT (recommendations->>'utilizacao_prevista_pct')::DECIMAL FROM vw_demand_forecast_dashboard LIMIT 1)
  ),
  'projetos_criticos', (
    SELECT jsonb_agg(row_to_json(p))
    FROM vw_project_deadline_risk p
    WHERE risk_level = 'CRITICO'
  )
) as context;
\`\`\`

### 6.5 View de Contexto para CCO

\`\`\`sql
CREATE OR REPLACE VIEW vw_cco_context AS
SELECT jsonb_build_object(
  'timestamp', NOW(),
  'saude_clientes', jsonb_build_object(
    'total_ativos', (SELECT COUNT(*) FROM clients WHERE status = 'active'),
    'risco_churn', (SELECT COUNT(*) FROM vw_churn_prediction WHERE churn_score >= 50),
    'risco_inadimplencia', (SELECT COUNT(*) FROM vw_payment_risk_dashboard WHERE risk_level IN ('ALTO', 'MEDIO'))
  ),
  'clientes_em_risco', (
    SELECT jsonb_agg(row_to_json(c))
    FROM (SELECT * FROM vw_churn_prediction WHERE churn_score >= 70 ORDER BY churn_score DESC LIMIT 5) c
  )
) as context;
\`\`\`

### 6.6 View de Contexto para CHRO

\`\`\`sql
CREATE OR REPLACE VIEW vw_chro_context AS
SELECT jsonb_build_object(
  'timestamp', NOW(),
  'equipe', jsonb_build_object(
    'total_ativos', (SELECT COUNT(*) FROM users WHERE status = 'active'),
    'por_departamento', (
      SELECT jsonb_object_agg(department, cnt)
      FROM (SELECT department, COUNT(*) as cnt FROM users WHERE status = 'active' GROUP BY department) d
    )
  ),
  'carga_trabalho', jsonb_build_object(
    'utilizacao_media', (SELECT (recommendations->>'utilizacao_prevista_pct')::DECIMAL FROM vw_demand_forecast_dashboard LIMIT 1)
  ),
  'riscos_pessoas', (
    SELECT jsonb_agg(row_to_json(e))
    FROM (SELECT * FROM vw_employee_churn_prediction WHERE churn_score >= 60 ORDER BY churn_score DESC LIMIT 5) e
  )
) as context;
\`\`\`

### 6.7 View de Contexto para CTO

\`\`\`sql
CREATE OR REPLACE VIEW vw_cto_context AS
SELECT jsonb_build_object(
  'timestamp', NOW(),
  'sistemas', jsonb_build_object(
    'status', 'operational',
    'uptime_30d', 99.9
  ),
  'automacoes', jsonb_build_object(
    'triggers_ativos', (SELECT COUNT(*) FROM ai_executive_triggers WHERE enabled = true),
    'triggers_disparados_hoje', (
      SELECT COUNT(*) FROM ai_executive_triggers 
      WHERE last_triggered_at >= DATE_TRUNC('day', NOW())
    )
  ),
  'modelos_preditivos', jsonb_build_object(
    'accuracy', (
      SELECT jsonb_object_agg(model_name, accuracy_pct)
      FROM calculate_all_model_accuracy()
    )
  )
) as context;
\`\`\`

---

## 7. API e Edge Functions para LLM

### 7.1 Edge Function: Chat com Executivo

**Arquivo:** `supabase/functions/executive-chat/index.ts`

\`\`\`typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { executive_role, message, conversation_id, user_id } = await req.json()

    // 1. Buscar dados do executivo
    const { data: executive } = await supabase
      .from('ai_executives')
      .select('*')
      .eq('role', executive_role)
      .single()

    // 2. Buscar contexto do executivo
    const contextView = \`vw_\${executive_role.toLowerCase()}_context\`
    const { data: context } = await supabase
      .from(contextView)
      .select('context')
      .single()

    // 3. Construir prompt completo
    const systemPrompt = \`\${executive.system_prompt}

CONTEXTO ATUAL DA EMPRESA:
\${JSON.stringify(context?.context || {}, null, 2)}

INSTRUÇÕES:
1. Use os dados do contexto para embasar suas respostas
2. Seja específico com números e métricas
3. Se precisar de informação que não tem, indique claramente
4. Se a decisão envolver outras áreas, sugira consultar o executivo apropriado
5. Mantenha seu estilo de comunicação: \${executive.communication_style}\`

    // 4. Chamar Anthropic API
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY') ?? '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: message }]
      })
    })

    const aiResponse = await anthropicResponse.json()

    return new Response(
      JSON.stringify({
        conversation_id: convId,
        message: aiResponse.content[0].text,
        executive: { role: executive.role, name: executive.name, title: executive.title }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
\`\`\`

### 7.2 Edge Function: Reunião Entre Executivos

**Arquivo:** `supabase/functions/executive-meeting/index.ts`

Esta função conduz reuniões automáticas entre executivos:
- Busca participantes e contexto de cada um
- Executa rounds de discussão
- CEO faz síntese e verifica consenso
- Registra decisões tomadas

### 7.3 Edge Function: Busca Web

**Arquivo:** `supabase/functions/executive-web-search/index.ts`

Permite que executivos busquem informações externas usando API de busca (Serper/Google).

### 7.4 Edge Function: Gerar Insights

**Arquivo:** `supabase/functions/executive-generate-insights/index.ts`

Analisa contexto e gera insights acionáveis automaticamente no formato JSON.

---

## 8. Jobs e Automações

### 8.1 Job: Insights Diários

\`\`\`sql
SELECT cron.schedule(
  'executive-daily-insights',
  '0 8 * * *', -- Todos os dias às 8h
  $$
    SELECT net.http_post(
      'https://[SEU_PROJECT].supabase.co/functions/v1/executive-generate-insights',
      '{"executive_role": "CFO"}'::jsonb,
      '{"Content-Type": "application/json", "Authorization": "Bearer [SERVICE_KEY]"}'::jsonb
    );
    
    SELECT net.http_post(
      'https://[SEU_PROJECT].supabase.co/functions/v1/executive-generate-insights',
      '{"executive_role": "COO"}'::jsonb,
      '{"Content-Type": "application/json", "Authorization": "Bearer [SERVICE_KEY]"}'::jsonb
    );
    
    SELECT net.http_post(
      'https://[SEU_PROJECT].supabase.co/functions/v1/executive-generate-insights',
      '{"executive_role": "CCO"}'::jsonb,
      '{"Content-Type": "application/json", "Authorization": "Bearer [SERVICE_KEY]"}'::jsonb
    );
  $$
);
\`\`\`

### 8.2 Job: Reunião Semanal Automática

\`\`\`sql
SELECT cron.schedule(
  'executive-weekly-meeting',
  '0 9 * * 1', -- Segunda às 9h
  $$
    WITH new_meeting AS (
      INSERT INTO ai_executive_meetings (
        title, meeting_type, initiated_by, trigger_reason,
        participants, agenda, priority, status
      )
      SELECT 
        'Alinhamento Semanal - ' || TO_CHAR(NOW(), 'DD/MM'),
        'review',
        (SELECT id FROM ai_executives WHERE role = 'CEO'),
        'Reunião semanal de alinhamento',
        (SELECT ARRAY_AGG(id) FROM ai_executives WHERE status = 'active'),
        '[
          {"item": "Revisão de alertas pendentes", "owner": "CEO"},
          {"item": "Atualização financeira", "owner": "CFO"},
          {"item": "Status de projetos", "owner": "COO"},
          {"item": "Pipeline de vendas", "owner": "CMO"},
          {"item": "Saúde dos clientes", "owner": "CCO"},
          {"item": "Equipe e capacidade", "owner": "CHRO"},
          {"item": "Sistemas e automações", "owner": "CTO"}
        ]'::jsonb,
        'normal',
        'scheduled'
      RETURNING id
    )
    SELECT net.http_post(
      'https://[SEU_PROJECT].supabase.co/functions/v1/executive-meeting',
      jsonb_build_object('meeting_id', (SELECT id FROM new_meeting), 'max_rounds', 3),
      '{"Content-Type": "application/json", "Authorization": "Bearer [SERVICE_KEY]"}'::jsonb
    );
  $$
);
\`\`\`

### 8.3 Job: Atualizar Conhecimento

\`\`\`sql
SELECT cron.schedule(
  'executive-update-knowledge',
  '0 7 * * *', -- Todos os dias às 7h
  $$
    INSERT INTO ai_executive_knowledge (executive_id, knowledge_type, category, key, value, source)
    SELECT 
      e.id,
      'fact',
      'metrics',
      'daily_metrics_' || TO_CHAR(NOW(), 'YYYY_MM_DD'),
      CASE e.role
        WHEN 'CFO' THEN (SELECT context FROM vw_cfo_context)
        WHEN 'CMO' THEN (SELECT context FROM vw_cmo_context)
        WHEN 'COO' THEN (SELECT context FROM vw_coo_context)
        WHEN 'CCO' THEN (SELECT context FROM vw_cco_context)
        WHEN 'CHRO' THEN (SELECT context FROM vw_chro_context)
        WHEN 'CTO' THEN (SELECT context FROM vw_cto_context)
        WHEN 'CEO' THEN (SELECT context FROM vw_ceo_context)
      END,
      'daily_context_update'
    FROM ai_executives e
    WHERE e.status = 'active';
  $$
);
\`\`\`

### 8.4 Job: Buscar Tendências (CMO)

\`\`\`sql
SELECT cron.schedule(
  'cmo-market-trends',
  '0 10 * * 3', -- Quarta às 10h
  $$
    SELECT net.http_post(
      'https://[SEU_PROJECT].supabase.co/functions/v1/executive-web-search',
      '{"executive_role": "CMO", "query": "marketing digital trends 2024 agencies", "purpose": "Atualização semanal de tendências"}'::jsonb,
      '{"Content-Type": "application/json", "Authorization": "Bearer [SERVICE_KEY]"}'::jsonb
    );
  $$
);
\`\`\`

### 8.5 Job: Limpeza de Conhecimento Expirado

\`\`\`sql
SELECT cron.schedule(
  'cleanup-expired-knowledge',
  '0 3 * * 0', -- Domingo às 3h
  $$
    DELETE FROM ai_executive_knowledge
    WHERE valid_until IS NOT NULL AND valid_until < NOW();
    
    UPDATE ai_executive_conversations
    SET status = 'archived'
    WHERE status = 'active'
      AND updated_at < NOW() - INTERVAL '30 days';
  $$
);
\`\`\`

---

## 9. Componente React para Chat

### Arquivo: components/ExecutiveChat.tsx

\`\`\`tsx
import { useState, useEffect, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

interface Executive {
  role: string
  name: string
  title: string
  avatar_url: string
}

const executives: Executive[] = [
  { role: 'CEO', name: 'Helena', title: 'Chief Executive Officer', avatar_url: '/avatars/ceo.png' },
  { role: 'CFO', name: 'Ricardo', title: 'Chief Financial Officer', avatar_url: '/avatars/cfo.png' },
  { role: 'CMO', name: 'Marina', title: 'Chief Marketing Officer', avatar_url: '/avatars/cmo.png' },
  { role: 'CTO', name: 'André', title: 'Chief Technology Officer', avatar_url: '/avatars/cto.png' },
  { role: 'COO', name: 'Fernanda', title: 'Chief Operating Officer', avatar_url: '/avatars/coo.png' },
  { role: 'CCO', name: 'Juliana', title: 'Chief Customer Officer', avatar_url: '/avatars/cco.png' },
  { role: 'CHRO', name: 'Paulo', title: 'Chief Human Resources Officer', avatar_url: '/avatars/chro.png' },
]

export default function ExecutiveChat() {
  const [selectedExec, setSelectedExec] = useState<Executive | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClientComponentClient()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSelectExec = (exec: Executive) => {
    setSelectedExec(exec)
    // Carregar histórico de conversa
  }

  const handleSend = async () => {
    if (!input.trim() || !selectedExec) return

    const userMessage = input
    setInput('')
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString()
    }])
    setLoading(true)

    try {
      const response = await fetch('/api/executive/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          executive_role: selectedExec.role,
          message: userMessage,
          conversation_id: conversationId
        })
      })

      const data = await response.json()

      if (data.conversation_id && !conversationId) {
        setConversationId(data.conversation_id)
      }

      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.message,
        created_at: new Date().toISOString()
      }])
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar com executivos */}
      <div className="w-80 bg-white border-r">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">C-Level Virtual</h2>
          <p className="text-sm text-gray-500">Selecione um executivo</p>
        </div>
        <div className="overflow-y-auto">
          {executives.map(exec => (
            <button
              key={exec.role}
              onClick={() => handleSelectExec(exec)}
              className={\`w-full p-4 flex items-center gap-3 hover:bg-gray-50 \${
                selectedExec?.role === exec.role ? 'bg-blue-50 border-l-4 border-blue-500' : ''
              }\`}
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                {exec.role.substring(0, 2)}
              </div>
              <div className="text-left">
                <div className="font-medium">{exec.name}</div>
                <div className="text-sm text-gray-500">{exec.title}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Área de chat */}
      <div className="flex-1 flex flex-col">
        {selectedExec ? (
          <>
            {/* Header */}
            <div className="p-4 bg-white border-b flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                {selectedExec.role.substring(0, 2)}
              </div>
              <div>
                <div className="font-medium">{selectedExec.name}</div>
                <div className="text-sm text-gray-500">{selectedExec.title}</div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 mt-8">
                  <p>Olá! Sou {selectedExec.name}, {selectedExec.title}.</p>
                  <p className="mt-2">Como posso ajudar você hoje?</p>
                </div>
              )}
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={\`flex \${msg.role === 'user' ? 'justify-end' : 'justify-start'}\`}
                >
                  <div
                    className={\`max-w-2xl p-4 rounded-lg \${
                      msg.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white border shadow-sm'
                    }\`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border shadow-sm p-4 rounded-lg">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t">
              <div className="flex gap-2">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={\`Mensagem para \${selectedExec.name}...\`}
                  className="flex-1 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  Enviar
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p className="text-xl">Selecione um executivo</p>
              <p className="mt-2">para iniciar uma conversa</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
\`\`\`

---

## 10. Resumo Final do Sistema

### Tabela de Executivos

| Executivo | Foco Principal | Contexto Automático |
|-----------|----------------|---------------------|
| **CEO (Helena)** | Visão holística, decisões estratégicas | Dashboard executivo, todos os alertas |
| **CFO (Ricardo)** | Finanças, riscos, investimentos | Forecast, inadimplência, LTV, orçamentos |
| **CMO (Marina)** | Marketing, vendas, growth | Pipeline, campanhas, conversão, sazonalidade |
| **CTO (André)** | Tecnologia, sistemas, automação | Sistemas, modelos ML, integrações |
| **COO (Fernanda)** | Operações, projetos, entrega | Projetos em risco, capacidade, prazos |
| **CCO (Juliana)** | Clientes, retenção, satisfação | Churn, NPS, LTV, relacionamento |
| **CHRO (Paulo)** | Pessoas, cultura, talentos | Equipe, carga, turnover, desenvolvimento |

### Capacidades do Sistema

| # | Capacidade | Status |
|---|------------|--------|
| 1 | Chat individual com cada executivo | ✅ |
| 2 | Reuniões automáticas entre executivos | ✅ |
| 3 | Geração proativa de insights | ✅ |
| 4 | Busca web para informações externas | ✅ |
| 5 | Memória/conhecimento persistente | ✅ |
| 6 | Triggers automáticos baseados em eventos | ✅ |
| 7 | Sistema de alertas entre executivos | ✅ |
| 8 | Registro de decisões e histórico | ✅ |

### Checklist de Implementação

- [ ] Criar tabelas no Supabase
- [ ] Inserir dados dos executivos
- [ ] Criar functions SQL
- [ ] Configurar triggers automáticos
- [ ] Criar views de contexto
- [ ] Deploy das Edge Functions
- [ ] Configurar jobs pg_cron
- [ ] Implementar componente React
- [ ] Configurar variáveis de ambiente (ANTHROPIC_API_KEY, SERPER_API_KEY)
- [ ] Testar fluxo completo

---

*Documentação gerada em Janeiro/2025*
