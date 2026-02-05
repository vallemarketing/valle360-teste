-- =====================================================
-- Push Notifications Subscriptions Table
-- =====================================================

-- Table for storing web push subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  user_agent TEXT,
  device_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(active) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- RLS Policies
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON push_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can create their own subscriptions
CREATE POLICY "Users can create own subscriptions"
  ON push_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscriptions
CREATE POLICY "Users can update own subscriptions"
  ON push_subscriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete their own subscriptions
CREATE POLICY "Users can delete own subscriptions"
  ON push_subscriptions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role has full access
CREATE POLICY "Service role full access"
  ON push_subscriptions
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- =====================================================
-- Client Referrals Table (for benefits page)
-- =====================================================

CREATE TABLE IF NOT EXISTS client_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  referred_client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  referred_email TEXT NOT NULL,
  referred_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paid', 'expired')),
  earnings DECIMAL(10,2) DEFAULT 500.00,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_referrals_referrer ON client_referrals(referrer_client_id);
CREATE INDEX IF NOT EXISTS idx_client_referrals_referred ON client_referrals(referred_client_id);
CREATE INDEX IF NOT EXISTS idx_client_referrals_email ON client_referrals(referred_email);

-- =====================================================
-- Client Benefit Redemptions Table
-- =====================================================

CREATE TABLE IF NOT EXISTS client_benefit_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  benefit_id UUID NOT NULL REFERENCES client_benefits(id) ON DELETE CASCADE,
  credits_used DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES user_profiles(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_benefit_redemptions_client ON client_benefit_redemptions(client_id);
CREATE INDEX IF NOT EXISTS idx_benefit_redemptions_status ON client_benefit_redemptions(status);

-- =====================================================
-- Client Credit Transactions Table
-- =====================================================

CREATE TABLE IF NOT EXISTS client_credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'usage', 'bonus', 'refund', 'adjustment')),
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  reference_id TEXT,
  reference_type TEXT,
  balance_after DECIMAL(10,2),
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_client ON client_credit_transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON client_credit_transactions(type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created ON client_credit_transactions(created_at);

-- =====================================================
-- Client Credit Orders Table (for payment processing)
-- =====================================================

CREATE TABLE IF NOT EXISTS client_credit_orders (
  id TEXT PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  bonus DECIMAL(10,2) DEFAULT 0,
  total_credits DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('pix', 'card', 'boleto', 'transfer')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'cancelled', 'refunded')),
  payment_data JSONB,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_orders_client ON client_credit_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_credit_orders_status ON client_credit_orders(status);

-- Add referral_code column to clients if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'referral_code'
  ) THEN
    ALTER TABLE clients ADD COLUMN referral_code TEXT UNIQUE;
  END IF;
END $$;

-- =====================================================
-- Function to update client credits after order payment
-- =====================================================

CREATE OR REPLACE FUNCTION process_credit_order_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when status changes to 'paid'
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status <> 'paid') THEN
    -- Update or insert client credits
    INSERT INTO client_credits (client_id, balance, updated_at)
    VALUES (NEW.client_id, NEW.total_credits, NOW())
    ON CONFLICT (client_id) 
    DO UPDATE SET 
      balance = client_credits.balance + NEW.total_credits,
      updated_at = NOW();
    
    -- Record transaction
    INSERT INTO client_credit_transactions (
      client_id, type, amount, description, reference_id, reference_type
    ) VALUES (
      NEW.client_id, 
      'purchase', 
      NEW.total_credits, 
      'Compra de créditos via ' || NEW.payment_method,
      NEW.id,
      'credit_order'
    );
    
    -- Record bonus separately if any
    IF NEW.bonus > 0 THEN
      INSERT INTO client_credit_transactions (
        client_id, type, amount, description, reference_id, reference_type
      ) VALUES (
        NEW.client_id, 
        'bonus', 
        NEW.bonus, 
        'Bônus por compra de créditos',
        NEW.id,
        'credit_order'
      );
    END IF;
    
    -- Update paid_at timestamp
    NEW.paid_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for credit order payment
DROP TRIGGER IF EXISTS trigger_credit_order_payment ON client_credit_orders;
CREATE TRIGGER trigger_credit_order_payment
  BEFORE UPDATE ON client_credit_orders
  FOR EACH ROW
  EXECUTE FUNCTION process_credit_order_payment();
