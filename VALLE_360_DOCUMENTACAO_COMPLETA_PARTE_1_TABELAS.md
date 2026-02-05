# VALLE 360 - DOCUMENTAÇÃO COMPLETA DO SISTEMA
## PARTE 1: ESTRUTURA DE TABELAS DO BANCO DE DADOS

> **Análise completa do frontend do projeto Valle 360**
> Baseado no código-fonte: https://github.com/vallemarketing/valle-360.git

---

## 📋 ÍNDICE GERAL

### PARTE 1: Tabelas do Banco de Dados (Este documento)
### PARTE 2: Relacionamentos Entre Tabelas
### PARTE 3: Endpoints de API Necessários
### PARTE 4: Autenticação e Permissões

---

# PARTE 1: TABELAS DO BANCO DE DADOS

Todas as tabelas devem ser criadas DO ZERO com Row Level Security (RLS) habilitado.

---

## 1. MÓDULO DE AUTENTICAÇÃO E USUÁRIOS

### 1.1 Tabela: `user_profiles`
**Descrição**: Perfis de usuários do sistema (colaboradores e clientes)

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
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
  
  -- Relacionamentos
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  
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

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_user_type ON user_profiles(user_type);
CREATE INDEX idx_user_profiles_client_id ON user_profiles(client_id);
CREATE INDEX idx_user_profiles_employee_id ON user_profiles(employee_id);
```

### 1.2 Tabela: `user_preferences`
**Descrição**: Preferências detalhadas de notificações e personalização

```sql
CREATE TABLE user_preferences (
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

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
```

### 1.3 Tabela: `user_sessions`
**Descrição**: Sessões ativas e histórico de login

```sql
CREATE TABLE user_sessions (
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

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_active ON user_sessions(is_active) WHERE is_active = true;
```

---

## 2. MÓDULO DE CLIENTES

### 2.1 Tabela: `clients`
**Descrição**: Empresas/clientes que contratam os serviços

```sql
CREATE TABLE clients (
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

CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_is_active ON clients(is_active);
CREATE INDEX idx_clients_account_manager ON clients(account_manager);
CREATE INDEX idx_clients_referred_by ON clients(referred_by);
```

### 2.2 Tabela: `client_profiles_extended`
**Descrição**: Informações detalhadas e documentos do cliente

```sql
CREATE TABLE client_profiles_extended (
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

CREATE INDEX idx_client_profiles_extended_user_id ON client_profiles_extended(user_id);
CREATE INDEX idx_client_profiles_extended_cpf_cnpj ON client_profiles_extended(cpf_cnpj);
```

### 2.3 Tabela: `client_contracts`
**Descrição**: Contratos dos clientes

```sql
CREATE TABLE client_contracts (
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

CREATE INDEX idx_client_contracts_client_id ON client_contracts(client_id);
CREATE INDEX idx_client_contracts_number ON client_contracts(contract_number);
CREATE INDEX idx_client_contracts_status ON client_contracts(status);
CREATE INDEX idx_client_contracts_current ON client_contracts(is_current) WHERE is_current = true;
```

### 2.4 Tabela: `client_rules_documents`
**Descrição**: Documentos de regras e políticas do cliente

```sql
CREATE TABLE client_rules_documents (
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

CREATE INDEX idx_client_rules_documents_client_id ON client_rules_documents(client_id);
CREATE INDEX idx_client_rules_documents_current ON client_rules_documents(is_current) WHERE is_current = true;
```

### 2.5 Tabela: `client_referrals`
**Descrição**: Sistema de indicações entre clientes

```sql
CREATE TABLE client_referrals (
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_client_referrals_referrer_id ON client_referrals(referrer_id);
CREATE INDEX idx_client_referrals_referred_id ON client_referrals(referred_id);
CREATE INDEX idx_client_referrals_status ON client_referrals(status);
```

---

## 3. MÓDULO DE CRÉDITOS E FINANCEIRO DO CLIENTE

### 3.1 Tabela: `client_credits`
**Descrição**: Histórico de transações de créditos

```sql
CREATE TABLE client_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  
  -- Tipo de transação
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('recharge', 'usage', 'adjustment', 'refund')),
  
  -- Descrição
  description TEXT NOT NULL,
  
  -- Valores
  amount DECIMAL(10, 2) NOT NULL,
  balance_after DECIMAL(10, 2) NOT NULL,
  
  -- Referência (opcional - link para campanha, etc)
  reference_type VARCHAR(50),
  reference_id UUID,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_client_credits_client_id ON client_credits(client_id);
CREATE INDEX idx_client_credits_transaction_type ON client_credits(transaction_type);
CREATE INDEX idx_client_credits_created_at ON client_credits(created_at DESC);
```

### 3.2 Tabela: `client_credit_balance`
**Descrição**: Saldo atual de créditos de cada cliente

```sql
CREATE TABLE client_credit_balance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Saldo
  current_balance DECIMAL(10, 2) DEFAULT 0 NOT NULL,
  total_purchased DECIMAL(10, 2) DEFAULT 0 NOT NULL,
  total_used DECIMAL(10, 2) DEFAULT 0 NOT NULL,
  
  -- Timestamps
  last_transaction_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_client_credit_balance_client_id ON client_credit_balance(client_id);
```

### 3.3 Tabela: `client_benefits`
**Descrição**: Benefícios e descontos do cliente

```sql
CREATE TABLE client_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  
  -- Tipo de benefício
  benefit_type VARCHAR(50) NOT NULL CHECK (benefit_type IN ('loyalty_discount', 'referral_discount', 'annual_payment_discount', 'custom')),
  
  -- Detalhes
  benefit_name VARCHAR(255) NOT NULL,
  benefit_value DECIMAL(10, 2) NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Indicações (se aplicável)
  referral_count INTEGER DEFAULT 0,
  
  -- Período de validade
  start_date DATE NOT NULL,
  end_date DATE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_client_benefits_client_id ON client_benefits(client_id);
CREATE INDEX idx_client_benefits_active ON client_benefits(is_active) WHERE is_active = true;
CREATE INDEX idx_client_benefits_type ON client_benefits(benefit_type);
```

### 3.4 Tabela: `invoices`
**Descrição**: Faturas dos clientes

```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  
  -- Identificação
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- Datas
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  
  -- Valores
  value DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'BRL' NOT NULL,
  
  -- Status
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'partial', 'paid', 'overdue', 'cancelled')),
  
  -- Arquivo
  pdf_url TEXT,
  
  -- Observações
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
```

### 3.5 Tabela: `payments`
**Descrição**: Pagamentos realizados

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  
  -- Método de pagamento
  payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('credit_card', 'debit_card', 'bank_transfer', 'pix', 'boleto', 'cash')),
  
  -- Valor
  amount DECIMAL(10, 2) NOT NULL,
  
  -- Gateway de pagamento
  payment_gateway VARCHAR(50) CHECK (payment_gateway IN ('mercadopago', 'stripe', 'manual')),
  
  -- ID da transação no gateway
  transaction_id TEXT,
  confirmation_code TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  error_message TEXT,
  
  -- Observações
  notes TEXT,
  
  -- Comprovante
  receipt_url TEXT,
  
  -- Timestamps
  paid_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_client_id ON payments(client_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_paid_at ON payments(paid_at DESC);
```

### 3.6 Tabela: `payment_reminders`
**Descrição**: Lembretes de pagamento enviados

```sql
CREATE TABLE payment_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  
  -- Tipo de lembrete
  reminder_type VARCHAR(50) NOT NULL CHECK (reminder_type IN ('3_days_before', 'due_date', '3_days_after', '7_days_after', '15_days_after')),
  
  -- Canal
  sent_via VARCHAR(20) NOT NULL CHECK (sent_via IN ('email', 'whatsapp', 'both')),
  
  -- Status
  status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'failed')),
  
  -- Timestamp
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_payment_reminders_invoice_id ON payment_reminders(invoice_id);
CREATE INDEX idx_payment_reminders_type ON payment_reminders(reminder_type);
```

---

## 4. MÓDULO DE MÉTRICAS DO CLIENTE

### 4.1 Tabela: `client_metrics`
**Descrição**: Métricas mensais consolidadas do cliente

```sql
CREATE TABLE client_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  
  -- Período
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL CHECK (year >= 2020),
  
  -- Métricas financeiras
  revenue DECIMAL(10, 2) DEFAULT 0,
  ad_spend DECIMAL(10, 2) DEFAULT 0,
  roas DECIMAL(10, 4) DEFAULT 0,
  
  -- Métricas de alcance
  impressions BIGINT DEFAULT 0,
  reach BIGINT DEFAULT 0,
  
  -- Métricas de engajamento
  engagement_rate DECIMAL(5, 2) DEFAULT 0,
  
  -- Métricas de conversão
  conversions INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5, 2) DEFAULT 0,
  
  -- Métricas de custo
  cpc DECIMAL(10, 2) DEFAULT 0,
  cpm DECIMAL(10, 2) DEFAULT 0,
  ctr DECIMAL(5, 2) DEFAULT 0,
  
  -- Crescimento de audiência
  followers_gained INTEGER DEFAULT 0,
  
  -- Produção de conteúdo
  posts_published INTEGER DEFAULT 0,
  stories_published INTEGER DEFAULT 0,
  
  -- Satisfação
  nps_score DECIMAL(3, 1),
  satisfaction_score DECIMAL(3, 1),
  
  -- Crescimento percentual
  growth_percentage DECIMAL(5, 2),
  
  -- Metadados adicionais
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  UNIQUE(client_id, month, year)
);

CREATE INDEX idx_client_metrics_client_id ON client_metrics(client_id);
CREATE INDEX idx_client_metrics_period ON client_metrics(year DESC, month DESC);
```

### 4.2 Tabela: `social_media_accounts`
**Descrição**: Contas de redes sociais vinculadas ao cliente

```sql
CREATE TABLE social_media_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  
  -- Plataforma
  platform VARCHAR(50) NOT NULL CHECK (platform IN ('instagram', 'facebook', 'linkedin', 'tiktok', 'youtube', 'twitter')),
  
  -- Dados da conta
  account_username VARCHAR(255) NOT NULL,
  account_url TEXT,
  account_id_external TEXT,
  
  -- Autenticação (se aplicável)
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_connected BOOLEAN DEFAULT false,
  
  -- Timestamps
  connected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_social_media_accounts_client_id ON social_media_accounts(client_id);
CREATE INDEX idx_social_media_accounts_platform ON social_media_accounts(platform);
CREATE INDEX idx_social_media_accounts_active ON social_media_accounts(is_active) WHERE is_active = true;
```

### 4.3 Tabela: `contract_services`
**Descrição**: Serviços ativos no contrato do cliente

```sql
CREATE TABLE contract_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  
  -- Tipo de serviço
  service_type VARCHAR(50) NOT NULL CHECK (service_type IN ('redes_sociais', 'comercial', 'trafego_pago', 'site', 'design', 'video')),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Período
  start_date DATE NOT NULL,
  end_date DATE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_contract_services_client_id ON contract_services(client_id);
CREATE INDEX idx_contract_services_type ON contract_services(service_type);
CREATE INDEX idx_contract_services_active ON contract_services(is_active) WHERE is_active = true;
```

### 4.4 Tabela: `before_after_metrics`
**Descrição**: Métricas de antes e depois da contratação dos serviços

```sql
CREATE TABLE before_after_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  
  -- Tipo de serviço
  service_type VARCHAR(50) NOT NULL CHECK (service_type IN ('redes_sociais', 'comercial', 'trafego_pago', 'site')),
  
  -- Nome e label da métrica
  metric_name VARCHAR(100) NOT NULL,
  metric_label VARCHAR(255) NOT NULL,
  
  -- Valores
  before_value DECIMAL(15, 2) NOT NULL,
  after_value DECIMAL(15, 2) NOT NULL,
  
  -- Data da medição
  measurement_date DATE NOT NULL,
  
  -- Cálculos automáticos
  improvement_percentage DECIMAL(10, 2) GENERATED ALWAYS AS (
    CASE 
      WHEN before_value = 0 THEN 100
      ELSE ((after_value - before_value) / before_value * 100)
    END
  ) STORED,
  
  -- Unidade de medida
  unit VARCHAR(50) DEFAULT 'number',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_before_after_metrics_client_id ON before_after_metrics(client_id);
CREATE INDEX idx_before_after_metrics_service ON before_after_metrics(service_type);
CREATE INDEX idx_before_after_metrics_date ON before_after_metrics(measurement_date DESC);
```

### 4.5 Tabela: `client_dashboard_settings`
**Descrição**: Configurações de personalização do dashboard do cliente

```sql
CREATE TABLE client_dashboard_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Ordem das seções
  section_order JSONB DEFAULT '[]'::jsonb,
  
  -- Seções ocultas
  hidden_sections JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_client_dashboard_settings_client_id ON client_dashboard_settings(client_id);
```

---

## 5. MÓDULO DE PRODUÇÃO E APROVAÇÕES

### 5.1 Tabela: `production_items`
**Descrição**: Itens de produção criados pela equipe para aprovação do cliente

```sql
CREATE TABLE production_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  
  -- Informações básicas
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Tipo de item
  item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('post_instagram', 'post_facebook', 'post_linkedin', 'story', 'reel', 'video', 'banner', 'logo', 'flyer', 'website', 'other')),
  
  -- Arquivos
  file_url TEXT,
  preview_url TEXT,
  thumbnail_url TEXT,
  
  -- Status de aprovação
  status VARCHAR(30) DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'approved', 'rejected', 'in_revision', 'scheduled', 'published')),
  
  -- Responsáveis
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  -- Prazo
  due_date TIMESTAMP WITH TIME ZONE,
  
  -- Aprovação
  approved_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Rejeição
  rejection_reason TEXT,
  revision_count INTEGER DEFAULT 0,
  
  -- Publicação
  scheduled_publish_date TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  
  -- Métricas (se publicado)
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  engagement INTEGER DEFAULT 0,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_production_items_client_id ON production_items(client_id);
CREATE INDEX idx_production_items_status ON production_items(status);
CREATE INDEX idx_production_items_created_by ON production_items(created_by);
CREATE INDEX idx_production_items_assigned_to ON production_items(assigned_to);
CREATE INDEX idx_production_items_due_date ON production_items(due_date);
```

### 5.2 Tabela: `production_comments`
**Descrição**: Comentários e feedback em itens de produção

```sql
CREATE TABLE production_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_item_id UUID REFERENCES production_items(id) ON DELETE CASCADE NOT NULL,
  
  -- Autor
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Conteúdo
  content TEXT NOT NULL,
  
  -- Tipo de comentário
  comment_type VARCHAR(20) DEFAULT 'feedback' CHECK (comment_type IN ('feedback', 'approval', 'rejection', 'revision_request', 'note')),
  
  -- Resposta a outro comentário
  parent_comment_id UUID REFERENCES production_comments(id) ON DELETE CASCADE,
  
  -- Anexos
  attachments JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_production_comments_item_id ON production_comments(production_item_id);
CREATE INDEX idx_production_comments_user_id ON production_comments(user_id);
CREATE INDEX idx_production_comments_parent ON production_comments(parent_comment_id);
```

### 5.3 Tabela: `production_approvals`
**Descrição**: Histórico de aprovações/rejeições

```sql
CREATE TABLE production_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_item_id UUID REFERENCES production_items(id) ON DELETE CASCADE NOT NULL,
  
  -- Aprovação ou rejeição
  approved BOOLEAN NOT NULL,
  
  -- Responsável
  approved_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  -- Feedback
  comments TEXT,
  revision_notes TEXT,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamp
  approved_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_production_approvals_item_id ON production_approvals(production_item_id);
CREATE INDEX idx_production_approvals_approved_by ON production_approvals(approved_by);
CREATE INDEX idx_production_approvals_date ON production_approvals(approved_at DESC);
```

---

*Continua na PARTE 2...*

