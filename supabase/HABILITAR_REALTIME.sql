-- ============================================================
-- VERIFICAR E HABILITAR REALTIME NO SUPABASE
-- ============================================================

-- 1. Ver se a replicação está habilitada nas tabelas
SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN schemaname || '.' || tablename IN (
      SELECT publication_tables.schemaname || '.' || publication_tables.tablename
      FROM pg_publication_tables publication_tables
      WHERE publication_tables.pubname = 'supabase_realtime'
    ) THEN '✅ Realtime ATIVO'
    ELSE '❌ Realtime INATIVO'
  END as status
FROM pg_tables
WHERE tablename IN (
  'direct_messages',
  'direct_conversations',
  'direct_conversation_participants',
  'message_read_receipts'
)
ORDER BY tablename;

-- ============================================================
-- SE ALGUMA TABELA ESTIVER INATIVA, EXECUTE ISSO:
-- ============================================================

-- Habilitar realtime para direct_messages
ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;

-- Habilitar realtime para message_read_receipts
ALTER PUBLICATION supabase_realtime ADD TABLE message_read_receipts;

-- Habilitar realtime para direct_conversations
ALTER PUBLICATION supabase_realtime ADD TABLE direct_conversations;

-- Habilitar realtime para direct_conversation_participants
ALTER PUBLICATION supabase_realtime ADD TABLE direct_conversation_participants;

-- ============================================================
-- VERIFICAR NOVAMENTE
-- ============================================================
SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN schemaname || '.' || tablename IN (
      SELECT publication_tables.schemaname || '.' || publication_tables.tablename
      FROM pg_publication_tables publication_tables
      WHERE publication_tables.pubname = 'supabase_realtime'
    ) THEN '✅ Realtime ATIVO'
    ELSE '❌ Realtime INATIVO'
  END as status
FROM pg_tables
WHERE tablename IN (
  'direct_messages',
  'direct_conversations',
  'direct_conversation_participants',
  'message_read_receipts'
)
ORDER BY tablename;

-- ============================================================
-- ESPERADO: TODOS COM "✅ Realtime ATIVO"
-- ============================================================
