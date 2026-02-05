/*
  # Complete Financial System

  1. New Tables
    - `expense_categories` - Categories for expenses
    - `accounts_payable` - Contas a Pagar with alerts
    - `accounts_receivable` - Contas a Receber with automated billing
    - `reimbursement_requests` - Employee reimbursement system
    - `payroll_records` - Folha de pagamento
    - `payroll_benefits` - Employee benefits
    - `bank_accounts` - Company bank accounts
    - `bank_transactions` - Bank transaction imports
    - `tax_obligations` - Tax calendar and obligations
    - `cost_centers` - Cost allocation by client
    - `financial_alerts` - Automated financial alerts
    - `payment_reminders` - Automated payment reminder log

  2. Features
    - Automated alerts for bills due (3 days, 1 day, overdue)
    - Automated billing to clients with escalation
    - Reimbursement approval workflow
    - Payroll calculation with taxes
    - DRE and Balance Sheet data structure
    - Projected cash flow
    - Bank reconciliation
    - Cost center by client

  3. Security
    - Enable RLS on all tables
    - Only Financeiro and Admin can access
    - HR can access payroll data
    - Employees can only view their own reimbursements and payslips
*/

-- Create expense categories
CREATE TABLE IF NOT EXISTS expense_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  type text NOT NULL CHECK (type IN ('salaries', 'suppliers', 'taxes', 'rent', 'marketing', 'operational', 'other')),
  created_at timestamptz DEFAULT now()
);

-- Insert default categories
INSERT INTO expense_categories (name, type) VALUES
  ('Salários', 'salaries'),
  ('Encargos Sociais', 'salaries'),
  ('Fornecedores', 'suppliers'),
  ('Impostos', 'taxes'),
  ('Aluguel', 'rent'),
  ('Marketing e Publicidade', 'marketing'),
  ('Infraestrutura', 'operational'),
  ('Software e Licenças', 'operational'),
  ('Outros', 'other')
ON CONFLICT (name) DO NOTHING;

-- Create accounts payable (Contas a Pagar)
CREATE TABLE IF NOT EXISTS accounts_payable (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_name text NOT NULL,
  description text NOT NULL,
  amount decimal(10,2) NOT NULL,
  due_date date NOT NULL,
  category_id uuid REFERENCES expense_categories(id),
  attachment_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  payment_date date,
  payment_method text,
  payment_proof_url text,
  is_recurring boolean DEFAULT false,
  recurrence_frequency text CHECK (recurrence_frequency IN ('monthly', 'quarterly', 'yearly')),
  notes text,
  created_by uuid REFERENCES employees(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create accounts receivable (Contas a Receber)
CREATE TABLE IF NOT EXISTS accounts_receivable (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_profile_id uuid REFERENCES client_profiles(id) ON DELETE CASCADE,
  contract_id uuid REFERENCES client_contracts(id),
  description text NOT NULL,
  amount decimal(10,2) NOT NULL,
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  payment_date date,
  payment_method text,
  payment_link text,
  is_recurring boolean DEFAULT false,
  recurrence_frequency text CHECK (recurrence_frequency IN ('monthly', 'quarterly', 'yearly')),
  last_reminder_sent timestamptz,
  reminder_count integer DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create reimbursement requests
CREATE TABLE IF NOT EXISTS reimbursement_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  expense_type text NOT NULL CHECK (expense_type IN ('transport', 'food', 'lodging', 'materials', 'other')),
  amount decimal(10,2) NOT NULL,
  expense_date date NOT NULL,
  description text NOT NULL,
  attachments jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
  approved_by uuid REFERENCES employees(id),
  approval_date timestamptz,
  rejection_reason text,
  payment_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create payroll benefits
CREATE TABLE IF NOT EXISTS payroll_benefits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('health_insurance', 'meal_voucher', 'transport_voucher', 'home_office', 'other')),
  amount decimal(10,2) NOT NULL,
  is_taxable boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Insert default benefits
INSERT INTO payroll_benefits (name, type, amount, is_taxable) VALUES
  ('Plano de Saúde', 'health_insurance', 0, false),
  ('Vale Refeição', 'meal_voucher', 0, false),
  ('Vale Transporte', 'transport_voucher', 0, false),
  ('Auxílio Home Office', 'home_office', 0, false)
ON CONFLICT DO NOTHING;

-- Create employee benefits assignments
CREATE TABLE IF NOT EXISTS employee_benefits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  benefit_id uuid REFERENCES payroll_benefits(id) NOT NULL,
  custom_amount decimal(10,2),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, benefit_id)
);

-- Create payroll records
CREATE TABLE IF NOT EXISTS payroll_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  reference_month date NOT NULL,
  gross_salary decimal(10,2) NOT NULL,
  inss_deduction decimal(10,2) DEFAULT 0,
  irrf_deduction decimal(10,2) DEFAULT 0,
  fgts decimal(10,2) DEFAULT 0,
  other_deductions jsonb DEFAULT '{}'::jsonb,
  benefits jsonb DEFAULT '{}'::jsonb,
  net_salary decimal(10,2) NOT NULL,
  payment_date date,
  payslip_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
  created_by uuid REFERENCES employees(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, reference_month)
);

-- Create bank accounts
CREATE TABLE IF NOT EXISTS bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name text NOT NULL,
  account_number text NOT NULL,
  agency text NOT NULL,
  account_type text NOT NULL CHECK (account_type IN ('checking', 'savings')),
  current_balance decimal(10,2) DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create bank transactions
CREATE TABLE IF NOT EXISTS bank_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_account_id uuid REFERENCES bank_accounts(id) NOT NULL,
  transaction_date date NOT NULL,
  description text NOT NULL,
  amount decimal(10,2) NOT NULL,
  type text NOT NULL CHECK (type IN ('credit', 'debit')),
  category_id uuid REFERENCES expense_categories(id),
  is_reconciled boolean DEFAULT false,
  linked_type text CHECK (linked_type IN ('accounts_payable', 'accounts_receivable', 'payroll', 'reimbursement')),
  linked_id uuid,
  imported_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create tax obligations
CREATE TABLE IF NOT EXISTS tax_obligations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_name text NOT NULL,
  tax_type text NOT NULL CHECK (tax_type IN ('DAS', 'DARF', 'GPS', 'GFIP', 'ISS', 'IRRF', 'INSS', 'PIS', 'COFINS', 'CSLL')),
  reference_month date NOT NULL,
  amount decimal(10,2) NOT NULL,
  due_date date NOT NULL,
  payment_date date,
  document_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create cost centers (by client)
CREATE TABLE IF NOT EXISTS cost_centers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_profile_id uuid REFERENCES client_profiles(id) ON DELETE CASCADE NOT NULL,
  reference_month date NOT NULL,
  team_cost decimal(10,2) DEFAULT 0,
  tools_cost decimal(10,2) DEFAULT 0,
  infrastructure_cost decimal(10,2) DEFAULT 0,
  other_costs decimal(10,2) DEFAULT 0,
  total_cost decimal(10,2) GENERATED ALWAYS AS (team_cost + tools_cost + infrastructure_cost + other_costs) STORED,
  revenue decimal(10,2) DEFAULT 0,
  profit decimal(10,2) GENERATED ALWAYS AS (revenue - (team_cost + tools_cost + infrastructure_cost + other_costs)) STORED,
  profit_margin decimal(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN revenue > 0 THEN ((revenue - (team_cost + tools_cost + infrastructure_cost + other_costs)) / revenue * 100)
      ELSE 0
    END
  ) STORED,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(client_profile_id, reference_month)
);

-- Create financial alerts
CREATE TABLE IF NOT EXISTS financial_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL CHECK (alert_type IN ('bill_due_soon', 'bill_overdue', 'low_balance', 'negative_projected_balance', 'client_overdue')),
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title text NOT NULL,
  message text NOT NULL,
  related_type text,
  related_id uuid,
  is_read boolean DEFAULT false,
  sent_email boolean DEFAULT false,
  sent_whatsapp boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create payment reminders log
CREATE TABLE IF NOT EXISTS payment_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  accounts_receivable_id uuid REFERENCES accounts_receivable(id) ON DELETE CASCADE NOT NULL,
  reminder_type text NOT NULL CHECK (reminder_type IN ('3_days_before', 'due_date', '3_days_after', '7_days_after', '15_days_after')),
  sent_at timestamptz DEFAULT now(),
  sent_via text NOT NULL CHECK (sent_via IN ('email', 'whatsapp', 'both')),
  status text DEFAULT 'sent' CHECK (status IN ('sent', 'failed'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_accounts_payable_due_date ON accounts_payable(due_date);
CREATE INDEX IF NOT EXISTS idx_accounts_payable_status ON accounts_payable(status);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_client ON accounts_receivable(client_profile_id);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_due_date ON accounts_receivable(due_date);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_status ON accounts_receivable(status);
CREATE INDEX IF NOT EXISTS idx_reimbursements_employee ON reimbursement_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_reimbursements_status ON reimbursement_requests(status);
CREATE INDEX IF NOT EXISTS idx_payroll_employee ON payroll_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_month ON payroll_records(reference_month);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_date ON bank_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_reconciled ON bank_transactions(is_reconciled);
CREATE INDEX IF NOT EXISTS idx_cost_centers_client ON cost_centers(client_profile_id);
CREATE INDEX IF NOT EXISTS idx_cost_centers_month ON cost_centers(reference_month);

-- Enable RLS
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts_payable ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts_receivable ENABLE ROW LEVEL SECURITY;
ALTER TABLE reimbursement_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_obligations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for financial data (Admin and Financeiro only)
CREATE POLICY "Admin and Finance can view expense categories"
  ON expense_categories FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN employee_areas ea ON e.area_id = ea.id
      WHERE e.user_id = auth.uid()
      AND (ea.slug = 'financeiro' OR e.position = 'Admin')
    )
  );

CREATE POLICY "Admin and Finance can manage accounts payable"
  ON accounts_payable FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN employee_areas ea ON e.area_id = ea.id
      WHERE e.user_id = auth.uid()
      AND (ea.slug = 'financeiro' OR e.position = 'Admin')
    )
  );

CREATE POLICY "Admin and Finance can manage accounts receivable"
  ON accounts_receivable FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN employee_areas ea ON e.area_id = ea.id
      WHERE e.user_id = auth.uid()
      AND (ea.slug = 'financeiro' OR e.position = 'Admin')
    )
  );

-- RLS for reimbursements
CREATE POLICY "Employees can view own reimbursements"
  ON reimbursement_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE id = employee_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Employees can create reimbursement requests"
  ON reimbursement_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE id = employee_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Finance and Admin can manage all reimbursements"
  ON reimbursement_requests FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN employee_areas ea ON e.area_id = ea.id
      WHERE e.user_id = auth.uid()
      AND (ea.slug IN ('financeiro', 'rh') OR e.position = 'Admin')
    )
  );

-- RLS for payroll
CREATE POLICY "Employees can view own payroll"
  ON payroll_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE id = employee_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Finance, HR and Admin can manage all payroll"
  ON payroll_records FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN employee_areas ea ON e.area_id = ea.id
      WHERE e.user_id = auth.uid()
      AND (ea.slug IN ('financeiro', 'rh') OR e.position = 'Admin')
    )
  );

-- RLS for other financial tables
CREATE POLICY "Admin and Finance can manage bank accounts"
  ON bank_accounts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN employee_areas ea ON e.area_id = ea.id
      WHERE e.user_id = auth.uid()
      AND (ea.slug = 'financeiro' OR e.position = 'Admin')
    )
  );

CREATE POLICY "Admin and Finance can manage bank transactions"
  ON bank_transactions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN employee_areas ea ON e.area_id = ea.id
      WHERE e.user_id = auth.uid()
      AND (ea.slug = 'financeiro' OR e.position = 'Admin')
    )
  );

CREATE POLICY "Admin and Finance can manage tax obligations"
  ON tax_obligations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN employee_areas ea ON e.area_id = ea.id
      WHERE e.user_id = auth.uid()
      AND (ea.slug = 'financeiro' OR e.position = 'Admin')
    )
  );

CREATE POLICY "Admin and Finance can view cost centers"
  ON cost_centers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN employee_areas ea ON e.area_id = ea.id
      WHERE e.user_id = auth.uid()
      AND (ea.slug = 'financeiro' OR e.position = 'Admin')
    )
  );

CREATE POLICY "Admin can view financial alerts"
  ON financial_alerts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE user_id = auth.uid() AND position = 'Admin'
    )
  );

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_accounts_payable_updated_at ON accounts_payable;
CREATE TRIGGER update_accounts_payable_updated_at
  BEFORE UPDATE ON accounts_payable
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_accounts_receivable_updated_at ON accounts_receivable;
CREATE TRIGGER update_accounts_receivable_updated_at
  BEFORE UPDATE ON accounts_receivable
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reimbursement_requests_updated_at ON reimbursement_requests;
CREATE TRIGGER update_reimbursement_requests_updated_at
  BEFORE UPDATE ON reimbursement_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payroll_records_updated_at ON payroll_records;
CREATE TRIGGER update_payroll_records_updated_at
  BEFORE UPDATE ON payroll_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
