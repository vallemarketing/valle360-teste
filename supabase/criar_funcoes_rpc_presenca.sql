-- ============================================================
-- CRIAR FUNÇÕES RPC PARA PRESENÇA E DIGITAÇÃO
-- ============================================================
-- Execute este script no Supabase SQL Editor
-- Ele cria as funções RPC necessárias para o sistema de presença
-- ============================================================

-- 1. Função update_user_presence
-- Atualiza o status de presença do usuário (online/away/offline)
-- ============================================================
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

-- 2. Função upsert_typing_indicator
-- Registra quando um usuário está digitando em um grupo
-- ============================================================
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
-- VERIFICAÇÃO
-- ============================================================
-- Execute esta query para verificar se as funções foram criadas:
-- SELECT routine_name, routine_type 
-- FROM information_schema.routines 
-- WHERE routine_schema = 'public' 
-- AND routine_name IN ('update_user_presence', 'upsert_typing_indicator');
-- ============================================================
