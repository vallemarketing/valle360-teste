/*
  # Extended Profile System Tables

  ## Overview
  This migration creates the complete database structure for the enhanced profile system,
  including extended client information, contracts, rules documents, credits, benefits, and user preferences.

  ## New Tables Created

  ### 1. `client_profiles_extended`
  Extended profile information for clients including personal data, address, contacts, and documents.

  ### 2. `client_contracts`
  Contract documents and information for each client.

  ### 3. `client_rules_documents`
  Rules and policies documents for clients.

  ### 4. `client_credits`
  Credit balance and transaction history for clients.

  ### 5. `client_benefits`
  Benefits and discounts applicable to clients.

  ### 6. `user_preferences`
  User interface preferences and settings.

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Users can only access their own data
  - Admins can manage all data
*/

-- Create client_profiles_extended table
CREATE TABLE IF NOT EXISTS client_profiles_extended (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  cpf_cnpj text,
  birth_date date,
  company_name text,
  business_sector text,
  phone_commercial text,
  phone_mobile text,
  address_zip text,
  address_street text,
  address_number text,
  address_complement text,
  address_neighborhood text,
  address_city text,
  address_state text,
  social_instagram text,
  social_facebook text,
  social_linkedin text,
  social_youtube text,
  social_website text,
  additional_contacts jsonb DEFAULT '[]'::jsonb,
  documents jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create client_contracts table
CREATE TABLE IF NOT EXISTS client_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  contract_number text,
  plan_name text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  start_date date,
  renewal_date date,
  monthly_value numeric(10, 2),
  contract_file_url text,
  services_included jsonb DEFAULT '[]'::jsonb,
  version integer DEFAULT 1,
  is_current boolean DEFAULT true,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create client_rules_documents table
CREATE TABLE IF NOT EXISTS client_rules_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rules_file_url text NOT NULL,
  version integer DEFAULT 1,
  is_current boolean DEFAULT true,
  accepted_at timestamptz,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create client_credits table
CREATE TABLE IF NOT EXISTS client_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('recharge', 'usage')),
  description text NOT NULL,
  amount numeric(10, 2) NOT NULL,
  balance_after numeric(10, 2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create client_benefits table
CREATE TABLE IF NOT EXISTS client_benefits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  benefit_type text NOT NULL CHECK (benefit_type IN ('loyalty_discount', 'referral_discount', 'annual_payment_discount', 'custom')),
  benefit_name text NOT NULL,
  benefit_value numeric(10, 2) NOT NULL,
  is_active boolean DEFAULT true,
  referral_count integer DEFAULT 0,
  start_date date DEFAULT CURRENT_DATE,
  end_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  theme_mode text DEFAULT 'light' CHECK (theme_mode IN ('light', 'dark', 'auto')),
  language text DEFAULT 'pt' CHECK (language IN ('pt', 'en', 'es')),
  font_size text DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large')),
  notifications_new_content boolean DEFAULT true,
  notifications_messages boolean DEFAULT true,
  notifications_reports boolean DEFAULT true,
  notifications_credits boolean DEFAULT true,
  notifications_system boolean DEFAULT true,
  email_frequency text DEFAULT 'weekly' CHECK (email_frequency IN ('daily', 'weekly', 'monthly', 'never')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_client_profiles_extended_user_id ON client_profiles_extended(user_id);
CREATE INDEX IF NOT EXISTS idx_client_contracts_client_id ON client_contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_client_rules_documents_client_id ON client_rules_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_client_credits_client_id ON client_credits(client_id);
CREATE INDEX IF NOT EXISTS idx_client_credits_created_at ON client_credits(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_benefits_client_id ON client_benefits(client_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Enable Row Level Security
ALTER TABLE client_profiles_extended ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_rules_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_profiles_extended
CREATE POLICY "Users can view own extended profile"
  ON client_profiles_extended FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own extended profile"
  ON client_profiles_extended FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own extended profile"
  ON client_profiles_extended FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all extended profiles"
  ON client_profiles_extended FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update all extended profiles"
  ON client_profiles_extended FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for client_contracts
CREATE POLICY "Users can view own contracts"
  ON client_contracts FOR SELECT
  TO authenticated
  USING (auth.uid() = client_id);

CREATE POLICY "Admins can view all contracts"
  ON client_contracts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can insert contracts"
  ON client_contracts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update contracts"
  ON client_contracts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for client_rules_documents
CREATE POLICY "Users can view own rules documents"
  ON client_rules_documents FOR SELECT
  TO authenticated
  USING (auth.uid() = client_id);

CREATE POLICY "Users can update own rules acceptance"
  ON client_rules_documents FOR UPDATE
  TO authenticated
  USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Admins can view all rules documents"
  ON client_rules_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can insert rules documents"
  ON client_rules_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update rules documents"
  ON client_rules_documents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for client_credits
CREATE POLICY "Users can view own credits"
  ON client_credits FOR SELECT
  TO authenticated
  USING (auth.uid() = client_id);

CREATE POLICY "Admins can view all credits"
  ON client_credits FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can insert credits"
  ON client_credits FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for client_benefits
CREATE POLICY "Users can view own benefits"
  ON client_benefits FOR SELECT
  TO authenticated
  USING (auth.uid() = client_id);

CREATE POLICY "Admins can view all benefits"
  ON client_benefits FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can insert benefits"
  ON client_benefits FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update benefits"
  ON client_benefits FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for user_preferences
CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_client_profiles_extended_updated_at ON client_profiles_extended;
CREATE TRIGGER update_client_profiles_extended_updated_at
  BEFORE UPDATE ON client_profiles_extended
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_client_contracts_updated_at ON client_contracts;
CREATE TRIGGER update_client_contracts_updated_at
  BEFORE UPDATE ON client_contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_client_rules_documents_updated_at ON client_rules_documents;
CREATE TRIGGER update_client_rules_documents_updated_at
  BEFORE UPDATE ON client_rules_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_client_benefits_updated_at ON client_benefits;
CREATE TRIGGER update_client_benefits_updated_at
  BEFORE UPDATE ON client_benefits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();