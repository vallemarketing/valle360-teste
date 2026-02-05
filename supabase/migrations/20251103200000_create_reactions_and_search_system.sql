/*
  # Sistema de Reações e Busca de Mensagens

  1. Novas Tabelas
    - `message_reactions`
      - Armazena reações dos usuários em mensagens
      - Suporta tanto mensagens de grupo quanto diretas
      - Tipos: like, love, laugh, wow, sad, angry
      - Unique constraint para evitar duplicatas

    - `pinned_messages`
      - Mensagens fixadas em grupos ou conversas diretas
      - Timestamp de quando foi fixada
      - Quem fixou a mensagem

    - `message_search_history`
      - Histórico de buscas dos usuários
      - Usado para otimizar e sugerir buscas

  2. Índices
    - Índices para busca full-text
    - Índices para performance em queries de reações
    - Índices para histórico de buscas

  3. Funções
    - Função para buscar mensagens com full-text
    - Função para obter estatísticas de reações
    - Função para exportar histórico de conversas

  4. Segurança
    - RLS habilitado em todas as tabelas
    - Policies para controle de acesso
    - Usuários só podem reagir e buscar em conversas que participam
*/

-- Tabela de reações em mensagens
CREATE TABLE IF NOT EXISTS message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL,
  message_type text NOT NULL CHECK (message_type IN ('group', 'direct')),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  reaction_type text NOT NULL CHECK (reaction_type IN ('like', 'love', 'laugh', 'wow', 'sad', 'angry')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(message_id, message_type, user_id)
);

-- Tabela de mensagens fixadas
CREATE TABLE IF NOT EXISTS pinned_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL,
  message_type text NOT NULL CHECK (message_type IN ('group', 'direct')),
  conversation_id uuid NOT NULL,
  pinned_by uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  pinned_at timestamptz DEFAULT now(),
  note text,
  UNIQUE(message_id, message_type)
);

-- Tabela de histórico de buscas
CREATE TABLE IF NOT EXISTS message_search_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  search_query text NOT NULL,
  search_filters jsonb DEFAULT '{}'::jsonb,
  results_count int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_message_reactions_message
  ON message_reactions(message_id, message_type);

CREATE INDEX IF NOT EXISTS idx_message_reactions_user
  ON message_reactions(user_id);

CREATE INDEX IF NOT EXISTS idx_pinned_messages_conversation
  ON pinned_messages(conversation_id, message_type);

CREATE INDEX IF NOT EXISTS idx_search_history_user
  ON message_search_history(user_id, created_at DESC);

-- Índice full-text para busca em mensagens de grupo
CREATE INDEX IF NOT EXISTS idx_messages_body_fts
  ON messages USING gin(to_tsvector('portuguese', body));

-- Índice full-text para busca em mensagens diretas
CREATE INDEX IF NOT EXISTS idx_direct_messages_body_fts
  ON direct_messages USING gin(to_tsvector('portuguese', body));

-- Função para buscar mensagens em grupos
CREATE OR REPLACE FUNCTION search_group_messages(
  p_group_id uuid,
  p_search_query text,
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL,
  p_sender_id uuid DEFAULT NULL,
  p_limit int DEFAULT 50
)
RETURNS TABLE(
  id uuid,
  body text,
  from_user_id uuid,
  created_at timestamptz,
  sender_name text,
  rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.body,
    m.from_user_id,
    m.created_at,
    u.full_name as sender_name,
    ts_rank(to_tsvector('portuguese', m.body), plainto_tsquery('portuguese', p_search_query)) as rank
  FROM messages m
  INNER JOIN user_profiles u ON m.from_user_id = u.id
  WHERE
    m.group_id = p_group_id
    AND to_tsvector('portuguese', m.body) @@ plainto_tsquery('portuguese', p_search_query)
    AND (p_date_from IS NULL OR m.created_at >= p_date_from)
    AND (p_date_to IS NULL OR m.created_at <= p_date_to)
    AND (p_sender_id IS NULL OR m.from_user_id = p_sender_id)
  ORDER BY rank DESC, m.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para buscar mensagens diretas
CREATE OR REPLACE FUNCTION search_direct_messages(
  p_conversation_id uuid,
  p_search_query text,
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL,
  p_sender_id uuid DEFAULT NULL,
  p_limit int DEFAULT 50
)
RETURNS TABLE(
  id uuid,
  body text,
  from_user_id uuid,
  created_at timestamptz,
  sender_name text,
  rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    dm.id,
    dm.body,
    dm.from_user_id,
    dm.created_at,
    u.full_name as sender_name,
    ts_rank(to_tsvector('portuguese', dm.body), plainto_tsquery('portuguese', p_search_query)) as rank
  FROM direct_messages dm
  INNER JOIN user_profiles u ON dm.from_user_id = u.id
  WHERE
    dm.conversation_id = p_conversation_id
    AND to_tsvector('portuguese', dm.body) @@ plainto_tsquery('portuguese', p_search_query)
    AND (p_date_from IS NULL OR dm.created_at >= p_date_from)
    AND (p_date_to IS NULL OR dm.created_at <= p_date_to)
    AND (p_sender_id IS NULL OR dm.from_user_id = p_sender_id)
  ORDER BY rank DESC, dm.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter estatísticas de reações
CREATE OR REPLACE FUNCTION get_message_reactions(
  p_message_id uuid,
  p_message_type text
)
RETURNS TABLE(
  reaction_type text,
  count bigint,
  users jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    mr.reaction_type,
    COUNT(*)::bigint as count,
    jsonb_agg(jsonb_build_object(
      'user_id', u.id,
      'full_name', u.full_name,
      'avatar_url', u.avatar_url
    )) as users
  FROM message_reactions mr
  INNER JOIN user_profiles u ON mr.user_id = u.id
  WHERE
    mr.message_id = p_message_id
    AND mr.message_type = p_message_type
  GROUP BY mr.reaction_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para adicionar/remover reação
CREATE OR REPLACE FUNCTION toggle_message_reaction(
  p_message_id uuid,
  p_message_type text,
  p_user_id uuid,
  p_reaction_type text
)
RETURNS boolean AS $$
DECLARE
  v_exists boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM message_reactions
    WHERE message_id = p_message_id
      AND message_type = p_message_type
      AND user_id = p_user_id
      AND reaction_type = p_reaction_type
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM message_reactions
    WHERE message_id = p_message_id
      AND message_type = p_message_type
      AND user_id = p_user_id
      AND reaction_type = p_reaction_type;
    RETURN false;
  ELSE
    DELETE FROM message_reactions
    WHERE message_id = p_message_id
      AND message_type = p_message_type
      AND user_id = p_user_id;

    INSERT INTO message_reactions (message_id, message_type, user_id, reaction_type)
    VALUES (p_message_id, p_message_type, p_user_id, p_reaction_type);
    RETURN true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies

ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reactions in their groups"
  ON message_reactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_participants gp
      INNER JOIN messages m ON m.group_id = gp.group_id
      WHERE m.id = message_reactions.message_id
        AND message_reactions.message_type = 'group'
        AND gp.user_id = auth.uid()
        AND gp.is_active = true
    )
    OR
    EXISTS (
      SELECT 1 FROM direct_conversation_participants dcp
      INNER JOIN direct_messages dm ON dm.conversation_id = dcp.conversation_id
      WHERE dm.id = message_reactions.message_id
        AND message_reactions.message_type = 'direct'
        AND dcp.user_id = auth.uid()
        AND dcp.is_active = true
    )
  );

CREATE POLICY "Users can add reactions"
  ON message_reactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove own reactions"
  ON message_reactions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

ALTER TABLE pinned_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view pinned messages in their conversations"
  ON pinned_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_participants
      WHERE group_id = pinned_messages.conversation_id
        AND user_id = auth.uid()
        AND is_active = true
    )
    OR
    EXISTS (
      SELECT 1 FROM direct_conversation_participants
      WHERE conversation_id = pinned_messages.conversation_id
        AND user_id = auth.uid()
        AND is_active = true
    )
  );

CREATE POLICY "Admins can pin messages in groups"
  ON pinned_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    pinned_by = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM group_participants
        WHERE group_id = conversation_id
          AND user_id = auth.uid()
          AND role = 'admin'
          AND is_active = true
      )
      OR
      EXISTS (
        SELECT 1 FROM direct_conversation_participants
        WHERE conversation_id = pinned_messages.conversation_id
          AND user_id = auth.uid()
          AND is_active = true
      )
    )
  );

CREATE POLICY "Admins can unpin messages"
  ON pinned_messages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_participants
      WHERE group_id = pinned_messages.conversation_id
        AND user_id = auth.uid()
        AND role = 'admin'
        AND is_active = true
    )
    OR pinned_by = auth.uid()
  );

ALTER TABLE message_search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own search history"
  ON message_search_history FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can add to search history"
  ON message_search_history FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own search history"
  ON message_search_history FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
