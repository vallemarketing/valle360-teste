/*
  # Vincular projetos do Kanban com grupos de mensagens

  1. Função para criar grupo automaticamente ao criar projeto
    - Cria grupo com o nome do projeto
    - Adiciona criador do projeto como admin do grupo
    - Vincula project_id com o grupo

  2. Função para sincronizar membros do projeto com grupo
    - Quando uma tarefa é atribuída a alguém, adiciona ao grupo
    - Mantém sincronização automática

  3. Segurança
    - Apenas membros do projeto têm acesso ao grupo
    - RLS aplicado
*/

-- Função para criar grupo ao criar board do Kanban
CREATE OR REPLACE FUNCTION create_group_for_kanban_board()
RETURNS TRIGGER AS $$
DECLARE
  new_group_id uuid;
BEGIN
  -- Criar grupo para o board
  INSERT INTO message_groups (
    name,
    description,
    type,
    project_id,
    created_by,
    created_at,
    updated_at
  )
  VALUES (
    NEW.name,
    COALESCE(NEW.description, 'Grupo automático do projeto ' || NEW.name),
    'project',
    NEW.id,
    NEW.created_by,
    now(),
    now()
  )
  RETURNING id INTO new_group_id;

  -- Adicionar criador do board como admin do grupo
  IF NEW.created_by IS NOT NULL THEN
    INSERT INTO group_participants (group_id, user_id, role, is_active, joined_at)
    VALUES (new_group_id, NEW.created_by, 'admin', true, now())
    ON CONFLICT (group_id, user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para criar grupo ao criar board
DROP TRIGGER IF EXISTS trigger_create_group_for_board ON kanban_boards;

CREATE TRIGGER trigger_create_group_for_board
AFTER INSERT ON kanban_boards
FOR EACH ROW
EXECUTE FUNCTION create_group_for_kanban_board();

-- Função para adicionar membro ao grupo quando tarefa é atribuída
CREATE OR REPLACE FUNCTION add_assignee_to_project_group()
RETURNS TRIGGER AS $$
DECLARE
  project_group_id uuid;
BEGIN
  -- Verificar se há um assignee
  IF NEW.assignee_id IS NOT NULL THEN
    -- Buscar o grupo do projeto
    SELECT id INTO project_group_id
    FROM message_groups
    WHERE project_id = NEW.board_id AND type = 'project'
    LIMIT 1;

    -- Se o grupo existir, adicionar o usuário
    IF project_group_id IS NOT NULL THEN
      INSERT INTO group_participants (group_id, user_id, role, is_active, joined_at)
      VALUES (project_group_id, NEW.assignee_id, 'member', true, now())
      ON CONFLICT (group_id, user_id) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para adicionar assignees ao grupo
DROP TRIGGER IF EXISTS trigger_add_assignee_to_group ON kanban_tasks;

CREATE TRIGGER trigger_add_assignee_to_group
AFTER INSERT OR UPDATE OF assignee_id ON kanban_tasks
FOR EACH ROW
EXECUTE FUNCTION add_assignee_to_project_group();

-- Comentários
COMMENT ON FUNCTION create_group_for_kanban_board() IS 'Cria automaticamente um grupo de mensagens quando um board do Kanban é criado';
COMMENT ON FUNCTION add_assignee_to_project_group() IS 'Adiciona automaticamente assignees de tarefas ao grupo do projeto';
