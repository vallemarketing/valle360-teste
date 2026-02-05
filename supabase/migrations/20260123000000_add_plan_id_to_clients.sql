-- =====================================================================================
-- MIGRATION: Adicionar coluna plan_id na tabela clients
-- Data: 23/01/2026
-- =====================================================================================

-- Adicionar coluna plan_id na tabela clients
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS plan_id TEXT;

-- Adicionar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_clients_plan_id ON clients(plan_id);

-- Comentário
COMMENT ON COLUMN clients.plan_id IS 'ID do plano contratado pelo cliente';

-- Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE '✅ Coluna plan_id adicionada à tabela clients!';
END $$;
