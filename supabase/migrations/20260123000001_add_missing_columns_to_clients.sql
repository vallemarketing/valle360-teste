-- =====================================================================================
-- MIGRATION: Adicionar colunas faltantes na tabela clients
-- Data: 23/01/2026
-- Descrição: Adiciona colunas que o código espera mas não existem no schema
-- =====================================================================================

-- Adicionar colunas que faltam
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS plan_id TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS contact_name TEXT,
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS monthly_value DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS segment TEXT,
ADD COLUMN IF NOT EXISTS competitors TEXT[],
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_clients_plan_id ON clients(plan_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_company_name ON clients(company_name);
CREATE INDEX IF NOT EXISTS idx_clients_is_active ON clients(is_active);

-- Comentários
COMMENT ON COLUMN clients.plan_id IS 'ID do plano contratado pelo cliente';
COMMENT ON COLUMN clients.email IS 'Email do cliente (duplicado para compatibilidade)';
COMMENT ON COLUMN clients.company_name IS 'Nome da empresa';
COMMENT ON COLUMN clients.contact_name IS 'Nome do contato principal';
COMMENT ON COLUMN clients.contact_email IS 'Email do contato principal';
COMMENT ON COLUMN clients.contact_phone IS 'Telefone do contato principal';
COMMENT ON COLUMN clients.industry IS 'Indústria/Setor de atuação';
COMMENT ON COLUMN clients.website IS 'Website do cliente';
COMMENT ON COLUMN clients.address IS 'Endereço completo (JSON)';
COMMENT ON COLUMN clients.status IS 'Status do cliente: active, inactive, prospect';
COMMENT ON COLUMN clients.monthly_value IS 'Valor mensal do contrato';
COMMENT ON COLUMN clients.segment IS 'Segmento de mercado';
COMMENT ON COLUMN clients.competitors IS 'Lista de concorrentes';
COMMENT ON COLUMN clients.is_active IS 'Se o cliente está ativo';
COMMENT ON COLUMN clients.onboarding_completed IS 'Se o onboarding foi completado';

-- Atualizar dados existentes (popular campos novos com dados existentes)
UPDATE clients 
SET 
    email = user_id::text 
WHERE email IS NULL;

UPDATE clients 
SET 
    company_name = nome_fantasia 
WHERE company_name IS NULL AND nome_fantasia IS NOT NULL;

UPDATE clients 
SET 
    contact_email = email 
WHERE contact_email IS NULL AND email IS NOT NULL;

UPDATE clients 
SET 
    industry = area_atuacao 
WHERE industry IS NULL AND area_atuacao IS NOT NULL;

UPDATE clients 
SET 
    website = site 
WHERE website IS NULL AND site IS NOT NULL;

-- Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE '✅ Colunas adicionadas à tabela clients!';
    RAISE NOTICE '📊 Colunas adicionadas:';
    RAISE NOTICE '   - plan_id';
    RAISE NOTICE '   - email';
    RAISE NOTICE '   - company_name';
    RAISE NOTICE '   - contact_name';
    RAISE NOTICE '   - contact_email';
    RAISE NOTICE '   - contact_phone';
    RAISE NOTICE '   - industry';
    RAISE NOTICE '   - website';
    RAISE NOTICE '   - address';
    RAISE NOTICE '   - status';
    RAISE NOTICE '   - monthly_value';
    RAISE NOTICE '   - segment';
    RAISE NOTICE '   - competitors';
    RAISE NOTICE '   - is_active';
    RAISE NOTICE '   - onboarding_completed';
END $$;
