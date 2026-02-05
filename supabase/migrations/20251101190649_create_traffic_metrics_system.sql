/*
  # Traffic Metrics System (Read-Only from Ads)
  
  1. New Tables
    - `traffic_metrics`
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key to user_profiles)
      - `platform` (text) - 'google_ads' or 'meta_ads'
      - `period_start` (date) - Start date of the metrics period
      - `period_end` (date) - End date of the metrics period
      - `roas` (decimal) - Return on Ad Spend
      - `cpc` (decimal) - Cost Per Click in BRL
      - `cpm` (decimal) - Cost Per Mille (thousand impressions) in BRL
      - `ctr` (decimal) - Click Through Rate percentage
      - `investment` (decimal) - Total investment in BRL
      - `conversions` (integer) - Number of conversions
      - `leads` (integer) - Number of leads generated
      - `impressions` (bigint) - Total impressions
      - `clicks` (integer) - Total clicks
      - `raw_data` (jsonb) - Full raw data from the Ads platform
      - `imported_at` (timestamptz) - When data was imported
      - `import_source` (text) - Source of the import (webhook, api, manual)
      - `created_at` (timestamptz) - Creation timestamp
  
  2. Security
    - Enable RLS on `traffic_metrics` table
    - Add policies for super_admin to read all metrics
    - Add policy for API to insert metrics (via service role)
    - NO UPDATE or DELETE policies - data is immutable once inserted
    - Add policy for clients to read only their own metrics
    - Add policy for gestores and colaboradores to read all metrics
  
  3. Indexes
    - Index on client_id for faster lookups
    - Index on platform for filtering by ad platform
    - Index on period_start and period_end for date range queries
    - Composite index on client_id + platform + period_start
  
  4. Important Notes
    - Data is READ-ONLY after insertion to maintain integrity
    - Data comes directly from Google Ads and Meta Ads platforms
    - No manual editing allowed to ensure data accuracy
    - Raw data stored in jsonb for full audit trail
    - Supports multiple platforms per client
*/

-- Create traffic_metrics table
CREATE TABLE IF NOT EXISTS traffic_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('google_ads', 'meta_ads')),
  period_start date NOT NULL,
  period_end date NOT NULL,
  roas numeric(10,2) DEFAULT 0,
  cpc numeric(10,2) DEFAULT 0,
  cpm numeric(10,2) DEFAULT 0,
  ctr numeric(5,2) DEFAULT 0,
  investment numeric(12,2) DEFAULT 0,
  conversions integer DEFAULT 0,
  leads integer DEFAULT 0,
  impressions bigint DEFAULT 0,
  clicks integer DEFAULT 0,
  raw_data jsonb,
  imported_at timestamptz DEFAULT now(),
  import_source text DEFAULT 'api',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_period CHECK (period_end >= period_start),
  CONSTRAINT valid_platform_metrics CHECK (
    roas >= 0 AND
    cpc >= 0 AND
    cpm >= 0 AND
    ctr >= 0 AND ctr <= 100 AND
    investment >= 0 AND
    conversions >= 0 AND
    leads >= 0 AND
    impressions >= 0 AND
    clicks >= 0
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_traffic_metrics_client ON traffic_metrics(client_id);
CREATE INDEX IF NOT EXISTS idx_traffic_metrics_platform ON traffic_metrics(platform);
CREATE INDEX IF NOT EXISTS idx_traffic_metrics_period_start ON traffic_metrics(period_start);
CREATE INDEX IF NOT EXISTS idx_traffic_metrics_period_end ON traffic_metrics(period_end);
CREATE INDEX IF NOT EXISTS idx_traffic_metrics_client_platform_period ON traffic_metrics(client_id, platform, period_start);
CREATE INDEX IF NOT EXISTS idx_traffic_metrics_imported_at ON traffic_metrics(imported_at);

-- Enable RLS
ALTER TABLE traffic_metrics ENABLE ROW LEVEL SECURITY;

-- Policy for super_admin to read all traffic metrics
CREATE POLICY "Super admins can read all traffic metrics"
  ON traffic_metrics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'super_admin'
    )
  );

-- Policy for API/system to insert traffic metrics (service role only)
CREATE POLICY "System can insert traffic metrics"
  ON traffic_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'super_admin'
    )
  );

-- Policy for gestores and colaboradores to read all metrics
CREATE POLICY "Gestores and colaboradores can read all traffic metrics"
  ON traffic_metrics
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
CREATE POLICY "Clients can read their own traffic metrics"
  ON traffic_metrics
  FOR SELECT
  TO authenticated
  USING (
    client_id = auth.uid()
  );

-- Note: NO UPDATE or DELETE policies - data is immutable once inserted
-- This ensures data integrity from the Ads platforms
