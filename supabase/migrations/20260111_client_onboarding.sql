-- Migration: Client Onboarding e Metas Personalizadas
-- Data: 2026-01-11
-- Descrição: Tabelas para onboarding do cliente, metas personalizadas, conquistas e streaks

-- =====================================================
-- TABELA: client_onboarding
-- Armazena o progresso do onboarding do cliente
-- =====================================================
CREATE TABLE IF NOT EXISTS client_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  step_completed INTEGER DEFAULT 0,
  objectives JSONB DEFAULT '[]'::jsonb,
  segment TEXT,
  industry TEXT,
  instagram_connected BOOLEAN DEFAULT FALSE,
  instagram_username TEXT,
  instagram_access_token TEXT,
  competitors_selected BOOLEAN DEFAULT FALSE,
  competitors JSONB DEFAULT '[]'::jsonb,
  goals_defined BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_client_onboarding_client ON client_onboarding(client_id);
CREATE INDEX IF NOT EXISTS idx_client_onboarding_completed ON client_onboarding(completed_at);

-- =====================================================
-- TABELA: client_goals
-- Metas personalizadas do cliente
-- =====================================================
CREATE TABLE IF NOT EXISTS client_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL, -- 'followers', 'engagement', 'sales', 'leads', 'reach', 'brand_awareness'
  title TEXT NOT NULL,
  description TEXT,
  target_value DECIMAL NOT NULL,
  current_value DECIMAL DEFAULT 0,
  start_value DECIMAL DEFAULT 0,
  unit TEXT DEFAULT 'number', -- 'number', 'percentage', 'currency'
  deadline DATE,
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'paused', 'cancelled'
  priority INTEGER DEFAULT 1, -- 1=alta, 2=média, 3=baixa
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_client_goals_client ON client_goals(client_id);
CREATE INDEX IF NOT EXISTS idx_client_goals_status ON client_goals(status);
CREATE INDEX IF NOT EXISTS idx_client_goals_deadline ON client_goals(deadline);

-- =====================================================
-- TABELA: client_achievements
-- Conquistas e badges do cliente
-- =====================================================
CREATE TABLE IF NOT EXISTS client_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL, -- 'milestone', 'streak', 'engagement', 'growth', 'loyalty'
  achievement_code TEXT NOT NULL, -- Código único do achievement
  title TEXT NOT NULL,
  description TEXT,
  badge_image_url TEXT,
  points INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  shared_at TIMESTAMPTZ,
  UNIQUE(client_id, achievement_code)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_client_achievements_client ON client_achievements(client_id);
CREATE INDEX IF NOT EXISTS idx_client_achievements_type ON client_achievements(achievement_type);

-- =====================================================
-- TABELA: client_approval_streaks
-- Streaks de aprovações rápidas
-- =====================================================
CREATE TABLE IF NOT EXISTS client_approval_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  total_approvals INTEGER DEFAULT 0,
  last_approval_at TIMESTAMPTZ,
  streak_start_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id)
);

-- Índice
CREATE INDEX IF NOT EXISTS idx_client_streaks_client ON client_approval_streaks(client_id);

-- =====================================================
-- TABELA: post_annotations
-- Anotações visuais em posts para feedback
-- =====================================================
CREATE TABLE IF NOT EXISTS post_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  annotations JSONB DEFAULT '[]'::jsonb, -- [{x, y, width, height, comment, color}]
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_post_annotations_post ON post_annotations(post_id);
CREATE INDEX IF NOT EXISTS idx_post_annotations_client ON post_annotations(client_id);

-- =====================================================
-- TABELA: client_competitors
-- Concorrentes monitorados do cliente
-- =====================================================
CREATE TABLE IF NOT EXISTS client_competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  instagram_username TEXT NOT NULL,
  instagram_id TEXT,
  display_name TEXT,
  profile_picture_url TEXT,
  followers_count INTEGER,
  following_count INTEGER,
  posts_count INTEGER,
  is_verified BOOLEAN DEFAULT FALSE,
  category TEXT,
  bio TEXT,
  website TEXT,
  last_synced_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, instagram_username)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_client_competitors_client ON client_competitors(client_id);
CREATE INDEX IF NOT EXISTS idx_client_competitors_active ON client_competitors(is_active);

-- =====================================================
-- TABELA: competitor_activities
-- Atividades dos concorrentes (posts, stories, etc)
-- =====================================================
CREATE TABLE IF NOT EXISTS competitor_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID REFERENCES client_competitors(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'post', 'story', 'reel', 'engagement_spike'
  content_url TEXT,
  thumbnail_url TEXT,
  caption TEXT,
  likes_count INTEGER,
  comments_count INTEGER,
  shares_count INTEGER,
  engagement_rate DECIMAL,
  is_viral BOOLEAN DEFAULT FALSE,
  posted_at TIMESTAMPTZ,
  detected_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_competitor_activities_competitor ON competitor_activities(competitor_id);
CREATE INDEX IF NOT EXISTS idx_competitor_activities_type ON competitor_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_competitor_activities_viral ON competitor_activities(is_viral);
CREATE INDEX IF NOT EXISTS idx_competitor_activities_posted ON competitor_activities(posted_at DESC);

-- =====================================================
-- RLS Policies
-- =====================================================
ALTER TABLE client_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_approval_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_activities ENABLE ROW LEVEL SECURITY;

-- Policies para client_onboarding
CREATE POLICY "Clientes podem ver seu próprio onboarding"
  ON client_onboarding FOR SELECT
  USING (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND user_type IN ('admin', 'super_admin'))
  );

CREATE POLICY "Clientes podem atualizar seu próprio onboarding"
  ON client_onboarding FOR UPDATE
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

CREATE POLICY "Sistema pode inserir onboarding"
  ON client_onboarding FOR INSERT
  WITH CHECK (true);

-- Policies para client_goals
CREATE POLICY "Clientes podem ver suas próprias metas"
  ON client_goals FOR SELECT
  USING (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND user_type IN ('admin', 'super_admin', 'employee'))
  );

CREATE POLICY "Clientes podem gerenciar suas metas"
  ON client_goals FOR ALL
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

-- Policies para client_achievements
CREATE POLICY "Clientes podem ver suas conquistas"
  ON client_achievements FOR SELECT
  USING (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND user_type IN ('admin', 'super_admin'))
  );

-- Policies para client_approval_streaks
CREATE POLICY "Clientes podem ver seus streaks"
  ON client_approval_streaks FOR SELECT
  USING (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND user_type IN ('admin', 'super_admin'))
  );

-- Policies para post_annotations
CREATE POLICY "Clientes podem ver e criar anotações em seus posts"
  ON post_annotations FOR ALL
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

-- Policies para client_competitors
CREATE POLICY "Clientes podem ver seus concorrentes"
  ON client_competitors FOR SELECT
  USING (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND user_type IN ('admin', 'super_admin'))
  );

CREATE POLICY "Clientes podem gerenciar seus concorrentes"
  ON client_competitors FOR ALL
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

-- Policies para competitor_activities
CREATE POLICY "Usuários podem ver atividades de concorrentes de seus clientes"
  ON competitor_activities FOR SELECT
  USING (
    competitor_id IN (
      SELECT id FROM client_competitors WHERE client_id IN (
        SELECT id FROM clients WHERE user_id = auth.uid()
      )
    )
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND user_type IN ('admin', 'super_admin'))
  );

-- =====================================================
-- Triggers para updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_client_onboarding_updated_at
  BEFORE UPDATE ON client_onboarding
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_goals_updated_at
  BEFORE UPDATE ON client_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_streaks_updated_at
  BEFORE UPDATE ON client_approval_streaks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_post_annotations_updated_at
  BEFORE UPDATE ON post_annotations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
