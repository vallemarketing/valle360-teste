-- =====================================================
-- MIGRATION: Sistema de Colaboradores e RH
-- Descrição: Colaboradores, metas, performance, solicitações e férias
-- Dependências: 20251112000001_create_user_system.sql, 20251112000002_create_clients_system.sql
-- =====================================================

-- =====================================================
-- COLABORADORES
-- =====================================================

CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE,
  
  employee_number VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  
  department VARCHAR(100) CHECK (department IN ('social_media', 'video', 'design', 'web', 'sales', 'finance', 'hr', 'admin')),
  position VARCHAR(100) NOT NULL,
  
  hire_date DATE NOT NULL,
  termination_date DATE,
  employment_status VARCHAR(20) DEFAULT 'active' CHECK (employment_status IN ('active', 'on_leave', 'suspended', 'terminated')),
  
  salary NUMERIC(10, 2),
  salary_type VARCHAR(20) DEFAULT 'monthly' CHECK (salary_type IN ('monthly', 'hourly', 'commission')),
  
  manager_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  
  vacation_days_total INTEGER DEFAULT 30,
  vacation_days_used INTEGER DEFAULT 0,
  vacation_days_remaining INTEGER GENERATED ALWAYS AS (vacation_days_total - vacation_days_used) STORED,
  
  performance_score NUMERIC(3, 2) DEFAULT 0.00 CHECK (performance_score >= 0 AND performance_score <= 5),
  total_goals_hit INTEGER DEFAULT 0,
  total_goals_missed INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  warning_count INTEGER DEFAULT 0,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_employees_user_profile ON employees(user_profile_id);
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_status ON employees(employment_status);
CREATE INDEX idx_employees_manager ON employees(manager_id);

CREATE TABLE IF NOT EXISTS employee_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(20) DEFAULT '#cccccc',
  icon VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS employee_client_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  role VARCHAR(100),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  removed_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(employee_id, client_id)
);

CREATE INDEX idx_employee_assignments_employee ON employee_client_assignments(employee_id);
CREATE INDEX idx_employee_assignments_client ON employee_client_assignments(client_id);

-- =====================================================
-- METAS E PERFORMANCE
-- =====================================================

CREATE TABLE IF NOT EXISTS employee_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  goal_type VARCHAR(50) CHECK (goal_type IN ('sales', 'production', 'client_satisfaction', 'learning', 'other')),
  
  target_value NUMERIC(10, 2) NOT NULL,
  current_value NUMERIC(10, 2) DEFAULT 0,
  unit VARCHAR(20),
  
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('draft', 'in_progress', 'achieved', 'missed', 'cancelled')),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  weight INTEGER DEFAULT 1,
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_employee_goals_employee ON employee_goals(employee_id);
CREATE INDEX idx_employee_goals_status ON employee_goals(status);
CREATE INDEX idx_employee_goals_dates ON employee_goals(start_date, end_date);

CREATE TABLE IF NOT EXISTS employee_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  
  review_period_start DATE NOT NULL,
  review_period_end DATE NOT NULL,
  
  overall_score NUMERIC(3, 2) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 5),
  productivity_score NUMERIC(3, 2),
  quality_score NUMERIC(3, 2),
  teamwork_score NUMERIC(3, 2),
  punctuality_score NUMERIC(3, 2),
  
  strengths TEXT,
  areas_for_improvement TEXT,
  comments TEXT,
  achievements TEXT,
  
  goals_achieved INTEGER DEFAULT 0,
  goals_missed INTEGER DEFAULT 0,
  
  reviewed_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  review_date DATE NOT NULL,
  
  next_review_date DATE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_employee_performance_employee ON employee_performance(employee_id);
CREATE INDEX idx_employee_performance_review_date ON employee_performance(review_date DESC);

-- =====================================================
-- SOLICITAÇÕES
-- =====================================================

CREATE TABLE IF NOT EXISTS employee_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  
  request_type VARCHAR(50) NOT NULL CHECK (request_type IN ('home_office', 'day_off', 'vacation', 'reimbursement', 'advance', 'certificate', 'other')),
  
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  
  start_date DATE,
  end_date DATE,
  
  amount NUMERIC(10, 2),
  currency VARCHAR(3) DEFAULT 'BRL',
  
  attachments JSONB DEFAULT '[]'::jsonb,
  
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  
  reviewed_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  review_notes TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_employee_requests_employee ON employee_requests(employee_id);
CREATE INDEX idx_employee_requests_type ON employee_requests(request_type);
CREATE INDEX idx_employee_requests_status ON employee_requests(status);
CREATE INDEX idx_employee_requests_dates ON employee_requests(start_date, end_date);

CREATE TABLE IF NOT EXISTS reimbursement_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  
  description TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'BRL',
  category VARCHAR(50) NOT NULL,
  
  expense_date DATE NOT NULL,
  receipt_url TEXT,
  
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
  
  approved_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  
  rejection_reason TEXT,
  payment_reference TEXT,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_reimbursement_requests_employee ON reimbursement_requests(employee_id);
CREATE INDEX idx_reimbursement_requests_status ON reimbursement_requests(status);

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_goals_updated_at
  BEFORE UPDATE ON employee_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_requests_updated_at
  BEFORE UPDATE ON employee_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reimbursement_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Colaboradores veem seu próprio perfil"
  ON employees FOR SELECT
  USING (
    user_profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type IN ('super_admin', 'hr')
    )
  );

CREATE POLICY "Colaboradores gerenciam suas solicitações"
  ON employee_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = employee_requests.employee_id
      AND employees.user_profile_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type IN ('super_admin', 'hr')
    )
  );

-- =====================================================
-- Fim da Migration: Colaboradores e RH
-- =====================================================

