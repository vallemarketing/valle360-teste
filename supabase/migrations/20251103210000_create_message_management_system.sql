/*
  # Sistema de Gerenciamento Avançado de Mensagens

  1. Novas Colunas
    - Adicionar campos para edição, exclusão e encaminhamento
    - Adicionar campos para reply (citação)
    - Adicionar campos para localização
    - Adicionar campos para mensagens agendadas

  2. Novas Tabelas
    - `message_edits` - Histórico de edições
    - `message_forwards` - Rastreamento de encaminhamentos
    - `scheduled_messages` - Mensagens agendadas
    - `message_deletions` - Log de exclusões

  3. Funções
    - Funções para editar mensagens
    - Funções para excluir mensagens
    - Funções para encaminhar mensagens
    - Função para processar mensagens agendadas

  4. Segurança
    - RLS habilitado em todas as tabelas
    - Usuários só podem editar/excluir próprias mensagens
    - Controle de tempo para edição (15 minutos)
*/

-- Adicionar colunas para mensagens de grupo
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS is_edited boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS edited_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES user_profiles(id),
  ADD COLUMN IF NOT EXISTS deletion_type text CHECK (deletion_type IN ('for_me', 'for_everyone')),
  ADD COLUMN IF NOT EXISTS is_forwarded boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS forwarded_from_id uuid,
  ADD COLUMN IF NOT EXISTS reply_to_message_id uuid REFERENCES messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS location_lat decimal(10, 8),
  ADD COLUMN IF NOT EXISTS location_lng decimal(11, 8),
  ADD COLUMN IF NOT EXISTS location_name text,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Adicionar colunas para mensagens diretas
ALTER TABLE direct_messages
  ADD COLUMN IF NOT EXISTS is_edited boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS edited_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES user_profiles(id),
  ADD COLUMN IF NOT EXISTS deletion_type text CHECK (deletion_type IN ('for_me', 'for_everyone')),
  ADD COLUMN IF NOT EXISTS is_forwarded boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS forwarded_from_id uuid,
  ADD COLUMN IF NOT EXISTS reply_to_message_id uuid REFERENCES direct_messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS location_lat decimal(10, 8),
  ADD COLUMN IF NOT EXISTS location_lng decimal(11, 8),
  ADD COLUMN IF NOT EXISTS location_name text,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Tabela de histórico de edições
CREATE TABLE IF NOT EXISTS message_edits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL,
  message_type text NOT NULL CHECK (message_type IN ('group', 'direct')),
  previous_body text NOT NULL,
  new_body text NOT NULL,
  edited_by uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  edited_at timestamptz DEFAULT now()
);

-- Tabela de encaminhamentos
CREATE TABLE IF NOT EXISTS message_forwards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_message_id uuid NOT NULL,
  original_message_type text NOT NULL CHECK (original_message_type IN ('group', 'direct')),
  new_message_id uuid NOT NULL,
  new_message_type text NOT NULL CHECK (new_message_type IN ('group', 'direct')),
  forwarded_by uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  forwarded_to_group_id uuid,
  forwarded_to_conversation_id uuid,
  forwarded_at timestamptz DEFAULT now()
);

-- Tabela de mensagens agendadas
CREATE TABLE IF NOT EXISTS scheduled_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  destination_type text NOT NULL CHECK (destination_type IN ('group', 'direct')),
  destination_id uuid NOT NULL,
  body text NOT NULL,
  scheduled_for timestamptz NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled', 'failed')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  sent_at timestamptz,
  error_message text
);

-- Tabela de log de exclusões
CREATE TABLE IF NOT EXISTS message_deletions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL,
  message_type text NOT NULL CHECK (message_type IN ('group', 'direct')),
  deleted_by uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  deletion_type text NOT NULL CHECK (deletion_type IN ('for_me', 'for_everyone')),
  deleted_at timestamptz DEFAULT now(),
  original_body text
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_messages_reply_to
  ON messages(reply_to_message_id) WHERE reply_to_message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_direct_messages_reply_to
  ON direct_messages(reply_to_message_id) WHERE reply_to_message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_messages_location
  ON messages(location_lat, location_lng) WHERE location_lat IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_scheduled_messages_pending
  ON scheduled_messages(scheduled_for, status) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_message_edits_message
  ON message_edits(message_id, message_type);

-- Função para editar mensagem
CREATE OR REPLACE FUNCTION edit_message(
  p_message_id uuid,
  p_message_type text,
  p_new_body text,
  p_user_id uuid
)
RETURNS boolean AS $$
DECLARE
  v_old_body text;
  v_from_user_id uuid;
  v_created_at timestamptz;
  v_time_limit interval := interval '15 minutes';
BEGIN
  IF p_message_type = 'group' THEN
    SELECT body, from_user_id, created_at
    INTO v_old_body, v_from_user_id, v_created_at
    FROM messages
    WHERE id = p_message_id;
  ELSE
    SELECT body, from_user_id, created_at
    INTO v_old_body, v_from_user_id, v_created_at
    FROM direct_messages
    WHERE id = p_message_id;
  END IF;

  IF v_from_user_id != p_user_id THEN
    RAISE EXCEPTION 'Você só pode editar suas próprias mensagens';
  END IF;

  IF NOW() - v_created_at > v_time_limit THEN
    RAISE EXCEPTION 'Tempo limite para edição excedido (15 minutos)';
  END IF;

  INSERT INTO message_edits (message_id, message_type, previous_body, new_body, edited_by)
  VALUES (p_message_id, p_message_type, v_old_body, p_new_body, p_user_id);

  IF p_message_type = 'group' THEN
    UPDATE messages
    SET body = p_new_body,
        is_edited = true,
        edited_at = NOW()
    WHERE id = p_message_id;
  ELSE
    UPDATE direct_messages
    SET body = p_new_body,
        is_edited = true,
        edited_at = NOW()
    WHERE id = p_message_id;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para excluir mensagem
CREATE OR REPLACE FUNCTION delete_message(
  p_message_id uuid,
  p_message_type text,
  p_user_id uuid,
  p_deletion_type text
)
RETURNS boolean AS $$
DECLARE
  v_from_user_id uuid;
  v_body text;
BEGIN
  IF p_message_type = 'group' THEN
    SELECT from_user_id, body
    INTO v_from_user_id, v_body
    FROM messages
    WHERE id = p_message_id;
  ELSE
    SELECT from_user_id, body
    INTO v_from_user_id, v_body
    FROM direct_messages
    WHERE id = p_message_id;
  END IF;

  IF p_deletion_type = 'for_everyone' AND v_from_user_id != p_user_id THEN
    RAISE EXCEPTION 'Você só pode excluir suas próprias mensagens para todos';
  END IF;

  INSERT INTO message_deletions (message_id, message_type, deleted_by, deletion_type, original_body)
  VALUES (p_message_id, p_message_type, p_user_id, p_deletion_type, v_body);

  IF p_deletion_type = 'for_everyone' THEN
    IF p_message_type = 'group' THEN
      UPDATE messages
      SET is_deleted = true,
          deleted_at = NOW(),
          deleted_by = p_user_id,
          deletion_type = p_deletion_type,
          body = 'Esta mensagem foi excluída'
      WHERE id = p_message_id;
    ELSE
      UPDATE direct_messages
      SET is_deleted = true,
          deleted_at = NOW(),
          deleted_by = p_user_id,
          deletion_type = p_deletion_type,
          body = 'Esta mensagem foi excluída'
      WHERE id = p_message_id;
    END IF;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para processar mensagens agendadas
CREATE OR REPLACE FUNCTION process_scheduled_messages()
RETURNS void AS $$
DECLARE
  v_scheduled scheduled_messages%ROWTYPE;
BEGIN
  FOR v_scheduled IN
    SELECT * FROM scheduled_messages
    WHERE status = 'pending'
      AND scheduled_for <= NOW()
    LIMIT 100
  LOOP
    BEGIN
      IF v_scheduled.destination_type = 'group' THEN
        INSERT INTO messages (group_id, from_user_id, body, type, metadata)
        VALUES (
          v_scheduled.destination_id,
          v_scheduled.user_id,
          v_scheduled.body,
          'text',
          v_scheduled.metadata
        );
      ELSE
        INSERT INTO direct_messages (conversation_id, from_user_id, body, message_type, metadata)
        VALUES (
          v_scheduled.destination_id,
          v_scheduled.user_id,
          v_scheduled.body,
          'text',
          v_scheduled.metadata
        );
      END IF;

      UPDATE scheduled_messages
      SET status = 'sent',
          sent_at = NOW()
      WHERE id = v_scheduled.id;

    EXCEPTION WHEN OTHERS THEN
      UPDATE scheduled_messages
      SET status = 'failed',
          error_message = SQLERRM
      WHERE id = v_scheduled.id;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies

ALTER TABLE message_edits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view edits in their conversations"
  ON message_edits FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_participants gp
      INNER JOIN messages m ON m.group_id = gp.group_id
      WHERE m.id = message_edits.message_id
        AND message_edits.message_type = 'group'
        AND gp.user_id = auth.uid()
        AND gp.is_active = true
    )
    OR
    EXISTS (
      SELECT 1 FROM direct_conversation_participants dcp
      INNER JOIN direct_messages dm ON dm.conversation_id = dcp.conversation_id
      WHERE dm.id = message_edits.message_id
        AND message_edits.message_type = 'direct'
        AND dcp.user_id = auth.uid()
        AND dcp.is_active = true
    )
  );

ALTER TABLE message_forwards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view forwards they created"
  ON message_forwards FOR SELECT
  TO authenticated
  USING (forwarded_by = auth.uid());

CREATE POLICY "Users can create forwards"
  ON message_forwards FOR INSERT
  TO authenticated
  WITH CHECK (forwarded_by = auth.uid());

ALTER TABLE scheduled_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scheduled messages"
  ON scheduled_messages FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create scheduled messages"
  ON scheduled_messages FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own scheduled messages"
  ON scheduled_messages FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own scheduled messages"
  ON scheduled_messages FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

ALTER TABLE message_deletions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own deletions"
  ON message_deletions FOR SELECT
  TO authenticated
  USING (deleted_by = auth.uid());
