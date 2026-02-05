-- =====================================================
-- MIGRATION: Sistema de Dashboards e Métricas
-- Descrição: Configurações de dashboards, métricas e KPIs
-- Dependências: 20251112000002_create_clients_system.sql
-- =====================================================

-- =====================================================
-- MÉTRICAS DE CLIENTES
-- =====================================================

CREATE TABLE IF NOT EXISTS client_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  
  metric_date DATE NOT NULL,
  metric_type VARCHAR(50) NOT NULL,
  
  value NUMERIC(12, 2) NOT NULL,
  previous_value NUMERIC(12, 2),
  change_percentage NUMERIC(5, 2),
  
  metric_details JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  UNIQUE(client_id, metric_date, metric_type)
);

CREATE INDEX idx_client_metrics_client ON client_metrics(client_id);
CREATE INDEX idx_client_metrics_date ON client_metrics(metric_date DESC);
CREATE INDEX idx_client_metrics_type ON client_metrics(metric_type);

-- =====================================================
-- BEFORE/AFTER COMPARAÇÕES
-- =====================================================

CREATE TABLE IF NOT EXISTS before_after_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  
  before_value NUMERIC(12, 2) NOT NULL,
  after_value NUMERIC(12, 2) NOT NULL,
  improvement_percentage NUMERIC(5, 2),
  
  before_date DATE NOT NULL,
  after_date DATE NOT NULL,
  
  before_image_url TEXT,
  after_image_url TEXT,
  
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_before_after_client ON before_after_metrics(client_id);
CREATE INDEX idx_before_after_featured ON before_after_metrics(is_featured) WHERE is_featured = true;

-- =====================================================
-- CONFIGURAÇÕES DE DASHBOARD
-- =====================================================

CREATE TABLE IF NOT EXISTS client_dashboard_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  layout_config JSONB DEFAULT '{}'::jsonb,
  visible_widgets JSONB DEFAULT '[]'::jsonb,
  widget_positions JSONB DEFAULT '{}'::jsonb,
  
  theme_preferences JSONB DEFAULT '{}'::jsonb,
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- =====================================================
-- SOCIAL MEDIA (Módulos para o Dashboard)
-- =====================================================

CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  
  platform VARCHAR(30) NOT NULL CHECK (platform IN ('instagram', 'facebook', 'linkedin', 'tiktok', 'youtube', 'twitter')),
  
  post_type VARCHAR(30) CHECK (post_type IN ('post', 'story', 'reel', 'video', 'carousel')),
  post_id_external VARCHAR(255),
  
  content TEXT,
  media_url TEXT,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  engagement INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_social_posts_client ON social_posts(client_id);
CREATE INDEX idx_social_posts_platform ON social_posts(platform);
CREATE INDEX idx_social_posts_published ON social_posts(published_at DESC);

CREATE TABLE IF NOT EXISTS social_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  
  platform VARCHAR(30) NOT NULL,
  metric_date DATE NOT NULL,
  
  followers INTEGER DEFAULT 0,
  following INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  
  total_impressions INTEGER DEFAULT 0,
  total_reach INTEGER DEFAULT 0,
  total_engagement INTEGER DEFAULT 0,
  engagement_rate NUMERIC(5, 2) DEFAULT 0.00,
  
  profile_visits INTEGER DEFAULT 0,
  website_clicks INTEGER DEFAULT 0,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  UNIQUE(client_id, platform, metric_date)
);

CREATE INDEX idx_social_metrics_client ON social_metrics(client_id);
CREATE INDEX idx_social_metrics_platform ON social_metrics(platform);
CREATE INDEX idx_social_metrics_date ON social_metrics(metric_date DESC);

-- =====================================================
-- VÍDEO E DESIGN
-- =====================================================

CREATE TABLE IF NOT EXISTS video_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  video_type VARCHAR(50),
  
  duration_seconds INTEGER,
  file_url TEXT,
  thumbnail_url TEXT,
  
  status VARCHAR(20) DEFAULT 'in_production' CHECK (status IN ('planning', 'in_production', 'review', 'approved', 'published', 'cancelled')),
  
  views INTEGER DEFAULT 0,
  completion_rate NUMERIC(5, 2),
  engagement_rate NUMERIC(5, 2),
  
  assigned_to UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  due_date DATE,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_video_projects_client ON video_projects(client_id);
CREATE INDEX idx_video_projects_status ON video_projects(status);

CREATE TABLE IF NOT EXISTS design_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  
  title VARCHAR(255) NOT NULL,
  asset_type VARCHAR(50) CHECK (asset_type IN ('logo', 'banner', 'flyer', 'brochure', 'business_card', 'social_post', 'infographic', 'other')),
  
  file_url TEXT,
  preview_url TEXT,
  
  dimensions VARCHAR(50),
  file_size_bytes BIGINT,
  
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'rejected')),
  
  assigned_to UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_design_assets_client ON design_assets(client_id);
CREATE INDEX idx_design_assets_type ON design_assets(asset_type);

-- =====================================================
-- WEB
-- =====================================================

CREATE TABLE IF NOT EXISTS web_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  
  project_name VARCHAR(255) NOT NULL,
  project_type VARCHAR(50) CHECK (project_type IN ('website', 'landing_page', 'ecommerce', 'blog', 'app', 'other')),
  
  domain VARCHAR(255),
  url TEXT,
  
  status VARCHAR(20) DEFAULT 'planning' CHECK (status IN ('planning', 'design', 'development', 'testing', 'live', 'maintenance', 'cancelled')),
  
  go_live_date DATE,
  last_deployment_date TIMESTAMP WITH TIME ZONE,
  
  assigned_to UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_web_projects_client ON web_projects(client_id);
CREATE INDEX idx_web_projects_status ON web_projects(status);

CREATE TABLE IF NOT EXISTS web_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  web_project_id UUID REFERENCES web_projects(id) ON DELETE CASCADE NOT NULL,
  
  metric_date DATE NOT NULL,
  
  page_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  bounce_rate NUMERIC(5, 2),
  avg_session_duration INTEGER,
  
  conversions INTEGER DEFAULT 0,
  conversion_rate NUMERIC(5, 2),
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  UNIQUE(web_project_id, metric_date)
);

CREATE INDEX idx_web_metrics_project ON web_metrics(web_project_id);
CREATE INDEX idx_web_metrics_date ON web_metrics(metric_date DESC);

-- =====================================================
-- COMERCIAL/VENDAS
-- =====================================================

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  company_name VARCHAR(255),
  
  lead_source VARCHAR(50),
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
  
  score INTEGER DEFAULT 0,
  
  assigned_to UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_assigned ON leads(assigned_to);

CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  
  deal_name VARCHAR(255) NOT NULL,
  deal_value NUMERIC(12, 2) NOT NULL,
  
  stage VARCHAR(30) DEFAULT 'proposal' CHECK (stage IN ('proposal', 'negotiation', 'contract', 'won', 'lost')),
  
  probability INTEGER DEFAULT 50 CHECK (probability >= 0 AND probability <= 100),
  expected_close_date DATE,
  actual_close_date DATE,
  
  assigned_to UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_deals_stage ON deals(stage);
CREATE INDEX idx_deals_assigned ON deals(assigned_to);
CREATE INDEX idx_deals_close_date ON deals(expected_close_date);

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER update_before_after_metrics_updated_at
  BEFORE UPDATE ON before_after_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_dashboard_settings_updated_at
  BEFORE UPDATE ON client_dashboard_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE client_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE before_after_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_dashboard_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_metrics ENABLE ROW LEVEL SECURITY;

-- Clientes veem suas próprias métricas
CREATE POLICY "Clientes veem suas métricas"
  ON client_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN clients c ON c.id = up.client_id
      WHERE c.id = client_metrics.client_id
      AND up.user_id = auth.uid()
    )
  );

-- Colaboradores veem todas as métricas
CREATE POLICY "Colaboradores veem todas as métricas"
  ON client_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type != 'client'
      AND user_profiles.is_active = true
    )
  );

-- =====================================================
-- Fim da Migration: Dashboards e Métricas
-- =====================================================

