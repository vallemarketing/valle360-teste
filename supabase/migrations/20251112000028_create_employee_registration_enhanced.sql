-- =====================================================================================
-- Migration: Cadastro de Colaborador Melhorado
-- Descrição: Sistema completo de cadastro de colaboradores com dados financeiros (PIX),
--            pessoais, preferências e workflow de aprovação pelo comercial/RH
-- Versão: 1.0
-- Data: 2025-11-12
-- =====================================================================================

-- =====================================================================================
-- 1. DADOS FINANCEIROS DOS COLABORADORES (Criptografados)
-- =====================================================================================

CREATE TABLE IF NOT EXISTS employee_financial_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    -- Dados PIX
    pix_key VARCHAR(255), -- CPF, Email, Telefone ou Chave Aleatória (CRIPTOGRAFADO)
    pix_key_type VARCHAR(20), -- 'cpf', 'email', 'phone', 'random'
    pix_holder_name VARCHAR(255), -- Nome do titular (se diferente)
    
    -- Dados bancários
    bank_code VARCHAR(10), -- Código do banco (ex: 001, 237, 104)
    bank_name VARCHAR(100),
    branch_number VARCHAR(20),
    account_number VARCHAR(30),
    account_type VARCHAR(20), -- 'corrente', 'poupanca'
    account_holder_name VARCHAR(255), -- Se diferente do colaborador
    
    -- Documentos
    cpf VARCHAR(14), -- CRIPTOGRAFADO
    rg VARCHAR(20), -- CRIPTOGRAFADO
    rg_issuer VARCHAR(50),
    rg_issue_date DATE,
    
    -- Status
    verification_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    
    -- Preferência de pagamento
    preferred_payment_method VARCHAR(20) DEFAULT 'pix', -- 'pix', 'bank_transfer', 'check'
    
    -- Segurança
    data_encrypted BOOLEAN DEFAULT true,
    last_updated_by UUID REFERENCES users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(employee_id)
);

CREATE INDEX idx_employee_financial_employee ON employee_financial_data(employee_id);
CREATE INDEX idx_employee_financial_status ON employee_financial_data(verification_status);

COMMENT ON TABLE employee_financial_data IS 'Dados financeiros e bancários dos colaboradores (criptografados)';
COMMENT ON COLUMN employee_financial_data.pix_key IS 'Chave PIX do colaborador (CRIPTOGRAFADO)';
COMMENT ON COLUMN employee_financial_data.cpf IS 'CPF do colaborador (CRIPTOGRAFADO)';

-- =====================================================================================
-- 2. DADOS PESSOAIS DOS COLABORADORES
-- =====================================================================================

CREATE TABLE IF NOT EXISTS employee_personal_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    -- Dados pessoais básicos
    full_name VARCHAR(255) NOT NULL,
    birth_date DATE NOT NULL,
    age INTEGER GENERATED ALWAYS AS (EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date))) STORED,
    gender VARCHAR(20), -- 'masculino', 'feminino', 'outro', 'prefiro_nao_informar'
    marital_status VARCHAR(50), -- 'solteiro', 'casado', 'divorciado', 'viuvo', 'uniao_estavel'
    
    -- Documentos
    nationality VARCHAR(100) DEFAULT 'Brasileiro',
    birthplace_city VARCHAR(100),
    birthplace_state VARCHAR(50),
    mother_name VARCHAR(255),
    father_name VARCHAR(255),
    
    -- Endereço residencial
    address_street VARCHAR(255),
    address_number VARCHAR(20),
    address_complement VARCHAR(100),
    address_neighborhood VARCHAR(100),
    address_city VARCHAR(100),
    address_state VARCHAR(50),
    address_postal_code VARCHAR(10),
    address_country VARCHAR(100) DEFAULT 'Brasil',
    
    -- Endereço de entrega (se diferente)
    delivery_address_same_as_residential BOOLEAN DEFAULT true,
    delivery_address_street VARCHAR(255),
    delivery_address_number VARCHAR(20),
    delivery_address_complement VARCHAR(100),
    delivery_address_neighborhood VARCHAR(100),
    delivery_address_city VARCHAR(100),
    delivery_address_state VARCHAR(50),
    delivery_address_postal_code VARCHAR(10),
    
    -- Contatos pessoais
    personal_email VARCHAR(255),
    personal_phone VARCHAR(50),
    emergency_contact_name VARCHAR(255),
    emergency_contact_relationship VARCHAR(50),
    emergency_contact_phone VARCHAR(50),
    
    -- Saúde
    blood_type VARCHAR(5), -- 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
    has_disabilities BOOLEAN DEFAULT false,
    disability_details TEXT,
    allergies TEXT,
    health_conditions TEXT,
    
    -- Escolaridade
    education_level VARCHAR(50), -- 'fundamental', 'medio', 'superior_incompleto', 'superior_completo', 'pos_graduacao', 'mestrado', 'doutorado'
    institution_name VARCHAR(255),
    course_name VARCHAR(255),
    graduation_year INTEGER,
    
    -- Status
    verification_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(employee_id)
);

CREATE INDEX idx_employee_personal_employee ON employee_personal_data(employee_id);
CREATE INDEX idx_employee_personal_birth_date ON employee_personal_data(birth_date);
CREATE INDEX idx_employee_personal_status ON employee_personal_data(verification_status);

COMMENT ON TABLE employee_personal_data IS 'Dados pessoais completos dos colaboradores';
COMMENT ON COLUMN employee_personal_data.birth_date IS 'Data de nascimento (usado para celebrações automáticas)';

-- =====================================================================================
-- 3. PREFERÊNCIAS DO COLABORADOR (Para celebrações e benefícios)
-- =====================================================================================

CREATE TABLE IF NOT EXISTS employee_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    -- Preferências alimentares
    favorite_food VARCHAR(255),
    favorite_restaurant VARCHAR(255),
    favorite_cuisine VARCHAR(100), -- 'italiana', 'japonesa', 'brasileira', 'fast-food', etc
    dietary_restrictions JSONB, -- ['vegetariano', 'vegano', 'sem_gluten', 'sem_lactose', 'kosher', 'halal']
    food_allergies JSONB,
    dislikes_foods JSONB,
    
    -- Preferências de entrega
    preferred_delivery_time VARCHAR(20), -- 'morning', 'afternoon', 'evening'
    accepts_alcohol BOOLEAN DEFAULT false,
    
    -- Preferências de celebração
    birthday_celebration_preference VARCHAR(50) DEFAULT 'yes', -- 'yes', 'no', 'simple', 'surprise'
    prefers_public_celebration BOOLEAN DEFAULT true, -- Quer que equipe saiba?
    celebration_style VARCHAR(50), -- 'party', 'simple', 'private', 'no_celebration'
    
    -- Preferências de presente
    gift_preference VARCHAR(50) DEFAULT 'money', -- 'money', 'gift_card', 'physical_gift', 'experience', 'donation'
    favorite_stores JSONB, -- Para gift cards
    hobbies_interests JSONB, -- Para presentes físicos
    
    -- Tamanhos (para brindes)
    shirt_size VARCHAR(10), -- 'PP', 'P', 'M', 'G', 'GG', 'XG'
    shoe_size VARCHAR(10),
    
    -- Preferências gerais
    communication_preference VARCHAR(20) DEFAULT 'whatsapp', -- 'whatsapp', 'email', 'sms', 'call'
    work_from_home_preference VARCHAR(20), -- 'always', 'hybrid', 'never', 'flexible'
    preferred_work_hours VARCHAR(50), -- 'early_bird', 'night_owl', 'flexible'
    
    -- Motivação
    motivation_factors JSONB, -- ['reconhecimento', 'dinheiro', 'desenvolvimento', 'autonomia', 'equipe']
    career_goals TEXT,
    areas_of_interest JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(employee_id)
);

CREATE INDEX idx_employee_preferences_employee ON employee_preferences(employee_id);

COMMENT ON TABLE employee_preferences IS 'Preferências pessoais dos colaboradores para celebrações, benefícios e motivação';

-- =====================================================================================
-- 4. DOCUMENTOS ANEXADOS PELOS COLABORADORES
-- =====================================================================================

CREATE TABLE IF NOT EXISTS employee_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    -- Tipo de documento
    document_type VARCHAR(50) NOT NULL, -- 'rg', 'cpf', 'cnh', 'ctps', 'comprovante_residencia', 'diploma', 'certidao_nascimento', 'outro'
    document_name VARCHAR(255) NOT NULL,
    
    -- Arquivo
    file_url VARCHAR(500) NOT NULL,
    file_name VARCHAR(255),
    file_size_bytes INTEGER,
    file_type VARCHAR(50), -- 'pdf', 'jpg', 'png'
    
    -- Status
    verification_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'expired'
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    
    -- Validade
    issue_date DATE,
    expiry_date DATE,
    is_expired BOOLEAN GENERATED ALWAYS AS (expiry_date IS NOT NULL AND expiry_date < CURRENT_DATE) STORED,
    
    -- Metadados
    notes TEXT,
    uploaded_by UUID REFERENCES users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_employee_documents_employee ON employee_documents(employee_id);
CREATE INDEX idx_employee_documents_type ON employee_documents(document_type);
CREATE INDEX idx_employee_documents_status ON employee_documents(verification_status);
CREATE INDEX idx_employee_documents_expired ON employee_documents(is_expired) WHERE is_expired = true;

COMMENT ON TABLE employee_documents IS 'Documentos anexados pelos colaboradores (RG, CPF, comprovantes, etc)';

-- =====================================================================================
-- 5. FILA DE APROVAÇÃO DE CADASTROS (Dashboard Comercial/RH)
-- =====================================================================================

CREATE TABLE IF NOT EXISTS pending_employee_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    -- Status geral do cadastro
    approval_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'incomplete', 'under_review', 'approved', 'rejected'
    approval_stage VARCHAR(50) DEFAULT 'data_entry', -- 'data_entry', 'document_upload', 'hr_review', 'commercial_review', 'approved'
    
    -- Checklist de completude
    personal_data_complete BOOLEAN DEFAULT false,
    financial_data_complete BOOLEAN DEFAULT false,
    documents_uploaded BOOLEAN DEFAULT false,
    preferences_filled BOOLEAN DEFAULT false,
    
    -- Porcentagem de completude
    completion_percentage INTEGER GENERATED ALWAYS AS (
        (CASE WHEN personal_data_complete THEN 25 ELSE 0 END +
         CASE WHEN financial_data_complete THEN 25 ELSE 0 END +
         CASE WHEN documents_uploaded THEN 25 ELSE 0 END +
         CASE WHEN preferences_filled THEN 25 ELSE 0 END)
    ) STORED,
    
    -- Revisão
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    
    -- Correções solicitadas
    corrections_requested JSONB, -- [{field: 'cpf', reason: 'ilegível', priority: 'high'}]
    corrections_deadline DATE,
    
    -- Aprovação final
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    approval_notes TEXT,
    
    -- Rejeição
    rejected_by UUID REFERENCES users(id),
    rejected_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    
    -- Prioridade
    priority VARCHAR(20) DEFAULT 'medium', -- 'urgent', 'high', 'medium', 'low'
    
    -- Notificações
    employee_notified_at TIMESTAMP WITH TIME ZONE,
    last_notification_sent_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(employee_id)
);

CREATE INDEX idx_pending_approvals_employee ON pending_employee_approvals(employee_id);
CREATE INDEX idx_pending_approvals_status ON pending_employee_approvals(approval_status);
CREATE INDEX idx_pending_approvals_stage ON pending_employee_approvals(approval_stage);
CREATE INDEX idx_pending_approvals_completion ON pending_employee_approvals(completion_percentage DESC);
CREATE INDEX idx_pending_approvals_priority ON pending_employee_approvals(priority);

COMMENT ON TABLE pending_employee_approvals IS 'Fila de aprovação de cadastros de colaboradores (Dashboard Comercial/RH)';

-- =====================================================================================
-- 6. HISTÓRICO DE MUDANÇAS NOS DADOS DO COLABORADOR
-- =====================================================================================

CREATE TABLE IF NOT EXISTS employee_data_change_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    -- Mudança
    table_name VARCHAR(100) NOT NULL, -- 'employee_financial_data', 'employee_personal_data', etc
    field_name VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    
    -- Motivo
    change_reason TEXT,
    change_type VARCHAR(20), -- 'initial', 'correction', 'update', 'verification'
    
    -- Quem fez
    changed_by UUID REFERENCES users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Aprovação da mudança (se necessário)
    requires_approval BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_employee_data_history_employee ON employee_data_change_history(employee_id);
CREATE INDEX idx_employee_data_history_changed_at ON employee_data_change_history(changed_at DESC);
CREATE INDEX idx_employee_data_history_table ON employee_data_change_history(table_name);

COMMENT ON TABLE employee_data_change_history IS 'Histórico de todas as mudanças nos dados dos colaboradores';

-- =====================================================================================
-- TRIGGERS
-- =====================================================================================

CREATE TRIGGER update_employee_financial_data_timestamp
    BEFORE UPDATE ON employee_financial_data
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER update_employee_personal_data_timestamp
    BEFORE UPDATE ON employee_personal_data
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER update_employee_preferences_timestamp
    BEFORE UPDATE ON employee_preferences
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER update_employee_documents_timestamp
    BEFORE UPDATE ON employee_documents
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER update_pending_employee_approvals_timestamp
    BEFORE UPDATE ON pending_employee_approvals
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

-- =====================================================================================
-- RLS (Row Level Security) - MUITO RESTRITIVO para dados sensíveis
-- =====================================================================================

ALTER TABLE employee_financial_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_personal_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_employee_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_data_change_history ENABLE ROW LEVEL SECURITY;

-- Dados financeiros: Apenas super admin, RH e o próprio colaborador
CREATE POLICY employee_own_financial_data ON employee_financial_data FOR SELECT TO authenticated USING (
    employee_id IN (
        SELECT id FROM employees WHERE user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('super_admin', 'rh')
    )
);

CREATE POLICY employee_update_own_financial_data ON employee_financial_data FOR UPDATE TO authenticated USING (
    employee_id IN (
        SELECT id FROM employees WHERE user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('super_admin', 'rh')
    )
);

-- Dados pessoais: Colaborador, RH, super admin
CREATE POLICY employee_own_personal_data ON employee_personal_data FOR SELECT TO authenticated USING (
    employee_id IN (
        SELECT id FROM employees WHERE user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('super_admin', 'rh', 'admin')
    )
);

CREATE POLICY employee_update_own_personal_data ON employee_personal_data FOR UPDATE TO authenticated USING (
    employee_id IN (
        SELECT id FROM employees WHERE user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('super_admin', 'rh')
    )
);

-- Preferências: Colaborador e RH
CREATE POLICY employee_own_preferences ON employee_preferences FOR ALL TO authenticated USING (
    employee_id IN (
        SELECT id FROM employees WHERE user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('super_admin', 'rh')
    )
);

-- Documentos: Colaborador, RH, super admin
CREATE POLICY employee_own_documents ON employee_documents FOR ALL TO authenticated USING (
    employee_id IN (
        SELECT id FROM employees WHERE user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('super_admin', 'rh')
    )
);

-- Aprovações: RH, comercial, super admin
CREATE POLICY hr_comercial_approvals ON pending_employee_approvals FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('super_admin', 'rh', 'comercial', 'admin')
    )
);

-- Histórico: Apenas super admin e RH
CREATE POLICY admin_rh_change_history ON employee_data_change_history FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('super_admin', 'rh')
    )
);

-- =====================================================================================
-- FIM DA MIGRATION
-- =====================================================================================

COMMENT ON SCHEMA public IS 'Migration 28: Cadastro de Colaborador Melhorado - Sistema completo com PIX, dados pessoais e workflow de aprovação';

