/*
  # Adicionar Sistema de Presença, Digitação e Gestão de Grupos

  1. Novas Tabelas
    - `user_presence` - Status online/offline dos usuários
    - `typing_indicators` - Indicadores de quem está digitando
    - `group_participants` - Participantes e permissões em grupos
    
  2. Melhorias em Tabelas Existentes
    - Adicionar colunas em message_groups
    
  3. Segurança
    - RLS em todas as tabelas novas
    
  4. Funções
    - Gerenciar presença e digitação
    - Criar grupo geral automaticamente
*/

-- ============================================
-- ADICIONAR COLUNAS À TABELA message_groups
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'message_groups' AND column_name = 'last_message_at'
  ) THEN
    ALTER TABLE message_groups ADD COLUMN last_message_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'message_groups' AND column_name = 'last_message_preview'
  ) THEN
    ALTER TABLE message_groups ADD COLUMN last_message_preview text;
  END IF;
END $$;

-- ============================================
-- TABELA DE PARTICIPANTES DE GRUPOS
-- ============================================

CREATE TABLE IF NOT EXISTS group_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES message_groups(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  is_active boolean DEFAULT true,
  can_add_members boolean DEFAULT false,
  can_remove_members boolean DEFAULT false,
  notification_sound text DEFAULT 'default',
  last_read_at timestamptz DEFAULT now(),
  unread_count integer DEFAULT 0,
  muted boolean DEFAULT false,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_participants_group ON group_participants(group_id);
CREATE INDEX IF NOT EXISTS idx_group_participants_user ON group_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_group_participants_unread ON group_participants(user_id, unread_count);

-- ============================================
-- TABELA DE PRESENÇA DE USUÁRIOS
-- ============================================

CREATE TABLE IF NOT EXISTS user_presence (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status text DEFAULT 'offline' CHECK (status IN ('online', 'away', 'offline')),
  last_seen_at timestamptz DEFAULT now(),
  current_group_id uuid REFERENCES message_groups(id) ON DELETE SET NULL,
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_presence_status ON user_presence(status, updated_at);
CREATE INDEX IF NOT EXISTS idx_user_presence_group ON user_presence(current_group_id);

-- ============================================
-- TABELA DE INDICADORES DE DIGITAÇÃO
-- ============================================

CREATE TABLE IF NOT EXISTS typing_indicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES message_groups(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  started_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '5 seconds'),
  UNIQUE(group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_typing_indicators_group ON typing_indicators(group_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_user ON typing_indicators(user_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_expires ON typing_indicators(expires_at);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE group_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem participantes de seus grupos"
  ON group_participants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_participants gp
      WHERE gp.group_id = group_participants.group_id
      AND gp.user_id = auth.uid()
      AND gp.is_active = true
    )
  );

CREATE POLICY "Usuários podem ser adicionados a grupos"
  ON group_participants FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar sua participação"
  ON group_participants FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR can_remove_members = true)
  WITH CHECK (user_id = auth.uid() OR can_remove_members = true);

CREATE POLICY "Admins podem remover participantes"
  ON group_participants FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_participants
      WHERE group_participants.group_id = group_participants.group_id
      AND group_participants.user_id = auth.uid()
      AND group_participants.can_remove_members = true
    )
  );

CREATE POLICY "Usuários podem ver presença de outros"
  ON user_presence FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários podem criar sua presença"
  ON user_presence FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar sua presença"
  ON user_presence FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários veem indicadores em seus grupos"
  ON typing_indicators FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_participants
      WHERE group_participants.group_id = typing_indicators.group_id
      AND group_participants.user_id = auth.uid()
      AND group_participants.is_active = true
    )
  );

CREATE POLICY "Usuários podem criar indicadores"
  ON typing_indicators FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM group_participants
      WHERE group_participants.group_id = typing_indicators.group_id
      AND group_participants.user_id = auth.uid()
      AND group_participants.is_active = true
    )
  );

CREATE POLICY "Usuários podem atualizar seus indicadores"
  ON typing_indicators FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus indicadores"
  ON typing_indicators FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- FUNÇÕES UTILITÁRIAS
-- ============================================

CREATE OR REPLACE FUNCTION update_user_presence(
  p_user_id uuid,
  p_status text,
  p_group_id uuid DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO user_presence (user_id, status, current_group_id, last_seen_at, updated_at)
  VALUES (p_user_id, p_status, p_group_id, now(), now())
  ON CONFLICT (user_id)
  DO UPDATE SET
    status = EXCLUDED.status,
    current_group_id = EXCLUDED.current_group_id,
    last_seen_at = now(),
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION upsert_typing_indicator(
  p_group_id uuid,
  p_user_id uuid
)
RETURNS void AS $$
BEGIN
  INSERT INTO typing_indicators (group_id, user_id, started_at, expires_at)
  VALUES (p_group_id, p_user_id, now(), now() + interval '5 seconds')
  ON CONFLICT (group_id, user_id)
  DO UPDATE SET
    started_at = now(),
    expires_at = now() + interval '5 seconds';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION cleanup_expired_typing_indicators()
RETURNS void AS $$
BEGIN
  DELETE FROM typing_indicators WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_group_admin_permissions()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'admin' THEN
    NEW.can_add_members = true;
    NEW.can_remove_members = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_admin_permissions ON group_participants;
CREATE TRIGGER set_admin_permissions
  BEFORE INSERT OR UPDATE ON group_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_group_admin_permissions();

CREATE OR REPLACE FUNCTION update_group_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE message_groups
  SET
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(NEW.body, 100),
    updated_at = now()
  WHERE id = NEW.group_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_last_message_on_insert ON messages;
CREATE TRIGGER update_last_message_on_insert
  AFTER INSERT ON messages
  FOR EACH ROW
  WHEN (NEW.group_id IS NOT NULL)
  EXECUTE FUNCTION update_group_last_message();

CREATE OR REPLACE FUNCTION update_group_unread_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE group_participants
  SET unread_count = unread_count + 1
  WHERE group_id = NEW.group_id
  AND user_id != NEW.from_user_id
  AND is_active = true;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS increment_group_unread_count ON messages;
CREATE TRIGGER increment_group_unread_count
  AFTER INSERT ON messages
  FOR EACH ROW
  WHEN (NEW.group_id IS NOT NULL)
  EXECUTE FUNCTION update_group_unread_count();

CREATE OR REPLACE FUNCTION mark_group_messages_as_read(
  p_group_id uuid,
  p_user_id uuid
)
RETURNS void AS $$
BEGIN
  UPDATE group_participants
  SET
    unread_count = 0,
    last_read_at = now()
  WHERE group_id = p_group_id
  AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_general_group()
RETURNS uuid AS $$
DECLARE
  v_group_id uuid;
  v_user_record RECORD;
BEGIN
  SELECT id INTO v_group_id
  FROM message_groups
  WHERE type = 'general'
  AND name = 'Equipe Valle 360 - Geral'
  LIMIT 1;

  IF v_group_id IS NOT NULL THEN
    RETURN v_group_id;
  END IF;

  INSERT INTO message_groups (
    name,
    type,
    description,
    is_active
  ) VALUES (
    'Equipe Valle 360 - Geral',
    'general',
    'Grupo geral com todos os colaboradores',
    true
  )
  RETURNING id INTO v_group_id;

  FOR v_user_record IN
    SELECT id FROM auth.users
    WHERE id IN (
      SELECT id FROM user_profiles
      WHERE user_type != 'client'
    )
  LOOP
    INSERT INTO group_participants (
      group_id,
      user_id,
      role,
      is_active
    ) VALUES (
      v_group_id,
      v_user_record.id,
      CASE 
        WHEN EXISTS (
          SELECT 1 FROM user_profiles
          WHERE id = v_user_record.id
          AND user_type = 'super_admin'
        ) THEN 'admin'
        ELSE 'member'
      END,
      true
    )
    ON CONFLICT (group_id, user_id) DO NOTHING;
  END LOOP;

  RETURN v_group_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION add_user_to_general_group()
RETURNS TRIGGER AS $$
DECLARE
  v_general_group_id uuid;
BEGIN
  IF NEW.user_type != 'client' THEN
    SELECT id INTO v_general_group_id
    FROM message_groups
    WHERE type = 'general'
    AND name = 'Equipe Valle 360 - Geral'
    LIMIT 1;

    IF v_general_group_id IS NULL THEN
      v_general_group_id := create_general_group();
    END IF;

    INSERT INTO group_participants (
      group_id,
      user_id,
      role,
      is_active
    ) VALUES (
      v_general_group_id,
      NEW.id,
      CASE WHEN NEW.user_type = 'super_admin' THEN 'admin' ELSE 'member' END,
      true
    )
    ON CONFLICT (group_id, user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_add_to_general_group ON user_profiles;
CREATE TRIGGER auto_add_to_general_group
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION add_user_to_general_group();

SELECT create_general_group();
