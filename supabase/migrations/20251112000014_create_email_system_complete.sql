-- =====================================================
-- MIGRATION: Sistema de Email Completo
-- Descrição: Templates, filas, logs, campanhas e tracking
-- Dependências: 20251112000001_create_user_system.sql
-- =====================================================

-- =====================================================
-- 1. TABELA: email_templates
-- Templates de emails reutilizáveis
-- =====================================================

CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  
  category VARCHAR(50) CHECK (category IN ('transactional', 'marketing', 'notification', 'system', 'custom')),
  
  subject_template TEXT NOT NULL,
  html_template TEXT NOT NULL,
  text_template TEXT,
  
  variables JSONB DEFAULT '[]'::jsonb,
  
  from_name VARCHAR(255),
  from_email VARCHAR(255),
  reply_to VARCHAR(255),
  
  is_active BOOLEAN DEFAULT true,
  
  preview_text TEXT,
  
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_email_templates_slug ON email_templates(slug);
CREATE INDEX idx_email_templates_category ON email_templates(category);
CREATE INDEX idx_email_templates_active ON email_templates(is_active) WHERE is_active = true;

COMMENT ON TABLE email_templates IS 'Templates de emails transacionais e marketing';

-- =====================================================
-- 2. TABELA: email_queue
-- Fila de emails para envio
-- =====================================================

CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  
  to_email VARCHAR(255) NOT NULL,
  to_name VARCHAR(255),
  
  cc_emails TEXT[],
  bcc_emails TEXT[],
  
  from_email VARCHAR(255) NOT NULL,
  from_name VARCHAR(255),
  reply_to VARCHAR(255),
  
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  text_body TEXT,
  
  variables JSONB DEFAULT '{}'::jsonb,
  
  attachments JSONB DEFAULT '[]'::jsonb,
  
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  
  status VARCHAR(20) DEFAULT 'queued' CHECK (status IN ('queued', 'sending', 'sent', 'failed', 'bounced', 'cancelled')),
  
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  
  error_message TEXT,
  
  related_entity_type VARCHAR(50),
  related_entity_id UUID,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_email_queue_status ON email_queue(status, scheduled_for);
CREATE INDEX idx_email_queue_to_email ON email_queue(to_email);
CREATE INDEX idx_email_queue_priority ON email_queue(priority DESC, scheduled_for);
CREATE INDEX idx_email_queue_created ON email_queue(created_at DESC);
CREATE INDEX idx_email_queue_scheduled ON email_queue(scheduled_for) WHERE status = 'queued';

COMMENT ON TABLE email_queue IS 'Fila de emails aguardando envio';

-- =====================================================
-- 3. TABELA: email_logs
-- Histórico completo de emails enviados
-- =====================================================

CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  email_queue_id UUID REFERENCES email_queue(id) ON DELETE SET NULL,
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  
  to_email VARCHAR(255) NOT NULL,
  from_email VARCHAR(255) NOT NULL,
  
  subject TEXT NOT NULL,
  
  status VARCHAR(20) NOT NULL CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'failed')),
  
  provider VARCHAR(50),
  provider_message_id TEXT,
  
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  first_click_at TIMESTAMP WITH TIME ZONE,
  
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  
  bounce_type VARCHAR(20),
  bounce_reason TEXT,
  
  complaint_feedback TEXT,
  
  user_agent TEXT,
  ip_address INET,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_email_logs_to_email ON email_logs(to_email);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_template ON email_logs(template_id);
CREATE INDEX idx_email_logs_sent ON email_logs(sent_at DESC);
CREATE INDEX idx_email_logs_opened ON email_logs(opened_at DESC) WHERE opened_at IS NOT NULL;

COMMENT ON TABLE email_logs IS 'Histórico e tracking de emails enviados';

-- =====================================================
-- 4. TABELA: email_campaigns
-- Campanhas de email marketing
-- =====================================================

CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  
  subject TEXT NOT NULL,
  preview_text TEXT,
  
  from_name VARCHAR(255),
  from_email VARCHAR(255),
  reply_to VARCHAR(255),
  
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled')),
  
  target_audience JSONB DEFAULT '{}'::jsonb,
  segment_filters JSONB DEFAULT '{}'::jsonb,
  
  scheduled_for TIMESTAMP WITH TIME ZONE,
  
  total_recipients INTEGER DEFAULT 0,
  emails_sent INTEGER DEFAULT 0,
  emails_delivered INTEGER DEFAULT 0,
  emails_opened INTEGER DEFAULT 0,
  emails_clicked INTEGER DEFAULT 0,
  emails_bounced INTEGER DEFAULT 0,
  emails_complained INTEGER DEFAULT 0,
  
  open_rate NUMERIC(5, 2) GENERATED ALWAYS AS (
    CASE 
      WHEN emails_delivered > 0 THEN (emails_opened::NUMERIC / emails_delivered * 100)
      ELSE 0
    END
  ) STORED,
  
  click_rate NUMERIC(5, 2) GENERATED ALWAYS AS (
    CASE 
      WHEN emails_delivered > 0 THEN (emails_clicked::NUMERIC / emails_delivered * 100)
      ELSE 0
    END
  ) STORED,
  
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX idx_email_campaigns_scheduled ON email_campaigns(scheduled_for) WHERE status = 'scheduled';
CREATE INDEX idx_email_campaigns_created ON email_campaigns(created_at DESC);

COMMENT ON TABLE email_campaigns IS 'Campanhas de email marketing';

-- =====================================================
-- 5. TABELA: email_campaign_recipients
-- Destinatários de cada campanha
-- =====================================================

CREATE TABLE IF NOT EXISTS email_campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE NOT NULL,
  
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  
  variables JSONB DEFAULT '{}'::jsonb,
  
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'unsubscribed')),
  
  email_queue_id UUID REFERENCES email_queue(id) ON DELETE SET NULL,
  
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  UNIQUE(campaign_id, email)
);

CREATE INDEX idx_email_campaign_recipients_campaign ON email_campaign_recipients(campaign_id);
CREATE INDEX idx_email_campaign_recipients_status ON email_campaign_recipients(status);
CREATE INDEX idx_email_campaign_recipients_email ON email_campaign_recipients(email);

COMMENT ON TABLE email_campaign_recipients IS 'Lista de destinatários por campanha';

-- =====================================================
-- 6. TABELA: email_subscribers
-- Base de assinantes para newsletters
-- =====================================================

CREATE TABLE IF NOT EXISTS email_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced', 'complained')),
  
  subscription_source VARCHAR(50),
  
  tags JSONB DEFAULT '[]'::jsonb,
  custom_fields JSONB DEFAULT '{}'::jsonb,
  
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  unsubscribe_reason TEXT,
  
  confirmed BOOLEAN DEFAULT false,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  
  bounce_count INTEGER DEFAULT 0,
  
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_email_subscribers_email ON email_subscribers(email);
CREATE INDEX idx_email_subscribers_status ON email_subscribers(status);
CREATE INDEX idx_email_subscribers_tags ON email_subscribers USING gin(tags);

COMMENT ON TABLE email_subscribers IS 'Base de assinantes de email marketing';

-- =====================================================
-- 7. TABELA: email_unsubscribes
-- Histórico de cancelamentos de inscrição
-- =====================================================

CREATE TABLE IF NOT EXISTS email_unsubscribes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  email VARCHAR(255) NOT NULL,
  
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE SET NULL,
  
  reason VARCHAR(50),
  feedback TEXT,
  
  ip_address INET,
  user_agent TEXT,
  
  unsubscribed_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_email_unsubscribes_email ON email_unsubscribes(email);
CREATE INDEX idx_email_unsubscribes_campaign ON email_unsubscribes(campaign_id);
CREATE INDEX idx_email_unsubscribes_unsubscribed ON email_unsubscribes(unsubscribed_at DESC);

COMMENT ON TABLE email_unsubscribes IS 'Registro de cancelamentos de inscrição';

-- =====================================================
-- 8. TABELA: email_bounces
-- Registro de emails que retornaram
-- =====================================================

CREATE TABLE IF NOT EXISTS email_bounces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  email VARCHAR(255) NOT NULL,
  
  bounce_type VARCHAR(20) CHECK (bounce_type IN ('hard', 'soft', 'complaint')),
  bounce_reason TEXT,
  
  diagnostic_code TEXT,
  
  email_log_id UUID REFERENCES email_logs(id) ON DELETE SET NULL,
  
  is_permanent BOOLEAN DEFAULT false,
  
  bounced_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_email_bounces_email ON email_bounces(email);
CREATE INDEX idx_email_bounces_type ON email_bounces(bounce_type);
CREATE INDEX idx_email_bounces_bounced ON email_bounces(bounced_at DESC);
CREATE INDEX idx_email_bounces_permanent ON email_bounces(email, is_permanent) WHERE is_permanent = true;

COMMENT ON TABLE email_bounces IS 'Registro de bounces para gerenciar reputação';

-- =====================================================
-- 9. TABELA: email_link_tracking
-- Tracking de cliques em links
-- =====================================================

CREATE TABLE IF NOT EXISTS email_link_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  email_log_id UUID REFERENCES email_logs(id) ON DELETE CASCADE NOT NULL,
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE SET NULL,
  
  original_url TEXT NOT NULL,
  tracked_url TEXT NOT NULL,
  
  click_count INTEGER DEFAULT 0,
  unique_clicks INTEGER DEFAULT 0,
  
  first_clicked_at TIMESTAMP WITH TIME ZONE,
  last_clicked_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_email_link_tracking_email_log ON email_link_tracking(email_log_id);
CREATE INDEX idx_email_link_tracking_campaign ON email_link_tracking(campaign_id);
CREATE INDEX idx_email_link_tracking_url ON email_link_tracking(original_url);

COMMENT ON TABLE email_link_tracking IS 'Tracking de cliques em links dos emails';

-- =====================================================
-- 10. TABELA: email_link_clicks
-- Cliques individuais em links
-- =====================================================

CREATE TABLE IF NOT EXISTS email_link_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  link_tracking_id UUID REFERENCES email_link_tracking(id) ON DELETE CASCADE NOT NULL,
  
  ip_address INET,
  user_agent TEXT,
  
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_email_link_clicks_link ON email_link_clicks(link_tracking_id);
CREATE INDEX idx_email_link_clicks_clicked ON email_link_clicks(clicked_at DESC);

COMMENT ON TABLE email_link_clicks IS 'Registro individual de cada clique em links';

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_campaigns_updated_at
  BEFORE UPDATE ON email_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION: Enfileirar email
-- =====================================================

CREATE OR REPLACE FUNCTION queue_email(
  p_to_email VARCHAR,
  p_to_name VARCHAR,
  p_template_slug VARCHAR,
  p_variables JSONB DEFAULT '{}'::jsonb,
  p_scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT now(),
  p_priority INTEGER DEFAULT 5
)
RETURNS UUID AS $$
DECLARE
  v_template RECORD;
  v_queue_id UUID;
  v_subject TEXT;
  v_html TEXT;
BEGIN
  -- Buscar template
  SELECT * INTO v_template
  FROM email_templates
  WHERE slug = p_template_slug AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template % não encontrado', p_template_slug;
  END IF;
  
  -- Substituir variáveis no subject
  v_subject := v_template.subject_template;
  v_html := v_template.html_template;
  
  -- TODO: Implementar substituição de variáveis
  
  -- Inserir na fila
  INSERT INTO email_queue (
    template_id,
    to_email,
    to_name,
    from_email,
    from_name,
    reply_to,
    subject,
    html_body,
    variables,
    scheduled_for,
    priority
  ) VALUES (
    v_template.id,
    p_to_email,
    p_to_name,
    v_template.from_email,
    v_template.from_name,
    v_template.reply_to,
    v_subject,
    v_html,
    p_variables,
    p_scheduled_for,
    p_priority
  ) RETURNING id INTO v_queue_id;
  
  RETURN v_queue_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION queue_email IS 'Enfileira um email para envio usando template';

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_subscribers ENABLE ROW LEVEL SECURITY;

-- Colaboradores gerenciam templates
CREATE POLICY "Colaboradores gerenciam templates"
  ON email_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type IN ('super_admin', 'marketing_head')
    )
  );

-- Colaboradores veem fila de emails
CREATE POLICY "Colaboradores veem fila"
  ON email_queue FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type NOT IN ('client')
    )
  );

-- Colaboradores veem logs
CREATE POLICY "Colaboradores veem logs"
  ON email_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type NOT IN ('client')
    )
  );

-- =====================================================
-- Fim da Migration: Email System
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration Email System concluída com sucesso!';
  RAISE NOTICE '📊 10 tabelas criadas';
  RAISE NOTICE '📧 Sistema completo de emails implementado';
END $$;

