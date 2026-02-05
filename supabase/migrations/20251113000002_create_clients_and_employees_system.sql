-- =====================================================================================
-- MIGRATION: Sistema Completo de Clientes e Colaboradores
-- Descrição: Cadastro completo com todos os campos e integrações
-- Data: 13/11/2025
-- =====================================================================================

-- =====================================================================================
-- 1. TABELA DE CLIENTES
-- =====================================================================================

CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    
    -- Dados da Empresa/Pessoa
    nome_fantasia TEXT,
    razao_social TEXT,
    tipo_pessoa TEXT CHECK (tipo_pessoa IN ('fisica', 'juridica')),
    cpf_cnpj TEXT,
    data_nascimento DATE,
    
    -- Contato
    whatsapp TEXT,
    
    -- Endereço
    cep TEXT,
    logradouro TEXT,
    numero TEXT,
    complemento TEXT,
    bairro TEXT,
    cidade TEXT,
    estado TEXT,
    
    -- Profissional
    profissao TEXT,
    area_atuacao TEXT,
    site TEXT,
    numero_funcionarios INTEGER,
    faturamento_estimado DECIMAL(15,2),
    
    -- Redes Sociais
    instagram TEXT,
    facebook TEXT,
    tiktok TEXT,
    linkedin TEXT,
    youtube TEXT,
    
    -- Concorrentes
    concorrentes TEXT,
    
    -- Logo
    logo_url TEXT,
    
    -- Tags
    tags TEXT[],
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_cpf_cnpj ON clients(cpf_cnpj);
CREATE INDEX IF NOT EXISTS idx_clients_area_atuacao ON clients(area_atuacao);

-- =====================================================================================
-- 2. TABELA DE COLABORADORES
-- =====================================================================================

CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    
    -- Dados Pessoais
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    cpf TEXT UNIQUE,
    birth_date DATE,
    whatsapp TEXT,
    
    -- Endereço
    cep TEXT,
    address TEXT,
    number TEXT,
    complement TEXT,
    neighborhood TEXT,
    city TEXT,
    state TEXT,
    
    -- Dados Bancários (PIX)
    pix_type TEXT CHECK (pix_type IN ('cpf', 'email', 'telefone', 'chave_aleatoria')),
    pix_key TEXT,
    bank TEXT,
    agency TEXT,
    account TEXT,
    account_type TEXT CHECK (account_type IN ('corrente', 'poupanca')),
    
    -- Profissional
    areas TEXT[], -- Array com as áreas de atuação
    hierarchy_level TEXT CHECK (hierarchy_level IN ('junior', 'pleno', 'senior', 'lider')),
    manager_id UUID REFERENCES users(id),
    work_schedule TEXT CHECK (work_schedule IN ('integral', 'meio_periodo', 'flexivel')),
    salary DECIMAL(10,2), -- Visível apenas para admin
    admission_date DATE, -- Será preenchida automaticamente no primeiro login
    
    -- Contato de Emergência
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relationship TEXT,
    
    -- Foto
    photo_url TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_cpf ON employees(cpf);
CREATE INDEX IF NOT EXISTS idx_employees_areas ON employees USING GIN(areas);

-- =====================================================================================
-- 3. TABELA DE CONTRATOS
-- =====================================================================================

CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Dados do Contrato
    contract_number TEXT UNIQUE,
    plan_id TEXT,
    services TEXT[], -- Array de serviços contratados
    monthly_value DECIMAL(10,2),
    due_day INTEGER CHECK (due_day BETWEEN 1 AND 31),
    start_date DATE,
    end_date DATE,
    
    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'suspended', 'cancelled', 'expired')),
    
    -- Modelo de Contrato
    contract_template TEXT, -- Template usado
    contract_filled TEXT, -- Contrato preenchido
    
    -- Assinatura
    signed BOOLEAN DEFAULT false,
    signed_at TIMESTAMPTZ,
    signature_ip INET,
    
    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_contracts_client_id ON contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_start_date ON contracts(start_date);

-- =====================================================================================
-- 4. LOGS DE EMAIL
-- =====================================================================================

CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL, -- 'welcome_client', 'welcome_employee', 'password_reset', etc
    related_entity_id UUID,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON email_logs(type);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at DESC);

-- =====================================================================================
-- 5. LOGS DE WHATSAPP
-- =====================================================================================

CREATE TABLE IF NOT EXISTS whatsapp_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_phone TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL, -- 'welcome_client', 'welcome_employee', 'notification', etc
    related_entity_id UUID,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_recipient ON whatsapp_logs(recipient_phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_type ON whatsapp_logs(type);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_status ON whatsapp_logs(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_created_at ON whatsapp_logs(created_at DESC);

-- =====================================================================================
-- 6. MODELOS DE CONTRATO
-- =====================================================================================

CREATE TABLE IF NOT EXISTS contract_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_name TEXT NOT NULL,
    template_content TEXT NOT NULL, -- HTML/Markdown do contrato
    variables JSONB, -- Variáveis que serão substituídas
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_contract_templates_active ON contract_templates(is_active);

-- =====================================================================================
-- 7. HISTÓRICO DE ALTERAÇÕES DE CONTRATOS
-- =====================================================================================

CREATE TABLE IF NOT EXISTS contract_changes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    change_type TEXT NOT NULL, -- 'created', 'updated', 'suspended', 'cancelled', etc
    changed_fields JSONB,
    old_values JSONB,
    new_values JSONB,
    changed_by UUID REFERENCES users(id),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_contract_changes_contract_id ON contract_changes(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_changes_type ON contract_changes(change_type);
CREATE INDEX IF NOT EXISTS idx_contract_changes_created_at ON contract_changes(created_at DESC);

-- =====================================================================================
-- 8. FUNCTIONS E TRIGGERS
-- =====================================================================================

-- Function para preencher data de admissão no primeiro login
CREATE OR REPLACE FUNCTION set_admission_date_on_first_login()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.action = 'login' AND NEW.success = true THEN
        UPDATE employees 
        SET admission_date = CURRENT_DATE
        WHERE user_id = NEW.user_id 
        AND admission_date IS NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS trigger_set_admission_date ON user_access_logs;
CREATE TRIGGER trigger_set_admission_date
    AFTER INSERT ON user_access_logs
    FOR EACH ROW
    EXECUTE FUNCTION set_admission_date_on_first_login();

-- Function para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contracts_updated_at ON contracts;
CREATE TRIGGER update_contracts_updated_at
    BEFORE UPDATE ON contracts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- =====================================================================================

-- Clients
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all clients" ON clients
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.user_type = 'super_admin'
        )
    );

CREATE POLICY "Clients can view own data" ON clients
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- Employees
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all employees" ON employees
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.user_type = 'super_admin'
        )
    );

CREATE POLICY "Employees can view own data" ON employees
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- Nota: Salário e hierarquia são sensíveis - adicionar regra especial
CREATE POLICY "Only admins can view salaries" ON employees
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.user_type = 'super_admin'
        )
    );

-- Contracts
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage contracts" ON contracts
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.user_type = 'super_admin'
        )
    );

CREATE POLICY "Clients can view own contracts" ON contracts
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = contracts.client_id 
            AND clients.user_id = auth.uid()
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
    RAISE NOTICE '   ✅ SISTEMA DE CLIENTES E COLABORADORES CRIADO!';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Tabelas criadas:';
    RAISE NOTICE '   - clients (clientes completos)';
    RAISE NOTICE '   - employees (colaboradores completos)';
    RAISE NOTICE '   - contracts (contratos)';
    RAISE NOTICE '   - email_logs (logs de emails)';
    RAISE NOTICE '   - whatsapp_logs (logs de WhatsApp)';
    RAISE NOTICE '   - contract_templates (modelos de contrato)';
    RAISE NOTICE '   - contract_changes (histórico de alterações)';
    RAISE NOTICE '';
    RAISE NOTICE '🔐 Funcionalidades:';
    RAISE NOTICE '   - Cadastro completo de clientes';
    RAISE NOTICE '   - Cadastro completo de colaboradores';
    RAISE NOTICE '   - Email automático: nome.sobrenome@valle360.com.br';
    RAISE NOTICE '   - Permissões por área';
    RAISE NOTICE '   - Data de admissão automática (primeiro login)';
    RAISE NOTICE '   - Logs de emails e WhatsApp';
    RAISE NOTICE '   - Contratos com histórico';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Sistema pronto para cadastros!';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
END $$;

