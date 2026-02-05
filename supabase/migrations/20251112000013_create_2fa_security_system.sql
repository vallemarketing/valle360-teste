-- =====================================================
-- MIGRATION: Sistema de 2FA (Two-Factor Authentication)
-- Descrição: Autenticação de dois fatores para segurança
-- Dependências: 20251112000001_create_user_system.sql
-- =====================================================

-- =====================================================
-- 1. TABELA: user_2fa_settings
-- Configurações de 2FA por usuário
-- =====================================================

CREATE TABLE IF NOT EXISTS user_2fa_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Status
  is_enabled BOOLEAN DEFAULT false,
  
  -- Método preferido
  preferred_method VARCHAR(20) DEFAULT 'totp' CHECK (preferred_method IN ('totp', 'sms', 'email', 'authenticator')),
  
  -- TOTP (Time-based One-Time Password)
  totp_secret TEXT,
  totp_enabled BOOLEAN DEFAULT false,
  totp_verified_at TIMESTAMP WITH TIME ZONE,
  
  -- SMS
  sms_phone VARCHAR(20),
  sms_enabled BOOLEAN DEFAULT false,
  sms_verified_at TIMESTAMP WITH TIME ZONE,
  
  -- Email
  email_enabled BOOLEAN DEFAULT false,
  email_verified_at TIMESTAMP WITH TIME ZONE,
  
  -- Backup codes
  backup_codes_generated_at TIMESTAMP WITH TIME ZONE,
  
  -- Recovery
  recovery_email VARCHAR(255),
  recovery_phone VARCHAR(20),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_user_2fa_settings_user ON user_2fa_settings(user_id);
CREATE INDEX idx_user_2fa_settings_enabled ON user_2fa_settings(is_enabled) WHERE is_enabled = true;

COMMENT ON TABLE user_2fa_settings IS 'Configurações de autenticação de dois fatores';

-- =====================================================
-- 2. TABELA: user_2fa_backup_codes
-- Códigos de backup para recuperação
-- =====================================================

CREATE TABLE IF NOT EXISTS user_2fa_backup_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  
  code_hash TEXT NOT NULL,
  
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE,
  used_ip INET,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_user_2fa_backup_codes_user ON user_2fa_backup_codes(user_id);
CREATE INDEX idx_user_2fa_backup_codes_unused ON user_2fa_backup_codes(user_id, is_used) WHERE is_used = false;

COMMENT ON TABLE user_2fa_backup_codes IS 'Códigos de backup para recuperação de 2FA';

-- =====================================================
-- 3. TABELA: user_2fa_verification_logs
-- Logs de tentativas de verificação
-- =====================================================

CREATE TABLE IF NOT EXISTS user_2fa_verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  
  verification_method VARCHAR(20) NOT NULL,
  
  success BOOLEAN NOT NULL,
  failure_reason TEXT,
  
  code_attempted TEXT,
  
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_user_2fa_verification_logs_user ON user_2fa_verification_logs(user_id);
CREATE INDEX idx_user_2fa_verification_logs_created ON user_2fa_verification_logs(created_at DESC);
CREATE INDEX idx_user_2fa_verification_logs_failed ON user_2fa_verification_logs(user_id, success, created_at) WHERE success = false;

COMMENT ON TABLE user_2fa_verification_logs IS 'Histórico de tentativas de verificação 2FA';

-- =====================================================
-- 4. TABELA: user_trusted_devices
-- Dispositivos confiáveis (skip 2FA por X dias)
-- =====================================================

CREATE TABLE IF NOT EXISTS user_trusted_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  
  device_fingerprint TEXT NOT NULL,
  device_name VARCHAR(255),
  
  browser VARCHAR(100),
  os VARCHAR(100),
  
  ip_address INET,
  
  is_active BOOLEAN DEFAULT true,
  
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  UNIQUE(user_id, device_fingerprint)
);

CREATE INDEX idx_user_trusted_devices_user ON user_trusted_devices(user_id);
CREATE INDEX idx_user_trusted_devices_active ON user_trusted_devices(is_active, expires_at) WHERE is_active = true;
CREATE INDEX idx_user_trusted_devices_fingerprint ON user_trusted_devices(device_fingerprint);

COMMENT ON TABLE user_trusted_devices IS 'Dispositivos confiáveis que não precisam de 2FA temporariamente';

-- =====================================================
-- 5. TABELA: user_security_questions
-- Perguntas de segurança para recuperação
-- =====================================================

CREATE TABLE IF NOT EXISTS user_security_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  
  question_text TEXT NOT NULL,
  answer_hash TEXT NOT NULL,
  
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_user_security_questions_user ON user_security_questions(user_id);

COMMENT ON TABLE user_security_questions IS 'Perguntas de segurança para recuperação de conta';

-- =====================================================
-- 6. TABELA: login_attempts
-- Tracking de tentativas de login (rate limiting)
-- =====================================================

CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  email VARCHAR(255) NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  success BOOLEAN NOT NULL,
  failure_reason TEXT,
  
  ip_address INET,
  user_agent TEXT,
  
  requires_2fa BOOLEAN DEFAULT false,
  fa_verified BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_login_attempts_email ON login_attempts(email);
CREATE INDEX idx_login_attempts_ip ON login_attempts(ip_address);
CREATE INDEX idx_login_attempts_created ON login_attempts(created_at DESC);
CREATE INDEX idx_login_attempts_failed ON login_attempts(email, success, created_at) WHERE success = false;

COMMENT ON TABLE login_attempts IS 'Histórico de tentativas de login para detecção de ataques';

-- =====================================================
-- 7. TABELA: account_lockouts
-- Bloqueios temporários de conta por segurança
-- =====================================================

CREATE TABLE IF NOT EXISTS account_lockouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  
  reason VARCHAR(50) NOT NULL CHECK (reason IN ('too_many_failed_logins', 'suspicious_activity', 'admin_action', 'security_violation')),
  
  locked_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  locked_until TIMESTAMP WITH TIME ZONE NOT NULL,
  
  locked_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  is_active BOOLEAN DEFAULT true,
  
  unlock_token TEXT,
  unlocked_at TIMESTAMP WITH TIME ZONE,
  unlocked_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  notes TEXT,
  
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_account_lockouts_user ON account_lockouts(user_id);
CREATE INDEX idx_account_lockouts_active ON account_lockouts(is_active, locked_until) WHERE is_active = true;

COMMENT ON TABLE account_lockouts IS 'Bloqueios temporários de conta por segurança';

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER update_user_2fa_settings_updated_at
  BEFORE UPDATE ON user_2fa_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_security_questions_updated_at
  BEFORE UPDATE ON user_security_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION: Verificar se conta está bloqueada
-- =====================================================

CREATE OR REPLACE FUNCTION is_account_locked(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  locked BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM account_lockouts
    WHERE user_id = p_user_id
    AND is_active = true
    AND locked_until > now()
  ) INTO locked;
  
  RETURN locked;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION is_account_locked IS 'Verifica se uma conta está bloqueada';

-- =====================================================
-- FUNCTION: Registrar tentativa de login
-- =====================================================

CREATE OR REPLACE FUNCTION log_login_attempt(
  p_email VARCHAR,
  p_user_id UUID,
  p_success BOOLEAN,
  p_failure_reason TEXT DEFAULT NULL,
  p_requires_2fa BOOLEAN DEFAULT false,
  p_2fa_verified BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
  attempt_id UUID;
  failed_count INTEGER;
BEGIN
  -- Registrar tentativa
  INSERT INTO login_attempts (
    email,
    user_id,
    success,
    failure_reason,
    ip_address,
    requires_2fa,
    fa_verified
  ) VALUES (
    p_email,
    p_user_id,
    p_success,
    p_failure_reason,
    inet_client_addr(),
    p_requires_2fa,
    p_2fa_verified
  ) RETURNING id INTO attempt_id;
  
  -- Se falhou, verificar se deve bloquear
  IF NOT p_success AND p_user_id IS NOT NULL THEN
    -- Contar falhas nos últimos 15 minutos
    SELECT COUNT(*)
    INTO failed_count
    FROM login_attempts
    WHERE user_id = p_user_id
    AND success = false
    AND created_at > now() - INTERVAL '15 minutes';
    
    -- Se 5 ou mais falhas, bloquear por 30 minutos
    IF failed_count >= 5 THEN
      INSERT INTO account_lockouts (
        user_id,
        reason,
        locked_until
      ) VALUES (
        p_user_id,
        'too_many_failed_logins',
        now() + INTERVAL '30 minutes'
      );
      
      -- Criar notificação
      PERFORM create_notification(
        p_user_id,
        'security_alert',
        'Conta Bloqueada',
        'Sua conta foi temporariamente bloqueada devido a múltiplas tentativas de login falhadas.',
        'account_lockout',
        p_user_id,
        NULL,
        'urgent'
      );
    END IF;
  END IF;
  
  RETURN attempt_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION log_login_attempt IS 'Registra tentativa de login e bloqueia conta se necessário';

-- =====================================================
-- FUNCTION: Gerar códigos de backup
-- =====================================================

CREATE OR REPLACE FUNCTION generate_backup_codes(p_user_id UUID, p_count INTEGER DEFAULT 10)
RETURNS TABLE(code TEXT) AS $$
DECLARE
  i INTEGER;
  random_code TEXT;
BEGIN
  -- Desativar códigos antigos
  UPDATE user_2fa_backup_codes
  SET is_used = true, used_at = now()
  WHERE user_id = p_user_id AND is_used = false;
  
  -- Gerar novos códigos
  FOR i IN 1..p_count LOOP
    -- Gerar código aleatório de 8 caracteres
    random_code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Inserir código com hash
    INSERT INTO user_2fa_backup_codes (
      user_id,
      code_hash,
      expires_at
    ) VALUES (
      p_user_id,
      crypt(random_code, gen_salt('bf')),
      now() + INTERVAL '1 year'
    );
    
    RETURN QUERY SELECT random_code;
  END LOOP;
  
  -- Atualizar data de geração
  UPDATE user_2fa_settings
  SET backup_codes_generated_at = now()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION generate_backup_codes IS 'Gera códigos de backup para recuperação de 2FA';

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE user_2fa_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_2fa_backup_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_2fa_verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_trusted_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_security_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_lockouts ENABLE ROW LEVEL SECURITY;

-- Usuários gerenciam suas próprias configurações 2FA
CREATE POLICY "Usuários gerenciam próprio 2FA"
  ON user_2fa_settings FOR ALL
  USING (user_id = auth.uid());

-- Usuários veem seus próprios códigos de backup
CREATE POLICY "Usuários veem próprios códigos backup"
  ON user_2fa_backup_codes FOR SELECT
  USING (user_id = auth.uid());

-- Usuários veem seus próprios logs
CREATE POLICY "Usuários veem próprios logs"
  ON user_2fa_verification_logs FOR SELECT
  USING (user_id = auth.uid());

-- Usuários gerenciam seus dispositivos confiáveis
CREATE POLICY "Usuários gerenciam dispositivos"
  ON user_trusted_devices FOR ALL
  USING (user_id = auth.uid());

-- Usuários gerenciam suas perguntas de segurança
CREATE POLICY "Usuários gerenciam perguntas segurança"
  ON user_security_questions FOR ALL
  USING (user_id = auth.uid());

-- Admins veem todos os logs de login
CREATE POLICY "Admins veem login attempts"
  ON login_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type = 'super_admin'
    )
  );

-- Admins gerenciam lockouts
CREATE POLICY "Admins gerenciam lockouts"
  ON account_lockouts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type = 'super_admin'
    )
  );

-- Usuários veem seus próprios lockouts
CREATE POLICY "Usuários veem próprios lockouts"
  ON account_lockouts FOR SELECT
  USING (user_id = auth.uid());

-- =====================================================
-- Fim da Migration: Sistema 2FA
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 2FA System concluída com sucesso!';
  RAISE NOTICE '📊 7 tabelas criadas';
  RAISE NOTICE '🔐 Segurança reforçada com autenticação de dois fatores';
END $$;

