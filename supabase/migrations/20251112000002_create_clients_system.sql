-- =====================================================
-- MIGRATION: Sistema de Clientes
-- Descrição: Tabelas de clientes, perfis estendidos, contratos e indicações
-- Dependências: 20251112000001_create_user_system.sql
-- =====================================================

-- =====================================================
-- 1. TABELA: clients
-- Empresas/clientes que contratam os serviços
-- =====================================================

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Informações básicas
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  company_name VARCHAR(255),
  
  -- Redes sociais
  instagram VARCHAR(255),
  facebook VARCHAR(255),
  linkedin VARCHAR(255),
  tiktok VARCHAR(255),
  youtube VARCHAR(255),
  website VARCHAR(255),
  
  -- Programa de indicação
  referred_by UUID REFERENCES clients(id) ON DELETE SET NULL,
  referral_count INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true NOT NULL,
  
  -- Gestão
  account_manager UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_is_active ON clients(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_clients_account_manager ON clients(account_manager);
CREATE INDEX IF NOT EXISTS idx_clients_referred_by ON clients(referred_by);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at DESC);

-- Comentários
COMMENT ON TABLE clients IS 'Empresas e clientes que contratam os serviços da Valle 360';
COMMENT ON COLUMN clients.referred_by IS 'Cliente que indicou este cliente (programa de indicações)';

-- =====================================================
-- 2. TABELA: client_profiles_extended
-- Informações detalhadas e documentos do cliente
-- =====================================================

CREATE TABLE IF NOT EXISTS client_profiles_extended (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Documentação pessoal/empresarial
  cpf_cnpj VARCHAR(20),
  birth_date DATE,
  company_name VARCHAR(255),
  business_sector VARCHAR(100),
  
  -- Contatos
  phone_commercial VARCHAR(20),
  phone_mobile VARCHAR(20),
  
  -- Endereço completo
  address_zip VARCHAR(10),
  address_street VARCHAR(255),
  address_number VARCHAR(20),
  address_complement VARCHAR(100),
  address_neighborhood VARCHAR(100),
  address_city VARCHAR(100),
  address_state VARCHAR(2),
  
  -- Redes sociais detalhadas
  social_instagram VARCHAR(255),
  social_facebook VARCHAR(255),
  social_linkedin VARCHAR(255),
  social_youtube VARCHAR(255),
  social_website VARCHAR(255),
  
  -- Contatos adicionais (array de objetos JSON)
  additional_contacts JSONB DEFAULT '[]'::jsonb,
  -- Formato: [{ "name": "", "position": "", "email": "", "phone": "" }]
  
  -- Documentos (array de objetos JSON)
  documents JSONB DEFAULT '[]'::jsonb,
  -- Formato: [{ "type": "rg|cnh|proof_of_address|articles_of_incorporation|other", "name": "", "url": "", "uploaded_at": "" }]
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_client_profiles_extended_user_id ON client_profiles_extended(user_id);
CREATE INDEX IF NOT EXISTS idx_client_profiles_extended_cpf_cnpj ON client_profiles_extended(cpf_cnpj);

-- Comentários
COMMENT ON TABLE client_profiles_extended IS 'Informações detalhadas e documentos do perfil do cliente';

-- =====================================================
-- 3. TABELA: client_contracts
-- Contratos dos clientes
-- =====================================================

CREATE TABLE IF NOT EXISTS client_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  
  -- Identificação do contrato
  contract_number VARCHAR(50) UNIQUE NOT NULL,
  contract_type VARCHAR(50) NOT NULL,
  
  -- Datas
  start_date DATE NOT NULL,
  end_date DATE,
  renewal_date DATE,
  
  -- Valores
  monthly_value DECIMAL(10, 2),
  total_value DECIMAL(10, 2),
  currency VARCHAR(10) DEFAULT 'BRL' NOT NULL,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended', 'cancelled', 'expired')),
  
  -- Serviços e departamentos incluídos (arrays JSON)
  services_included JSONB DEFAULT '[]'::jsonb,
  departments JSONB DEFAULT '[]'::jsonb,
  
  -- Arquivos
  pdf_url TEXT,
  signed_pdf_url TEXT,
  
  -- Termos e condições
  terms JSONB DEFAULT '{}'::jsonb,
  
  -- Versionamento
  version INTEGER DEFAULT 1,
  is_current BOOLEAN DEFAULT true,
  
  -- Gestão
  uploaded_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_client_contracts_client_id ON client_contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_client_contracts_number ON client_contracts(contract_number);
CREATE INDEX IF NOT EXISTS idx_client_contracts_status ON client_contracts(status);
CREATE INDEX IF NOT EXISTS idx_client_contracts_current ON client_contracts(is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_client_contracts_dates ON client_contracts(start_date, end_date);

-- Comentários
COMMENT ON TABLE client_contracts IS 'Contratos firmados com os clientes';
COMMENT ON COLUMN client_contracts.is_current IS 'Indica se este é o contrato vigente (apenas um por cliente deve ser true)';

-- =====================================================
-- 4. TABELA: client_rules_documents
-- Documentos de regras e políticas do cliente
-- =====================================================

CREATE TABLE IF NOT EXISTS client_rules_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  
  -- Arquivo
  rules_file_url TEXT NOT NULL,
  
  -- Versionamento
  version INTEGER DEFAULT 1,
  is_current BOOLEAN DEFAULT true,
  
  -- Aceitação
  accepted_at TIMESTAMP WITH TIME ZONE,
  
  -- Gestão
  uploaded_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_client_rules_documents_client_id ON client_rules_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_client_rules_documents_current ON client_rules_documents(is_current) WHERE is_current = true;

-- Comentários
COMMENT ON TABLE client_rules_documents IS 'Documentos de regras, políticas e guidelines do cliente';

-- =====================================================
-- 5. TABELA: client_referrals
-- Sistema de indicações entre clientes
-- =====================================================

CREATE TABLE IF NOT EXISTS client_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relacionamentos
  referrer_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  referred_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  
  -- Status da indicação
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled')),
  
  -- Benefício
  benefit_granted BOOLEAN DEFAULT false,
  benefit_description TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  -- Constraint: cliente não pode indicar a si mesmo
  CHECK (referrer_id != referred_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_client_referrals_referrer_id ON client_referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_client_referrals_referred_id ON client_referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_client_referrals_status ON client_referrals(status);

-- Comentários
COMMENT ON TABLE client_referrals IS 'Sistema de indicações: clientes que indicam novos clientes';

-- =====================================================
-- ATUALIZAR FOREIGN KEYS em user_profiles
-- =====================================================

-- Adicionar constraint de foreign key para client_id
ALTER TABLE user_profiles 
  ADD CONSTRAINT fk_user_profiles_client_id 
  FOREIGN KEY (client_id) 
  REFERENCES clients(id) 
  ON DELETE SET NULL;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para atualizar updated_at
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_profiles_extended_updated_at
  BEFORE UPDATE ON client_profiles_extended
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_contracts_updated_at
  BEFORE UPDATE ON client_contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_rules_documents_updated_at
  BEFORE UPDATE ON client_rules_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION: Atualizar contador de indicações
-- =====================================================

CREATE OR REPLACE FUNCTION update_referral_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Incrementar contador quando indicação é criada
  IF (TG_OP = 'INSERT') THEN
    UPDATE clients 
    SET referral_count = referral_count + 1
    WHERE id = NEW.referrer_id;
    RETURN NEW;
  END IF;
  
  -- Decrementar contador quando indicação é deletada
  IF (TG_OP = 'DELETE') THEN
    UPDATE clients 
    SET referral_count = GREATEST(0, referral_count - 1)
    WHERE id = OLD.referrer_id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar contador de indicações
CREATE TRIGGER update_referral_count_trigger
  AFTER INSERT OR DELETE ON client_referrals
  FOR EACH ROW
  EXECUTE FUNCTION update_referral_count();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_profiles_extended ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_rules_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_referrals ENABLE ROW LEVEL SECURITY;

-- ===== POLÍTICAS: clients =====

-- Clientes veem apenas seus próprios dados
CREATE POLICY "Clientes veem seus próprios dados"
  ON clients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.client_id = clients.id
      AND user_profiles.user_id = auth.uid()
    )
  );

-- Clientes podem atualizar seus próprios dados
CREATE POLICY "Clientes atualizam seus dados"
  ON clients FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.client_id = clients.id
      AND user_profiles.user_id = auth.uid()
    )
  );

-- Super admins e gestores veem todos os clientes
CREATE POLICY "Admins e gestores veem todos os clientes"
  ON clients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type IN ('super_admin', 'marketing_head', 'commercial')
      AND user_profiles.is_active = true
    )
  );

-- Super admins podem fazer tudo com clientes
CREATE POLICY "Super admins gerenciam clientes"
  ON clients FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type = 'super_admin'
      AND user_profiles.is_active = true
    )
  );

-- ===== POLÍTICAS: client_profiles_extended =====

-- Clientes veem seu próprio perfil estendido
CREATE POLICY "Clientes veem seu perfil estendido"
  ON client_profiles_extended FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = client_profiles_extended.user_id
      AND user_profiles.user_id = auth.uid()
    )
  );

-- Admins veem todos os perfis estendidos
CREATE POLICY "Admins veem perfis estendidos"
  ON client_profiles_extended FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type IN ('super_admin', 'commercial', 'financial')
      AND user_profiles.is_active = true
    )
  );

-- ===== POLÍTICAS: client_contracts =====

-- Clientes veem seus próprios contratos
CREATE POLICY "Clientes veem seus contratos"
  ON client_contracts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN clients c ON c.id = up.client_id
      WHERE c.id = client_contracts.client_id
      AND up.user_id = auth.uid()
    )
  );

-- Admins e comercial veem todos os contratos
CREATE POLICY "Admins veem todos os contratos"
  ON client_contracts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type IN ('super_admin', 'commercial', 'financial')
      AND user_profiles.is_active = true
    )
  );

-- Admins gerenciam contratos
CREATE POLICY "Admins gerenciam contratos"
  ON client_contracts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type IN ('super_admin', 'commercial')
      AND user_profiles.is_active = true
    )
  );

-- ===== POLÍTICAS: client_rules_documents =====

-- Clientes veem seus documentos de regras
CREATE POLICY "Clientes veem documentos de regras"
  ON client_rules_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN clients c ON c.id = up.client_id
      WHERE c.id = client_rules_documents.client_id
      AND up.user_id = auth.uid()
    )
  );

-- Admins gerenciam documentos de regras
CREATE POLICY "Admins gerenciam documentos"
  ON client_rules_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type IN ('super_admin', 'commercial')
      AND user_profiles.is_active = true
    )
  );

-- ===== POLÍTICAS: client_referrals =====

-- Clientes veem suas indicações
CREATE POLICY "Clientes veem suas indicações"
  ON client_referrals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN clients c ON c.id = up.client_id
      WHERE (c.id = client_referrals.referrer_id OR c.id = client_referrals.referred_id)
      AND up.user_id = auth.uid()
    )
  );

-- Admins veem todas as indicações
CREATE POLICY "Admins veem todas as indicações"
  ON client_referrals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type IN ('super_admin', 'commercial')
      AND user_profiles.is_active = true
    )
  );

-- =====================================================
-- Fim da Migration: Sistema de Clientes
-- =====================================================

