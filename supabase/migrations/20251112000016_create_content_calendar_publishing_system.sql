-- =====================================================
-- MIGRATION: Content Calendar & Publishing System
-- Descrição: Sistema completo de planejamento e publicação de conteúdo
-- Dependências: 20251112000002_create_clients_system.sql
-- =====================================================

-- =====================================================
-- 1. TABELA: social_platform_accounts
-- Contas de redes sociais conectadas
-- =====================================================

CREATE TABLE IF NOT EXISTS social_platform_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  
  platform VARCHAR(30) NOT NULL CHECK (platform IN ('instagram', 'facebook', 'linkedin', 'tiktok', 'youtube', 'twitter', 'pinterest')),
  
  account_username VARCHAR(255),
  account_name VARCHAR(255),
  account_id_external VARCHAR(255),
  account_url TEXT,
  
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  
  is_connected BOOLEAN DEFAULT false,
  connection_status VARCHAR(20) CHECK (connection_status IN ('connected', 'expired', 'error', 'disconnected')),
  
  permissions JSONB DEFAULT '[]'::jsonb,
  
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_error TEXT,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  UNIQUE(client_id, platform, account_id_external)
);

CREATE INDEX idx_social_platform_accounts_client ON social_platform_accounts(client_id);
CREATE INDEX idx_social_platform_accounts_platform ON social_platform_accounts(platform);
CREATE INDEX idx_social_platform_accounts_connected ON social_platform_accounts(is_connected) WHERE is_connected = true;

COMMENT ON TABLE social_platform_accounts IS 'Contas de redes sociais conectadas para publicação';

-- =====================================================
-- 2. TABELA: content_categories
-- Categorias de conteúdo
-- =====================================================

CREATE TABLE IF NOT EXISTS content_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  
  color VARCHAR(20) DEFAULT '#cccccc',
  icon VARCHAR(50),
  
  description TEXT,
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_content_categories_slug ON content_categories(slug);

COMMENT ON TABLE content_categories IS 'Categorias de conteúdo (motivacional, promocional, educativo, etc)';

-- =====================================================
-- 3. TABELA: content_hashtag_groups
-- Grupos de hashtags reutilizáveis
-- =====================================================

CREATE TABLE IF NOT EXISTS content_hashtag_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name VARCHAR(100) NOT NULL,
  
  hashtags TEXT[] NOT NULL,
  
  category VARCHAR(50),
  
  performance_score NUMERIC(3, 2) DEFAULT 0.00,
  usage_count INTEGER DEFAULT 0,
  
  is_active BOOLEAN DEFAULT true,
  
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_content_hashtag_groups_category ON content_hashtag_groups(category);
CREATE INDEX idx_content_hashtag_groups_active ON content_hashtag_groups(is_active) WHERE is_active = true;

COMMENT ON TABLE content_hashtag_groups IS 'Grupos de hashtags para reutilização';

-- =====================================================
-- 4. TABELA: content_templates
-- Templates de posts reutilizáveis
-- =====================================================

CREATE TABLE IF NOT EXISTS content_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name VARCHAR(255) NOT NULL,
  
  category_id UUID REFERENCES content_categories(id) ON DELETE SET NULL,
  
  template_text TEXT NOT NULL,
  
  variables JSONB DEFAULT '[]'::jsonb,
  
  platforms TEXT[] DEFAULT ARRAY['instagram', 'facebook'],
  
  media_suggestions JSONB DEFAULT '[]'::jsonb,
  
  hashtag_group_id UUID REFERENCES content_hashtag_groups(id) ON DELETE SET NULL,
  
  usage_count INTEGER DEFAULT 0,
  
  is_active BOOLEAN DEFAULT true,
  
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_content_templates_category ON content_templates(category_id);
CREATE INDEX idx_content_templates_active ON content_templates(is_active) WHERE is_active = true;

COMMENT ON TABLE content_templates IS 'Templates de posts para reutilização';

-- =====================================================
-- 5. TABELA: content_calendar_posts
-- Posts do calendário de conteúdo
-- =====================================================

CREATE TABLE IF NOT EXISTS content_calendar_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  
  title VARCHAR(255) NOT NULL,
  
  category_id UUID REFERENCES content_categories(id) ON DELETE SET NULL,
  template_id UUID REFERENCES content_templates(id) ON DELETE SET NULL,
  
  post_type VARCHAR(30) NOT NULL CHECK (post_type IN ('feed_post', 'story', 'reel', 'video', 'carousel', 'live', 'shorts', 'tweet', 'pin')),
  
  platforms TEXT[] NOT NULL,
  
  caption TEXT,
  
  media_urls JSONB DEFAULT '[]'::jsonb,
  
  hashtags TEXT[] DEFAULT ARRAY[]::TEXT[],
  mentions TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  location_name VARCHAR(255),
  location_id VARCHAR(100),
  
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  scheduled_datetime TIMESTAMP WITH TIME ZONE GENERATED ALWAYS AS (
    (scheduled_date::TEXT || ' ' || scheduled_time::TEXT)::TIMESTAMP WITH TIME ZONE
  ) STORED,
  
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'pending_approval', 'approved', 'scheduled', 'publishing', 'published', 'failed', 'cancelled')),
  
  approval_workflow_id UUID,
  
  assigned_to UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  first_comment TEXT,
  
  alt_text JSONB DEFAULT '{}'::jsonb,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_content_calendar_posts_client ON content_calendar_posts(client_id);
CREATE INDEX idx_content_calendar_posts_scheduled ON content_calendar_posts(scheduled_datetime);
CREATE INDEX idx_content_calendar_posts_status ON content_calendar_posts(status);
CREATE INDEX idx_content_calendar_posts_date ON content_calendar_posts(scheduled_date);
CREATE INDEX idx_content_calendar_posts_platforms ON content_calendar_posts USING gin(platforms);

COMMENT ON TABLE content_calendar_posts IS 'Posts agendados no calendário de conteúdo';

-- =====================================================
-- 6. TABELA: content_post_versions
-- Versionamento de posts
-- =====================================================

CREATE TABLE IF NOT EXISTS content_post_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  post_id UUID REFERENCES content_calendar_posts(id) ON DELETE CASCADE NOT NULL,
  
  version_number INTEGER NOT NULL,
  
  caption TEXT,
  media_urls JSONB,
  hashtags TEXT[],
  
  changes_summary TEXT,
  
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  UNIQUE(post_id, version_number)
);

CREATE INDEX idx_content_post_versions_post ON content_post_versions(post_id);
CREATE INDEX idx_content_post_versions_created ON content_post_versions(created_at DESC);

COMMENT ON TABLE content_post_versions IS 'Histórico de versões de posts';

-- =====================================================
-- 7. TABELA: content_approval_workflow
-- Workflow de aprovação de conteúdo
-- =====================================================

CREATE TABLE IF NOT EXISTS content_approval_workflow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  post_id UUID REFERENCES content_calendar_posts(id) ON DELETE CASCADE NOT NULL,
  
  current_step INTEGER DEFAULT 1,
  total_steps INTEGER NOT NULL,
  
  workflow_config JSONB NOT NULL,
  
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'in_progress')),
  
  completed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_content_approval_workflow_post ON content_approval_workflow(post_id);
CREATE INDEX idx_content_approval_workflow_status ON content_approval_workflow(status);

COMMENT ON TABLE content_approval_workflow IS 'Workflows de aprovação de posts';

-- =====================================================
-- 8. TABELA: content_approval_steps
-- Etapas de aprovação
-- =====================================================

CREATE TABLE IF NOT EXISTS content_approval_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  workflow_id UUID REFERENCES content_approval_workflow(id) ON DELETE CASCADE NOT NULL,
  
  step_number INTEGER NOT NULL,
  step_name VARCHAR(100) NOT NULL,
  
  approver_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  approver_role VARCHAR(50),
  
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'skipped')),
  
  comments TEXT,
  
  approved_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  UNIQUE(workflow_id, step_number)
);

CREATE INDEX idx_content_approval_steps_workflow ON content_approval_steps(workflow_id);
CREATE INDEX idx_content_approval_steps_approver ON content_approval_steps(approver_id);
CREATE INDEX idx_content_approval_steps_status ON content_approval_steps(status);

COMMENT ON TABLE content_approval_steps IS 'Etapas individuais de aprovação';

-- =====================================================
-- 9. TABELA: publishing_queue
-- Fila de publicação
-- =====================================================

CREATE TABLE IF NOT EXISTS publishing_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  post_id UUID REFERENCES content_calendar_posts(id) ON DELETE CASCADE NOT NULL,
  
  platform VARCHAR(30) NOT NULL,
  account_id UUID REFERENCES social_platform_accounts(id) ON DELETE CASCADE NOT NULL,
  
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  
  status VARCHAR(20) DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'published', 'failed', 'cancelled')),
  
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  
  external_post_id VARCHAR(255),
  external_post_url TEXT,
  
  error_message TEXT,
  error_code VARCHAR(50),
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_publishing_queue_post ON publishing_queue(post_id);
CREATE INDEX idx_publishing_queue_status ON publishing_queue(status, scheduled_for);
CREATE INDEX idx_publishing_queue_platform ON publishing_queue(platform);
CREATE INDEX idx_publishing_queue_account ON publishing_queue(account_id);

COMMENT ON TABLE publishing_queue IS 'Fila de publicação em redes sociais';

-- =====================================================
-- 10. TABELA: publishing_logs
-- Histórico de publicações
-- =====================================================

CREATE TABLE IF NOT EXISTS publishing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  post_id UUID REFERENCES content_calendar_posts(id) ON DELETE SET NULL,
  queue_id UUID REFERENCES publishing_queue(id) ON DELETE SET NULL,
  
  platform VARCHAR(30) NOT NULL,
  
  action VARCHAR(50) NOT NULL CHECK (action IN ('published', 'updated', 'deleted', 'scheduled', 'failed')),
  
  external_post_id VARCHAR(255),
  
  request_payload JSONB,
  response_payload JSONB,
  
  success BOOLEAN NOT NULL,
  error_message TEXT,
  
  published_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_publishing_logs_post ON publishing_logs(post_id);
CREATE INDEX idx_publishing_logs_queue ON publishing_logs(queue_id);
CREATE INDEX idx_publishing_logs_platform ON publishing_logs(platform);
CREATE INDEX idx_publishing_logs_published ON publishing_logs(published_at DESC);

COMMENT ON TABLE publishing_logs IS 'Logs detalhados de publicações';

-- =====================================================
-- 11. TABELA: post_performance_tracking
-- Performance de posts publicados
-- =====================================================

CREATE TABLE IF NOT EXISTS post_performance_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  post_id UUID REFERENCES content_calendar_posts(id) ON DELETE CASCADE NOT NULL,
  
  platform VARCHAR(30) NOT NULL,
  external_post_id VARCHAR(255),
  
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  
  engagement_total INTEGER GENERATED ALWAYS AS (likes + comments + shares + saves) STORED,
  engagement_rate NUMERIC(5, 2) GENERATED ALWAYS AS (
    CASE 
      WHEN reach > 0 THEN ((likes + comments + shares + saves)::NUMERIC / reach * 100)
      ELSE 0
    END
  ) STORED,
  
  video_views INTEGER DEFAULT 0,
  video_completion_rate NUMERIC(5, 2),
  video_avg_watch_time INTEGER,
  
  link_clicks INTEGER DEFAULT 0,
  profile_visits INTEGER DEFAULT 0,
  
  followers_gained INTEGER DEFAULT 0,
  
  last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  
  UNIQUE(post_id, platform)
);

CREATE INDEX idx_post_performance_tracking_post ON post_performance_tracking(post_id);
CREATE INDEX idx_post_performance_tracking_platform ON post_performance_tracking(platform);
CREATE INDEX idx_post_performance_tracking_engagement ON post_performance_tracking(engagement_rate DESC);

COMMENT ON TABLE post_performance_tracking IS 'Métricas de performance de posts publicados';

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER update_social_platform_accounts_updated_at
  BEFORE UPDATE ON social_platform_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_hashtag_groups_updated_at
  BEFORE UPDATE ON content_hashtag_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_templates_updated_at
  BEFORE UPDATE ON content_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_calendar_posts_updated_at
  BEFORE UPDATE ON content_calendar_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_approval_workflow_updated_at
  BEFORE UPDATE ON content_approval_workflow
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION: Criar versão de post
-- =====================================================

CREATE OR REPLACE FUNCTION create_post_version()
RETURNS TRIGGER AS $$
DECLARE
  v_version_number INTEGER;
BEGIN
  IF (TG_OP = 'UPDATE' AND (
    OLD.caption IS DISTINCT FROM NEW.caption OR
    OLD.media_urls IS DISTINCT FROM NEW.media_urls OR
    OLD.hashtags IS DISTINCT FROM NEW.hashtags
  )) THEN
    SELECT COALESCE(MAX(version_number), 0) + 1
    INTO v_version_number
    FROM content_post_versions
    WHERE post_id = NEW.id;
    
    INSERT INTO content_post_versions (
      post_id,
      version_number,
      caption,
      media_urls,
      hashtags,
      created_by
    ) VALUES (
      NEW.id,
      v_version_number,
      NEW.caption,
      NEW.media_urls,
      NEW.hashtags,
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_post_version_trigger
  AFTER UPDATE ON content_calendar_posts
  FOR EACH ROW
  EXECUTE FUNCTION create_post_version();

COMMENT ON FUNCTION create_post_version IS 'Cria versão automaticamente quando post é editado';

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE social_platform_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_hashtag_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_calendar_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_post_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE publishing_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_performance_tracking ENABLE ROW LEVEL SECURITY;

-- Colaboradores gerenciam calendário
CREATE POLICY "Colaboradores gerenciam calendário"
  ON content_calendar_posts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type IN ('super_admin', 'social_media', 'marketing_head')
    )
  );

-- Clientes veem seu calendário
CREATE POLICY "Clientes veem seu calendário"
  ON content_calendar_posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN clients c ON c.id = up.client_id
      WHERE c.id = content_calendar_posts.client_id
      AND up.user_id = auth.uid()
    )
  );

-- Clientes aprovam posts
CREATE POLICY "Clientes aprovam posts"
  ON content_approval_steps FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM content_approval_workflow caw
      JOIN content_calendar_posts ccp ON ccp.id = caw.post_id
      JOIN clients c ON c.id = ccp.client_id
      JOIN user_profiles up ON up.client_id = c.id
      WHERE caw.id = content_approval_steps.workflow_id
      AND up.user_id = auth.uid()
    )
  );

-- =====================================================
-- Fim da Migration: Content Calendar
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration Content Calendar concluída com sucesso!';
  RAISE NOTICE '📊 11 tabelas criadas';
  RAISE NOTICE '📅 Sistema completo de calendário de conteúdo implementado';
  RAISE NOTICE '🚀 Publicação automática multi-plataforma pronta';
END $$;

