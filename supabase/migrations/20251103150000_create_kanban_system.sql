/*
  # Sistema Kanban Completo

  1. Novas Tabelas
    - `kanban_boards`
      - `id` (uuid, primary key)
      - `name` (text) - Nome do quadro
      - `description` (text) - Descrição do quadro
      - `created_by` (uuid) - Usuário que criou
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `kanban_columns`
      - `id` (uuid, primary key)
      - `board_id` (uuid) - Referência ao quadro
      - `title` (text) - Título da coluna
      - `color` (text) - Cor da coluna (hex)
      - `position` (integer) - Ordem da coluna no quadro
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `kanban_tasks`
      - `id` (uuid, primary key)
      - `column_id` (uuid) - Referência à coluna
      - `board_id` (uuid) - Referência ao quadro
      - `title` (text) - Título da tarefa
      - `description` (text) - Descrição detalhada
      - `assignee_id` (uuid) - Usuário responsável
      - `priority` (text) - alta, media, baixa, urgente
      - `tags` (text[]) - Array de tags
      - `position` (integer) - Ordem da tarefa na coluna
      - `comments_count` (integer) - Contador de comentários
      - `attachments_count` (integer) - Contador de anexos
      - `due_date` (timestamptz) - Data de vencimento
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `kanban_comments`
      - `id` (uuid, primary key)
      - `task_id` (uuid) - Referência à tarefa
      - `user_id` (uuid) - Usuário que comentou
      - `content` (text) - Conteúdo do comentário
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Segurança
    - Enable RLS em todas as tabelas
    - Políticas para usuários autenticados
    - Auditoria de alterações

  3. Índices
    - Índices para melhor performance em queries
*/

-- Tabela de quadros Kanban
CREATE TABLE IF NOT EXISTS kanban_boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de colunas do Kanban
CREATE TABLE IF NOT EXISTS kanban_columns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid REFERENCES kanban_boards(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  color text DEFAULT '#6B7280',
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de tarefas do Kanban
CREATE TABLE IF NOT EXISTS kanban_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  column_id uuid REFERENCES kanban_columns(id) ON DELETE CASCADE NOT NULL,
  board_id uuid REFERENCES kanban_boards(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  assignee_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  priority text DEFAULT 'media' CHECK (priority IN ('baixa', 'media', 'alta', 'urgente')),
  tags text[] DEFAULT '{}',
  position integer NOT NULL DEFAULT 0,
  comments_count integer DEFAULT 0,
  attachments_count integer DEFAULT 0,
  due_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de comentários
CREATE TABLE IF NOT EXISTS kanban_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES kanban_tasks(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_kanban_columns_board_id ON kanban_columns(board_id);
CREATE INDEX IF NOT EXISTS idx_kanban_columns_position ON kanban_columns(board_id, position);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_column_id ON kanban_tasks(column_id);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_board_id ON kanban_tasks(board_id);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_position ON kanban_tasks(column_id, position);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_assignee ON kanban_tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_kanban_comments_task_id ON kanban_comments(task_id);

-- Enable Row Level Security
ALTER TABLE kanban_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_comments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para kanban_boards
CREATE POLICY "Usuários autenticados podem ver quadros"
  ON kanban_boards FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar quadros"
  ON kanban_boards FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Criadores podem atualizar seus quadros"
  ON kanban_boards FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Criadores podem deletar seus quadros"
  ON kanban_boards FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Políticas RLS para kanban_columns
CREATE POLICY "Usuários autenticados podem ver colunas"
  ON kanban_columns FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar colunas"
  ON kanban_columns FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar colunas"
  ON kanban_columns FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem deletar colunas"
  ON kanban_columns FOR DELETE
  TO authenticated
  USING (true);

-- Políticas RLS para kanban_tasks
CREATE POLICY "Usuários autenticados podem ver tarefas"
  ON kanban_tasks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar tarefas"
  ON kanban_tasks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar tarefas"
  ON kanban_tasks FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem deletar tarefas"
  ON kanban_tasks FOR DELETE
  TO authenticated
  USING (true);

-- Políticas RLS para kanban_comments
CREATE POLICY "Usuários autenticados podem ver comentários"
  ON kanban_comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar comentários"
  ON kanban_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Criadores podem atualizar seus comentários"
  ON kanban_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Criadores podem deletar seus comentários"
  ON kanban_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
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

CREATE TRIGGER update_kanban_comments_updated_at
  BEFORE UPDATE ON kanban_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Função para atualizar contador de comentários
CREATE OR REPLACE FUNCTION update_task_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE kanban_tasks
    SET comments_count = comments_count + 1
    WHERE id = NEW.task_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE kanban_tasks
    SET comments_count = GREATEST(0, comments_count - 1)
    WHERE id = OLD.task_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para contador de comentários
CREATE TRIGGER update_comments_count_on_insert
  AFTER INSERT ON kanban_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_task_comments_count();

CREATE TRIGGER update_comments_count_on_delete
  AFTER DELETE ON kanban_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_task_comments_count();

-- Inserir quadro padrão
INSERT INTO kanban_boards (name, description)
VALUES ('Quadro Principal', 'Quadro padrão para gestão de tarefas')
ON CONFLICT DO NOTHING;

-- Inserir colunas padrão
DO $$
DECLARE
  v_board_id uuid;
BEGIN
  SELECT id INTO v_board_id FROM kanban_boards WHERE name = 'Quadro Principal' LIMIT 1;

  IF v_board_id IS NOT NULL THEN
    INSERT INTO kanban_columns (board_id, title, color, position) VALUES
      (v_board_id, 'Backlog', '#6B7280', 0),
      (v_board_id, 'Em Produção', '#3B82F6', 1),
      (v_board_id, 'Aguardando Aprovação', '#F59E0B', 2),
      (v_board_id, 'Concluído', '#10B981', 3)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
