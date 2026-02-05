/*
  # Commercial Metrics System
  
  1. New Tables
    - `commercial_metrics`
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key to user_profiles)
      - `period_start` (date) - Start date of the metrics period
      - `period_end` (date) - End date of the metrics period
      - `meetings_scheduled` (integer) - Number of meetings scheduled
      - `meetings_completed` (integer) - Number of meetings completed
      - `clients_closed` (integer) - Number of clients closed
      - `revenue_generated` (decimal) - Revenue generated in BRL
      - `conversion_rate` (decimal) - Conversion rate percentage
      - `pipeline_value` (decimal) - Value in pipeline in BRL
      - `new_contracts` (integer) - New contracts in negotiation
      - `sales_cycle_days` (integer) - Average sales cycle in days
      - `created_by` (uuid, foreign key to user_profiles) - Admin who created the record
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
  
  2. Security
    - Enable RLS on `commercial_metrics` table
    - Add policies for super_admin to create, read, update, and delete
    - Add policy for clients to read only their own metrics
    - Add policy for gestores and colaboradores to read all metrics
  
  3. Indexes
    - Index on client_id for faster lookups
    - Index on period_start and period_end for date range queries
    - Composite index on client_id + period_start for efficient filtering
  
  4. Important Notes
    - Metrics can be manually entered and edited by super_admin
    - Historical data tracking is enabled through created_at and updated_at
    - Decimal fields use numeric(12,2) for precise financial calculations
*/

-- Create commercial_metrics table
CREATE TABLE IF NOT EXISTS commercial_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  meetings_scheduled integer DEFAULT 0,
  meetings_completed integer DEFAULT 0,
  clients_closed integer DEFAULT 0,
  revenue_generated numeric(12,2) DEFAULT 0,
  conversion_rate numeric(5,2) DEFAULT 0,
  pipeline_value numeric(12,2) DEFAULT 0,
  new_contracts integer DEFAULT 0,
  sales_cycle_days integer DEFAULT 0,
  created_by uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_period CHECK (period_end >= period_start),
  CONSTRAINT valid_metrics CHECK (
    meetings_scheduled >= 0 AND
    meetings_completed >= 0 AND
    meetings_completed <= meetings_scheduled AND
    clients_closed >= 0 AND
    revenue_generated >= 0 AND
    conversion_rate >= 0 AND conversion_rate <= 100 AND
    pipeline_value >= 0 AND
    new_contracts >= 0 AND
    sales_cycle_days >= 0
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_commercial_metrics_client ON commercial_metrics(client_id);
CREATE INDEX IF NOT EXISTS idx_commercial_metrics_period_start ON commercial_metrics(period_start);
CREATE INDEX IF NOT EXISTS idx_commercial_metrics_period_end ON commercial_metrics(period_end);
CREATE INDEX IF NOT EXISTS idx_commercial_metrics_client_period ON commercial_metrics(client_id, period_start);

-- Enable RLS
ALTER TABLE commercial_metrics ENABLE ROW LEVEL SECURITY;

-- Policy for super_admin to read all metrics
CREATE POLICY "Super admins can read all commercial metrics"
  ON commercial_metrics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'super_admin'
    )
  );

-- Policy for super_admin to insert metrics
CREATE POLICY "Super admins can insert commercial metrics"
  ON commercial_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'super_admin'
    )
  );

-- Policy for super_admin to update metrics
CREATE POLICY "Super admins can update commercial metrics"
  ON commercial_metrics
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'super_admin'
    )
  );

-- Policy for super_admin to delete metrics
CREATE POLICY "Super admins can delete commercial metrics"
  ON commercial_metrics
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'super_admin'
    )
  );

-- Policy for gestores and colaboradores to read all metrics
CREATE POLICY "Gestores and colaboradores can read all commercial metrics"
  ON commercial_metrics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type IN ('gestor', 'colaborador')
    )
  );

-- Policy for clients to read only their own metrics
CREATE POLICY "Clients can read their own commercial metrics"
  ON commercial_metrics
  FOR SELECT
  TO authenticated
  USING (
    client_id = auth.uid()
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_commercial_metrics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on every update
DROP TRIGGER IF EXISTS update_commercial_metrics_updated_at_trigger ON commercial_metrics;
CREATE TRIGGER update_commercial_metrics_updated_at_trigger
  BEFORE UPDATE ON commercial_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_commercial_metrics_updated_at();
