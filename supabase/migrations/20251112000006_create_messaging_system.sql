-- =====================================================
-- MIGRATION: Sistema de Mensagens e Comunicação
-- Descrição: Grupos, conversas diretas, mensagens e presença em tempo real
-- Dependências: 20251112000002_create_clients_system.sql
-- =====================================================

-- =====================================================
-- 1. TABELA: message_groups
-- Grupos de mensagens (canais/grupos de trabalho)
-- =====================================================

CREATE TABLE IF NOT EXISTS message_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Informações básicas
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Tipo de grupo
  group_type VARCHAR(30) DEFAULT 'team' CHECK (group_type IN ('team', 'project', 'client', 'general', 'announcement')),
  
  -- Avatar do grupo
  avatar_url TEXT,
  
  -- Configurações
  is_private BOOLEAN DEFAULT false,
  allow_external_members BOOLEAN DEFAULT false,
  
  -- Projeto relacionado (opcional)
  project_id UUID REFERENCES kanban_boards(id) ON DELETE SET NULL,
  
  -- Cliente relacionado (opcional)
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  
  -- Criação
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_archived BOOLEAN DEFAULT false,
  
  -- Mensagens fixadas
  pinned_message_ids JSONB DEFAULT '[]'::jsonb,
  
  -- Configurações adicionais
  settings JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  last_message_at TIMESTAMP WITH TIME ZONE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_message_groups_type ON message_groups(group_type);
CREATE INDEX IF NOT EXISTS idx_message_groups_project_id ON message_groups(project_id);
CREATE INDEX IF NOT EXISTS idx_message_groups_client_id ON message_groups(client_id);
CREATE INDEX IF NOT EXISTS idx_message_groups_active ON message_groups(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_message_groups_last_message ON message_groups(last_message_at DESC NULLS LAST);

COMMENT ON TABLE message_groups IS 'Grupos de mensagens para comunicação em equipe';

-- =====================================================
-- 2. TABELA: message_group_members
-- Membros dos grupos de mensagens
-- =====================================================

CREATE TABLE IF NOT EXISTS message_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES message_groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Role no grupo
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_muted BOOLEAN DEFAULT false,
  
  -- Leitura
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  unread_count INTEGER DEFAULT 0,
  
  -- Notificações
  notifications_enabled BOOLEAN DEFAULT true,
  
  -- Timestamps
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  left_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(group_id, user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_message_group_members_group_id ON message_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_message_group_members_user_id ON message_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_message_group_members_active ON message_group_members(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_message_group_members_unread ON message_group_members(user_id, unread_count) WHERE unread_count > 0;

COMMENT ON TABLE message_group_members IS 'Membros participantes dos grupos de mensagens';

-- =====================================================
-- 3. TABELA: direct_conversations
-- Conversas diretas entre dois usuários (DM)
-- =====================================================

CREATE TABLE IF NOT EXISTS direct_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Participantes (sempre 2)
  user1_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  user2_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Indicação se é conversa com cliente
  is_client_conversation BOOLEAN DEFAULT false,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Última mensagem
  last_message_at TIMESTAMP WITH TIME ZONE,
  last_message_preview TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id < user2_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_direct_conversations_user1 ON direct_conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_direct_conversations_user2 ON direct_conversations(user2_id);
CREATE INDEX IF NOT EXISTS idx_direct_conversations_client ON direct_conversations(is_client_conversation) WHERE is_client_conversation = true;
CREATE INDEX IF NOT EXISTS idx_direct_conversations_last_message ON direct_conversations(last_message_at DESC NULLS LAST);

COMMENT ON TABLE direct_conversations IS 'Conversas diretas (DM) entre dois usuários';

-- =====================================================
-- 4. TABELA: direct_conversation_status
-- Status de leitura individual em conversas diretas
-- =====================================================

CREATE TABLE IF NOT EXISTS direct_conversation_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES direct_conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Leitura
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  unread_count INTEGER DEFAULT 0,
  
  -- Notificações
  is_muted BOOLEAN DEFAULT false,
  
  -- Timestamps
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  UNIQUE(conversation_id, user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_direct_conversation_status_conversation_id ON direct_conversation_status(conversation_id);
CREATE INDEX IF NOT EXISTS idx_direct_conversation_status_user_id ON direct_conversation_status(user_id);
CREATE INDEX IF NOT EXISTS idx_direct_conversation_status_unread ON direct_conversation_status(user_id, unread_count) WHERE unread_count > 0;

COMMENT ON TABLE direct_conversation_status IS 'Status de leitura e notificações por usuário em conversas diretas';

-- =====================================================
-- 5. TABELA: messages
-- Mensagens (grupos e diretas)
-- =====================================================

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relacionamento (grupo ou conversa direta)
  group_id UUID REFERENCES message_groups(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES direct_conversations(id) ON DELETE CASCADE,
  
  -- Remetente
  sender_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL NOT NULL,
  
  -- Conteúdo
  content TEXT NOT NULL,
  
  -- Tipo de mensagem
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image', 'video', 'audio', 'system', 'location', 'contact')),
  
  -- Anexos
  attachments JSONB DEFAULT '[]'::jsonb,
  
  -- Resposta a outra mensagem
  reply_to UUID REFERENCES messages(id) ON DELETE SET NULL,
  
  -- Edição
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMP WITH TIME ZONE,
  
  -- Exclusão
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- Leitura (para mensagens diretas - array de user_ids)
  read_by JSONB DEFAULT '[]'::jsonb,
  
  -- Reações
  reactions JSONB DEFAULT '{}'::jsonb,
  
  -- Mensagem fixada
  is_pinned BOOLEAN DEFAULT false,
  pinned_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  pinned_at TIMESTAMP WITH TIME ZONE,
  
  -- Agendamento
  is_scheduled BOOLEAN DEFAULT false,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  CHECK (
    (group_id IS NOT NULL AND conversation_id IS NULL) OR 
    (group_id IS NULL AND conversation_id IS NOT NULL)
  )
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_messages_group_id ON messages(group_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON messages(reply_to);
CREATE INDEX IF NOT EXISTS idx_messages_scheduled ON messages(is_scheduled, scheduled_for) WHERE is_scheduled = true;
CREATE INDEX IF NOT EXISTS idx_messages_deleted ON messages(is_deleted) WHERE is_deleted = false;

COMMENT ON TABLE messages IS 'Mensagens de grupos e conversas diretas';

-- =====================================================
-- 6. TABELA: message_reactions
-- Reações às mensagens
-- =====================================================

CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Emoji da reação
  emoji VARCHAR(10) NOT NULL,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  UNIQUE(message_id, user_id, emoji)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON message_reactions(user_id);

COMMENT ON TABLE message_reactions IS 'Reações (emojis) às mensagens';

-- =====================================================
-- 7. TABELA: user_presence
-- Status de presença online dos usuários
-- =====================================================

CREATE TABLE IF NOT EXISTS user_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Status
  status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'away', 'busy', 'offline')),
  
  -- Indicador "digitando"
  is_typing_in_group UUID REFERENCES message_groups(id) ON DELETE SET NULL,
  is_typing_in_conversation UUID REFERENCES direct_conversations(id) ON DELETE SET NULL,
  
  -- Timestamps
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_presence_user_id ON user_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_status ON user_presence(status);
CREATE INDEX IF NOT EXISTS idx_user_presence_typing_group ON user_presence(is_typing_in_group) WHERE is_typing_in_group IS NOT NULL;

COMMENT ON TABLE user_presence IS 'Status de presença online e atividade dos usuários em tempo real';

-- =====================================================
-- 8. TABELA: message_notifications
-- Notificações de mensagens não lidas
-- =====================================================

CREATE TABLE IF NOT EXISTS message_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  
  -- Entrega
  is_delivered BOOLEAN DEFAULT false,
  delivered_at TIMESTAMP WITH TIME ZONE,
  
  -- Leitura
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  UNIQUE(user_id, message_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_message_notifications_user_id ON message_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_message_notifications_message_id ON message_notifications(message_id);
CREATE INDEX IF NOT EXISTS idx_message_notifications_unread ON message_notifications(user_id, is_read) WHERE is_read = false;

COMMENT ON TABLE message_notifications IS 'Notificações individuais de mensagens não lidas';

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER update_message_groups_updated_at
  BEFORE UPDATE ON message_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_direct_conversations_updated_at
  BEFORE UPDATE ON direct_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_presence_updated_at
  BEFORE UPDATE ON user_presence
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION: Atualizar last_message_at do grupo
-- =====================================================

CREATE OR REPLACE FUNCTION update_group_last_message()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.group_id IS NOT NULL THEN
    UPDATE message_groups
    SET last_message_at = NEW.created_at
    WHERE id = NEW.group_id;
  END IF;
  
  IF NEW.conversation_id IS NOT NULL THEN
    UPDATE direct_conversations
    SET last_message_at = NEW.created_at,
        last_message_preview = LEFT(NEW.content, 100)
    WHERE id = NEW.conversation_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar last_message_at
CREATE TRIGGER update_last_message_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_group_last_message();

-- =====================================================
-- FUNCTION: Incrementar unread_count
-- =====================================================

CREATE OR REPLACE FUNCTION increment_unread_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Para mensagens em grupos
  IF NEW.group_id IS NOT NULL THEN
    UPDATE message_group_members
    SET unread_count = unread_count + 1
    WHERE group_id = NEW.group_id
    AND user_id != NEW.sender_id
    AND is_active = true;
  END IF;
  
  -- Para mensagens diretas
  IF NEW.conversation_id IS NOT NULL THEN
    UPDATE direct_conversation_status dcs
    SET unread_count = unread_count + 1
    WHERE dcs.conversation_id = NEW.conversation_id
    AND dcs.user_id != NEW.sender_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para incrementar contador
CREATE TRIGGER increment_unread_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION increment_unread_count();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE message_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_conversation_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_notifications ENABLE ROW LEVEL SECURITY;

-- ===== POLÍTICAS: message_groups =====

-- Membros veem seus grupos
CREATE POLICY "Membros veem seus grupos"
  ON message_groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM message_group_members
      WHERE message_group_members.group_id = message_groups.id
      AND message_group_members.user_id = auth.uid()
      AND message_group_members.is_active = true
    )
  );

-- Admins de grupo podem atualizar
CREATE POLICY "Admins gerenciam grupos"
  ON message_groups FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM message_group_members
      WHERE message_group_members.group_id = message_groups.id
      AND message_group_members.user_id = auth.uid()
      AND message_group_members.role = 'admin'
    )
  );

-- ===== POLÍTICAS: messages =====

-- Membros veem mensagens de seus grupos
CREATE POLICY "Ver mensagens de grupos"
  ON messages FOR SELECT
  USING (
    (group_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM message_group_members
      WHERE message_group_members.group_id = messages.group_id
      AND message_group_members.user_id = auth.uid()
      AND message_group_members.is_active = true
    ))
    OR
    (conversation_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM direct_conversations dc
      WHERE dc.id = messages.conversation_id
      AND (dc.user1_id = auth.uid() OR dc.user2_id = auth.uid())
    ))
  );

-- Usuários podem enviar mensagens
CREATE POLICY "Enviar mensagens"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
  );

-- Usuários podem editar suas próprias mensagens
CREATE POLICY "Editar próprias mensagens"
  ON messages FOR UPDATE
  USING (sender_id = auth.uid());

-- ===== POLÍTICAS: user_presence =====

-- Todos veem presença dos outros
CREATE POLICY "Ver presença"
  ON user_presence FOR SELECT
  USING (true);

-- Usuários atualizam sua própria presença
CREATE POLICY "Atualizar própria presença"
  ON user_presence FOR ALL
  USING (user_id = auth.uid());

-- =====================================================
-- Fim da Migration: Sistema de Mensagens
-- =====================================================

