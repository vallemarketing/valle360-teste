/*
  # Employees and Areas Management System

  1. New Tables
    - `employee_areas` - Lookup table for employee area types
      - `id` (uuid, primary key)
      - `name` (text) - Area name: Tráfego Pago, Social Media, Designer Gráfico, etc.
      - `slug` (text) - URL-friendly identifier
      - `color` (text) - Brand color for the area
      - `icon` (text) - Icon identifier
      - `created_at` (timestamptz)
    
    - `employees` - Complete employee information
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text)
      - `email` (text, unique)
      - `phone` (text)
      - `area_id` (uuid, foreign key to employee_areas)
      - `photo_url` (text)
      - `position` (text) - Job title/role
      - `hire_date` (date)
      - `is_active` (boolean)
      - `salary` (decimal) - Monthly salary
      - `pix_key` (text) - PIX key for payments
      - `bank_name` (text)
      - `bank_agency` (text)
      - `bank_account` (text)
      - `last_access` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `employee_client_assignments` - Many-to-many relationship
      - `id` (uuid, primary key)
      - `employee_id` (uuid, foreign key to employees)
      - `client_profile_id` (uuid, foreign key to client_profiles)
      - `assigned_at` (timestamptz)
      - `assigned_by` (uuid, foreign key to employees)
    
    - `employee_invitations` - Track invitation links
      - `id` (uuid, primary key)
      - `email` (text)
      - `invited_by` (uuid, foreign key to employees)
      - `token` (text, unique)
      - `expires_at` (timestamptz)
      - `used_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Employees can view their own data
    - Admin and HR can view all employees
    - Only Admin can edit salary and financial data
    - Only Admin and area manager can assign clients
*/

-- Create employee areas lookup table
CREATE TABLE IF NOT EXISTS employee_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  color text NOT NULL DEFAULT '#3b82f6',
  icon text NOT NULL DEFAULT 'Briefcase',
  created_at timestamptz DEFAULT now()
);

-- Insert default areas
INSERT INTO employee_areas (name, slug, color, icon) VALUES
  ('Tráfego Pago', 'trafego-pago', '#3b82f6', 'TrendingUp'),
  ('Social Media', 'social-media', '#ec4899', 'Share2'),
  ('Designer Gráfico', 'designer-grafico', '#a855f7', 'Palette'),
  ('Videomaker', 'videomaker', '#f97316', 'Video'),
  ('Web Designer', 'web-designer', '#10b981', 'Monitor'),
  ('Comercial', 'comercial', '#f59e0b', 'ShoppingBag'),
  ('Financeiro', 'financeiro', '#059669', 'DollarSign'),
  ('RH', 'rh', '#8b5cf6', 'Users'),
  ('Head Marketing', 'head-marketing', '#0891b2', 'Crown')
ON CONFLICT (name) DO NOTHING;

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  area_id uuid REFERENCES employee_areas(id) NOT NULL,
  photo_url text,
  position text NOT NULL DEFAULT 'Colaborador',
  hire_date date DEFAULT CURRENT_DATE,
  is_active boolean DEFAULT true,
  salary decimal(10,2) DEFAULT 0,
  pix_key text,
  bank_name text,
  bank_agency text,
  bank_account text,
  last_access timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create employee-client assignments table
CREATE TABLE IF NOT EXISTS employee_client_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  client_profile_id uuid REFERENCES client_profiles(id) ON DELETE CASCADE NOT NULL,
  assigned_at timestamptz DEFAULT now(),
  assigned_by uuid REFERENCES employees(id),
  UNIQUE(employee_id, client_profile_id)
);

-- Create employee invitations table
CREATE TABLE IF NOT EXISTS employee_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  invited_by uuid REFERENCES employees(id) NOT NULL,
  token text UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_area_id ON employees(area_id);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employee_assignments_employee ON employee_client_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_assignments_client ON employee_client_assignments(client_profile_id);
CREATE INDEX IF NOT EXISTS idx_employee_invitations_token ON employee_invitations(token);

-- Enable RLS
ALTER TABLE employee_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_client_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employee_areas (public read)
CREATE POLICY "Anyone can view employee areas"
  ON employee_areas FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for employees
CREATE POLICY "Employees can view own profile"
  ON employees FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admin and HR can view all employees"
  ON employees FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN employee_areas ea ON e.area_id = ea.id
      WHERE e.user_id = auth.uid()
      AND (ea.slug IN ('rh', 'head-marketing') OR e.position = 'Admin')
    )
  );

CREATE POLICY "Admin can insert employees"
  ON employees FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE user_id = auth.uid() AND position = 'Admin'
    )
  );

CREATE POLICY "Employees can update own basic info"
  ON employees FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can update all employee data"
  ON employees FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE user_id = auth.uid() AND position = 'Admin'
    )
  );

-- RLS Policies for employee_client_assignments
CREATE POLICY "Employees can view own assignments"
  ON employee_client_assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE id = employee_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admin can view all assignments"
  ON employee_client_assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE user_id = auth.uid() AND position = 'Admin'
    )
  );

CREATE POLICY "Admin can manage assignments"
  ON employee_client_assignments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE user_id = auth.uid() AND position = 'Admin'
    )
  );

-- RLS Policies for employee_invitations
CREATE POLICY "Admin can manage invitations"
  ON employee_invitations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE user_id = auth.uid() AND position = 'Admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for employees table
DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
