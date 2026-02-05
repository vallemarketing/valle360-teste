/*
  # Melhorias no Sistema Kanban

  1. Novas Colunas
    - Adicionar campos de busca e tags
    - Adicionar campos para cross-department
    - Adicionar contador de comentários e anexos

  2. Nova Tabela
    - `kanban_comments` - Sistema de comentários

  3. Funções
    - Busca full-text de cards
    - Notificações automáticas
    - Histórico automático de movimentações

  4. Índices
    - Otimização para busca
    - Otimização para filtros
*/

-- Adicionar campos faltantes em kanban_tasks (tags e comments_count já existem na primeira migration)
ALTER TABLE kanban_tasks
  ADD COLUMN IF NOT EXISTS search_vector tsvector,
  ADD COLUMN IF NOT EXISTS watchers uuid[] DEFAULT '{}';

-- Adicionar campos faltantes em kanban_comments
ALTER TABLE kanban_comments
  ADD COLUMN IF NOT EXISTS mentions uuid[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_edited boolean DEFAULT false;

-- Renomear content para comment se necessário
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kanban_comments' AND column_name = 'content') THEN
    ALTER TABLE kanban_comments RENAME COLUMN content TO comment;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_kanban_comments_created_at ON kanban_comments(task_id, created_at DESC);

-- Índice full-text para busca
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_search ON kanban_tasks USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_tags ON kanban_tasks USING gin(tags);

-- Trigger para atualizar search_vector
CREATE OR REPLACE FUNCTION update_kanban_task_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('portuguese', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(NEW.description, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS kanban_task_search_vector_update ON kanban_tasks;
CREATE TRIGGER kanban_task_search_vector_update
  BEFORE INSERT OR UPDATE OF title, description ON kanban_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_kanban_task_search_vector();

-- Atualizar search_vector para tasks existentes
UPDATE kanban_tasks
SET search_vector =
  setweight(to_tsvector('portuguese', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('portuguese', coalesce(description, '')), 'B')
WHERE search_vector IS NULL;

-- Trigger para atualizar contador de comentários
CREATE OR REPLACE FUNCTION update_task_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE kanban_tasks
    SET comments_count = comments_count + 1
    WHERE id = NEW.task_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE kanban_tasks
    SET comments_count = GREATEST(comments_count - 1, 0)
    WHERE id = OLD.task_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS kanban_comments_count_trigger ON kanban_comments;
CREATE TRIGGER kanban_comments_count_trigger
  AFTER INSERT OR DELETE ON kanban_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_task_comments_count();

-- Trigger para atualizar contador de anexos
CREATE OR REPLACE FUNCTION update_task_attachments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE kanban_tasks
    SET attachments_count = attachments_count + 1
    WHERE id = NEW.task_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE kanban_tasks
    SET attachments_count = GREATEST(attachments_count - 1, 0)
    WHERE id = OLD.task_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS kanban_attachments_count_trigger ON kanban_attachments;
CREATE TRIGGER kanban_attachments_count_trigger
  AFTER INSERT OR DELETE ON kanban_attachments
  FOR EACH ROW
  EXECUTE FUNCTION update_task_attachments_count();

-- Trigger para registrar movimentação de cards
CREATE OR REPLACE FUNCTION log_kanban_card_movement()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.column_id IS DISTINCT FROM NEW.column_id THEN
    INSERT INTO kanban_history (
      task_id,
      user_id,
      action_type,
      field_changed,
      old_value,
      new_value
    )
    SELECT
      NEW.id,
      NEW.updated_by,
      'moved',
      'column',
      old_col.title,
      new_col.title
    FROM kanban_columns old_col, kanban_columns new_col
    WHERE old_col.id = OLD.column_id
      AND new_col.id = NEW.column_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS kanban_card_movement_trigger ON kanban_tasks;
CREATE TRIGGER kanban_card_movement_trigger
  AFTER UPDATE ON kanban_tasks
  FOR EACH ROW
  WHEN (OLD.column_id IS DISTINCT FROM NEW.column_id)
  EXECUTE FUNCTION log_kanban_card_movement();

-- Trigger para criar notificações quando mencionado em comentário
CREATE OR REPLACE FUNCTION notify_mentioned_users()
RETURNS TRIGGER AS $$
DECLARE
  mentioned_user_id uuid;
  task_title text;
  commenter_name text;
BEGIN
  SELECT title INTO task_title FROM kanban_tasks WHERE id = NEW.task_id;
  SELECT full_name INTO commenter_name FROM user_profiles WHERE id = NEW.user_id;

  FOREACH mentioned_user_id IN ARRAY NEW.mentions
  LOOP
    IF mentioned_user_id != NEW.user_id THEN
      INSERT INTO kanban_notifications (
        user_id,
        task_id,
        notification_type,
        title,
        message,
        triggered_by
      ) VALUES (
        mentioned_user_id,
        NEW.task_id,
        'mention',
        'Você foi mencionado em um comentário',
        commenter_name || ' mencionou você no card "' || task_title || '"',
        NEW.user_id
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notify_mentions_trigger ON kanban_comments;
CREATE TRIGGER notify_mentions_trigger
  AFTER INSERT ON kanban_comments
  FOR EACH ROW
  WHEN (array_length(NEW.mentions, 1) > 0)
  EXECUTE FUNCTION notify_mentioned_users();

-- Função para buscar cards
CREATE OR REPLACE FUNCTION search_kanban_cards(
  p_board_id uuid,
  p_search_query text,
  p_assignee_id uuid DEFAULT NULL,
  p_priority text DEFAULT NULL,
  p_tags text[] DEFAULT NULL,
  p_due_date_from date DEFAULT NULL,
  p_due_date_to date DEFAULT NULL,
  p_limit integer DEFAULT 50
)
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  priority text,
  due_date timestamptz,
  assignee_id uuid,
  tags text[],
  comments_count integer,
  attachments_count integer,
  column_title text,
  rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.title,
    t.description,
    t.priority,
    t.due_date,
    t.assignee_id,
    t.tags,
    t.comments_count,
    t.attachments_count,
    c.title as column_title,
    ts_rank(t.search_vector, plainto_tsquery('portuguese', p_search_query)) as rank
  FROM kanban_tasks t
  INNER JOIN kanban_columns c ON t.column_id = c.id
  WHERE
    t.board_id = p_board_id
    AND (
      p_search_query IS NULL
      OR p_search_query = ''
      OR t.search_vector @@ plainto_tsquery('portuguese', p_search_query)
    )
    AND (p_assignee_id IS NULL OR t.assignee_id = p_assignee_id)
    AND (p_priority IS NULL OR t.priority = p_priority)
    AND (p_tags IS NULL OR t.tags && p_tags)
    AND (p_due_date_from IS NULL OR t.due_date >= p_due_date_from::timestamptz)
    AND (p_due_date_to IS NULL OR t.due_date <= p_due_date_to::timestamptz)
  ORDER BY
    CASE WHEN p_search_query IS NOT NULL AND p_search_query != ''
      THEN rank
      ELSE 0
    END DESC,
    t.position ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy para exclusão de colunas (apenas super_admin)
CREATE POLICY "Only super_admin can delete columns"
  ON kanban_columns FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND user_type = 'super_admin'
    )
  );
