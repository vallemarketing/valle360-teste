-- =====================================================
-- MIGRATION: Alert recipient rules (UI/banco)
-- Objetivo: controlar destinatários de alertas por tipo e canal via banco, sem depender de env vars.
-- Resolução no app: env -> banco -> fallback (admins/super_admins).
-- =====================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.alert_recipient_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('email', 'intranet')),
  recipient_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_email text,
  is_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CHECK (
    (channel = 'intranet' AND recipient_user_id IS NOT NULL AND recipient_email IS NULL)
    OR
    (channel = 'email' AND (recipient_user_id IS NOT NULL OR recipient_email IS NOT NULL))
  )
);

-- Uniques (separados para evitar conflitos com NULL)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_alert_rule_user
  ON public.alert_recipient_rules(alert_type, channel, recipient_user_id)
  WHERE recipient_user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_alert_rule_email
  ON public.alert_recipient_rules(alert_type, channel, lower(recipient_email))
  WHERE recipient_email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_alert_recipient_rules_type ON public.alert_recipient_rules(alert_type);
CREATE INDEX IF NOT EXISTS idx_alert_recipient_rules_enabled ON public.alert_recipient_rules(is_enabled);

DROP TRIGGER IF EXISTS trg_alert_recipient_rules_updated_at ON public.alert_recipient_rules;
CREATE TRIGGER trg_alert_recipient_rules_updated_at
  BEFORE UPDATE ON public.alert_recipient_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS (admin-only)
ALTER TABLE public.alert_recipient_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS alert_recipient_rules_select_admin ON public.alert_recipient_rules;
CREATE POLICY alert_recipient_rules_select_admin
  ON public.alert_recipient_rules
  FOR SELECT
  USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS alert_recipient_rules_insert_admin ON public.alert_recipient_rules;
CREATE POLICY alert_recipient_rules_insert_admin
  ON public.alert_recipient_rules
  FOR INSERT
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS alert_recipient_rules_update_admin ON public.alert_recipient_rules;
CREATE POLICY alert_recipient_rules_update_admin
  ON public.alert_recipient_rules
  FOR UPDATE
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS alert_recipient_rules_delete_admin ON public.alert_recipient_rules;
CREATE POLICY alert_recipient_rules_delete_admin
  ON public.alert_recipient_rules
  FOR DELETE
  USING ((SELECT public.is_admin()));

