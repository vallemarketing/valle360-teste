-- Tabela de eventos do timeline do cliente
CREATE TABLE IF NOT EXISTS client_timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  
  event_date DATE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_type VARCHAR(50) DEFAULT 'milestone', -- milestone, campaign, metric, achievement
  
  metrics JSONB, -- Array de métricas com before/after
  image_url TEXT,
  
  is_auto_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_timeline_client ON client_timeline_events(client_id);
CREATE INDEX IF NOT EXISTS idx_timeline_date ON client_timeline_events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_type ON client_timeline_events(event_type);

-- Tabela de snapshots de métricas sociais
CREATE TABLE IF NOT EXISTS social_metrics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  
  snapshot_date DATE NOT NULL,
  platform VARCHAR(50) DEFAULT 'instagram',
  
  -- Métricas principais
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  
  -- Métricas de engajamento
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  avg_likes INTEGER DEFAULT 0,
  avg_comments INTEGER DEFAULT 0,
  avg_saves INTEGER DEFAULT 0,
  avg_shares INTEGER DEFAULT 0,
  
  -- Métricas de alcance
  reach_count INTEGER DEFAULT 0,
  impressions_count INTEGER DEFAULT 0,
  profile_views INTEGER DEFAULT 0,
  website_clicks INTEGER DEFAULT 0,
  
  -- Métricas de stories
  stories_reach INTEGER DEFAULT 0,
  stories_replies INTEGER DEFAULT 0,
  
  -- Dados brutos
  raw_data JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para snapshots
CREATE INDEX IF NOT EXISTS idx_snapshots_client ON social_metrics_snapshots(client_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_date ON social_metrics_snapshots(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_platform ON social_metrics_snapshots(platform);

-- Constraint única por cliente/data/plataforma
CREATE UNIQUE INDEX IF NOT EXISTS idx_snapshots_unique 
ON social_metrics_snapshots(client_id, snapshot_date, platform);

-- RLS Policies
ALTER TABLE client_timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_metrics_snapshots ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Clients can view own timeline" ON client_timeline_events;
DROP POLICY IF EXISTS "Admins can manage timeline" ON client_timeline_events;
DROP POLICY IF EXISTS "Clients can view own snapshots" ON social_metrics_snapshots;
DROP POLICY IF EXISTS "Admins can manage snapshots" ON social_metrics_snapshots;

-- Policies para timeline
CREATE POLICY "Clients can view own timeline" ON client_timeline_events
FOR SELECT USING (
  client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can manage timeline" ON client_timeline_events
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND user_type IN ('super_admin', 'admin')
  )
);

-- Policies para snapshots
CREATE POLICY "Clients can view own snapshots" ON social_metrics_snapshots
FOR SELECT USING (
  client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can manage snapshots" ON social_metrics_snapshots
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND user_type IN ('super_admin', 'admin')
  )
);

-- Função para criar snapshot automático
CREATE OR REPLACE FUNCTION create_monthly_snapshot()
RETURNS TRIGGER AS $$
BEGIN
  -- Esta função seria chamada por um CRON job
  -- para criar snapshots mensais de cada cliente
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
