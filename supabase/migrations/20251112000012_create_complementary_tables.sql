-- =====================================================
-- MIGRATION: Tabelas Complementares
-- Descrição: Tabelas adicionais (NPS, referências, etc)
-- Dependências: Todas as migrations anteriores
-- =====================================================

-- =====================================================
-- NPS E AVALIAÇÕES
-- =====================================================

CREATE TABLE IF NOT EXISTS nps_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 10),
  category VARCHAR(20) GENERATED ALWAYS AS (
    CASE
      WHEN score >= 9 THEN 'promoter'
      WHEN score >= 7 THEN 'passive'
      ELSE 'detractor'
    END
  ) STORED,
  
  feedback TEXT,
  
  rating_period DATE NOT NULL,
  
  response_channel VARCHAR(30) CHECK (response_channel IN ('email', 'whatsapp', 'system', 'phone', 'survey')),
  
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_completed BOOLEAN DEFAULT false,
  follow_up_notes TEXT,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_nps_ratings_client ON nps_ratings(client_id);
CREATE INDEX idx_nps_ratings_score ON nps_ratings(score);
CREATE INDEX idx_nps_ratings_category ON nps_ratings(category);
CREATE INDEX idx_nps_ratings_period ON nps_ratings(rating_period DESC);

COMMENT ON TABLE nps_ratings IS 'Avaliações NPS (Net Promoter Score) dos clientes';

-- =====================================================
-- REFERÊNCIAS DE CLIENTES
-- =====================================================

CREATE TABLE IF NOT EXISTS client_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  referrer_client_id UUID REFERENCES clients(id) ON DELETE SET NULL NOT NULL,
  referred_client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  
  referred_name VARCHAR(255) NOT NULL,
  referred_email VARCHAR(255),
  referred_phone VARCHAR(50),
  
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'converted', 'rejected')),
  
  contacted_at TIMESTAMP WITH TIME ZONE,
  converted_at TIMESTAMP WITH TIME ZONE,
  
  reward_given BOOLEAN DEFAULT false,
  reward_type VARCHAR(50),
  reward_value NUMERIC(10, 2),
  reward_date DATE,
  
  notes TEXT,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_client_referrals_referrer ON client_referrals(referrer_client_id);
CREATE INDEX idx_client_referrals_referred ON client_referrals(referred_client_id);
CREATE INDEX idx_client_referrals_status ON client_referrals(status);

COMMENT ON TABLE client_referrals IS 'Sistema de indicações de clientes';

-- =====================================================
-- CATEGORIAS DE SERVIÇOS
-- =====================================================

CREATE TABLE IF NOT EXISTS service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  
  icon VARCHAR(50),
  color VARCHAR(20) DEFAULT '#cccccc',
  
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_service_categories_active ON service_categories(is_active) WHERE is_active = true;

COMMENT ON TABLE service_categories IS 'Categorias de serviços oferecidos';

-- =====================================================
-- SERVIÇOS
-- =====================================================

CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  category_id UUID REFERENCES service_categories(id) ON DELETE SET NULL,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  short_description TEXT,
  
  base_price NUMERIC(10, 2),
  currency VARCHAR(3) DEFAULT 'BRL',
  
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  
  duration_days INTEGER,
  
  includes JSONB DEFAULT '[]'::jsonb,
  requirements JSONB DEFAULT '[]'::jsonb,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_services_category ON services(category_id);
CREATE INDEX idx_services_active ON services(is_active) WHERE is_active = true;
CREATE INDEX idx_services_featured ON services(is_featured) WHERE is_featured = true;

COMMENT ON TABLE services IS 'Serviços oferecidos pela agência';

-- =====================================================
-- SERVIÇOS DO CONTRATO
-- =====================================================

CREATE TABLE IF NOT EXISTS contract_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  contract_id UUID REFERENCES client_contracts(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  
  service_name VARCHAR(255) NOT NULL,
  quantity INTEGER DEFAULT 1,
  
  unit_price NUMERIC(10, 2) NOT NULL,
  total_price NUMERIC(10, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  
  custom_details JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  UNIQUE(contract_id, service_id)
);

CREATE INDEX idx_contract_services_contract ON contract_services(contract_id);
CREATE INDEX idx_contract_services_service ON contract_services(service_id);

COMMENT ON TABLE contract_services IS 'Serviços incluídos em cada contrato';

-- =====================================================
-- PERFIL ESTENDIDO DO CLIENTE
-- =====================================================

CREATE TABLE IF NOT EXISTS client_profile_extended (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  company_size VARCHAR(20) CHECK (company_size IN ('micro', 'small', 'medium', 'large', 'enterprise')),
  industry VARCHAR(100),
  
  address_street TEXT,
  address_number VARCHAR(20),
  address_complement VARCHAR(100),
  address_neighborhood VARCHAR(100),
  address_city VARCHAR(100),
  address_state VARCHAR(2),
  address_zipcode VARCHAR(10),
  address_country VARCHAR(50) DEFAULT 'Brasil',
  
  cnpj VARCHAR(18),
  state_registration VARCHAR(50),
  municipal_registration VARCHAR(50),
  
  billing_email VARCHAR(255),
  billing_phone VARCHAR(50),
  
  bank_name VARCHAR(100),
  bank_account VARCHAR(50),
  bank_agency VARCHAR(20),
  pix_key TEXT,
  
  preferred_contact_method VARCHAR(30) DEFAULT 'email' CHECK (preferred_contact_method IN ('email', 'phone', 'whatsapp', 'telegram', 'system')),
  
  timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
  language VARCHAR(10) DEFAULT 'pt-BR',
  
  notes TEXT,
  internal_notes TEXT,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_client_profile_extended_client ON client_profile_extended(client_id);
CREATE INDEX idx_client_profile_extended_cnpj ON client_profile_extended(cnpj);

COMMENT ON TABLE client_profile_extended IS 'Informações estendidas e detalhadas dos clientes';

-- =====================================================
-- CONTATOS ADICIONAIS DO CLIENTE
-- =====================================================

CREATE TABLE IF NOT EXISTS additional_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  
  name VARCHAR(255) NOT NULL,
  role VARCHAR(100),
  department VARCHAR(100),
  
  email VARCHAR(255),
  phone VARCHAR(50),
  whatsapp VARCHAR(50),
  
  is_primary BOOLEAN DEFAULT false,
  is_billing_contact BOOLEAN DEFAULT false,
  is_technical_contact BOOLEAN DEFAULT false,
  
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_additional_contacts_client ON additional_contacts(client_id);
CREATE INDEX idx_additional_contacts_primary ON additional_contacts(is_primary) WHERE is_primary = true;

COMMENT ON TABLE additional_contacts IS 'Contatos adicionais dos clientes (responsáveis, gestores, etc)';

-- =====================================================
-- DOCUMENTOS DO CLIENTE
-- =====================================================

CREATE TABLE IF NOT EXISTS client_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  
  document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('contract', 'proposal', 'nda', 'invoice', 'receipt', 'report', 'briefing', 'other')),
  
  document_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size_bytes BIGINT,
  
  document_date DATE,
  expiration_date DATE,
  
  is_signed BOOLEAN DEFAULT false,
  signed_at TIMESTAMP WITH TIME ZONE,
  signed_by VARCHAR(255),
  
  is_active BOOLEAN DEFAULT true,
  
  uploaded_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_client_documents_client ON client_documents(client_id);
CREATE INDEX idx_client_documents_type ON client_documents(document_type);
CREATE INDEX idx_client_documents_active ON client_documents(is_active) WHERE is_active = true;

COMMENT ON TABLE client_documents IS 'Documentos e arquivos importantes dos clientes';

-- =====================================================
-- REGRAS E DIRETRIZES DO CLIENTE
-- =====================================================

CREATE TABLE IF NOT EXISTS client_rules_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  
  document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('brand_guidelines', 'style_guide', 'content_policy', 'approval_workflow', 'communication_guide', 'other')),
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  file_url TEXT,
  
  rules_content JSONB DEFAULT '{}'::jsonb,
  
  is_active BOOLEAN DEFAULT true,
  
  version VARCHAR(20) DEFAULT '1.0',
  
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_client_rules_client ON client_rules_documents(client_id);
CREATE INDEX idx_client_rules_type ON client_rules_documents(document_type);

COMMENT ON TABLE client_rules_documents IS 'Regras, diretrizes e manuais de marca dos clientes';

-- =====================================================
-- BENEFÍCIOS DO CLIENTE
-- =====================================================

CREATE TABLE IF NOT EXISTS client_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  
  benefit_type VARCHAR(50) NOT NULL,
  benefit_name VARCHAR(255) NOT NULL,
  description TEXT,
  
  value NUMERIC(10, 2),
  
  is_active BOOLEAN DEFAULT true,
  
  start_date DATE NOT NULL,
  end_date DATE,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_client_benefits_client ON client_benefits(client_id);
CREATE INDEX idx_client_benefits_active ON client_benefits(is_active) WHERE is_active = true;

COMMENT ON TABLE client_benefits IS 'Benefícios e vantagens oferecidos aos clientes';

-- =====================================================
-- CATEGORIAS DE DESPESAS
-- =====================================================

CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  
  parent_category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_expense_categories_parent ON expense_categories(parent_category_id);

COMMENT ON TABLE expense_categories IS 'Categorias de despesas para organização financeira';

-- =====================================================
-- CONTAS SOCIAIS DO CLIENTE
-- =====================================================

CREATE TABLE IF NOT EXISTS client_social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  
  platform VARCHAR(30) NOT NULL,
  account_username VARCHAR(255),
  account_url TEXT,
  
  access_granted BOOLEAN DEFAULT false,
  access_level VARCHAR(30),
  
  credentials_stored BOOLEAN DEFAULT false,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  
  is_active BOOLEAN DEFAULT true,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  UNIQUE(client_id, platform)
);

CREATE INDEX idx_client_social_accounts_client ON client_social_accounts(client_id);
CREATE INDEX idx_client_social_accounts_platform ON client_social_accounts(platform);

COMMENT ON TABLE client_social_accounts IS 'Contas de redes sociais dos clientes';

-- =====================================================
-- CONVITES DE COLABORADORES
-- =====================================================

CREATE TABLE IF NOT EXISTS employee_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  
  department VARCHAR(100),
  position VARCHAR(100),
  
  invitation_token TEXT UNIQUE NOT NULL,
  
  invited_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_employee_invitations_email ON employee_invitations(email);
CREATE INDEX idx_employee_invitations_token ON employee_invitations(invitation_token);
CREATE INDEX idx_employee_invitations_status ON employee_invitations(status);

COMMENT ON TABLE employee_invitations IS 'Convites enviados para novos colaboradores';

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER update_client_referrals_updated_at
  BEFORE UPDATE ON client_referrals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_categories_updated_at
  BEFORE UPDATE ON service_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_profile_extended_updated_at
  BEFORE UPDATE ON client_profile_extended
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_additional_contacts_updated_at
  BEFORE UPDATE ON additional_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_documents_updated_at
  BEFORE UPDATE ON client_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_rules_documents_updated_at
  BEFORE UPDATE ON client_rules_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_social_accounts_updated_at
  BEFORE UPDATE ON client_social_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE nps_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_profile_extended ENABLE ROW LEVEL SECURITY;
ALTER TABLE additional_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_rules_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_social_accounts ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (todos podem ver categorias e serviços)
CREATE POLICY "Ver categorias de serviços"
  ON service_categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Ver serviços"
  ON services FOR SELECT
  USING (is_active = true);

-- Clientes veem seu próprio perfil estendido
CREATE POLICY "Clientes veem seu perfil estendido"
  ON client_profile_extended FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN clients c ON c.id = up.client_id
      WHERE c.id = client_profile_extended.client_id
      AND up.user_id = auth.uid()
    )
  );

-- Colaboradores veem perfis de clientes
CREATE POLICY "Colaboradores veem perfis estendidos"
  ON client_profile_extended FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type != 'client'
      AND user_profiles.is_active = true
    )
  );

-- =====================================================
-- Fim da Migration: Tabelas Complementares
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration de tabelas complementares concluída com sucesso!';
END $$;

