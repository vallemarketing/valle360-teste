-- =====================================================================================
-- MIGRATION: Sistema de Autenticação Avançado e Auditoria Completa
-- Descrição: Login, 2FA, Recuperação de Senha, Logs de Acesso e Auditoria
-- Data: 13/11/2025
-- =====================================================================================

-- =====================================================================================
-- 1. EXTENSÕES E CONFIGURAÇÕES
-- =====================================================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================================================
-- 2. TABELA DE USUÁRIOS (Atualização)
-- =====================================================================================

-- Adicionar campos necessários à tabela users (se ainda não existirem)
DO $$ 
BEGIN
    -- Verificar e adicionar colunas se não existirem
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'requires_2fa') THEN
        ALTER TABLE users ADD COLUMN requires_2fa BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'two_factor_secret') THEN
        ALTER TABLE users ADD COLUMN two_factor_secret TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'two_factor_enabled_at') THEN
        ALTER TABLE users ADD COLUMN two_factor_enabled_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'last_login_at') THEN
        ALTER TABLE users ADD COLUMN last_login_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'last_login_ip') THEN
        ALTER TABLE users ADD COLUMN last_login_ip INET;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'password_changed_at') THEN
        ALTER TABLE users ADD COLUMN password_changed_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'account_status') THEN
        ALTER TABLE users ADD COLUMN account_status TEXT DEFAULT 'pending' CHECK (account_status IN ('pending', 'active', 'inactive', 'suspended'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'email_verified_at') THEN
        ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'phone_verified_at') THEN
        ALTER TABLE users ADD COLUMN phone_verified_at TIMESTAMPTZ;
    END IF;
END $$;

-- =====================================================================================
-- 3. LOGS DE ACESSO (Auditoria Completa)
-- =====================================================================================

CREATE TABLE IF NOT EXISTS user_access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'login', 'logout', 'password_reset_requested', 'password_changed', etc.
    action_details JSONB,
    ip_address INET,
    user_agent TEXT,
    location_country TEXT,
    location_city TEXT,
    device_type TEXT, -- 'desktop', 'mobile', 'tablet'
    browser TEXT,
    os TEXT,
    success BOOLEAN DEFAULT true,
    failure_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_access_logs_user_id ON user_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_access_logs_action ON user_access_logs(action);
CREATE INDEX IF NOT EXISTS idx_user_access_logs_created_at ON user_access_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_access_logs_ip ON user_access_logs(ip_address);

-- =====================================================================================
-- 4. TOKENS DE RECUPERAÇÃO DE SENHA
-- =====================================================================================

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    method TEXT NOT NULL CHECK (method IN ('email', 'whatsapp', 'sms')),
    used BOOLEAN DEFAULT false,
    used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email ON password_reset_tokens(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires ON password_reset_tokens(expires_at);

-- =====================================================================================
-- 5. AUDITORIA DE COLABORADORES (Monitoramento Completo)
-- =====================================================================================

CREATE TABLE IF NOT EXISTS employee_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    audit_type TEXT NOT NULL, -- 'client_interaction', 'approval', 'task_completed', 'message_sent', etc.
    audit_category TEXT, -- 'communication', 'production', 'approval', 'access'
    action_description TEXT NOT NULL,
    related_entity_type TEXT, -- 'client', 'task', 'message', 'approval', etc.
    related_entity_id UUID,
    before_data JSONB, -- Estado anterior (para comparações)
    after_data JSONB, -- Estado depois
    metadata JSONB, -- Dados adicionais
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_employee_audit_employee_id ON employee_audit_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_audit_type ON employee_audit_logs(audit_type);
CREATE INDEX IF NOT EXISTS idx_employee_audit_category ON employee_audit_logs(audit_category);
CREATE INDEX IF NOT EXISTS idx_employee_audit_created_at ON employee_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_employee_audit_related_entity ON employee_audit_logs(related_entity_type, related_entity_id);

-- =====================================================================================
-- 6. CONVERSAS COM CLIENTES (Auditoria)
-- =====================================================================================

CREATE TABLE IF NOT EXISTS employee_client_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    conversation_type TEXT NOT NULL CHECK (conversation_type IN ('message', 'call', 'meeting', 'email', 'whatsapp')),
    message_content TEXT,
    message_direction TEXT CHECK (message_direction IN ('sent', 'received')),
    attachments JSONB,
    sentiment_score DECIMAL(3,2), -- Análise de sentimento: -1 a 1
    sentiment_label TEXT CHECK (sentiment_label IN ('positive', 'neutral', 'negative')),
    tags TEXT[],
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_employee_client_conv_employee ON employee_client_conversations(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_client_conv_client ON employee_client_conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_employee_client_conv_type ON employee_client_conversations(conversation_type);
CREATE INDEX IF NOT EXISTS idx_employee_client_conv_created ON employee_client_conversations(created_at DESC);

-- =====================================================================================
-- 7. APROVAÇÕES E DECISÕES
-- =====================================================================================

CREATE TABLE IF NOT EXISTS employee_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    approval_type TEXT NOT NULL, -- 'post', 'design', 'campaign', 'budget', etc.
    item_id UUID NOT NULL,
    item_type TEXT NOT NULL, -- 'post', 'design', 'campaign'
    decision TEXT NOT NULL CHECK (decision IN ('approved', 'rejected', 'pending', 'requested_changes')),
    decision_notes TEXT,
    requested_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_employee_approvals_employee ON employee_approvals(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_approvals_type ON employee_approvals(approval_type);
CREATE INDEX IF NOT EXISTS idx_employee_approvals_decision ON employee_approvals(decision);
CREATE INDEX IF NOT EXISTS idx_employee_approvals_item ON employee_approvals(item_type, item_id);

-- =====================================================================================
-- 8. PERMISSÕES POR ÁREA
-- =====================================================================================

CREATE TABLE IF NOT EXISTS employee_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    area TEXT NOT NULL, -- 'comercial', 'trafego_pago', 'designer_grafico', etc.
    permissions JSONB NOT NULL DEFAULT '{}', -- JSON com permissões específicas
    can_view_dashboard BOOLEAN DEFAULT true,
    can_view_kanban BOOLEAN DEFAULT true,
    can_view_clients BOOLEAN DEFAULT true,
    can_view_financial BOOLEAN DEFAULT false,
    can_view_reports BOOLEAN DEFAULT false,
    can_edit_clients BOOLEAN DEFAULT false,
    can_approve_content BOOLEAN DEFAULT false,
    can_manage_team BOOLEAN DEFAULT false,
    custom_permissions JSONB, -- Permissões customizadas adicionais
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, area)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_employee_permissions_employee ON employee_permissions(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_permissions_area ON employee_permissions(area);

-- =====================================================================================
-- 9. SESSÕES ATIVAS
-- =====================================================================================

CREATE TABLE IF NOT EXISTS active_user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL UNIQUE,
    device_info JSONB,
    ip_address INET,
    user_agent TEXT,
    remember_me BOOLEAN DEFAULT false,
    expires_at TIMESTAMPTZ NOT NULL,
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_active_sessions_user_id ON active_user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_token ON active_user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_active_sessions_expires ON active_user_sessions(expires_at);

-- =====================================================================================
-- 10. TENTATIVAS DE LOGIN FALHADAS
-- =====================================================================================

CREATE TABLE IF NOT EXISTS failed_login_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    ip_address INET NOT NULL,
    user_agent TEXT,
    failure_reason TEXT,
    attempt_count INTEGER DEFAULT 1,
    locked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_failed_login_email ON failed_login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_failed_login_ip ON failed_login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_failed_login_created ON failed_login_attempts(created_at DESC);

-- =====================================================================================
-- 11. FUNCTIONS E TRIGGERS
-- =====================================================================================

-- Function para atualizar último login
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users 
    SET last_login_at = NOW()
    WHERE id = NEW.user_id AND NEW.action = 'login' AND NEW.success = true;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS trigger_update_last_login ON user_access_logs;
CREATE TRIGGER trigger_update_last_login
    AFTER INSERT ON user_access_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_last_login();

-- Function para limpar tokens expirados
CREATE OR REPLACE FUNCTION clean_expired_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM password_reset_tokens 
    WHERE expires_at < NOW() AND used = false;
    
    DELETE FROM active_user_sessions 
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================================================
-- 12. ROW LEVEL SECURITY (RLS)
-- =====================================================================================

-- user_access_logs
ALTER TABLE user_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all access logs" ON user_access_logs
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.user_type = 'super_admin'
        )
    );

CREATE POLICY "Users can view own access logs" ON user_access_logs
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- employee_audit_logs
ALTER TABLE employee_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all employee audits" ON employee_audit_logs
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.user_type = 'super_admin'
        )
    );

-- employee_client_conversations
ALTER TABLE employee_client_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all conversations" ON employee_client_conversations
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.user_type = 'super_admin'
        )
    );

CREATE POLICY "Employees can view own conversations" ON employee_client_conversations
    FOR SELECT TO authenticated
    USING (employee_id = auth.uid() OR client_id = auth.uid());

-- employee_approvals
ALTER TABLE employee_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all approvals" ON employee_approvals
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.user_type = 'super_admin'
        )
    );

-- employee_permissions
ALTER TABLE employee_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own permissions" ON employee_permissions
    FOR SELECT TO authenticated
    USING (employee_id = auth.uid());

CREATE POLICY "Admins can manage permissions" ON employee_permissions
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.user_type = 'super_admin'
        )
    );

-- =====================================================================================
-- FIM DA MIGRATION
-- =====================================================================================

-- Mensagem de confirmação
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
    RAISE NOTICE '   ✅ SISTEMA DE AUTH E AUDITORIA CRIADO COM SUCESSO!';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Tabelas criadas:';
    RAISE NOTICE '   - user_access_logs (logs de acesso)';
    RAISE NOTICE '   - password_reset_tokens (recuperação de senha)';
    RAISE NOTICE '   - employee_audit_logs (auditoria colaboradores)';
    RAISE NOTICE '   - employee_client_conversations (conversas)';
    RAISE NOTICE '   - employee_approvals (aprovações)';
    RAISE NOTICE '   - employee_permissions (permissões por área)';
    RAISE NOTICE '   - active_user_sessions (sessões ativas)';
    RAISE NOTICE '   - failed_login_attempts (tentativas falhadas)';
    RAISE NOTICE '';
    RAISE NOTICE '🔐 Funcionalidades:';
    RAISE NOTICE '   - Login com 2FA (Google Authenticator)';
    RAISE NOTICE '   - Recuperação senha (Email + WhatsApp)';
    RAISE NOTICE '   - Auditoria completa por colaborador';
    RAISE NOTICE '   - Permissões por área';
    RAISE NOTICE '   - Logs de acesso detalhados';
    RAISE NOTICE '   - Monitoramento de conversas';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Sistema pronto para uso!';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
END $$;

