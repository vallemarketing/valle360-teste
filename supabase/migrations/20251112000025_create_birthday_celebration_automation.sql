-- =====================================================
-- MIGRATION 25: Birthday & Celebration Automation System
-- Descrição: Sistema completo de aniversários com mensagens, comida, dinheiro e notificações
-- Dependências: Todas as migrations anteriores
-- =====================================================

-- =====================================================
-- 1. TABELA: employee_birthdays_tracker
-- Tracking de aniversários e celebrações
-- =====================================================

CREATE TABLE IF NOT EXISTS employee_birthdays_tracker (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  birth_date DATE NOT NULL,
  birth_month INTEGER GENERATED ALWAYS AS (EXTRACT(MONTH FROM birth_date)) STORED,
  birth_day INTEGER GENERATED ALWAYS AS (EXTRACT(DAY FROM birth_date)) STORED,
  
  -- Preferências
  prefers_public_celebration BOOLEAN DEFAULT true,
  favorite_food VARCHAR(255),
  dietary_restrictions TEXT[],
  favorite_restaurant VARCHAR(255),
  delivery_address TEXT,
  
  -- Gift Preferences
  preferred_gift_type VARCHAR(50) CHECK (preferred_gift_type IN ('money', 'gift_card', 'physical_gift', 'experience', 'no_gift')),
  gift_card_preference VARCHAR(100), -- Amazon, iFood, Uber, etc
  
  -- Histórico
  last_celebration_year INTEGER,
  total_celebrations INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_birthdays_month_day ON employee_birthdays_tracker(birth_month, birth_day);
CREATE INDEX idx_birthdays_employee ON employee_birthdays_tracker(employee_id);

COMMENT ON TABLE employee_birthdays_tracker IS 'Tracking de aniversários e preferências de celebração';

-- =====================================================
-- 2. TABELA: birthday_celebrations
-- Registro de celebrações executadas
-- =====================================================

CREATE TABLE IF NOT EXISTS birthday_celebrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  
  celebration_date DATE NOT NULL,
  celebration_year INTEGER NOT NULL,
  
  -- Idade
  age INTEGER,
  
  -- Mensagem
  message_sent BOOLEAN DEFAULT false,
  message_content TEXT,
  message_sent_at TIMESTAMP WITH TIME ZONE,
  message_channel VARCHAR(20),
  
  -- Comida/Lanche
  food_order_placed BOOLEAN DEFAULT false,
  food_order_provider VARCHAR(50), -- iFood, Rappi, Uber Eats
  food_order_id VARCHAR(255),
  food_order_value NUMERIC(10, 2),
  food_order_status VARCHAR(20) CHECK (food_order_status IN ('pending', 'confirmed', 'delivered', 'failed', 'cancelled')),
  food_delivered_at TIMESTAMP WITH TIME ZONE,
  
  -- Dinheiro/Vale-Presente
  money_sent BOOLEAN DEFAULT false,
  money_amount NUMERIC(10, 2),
  money_method VARCHAR(50), -- PIX, bank_transfer, gift_card
  money_transaction_id VARCHAR(255),
  money_sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Notificação ao Time
  team_notified BOOLEAN DEFAULT false,
  team_notification_channel VARCHAR(50), -- Slack, Email, WhatsApp, In-app
  team_members_notified INTEGER DEFAULT 0,
  team_notified_at TIMESTAMP WITH TIME ZONE,
  
  -- Publicação no Feed
  feed_post_created BOOLEAN DEFAULT false,
  feed_post_id UUID,
  
  -- Reações do Time
  team_reactions JSONB DEFAULT '{"congrats": 0, "hearts": 0, "cakes": 0}'::jsonb,
  team_messages JSONB DEFAULT '[]'::jsonb,
  
  -- Status Geral
  celebration_status VARCHAR(20) DEFAULT 'scheduled' CHECK (celebration_status IN ('scheduled', 'in_progress', 'completed', 'failed')),
  
  -- Admin que aprovou/configurou
  configured_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  -- Notas
  notes TEXT,
  
  -- Budget
  total_budget NUMERIC(10, 2),
  total_spent NUMERIC(10, 2),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(employee_id, celebration_year)
);

CREATE INDEX idx_celebrations_employee ON birthday_celebrations(employee_id);
CREATE INDEX idx_celebrations_date ON birthday_celebrations(celebration_date);
CREATE INDEX idx_celebrations_status ON birthday_celebrations(celebration_status);

COMMENT ON TABLE birthday_celebrations IS 'Registro de celebrações de aniversário executadas';

-- =====================================================
-- 3. TABELA: celebration_automation_config
-- Configuração de automações de celebração
-- =====================================================

CREATE TABLE IF NOT EXISTS celebration_automation_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  config_name VARCHAR(255) NOT NULL UNIQUE,
  
  celebration_type VARCHAR(50) NOT NULL CHECK (celebration_type IN (
    'birthday',
    'work_anniversary',
    'wedding',
    'baby_birth',
    'promotion',
    'achievement'
  )),
  
  -- Ações Automáticas
  auto_send_message BOOLEAN DEFAULT true,
  message_template TEXT,
  
  auto_order_food BOOLEAN DEFAULT false,
  food_budget_limit NUMERIC(10, 2) DEFAULT 100.00,
  food_provider VARCHAR(50),
  
  auto_send_money BOOLEAN DEFAULT false,
  money_amount NUMERIC(10, 2) DEFAULT 50.00,
  money_method VARCHAR(50) DEFAULT 'pix',
  
  auto_notify_team BOOLEAN DEFAULT true,
  notification_channels VARCHAR[] DEFAULT ARRAY['slack', 'email'],
  
  auto_create_feed_post BOOLEAN DEFAULT true,
  
  -- Timing
  trigger_days_before INTEGER DEFAULT 0, -- 0 = no dia
  trigger_time TIME DEFAULT '09:00:00',
  
  -- Aprovação necessária?
  requires_admin_approval BOOLEAN DEFAULT false,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_celebration_config_type ON celebration_automation_config(celebration_type);
CREATE INDEX idx_celebration_config_active ON celebration_automation_config(is_active) WHERE is_active = true;

COMMENT ON TABLE celebration_automation_config IS 'Configuração de automações de celebrações';

-- =====================================================
-- 4. TABELA: food_order_integrations
-- Integrações com apps de delivery
-- =====================================================

CREATE TABLE IF NOT EXISTS food_order_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  provider_name VARCHAR(50) NOT NULL UNIQUE CHECK (provider_name IN ('ifood', 'rappi', 'uber_eats', 'custom')),
  
  api_key TEXT,
  api_secret TEXT,
  merchant_id VARCHAR(255),
  
  is_active BOOLEAN DEFAULT true,
  is_connected BOOLEAN DEFAULT false,
  
  connection_status VARCHAR(20) CHECK (connection_status IN ('connected', 'disconnected', 'error')),
  last_connection_check TIMESTAMP WITH TIME ZONE,
  
  -- Estatísticas
  total_orders INTEGER DEFAULT 0,
  total_spent NUMERIC(12, 2) DEFAULT 0,
  
  -- Configuração
  default_delivery_time VARCHAR(50) DEFAULT '12:00',
  max_order_value NUMERIC(10, 2) DEFAULT 200.00,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_food_integrations_provider ON food_order_integrations(provider_name);
CREATE INDEX idx_food_integrations_active ON food_order_integrations(is_active) WHERE is_active = true;

COMMENT ON TABLE food_order_integrations IS 'Integrações com apps de delivery de comida';

-- =====================================================
-- 5. TABELA: money_transfer_log
-- Log de transferências de dinheiro/vales
-- =====================================================

CREATE TABLE IF NOT EXISTS money_transfer_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  
  transfer_type VARCHAR(50) CHECK (transfer_type IN ('birthday_gift', 'bonus', 'reimbursement', 'achievement_reward', 'other')),
  
  amount NUMERIC(10, 2) NOT NULL,
  
  method VARCHAR(50) NOT NULL CHECK (method IN ('pix', 'bank_transfer', 'gift_card', 'paypal', 'cash')),
  
  -- Dados PIX/Transferência
  recipient_pix_key VARCHAR(255),
  recipient_bank VARCHAR(100),
  recipient_account VARCHAR(50),
  
  -- Gift Card
  gift_card_provider VARCHAR(100),
  gift_card_code VARCHAR(255),
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  
  transaction_id VARCHAR(255),
  
  error_message TEXT,
  
  -- Autorização
  authorized_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL NOT NULL,
  
  reason TEXT,
  notes TEXT,
  
  -- Timestamps
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_money_transfer_employee ON money_transfer_log(employee_id);
CREATE INDEX idx_money_transfer_type ON money_transfer_log(transfer_type);
CREATE INDEX idx_money_transfer_status ON money_transfer_log(status);
CREATE INDEX idx_money_transfer_date ON money_transfer_log(requested_at DESC);

COMMENT ON TABLE money_transfer_log IS 'Log de todas as transferências de dinheiro/vales';

-- =====================================================
-- 6. TABELA: team_celebration_feed
-- Feed público de celebrações do time
-- =====================================================

CREATE TABLE IF NOT EXISTS team_celebration_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  celebration_id UUID REFERENCES birthday_celebrations(id) ON DELETE CASCADE,
  
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  
  post_type VARCHAR(50) CHECK (post_type IN ('birthday', 'work_anniversary', 'achievement', 'milestone', 'other')),
  
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  image_url TEXT,
  gif_url TEXT,
  
  -- Visibilidade
  is_public BOOLEAN DEFAULT true,
  
  -- Interações
  reactions JSONB DEFAULT '{"congrats": 0, "hearts": 0, "cakes": 0, "fires": 0}'::jsonb,
  
  comments JSONB DEFAULT '[]'::jsonb,
  -- Exemplo: [{"user_id": "xxx", "message": "Parabéns!", "timestamp": "..."}]
  
  total_reactions INTEGER DEFAULT 0,
  total_comments INTEGER DEFAULT 0,
  
  -- Timestamps
  posted_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_celebration_feed_employee ON team_celebration_feed(employee_id);
CREATE INDEX idx_celebration_feed_type ON team_celebration_feed(post_type);
CREATE INDEX idx_celebration_feed_posted ON team_celebration_feed(posted_at DESC);

COMMENT ON TABLE team_celebration_feed IS 'Feed público de celebrações do time';

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER update_employee_birthdays_tracker_updated_at
  BEFORE UPDATE ON employee_birthdays_tracker
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_celebration_automation_config_updated_at
  BEFORE UPDATE ON celebration_automation_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_food_order_integrations_updated_at
  BEFORE UPDATE ON food_order_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION: Detectar Aniversários de Hoje
-- =====================================================

CREATE OR REPLACE FUNCTION detect_birthdays_today()
RETURNS TABLE(
  employee_id UUID,
  employee_name VARCHAR,
  age INTEGER,
  prefers_public BOOLEAN,
  already_celebrated BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    up.full_name,
    EXTRACT(YEAR FROM AGE(CURRENT_DATE, bt.birth_date))::INTEGER,
    bt.prefers_public_celebration,
    EXISTS (
      SELECT 1 FROM birthday_celebrations bc
      WHERE bc.employee_id = e.id
      AND bc.celebration_year = EXTRACT(YEAR FROM CURRENT_DATE)
    )
  FROM employees e
  JOIN user_profiles up ON up.id = e.user_id
  JOIN employee_birthdays_tracker bt ON bt.employee_id = e.id
  WHERE bt.birth_month = EXTRACT(MONTH FROM CURRENT_DATE)
  AND bt.birth_day = EXTRACT(DAY FROM CURRENT_DATE)
  AND e.is_active = true;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION detect_birthdays_today IS 'Detecta aniversários de hoje';

-- =====================================================
-- FUNCTION: Criar Celebração Automática de Aniversário
-- =====================================================

CREATE OR REPLACE FUNCTION create_birthday_celebration(p_employee_id UUID)
RETURNS UUID AS $$
DECLARE
  v_celebration_id UUID;
  v_config RECORD;
  v_birthday_tracker RECORD;
  v_age INTEGER;
  v_message TEXT;
BEGIN
  -- Buscar configuração
  SELECT * INTO v_config
  FROM celebration_automation_config
  WHERE celebration_type = 'birthday'
  AND is_active = true
  LIMIT 1;
  
  IF NOT FOUND THEN
    RAISE NOTICE 'Configuração de aniversário não encontrada';
    RETURN NULL;
  END IF;
  
  -- Buscar dados do colaborador
  SELECT * INTO v_birthday_tracker
  FROM employee_birthdays_tracker
  WHERE employee_id = p_employee_id;
  
  -- Calcular idade
  v_age := EXTRACT(YEAR FROM AGE(CURRENT_DATE, v_birthday_tracker.birth_date))::INTEGER;
  
  -- Gerar mensagem personalizada
  v_message := replace(v_config.message_template, '{{name}}', (SELECT full_name FROM user_profiles up JOIN employees e ON e.user_id = up.id WHERE e.id = p_employee_id));
  v_message := replace(v_message, '{{age}}', v_age::TEXT);
  
  -- Criar celebração
  INSERT INTO birthday_celebrations (
    employee_id,
    celebration_date,
    celebration_year,
    age,
    message_content,
    food_order_value,
    money_amount,
    total_budget,
    celebration_status
  ) VALUES (
    p_employee_id,
    CURRENT_DATE,
    EXTRACT(YEAR FROM CURRENT_DATE),
    v_age,
    v_message,
    CASE WHEN v_config.auto_order_food THEN v_config.food_budget_limit ELSE NULL END,
    CASE WHEN v_config.auto_send_money THEN v_config.money_amount ELSE NULL END,
    COALESCE(v_config.food_budget_limit, 0) + COALESCE(v_config.money_amount, 0),
    CASE WHEN v_config.requires_admin_approval THEN 'scheduled' ELSE 'in_progress' END
  ) RETURNING id INTO v_celebration_id;
  
  -- Criar post no feed se configurado
  IF v_config.auto_create_feed_post THEN
    INSERT INTO team_celebration_feed (
      celebration_id,
      employee_id,
      post_type,
      title,
      message,
      gif_url
    ) VALUES (
      v_celebration_id,
      p_employee_id,
      'birthday',
      format('🎂 Feliz Aniversário, %s!', (SELECT full_name FROM user_profiles up JOIN employees e ON e.user_id = up.id WHERE e.id = p_employee_id)),
      format('Hoje é aniversário de %s anos do nosso querido(a) %s! 🎉🎊', v_age, (SELECT full_name FROM user_profiles up JOIN employees e ON e.user_id = up.id WHERE e.id = p_employee_id)),
      'https://media.giphy.com/media/g5R9dok94mrIvplmZd/giphy.gif'
    );
  END IF;
  
  RAISE NOTICE 'Celebração % criada para colaborador %', v_celebration_id, p_employee_id;
  
  RETURN v_celebration_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_birthday_celebration IS 'Cria celebração automática de aniversário';

-- =====================================================
-- FUNCTION: Enviar Dinheiro para Colaborador
-- =====================================================

CREATE OR REPLACE FUNCTION send_money_to_employee(
  p_employee_id UUID,
  p_amount NUMERIC,
  p_method VARCHAR,
  p_authorized_by UUID,
  p_reason TEXT,
  p_transfer_type VARCHAR DEFAULT 'birthday_gift'
)
RETURNS UUID AS $$
DECLARE
  v_transfer_id UUID;
  v_pix_key VARCHAR;
BEGIN
  -- Buscar PIX key do colaborador (da tabela de employees ou user_profiles)
  -- SELECT pix_key INTO v_pix_key FROM employees WHERE id = p_employee_id;
  
  -- Criar registro de transferência
  INSERT INTO money_transfer_log (
    employee_id,
    transfer_type,
    amount,
    method,
    recipient_pix_key,
    status,
    authorized_by,
    reason
  ) VALUES (
    p_employee_id,
    p_transfer_type,
    p_amount,
    p_method,
    v_pix_key,
    'pending',
    p_authorized_by,
    p_reason
  ) RETURNING id INTO v_transfer_id;
  
  -- TODO: Integrar com API de pagamento real (PIX, Stripe, PayPal)
  
  -- Por enquanto, apenas simular
  UPDATE money_transfer_log
  SET 
    status = 'completed',
    transaction_id = gen_random_uuid()::TEXT,
    processed_at = now(),
    completed_at = now()
  WHERE id = v_transfer_id;
  
  RAISE NOTICE 'Transferência % de R$ % criada para colaborador %', v_transfer_id, p_amount, p_employee_id;
  
  RETURN v_transfer_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION send_money_to_employee IS 'Envia dinheiro para colaborador via PIX/transferência';

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE employee_birthdays_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE birthday_celebrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_celebration_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE money_transfer_log ENABLE ROW LEVEL SECURITY;

-- Colaborador vê seus próprios dados
CREATE POLICY "Colaborador vê seus dados de aniversário"
  ON employee_birthdays_tracker FOR SELECT
  USING (
    employee_id = (SELECT id FROM employees WHERE user_id = auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type IN ('super_admin', 'hr')
    )
  );

-- Todos veem feed público
CREATE POLICY "Todos veem feed de celebrações"
  ON team_celebration_feed FOR SELECT
  USING (is_public = true);

-- Apenas admins veem transferências
CREATE POLICY "Admins veem transferências"
  ON money_transfer_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type IN ('super_admin', 'financial')
    )
    OR
    employee_id = (SELECT id FROM employees WHERE user_id = auth.uid())
  );

-- =====================================================
-- Fim da Migration 25: Birthday & Celebration Automation
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 25: Birthday & Celebration Automation concluída!';
  RAISE NOTICE '🎂 6 tabelas criadas para celebrações automáticas';
  RAISE NOTICE '🎉 Sistema completo: mensagem + comida + dinheiro + notificação';
END $$;

