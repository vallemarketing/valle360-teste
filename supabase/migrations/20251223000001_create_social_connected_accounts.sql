-- Contas sociais conectadas por cliente (visíveis para Social Media/Head Marketing)
-- Tokens ficam em tabela separada (secrets) para não expor credenciais via SELECT de colaboradores.

CREATE TABLE IF NOT EXISTS public.social_connected_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('instagram','facebook','linkedin','twitter','tiktok','youtube')),
  external_account_id text NOT NULL,
  username text,
  display_name text,
  profile_picture_url text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','error')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, platform, external_account_id)
);

CREATE INDEX IF NOT EXISTS idx_social_connected_accounts_client_id ON public.social_connected_accounts (client_id);
CREATE INDEX IF NOT EXISTS idx_social_connected_accounts_platform ON public.social_connected_accounts (platform);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.update_social_connected_accounts_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_social_connected_accounts_updated_at ON public.social_connected_accounts;
CREATE TRIGGER trigger_social_connected_accounts_updated_at
  BEFORE UPDATE ON public.social_connected_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_social_connected_accounts_updated_at();

-- Secrets (tokens) separados
CREATE TABLE IF NOT EXISTS public.social_connected_account_secrets (
  account_id uuid PRIMARY KEY REFERENCES public.social_connected_accounts(id) ON DELETE CASCADE,
  access_token text,
  refresh_token text,
  token_type text,
  scopes text[] NOT NULL DEFAULT '{}'::text[],
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.update_social_connected_account_secrets_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_social_connected_account_secrets_updated_at ON public.social_connected_account_secrets;
CREATE TRIGGER trigger_social_connected_account_secrets_updated_at
  BEFORE UPDATE ON public.social_connected_account_secrets
  FOR EACH ROW EXECUTE FUNCTION public.update_social_connected_account_secrets_updated_at();

-- RLS
ALTER TABLE public.social_connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_connected_accounts FORCE ROW LEVEL SECURITY;

ALTER TABLE public.social_connected_account_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_connected_account_secrets FORCE ROW LEVEL SECURITY;

-- Policies: contas públicas
DROP POLICY IF EXISTS social_accounts_admin_all ON public.social_connected_accounts;
DROP POLICY IF EXISTS social_accounts_client_own_all ON public.social_connected_accounts;
DROP POLICY IF EXISTS social_accounts_employee_read ON public.social_connected_accounts;

CREATE POLICY social_accounts_admin_all
  ON public.social_connected_accounts
  FOR ALL
  TO public
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY social_accounts_client_own_all
  ON public.social_connected_accounts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = social_connected_accounts.client_id
      AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = social_connected_accounts.client_id
      AND c.user_id = auth.uid()
    )
  );

-- Colaboradores podem LER (sem tokens) se forem Social Media / Head Marketing
CREATE POLICY social_accounts_employee_read
  ON public.social_connected_accounts
  FOR SELECT
  TO authenticated
  USING (
    is_employee()
    AND (employee_area_keys() && ARRAY['social_media','head_marketing']::text[])
  );

-- Policies: secrets (tokens) - apenas admin e cliente dono
DROP POLICY IF EXISTS social_account_secrets_admin_all ON public.social_connected_account_secrets;
DROP POLICY IF EXISTS social_account_secrets_client_own_all ON public.social_connected_account_secrets;

CREATE POLICY social_account_secrets_admin_all
  ON public.social_connected_account_secrets
  FOR ALL
  TO public
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY social_account_secrets_client_own_all
  ON public.social_connected_account_secrets
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.social_connected_accounts a
      JOIN public.clients c ON c.id = a.client_id
      WHERE a.id = social_connected_account_secrets.account_id
      AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.social_connected_accounts a
      JOIN public.clients c ON c.id = a.client_id
      WHERE a.id = social_connected_account_secrets.account_id
      AND c.user_id = auth.uid()
    )
  );


