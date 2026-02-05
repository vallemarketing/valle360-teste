-- Adicionar colunas de gamificação na tabela clients
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS level VARCHAR(20) DEFAULT 'bronze';

-- Tabela de histórico de pontos
CREATE TABLE IF NOT EXISTS client_points_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  points INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para histórico
CREATE INDEX IF NOT EXISTS idx_points_history_client ON client_points_history(client_id);
CREATE INDEX IF NOT EXISTS idx_points_history_date ON client_points_history(created_at DESC);

-- Tabela de recompensas resgatadas
CREATE TABLE IF NOT EXISTS client_redeemed_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  reward_code VARCHAR(50) NOT NULL,
  reward_name VARCHAR(255) NOT NULL,
  points_spent INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, delivered, cancelled
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  notes TEXT
);

-- Índices para recompensas
CREATE INDEX IF NOT EXISTS idx_redeemed_rewards_client ON client_redeemed_rewards(client_id);
CREATE INDEX IF NOT EXISTS idx_redeemed_rewards_status ON client_redeemed_rewards(status);

-- Tabela de referrals (indicações)
CREATE TABLE IF NOT EXISTS client_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  referred_client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  referral_code VARCHAR(20) UNIQUE,
  status VARCHAR(20) DEFAULT 'pending', -- pending, converted, expired
  points_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  converted_at TIMESTAMPTZ
);

-- Índices para referrals
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON client_referrals(referrer_client_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON client_referrals(referral_code);

-- Função para gerar código de referral único
CREATE OR REPLACE FUNCTION generate_referral_code() 
RETURNS VARCHAR(20) AS $$
DECLARE
  chars VARCHAR(36) := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  code VARCHAR(20) := 'VALLE-';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar referral code quando cliente é criado
CREATE OR REPLACE FUNCTION create_client_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO client_referrals (referrer_client_id, referral_code, status)
  VALUES (NEW.id, generate_referral_code(), 'active');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_referral_code ON clients;
CREATE TRIGGER trigger_create_referral_code
AFTER INSERT ON clients
FOR EACH ROW
EXECUTE FUNCTION create_client_referral_code();

-- RLS Policies
ALTER TABLE client_points_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_redeemed_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_referrals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Clients can view own points history" ON client_points_history;
DROP POLICY IF EXISTS "Clients can view own rewards" ON client_redeemed_rewards;
DROP POLICY IF EXISTS "Clients can view own referrals" ON client_referrals;

-- Policies para histórico de pontos
CREATE POLICY "Clients can view own points history" ON client_points_history
FOR SELECT USING (
  client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
);

-- Policies para recompensas
CREATE POLICY "Clients can view own rewards" ON client_redeemed_rewards
FOR SELECT USING (
  client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
);

-- Policies para referrals
CREATE POLICY "Clients can view own referrals" ON client_referrals
FOR SELECT USING (
  referrer_client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
);
