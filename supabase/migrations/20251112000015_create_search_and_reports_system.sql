-- =====================================================
-- MIGRATION: Sistema de Busca Global e Relatórios
-- Descrição: Full-text search e relatórios personalizados
-- Dependências: Migrations anteriores
-- =====================================================

-- =====================================================
-- SEARCH SYSTEM
-- =====================================================

-- =====================================================
-- 1. TABELA: search_index
-- Índice unificado de busca
-- =====================================================

CREATE TABLE IF NOT EXISTS search_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  
  search_vector tsvector,
  
  tags JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  visibility VARCHAR(20) DEFAULT 'private' CHECK (visibility IN ('public', 'internal', 'private', 'client_specific')),
  
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  indexed_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  UNIQUE(entity_type, entity_id)
);

CREATE INDEX idx_search_index_entity ON search_index(entity_type, entity_id);
CREATE INDEX idx_search_index_client ON search_index(client_id);
CREATE INDEX idx_search_index_vector ON search_index USING gin(search_vector);
CREATE INDEX idx_search_index_tags ON search_index USING gin(tags);

COMMENT ON TABLE search_index IS 'Índice unificado para busca full-text';

-- =====================================================
-- 2. TABELA: search_logs
-- Histórico de buscas
-- =====================================================

CREATE TABLE IF NOT EXISTS search_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  query TEXT NOT NULL,
  filters JSONB DEFAULT '{}'::jsonb,
  
  results_count INTEGER DEFAULT 0,
  
  clicked_result_id UUID,
  clicked_result_type VARCHAR(50),
  
  search_duration_ms INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_search_logs_user ON search_logs(user_id);
CREATE INDEX idx_search_logs_query ON search_logs(query);
CREATE INDEX idx_search_logs_created ON search_logs(created_at DESC);

COMMENT ON TABLE search_logs IS 'Histórico e analytics de buscas';

-- =====================================================
-- 3. TABELA: search_suggestions
-- Sugestões de busca
-- =====================================================

CREATE TABLE IF NOT EXISTS search_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  suggestion TEXT NOT NULL UNIQUE,
  
  usage_count INTEGER DEFAULT 0,
  
  category VARCHAR(50),
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_search_suggestions_suggestion ON search_suggestions(suggestion);
CREATE INDEX idx_search_suggestions_usage ON search_suggestions(usage_count DESC);
CREATE INDEX idx_search_suggestions_category ON search_suggestions(category);

COMMENT ON TABLE search_suggestions IS 'Sugestões automáticas de busca';

-- =====================================================
-- REPORTS SYSTEM
-- =====================================================

-- =====================================================
-- 4. TABELA: report_templates
-- Templates de relatórios reutilizáveis
-- =====================================================

CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  
  description TEXT,
  
  report_type VARCHAR(50) CHECK (report_type IN ('client_performance', 'financial', 'operational', 'marketing', 'custom')),
  
  data_sources JSONB NOT NULL,
  
  sections JSONB DEFAULT '[]'::jsonb,
  
  visualizations JSONB DEFAULT '[]'::jsonb,
  
  filters JSONB DEFAULT '[]'::jsonb,
  
  parameters JSONB DEFAULT '[]'::jsonb,
  
  layout JSONB DEFAULT '{}'::jsonb,
  
  is_public BOOLEAN DEFAULT false,
  
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_report_templates_slug ON report_templates(slug);
CREATE INDEX idx_report_templates_type ON report_templates(report_type);
CREATE INDEX idx_report_templates_public ON report_templates(is_public) WHERE is_public = true;

COMMENT ON TABLE report_templates IS 'Templates de relatórios personalizados';

-- =====================================================
-- 5. TABELA: custom_reports
-- Relatórios gerados/salvos
-- =====================================================

CREATE TABLE IF NOT EXISTS custom_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  template_id UUID REFERENCES report_templates(id) ON DELETE SET NULL,
  
  name VARCHAR(255) NOT NULL,
  
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  
  parameters JSONB DEFAULT '{}'::jsonb,
  
  filters JSONB DEFAULT '{}'::jsonb,
  
  date_range_start DATE,
  date_range_end DATE,
  
  status VARCHAR(20) DEFAULT 'generating' CHECK (status IN ('generating', 'ready', 'failed', 'expired')),
  
  file_url TEXT,
  file_format VARCHAR(10) CHECK (file_format IN ('pdf', 'xlsx', 'csv', 'json', 'html')),
  file_size_bytes BIGINT,
  
  generated_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  error_message TEXT,
  
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_custom_reports_template ON custom_reports(template_id);
CREATE INDEX idx_custom_reports_client ON custom_reports(client_id);
CREATE INDEX idx_custom_reports_status ON custom_reports(status);
CREATE INDEX idx_custom_reports_created ON custom_reports(created_at DESC);

COMMENT ON TABLE custom_reports IS 'Relatórios personalizados gerados';

-- =====================================================
-- 6. TABELA: report_schedules
-- Agendamento automático de relatórios
-- =====================================================

CREATE TABLE IF NOT EXISTS report_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  template_id UUID REFERENCES report_templates(id) ON DELETE CASCADE NOT NULL,
  
  name VARCHAR(255) NOT NULL,
  
  frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  day_of_month INTEGER CHECK (day_of_month >= 1 AND day_of_month <= 31),
  
  time_of_day TIME,
  
  timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
  
  recipients JSONB NOT NULL,
  
  parameters JSONB DEFAULT '{}'::jsonb,
  filters JSONB DEFAULT '{}'::jsonb,
  
  file_formats TEXT[] DEFAULT ARRAY['pdf'],
  
  is_active BOOLEAN DEFAULT true,
  
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_report_schedules_template ON report_schedules(template_id);
CREATE INDEX idx_report_schedules_active ON report_schedules(is_active, next_run_at) WHERE is_active = true;
CREATE INDEX idx_report_schedules_next_run ON report_schedules(next_run_at);

COMMENT ON TABLE report_schedules IS 'Agendamentos de relatórios automáticos';

-- =====================================================
-- 7. TABELA: report_shares
-- Compartilhamento de relatórios
-- =====================================================

CREATE TABLE IF NOT EXISTS report_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  report_id UUID REFERENCES custom_reports(id) ON DELETE CASCADE NOT NULL,
  
  share_token TEXT UNIQUE NOT NULL,
  
  shared_with_email VARCHAR(255),
  shared_with_user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  access_level VARCHAR(20) DEFAULT 'view' CHECK (access_level IN ('view', 'download', 'edit')),
  
  password_hash TEXT,
  
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  
  expires_at TIMESTAMP WITH TIME ZONE,
  
  is_active BOOLEAN DEFAULT true,
  
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_report_shares_report ON report_shares(report_id);
CREATE INDEX idx_report_shares_token ON report_shares(share_token);
CREATE INDEX idx_report_shares_user ON report_shares(shared_with_user_id);
CREATE INDEX idx_report_shares_active ON report_shares(is_active, expires_at) WHERE is_active = true;

COMMENT ON TABLE report_shares IS 'Links de compartilhamento de relatórios';

-- =====================================================
-- 8. TABELA: report_exports
-- Histórico de exports de relatórios
-- =====================================================

CREATE TABLE IF NOT EXISTS report_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  report_id UUID REFERENCES custom_reports(id) ON DELETE CASCADE NOT NULL,
  
  format VARCHAR(10) NOT NULL,
  
  file_url TEXT NOT NULL,
  file_size_bytes BIGINT,
  
  exported_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  ip_address INET,
  
  exported_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_report_exports_report ON report_exports(report_id);
CREATE INDEX idx_report_exports_exported ON report_exports(exported_at DESC);

COMMENT ON TABLE report_exports IS 'Histórico de exports de relatórios';

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER update_search_suggestions_updated_at
  BEFORE UPDATE ON search_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_templates_updated_at
  BEFORE UPDATE ON report_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_schedules_updated_at
  BEFORE UPDATE ON report_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION: Atualizar search_vector automaticamente
-- =====================================================

CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('portuguese', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('portuguese', coalesce(NEW.content, '')), 'C');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_search_index_vector
  BEFORE INSERT OR UPDATE ON search_index
  FOR EACH ROW
  EXECUTE FUNCTION update_search_vector();

COMMENT ON FUNCTION update_search_vector IS 'Atualiza automaticamente o vetor de busca';

-- =====================================================
-- FUNCTION: Busca global
-- =====================================================

CREATE OR REPLACE FUNCTION global_search(
  p_query TEXT,
  p_user_id UUID,
  p_filters JSONB DEFAULT '{}'::jsonb,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE(
  entity_type VARCHAR,
  entity_id UUID,
  title TEXT,
  description TEXT,
  rank REAL,
  metadata JSONB
) AS $$
DECLARE
  v_tsquery tsquery;
BEGIN
  -- Converter query para tsquery
  v_tsquery := plainto_tsquery('portuguese', p_query);
  
  -- Log da busca
  INSERT INTO search_logs (user_id, query, filters)
  VALUES (p_user_id, p_query, p_filters);
  
  -- Retornar resultados
  RETURN QUERY
  SELECT 
    si.entity_type,
    si.entity_id,
    si.title,
    si.description,
    ts_rank(si.search_vector, v_tsquery) AS rank,
    si.metadata
  FROM search_index si
  WHERE si.search_vector @@ v_tsquery
  AND (
    si.visibility = 'public'
    OR si.created_by = p_user_id
    OR EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = p_user_id
      AND up.user_type IN ('super_admin')
    )
  )
  ORDER BY rank DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION global_search IS 'Busca global full-text com ranking';

-- =====================================================
-- FUNCTION: Indexar entidade
-- =====================================================

CREATE OR REPLACE FUNCTION index_entity(
  p_entity_type VARCHAR,
  p_entity_id UUID,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_content TEXT DEFAULT NULL,
  p_tags JSONB DEFAULT '[]'::jsonb,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_visibility VARCHAR DEFAULT 'private',
  p_client_id UUID DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_index_id UUID;
BEGIN
  INSERT INTO search_index (
    entity_type,
    entity_id,
    title,
    description,
    content,
    tags,
    metadata,
    visibility,
    client_id,
    created_by
  ) VALUES (
    p_entity_type,
    p_entity_id,
    p_title,
    p_description,
    p_content,
    p_tags,
    p_metadata,
    p_visibility,
    p_client_id,
    p_created_by
  )
  ON CONFLICT (entity_type, entity_id)
  DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    content = EXCLUDED.content,
    tags = EXCLUDED.tags,
    metadata = EXCLUDED.metadata,
    visibility = EXCLUDED.visibility,
    indexed_at = now()
  RETURNING id INTO v_index_id;
  
  RETURN v_index_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION index_entity IS 'Indexa uma entidade para busca';

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE search_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_schedules ENABLE ROW LEVEL SECURITY;

-- Busca respeitando visibilidade
CREATE POLICY "Busca com visibilidade"
  ON search_index FOR SELECT
  USING (
    visibility = 'public'
    OR created_by = auth.uid()
    OR (visibility = 'internal' AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type != 'client'
    ))
    OR (visibility = 'client_specific' AND EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN clients c ON c.id = up.client_id
      WHERE c.id = search_index.client_id
      AND up.user_id = auth.uid()
    ))
  );

-- Usuários veem seus próprios logs
CREATE POLICY "Ver próprios logs de busca"
  ON search_logs FOR SELECT
  USING (user_id = auth.uid());

-- Colaboradores gerenciam templates
CREATE POLICY "Colaboradores gerenciam templates"
  ON report_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type IN ('super_admin', 'marketing_head', 'financial')
    )
  );

-- Usuários veem relatórios do seu cliente
CREATE POLICY "Ver relatórios do cliente"
  ON custom_reports FOR SELECT
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN clients c ON c.id = up.client_id
      WHERE c.id = custom_reports.client_id
      AND up.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type IN ('super_admin', 'marketing_head', 'financial')
    )
  );

-- =====================================================
-- Fim da Migration: Search & Reports
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration Search & Reports concluída com sucesso!';
  RAISE NOTICE '📊 8 tabelas criadas';
  RAISE NOTICE '🔍 Busca global full-text implementada';
  RAISE NOTICE '📈 Sistema de relatórios personalizados pronto';
END $$;

