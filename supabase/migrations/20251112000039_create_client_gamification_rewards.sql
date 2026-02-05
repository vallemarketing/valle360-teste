-- =====================================================================================
-- Migration 39: Sistema de Recompensas para Clientes
-- Descrição: Gamificação com pontos, tiers e recompensas
-- =====================================================================================

CREATE TABLE client_reward_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_name VARCHAR(255) NOT NULL,
    program_description TEXT,
    is_active BOOLEAN DEFAULT true,
    
    -- Regras de pontos
    points_per_referral INTEGER DEFAULT 100,
    points_per_feedback INTEGER DEFAULT 50,
    points_per_approval INTEGER DEFAULT 25,
    points_per_month_active INTEGER DEFAULT 10,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE client_reward_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    points_balance INTEGER DEFAULT 0,
    lifetime_points_earned INTEGER DEFAULT 0,
    lifetime_points_redeemed INTEGER DEFAULT 0,
    
    -- Tier/Nível
    tier_level VARCHAR(20) DEFAULT 'bronze', -- 'bronze', 'silver', 'gold', 'platinum'
    tier_benefits JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(client_id)
);

CREATE TABLE client_reward_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    transaction_type VARCHAR(50) NOT NULL, -- 'earned', 'redeemed', 'expired', 'bonus'
    points_change INTEGER NOT NULL,
    reason TEXT,
    reference_id UUID,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE client_reward_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    reward_name VARCHAR(255) NOT NULL,
    reward_type VARCHAR(50), -- 'discount', 'service_upgrade', 'gift_card', 'physical_gift'
    reward_description TEXT,
    points_cost INTEGER NOT NULL,
    reward_value DECIMAL(10,2),
    
    is_available BOOLEAN DEFAULT true,
    stock_quantity INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE client_reward_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    reward_id UUID REFERENCES client_reward_catalog(id),
    
    reward_type VARCHAR(50) NOT NULL,
    points_cost INTEGER NOT NULL,
    reward_value DECIMAL(10,2),
    
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'fulfilled', 'cancelled'
    
    redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fulfilled_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_client_reward_points_client ON client_reward_points(client_id);
CREATE INDEX idx_client_reward_transactions_client ON client_reward_transactions(client_id);
CREATE INDEX idx_client_reward_redemptions_client ON client_reward_redemptions(client_id);

-- RLS
ALTER TABLE client_reward_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_reward_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_reward_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_reward_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_reward_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY all_view_reward_programs ON client_reward_programs FOR SELECT TO authenticated USING (true);
CREATE POLICY all_view_reward_catalog ON client_reward_catalog FOR SELECT TO authenticated USING (true);

CREATE POLICY clients_own_points ON client_reward_points FOR SELECT TO authenticated USING (
    client_id IN (SELECT id FROM clients WHERE clients.user_id = auth.uid())
);

CREATE POLICY clients_own_transactions ON client_reward_transactions FOR SELECT TO authenticated USING (
    client_id IN (SELECT id FROM clients WHERE clients.user_id = auth.uid())
);

CREATE POLICY clients_own_redemptions ON client_reward_redemptions FOR ALL TO authenticated USING (
    client_id IN (SELECT id FROM clients WHERE clients.user_id = auth.uid())
);

COMMENT ON SCHEMA public IS 'Migration 39: Gamificação para Clientes';

