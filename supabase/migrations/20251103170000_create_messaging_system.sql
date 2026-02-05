/*
  # Sistema de Mensagens em Tempo Real

  1. Novas Tabelas
    - `conversations`
      - `id` (uuid, primary key)
      - `conversation_type` (text) - direct, group, client
      - `name` (text) - Nome da conversa/grupo
      - `avatar_url` (text) - Avatar do grupo
      - `client_id` (uuid) - ID do cliente (se for conversa com cliente)
      - `is_active` (boolean) - Se a conversa está ativa
      - `last_message_at` (timestamptz) - Data da última mensagem
      - `last_message_preview` (text) - Preview da última mensagem
      - `metadata` (jsonb) - Metadados extras
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `conversation_participants`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid) - Referência à conversa
      - `user_id` (uuid) - Referência ao usuário
      - `role` (text) - admin, member
      - `is_active` (boolean) - Se o participante está ativo
      - `last_read_at` (timestamptz) - Última vez que leu mensagens
      - `unread_count` (integer) - Quantidade de mensagens não lidas
      - `muted` (boolean) - Se silenciou as notificações
      - `joined_at` (timestamptz)

    - `messages`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid) - Referência à conversa
      - `sender_id` (uuid) - Usuário que enviou
      - `content` (text) - Conteúdo da mensagem
      - `message_type` (text) - text, file, image, video, audio, system
      - `attachments` (jsonb) - Array de anexos
      - `reply_to` (uuid) - ID da mensagem sendo respondida
      - `is_edited` (boolean) - Se foi editada
      - `edited_at` (timestamptz) - Quando foi editada
      - `read_by` (uuid[]) - Array de IDs que leram
      - `metadata` (jsonb) - Metadados extras
      - `created_at` (timestamptz)

    - `message_notifications`
      - `id` (uuid, primary key)
      - `message_id` (uuid) - Referência à mensagem
      - `user_id` (uuid) - Usuário que receberá notificação
      - `conversation_id` (uuid) - Referência à conversa
      - `is_read` (boolean) - Se foi lida
      - `notified_at` (timestamptz) - Quando foi notificado
      - `whatsapp_sent` (boolean) - Se enviou por WhatsApp
      - `whatsapp_sent_at` (timestamptz) - Quando enviou por WhatsApp
      - `created_at` (timestamptz)

  2. Storage Bucket
    - Bucket `message-attachments` para anexos de mensagens

  3. Segurança
    - RLS em todas as tabelas
    - Usuários só veem conversas das quais participam
    - Políticas restritivas de acesso

  4. Triggers
    - Atualizar contador de mensagens não lidas
    - Atualizar preview da última mensagem
    - Criar notificações automaticamente
*/

-- ============================================
-- TABELA DE CONVERSAS
-- ============================================

CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_type text NOT NULL CHECK (conversation_type IN ('direct', 'group', 'client')),
  name text,
  avatar_url text,
  client_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  is_active boolean DEFAULT true,
  last_message_at timestamptz,
  last_message_preview text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(conversation_type);
CREATE INDEX IF NOT EXISTS idx_conversations_client_id ON conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);

-- ============================================
-- TABELA DE PARTICIPANTES
-- ============================================

CREATE TABLE IF NOT EXISTS conversation_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  is_active boolean DEFAULT true,
  last_read_at timestamptz DEFAULT now(),
  unread_count integer DEFAULT 0,
  muted boolean DEFAULT false,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_participants_user ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_unread ON conversation_participants(user_id, unread_count);

-- ============================================
-- TABELA DE MENSAGENS
-- ============================================

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  content text NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image', 'video', 'audio', 'system')),
  attachments jsonb DEFAULT '[]',
  reply_to uuid REFERENCES messages(id) ON DELETE SET NULL,
  is_edited boolean DEFAULT false,
  edited_at timestamptz,
  read_by uuid[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_content_search ON messages USING gin(to_tsvector('portuguese', content));

-- ============================================
-- TABELA DE NOTIFICAÇÕES DE MENSAGENS
-- ============================================

CREATE TABLE IF NOT EXISTS message_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  is_read boolean DEFAULT false,
  notified_at timestamptz DEFAULT now(),
  whatsapp_sent boolean DEFAULT false,
  whatsapp_sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_message_notifications_user ON message_notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_message_notifications_whatsapp ON message_notifications(whatsapp_sent, created_at);

-- ============================================
-- STORAGE BUCKET
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'message-attachments',
  'message-attachments',
  false,
  10485760, -- 10MB
  ARRAY[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'video/mp4', 'video/webm',
    'audio/mpeg', 'audio/wav', 'audio/ogg',
    'application/zip'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_notifications ENABLE ROW LEVEL SECURITY;

-- Políticas para conversations
CREATE POLICY "Usuários veem conversas das quais participam"
  ON conversations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = conversations.id
      AND conversation_participants.user_id = auth.uid()
      AND conversation_participants.is_active = true
    )
  );

CREATE POLICY "Usuários podem criar conversas"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Administradores podem atualizar conversas"
  ON conversations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = conversations.id
      AND conversation_participants.user_id = auth.uid()
      AND conversation_participants.role = 'admin'
    )
  );

-- Políticas para conversation_participants
CREATE POLICY "Usuários veem participantes de suas conversas"
  ON conversation_participants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id
      AND cp.user_id = auth.uid()
      AND cp.is_active = true
    )
  );

CREATE POLICY "Usuários podem adicionar participantes"
  ON conversation_participants FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar sua participação"
  ON conversation_participants FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Políticas para messages
CREATE POLICY "Usuários veem mensagens de suas conversas"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = messages.conversation_id
      AND conversation_participants.user_id = auth.uid()
      AND conversation_participants.is_active = true
    )
  );

CREATE POLICY "Usuários podem enviar mensagens em suas conversas"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = messages.conversation_id
      AND conversation_participants.user_id = auth.uid()
      AND conversation_participants.is_active = true
    )
  );

CREATE POLICY "Usuários podem atualizar suas próprias mensagens"
  ON messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Usuários podem deletar suas próprias mensagens"
  ON messages FOR DELETE
  TO authenticated
  USING (auth.uid() = sender_id);

-- Políticas para message_notifications
CREATE POLICY "Usuários veem suas próprias notificações"
  ON message_notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Sistema pode criar notificações"
  ON message_notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar suas notificações"
  ON message_notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- STORAGE POLICIES
-- ============================================

CREATE POLICY "Usuários autenticados podem ver anexos de mensagens"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'message-attachments');

CREATE POLICY "Usuários autenticados podem fazer upload de anexos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'message-attachments');

CREATE POLICY "Usuários podem deletar seus próprios anexos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'message-attachments' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================
-- TRIGGERS E FUNÇÕES
-- ============================================

-- Função para atualizar timestamp de updated_at
CREATE OR REPLACE FUNCTION update_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_updated_at();

-- Função para atualizar última mensagem da conversa
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET
    last_message_at = NEW.created_at,
    last_message_preview = CASE
      WHEN NEW.message_type = 'text' THEN LEFT(NEW.content, 100)
      WHEN NEW.message_type = 'image' THEN '📷 Imagem'
      WHEN NEW.message_type = 'video' THEN '🎥 Vídeo'
      WHEN NEW.message_type = 'audio' THEN '🎵 Áudio'
      WHEN NEW.message_type = 'file' THEN '📎 Arquivo'
      ELSE 'Mensagem'
    END
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_last_message_on_insert
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- Função para atualizar contador de mensagens não lidas
CREATE OR REPLACE FUNCTION update_unread_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversation_participants
  SET unread_count = unread_count + 1
  WHERE conversation_id = NEW.conversation_id
  AND user_id != NEW.sender_id
  AND is_active = true;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_unread_count
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_unread_count();

-- Função para criar notificações de mensagens
CREATE OR REPLACE FUNCTION create_message_notifications()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO message_notifications (message_id, user_id, conversation_id)
  SELECT
    NEW.id,
    cp.user_id,
    NEW.conversation_id
  FROM conversation_participants cp
  WHERE cp.conversation_id = NEW.conversation_id
  AND cp.user_id != NEW.sender_id
  AND cp.is_active = true
  AND cp.muted = false;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_notifications_on_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION create_message_notifications();

-- Função para marcar mensagens como lidas
CREATE OR REPLACE FUNCTION mark_messages_as_read(
  p_conversation_id uuid,
  p_user_id uuid
)
RETURNS void AS $$
BEGIN
  UPDATE conversation_participants
  SET
    unread_count = 0,
    last_read_at = now()
  WHERE conversation_id = p_conversation_id
  AND user_id = p_user_id;

  UPDATE message_notifications
  SET is_read = true
  WHERE conversation_id = p_conversation_id
  AND user_id = p_user_id
  AND is_read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
