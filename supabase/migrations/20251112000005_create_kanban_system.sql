-- =====================================================
-- MIGRATION: Sistema Kanban
-- Descrição: Quadros, colunas, tarefas, comentários e histórico
-- Dependências: 20251112000002_create_clients_system.sql
-- =====================================================

-- =====================================================
-- 1. TABELA: kanban_boards
-- Quadros Kanban para gestão de projetos
-- =====================================================

CREATE TABLE IF NOT EXISTS kanban_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Informações básicas
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Departamento/área
  department VARCHAR(100),
  
  -- Controle de acesso
  is_public BOOLEAN DEFAULT false,
  allowed_roles JSONB DEFAULT '[]'::jsonb,
  
  -- Configurações
  settings JSONB DEFAULT '{}'::jsonb,
  
  -- Criação
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_kanban_boards_department ON kanban_boards(department);
CREATE INDEX IF NOT EXISTS idx_kanban_boards_created_by ON kanban_boards(created_by);
CREATE INDEX IF NOT EXISTS idx_kanban_boards_is_public ON kanban_boards(is_public);

COMMENT ON TABLE kanban_boards IS 'Quadros Kanban para gestão de projetos e tarefas';

-- =====================================================
-- 2. TABELA: kanban_columns
-- Colunas dos quadros Kanban
-- =====================================================

CREATE TABLE IF NOT EXISTS kanban_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID REFERENCES kanban_boards(id) ON DELETE CASCADE NOT NULL,
  
  -- Informações da coluna
  name VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Ordem e estilo
  position INTEGER NOT NULL DEFAULT 0,
  color VARCHAR(20) DEFAULT '#cccccc',
  
  -- Limite WIP (Work In Progress)
  wip_limit INTEGER,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_kanban_columns_board_id ON kanban_columns(board_id);
CREATE INDEX IF NOT EXISTS idx_kanban_columns_position ON kanban_columns(board_id, position);

COMMENT ON TABLE kanban_columns IS 'Colunas dos quadros Kanban (ex: Backlog, Em Produção, Concluído)';

-- =====================================================
-- 3. TABELA: kanban_labels
-- Etiquetas/tags para cards do Kanban
-- =====================================================

CREATE TABLE IF NOT EXISTS kanban_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID REFERENCES kanban_boards(id) ON DELETE CASCADE NOT NULL,
  
  -- Informações da label
  name VARCHAR(50) NOT NULL,
  color VARCHAR(20) NOT NULL,
  
  -- Criação
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_kanban_labels_board_id ON kanban_labels(board_id);

COMMENT ON TABLE kanban_labels IS 'Etiquetas/tags reutilizáveis para categorizar cards';

-- =====================================================
-- 4. TABELA: kanban_tasks (Cards)
-- Cards/tarefas do Kanban
-- =====================================================

CREATE TABLE IF NOT EXISTS kanban_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  column_id UUID REFERENCES kanban_columns(id) ON DELETE CASCADE NOT NULL,
  board_id UUID REFERENCES kanban_boards(id) ON DELETE CASCADE NOT NULL,
  
  -- Informações básicas
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Posição na coluna
  position INTEGER NOT NULL DEFAULT 0,
  
  -- Atribuição (múltiplos usuários)
  assigned_to JSONB DEFAULT '[]'::jsonb,
  
  -- Criação
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  -- Cliente relacionado (opcional)
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  
  -- Prazo
  due_date TIMESTAMP WITH TIME ZONE,
  
  -- Labels/tags
  label_ids JSONB DEFAULT '[]'::jsonb,
  tags JSONB DEFAULT '[]'::jsonb,
  
  -- Prioridade
  priority VARCHAR(20) DEFAULT 'media' CHECK (priority IN ('baixa', 'media', 'alta', 'urgente')),
  
  -- Checklist
  checklist JSONB DEFAULT '[]'::jsonb,
  
  -- Anexos
  attachments JSONB DEFAULT '[]'::jsonb,
  
  -- Contadores
  comments_count INTEGER DEFAULT 0,
  attachments_count INTEGER DEFAULT 0,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_column_id ON kanban_tasks(column_id);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_board_id ON kanban_tasks(board_id);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_position ON kanban_tasks(column_id, position);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_created_by ON kanban_tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_client_id ON kanban_tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_due_date ON kanban_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_priority ON kanban_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_assigned_to ON kanban_tasks USING gin(assigned_to);

COMMENT ON TABLE kanban_tasks IS 'Cards/tarefas do Kanban';

-- =====================================================
-- 5. TABELA: kanban_task_comments
-- Comentários em tarefas do Kanban
-- =====================================================

CREATE TABLE IF NOT EXISTS kanban_task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES kanban_tasks(id) ON DELETE CASCADE NOT NULL,
  
  -- Autor
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Conteúdo
  content TEXT NOT NULL,
  
  -- Resposta a outro comentário
  parent_comment_id UUID REFERENCES kanban_task_comments(id) ON DELETE CASCADE,
  
  -- Edição
  is_edited BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_kanban_task_comments_task_id ON kanban_task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_kanban_task_comments_user_id ON kanban_task_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_kanban_task_comments_parent ON kanban_task_comments(parent_comment_id);

COMMENT ON TABLE kanban_task_comments IS 'Comentários e discussões em tarefas';

-- =====================================================
-- 6. TABELA: kanban_task_history
-- Histórico de mudanças nas tarefas
-- =====================================================

CREATE TABLE IF NOT EXISTS kanban_task_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES kanban_tasks(id) ON DELETE CASCADE NOT NULL,
  
  -- Usuário que fez a mudança
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  -- Tipo de ação
  action_type VARCHAR(50) NOT NULL CHECK (action_type IN (
    'created', 'moved', 'assigned', 'unassigned', 'priority_changed', 
    'due_date_changed', 'title_changed', 'description_changed', 
    'label_added', 'label_removed', 'completed', 'archived'
  )),
  
  -- Detalhes da mudança
  old_value JSONB,
  new_value JSONB,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_kanban_task_history_task_id ON kanban_task_history(task_id);
CREATE INDEX IF NOT EXISTS idx_kanban_task_history_user_id ON kanban_task_history(user_id);
CREATE INDEX IF NOT EXISTS idx_kanban_task_history_created_at ON kanban_task_history(created_at DESC);

COMMENT ON TABLE kanban_task_history IS 'Histórico completo de todas as mudanças nas tarefas';

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER update_kanban_boards_updated_at
  BEFORE UPDATE ON kanban_boards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kanban_columns_updated_at
  BEFORE UPDATE ON kanban_columns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kanban_tasks_updated_at
  BEFORE UPDATE ON kanban_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kanban_task_comments_updated_at
  BEFORE UPDATE ON kanban_task_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION: Registrar histórico de mudanças
-- =====================================================

CREATE OR REPLACE FUNCTION log_kanban_task_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log de movimentação entre colunas
  IF (TG_OP = 'UPDATE' AND OLD.column_id != NEW.column_id) THEN
    INSERT INTO kanban_task_history (task_id, user_id, action_type, old_value, new_value)
    VALUES (
      NEW.id,
      auth.uid(),
      'moved',
      jsonb_build_object('column_id', OLD.column_id),
      jsonb_build_object('column_id', NEW.column_id)
    );
  END IF;
  
  -- Log de mudança de prioridade
  IF (TG_OP = 'UPDATE' AND OLD.priority != NEW.priority) THEN
    INSERT INTO kanban_task_history (task_id, user_id, action_type, old_value, new_value)
    VALUES (
      NEW.id,
      auth.uid(),
      'priority_changed',
      jsonb_build_object('priority', OLD.priority),
      jsonb_build_object('priority', NEW.priority)
    );
  END IF;
  
  -- Log de criação
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO kanban_task_history (task_id, user_id, action_type, new_value)
    VALUES (
      NEW.id,
      auth.uid(),
      'created',
      jsonb_build_object('title', NEW.title, 'column_id', NEW.column_id)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para registrar histórico
CREATE TRIGGER log_task_changes_trigger
  AFTER INSERT OR UPDATE ON kanban_tasks
  FOR EACH ROW
  EXECUTE FUNCTION log_kanban_task_changes();

-- =====================================================
-- FUNCTION: Atualizar contador de comentários
-- =====================================================

CREATE OR REPLACE FUNCTION update_task_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE kanban_tasks 
    SET comments_count = comments_count + 1
    WHERE id = NEW.task_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE kanban_tasks 
    SET comments_count = GREATEST(0, comments_count - 1)
    WHERE id = OLD.task_id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar contador
CREATE TRIGGER update_comments_count_trigger
  AFTER INSERT OR DELETE ON kanban_task_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_task_comments_count();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE kanban_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_task_history ENABLE ROW LEVEL SECURITY;

-- ===== POLÍTICAS: kanban_boards =====

-- Colaboradores veem quadros públicos ou de seu departamento
CREATE POLICY "Ver quadros acessíveis"
  ON kanban_boards FOR SELECT
  USING (
    is_public = true
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.is_active = true
      AND (
        user_profiles.user_type = 'super_admin'
        OR user_profiles.department = kanban_boards.department
      )
    )
  );

-- Super admins gerenciam quadros
CREATE POLICY "Admins gerenciam quadros"
  ON kanban_boards FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type = 'super_admin'
      AND user_profiles.is_active = true
    )
  );

-- ===== POLÍTICAS: kanban_columns =====

-- Ver colunas dos quadros acessíveis
CREATE POLICY "Ver colunas"
  ON kanban_columns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM kanban_boards
      WHERE kanban_boards.id = kanban_columns.board_id
      AND (
        kanban_boards.is_public = true
        OR EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.user_id = auth.uid()
          AND user_profiles.is_active = true
        )
      )
    )
  );

-- Admins gerenciam colunas
CREATE POLICY "Admins gerenciam colunas"
  ON kanban_columns FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type = 'super_admin'
      AND user_profiles.is_active = true
    )
  );

-- ===== POLÍTICAS: kanban_tasks =====

-- Colaboradores veem e gerenciam tarefas
CREATE POLICY "Colaboradores gerenciam tarefas"
  ON kanban_tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type != 'client'
      AND user_profiles.is_active = true
    )
  );

-- Clientes veem tarefas relacionadas a eles
CREATE POLICY "Clientes veem suas tarefas"
  ON kanban_tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN clients c ON c.id = up.client_id
      WHERE c.id = kanban_tasks.client_id
      AND up.user_id = auth.uid()
    )
  );

-- ===== POLÍTICAS: kanban_task_comments =====

-- Ver e criar comentários
CREATE POLICY "Gerenciar comentários"
  ON kanban_task_comments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.is_active = true
    )
  );

-- ===== POLÍTICAS: kanban_task_history =====

-- Ver histórico
CREATE POLICY "Ver histórico"
  ON kanban_task_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.is_active = true
    )
  );

-- =====================================================
-- Fim da Migration: Sistema Kanban
-- =====================================================

