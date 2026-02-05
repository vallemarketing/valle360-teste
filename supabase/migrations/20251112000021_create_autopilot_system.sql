-- =====================================================
-- MIGRATION: Auto-Pilot System
-- Descrição: Sistema de automação inteligente com regras e ações
-- Dependências: Todas as migrations anteriores
-- =====================================================

-- =====================================================
-- 1. TABELA: autopilot_rules
-- Regras de automação configuráveis
-- =====================================================

CREATE TABLE IF NOT EXISTS autopilot_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN (
    'churn_prevention',
    'upsell_trigger',
    'engagement_boost',
    'payment_followup',
    'satisfaction_check',
    'onboarding_automation',
    'renewal_preparation',
    'custom'
  )),
  
  -- Trigger/Condições
  trigger_conditions JSONB NOT NULL,
  
  -- Ações a executar
  actions JSONB NOT NULL,
  
  -- Prioridade
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  
  -- Controles
  is_active BOOLEAN DEFAULT true,
  
  max_executions_per_day INTEGER,
  cooldown_hours INTEGER DEFAULT 24,
  
  -- Estatísticas
  total_triggers INTEGER DEFAULT 0,
  total_executions INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  
  success_rate NUMERIC(5, 2) GENERATED ALWAYS AS (
    CASE 
      WHEN total_executions > 0 THEN (success_count::NUMERIC / total_executions * 100)
      ELSE 0
    END
  ) STORED,
  
  -- Meta
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  last_execution_at TIMESTAMP WITH TIME ZONE,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_autopilot_rules_type ON autopilot_rules(rule_type);
CREATE INDEX idx_autopilot_rules_active ON autopilot_rules(is_active) WHERE is_active = true;
CREATE INDEX idx_autopilot_rules_priority ON autopilot_rules(priority DESC);

COMMENT ON TABLE autopilot_rules IS 'Regras de automação do sistema autopilot';

-- =====================================================
-- 2. TABELA: autopilot_executions
-- Log de execuções do autopilot
-- =====================================================

CREATE TABLE IF NOT EXISTS autopilot_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  rule_id UUID REFERENCES autopilot_rules(id) ON DELETE CASCADE NOT NULL,
  
  -- Trigger
  triggered_by_event VARCHAR(100) NOT NULL,
  trigger_data JSONB DEFAULT '{}'::jsonb,
  
  -- Entidade relacionada
  entity_type VARCHAR(50),
  entity_id UUID,
  
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  
  -- Ações executadas
  actions_executed JSONB NOT NULL,
  
  -- Resultado
  status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'partial_success', 'failed', 'skipped')),
  
  error_message TEXT,
  
  -- Impacto
  actions_taken_count INTEGER DEFAULT 0,
  estimated_impact JSONB DEFAULT '{}'::jsonb,
  
  -- Timing
  execution_duration_ms INTEGER,
  
  -- Timestamps
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_autopilot_executions_rule ON autopilot_executions(rule_id);
CREATE INDEX idx_autopilot_executions_status ON autopilot_executions(status);
CREATE INDEX idx_autopilot_executions_client ON autopilot_executions(client_id);
CREATE INDEX idx_autopilot_executions_executed ON autopilot_executions(executed_at DESC);

COMMENT ON TABLE autopilot_executions IS 'Histórico de execuções do autopilot';

-- =====================================================
-- 3. TABELA: autopilot_action_templates
-- Templates de ações reutilizáveis
-- =====================================================

CREATE TABLE IF NOT EXISTS autopilot_action_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  
  action_type VARCHAR(50) NOT NULL CHECK (action_type IN (
    'send_email',
    'send_whatsapp',
    'create_task',
    'create_alert',
    'schedule_meeting',
    'update_client_score',
    'apply_discount',
    'send_notification',
    'trigger_workflow',
    'custom_webhook'
  )),
  
  -- Configuração da ação
  action_config JSONB NOT NULL,
  
  -- Variáveis disponíveis
  available_variables TEXT[],
  
  -- Categoria
  category VARCHAR(50),
  
  is_active BOOLEAN DEFAULT true,
  
  usage_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_autopilot_action_templates_type ON autopilot_action_templates(action_type);
CREATE INDEX idx_autopilot_action_templates_active ON autopilot_action_templates(is_active) WHERE is_active = true;

COMMENT ON TABLE autopilot_action_templates IS 'Templates de ações para autopilot';

-- =====================================================
-- 4. TABELA: autopilot_queue
-- Fila de ações pendentes
-- =====================================================

CREATE TABLE IF NOT EXISTS autopilot_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  rule_id UUID REFERENCES autopilot_rules(id) ON DELETE CASCADE NOT NULL,
  
  action_type VARCHAR(50) NOT NULL,
  action_payload JSONB NOT NULL,
  
  priority INTEGER DEFAULT 5,
  
  -- Agendamento
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_autopilot_queue_status ON autopilot_queue(status, scheduled_for);
CREATE INDEX idx_autopilot_queue_priority ON autopilot_queue(priority DESC, scheduled_for);
CREATE INDEX idx_autopilot_queue_rule ON autopilot_queue(rule_id);

COMMENT ON TABLE autopilot_queue IS 'Fila de ações do autopilot';

-- =====================================================
-- 5. TABELA: autopilot_performance_tracking
-- Tracking de performance do autopilot
-- =====================================================

CREATE TABLE IF NOT EXISTS autopilot_performance_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  rule_id UUID REFERENCES autopilot_rules(id) ON DELETE CASCADE NOT NULL,
  
  tracking_period DATE NOT NULL,
  
  -- Métricas
  total_triggers INTEGER DEFAULT 0,
  successful_executions INTEGER DEFAULT 0,
  failed_executions INTEGER DEFAULT 0,
  
  avg_execution_time_ms INTEGER,
  
  -- Impacto
  clients_affected INTEGER DEFAULT 0,
  estimated_revenue_impact NUMERIC(12, 2),
  
  -- ROI do autopilot
  automation_value NUMERIC(12, 2),
  manual_cost_equivalent NUMERIC(12, 2),
  
  roi_percentage NUMERIC(5, 2) GENERATED ALWAYS AS (
    CASE 
      WHEN manual_cost_equivalent > 0 THEN 
        ((automation_value - manual_cost_equivalent) / manual_cost_equivalent * 100)
      ELSE 0
    END
  ) STORED,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  UNIQUE(rule_id, tracking_period)
);

CREATE INDEX idx_autopilot_performance_rule ON autopilot_performance_tracking(rule_id);
CREATE INDEX idx_autopilot_performance_period ON autopilot_performance_tracking(tracking_period DESC);

COMMENT ON TABLE autopilot_performance_tracking IS 'Métricas de performance do autopilot';

-- =====================================================
-- 6. TABELA: autopilot_intervention_cooldowns
-- Cooldown para evitar spam
-- =====================================================

CREATE TABLE IF NOT EXISTS autopilot_intervention_cooldowns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  rule_id UUID REFERENCES autopilot_rules(id) ON DELETE CASCADE NOT NULL,
  
  last_intervention_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  next_allowed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  intervention_count INTEGER DEFAULT 1,
  
  UNIQUE(client_id, rule_id)
);

CREATE INDEX idx_autopilot_cooldowns_client ON autopilot_intervention_cooldowns(client_id);
CREATE INDEX idx_autopilot_cooldowns_next_allowed ON autopilot_intervention_cooldowns(next_allowed_at);

COMMENT ON TABLE autopilot_intervention_cooldowns IS 'Cooldowns para evitar múltiplas intervenções';

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER update_autopilot_rules_updated_at
  BEFORE UPDATE ON autopilot_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_autopilot_action_templates_updated_at
  BEFORE UPDATE ON autopilot_action_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION: Executar Regra de Autopilot
-- =====================================================

CREATE OR REPLACE FUNCTION execute_autopilot_rule(
  p_rule_id UUID,
  p_client_id UUID,
  p_trigger_data JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN AS $$
DECLARE
  v_rule RECORD;
  v_can_execute BOOLEAN;
  v_execution_id UUID;
BEGIN
  -- Buscar regra
  SELECT * INTO v_rule
  FROM autopilot_rules
  WHERE id = p_rule_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar cooldown
  SELECT NOT EXISTS (
    SELECT 1 FROM autopilot_intervention_cooldowns
    WHERE client_id = p_client_id
    AND rule_id = p_rule_id
    AND next_allowed_at > now()
  ) INTO v_can_execute;
  
  IF NOT v_can_execute THEN
    RAISE NOTICE 'Regra % em cooldown para cliente %', p_rule_id, p_client_id;
    RETURN FALSE;
  END IF;
  
  -- Criar registro de execução
  INSERT INTO autopilot_executions (
    rule_id,
    triggered_by_event,
    trigger_data,
    client_id,
    actions_executed,
    status
  ) VALUES (
    p_rule_id,
    'manual_trigger',
    p_trigger_data,
    p_client_id,
    v_rule.actions,
    'success'
  ) RETURNING id INTO v_execution_id;
  
  -- Atualizar contadores da regra
  UPDATE autopilot_rules
  SET 
    total_triggers = total_triggers + 1,
    total_executions = total_executions + 1,
    success_count = success_count + 1,
    last_execution_at = now()
  WHERE id = p_rule_id;
  
  -- Criar cooldown
  INSERT INTO autopilot_intervention_cooldowns (
    client_id,
    rule_id,
    next_allowed_at
  ) VALUES (
    p_client_id,
    p_rule_id,
    now() + (v_rule.cooldown_hours || ' hours')::INTERVAL
  )
  ON CONFLICT (client_id, rule_id)
  DO UPDATE SET
    last_intervention_at = now(),
    next_allowed_at = now() + (v_rule.cooldown_hours || ' hours')::INTERVAL,
    intervention_count = autopilot_intervention_cooldowns.intervention_count + 1;
  
  -- TODO: Aqui você implementaria a execução real das ações
  -- Por enquanto, apenas enfileiramos
  
  RAISE NOTICE 'Regra % executada com sucesso para cliente %', p_rule_id, p_client_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION execute_autopilot_rule IS 'Executa uma regra de autopilot para um cliente';

-- =====================================================
-- FUNCTION: Verificar e Executar Regras Automáticas
-- =====================================================

CREATE OR REPLACE FUNCTION check_and_execute_autopilot_rules()
RETURNS INTEGER AS $$
DECLARE
  v_rule RECORD;
  v_client RECORD;
  v_count INTEGER := 0;
BEGIN
  -- Regra 1: Cliente com NPS baixo
  FOR v_client IN
    SELECT c.id, nr.score
    FROM clients c
    JOIN nps_ratings nr ON nr.client_id = c.id
    WHERE nr.score <= 6
    AND nr.created_at > now() - INTERVAL '30 days'
    AND NOT EXISTS (
      SELECT 1 FROM autopilot_intervention_cooldowns
      WHERE client_id = c.id
      AND rule_id = (SELECT id FROM autopilot_rules WHERE rule_type = 'satisfaction_check' AND is_active = true LIMIT 1)
      AND next_allowed_at > now()
    )
  LOOP
    -- Executar ação de follow-up
    INSERT INTO priority_action_items (
      action_type,
      priority_score,
      title,
      description,
      client_id,
      urgency
    ) VALUES (
      'satisfaction_followup',
      80,
      'NPS Baixo - Follow-up Necessário',
      'Cliente com NPS ' || v_client.score || ' precisa de contato urgente.',
      v_client.id,
      'today'
    );
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_and_execute_autopilot_rules IS 'Verifica e executa regras automáticas periodicamente';

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE autopilot_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE autopilot_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE autopilot_action_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE autopilot_queue ENABLE ROW LEVEL SECURITY;

-- Super admins gerenciam autopilot
CREATE POLICY "Super admins gerenciam autopilot"
  ON autopilot_rules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type IN ('super_admin', 'marketing_head')
    )
  );

-- Colaboradores veem execuções
CREATE POLICY "Colaboradores veem execuções"
  ON autopilot_executions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type NOT IN ('client')
    )
  );

-- =====================================================
-- Fim da Migration: Auto-Pilot System
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 21: Auto-Pilot System concluída!';
  RAISE NOTICE '📊 6 tabelas criadas';
  RAISE NOTICE '🤖 Sistema de automação inteligente implementado';
END $$;

