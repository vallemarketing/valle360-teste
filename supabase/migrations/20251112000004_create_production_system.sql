-- =====================================================
-- MIGRATION: Sistema de Produção e Aprovações
-- Descrição: Itens de produção, comentários e aprovações
-- Dependências: 20251112000002_create_clients_system.sql
-- =====================================================

-- =====================================================
-- 1. TABELA: production_items
-- Itens de produção criados pela equipe para aprovação do cliente
-- =====================================================

CREATE TABLE IF NOT EXISTS production_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  
  -- Informações básicas
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Tipo de item
  item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('post_instagram', 'post_facebook', 'post_linkedin', 'story', 'reel', 'video', 'banner', 'logo', 'flyer', 'website', 'other')),
  
  -- Arquivos
  file_url TEXT,
  preview_url TEXT,
  thumbnail_url TEXT,
  
  -- Status de aprovação
  status VARCHAR(30) DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'approved', 'rejected', 'in_revision', 'scheduled', 'published')),
  
  -- Responsáveis
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  -- Prazo
  due_date TIMESTAMP WITH TIME ZONE,
  
  -- Aprovação
  approved_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Rejeição
  rejection_reason TEXT,
  revision_count INTEGER DEFAULT 0,
  
  -- Publicação
  scheduled_publish_date TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  
  -- Métricas (se publicado)
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  engagement INTEGER DEFAULT 0,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_production_items_client_id ON production_items(client_id);
CREATE INDEX IF NOT EXISTS idx_production_items_status ON production_items(status);
CREATE INDEX IF NOT EXISTS idx_production_items_created_by ON production_items(created_by);
CREATE INDEX IF NOT EXISTS idx_production_items_assigned_to ON production_items(assigned_to);
CREATE INDEX IF NOT EXISTS idx_production_items_due_date ON production_items(due_date);
CREATE INDEX IF NOT EXISTS idx_production_items_type ON production_items(item_type);
CREATE INDEX IF NOT EXISTS idx_production_items_created_at ON production_items(created_at DESC);

-- Comentários
COMMENT ON TABLE production_items IS 'Itens de produção (posts, vídeos, banners) criados pela equipe para aprovação';

-- =====================================================
-- 2. TABELA: production_comments
-- Comentários e feedback em itens de produção
-- =====================================================

CREATE TABLE IF NOT EXISTS production_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_item_id UUID REFERENCES production_items(id) ON DELETE CASCADE NOT NULL,
  
  -- Autor
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Conteúdo
  content TEXT NOT NULL,
  
  -- Tipo de comentário
  comment_type VARCHAR(20) DEFAULT 'feedback' CHECK (comment_type IN ('feedback', 'approval', 'rejection', 'revision_request', 'note')),
  
  -- Resposta a outro comentário
  parent_comment_id UUID REFERENCES production_comments(id) ON DELETE CASCADE,
  
  -- Anexos
  attachments JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_production_comments_item_id ON production_comments(production_item_id);
CREATE INDEX IF NOT EXISTS idx_production_comments_user_id ON production_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_production_comments_parent ON production_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_production_comments_created_at ON production_comments(created_at DESC);

-- Comentários
COMMENT ON TABLE production_comments IS 'Comentários e feedback em itens de produção';

-- =====================================================
-- 3. TABELA: production_approvals
-- Histórico de aprovações/rejeições
-- =====================================================

CREATE TABLE IF NOT EXISTS production_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_item_id UUID REFERENCES production_items(id) ON DELETE CASCADE NOT NULL,
  
  -- Aprovação ou rejeição
  approved BOOLEAN NOT NULL,
  
  -- Responsável
  approved_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  -- Feedback
  comments TEXT,
  revision_notes TEXT,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamp
  approved_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_production_approvals_item_id ON production_approvals(production_item_id);
CREATE INDEX IF NOT EXISTS idx_production_approvals_approved_by ON production_approvals(approved_by);
CREATE INDEX IF NOT EXISTS idx_production_approvals_date ON production_approvals(approved_at DESC);

-- Comentários
COMMENT ON TABLE production_approvals IS 'Histórico completo de aprovações e rejeições';

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER update_production_items_updated_at
  BEFORE UPDATE ON production_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_production_comments_updated_at
  BEFORE UPDATE ON production_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION: Criar registro de aprovação automaticamente
-- =====================================================

CREATE OR REPLACE FUNCTION create_approval_record()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o status mudou para aprovado ou rejeitado
  IF (NEW.status IN ('approved', 'rejected') AND OLD.status != NEW.status) THEN
    INSERT INTO production_approvals (
      production_item_id,
      approved,
      approved_by,
      comments,
      revision_notes
    ) VALUES (
      NEW.id,
      CASE WHEN NEW.status = 'approved' THEN true ELSE false END,
      NEW.approved_by,
      NULL,
      NEW.rejection_reason
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar registro de aprovação
CREATE TRIGGER create_approval_record_trigger
  AFTER UPDATE ON production_items
  FOR EACH ROW
  EXECUTE FUNCTION create_approval_record();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE production_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_approvals ENABLE ROW LEVEL SECURITY;

-- ===== POLÍTICAS: production_items =====

-- Clientes veem seus próprios itens
CREATE POLICY "Clientes veem seus itens"
  ON production_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN clients c ON c.id = up.client_id
      WHERE c.id = production_items.client_id
      AND up.user_id = auth.uid()
    )
  );

-- Clientes podem aprovar/rejeitar seus itens
CREATE POLICY "Clientes aprovam seus itens"
  ON production_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN clients c ON c.id = up.client_id
      WHERE c.id = production_items.client_id
      AND up.user_id = auth.uid()
    )
  );

-- Colaboradores veem todos os itens
CREATE POLICY "Colaboradores veem todos os itens"
  ON production_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type != 'client'
      AND user_profiles.is_active = true
    )
  );

-- Colaboradores gerenciam itens
CREATE POLICY "Colaboradores gerenciam itens"
  ON production_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type IN ('super_admin', 'social_media', 'video_maker', 'graphic_designer', 'web_designer')
      AND user_profiles.is_active = true
    )
  );

-- ===== POLÍTICAS: production_comments =====

-- Clientes veem comentários de seus itens
CREATE POLICY "Clientes veem comentários"
  ON production_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM production_items pi
      JOIN clients c ON c.id = pi.client_id
      JOIN user_profiles up ON up.client_id = c.id
      WHERE pi.id = production_comments.production_item_id
      AND up.user_id = auth.uid()
    )
  );

-- Clientes podem comentar em seus itens
CREATE POLICY "Clientes comentam seus itens"
  ON production_comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM production_items pi
      JOIN clients c ON c.id = pi.client_id
      JOIN user_profiles up ON up.client_id = c.id
      WHERE pi.id = production_comments.production_item_id
      AND up.user_id = auth.uid()
    )
  );

-- Colaboradores veem e gerenciam todos os comentários
CREATE POLICY "Colaboradores gerenciam comentários"
  ON production_comments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type != 'client'
      AND user_profiles.is_active = true
    )
  );

-- ===== POLÍTICAS: production_approvals =====

-- Todos podem ver histórico de aprovações
CREATE POLICY "Ver histórico de aprovações"
  ON production_approvals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.is_active = true
    )
  );

-- =====================================================
-- Fim da Migration: Sistema de Produção
-- =====================================================

