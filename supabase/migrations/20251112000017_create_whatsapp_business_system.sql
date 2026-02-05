-- =====================================================
-- MIGRATION: WhatsApp Business Integration
-- Descrição: Sistema completo de WhatsApp com bot, campanhas e analytics
-- Dependências: 20251112000002_create_clients_system.sql
-- =====================================================

-- =====================================================
-- 1. TABELA: whatsapp_numbers
-- Números de WhatsApp Business conectados
-- =====================================================

CREATE TABLE IF NOT EXISTS whatsapp_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  phone_number VARCHAR(20) NOT NULL UNIQUE,
  phone_number_id VARCHAR(100) UNIQUE NOT NULL,
  
  display_name VARCHAR(255),
  
  business_account_id VARCHAR(100) NOT NULL,
  
  access_token_encrypted TEXT NOT NULL,
  
  webhook_url TEXT,
  webhook_verify_token TEXT,
  
  status VARCHAR(20) DEFAULT 'connected' CHECK (status IN ('connected', 'disconnected', 'pending', 'error')),
  
  quality_rating VARCHAR(20) CHECK (quality_rating IN ('green', 'yellow', 'red', 'unknown')),
  
  message_limit_tier VARCHAR(20) DEFAULT 'tier_1',
  messaging_limit INTEGER DEFAULT 1000,
  
  last_sync_at TIMESTAMP WITH TIME ZONE,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_whatsapp_numbers_phone ON whatsapp_numbers(phone_number);
CREATE INDEX idx_whatsapp_numbers_status ON whatsapp_numbers(status);

COMMENT ON TABLE whatsapp_numbers IS 'Números de WhatsApp Business conectados';

-- =====================================================
-- 2. TABELA: whatsapp_business_profiles
-- Perfis empresariais do WhatsApp
-- =====================================================

CREATE TABLE IF NOT EXISTS whatsapp_business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  whatsapp_number_id UUID REFERENCES whatsapp_numbers(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  business_name VARCHAR(255) NOT NULL,
  business_description TEXT,
  
  category VARCHAR(100),
  
  address TEXT,
  email VARCHAR(255),
  websites TEXT[],
  
  profile_picture_url TEXT,
  
  business_hours JSONB DEFAULT '{}'::jsonb,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_whatsapp_business_profiles_number ON whatsapp_business_profiles(whatsapp_number_id);

COMMENT ON TABLE whatsapp_business_profiles IS 'Perfis de negócio do WhatsApp';

-- =====================================================
-- 3. TABELA: whatsapp_conversations
-- Conversas do WhatsApp
-- =====================================================

CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  whatsapp_number_id UUID REFERENCES whatsapp_numbers(id) ON DELETE CASCADE NOT NULL,
  
  contact_phone VARCHAR(20) NOT NULL,
  contact_name VARCHAR(255),
  
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  user_profile_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'closed', 'archived')),
  
  assigned_to UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  last_message_at TIMESTAMP WITH TIME ZONE,
  last_message_preview TEXT,
  
  unread_count INTEGER DEFAULT 0,
  
  tags JSONB DEFAULT '[]'::jsonb,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  UNIQUE(whatsapp_number_id, contact_phone)
);

CREATE INDEX idx_whatsapp_conversations_number ON whatsapp_conversations(whatsapp_number_id);
CREATE INDEX idx_whatsapp_conversations_contact ON whatsapp_conversations(contact_phone);
CREATE INDEX idx_whatsapp_conversations_client ON whatsapp_conversations(client_id);
CREATE INDEX idx_whatsapp_conversations_status ON whatsapp_conversations(status);
CREATE INDEX idx_whatsapp_conversations_assigned ON whatsapp_conversations(assigned_to);
CREATE INDEX idx_whatsapp_conversations_last_message ON whatsapp_conversations(last_message_at DESC NULLS LAST);

COMMENT ON TABLE whatsapp_conversations IS 'Conversas individuais do WhatsApp';

-- =====================================================
-- 4. TABELA: whatsapp_messages
-- Mensagens do WhatsApp
-- =====================================================

CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  conversation_id UUID REFERENCES whatsapp_conversations(id) ON DELETE CASCADE NOT NULL,
  
  message_id_external VARCHAR(255) UNIQUE,
  
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  
  from_phone VARCHAR(20) NOT NULL,
  to_phone VARCHAR(20) NOT NULL,
  
  message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('text', 'image', 'video', 'audio', 'document', 'location', 'contact', 'template', 'interactive', 'reaction', 'sticker')),
  
  content TEXT,
  
  media_url TEXT,
  media_mime_type VARCHAR(100),
  media_caption TEXT,
  
  template_name VARCHAR(100),
  template_language VARCHAR(10),
  template_parameters JSONB,
  
  location_latitude NUMERIC(10, 8),
  location_longitude NUMERIC(11, 8),
  location_name VARCHAR(255),
  location_address TEXT,
  
  contact_data JSONB,
  
  interactive_type VARCHAR(20) CHECK (interactive_type IN ('button', 'list', 'product', 'product_list')),
  interactive_data JSONB,
  
  reply_to_message_id UUID REFERENCES whatsapp_messages(id) ON DELETE SET NULL,
  
  status VARCHAR(20) DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'delivered', 'read', 'failed')),
  
  error_code VARCHAR(50),
  error_message TEXT,
  
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_whatsapp_messages_conversation ON whatsapp_messages(conversation_id);
CREATE INDEX idx_whatsapp_messages_external_id ON whatsapp_messages(message_id_external);
CREATE INDEX idx_whatsapp_messages_direction ON whatsapp_messages(direction);
CREATE INDEX idx_whatsapp_messages_status ON whatsapp_messages(status);
CREATE INDEX idx_whatsapp_messages_created ON whatsapp_messages(created_at DESC);

COMMENT ON TABLE whatsapp_messages IS 'Mensagens do WhatsApp (enviadas e recebidas)';

-- =====================================================
-- 5. TABELA: whatsapp_message_templates
-- Templates aprovados pelo WhatsApp
-- =====================================================

CREATE TABLE IF NOT EXISTS whatsapp_message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  whatsapp_number_id UUID REFERENCES whatsapp_numbers(id) ON DELETE CASCADE NOT NULL,
  
  name VARCHAR(100) NOT NULL,
  
  language VARCHAR(10) NOT NULL,
  
  category VARCHAR(30) NOT NULL CHECK (category IN ('marketing', 'utility', 'authentication')),
  
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'disabled')),
  
  template_body TEXT NOT NULL,
  
  header_type VARCHAR(20) CHECK (header_type IN ('text', 'image', 'video', 'document', 'none')),
  header_content TEXT,
  
  footer_text TEXT,
  
  buttons JSONB DEFAULT '[]'::jsonb,
  
  variables JSONB DEFAULT '[]'::jsonb,
  
  rejection_reason TEXT,
  
  usage_count INTEGER DEFAULT 0,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  UNIQUE(whatsapp_number_id, name, language)
);

CREATE INDEX idx_whatsapp_templates_number ON whatsapp_message_templates(whatsapp_number_id);
CREATE INDEX idx_whatsapp_templates_status ON whatsapp_message_templates(status);
CREATE INDEX idx_whatsapp_templates_category ON whatsapp_message_templates(category);

COMMENT ON TABLE whatsapp_message_templates IS 'Templates de mensagens aprovados pelo WhatsApp';

-- =====================================================
-- 6. TABELA: whatsapp_quick_replies
-- Respostas rápidas
-- =====================================================

CREATE TABLE IF NOT EXISTS whatsapp_quick_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  shortcut VARCHAR(50) NOT NULL UNIQUE,
  
  message TEXT NOT NULL,
  
  category VARCHAR(50),
  
  variables JSONB DEFAULT '[]'::jsonb,
  
  usage_count INTEGER DEFAULT 0,
  
  is_active BOOLEAN DEFAULT true,
  
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_whatsapp_quick_replies_shortcut ON whatsapp_quick_replies(shortcut);
CREATE INDEX idx_whatsapp_quick_replies_category ON whatsapp_quick_replies(category);

COMMENT ON TABLE whatsapp_quick_replies IS 'Respostas rápidas para agilizar atendimento';

-- =====================================================
-- 7. TABELA: whatsapp_contact_lists
-- Listas de contatos para campanhas
-- =====================================================

CREATE TABLE IF NOT EXISTS whatsapp_contact_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  contact_count INTEGER DEFAULT 0,
  
  filters JSONB DEFAULT '{}'::jsonb,
  
  is_dynamic BOOLEAN DEFAULT false,
  
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_whatsapp_contact_lists_created_by ON whatsapp_contact_lists(created_by);

COMMENT ON TABLE whatsapp_contact_lists IS 'Listas de contatos para segmentação';

-- =====================================================
-- 8. TABELA: whatsapp_contact_list_members
-- Membros das listas de contatos
-- =====================================================

CREATE TABLE IF NOT EXISTS whatsapp_contact_list_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES whatsapp_contact_lists(id) ON DELETE CASCADE NOT NULL,
  
  phone_number VARCHAR(20) NOT NULL,
  name VARCHAR(255),
  
  custom_fields JSONB DEFAULT '{}'::jsonb,
  
  opt_in BOOLEAN DEFAULT true,
  opt_in_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  opt_out_date TIMESTAMP WITH TIME ZONE,
  
  added_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  UNIQUE(list_id, phone_number)
);

CREATE INDEX idx_whatsapp_contact_list_members_list ON whatsapp_contact_list_members(list_id);
CREATE INDEX idx_whatsapp_contact_list_members_phone ON whatsapp_contact_list_members(phone_number);

COMMENT ON TABLE whatsapp_contact_list_members IS 'Contatos individuais em cada lista';

-- =====================================================
-- 9. TABELA: whatsapp_campaigns
-- Campanhas de mensagens em massa
-- =====================================================

CREATE TABLE IF NOT EXISTS whatsapp_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name VARCHAR(255) NOT NULL,
  
  whatsapp_number_id UUID REFERENCES whatsapp_numbers(id) ON DELETE CASCADE NOT NULL,
  
  template_id UUID REFERENCES whatsapp_message_templates(id) ON DELETE SET NULL,
  
  contact_list_id UUID REFERENCES whatsapp_contact_lists(id) ON DELETE SET NULL,
  
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled', 'failed')),
  
  scheduled_for TIMESTAMP WITH TIME ZONE,
  
  total_recipients INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  messages_delivered INTEGER DEFAULT 0,
  messages_read INTEGER DEFAULT 0,
  messages_failed INTEGER DEFAULT 0,
  
  delivery_rate NUMERIC(5, 2) GENERATED ALWAYS AS (
    CASE 
      WHEN messages_sent > 0 THEN (messages_delivered::NUMERIC / messages_sent * 100)
      ELSE 0
    END
  ) STORED,
  
  read_rate NUMERIC(5, 2) GENERATED ALWAYS AS (
    CASE 
      WHEN messages_delivered > 0 THEN (messages_read::NUMERIC / messages_delivered * 100)
      ELSE 0
    END
  ) STORED,
  
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_whatsapp_campaigns_number ON whatsapp_campaigns(whatsapp_number_id);
CREATE INDEX idx_whatsapp_campaigns_status ON whatsapp_campaigns(status);
CREATE INDEX idx_whatsapp_campaigns_scheduled ON whatsapp_campaigns(scheduled_for) WHERE status = 'scheduled';

COMMENT ON TABLE whatsapp_campaigns IS 'Campanhas de mensagens em massa via WhatsApp';

-- =====================================================
-- 10. TABELA: whatsapp_campaign_messages
-- Mensagens individuais de campanhas
-- =====================================================

CREATE TABLE IF NOT EXISTS whatsapp_campaign_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES whatsapp_campaigns(id) ON DELETE CASCADE NOT NULL,
  
  phone_number VARCHAR(20) NOT NULL,
  name VARCHAR(255),
  
  message_id UUID REFERENCES whatsapp_messages(id) ON DELETE SET NULL,
  
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  
  template_variables JSONB DEFAULT '{}'::jsonb,
  
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  
  error_message TEXT,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_whatsapp_campaign_messages_campaign ON whatsapp_campaign_messages(campaign_id);
CREATE INDEX idx_whatsapp_campaign_messages_status ON whatsapp_campaign_messages(status);
CREATE INDEX idx_whatsapp_campaign_messages_phone ON whatsapp_campaign_messages(phone_number);

COMMENT ON TABLE whatsapp_campaign_messages IS 'Mensagens individuais enviadas em campanhas';

-- =====================================================
-- 11. TABELA: whatsapp_webhooks
-- Webhooks recebidos do WhatsApp
-- =====================================================

CREATE TABLE IF NOT EXISTS whatsapp_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  webhook_type VARCHAR(50) NOT NULL,
  
  payload JSONB NOT NULL,
  
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  
  error_message TEXT,
  
  received_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_whatsapp_webhooks_type ON whatsapp_webhooks(webhook_type);
CREATE INDEX idx_whatsapp_webhooks_processed ON whatsapp_webhooks(processed, received_at);
CREATE INDEX idx_whatsapp_webhooks_received ON whatsapp_webhooks(received_at DESC);

COMMENT ON TABLE whatsapp_webhooks IS 'Webhooks recebidos da API do WhatsApp';

-- =====================================================
-- 12. TABELA: whatsapp_analytics
-- Métricas e analytics do WhatsApp
-- =====================================================

CREATE TABLE IF NOT EXISTS whatsapp_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  whatsapp_number_id UUID REFERENCES whatsapp_numbers(id) ON DELETE CASCADE NOT NULL,
  
  date DATE NOT NULL,
  
  messages_sent INTEGER DEFAULT 0,
  messages_received INTEGER DEFAULT 0,
  messages_delivered INTEGER DEFAULT 0,
  messages_read INTEGER DEFAULT 0,
  messages_failed INTEGER DEFAULT 0,
  
  conversations_opened INTEGER DEFAULT 0,
  conversations_closed INTEGER DEFAULT 0,
  
  avg_response_time_seconds INTEGER,
  
  unique_contacts INTEGER DEFAULT 0,
  
  template_messages_sent INTEGER DEFAULT 0,
  
  cost_business_initiated NUMERIC(10, 2) DEFAULT 0.00,
  cost_user_initiated NUMERIC(10, 2) DEFAULT 0.00,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  UNIQUE(whatsapp_number_id, date)
);

CREATE INDEX idx_whatsapp_analytics_number ON whatsapp_analytics(whatsapp_number_id);
CREATE INDEX idx_whatsapp_analytics_date ON whatsapp_analytics(date DESC);

COMMENT ON TABLE whatsapp_analytics IS 'Métricas diárias de uso do WhatsApp';

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER update_whatsapp_numbers_updated_at
  BEFORE UPDATE ON whatsapp_numbers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_conversations_updated_at
  BEFORE UPDATE ON whatsapp_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_message_templates_updated_at
  BEFORE UPDATE ON whatsapp_message_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_quick_replies_updated_at
  BEFORE UPDATE ON whatsapp_quick_replies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_campaigns_updated_at
  BEFORE UPDATE ON whatsapp_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION: Atualizar last_message na conversa
-- =====================================================

CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE whatsapp_conversations
  SET 
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(COALESCE(NEW.content, ''), 100),
    unread_count = CASE 
      WHEN NEW.direction = 'inbound' THEN unread_count + 1
      ELSE unread_count
    END
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_last_message_trigger
  AFTER INSERT ON whatsapp_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

COMMENT ON FUNCTION update_conversation_last_message IS 'Atualiza última mensagem e contador de não lidas';

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE whatsapp_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_analytics ENABLE ROW LEVEL SECURITY;

-- Colaboradores gerenciam WhatsApp
CREATE POLICY "Colaboradores gerenciam WhatsApp"
  ON whatsapp_conversations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type NOT IN ('client')
      AND user_profiles.is_active = true
    )
  );

-- Clientes veem suas conversas
CREATE POLICY "Clientes veem suas conversas"
  ON whatsapp_conversations FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
    )
  );

-- Colaboradores veem todas as mensagens
CREATE POLICY "Colaboradores veem mensagens"
  ON whatsapp_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type NOT IN ('client')
    )
  );

-- Clientes veem mensagens de suas conversas
CREATE POLICY "Clientes veem suas mensagens"
  ON whatsapp_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM whatsapp_conversations wc
      JOIN user_profiles up ON up.client_id = wc.client_id
      WHERE wc.id = whatsapp_messages.conversation_id
      AND up.user_id = auth.uid()
    )
  );

-- =====================================================
-- Fim da Migration: WhatsApp Business
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration WhatsApp Business concluída com sucesso!';
  RAISE NOTICE '📊 12 tabelas criadas';
  RAISE NOTICE '💬 Sistema completo de WhatsApp implementado';
  RAISE NOTICE '🤖 Bot, campanhas e analytics prontos';
END $$;

