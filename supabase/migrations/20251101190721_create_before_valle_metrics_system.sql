/*
  # Before Valle 360 Metrics System
  
  1. New Tables
    - `before_valle_metrics`
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key to user_profiles) - UNIQUE per client
      - `period_start` (date) - Start date of the historical period
      - `period_end` (date) - End date of the historical period
      
      Social Media Metrics:
      - `sm_followers` (integer) - Followers count
      - `sm_engagement_rate` (decimal) - Engagement rate percentage
      - `sm_reach` (integer) - Total reach
      - `sm_posts` (integer) - Number of posts
      - `sm_comments` (integer) - Total comments
      - `sm_shares` (integer) - Total shares
      
      Traffic Metrics:
      - `traffic_investment` (decimal) - Total investment in BRL
      - `traffic_leads` (integer) - Number of leads
      - `traffic_cpl` (decimal) - Cost per lead in BRL
      - `traffic_roas` (decimal) - Return on Ad Spend
      - `traffic_conversions` (integer) - Number of conversions
      - `traffic_ctr` (decimal) - Click through rate percentage
      
      Commercial Metrics:
      - `commercial_revenue` (decimal) - Total revenue in BRL
      - `commercial_new_clients` (integer) - New clients acquired
      - `commercial_ticket_medio` (decimal) - Average ticket in BRL
      - `commercial_conversion` (decimal) - Conversion rate percentage
      - `commercial_retention` (decimal) - Retention rate percentage
      - `commercial_nps` (integer) - Net Promoter Score
      
      - `notes` (text) - Additional notes about the historical data
      - `created_by` (uuid, foreign key to user_profiles) - Admin who created the record
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
  
  2. Security
    - Enable RLS on `before_valle_metrics` table
    - Add policies for super_admin to create, read, update (limited to first 30 days)
    - Add policy for clients to read only their own metrics
    - Add policy for gestores and colaboradores to read all metrics
    - UNIQUE constraint on client_id - only ONE record per client
  
  3. Indexes
    - Unique index on client_id
    - Index on created_at for audit purposes
  
  4. Important Notes
    - Only ONE record per client (historical baseline)
    - Can be edited only within first 30 days of creation
    - After 30 days, data becomes read-only to preserve historical accuracy
    - Used for before/after comparisons with current metrics
*/

-- Create before_valle_metrics table
CREATE TABLE IF NOT EXISTS before_valle_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  
  -- Social Media Metrics
  sm_followers integer DEFAULT 0,
  sm_engagement_rate numeric(5,2) DEFAULT 0,
  sm_reach integer DEFAULT 0,
  sm_posts integer DEFAULT 0,
  sm_comments integer DEFAULT 0,
  sm_shares integer DEFAULT 0,
  
  -- Traffic Metrics
  traffic_investment numeric(12,2) DEFAULT 0,
  traffic_leads integer DEFAULT 0,
  traffic_cpl numeric(10,2) DEFAULT 0,
  traffic_roas numeric(10,2) DEFAULT 0,
  traffic_conversions integer DEFAULT 0,
  traffic_ctr numeric(5,2) DEFAULT 0,
  
  -- Commercial Metrics
  commercial_revenue numeric(12,2) DEFAULT 0,
  commercial_new_clients integer DEFAULT 0,
  commercial_ticket_medio numeric(10,2) DEFAULT 0,
  commercial_conversion numeric(5,2) DEFAULT 0,
  commercial_retention numeric(5,2) DEFAULT 0,
  commercial_nps integer DEFAULT 0,
  
  notes text,
  created_by uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_period CHECK (period_end >= period_start),
  CONSTRAINT valid_sm_metrics CHECK (
    sm_followers >= 0 AND
    sm_engagement_rate >= 0 AND
    sm_reach >= 0 AND
    sm_posts >= 0 AND
    sm_comments >= 0 AND
    sm_shares >= 0
  ),
  CONSTRAINT valid_traffic_metrics CHECK (
    traffic_investment >= 0 AND
    traffic_leads >= 0 AND
    traffic_cpl >= 0 AND
    traffic_roas >= 0 AND
    traffic_conversions >= 0 AND
    traffic_ctr >= 0 AND traffic_ctr <= 100
  ),
  CONSTRAINT valid_commercial_metrics CHECK (
    commercial_revenue >= 0 AND
    commercial_new_clients >= 0 AND
    commercial_ticket_medio >= 0 AND
    commercial_conversion >= 0 AND commercial_conversion <= 100 AND
    commercial_retention >= 0 AND commercial_retention <= 100 AND
    commercial_nps >= 0 AND commercial_nps <= 100
  )
);

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_before_valle_metrics_client ON before_valle_metrics(client_id);
CREATE INDEX IF NOT EXISTS idx_before_valle_metrics_created_at ON before_valle_metrics(created_at);

-- Enable RLS
ALTER TABLE before_valle_metrics ENABLE ROW LEVEL SECURITY;

-- Policy for super_admin to read all metrics
CREATE POLICY "Super admins can read all before Valle metrics"
  ON before_valle_metrics
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
CREATE POLICY "Super admins can insert before Valle metrics"
  ON before_valle_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'super_admin'
    )
  );

-- Policy for super_admin to update metrics (only within 30 days of creation)
CREATE POLICY "Super admins can update before Valle metrics within 30 days"
  ON before_valle_metrics
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'super_admin'
    )
    AND created_at >= now() - interval '30 days'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'super_admin'
    )
    AND created_at >= now() - interval '30 days'
  );

-- Policy for gestores and colaboradores to read all metrics
CREATE POLICY "Gestores and colaboradores can read all before Valle metrics"
  ON before_valle_metrics
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
CREATE POLICY "Clients can read their own before Valle metrics"
  ON before_valle_metrics
  FOR SELECT
  TO authenticated
  USING (
    client_id = auth.uid()
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_before_valle_metrics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on every update
DROP TRIGGER IF EXISTS update_before_valle_metrics_updated_at_trigger ON before_valle_metrics;
CREATE TRIGGER update_before_valle_metrics_updated_at_trigger
  BEFORE UPDATE ON before_valle_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_before_valle_metrics_updated_at();
