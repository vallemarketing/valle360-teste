-- =====================================================
-- MIGRATION: Sistema Financeiro Completo
-- Descrição: Contas a pagar/receber, folha de pagamento, bancos e impostos
-- Dependências: 20251112000002_create_clients_system.sql, 20251112000008_create_employees_hr_system.sql
-- =====================================================

-- =====================================================
-- BANCOS E CONTAS
-- =====================================================

CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  account_name VARCHAR(255) NOT NULL,
  bank_name VARCHAR(100) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  agency VARCHAR(20),
  account_type VARCHAR(20) CHECK (account_type IN ('checking', 'savings', 'investment', 'payroll')),
  
  currency VARCHAR(3) DEFAULT 'BRL',
  current_balance NUMERIC(12, 2) DEFAULT 0.00,
  
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_bank_accounts_active ON bank_accounts(is_active) WHERE is_active = true;

CREATE TABLE IF NOT EXISTS bank_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE CASCADE NOT NULL,
  
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('debit', 'credit', 'transfer', 'fee', 'interest')),
  
  amount NUMERIC(12, 2) NOT NULL,
  balance_after NUMERIC(12, 2) NOT NULL,
  
  description TEXT NOT NULL,
  reference_number VARCHAR(100),
  
  category VARCHAR(50),
  related_transaction_id UUID,
  
  transaction_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_bank_transactions_account ON bank_transactions(bank_account_id);
CREATE INDEX idx_bank_transactions_date ON bank_transactions(transaction_date DESC);
CREATE INDEX idx_bank_transactions_type ON bank_transactions(transaction_type);

-- =====================================================
-- CONTAS A PAGAR
-- =====================================================

CREATE TABLE IF NOT EXISTS accounts_payable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  supplier_name VARCHAR(255) NOT NULL,
  supplier_document VARCHAR(50),
  
  description TEXT NOT NULL,
  invoice_number VARCHAR(100),
  
  amount NUMERIC(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'BRL',
  
  due_date DATE NOT NULL,
  payment_date DATE,
  
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled', 'partial')),
  
  category VARCHAR(50) NOT NULL,
  cost_center_id UUID REFERENCES cost_centers(id) ON DELETE SET NULL,
  
  payment_method VARCHAR(30),
  bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
  
  attachments JSONB DEFAULT '[]'::jsonb,
  
  paid_amount NUMERIC(12, 2) DEFAULT 0.00,
  discount_amount NUMERIC(12, 2) DEFAULT 0.00,
  interest_amount NUMERIC(12, 2) DEFAULT 0.00,
  
  notes TEXT,
  
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_accounts_payable_due_date ON accounts_payable(due_date);
CREATE INDEX idx_accounts_payable_status ON accounts_payable(status);
CREATE INDEX idx_accounts_payable_category ON accounts_payable(category);
CREATE INDEX idx_accounts_payable_supplier ON accounts_payable(supplier_name);

-- =====================================================
-- CONTAS A RECEBER
-- =====================================================

CREATE TABLE IF NOT EXISTS accounts_receivable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name VARCHAR(255) NOT NULL,
  
  description TEXT NOT NULL,
  invoice_number VARCHAR(100),
  
  amount NUMERIC(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'BRL',
  
  due_date DATE NOT NULL,
  payment_date DATE,
  
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled', 'partial')),
  
  payment_method VARCHAR(30),
  bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
  
  attachments JSONB DEFAULT '[]'::jsonb,
  
  received_amount NUMERIC(12, 2) DEFAULT 0.00,
  discount_amount NUMERIC(12, 2) DEFAULT 0.00,
  interest_amount NUMERIC(12, 2) DEFAULT 0.00,
  
  notes TEXT,
  
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_accounts_receivable_due_date ON accounts_receivable(due_date);
CREATE INDEX idx_accounts_receivable_status ON accounts_receivable(status);
CREATE INDEX idx_accounts_receivable_client ON accounts_receivable(client_id);

-- =====================================================
-- CENTROS DE CUSTO
-- =====================================================

CREATE TABLE IF NOT EXISTS cost_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  
  department VARCHAR(100),
  parent_cost_center_id UUID REFERENCES cost_centers(id) ON DELETE SET NULL,
  
  budget NUMERIC(12, 2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_cost_centers_code ON cost_centers(code);
CREATE INDEX idx_cost_centers_department ON cost_centers(department);

-- =====================================================
-- FOLHA DE PAGAMENTO
-- =====================================================

CREATE TABLE IF NOT EXISTS payroll_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  
  reference_month DATE NOT NULL,
  
  base_salary NUMERIC(10, 2) NOT NULL,
  gross_salary NUMERIC(10, 2) NOT NULL,
  net_salary NUMERIC(10, 2) NOT NULL,
  
  bonuses NUMERIC(10, 2) DEFAULT 0.00,
  commissions NUMERIC(10, 2) DEFAULT 0.00,
  overtime NUMERIC(10, 2) DEFAULT 0.00,
  benefits NUMERIC(10, 2) DEFAULT 0.00,
  
  deductions NUMERIC(10, 2) DEFAULT 0.00,
  taxes NUMERIC(10, 2) DEFAULT 0.00,
  inss NUMERIC(10, 2) DEFAULT 0.00,
  irrf NUMERIC(10, 2) DEFAULT 0.00,
  
  payment_date DATE,
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'paid', 'failed')),
  
  payment_method VARCHAR(30),
  bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
  
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  UNIQUE(employee_id, reference_month)
);

CREATE INDEX idx_payroll_records_employee ON payroll_records(employee_id);
CREATE INDEX idx_payroll_records_month ON payroll_records(reference_month DESC);
CREATE INDEX idx_payroll_records_status ON payroll_records(payment_status);

CREATE TABLE IF NOT EXISTS payroll_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name VARCHAR(100) NOT NULL,
  description TEXT,
  benefit_type VARCHAR(50) CHECK (benefit_type IN ('health_insurance', 'dental', 'meal_voucher', 'transport', 'education', 'gym', 'life_insurance', 'other')),
  
  value NUMERIC(10, 2) NOT NULL,
  is_taxable BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS employee_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  benefit_id UUID REFERENCES payroll_benefits(id) ON DELETE CASCADE NOT NULL,
  
  custom_value NUMERIC(10, 2),
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  UNIQUE(employee_id, benefit_id, start_date)
);

-- =====================================================
-- IMPOSTOS
-- =====================================================

CREATE TABLE IF NOT EXISTS tax_obligations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  tax_type VARCHAR(50) NOT NULL,
  reference_period DATE NOT  NULL,
  
  amount NUMERIC(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'BRL',
  
  due_date DATE NOT NULL,
  payment_date DATE,
  
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  
  description TEXT,
  payment_code VARCHAR(100),
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_tax_obligations_due_date ON tax_obligations(due_date);
CREATE INDEX idx_tax_obligations_type ON tax_obligations(tax_type);
CREATE INDEX idx_tax_obligations_status ON tax_obligations(status);

-- =====================================================
-- ALERTAS FINANCEIROS
-- =====================================================

CREATE TABLE IF NOT EXISTS financial_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('overdue_payable', 'overdue_receivable', 'low_balance', 'high_expense', 'goal_deviation', 'tax_due')),
  
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  severity VARCHAR(20) DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
  
  related_entity_type VARCHAR(50),
  related_entity_id UUID,
  
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_financial_alerts_type ON financial_alerts(alert_type);
CREATE INDEX idx_financial_alerts_unresolved ON financial_alerts(is_resolved, created_at DESC) WHERE is_resolved = false;

-- =====================================================
-- LEMBRETES DE PAGAMENTO
-- =====================================================

CREATE TABLE IF NOT EXISTS payment_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  reminder_type VARCHAR(50) NOT NULL CHECK (reminder_type IN ('payable', 'receivable', 'tax', 'payroll')),
  related_entity_id UUID NOT NULL,
  
  recipient_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  is_sent BOOLEAN DEFAULT false,
  
  notification_channels JSONB DEFAULT '["email", "system"]'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_payment_reminders_scheduled ON payment_reminders(is_sent, scheduled_for) WHERE is_sent = false;
CREATE INDEX idx_payment_reminders_recipient ON payment_reminders(recipient_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER update_bank_accounts_updated_at
  BEFORE UPDATE ON bank_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_payable_updated_at
  BEFORE UPDATE ON accounts_payable
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_receivable_updated_at
  BEFORE UPDATE ON accounts_receivable
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts_payable ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts_receivable ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_obligations ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_alerts ENABLE ROW LEVEL SECURITY;

-- Políticas: Apenas financial e super_admin
CREATE POLICY "Apenas financeiro vê contas"
  ON bank_accounts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type IN ('super_admin', 'financial')
      AND user_profiles.is_active = true
    )
  );

CREATE POLICY "Apenas financeiro gerencia contas a pagar"
  ON accounts_payable FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type IN ('super_admin', 'financial')
      AND user_profiles.is_active = true
    )
  );

CREATE POLICY "Financeiro e comercial veem contas a receber"
  ON accounts_receivable FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type IN ('super_admin', 'financial', 'commercial')
      AND user_profiles.is_active = true
    )
  );

-- Colaboradores veem apenas sua própria folha
CREATE POLICY "Colaboradores veem própria folha"
  ON payroll_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = payroll_records.employee_id
      AND employees.user_profile_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type IN ('super_admin', 'hr', 'financial')
    )
  );

-- =====================================================
-- Fim da Migration: Sistema Financeiro
-- =====================================================

