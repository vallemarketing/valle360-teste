/*
  # Before/After Comparison System Tables

  ## Overview
  This migration creates the database structure for the before/after comparison system,
  allowing admins to manage which services are active for each client and track performance metrics.

  ## New Tables Created

  ### 1. `contract_services`
  Tracks which service areas are active for each client based on their contract.
  
  **Columns:**
  - `id` (uuid, primary key) - Unique identifier
  - `client_id` (uuid, foreign key) - References auth.users
  - `service_type` (text) - Type of service: 'redes_sociais', 'comercial', 'trafego_pago', 'site'
  - `is_active` (boolean) - Whether the service is currently active
  - `start_date` (date) - Service activation date
  - `end_date` (date) - Service deactivation date (nullable)
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `before_after_metrics`
  Stores the before and after metrics for each service area.
  
  **Columns:**
  - `id` (uuid, primary key) - Unique identifier
  - `client_id` (uuid, foreign key) - References auth.users
  - `service_type` (text) - Type of service: 'redes_sociais', 'comercial', 'trafego_pago', 'site'
  - `metric_name` (text) - Name of the metric being tracked
  - `metric_label` (text) - Display label for the metric
  - `before_value` (numeric) - Value before Valle 360
  - `after_value` (numeric) - Value after Valle 360
  - `measurement_date` (date) - Date of measurement
  - `improvement_percentage` (numeric) - Calculated improvement percentage
  - `unit` (text) - Unit of measurement (e.g., '%', 'R$', 'count')
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 3. `client_dashboard_settings`
  Stores client preferences for dashboard layout and section ordering.
  
  **Columns:**
  - `id` (uuid, primary key) - Unique identifier
  - `client_id` (uuid, foreign key) - References auth.users (unique)
  - `section_order` (jsonb) - Array defining the order of dashboard sections
  - `hidden_sections` (jsonb) - Array of section IDs that are hidden
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Clients can view their own services and metrics
  - Only admins can modify services and metrics

  ## Indexes
  - Indexes on foreign keys and frequently queried columns
*/

-- Create contract_services table
CREATE TABLE IF NOT EXISTS contract_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  service_type text NOT NULL CHECK (service_type IN ('redes_sociais', 'comercial', 'trafego_pago', 'site')),
  is_active boolean DEFAULT true,
  start_date date DEFAULT CURRENT_DATE,
  end_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(client_id, service_type)
);

-- Create before_after_metrics table
CREATE TABLE IF NOT EXISTS before_after_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  service_type text NOT NULL CHECK (service_type IN ('redes_sociais', 'comercial', 'trafego_pago', 'site')),
  metric_name text NOT NULL,
  metric_label text NOT NULL,
  before_value numeric(12, 2) NOT NULL,
  after_value numeric(12, 2) NOT NULL,
  measurement_date date DEFAULT CURRENT_DATE,
  improvement_percentage numeric(10, 2),
  unit text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create client_dashboard_settings table
CREATE TABLE IF NOT EXISTS client_dashboard_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  section_order jsonb DEFAULT '[]'::jsonb,
  hidden_sections jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contract_services_client_id ON contract_services(client_id);
CREATE INDEX IF NOT EXISTS idx_contract_services_active ON contract_services(client_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_before_after_metrics_client_id ON before_after_metrics(client_id);
CREATE INDEX IF NOT EXISTS idx_before_after_metrics_service_type ON before_after_metrics(client_id, service_type);
CREATE INDEX IF NOT EXISTS idx_client_dashboard_settings_client_id ON client_dashboard_settings(client_id);

-- Enable Row Level Security
ALTER TABLE contract_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE before_after_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_dashboard_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contract_services
CREATE POLICY "Users can view own contract services"
  ON contract_services FOR SELECT
  TO authenticated
  USING (auth.uid() = client_id);

CREATE POLICY "Admins can view all contract services"
  ON contract_services FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can insert contract services"
  ON contract_services FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update contract services"
  ON contract_services FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can delete contract services"
  ON contract_services FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for before_after_metrics
CREATE POLICY "Users can view own metrics"
  ON before_after_metrics FOR SELECT
  TO authenticated
  USING (auth.uid() = client_id);

CREATE POLICY "Admins can view all metrics"
  ON before_after_metrics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can insert metrics"
  ON before_after_metrics FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update metrics"
  ON before_after_metrics FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can delete metrics"
  ON before_after_metrics FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for client_dashboard_settings
CREATE POLICY "Users can view own dashboard settings"
  ON client_dashboard_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = client_id);

CREATE POLICY "Users can update own dashboard settings"
  ON client_dashboard_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Users can insert own dashboard settings"
  ON client_dashboard_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Admins can view all dashboard settings"
  ON client_dashboard_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type IN ('admin', 'super_admin')
    )
  );

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_contract_services_updated_at ON contract_services;
CREATE TRIGGER update_contract_services_updated_at
  BEFORE UPDATE ON contract_services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_before_after_metrics_updated_at ON before_after_metrics;
CREATE TRIGGER update_before_after_metrics_updated_at
  BEFORE UPDATE ON before_after_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_client_dashboard_settings_updated_at ON client_dashboard_settings;
CREATE TRIGGER update_client_dashboard_settings_updated_at
  BEFORE UPDATE ON client_dashboard_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically calculate improvement percentage
CREATE OR REPLACE FUNCTION calculate_improvement_percentage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.before_value != 0 THEN
    NEW.improvement_percentage := ROUND(((NEW.after_value - NEW.before_value) / NEW.before_value * 100), 2);
  ELSE
    NEW.improvement_percentage := 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-calculate improvement percentage
DROP TRIGGER IF EXISTS calculate_improvement_before_insert ON before_after_metrics;
CREATE TRIGGER calculate_improvement_before_insert
  BEFORE INSERT ON before_after_metrics
  FOR EACH ROW
  EXECUTE FUNCTION calculate_improvement_percentage();

DROP TRIGGER IF EXISTS calculate_improvement_before_update ON before_after_metrics;
CREATE TRIGGER calculate_improvement_before_update
  BEFORE UPDATE ON before_after_metrics
  FOR EACH ROW
  EXECUTE FUNCTION calculate_improvement_percentage();