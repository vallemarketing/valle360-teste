/*
  # Sistema Completo de Contratos e Métricas Valle 360

  ## Visão Geral
  Esta migration cria todo o sistema necessário para gerenciar contratos de clientes,
  métricas históricas, comparativos antes/depois, configurações de serviços contratados,
  sistema de aprovações com feedback, e perfis editáveis.

  ## Novas Tabelas

  ### 1. client_profiles (Perfis Completos dos Clientes)
    - `id` (uuid, PK) - ID do usuário (referência para auth.users)
    - `full_name` (text) - Nome completo
    - `company_name` (text) - Nome da empresa
    - `email` (text) - Email
    - `phone` (text) - Telefone
    - `avatar_url` (text) - URL da foto de perfil
    - `position` (text) - Cargo
    - `department` (text) - Departamento
    - `address` (jsonb) - Endereço completo
    - `preferences` (jsonb) - Preferências do usuário
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ### 2. client_contracts (Contratos de Clientes)
    - `id` (uuid, PK)
    - `client_id` (uuid, FK -> client_profiles)
    - `contract_start_date` (date) - Data de início do contrato
    - `contract_status` (text) - Status: active, paused, cancelled
    - `monthly_value` (decimal) - Valor mensal do contrato
    - `services_contracted` (jsonb) - Lista de serviços contratados
    - `payment_day` (int) - Dia do vencimento
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ### 3. contracted_services (Serviços Contratados Detalhados)
    - `id` (uuid, PK)
    - `contract_id` (uuid, FK -> client_contracts)
    - `service_type` (text) - social_media, traffic, blogs, commercial, etc
    - `service_name` (text) - Nome do serviço
    - `is_active` (boolean) - Se está ativo
    - `features` (jsonb) - Features incluídas (análise_sentimento, análise_concorrência, etc)
    - `activated_at` (timestamptz)
    - `deactivated_at` (timestamptz)

  ### 4. metrics_history (Histórico de Métricas)
    - `id` (uuid, PK)
    - `client_id` (uuid, FK -> client_profiles)
    - `service_type` (text) - Tipo de serviço
    - `metric_date` (date) - Data da métrica
    - `metrics` (jsonb) - Todas as métricas do dia
    - `created_at` (timestamptz)

  ### 5. before_after_metrics (Métricas Antes vs Depois)
    - `id` (uuid, PK)
    - `client_id` (uuid, FK -> client_profiles)
    - `service_type` (text)
    - `before_metrics` (jsonb) - Métricas antes da Valle 360
    - `before_period_start` (date)
    - `before_period_end` (date)
    - `after_metrics` (jsonb) - Métricas após Valle 360
    - `after_period_start` (date)
    - `after_period_end` (date)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ### 6. approval_requests (Solicitações de Aprovação)
    - `id` (uuid, PK)
    - `client_id` (uuid, FK -> client_profiles)
    - `material_title` (text)
    - `material_type` (text)
    - `material_url` (text)
    - `description` (text)
    - `submitted_by` (text)
    - `status` (text) - aguardando, aprovado, recusado
    - `approved_at` (timestamptz)
    - `rejected_at` (timestamptz)
    - `rejection_feedback` (text)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ### 7. approval_notifications (Notificações de Aprovação)
    - `id` (uuid, PK)
    - `approval_request_id` (uuid, FK -> approval_requests)
    - `client_id` (uuid, FK -> client_profiles)
    - `notification_type` (text) - approved, rejected, feedback
    - `message` (text)
    - `is_read` (boolean)
    - `created_at` (timestamptz)

  ### 8. payment_transactions (Transações de Pagamento)
    - `id` (uuid, PK)
    - `client_id` (uuid, FK -> client_profiles)
    - `contract_id` (uuid, FK -> client_contracts)
    - `amount` (decimal)
    - `payment_method` (text) - pix, credit_card, boleto
    - `payment_status` (text) - pending, paid, overdue, cancelled
    - `due_date` (date)
    - `paid_at` (timestamptz)
    - `pix_code` (text)
    - `transaction_id` (text)
    - `invoice_url` (text)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ## Segurança
  - RLS habilitado em todas as tabelas
  - Políticas restritivas: clientes só veem seus próprios dados
  - Super Admin tem acesso total via políticas específicas

  ## Índices
  - Índices em foreign keys para performance
  - Índices em campos de data para consultas temporais
  - Índices em status para filtros rápidos
*/

-- Criar enum para status de contrato
DO $$ BEGIN
  CREATE TYPE contract_status_enum AS ENUM ('active', 'paused', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Criar enum para status de pagamento
DO $$ BEGIN
  CREATE TYPE payment_status_enum AS ENUM ('pending', 'paid', 'overdue', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Criar enum para status de aprovação
DO $$ BEGIN
  CREATE TYPE approval_status_enum AS ENUM ('aguardando', 'aprovado', 'recusado');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 1. Tabela de Perfis de Clientes
CREATE TABLE IF NOT EXISTS client_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  company_name text,
  email text NOT NULL,
  phone text,
  avatar_url text,
  position text,
  department text,
  address jsonb DEFAULT '{}'::jsonb,
  preferences jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Tabela de Contratos
CREATE TABLE IF NOT EXISTS client_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  contract_start_date date NOT NULL,
  contract_status text NOT NULL DEFAULT 'active',
  monthly_value decimal(10,2) NOT NULL DEFAULT 0,
  services_contracted jsonb DEFAULT '[]'::jsonb,
  payment_day int NOT NULL DEFAULT 15,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Tabela de Serviços Contratados
CREATE TABLE IF NOT EXISTS contracted_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES client_contracts(id) ON DELETE CASCADE,
  service_type text NOT NULL,
  service_name text NOT NULL,
  is_active boolean DEFAULT true,
  features jsonb DEFAULT '{}'::jsonb,
  activated_at timestamptz DEFAULT now(),
  deactivated_at timestamptz
);

-- 4. Tabela de Histórico de Métricas
CREATE TABLE IF NOT EXISTS metrics_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  service_type text NOT NULL,
  metric_date date NOT NULL,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- 5. Tabela de Comparativos Antes/Depois
CREATE TABLE IF NOT EXISTS before_after_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  service_type text NOT NULL,
  before_metrics jsonb DEFAULT '{}'::jsonb,
  before_period_start date,
  before_period_end date,
  after_metrics jsonb DEFAULT '{}'::jsonb,
  after_period_start date,
  after_period_end date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. Tabela de Solicitações de Aprovação
CREATE TABLE IF NOT EXISTS approval_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  material_title text NOT NULL,
  material_type text NOT NULL,
  material_url text,
  description text,
  submitted_by text NOT NULL,
  status text NOT NULL DEFAULT 'aguardando',
  approved_at timestamptz,
  rejected_at timestamptz,
  rejection_feedback text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 7. Tabela de Notificações de Aprovação
CREATE TABLE IF NOT EXISTS approval_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_request_id uuid NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  notification_type text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 8. Tabela de Transações de Pagamento
CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  contract_id uuid NOT NULL REFERENCES client_contracts(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  payment_method text,
  payment_status text NOT NULL DEFAULT 'pending',
  due_date date NOT NULL,
  paid_at timestamptz,
  pix_code text,
  transaction_id text,
  invoice_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_client_contracts_client_id ON client_contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_contracted_services_contract_id ON contracted_services(contract_id);
CREATE INDEX IF NOT EXISTS idx_metrics_history_client_id ON metrics_history(client_id);
CREATE INDEX IF NOT EXISTS idx_metrics_history_date ON metrics_history(metric_date);
CREATE INDEX IF NOT EXISTS idx_before_after_metrics_client_id ON before_after_metrics(client_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_client_id ON approval_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_client_id ON payment_transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(payment_status);

-- Habilitar RLS em todas as tabelas
ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracted_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE before_after_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para client_profiles
CREATE POLICY "Usuários podem ver seu próprio perfil"
  ON client_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON client_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Super Admin pode ver todos os perfis"
  ON client_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Políticas RLS para client_contracts
CREATE POLICY "Clientes podem ver seus próprios contratos"
  ON client_contracts FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

CREATE POLICY "Super Admin pode gerenciar todos os contratos"
  ON client_contracts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Políticas RLS para contracted_services
CREATE POLICY "Clientes podem ver seus serviços contratados"
  ON contracted_services FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM client_contracts
      WHERE client_contracts.id = contracted_services.contract_id
      AND client_contracts.client_id = auth.uid()
    )
  );

-- Políticas RLS para metrics_history
CREATE POLICY "Clientes podem ver suas métricas"
  ON metrics_history FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

CREATE POLICY "Sistema pode inserir métricas"
  ON metrics_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Políticas RLS para before_after_metrics
CREATE POLICY "Clientes podem ver seus comparativos"
  ON before_after_metrics FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

-- Políticas RLS para approval_requests
CREATE POLICY "Clientes podem ver suas aprovações"
  ON approval_requests FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

CREATE POLICY "Clientes podem atualizar suas aprovações"
  ON approval_requests FOR UPDATE
  TO authenticated
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

-- Políticas RLS para approval_notifications
CREATE POLICY "Clientes podem ver suas notificações"
  ON approval_notifications FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

CREATE POLICY "Clientes podem atualizar suas notificações"
  ON approval_notifications FOR UPDATE
  TO authenticated
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

-- Políticas RLS para payment_transactions
CREATE POLICY "Clientes podem ver seus pagamentos"
  ON payment_transactions FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

CREATE POLICY "Clientes podem criar pagamentos"
  ON payment_transactions FOR INSERT
  TO authenticated
  WITH CHECK (client_id = auth.uid());

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
DROP TRIGGER IF EXISTS update_client_profiles_updated_at ON client_profiles;
CREATE TRIGGER update_client_profiles_updated_at
  BEFORE UPDATE ON client_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_client_contracts_updated_at ON client_contracts;
CREATE TRIGGER update_client_contracts_updated_at
  BEFORE UPDATE ON client_contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_before_after_metrics_updated_at ON before_after_metrics;
CREATE TRIGGER update_before_after_metrics_updated_at
  BEFORE UPDATE ON before_after_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_approval_requests_updated_at ON approval_requests;
CREATE TRIGGER update_approval_requests_updated_at
  BEFORE UPDATE ON approval_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_transactions_updated_at ON payment_transactions;
CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();