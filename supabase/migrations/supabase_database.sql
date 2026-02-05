-- ============================================
-- ESTRUTURA COMPLETA DO BANCO DE DADOS
-- Sistema de Gestão Valle AI
-- ============================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- CRIAR TIPOS ENUM
-- ============================================

CREATE TYPE user_role AS ENUM (
  'super_admin',
  'admin',
  'hr',
  'finance',
  'manager',
  'employee',
  'client'
);

CREATE TYPE user_type AS ENUM (
  'super_admin',
  'admin',
  'hr',
  'finance',
  'manager',
  'employee',
  'client'
);

-- ============================================
-- TABELA: user_profiles
-- ============================================

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar TEXT,
  role user_role NOT NULL DEFAULT 'employee',
  user_type user_type NOT NULL DEFAULT 'employee',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

-- ============================================
-- TABELA: users
-- ============================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  password_hash TEXT,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'employee',
  is_active BOOLEAN NOT NULL DEFAULT true,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
  two_factor_secret TEXT,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_updated_at ON users(updated_at);

-- ============================================
-- TABELA: clients
-- ============================================

CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  company_size TEXT,
  industry TEXT,
  website TEXT,
  logo_url TEXT,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT NOT NULL DEFAULT 'Brasil',
  postal_code TEXT,
  tax_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clients_user_id ON clients(user_id);

-- ============================================
-- TABELA: employees
-- ============================================

CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar TEXT,
  department TEXT,
  position TEXT,
  area_of_expertise TEXT,
  hire_date DATE,
  birth_date DATE,
  emergency_contact TEXT,
  emergency_phone TEXT,
  pix_key TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_employees_user_id ON employees(user_id);

-- ============================================
-- TABELA: employee_permissions
-- ============================================

CREATE TABLE employee_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL,
  can_view BOOLEAN NOT NULL DEFAULT false,
  can_create BOOLEAN NOT NULL DEFAULT false,
  can_edit BOOLEAN NOT NULL DEFAULT false,
  can_delete BOOLEAN NOT NULL DEFAULT false,
  can_approve BOOLEAN NOT NULL DEFAULT false,
  granted_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_employee_permissions_employee_id ON employee_permissions(employee_id);

-- ============================================
-- TABELA: employee_gamification
-- ============================================

CREATE TABLE employee_gamification (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  total_points INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  productivity_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  quality_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  collaboration_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  wellbeing_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_employee_gamification_employee_id ON employee_gamification(employee_id);

-- ============================================
-- TABELA: employee_referral_codes
-- ============================================

CREATE TABLE employee_referral_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  discount_percentage DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  commission_percentage DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  total_referrals INTEGER NOT NULL DEFAULT 0,
  total_earnings DECIMAL(12,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_employee_referral_codes_employee_id ON employee_referral_codes(employee_id);

-- ============================================
-- TABELA: client_referrals
-- ============================================

CREATE TABLE client_referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referral_code_id UUID NOT NULL REFERENCES employee_referral_codes(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  contract_value DECIMAL(12,2) NOT NULL DEFAULT 0,
  commission_paid BOOLEAN NOT NULL DEFAULT false,
  commission_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  paid_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_client_referrals_referral_code_id ON client_referrals(referral_code_id);
CREATE INDEX idx_client_referrals_client_id ON client_referrals(client_id);

-- ============================================
-- TABELA: kanban_boards
-- ============================================

CREATE TABLE kanban_boards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_kanban_boards_client_id ON kanban_boards(client_id);
CREATE INDEX idx_kanban_boards_created_by ON kanban_boards(created_by);

-- ============================================
-- TABELA: kanban_columns
-- ============================================

CREATE TABLE kanban_columns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID NOT NULL REFERENCES kanban_boards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INTEGER NOT NULL,
  color TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_kanban_columns_board_id ON kanban_columns(board_id);

-- ============================================
-- TABELA: kanban_tasks
-- ============================================

CREATE TABLE kanban_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  column_id UUID NOT NULL REFERENCES kanban_columns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  due_date DATE,
  estimated_hours DECIMAL(5,2),
  actual_hours DECIMAL(5,2),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tags TEXT[],
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_kanban_tasks_column_id ON kanban_tasks(column_id);
CREATE INDEX idx_kanban_tasks_assigned_to ON kanban_tasks(assigned_to);
CREATE INDEX idx_kanban_tasks_created_by ON kanban_tasks(created_by);

-- ============================================
-- TABELA: kanban_task_comments
-- ============================================

CREATE TABLE kanban_task_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES kanban_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_kanban_task_comments_task_id ON kanban_task_comments(task_id);

-- ============================================
-- TABELA: client_messages
-- ============================================

CREATE TABLE client_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_from_client BOOLEAN NOT NULL DEFAULT true,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_client_messages_client_id ON client_messages(client_id);
CREATE INDEX idx_client_messages_created_at ON client_messages(created_at);

-- ============================================
-- TABELA: ai_message_suggestions
-- ============================================

CREATE TABLE ai_message_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES client_messages(id) ON DELETE CASCADE,
  suggestion_type TEXT NOT NULL,
  suggested_text TEXT NOT NULL,
  confidence_score DECIMAL(5,2),
  was_used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_message_suggestions_message_id ON ai_message_suggestions(message_id);

-- ============================================
-- TABELA: contracts
-- ============================================

CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  contract_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  value DECIMAL(12,2) NOT NULL,
  payment_frequency TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  signed_at TIMESTAMP,
  file_url TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contracts_client_id ON contracts(client_id);

-- ============================================
-- TABELA: invoices
-- ============================================

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  paid_at TIMESTAMP,
  payment_method TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  file_url TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoices_contract_id ON invoices(contract_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);

-- ============================================
-- TABELA: financial_transactions
-- ============================================

CREATE TABLE financial_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_type TEXT NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  transaction_date DATE NOT NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  payment_method TEXT,
  reference_number TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_financial_transactions_invoice_id ON financial_transactions(invoice_id);
CREATE INDEX idx_financial_transactions_client_id ON financial_transactions(client_id);
CREATE INDEX idx_financial_transactions_employee_id ON financial_transactions(employee_id);
CREATE INDEX idx_financial_transactions_created_by ON financial_transactions(created_by);

-- ============================================
-- TABELA: audit_logs
-- ============================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================
-- TABELA: ai_chat_history
-- ============================================

CREATE TABLE ai_chat_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  area TEXT,
  model_used TEXT,
  tokens_used INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_chat_history_user_id ON ai_chat_history(user_id);
CREATE INDEX idx_ai_chat_history_created_at ON ai_chat_history(created_at);

-- ============================================
-- TABELA: client_metrics
-- ============================================

CREATE TABLE client_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL,
  metric_date DATE NOT NULL,
  impressions INTEGER,
  reach INTEGER,
  engagement INTEGER,
  clicks INTEGER,
  conversions INTEGER,
  cost DECIMAL(12,2),
  revenue DECIMAL(12,2),
  roi DECIMAL(8,2),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_client_metrics_client_id ON client_metrics(client_id);

-- ============================================
-- TABELA: files
-- ============================================

CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  task_id UUID REFERENCES kanban_tasks(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_files_uploaded_by ON files(uploaded_by);
CREATE INDEX idx_files_client_id ON files(client_id);
CREATE INDEX idx_files_task_id ON files(task_id);

-- ============================================
-- TABELA: calendar_events
-- ============================================

CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  all_day BOOLEAN NOT NULL DEFAULT false,
  location TEXT,
  organizer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  reminder_minutes INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_calendar_events_organizer_id ON calendar_events(organizer_id);
CREATE INDEX idx_calendar_events_client_id ON calendar_events(client_id);

-- ============================================
-- TABELA: calendar_participants
-- ============================================

CREATE TABLE calendar_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  added_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_calendar_participants_event_id ON calendar_participants(event_id);
CREATE INDEX idx_calendar_participants_user_id ON calendar_participants(user_id);

-- ============================================
-- TABELA: employee_requests
-- ============================================

CREATE TABLE employee_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  description TEXT,
  amount DECIMAL(12,2),
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP,
  rejection_reason TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_employee_requests_employee_id ON employee_requests(employee_id);
CREATE INDEX idx_employee_requests_approved_by ON employee_requests(approved_by);

-- ============================================
-- TABELA: employee_achievements
-- ============================================

CREATE TABLE employee_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  points_awarded INTEGER NOT NULL DEFAULT 0,
  earned_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_employee_achievements_employee_id ON employee_achievements(employee_id);

-- ============================================
-- TABELA: employee_churn_predictions
-- ============================================

CREATE TABLE employee_churn_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  churn_probability DECIMAL(5,2) NOT NULL,
  risk_level TEXT NOT NULL,
  contributing_factors TEXT[] DEFAULT '{}',
  recommended_actions TEXT[] DEFAULT '{}',
  prediction_date DATE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_employee_churn_predictions_employee_id ON employee_churn_predictions(employee_id);

-- ============================================
-- TABELA: client_satisfaction_surveys
-- ============================================

CREATE TABLE client_satisfaction_surveys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  nps_score INTEGER,
  satisfaction_score INTEGER,
  feedback TEXT,
  survey_type TEXT NOT NULL,
  sent_at TIMESTAMP NOT NULL DEFAULT NOW(),
  answered_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_client_satisfaction_surveys_client_id ON client_satisfaction_surveys(client_id);

-- ============================================
-- TABELA: ml_models
-- ============================================

CREATE TABLE ml_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_name TEXT NOT NULL,
  model_type TEXT NOT NULL,
  version TEXT NOT NULL,
  accuracy DECIMAL(5,2),
  training_data_count INTEGER,
  last_trained_at TIMESTAMP,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABELA: system_settings
-- ============================================

CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- CRIAR TRIGGERS PARA updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em todas as tabelas com updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employee_gamification_updated_at BEFORE UPDATE ON employee_gamification FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employee_referral_codes_updated_at BEFORE UPDATE ON employee_referral_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_kanban_boards_updated_at BEFORE UPDATE ON kanban_boards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_kanban_columns_updated_at BEFORE UPDATE ON kanban_columns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_kanban_tasks_updated_at BEFORE UPDATE ON kanban_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_kanban_task_comments_updated_at BEFORE UPDATE ON kanban_task_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_financial_transactions_updated_at BEFORE UPDATE ON financial_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employee_requests_updated_at BEFORE UPDATE ON employee_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ml_models_updated_at BEFORE UPDATE ON ml_models FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_message_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_churn_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_satisfaction_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- EXEMPLO DE POLÍTICAS RLS BÁSICAS
-- (Ajustar conforme necessidade de negócio)
-- ============================================

-- Política exemplo: usuários podem ver seu próprio perfil
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Política exemplo: usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- COMENTÁRIOS ADICIONAIS
-- ============================================

COMMENT ON TABLE user_profiles IS 'Perfis de usuários ligados ao Supabase Auth';
COMMENT ON TABLE users IS 'Usuários do sistema (pode duplicar auth.users)';
COMMENT ON TABLE clients IS 'Clientes da agência';
COMMENT ON TABLE employees IS 'Colaboradores da agência';
COMMENT ON TABLE employee_permissions IS 'Permissões granulares por colaborador';
COMMENT ON TABLE employee_gamification IS 'Sistema de gamificação dos colaboradores';
COMMENT ON TABLE employee_referral_codes IS 'Códigos de indicação dos colaboradores';
COMMENT ON TABLE client_referrals IS 'Clientes indicados através de códigos';
COMMENT ON TABLE kanban_boards IS 'Quadros Kanban para gestão de projetos';
COMMENT ON TABLE kanban_columns IS 'Colunas dos quadros Kanban';
COMMENT ON TABLE kanban_tasks IS 'Tarefas dentro das colunas Kanban';
COMMENT ON TABLE kanban_task_comments IS 'Comentários nas tarefas';
COMMENT ON TABLE client_messages IS 'Mensagens trocadas com clientes';
COMMENT ON TABLE ai_message_suggestions IS 'Sugestões de IA para respostas';
COMMENT ON TABLE contracts IS 'Contratos com clientes';
COMMENT ON TABLE invoices IS 'Faturas emitidas';
COMMENT ON TABLE financial_transactions IS 'Transações financeiras';
COMMENT ON TABLE audit_logs IS 'Logs de auditoria do sistema';
COMMENT ON TABLE ai_chat_history IS 'Histórico de conversas com a IA Val';
COMMENT ON TABLE client_metrics IS 'Métricas de performance dos clientes';
COMMENT ON TABLE files IS 'Arquivos armazenados no sistema';
COMMENT ON TABLE calendar_events IS 'Eventos do calendário';
COMMENT ON TABLE calendar_participants IS 'Participantes dos eventos';
COMMENT ON TABLE employee_requests IS 'Solicitações de colaboradores (férias, reembolsos, etc)';
COMMENT ON TABLE employee_achievements IS 'Conquistas dos colaboradores';
COMMENT ON TABLE employee_churn_predictions IS 'Predições de saída de colaboradores';
COMMENT ON TABLE client_satisfaction_surveys IS 'Pesquisas de satisfação dos clientes';
COMMENT ON TABLE ml_models IS 'Modelos de Machine Learning utilizados';
COMMENT ON TABLE system_settings IS 'Configurações do sistema';

-- ============================================
-- FIM DO SCRIPT
-- ============================================
