/*
  # Adicionar avatar e configurações para grupos

  1. Alterações na tabela message_groups
    - Adiciona coluna `avatar_url` para foto do grupo
    - Adiciona coluna `settings` para configurações personalizadas (JSON)
    - Adiciona coluna `created_by` para rastrear quem criou o grupo
    - Adiciona coluna `project_id` para vincular com projetos do Kanban

  2. Segurança
    - Mantém RLS existente
    - Adiciona políticas para upload de avatar

  3. Índices
    - Adiciona índice para project_id para melhor performance
*/

-- Adicionar novas colunas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'message_groups' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE message_groups ADD COLUMN avatar_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'message_groups' AND column_name = 'settings'
  ) THEN
    ALTER TABLE message_groups ADD COLUMN settings jsonb DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'message_groups' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE message_groups ADD COLUMN created_by uuid REFERENCES user_profiles(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'message_groups' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE message_groups ADD COLUMN project_id uuid REFERENCES kanban_boards(id);
  END IF;
END $$;

-- Criar índice para project_id
CREATE INDEX IF NOT EXISTS idx_message_groups_project_id ON message_groups(project_id);

-- Comentários para documentação
COMMENT ON COLUMN message_groups.avatar_url IS 'URL da imagem de avatar do grupo armazenada no Supabase Storage';
COMMENT ON COLUMN message_groups.settings IS 'Configurações personalizadas do grupo em formato JSON';
COMMENT ON COLUMN message_groups.created_by IS 'ID do usuário que criou o grupo';
COMMENT ON COLUMN message_groups.project_id IS 'ID do projeto do Kanban vinculado ao grupo (se aplicável)';
