-- Gamification Tables

-- Table for tracking point events
CREATE TABLE IF NOT EXISTS gamification_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  points INTEGER NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_gamification_points_user ON gamification_points(user_id);
CREATE INDEX idx_gamification_points_created ON gamification_points(created_at);

-- Table for awarded badges
CREATE TABLE IF NOT EXISTS gamification_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  awarded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_gamification_badges_user ON gamification_badges(user_id);

-- Add gamification columns to user_profiles (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'gamification_points'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN gamification_points INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'gamification_level'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN gamification_level INTEGER DEFAULT 1;
  END IF;
END $$;

-- Table for client white-label configuration
CREATE TABLE IF NOT EXISTS client_white_label (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE UNIQUE,
  primary_color VARCHAR(7) DEFAULT '#4F46E5',
  secondary_color VARCHAR(7) DEFAULT '#6B7280',
  accent_color VARCHAR(7) DEFAULT '#10B981',
  logo_url TEXT,
  company_name TEXT,
  report_footer TEXT,
  custom_css TEXT,
  favicon_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_white_label_client ON client_white_label(client_id);
