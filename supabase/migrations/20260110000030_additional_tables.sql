-- =====================================================
-- Additional Tables for Complete System Implementation
-- =====================================================

-- Calendar Events (local storage)
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  attendees TEXT[] DEFAULT '{}',
  meet_link TEXT,
  google_event_id TEXT,
  google_event_link TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'cancelled', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_user ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_client ON calendar_events(client_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start ON calendar_events(start_time);

-- User OAuth Tokens (for external integrations)
CREATE TABLE IF NOT EXISTS user_oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  scope TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_user_oauth_tokens_user ON user_oauth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_oauth_tokens_provider ON user_oauth_tokens(provider);

-- Client Briefings
CREATE TABLE IF NOT EXISTS client_briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  items JSONB NOT NULL DEFAULT '[]',
  notes TEXT,
  assigned_to UUID REFERENCES user_profiles(id),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_briefings_client ON client_briefings(client_id);
CREATE INDEX IF NOT EXISTS idx_client_briefings_status ON client_briefings(status);

-- Contract Events (for audit trail)
CREATE TABLE IF NOT EXISTS contract_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  description TEXT,
  old_value JSONB,
  new_value JSONB,
  new_end_date TIMESTAMP WITH TIME ZONE,
  performed_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contract_events_contract ON contract_events(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_events_type ON contract_events(event_type);

-- Add renewal columns to contracts if not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contracts' AND column_name = 'auto_renew'
  ) THEN
    ALTER TABLE contracts ADD COLUMN auto_renew BOOLEAN DEFAULT FALSE;
    ALTER TABLE contracts ADD COLUMN renewal_period_months INTEGER DEFAULT 12;
    ALTER TABLE contracts ADD COLUMN renewal_count INTEGER DEFAULT 0;
    ALTER TABLE contracts ADD COLUMN last_renewal_date TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);

-- Productivity metrics (for dashboard)
CREATE TABLE IF NOT EXISTS productivity_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  tasks_completed INTEGER DEFAULT 0,
  tasks_pending INTEGER DEFAULT 0,
  avg_completion_hours DECIMAL(10,2),
  sla_compliance_percent DECIMAL(5,2),
  productivity_score DECIMAL(5,2),
  utilization_percent DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_id, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_productivity_metrics_profile ON productivity_metrics(profile_id);
CREATE INDEX IF NOT EXISTS idx_productivity_metrics_period ON productivity_metrics(period_start, period_end);

-- RLS for new tables
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE productivity_metrics ENABLE ROW LEVEL SECURITY;

-- Policies for calendar_events
CREATE POLICY "Users can manage own calendar events"
  ON calendar_events
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for user_oauth_tokens
CREATE POLICY "Users can manage own oauth tokens"
  ON user_oauth_tokens
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role full access
CREATE POLICY "Service role full access calendar_events"
  ON calendar_events TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Service role full access user_oauth_tokens"
  ON user_oauth_tokens TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Service role full access client_briefings"
  ON client_briefings TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Service role full access contract_events"
  ON contract_events TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Service role full access notifications"
  ON notifications TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Service role full access productivity_metrics"
  ON productivity_metrics TO service_role USING (TRUE) WITH CHECK (TRUE);
