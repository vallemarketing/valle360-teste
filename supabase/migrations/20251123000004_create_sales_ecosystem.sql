-- 1. Tabela de Serviços
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    base_price DECIMAL(10, 2) NOT NULL,
    billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'one_time', 'quarterly', 'yearly')),
    deliverables JSONB NOT NULL, -- Ex: {"videos": 4, "posts": 12, "stories": 20}
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Propostas
CREATE TABLE IF NOT EXISTS proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired')),
    total_value DECIMAL(10, 2) NOT NULL,
    valid_until TIMESTAMP WITH TIME ZONE,
    sales_rep_id UUID REFERENCES auth.users(id), -- Vendedor responsável
    magic_link_token TEXT UNIQUE, -- Token para acesso público
    items JSONB NOT NULL, -- Array de serviços e quantidades
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Contratos (Gerada após aceite da proposta)
CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID REFERENCES proposals(id),
    client_id UUID REFERENCES clients(id), -- Se o cliente já existir ou for criado
    start_date DATE NOT NULL,
    end_date DATE, -- NULL se for indeterminado
    active BOOLEAN DEFAULT TRUE,
    billing_day INTEGER CHECK (billing_day BETWEEN 1 AND 31),
    payment_method TEXT, -- 'pix', 'credit_card', 'boleto'
    contract_file_url TEXT, -- URL do PDF assinado
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de Health Score do Cliente (Inteligência)
CREATE TABLE IF NOT EXISTS client_health_score (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) NOT NULL,
    score INTEGER CHECK (score BETWEEN 0 AND 100),
    last_nps INTEGER,
    tasks_delayed_count INTEGER DEFAULT 0,
    payment_status TEXT DEFAULT 'ok', -- 'ok', 'late', 'risk'
    churn_risk_level TEXT DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
    ai_insights TEXT, -- Texto gerado pela IA sobre o cliente
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_contracts_active ON contracts(active);
CREATE INDEX IF NOT EXISTS idx_client_health_client ON client_health_score(client_id);

