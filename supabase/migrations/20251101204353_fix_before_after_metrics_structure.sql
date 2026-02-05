/*
  # Fix Before/After Metrics Structure
  
  1. Changes
    - Drop existing before_after_metrics table with wrong structure
    - Recreate with proper structure using individual metric fields
    - Remove problematic triggers
    - Add proper RLS policies
    
  2. Security
    - Enable RLS
    - Clients can view their own metrics
    - Admins can manage all metrics
*/

-- Drop existing table and triggers
DROP TRIGGER IF EXISTS calculate_improvement_before_insert ON before_after_metrics;
DROP TRIGGER IF EXISTS calculate_improvement_before_update ON before_after_metrics;
DROP FUNCTION IF EXISTS calculate_improvement_percentage();
DROP TABLE IF EXISTS before_after_metrics CASCADE;

-- Create before_after_metrics table with correct structure
CREATE TABLE before_after_metrics (
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

-- Create indexes
CREATE INDEX idx_before_after_metrics_client_id ON before_after_metrics(client_id);
CREATE INDEX idx_before_after_metrics_service_type ON before_after_metrics(client_id, service_type);

-- Enable RLS
ALTER TABLE before_after_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
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

-- Function to calculate improvement percentage
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

-- Create triggers
CREATE TRIGGER calculate_improvement_before_insert
  BEFORE INSERT ON before_after_metrics
  FOR EACH ROW
  EXECUTE FUNCTION calculate_improvement_percentage();

CREATE TRIGGER calculate_improvement_before_update
  BEFORE UPDATE ON before_after_metrics
  FOR EACH ROW
  EXECUTE FUNCTION calculate_improvement_percentage();

CREATE TRIGGER update_before_after_metrics_updated_at
  BEFORE UPDATE ON before_after_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
