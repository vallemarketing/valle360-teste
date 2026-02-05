/*
  # Adicionar Conversas Diretas e Sistema de Marcação de Leitura

  1. Novas Tabelas
    - `direct_conversations` - Conversas 1-1 entre usuários
    - `direct_conversation_participants` - Participantes das conversas diretas
    - `direct_messages` - Mensagens das conversas diretas
    - `message_read_receipts` - Recibos de leitura para mensagens diretas

  2. Melhorias em Tabelas Existentes
    - Adicionar read_by em messages (grupos)
    - Adicionar is_client em direct_conversations

  3. Segurança
    - RLS em todas as novas tabelas
    - Políticas para conversas com clientes

  4. Funções
    - Criar conversa direta automaticamente
    - Marcar mensagens como lidas
    - Verificar se mensagem foi lida
*/

-- ============================================
-- TABELA DE CONVERSAS DIRETAS
-- ============================================

CREATE TABLE IF NOT EXISTS direct_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_client_conversation boolean DEFAULT false,
  last_message_at timestamptz,
  last_message_preview text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_direct_conversations_client ON direct_conversations(is_client_conversation);
CREATE INDEX IF NOT EXISTS idx_direct_conversations_last_message ON direct_conversations(last_message_at DESC);

-- ============================================
-- TABELA DE PARTICIPANTES DE CONVERSAS DIRETAS
-- ============================================

CREATE TABLE IF NOT EXISTS direct_conversation_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES direct_conversations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  last_read_at timestamptz DEFAULT now(),
  unread_count integer DEFAULT 0,
  muted boolean DEFAULT false,
  is_active boolean DEFAULT true,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_direct_participants_conversation ON direct_conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_direct_participants_user ON direct_conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_direct_participants_unread ON direct_conversation_participants(user_id, unread_count);

-- ============================================
-- TABELA DE MENSAGENS DIRETAS
-- ============================================

CREATE TABLE IF NOT EXISTS direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES direct_conversations(id) ON DELETE CASCADE NOT NULL,
  from_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  body text NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image', 'video', 'audio')),
  attachments jsonb DEFAULT '[]',
  is_edited boolean DEFAULT false,
  edited_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation ON direct_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender ON direct_messages(from_user_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created ON direct_messages(created_at DESC);

-- ============================================
-- TABELA DE RECIBOS DE LEITURA
-- ============================================

CREATE TABLE IF NOT EXISTS message_read_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL,
  message_type text NOT NULL CHECK (message_type IN ('direct', 'group')),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  read_at timestamptz DEFAULT now(),
  UNIQUE(message_id, user_id, message_type)
);

CREATE INDEX IF NOT EXISTS idx_read_receipts_message ON message_read_receipts(message_id, message_type);
CREATE INDEX IF NOT EXISTS idx_read_receipts_user ON message_read_receipts(user_id);

-- ============================================
-- ADICIONAR COLUNAS ÀS TABELAS EXISTENTES
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'read_by'
  ) THEN
    ALTER TABLE messages ADD COLUMN read_by uuid[] DEFAULT '{}';
  END IF;
END $$;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE direct_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_read_receipts ENABLE ROW LEVEL SECURITY;

-- Políticas para direct_conversations
CREATE POLICY "Usuários veem suas conversas diretas"
  ON direct_conversations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM direct_conversation_participants
      WHERE direct_conversation_participants.conversation_id = direct_conversations.id
      AND direct_conversation_participants.user_id = auth.uid()
      AND direct_conversation_participants.is_active = true
    )
  );

CREATE POLICY "Usuários podem criar conversas diretas"
  ON direct_conversations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar suas conversas"
  ON direct_conversations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM direct_conversation_participants
      WHERE direct_conversation_participants.conversation_id = direct_conversations.id
      AND direct_conversation_participants.user_id = auth.uid()
    )
  );

-- Políticas para direct_conversation_participants
CREATE POLICY "Usuários veem participantes de suas conversas"
  ON direct_conversation_participants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM direct_conversation_participants dcp
      WHERE dcp.conversation_id = direct_conversation_participants.conversation_id
      AND dcp.user_id = auth.uid()
      AND dcp.is_active = true
    )
  );

CREATE POLICY "Usuários podem ser adicionados a conversas"
  ON direct_conversation_participants FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar sua participação"
  ON direct_conversation_participants FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Políticas para direct_messages
CREATE POLICY "Usuários veem mensagens de suas conversas"
  ON direct_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM direct_conversation_participants
      WHERE direct_conversation_participants.conversation_id = direct_messages.conversation_id
      AND direct_conversation_participants.user_id = auth.uid()
      AND direct_conversation_participants.is_active = true
    )
  );

CREATE POLICY "Usuários podem enviar mensagens diretas"
  ON direct_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = from_user_id AND
    EXISTS (
      SELECT 1 FROM direct_conversation_participants
      WHERE direct_conversation_participants.conversation_id = direct_messages.conversation_id
      AND direct_conversation_participants.user_id = auth.uid()
      AND direct_conversation_participants.is_active = true
    )
  );

CREATE POLICY "Usuários podem atualizar suas mensagens"
  ON direct_messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = from_user_id)
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Usuários podem deletar suas mensagens"
  ON direct_messages FOR DELETE
  TO authenticated
  USING (auth.uid() = from_user_id);

-- Políticas para message_read_receipts
CREATE POLICY "Usuários veem recibos de suas mensagens"
  ON message_read_receipts FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM direct_messages
      WHERE direct_messages.id = message_read_receipts.message_id
      AND direct_messages.from_user_id = auth.uid()
      AND message_read_receipts.message_type = 'direct'
    ) OR
    EXISTS (
      SELECT 1 FROM messages
      WHERE messages.id = message_read_receipts.message_id
      AND messages.from_user_id = auth.uid()
      AND message_read_receipts.message_type = 'group'
    )
  );

CREATE POLICY "Usuários podem criar recibos de leitura"
  ON message_read_receipts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- FUNÇÕES UTILITÁRIAS
-- ============================================

-- Função para criar ou obter conversa direta
CREATE OR REPLACE FUNCTION get_or_create_direct_conversation(
  p_user_id_1 uuid,
  p_user_id_2 uuid,
  p_is_client_conversation boolean DEFAULT false
)
RETURNS uuid AS $$
DECLARE
  v_conversation_id uuid;
  v_user_type text;
BEGIN
  -- Verifica se já existe uma conversa entre os dois usuários
  SELECT dcp1.conversation_id INTO v_conversation_id
  FROM direct_conversation_participants dcp1
  INNER JOIN direct_conversation_participants dcp2
    ON dcp1.conversation_id = dcp2.conversation_id
  WHERE dcp1.user_id = p_user_id_1
    AND dcp2.user_id = p_user_id_2
    AND dcp1.is_active = true
    AND dcp2.is_active = true
  LIMIT 1;

  IF v_conversation_id IS NOT NULL THEN
    RETURN v_conversation_id;
  END IF;

  -- Verifica se algum dos usuários é cliente
  SELECT user_type INTO v_user_type
  FROM user_profiles
  WHERE id = p_user_id_2
  LIMIT 1;

  -- Cria nova conversa
  INSERT INTO direct_conversations (is_client_conversation)
  VALUES (v_user_type = 'client' OR p_is_client_conversation)
  RETURNING id INTO v_conversation_id;

  -- Adiciona os participantes
  INSERT INTO direct_conversation_participants (conversation_id, user_id, is_active)
  VALUES 
    (v_conversation_id, p_user_id_1, true),
    (v_conversation_id, p_user_id_2, true);

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para atualizar última mensagem da conversa direta
CREATE OR REPLACE FUNCTION update_direct_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE direct_conversations
  SET
    last_message_at = NEW.created_at,
    last_message_preview = CASE
      WHEN NEW.message_type = 'text' THEN LEFT(NEW.body, 100)
      WHEN NEW.message_type = 'image' THEN '📷 Imagem'
      WHEN NEW.message_type = 'video' THEN '🎥 Vídeo'
      WHEN NEW.message_type = 'audio' THEN '🎵 Áudio'
      WHEN NEW.message_type = 'file' THEN '📎 Arquivo'
      ELSE 'Mensagem'
    END,
    updated_at = now()
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_direct_last_message ON direct_messages;
CREATE TRIGGER update_direct_last_message
  AFTER INSERT ON direct_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_direct_conversation_last_message();

-- Função para atualizar contador de mensagens não lidas em conversas diretas
CREATE OR REPLACE FUNCTION update_direct_unread_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE direct_conversation_participants
  SET unread_count = unread_count + 1
  WHERE conversation_id = NEW.conversation_id
  AND user_id != NEW.from_user_id
  AND is_active = true;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS increment_direct_unread_count ON direct_messages;
CREATE TRIGGER increment_direct_unread_count
  AFTER INSERT ON direct_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_direct_unread_count();

-- Função para marcar mensagens diretas como lidas
CREATE OR REPLACE FUNCTION mark_direct_messages_as_read(
  p_conversation_id uuid,
  p_user_id uuid
)
RETURNS void AS $$
BEGIN
  -- Atualiza contador de não lidas
  UPDATE direct_conversation_participants
  SET
    unread_count = 0,
    last_read_at = now()
  WHERE conversation_id = p_conversation_id
  AND user_id = p_user_id;

  -- Cria recibos de leitura para mensagens não lidas
  INSERT INTO message_read_receipts (message_id, message_type, user_id, read_at)
  SELECT 
    dm.id,
    'direct',
    p_user_id,
    now()
  FROM direct_messages dm
  WHERE dm.conversation_id = p_conversation_id
  AND dm.from_user_id != p_user_id
  AND NOT EXISTS (
    SELECT 1 FROM message_read_receipts mrr
    WHERE mrr.message_id = dm.id
    AND mrr.message_type = 'direct'
    AND mrr.user_id = p_user_id
  )
  ON CONFLICT (message_id, user_id, message_type) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para adicionar recibo de leitura em mensagem de grupo
CREATE OR REPLACE FUNCTION add_group_message_read_receipt(
  p_message_id uuid,
  p_user_id uuid
)
RETURNS void AS $$
BEGIN
  INSERT INTO message_read_receipts (message_id, message_type, user_id, read_at)
  VALUES (p_message_id, 'group', p_user_id, now())
  ON CONFLICT (message_id, user_id, message_type) DO NOTHING;

  -- Atualiza array read_by na mensagem
  UPDATE messages
  SET read_by = array_append(read_by, p_user_id)
  WHERE id = p_message_id
  AND NOT (p_user_id = ANY(read_by));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se mensagem foi lida
CREATE OR REPLACE FUNCTION is_message_read_by(
  p_message_id uuid,
  p_message_type text,
  p_user_id uuid
)
RETURNS boolean AS $$
DECLARE
  v_is_read boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM message_read_receipts
    WHERE message_id = p_message_id
    AND message_type = p_message_type
    AND user_id = p_user_id
  ) INTO v_is_read;

  RETURN v_is_read;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
