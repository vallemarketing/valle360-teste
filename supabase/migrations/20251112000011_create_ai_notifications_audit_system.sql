-- =====================================================
-- MIGRATION: Sistemas de IA, Notificações e Auditoria
-- Descrição: IA/recomendações, notificações em tempo real e logs de auditoria
-- Dependências: Todas as migrations anteriores
-- =====================================================

-- =====================================================
-- SISTEMA DE IA
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  target_type VARCHAR(50) NOT NULL CHECK (target_type IN ('client', 'employee', 'project', 'campaign', 'content', 'general')),
  target_id UUID,
  
  recommendation_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  confidence_score NUMERIC(3, 2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  
  action_items JSONB DEFAULT '[]'::jsonb,
  expected_impact TEXT,
  
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'implemented', 'expired')),
  
  created_by_ai_model VARCHAR(50),
  feedback_score INTEGER CHECK (feedback_score >= 1 AND feedback_score <= 5),
  feedback_text TEXT,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  acted_on_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_ai_recommendations_target ON ai_recommendations(target_type, target_id);
CREATE INDEX idx_ai_recommendations_status ON ai_recommendations(status);
CREATE INDEX idx_ai_recommendations_priority ON ai_recommendations(priority);
CREATE INDEX idx_ai_recommendations_created ON ai_recommendations(created_at DESC);

CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  
  conversation_title VARCHAR(255),
  context_type VARCHAR(50),
  
  messages JSONB DEFAULT '[]'::jsonb,
  
  is_active BOOLEAN DEFAULT true,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_ai_conversations_user ON ai_conversations(user_id);
CREATE INDEX idx_ai_conversations_client ON ai_conversations(client_id);
CREATE INDEX idx_ai_conversations_active ON ai_conversations(is_active) WHERE is_active = true;

CREATE TABLE IF NOT EXISTS ai_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  prompt_category VARCHAR(50) NOT NULL,
  prompt_name VARCHAR(100) NOT NULL,
  prompt_template TEXT NOT NULL,
  
  description TEXT,
  variables JSONB DEFAULT '[]'::jsonb,
  
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_ai_prompts_category ON ai_prompts(prompt_category);
CREATE INDEX idx_ai_prompts_active ON ai_prompts(is_active) WHERE is_active = true;

CREATE TABLE IF NOT EXISTS ai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  recommendation_id UUID REFERENCES ai_recommendations(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE,
  
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL NOT NULL,
  
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  
  is_helpful BOOLEAN,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_ai_feedback_recommendation ON ai_feedback(recommendation_id);
CREATE INDEX idx_ai_feedback_conversation ON ai_feedback(conversation_id);

-- =====================================================
-- SISTEMA DE NOTIFICAÇÕES
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  recipient_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  
  notification_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  related_entity_type VARCHAR(50),
  related_entity_id UUID,
  
  action_url TEXT,
  action_label VARCHAR(100),
  
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  
  is_archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMP WITH TIME ZONE,
  
  channels JSONB DEFAULT '["system"]'::jsonb,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX idx_notifications_unread ON notifications(recipient_id, is_read, created_at DESC) WHERE is_read = false;
CREATE INDEX idx_notifications_type ON notifications(notification_type);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  email_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  whatsapp_enabled BOOLEAN DEFAULT false,
  
  notification_types JSONB DEFAULT '{}'::jsonb,
  
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  quiet_hours_enabled BOOLEAN DEFAULT false,
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- =====================================================
-- SISTEMA DE AUDITORIA
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  
  changes JSONB DEFAULT '{}'::jsonb,
  old_values JSONB,
  new_values JSONB,
  
  ip_address INET,
  user_agent TEXT,
  
  status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'failed', 'error')),
  error_message TEXT,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL NOT NULL,
  
  activity_type VARCHAR(50) NOT NULL,
  activity_description TEXT NOT NULL,
  
  related_entity_type VARCHAR(50),
  related_entity_id UUID,
  
  ip_address INET,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_type ON activity_logs(activity_type);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at DESC);

-- =====================================================
-- GAMIFICAÇÃO
-- =====================================================

CREATE TABLE IF NOT EXISTS client_gamification_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  total_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  
  engagement_score NUMERIC(5, 2) DEFAULT 0.00,
  satisfaction_score NUMERIC(5, 2) DEFAULT 0.00,
  growth_score NUMERIC(5, 2) DEFAULT 0.00,
  
  badges JSONB DEFAULT '[]'::jsonb,
  achievements JSONB DEFAULT '[]'::jsonb,
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS employee_gamification_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  total_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  
  productivity_score NUMERIC(5, 2) DEFAULT 0.00,
  quality_score NUMERIC(5, 2) DEFAULT 0.00,
  collaboration_score NUMERIC(5, 2) DEFAULT 0.00,
  
  badges JSONB DEFAULT '[]'::jsonb,
  achievements JSONB DEFAULT '[]'::jsonb,
  
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS gamification_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  achievement_name VARCHAR(100) NOT NULL UNIQUE,
  achievement_description TEXT NOT NULL,
  achievement_type VARCHAR(50) CHECK (achievement_type IN ('client', 'employee', 'both')),
  
  icon VARCHAR(100),
  points_awarded INTEGER DEFAULT 0,
  
  criteria JSONB NOT NULL,
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- =====================================================
-- CONFIGURAÇÕES DO SISTEMA
-- =====================================================

CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  
  setting_category VARCHAR(50),
  setting_description TEXT,
  
  is_public BOOLEAN DEFAULT false,
  
  updated_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_system_settings_category ON system_settings(setting_category);

-- =====================================================
-- INTEGRAÇÕES
-- =====================================================

CREATE TABLE IF NOT EXISTS system_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  integration_name VARCHAR(100) NOT NULL,
  integration_type VARCHAR(50) NOT NULL,
  
  is_enabled BOOLEAN DEFAULT false,
  
  api_key_encrypted TEXT,
  api_secret_encrypted TEXT,
  
  configuration JSONB DEFAULT '{}'::jsonb,
  
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_status VARCHAR(20) CHECK (sync_status IN ('success', 'failed', 'in_progress', 'never_synced')),
  sync_error TEXT,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_system_integrations_enabled ON system_integrations(is_enabled) WHERE is_enabled = true;

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER update_ai_conversations_updated_at
  BEFORE UPDATE ON ai_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_gamification_scores_updated_at
  BEFORE UPDATE ON client_gamification_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_gamification_scores_updated_at
  BEFORE UPDATE ON employee_gamification_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Usuários veem suas próprias notificações
CREATE POLICY "Ver próprias notificações"
  ON notifications FOR SELECT
  USING (recipient_id = auth.uid());

-- Usuários atualizam suas notificações
CREATE POLICY "Atualizar próprias notificações"
  ON notifications FOR UPDATE
  USING (recipient_id = auth.uid());

-- Usuários veem suas preferências
CREATE POLICY "Ver próprias preferências"
  ON notification_preferences FOR ALL
  USING (user_id = auth.uid());

-- Admins veem logs de auditoria
CREATE POLICY "Admins veem audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type = 'super_admin'
      AND user_profiles.is_active = true
    )
  );

-- Usuários veem seu próprio histórico
CREATE POLICY "Ver próprio histórico"
  ON activity_logs FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type = 'super_admin'
    )
  );

-- =====================================================
-- Fim da Migration: IA, Notificações e Auditoria
-- =====================================================

