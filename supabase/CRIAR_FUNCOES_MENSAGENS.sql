-- ============================================================
-- CRIAR TODAS AS FUNÇÕES RPC NECESSÁRIAS PARA MENSAGENS
-- ============================================================

-- 1. Função get_or_create_direct_conversation
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
  WHERE user_id = p_user_id_2
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

-- 2. Função update_user_presence
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

-- 3. Função upsert_typing_indicator
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

-- ============================================================
-- VERIFICAR SE AS FUNÇÕES FORAM CRIADAS
-- ============================================================
SELECT 
  routine_name as funcao,
  '✅ Criada' as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'get_or_create_direct_conversation',
    'update_user_presence',
    'upsert_typing_indicator'
  )
ORDER BY routine_name;
