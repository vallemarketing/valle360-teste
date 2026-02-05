/*
  # Criar grupo geral automático e triggers

  1. Criação do Grupo Geral
    - Cria grupo "Valle 360 - Equipe Geral"
    - Tipo: "general"
    - Todos colaboradores são automaticamente adicionados

  2. Funções e Triggers
    - Função para adicionar novos colaboradores ao grupo geral
    - Trigger que executa quando um novo colaborador é criado
    - Adiciona todos colaboradores existentes ao grupo

  3. Segurança
    - Apenas colaboradores (não clientes) são adicionados
    - RLS continua ativo
*/

-- Criar grupo geral se não existir
DO $$
DECLARE
  general_group_id uuid;
BEGIN
  -- Verificar se o grupo já existe
  SELECT id INTO general_group_id
  FROM message_groups
  WHERE type = 'general' AND name = 'Valle 360 - Equipe Geral'
  LIMIT 1;

  -- Se não existir, criar
  IF general_group_id IS NULL THEN
    INSERT INTO message_groups (name, description, type, created_at, updated_at)
    VALUES (
      'Valle 360 - Equipe Geral',
      'Grupo automático com todos os colaboradores da Valle 360',
      'general',
      now(),
      now()
    )
    RETURNING id INTO general_group_id;

    -- Adicionar todos os colaboradores existentes ao grupo
    INSERT INTO group_participants (group_id, user_id, role, is_active, joined_at)
    SELECT
      general_group_id,
      id,
      CASE
        WHEN user_type = 'admin' THEN 'admin'::text
        ELSE 'member'::text
      END,
      true,
      now()
    FROM user_profiles
    WHERE user_type IN ('admin', 'collaborator')
    ON CONFLICT (group_id, user_id) DO NOTHING;
  END IF;
END $$;

-- Função para adicionar novos colaboradores ao grupo geral
CREATE OR REPLACE FUNCTION add_collaborator_to_general_group()
RETURNS TRIGGER AS $$
DECLARE
  general_group_id uuid;
BEGIN
  -- Verificar se é um colaborador (não cliente)
  IF NEW.user_type IN ('admin', 'collaborator') THEN
    -- Buscar o ID do grupo geral
    SELECT id INTO general_group_id
    FROM message_groups
    WHERE type = 'general' AND name = 'Valle 360 - Equipe Geral'
    LIMIT 1;

    -- Se o grupo existir, adicionar o usuário
    IF general_group_id IS NOT NULL THEN
      INSERT INTO group_participants (group_id, user_id, role, is_active, joined_at)
      VALUES (
        general_group_id,
        NEW.id,
        CASE
          WHEN NEW.user_type = 'admin' THEN 'admin'
          ELSE 'member'
        END,
        true,
        now()
      )
      ON CONFLICT (group_id, user_id) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para adicionar automaticamente novos colaboradores
DROP TRIGGER IF EXISTS trigger_add_to_general_group ON user_profiles;

CREATE TRIGGER trigger_add_to_general_group
AFTER INSERT ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION add_collaborator_to_general_group();

-- Comentários
COMMENT ON FUNCTION add_collaborator_to_general_group() IS 'Adiciona automaticamente novos colaboradores ao grupo geral da Valle 360';
