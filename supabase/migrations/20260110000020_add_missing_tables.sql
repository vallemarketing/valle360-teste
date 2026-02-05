-- Additional tables for Valle360 automation and client features

-- Client ad accounts for Meta/Google Ads integration
CREATE TABLE IF NOT EXISTS client_ad_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('meta', 'google')),
  account_id TEXT NOT NULL,
  account_name TEXT,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  connected_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  cached_metrics JSONB,
  metrics_updated_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(client_id, platform, account_id)
);

CREATE INDEX idx_client_ad_accounts_client ON client_ad_accounts(client_id);

-- Recurring invoice schedules
CREATE TABLE IF NOT EXISTS recurring_invoice_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('monthly', 'quarterly', 'yearly')),
  day_of_month INTEGER CHECK (day_of_month BETWEEN 1 AND 28),
  next_run TIMESTAMP WITH TIME ZONE,
  last_run TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_recurring_invoices_next ON recurring_invoice_schedules(next_run) WHERE is_active = true;

-- Billing reminders log
CREATE TABLE IF NOT EXISTS billing_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL,
  channel TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB
);

CREATE INDEX idx_billing_reminders_invoice ON billing_reminders(invoice_id);

-- Webhook logs
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  contract_id UUID,
  payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_webhook_logs_created ON webhook_logs(created_at);

-- Contract events
CREATE TABLE IF NOT EXISTS contract_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_by TEXT,
  event_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB
);

CREATE INDEX idx_contract_events_contract ON contract_events(contract_id);

-- Workflow transitions for area handoffs
CREATE TABLE IF NOT EXISTS workflow_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_area TEXT NOT NULL,
  to_area TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID NOT NULL,
  client_id UUID REFERENCES clients(id),
  status TEXT DEFAULT 'completed',
  transitioned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB
);

CREATE INDEX idx_workflow_transitions_resource ON workflow_transitions(resource_type, resource_id);

-- Client files metadata
CREATE TABLE IF NOT EXISTS client_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  folder TEXT DEFAULT 'uploads',
  description TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB
);

CREATE INDEX idx_client_files_client ON client_files(client_id);
CREATE INDEX idx_client_files_folder ON client_files(client_id, folder);

-- Client reports
CREATE TABLE IF NOT EXISTS client_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'monthly',
  period_start DATE,
  period_end DATE,
  file_path TEXT,
  metrics JSONB,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_client_reports_client ON client_reports(client_id);

-- User integrations (Google, Canva, etc.)
CREATE TABLE IF NOT EXISTS user_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  platform TEXT NOT NULL,
  account_id TEXT,
  account_name TEXT,
  account_avatar TEXT,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  scopes TEXT[],
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  connected_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  metadata JSONB,
  UNIQUE(user_id, platform)
);

CREATE INDEX idx_user_integrations_user ON user_integrations(user_id);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- Cron logs
CREATE TABLE IF NOT EXISTS cron_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  run_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT NOT NULL,
  result JSONB,
  error TEXT
);

CREATE INDEX idx_cron_logs_job ON cron_logs(job_name, run_at);

-- Add columns to invoices if not exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'days_overdue') THEN
    ALTER TABLE invoices ADD COLUMN days_overdue INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'reference_month') THEN
    ALTER TABLE invoices ADD COLUMN reference_month TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'auto_generated') THEN
    ALTER TABLE invoices ADD COLUMN auto_generated BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add columns to contracts if not exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'signed_document_url') THEN
    ALTER TABLE contracts ADD COLUMN signed_document_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'activated_at') THEN
    ALTER TABLE contracts ADD COLUMN activated_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'cancelled_at') THEN
    ALTER TABLE contracts ADD COLUMN cancelled_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'cancellation_reason') THEN
    ALTER TABLE contracts ADD COLUMN cancellation_reason TEXT;
  END IF;
END $$;

-- RLS Policies
ALTER TABLE client_ad_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_invoice_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cron_logs ENABLE ROW LEVEL SECURITY;

-- Allow admins to access all tables
CREATE POLICY admin_all_client_ad_accounts ON client_ad_accounts FOR ALL 
  USING (auth.jwt() ->> 'role' IN ('super_admin', 'admin', 'service_role'));

CREATE POLICY admin_all_recurring_invoices ON recurring_invoice_schedules FOR ALL 
  USING (auth.jwt() ->> 'role' IN ('super_admin', 'admin', 'finance', 'service_role'));

CREATE POLICY admin_all_billing_reminders ON billing_reminders FOR ALL 
  USING (auth.jwt() ->> 'role' IN ('super_admin', 'admin', 'finance', 'service_role'));

CREATE POLICY admin_all_webhook_logs ON webhook_logs FOR ALL 
  USING (auth.jwt() ->> 'role' IN ('super_admin', 'admin', 'service_role'));

CREATE POLICY admin_all_contract_events ON contract_events FOR ALL 
  USING (auth.jwt() ->> 'role' IN ('super_admin', 'admin', 'juridico', 'service_role'));

CREATE POLICY admin_all_workflow_transitions ON workflow_transitions FOR ALL 
  USING (auth.jwt() ->> 'role' IN ('super_admin', 'admin', 'service_role'));

CREATE POLICY admin_all_client_files ON client_files FOR ALL 
  USING (auth.jwt() ->> 'role' IN ('super_admin', 'admin', 'service_role'));

CREATE POLICY admin_all_client_reports ON client_reports FOR ALL 
  USING (auth.jwt() ->> 'role' IN ('super_admin', 'admin', 'service_role'));

CREATE POLICY admin_all_user_integrations ON user_integrations FOR ALL 
  USING (auth.jwt() ->> 'role' IN ('super_admin', 'admin', 'service_role') OR user_id = auth.uid());

CREATE POLICY admin_all_audit_logs ON audit_logs FOR ALL 
  USING (auth.jwt() ->> 'role' IN ('super_admin', 'admin', 'service_role'));

CREATE POLICY admin_all_cron_logs ON cron_logs FOR ALL 
  USING (auth.jwt() ->> 'role' IN ('super_admin', 'admin', 'service_role'));
