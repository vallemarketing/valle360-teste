-- ============================================
-- Social Command Center - Migrations
-- Tables for OAuth connections, approvals, and audit
-- ============================================

-- ============================================
-- 1. Client Social Connections (OAuth tokens)
-- ============================================

CREATE TABLE IF NOT EXISTS client_social_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  
  -- Platform data
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'linkedin', 'tiktok', 'youtube', 'twitter')),
  account_id TEXT NOT NULL,
  account_name TEXT,
  account_avatar TEXT,
  
  -- Tokens (should be encrypted in production)
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  scopes TEXT[],
  
  -- Control
  is_active BOOLEAN DEFAULT true,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  connected_by UUID REFERENCES auth.users(id),
  connected_by_role TEXT NOT NULL CHECK (connected_by_role IN ('client', 'super_admin')),
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(client_id, platform, account_id)
);

CREATE INDEX IF NOT EXISTS idx_social_connections_client ON client_social_connections(client_id);
CREATE INDEX IF NOT EXISTS idx_social_connections_platform ON client_social_connections(platform);
CREATE INDEX IF NOT EXISTS idx_social_connections_active ON client_social_connections(is_active);

-- ============================================
-- 2. Social Connection Audit Log
-- ============================================

CREATE TABLE IF NOT EXISTS social_connection_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  platform TEXT NOT NULL,
  account_id TEXT,
  account_name TEXT,
  
  -- Action
  action TEXT NOT NULL CHECK (action IN ('connected', 'disconnected', 'token_refreshed', 'token_expired', 'failed', 'permission_changed')),
  
  -- Who performed
  performed_by UUID REFERENCES auth.users(id),
  performed_by_role TEXT NOT NULL CHECK (performed_by_role IN ('client', 'super_admin', 'system')),
  
  -- Details
  reason TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_client ON social_connection_audit(client_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON social_connection_audit(action);
CREATE INDEX IF NOT EXISTS idx_audit_date ON social_connection_audit(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_platform ON social_connection_audit(platform);

-- ============================================
-- 3. Client Approval Flows Configuration
-- ============================================

CREATE TABLE IF NOT EXISTS client_approval_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Flow type
  flow_type TEXT NOT NULL DEFAULT 'head_only' CHECK (flow_type IN ('head_only', 'head_admin', 'direct')),
  
  -- Options
  require_client_approval BOOLEAN DEFAULT true,
  auto_publish BOOLEAN DEFAULT false,
  notify_on_approval BOOLEAN DEFAULT true,
  notify_on_rejection BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_approval_flows_client ON client_approval_flows(client_id);

-- ============================================
-- 4. Scheduled Posts Table
-- ============================================

CREATE TABLE IF NOT EXISTS scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  
  -- Content
  copy TEXT NOT NULL,
  hashtags TEXT[],
  cta TEXT,
  visual_prompt TEXT,
  media_urls TEXT[],
  
  -- Platforms
  platforms TEXT[] NOT NULL,
  
  -- Scheduling
  scheduled_at TIMESTAMP WITH TIME ZONE,
  publish_immediately BOOLEAN DEFAULT false,
  
  -- Status
  status TEXT DEFAULT 'pending_approval' CHECK (status IN (
    'pending_approval', 
    'approved', 
    'rejected', 
    'scheduled', 
    'publishing', 
    'published', 
    'failed'
  )),
  
  -- Approval workflow
  approval_flow_step TEXT DEFAULT 'head',
  approved_by_head UUID REFERENCES auth.users(id),
  approved_by_head_at TIMESTAMP WITH TIME ZONE,
  approved_by_admin UUID REFERENCES auth.users(id),
  approved_by_admin_at TIMESTAMP WITH TIME ZONE,
  approved_by_client UUID REFERENCES auth.users(id),
  approved_by_client_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  rejected_by UUID REFERENCES auth.users(id),
  rejected_at TIMESTAMP WITH TIME ZONE,
  
  -- Publishing
  published_at TIMESTAMP WITH TIME ZONE,
  publish_results JSONB DEFAULT '{}',
  error_message TEXT,
  
  -- Metadata
  ai_generated BOOLEAN DEFAULT false,
  demand_type TEXT,
  kanban_task_id UUID,
  
  -- Tracking
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_posts_client ON scheduled_posts(client_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON scheduled_posts(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled ON scheduled_posts(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_created ON scheduled_posts(created_at);

-- ============================================
-- 5. Post Approval History
-- ============================================

CREATE TABLE IF NOT EXISTS post_approval_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES scheduled_posts(id) ON DELETE CASCADE NOT NULL,
  
  -- Action
  action TEXT NOT NULL CHECK (action IN ('created', 'submitted', 'approved', 'rejected', 'edited', 'published', 'failed')),
  step TEXT,
  
  -- Who
  performed_by UUID REFERENCES auth.users(id),
  performed_by_role TEXT,
  
  -- Details
  comments TEXT,
  changes JSONB,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_approval_history_post ON post_approval_history(post_id);
CREATE INDEX IF NOT EXISTS idx_approval_history_action ON post_approval_history(action);

-- ============================================
-- 6. Triggers for updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_client_social_connections_updated_at ON client_social_connections;
CREATE TRIGGER update_client_social_connections_updated_at
  BEFORE UPDATE ON client_social_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_client_approval_flows_updated_at ON client_approval_flows;
CREATE TRIGGER update_client_approval_flows_updated_at
  BEFORE UPDATE ON client_approval_flows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_scheduled_posts_updated_at ON scheduled_posts;
CREATE TRIGGER update_scheduled_posts_updated_at
  BEFORE UPDATE ON scheduled_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. RLS Policies
-- ============================================

ALTER TABLE client_social_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_connection_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_approval_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_approval_history ENABLE ROW LEVEL SECURITY;

-- Super admins can do everything
CREATE POLICY "Super admins full access to social_connections"
  ON client_social_connections
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins full access to social_audit"
  ON social_connection_audit
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins full access to approval_flows"
  ON client_approval_flows
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins full access to scheduled_posts"
  ON scheduled_posts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins full access to approval_history"
  ON post_approval_history
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  );

-- Clients can view their own connections
CREATE POLICY "Clients view own social_connections"
  ON client_social_connections
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN clients c ON c.id = client_social_connections.client_id
      WHERE up.user_id = auth.uid()
      AND up.role = 'client'
      AND c.user_id = auth.uid()
    )
  );

-- Clients can view their own posts
CREATE POLICY "Clients view own scheduled_posts"
  ON scheduled_posts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN clients c ON c.id = scheduled_posts.client_id
      WHERE up.user_id = auth.uid()
      AND up.role = 'client'
      AND c.user_id = auth.uid()
    )
  );

COMMENT ON TABLE client_social_connections IS 'OAuth connections for client social media accounts';
COMMENT ON TABLE social_connection_audit IS 'Audit log for all social connection changes';
COMMENT ON TABLE client_approval_flows IS 'Configuration for approval workflow per client';
COMMENT ON TABLE scheduled_posts IS 'Posts scheduled for publishing across platforms';
COMMENT ON TABLE post_approval_history IS 'History of approval actions on posts';
