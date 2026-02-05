-- =====================================================
-- MIGRATION: Sistema de Usuários e Autenticação
-- Descrição: Tabelas principais de usuários, perfis, preferências e sessões
-- Dependências: Nenhuma (primeira migration)
-- =====================================================

-- =====================================================
-- 1. TABELA: user_profiles
-- Perfis de usuários do sistema (colaboradores e clientes)
-- =====================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Informações básicas
  full_name VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  avatar_url TEXT,
  
  -- Tipo de usuário e permissões
  user_type VARCHAR(50) NOT NULL CHECK (user_type IN (
    'super_admin', 'client', 'video_maker', 'web_designer', 
    'graphic_designer', 'social_media', 'traffic_manager', 
    'marketing_head', 'financial', 'hr', 'commercial'
  )),
  is_active BOOLEAN DEFAULT true NOT NULL,
  
  -- Relacionamentos (serão preenchidos depois)
  client_id UUID,
  employee_id UUID,
  
  -- Dados profissionais (para colaboradores)
  hire_date DATE,
  department VARCHAR(100),
  position VARCHAR(100),
  salary DECIMAL(10, 2),
  
  -- Gamificação
  current_streak INTEGER DEFAULT 0,
  total_goals_hit INTEGER DEFAULT 0,
  total_goals_missed INTEGER DEFAULT 0,
  warning_count INTEGER DEFAULT 0,
  last_warning_date TIMESTAMP WITH TIME ZONE,
  
  -- Preferências
  theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
  language VARCHAR(10) DEFAULT 'pt' CHECK (language IN ('pt', 'en', 'es')),
  timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
  
  -- Notificações
  email_notifications BOOLEAN DEFAULT true,
  whatsapp_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_type ON user_profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_user_profiles_client_id ON user_profiles(client_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_employee_id ON user_profiles(employee_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON user_profiles(is_active) WHERE is_active = true;

-- Comentários
COMMENT ON TABLE user_profiles IS 'Perfis de usuários do sistema (colaboradores e clientes)';
COMMENT ON COLUMN user_profiles.user_type IS 'Tipo de usuário: super_admin, client, video_maker, etc';
COMMENT ON COLUMN user_profiles.client_id IS 'Referência ao cliente (se user_type = client)';
COMMENT ON COLUMN user_profiles.employee_id IS 'Referência ao colaborador (se não for client)';

-- =====================================================
-- 2. TABELA: user_preferences
-- Preferências detalhadas de notificações e personalização
-- =====================================================

CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Tema e aparência
  theme_mode VARCHAR(20) DEFAULT 'light' CHECK (theme_mode IN ('light', 'dark', 'auto')),
  language VARCHAR(10) DEFAULT 'pt' CHECK (language IN ('pt', 'en', 'es')),
  font_size VARCHAR(20) DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large')),
  
  -- Notificações específicas
  notifications_new_content BOOLEAN DEFAULT true,
  notifications_messages BOOLEAN DEFAULT true,
  notifications_reports BOOLEAN DEFAULT true,
  notifications_credits BOOLEAN DEFAULT true,
  notifications_system BOOLEAN DEFAULT true,
  
  -- Frequência de emails
  email_frequency VARCHAR(20) DEFAULT 'daily' CHECK (email_frequency IN ('daily', 'weekly', 'monthly', 'never')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Comentários
COMMENT ON TABLE user_preferences IS 'Preferências detalhadas de notificações e personalização de cada usuário';

-- =====================================================
-- 3. TABELA: user_sessions
-- Sessões ativas e histórico de login
-- =====================================================

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Informações da sessão
  session_token TEXT UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  device_type VARCHAR(50),
  browser VARCHAR(50),
  os VARCHAR(50),
  
  -- Geolocalização
  country VARCHAR(100),
  city VARCHAR(100),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_sessions_started_at ON user_sessions(started_at DESC);

-- Comentários
COMMENT ON TABLE user_sessions IS 'Sessões ativas e histórico de login dos usuários';
COMMENT ON COLUMN user_sessions.session_token IS 'Token único da sessão';

-- =====================================================
-- FUNCTION: Atualizar updated_at automaticamente
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- ===== POLÍTICAS: user_profiles =====

-- Usuários podem ver seu próprio perfil
CREATE POLICY "Usuários veem seu próprio perfil"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Usuários podem atualizar seu próprio perfil
CREATE POLICY "Usuários atualizam seu próprio perfil"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Super admins veem todos os perfis
CREATE POLICY "Super admins veem todos os perfis"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND up.user_type = 'super_admin'
      AND up.is_active = true
    )
  );

-- Super admins podem atualizar qualquer perfil
CREATE POLICY "Super admins atualizam qualquer perfil"
  ON user_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND up.user_type = 'super_admin'
      AND up.is_active = true
    )
  );

-- Colaboradores podem ver perfis de outros colaboradores
CREATE POLICY "Colaboradores veem outros colaboradores"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND up.user_type != 'client'
      AND up.is_active = true
    )
  );

-- ===== POLÍTICAS: user_preferences =====

-- Usuários só veem suas próprias preferências
CREATE POLICY "Usuários veem suas preferências"
  ON user_preferences FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = user_preferences.user_id
      AND user_profiles.user_id = auth.uid()
    )
  );

-- ===== POLÍTICAS: user_sessions =====

-- Usuários só veem suas próprias sessões
CREATE POLICY "Usuários veem suas sessões"
  ON user_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = user_sessions.user_id
      AND user_profiles.user_id = auth.uid()
    )
  );

-- Super admins veem todas as sessões
CREATE POLICY "Super admins veem todas as sessões"
  ON user_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type = 'super_admin'
      AND user_profiles.is_active = true
    )
  );

-- =====================================================
-- FUNCTION: Criar preferências automaticamente
-- =====================================================

CREATE OR REPLACE FUNCTION create_user_preferences_on_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar preferências automaticamente
CREATE TRIGGER create_preferences_trigger
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_user_preferences_on_profile();

-- =====================================================
-- Fim da Migration: Sistema de Usuários
-- =====================================================

