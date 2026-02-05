-- =====================================================
-- MIGRATION: Sentiment System (Queue + Analyses + Alerts + Daily Stats)
-- Objetivo: habilitar /admin/monitoramento-sentimento + /api/sentiment/*
-- Observação: usa CHECKs (não enums) para evitar conflitos de enum em bases existentes.
-- =====================================================

-- =========================
-- 1) TABELAS
-- =========================

CREATE TABLE IF NOT EXISTS public.sentiment_processing_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL CHECK (source_type IN ('message','nps_response','task_comment','feedback','review','support_ticket','email')),
  source_id uuid NOT NULL,
  source_table text,
  content text NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  priority integer NOT NULL DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  last_error text,
  result_id uuid,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(source_type, source_id)
);

CREATE INDEX IF NOT EXISTS idx_sentiment_queue_status_priority
  ON public.sentiment_processing_queue(status, priority DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_sentiment_queue_client
  ON public.sentiment_processing_queue(client_id);

CREATE TABLE IF NOT EXISTS public.sentiment_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL CHECK (source_type IN ('message','nps_response','task_comment','feedback','review','support_ticket','email')),
  source_id uuid NOT NULL,
  source_table text,
  content text NOT NULL,
  content_preview text,
  provider text,
  overall_sentiment text NOT NULL CHECK (overall_sentiment IN ('positive','neutral','negative')),
  score double precision NOT NULL,
  magnitude double precision,
  confidence double precision,
  emotions jsonb,
  entities jsonb,
  keywords jsonb,
  summary text,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  content_created_at timestamptz,
  processing_time_ms integer,
  alert_generated boolean NOT NULL DEFAULT false,
  alert_id uuid,
  analyzed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sentiment_analyses_analyzed_at
  ON public.sentiment_analyses(analyzed_at DESC);
CREATE INDEX IF NOT EXISTS idx_sentiment_analyses_client
  ON public.sentiment_analyses(client_id, analyzed_at DESC);
CREATE INDEX IF NOT EXISTS idx_sentiment_analyses_source
  ON public.sentiment_analyses(source_type, source_id);

CREATE TABLE IF NOT EXISTS public.sentiment_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sentiment_analysis_id uuid REFERENCES public.sentiment_analyses(id) ON DELETE SET NULL,
  alert_type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('critical','high','medium','low')),
  title text NOT NULL,
  description text,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  client_name text,
  source_type text,
  source_content_preview text,
  suggested_action text,
  notification_channels jsonb DEFAULT '["in_app"]'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','acknowledged','resolved','dismissed')),
  acknowledged_at timestamptz,
  acknowledged_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sentiment_alerts_status
  ON public.sentiment_alerts(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sentiment_alerts_severity
  ON public.sentiment_alerts(severity, created_at DESC);

-- Daily stats para /api/sentiment/stats
CREATE TABLE IF NOT EXISTS public.sentiment_daily_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  total_analyses integer NOT NULL DEFAULT 0,
  positive_count integer NOT NULL DEFAULT 0,
  neutral_count integer NOT NULL DEFAULT 0,
  negative_count integer NOT NULL DEFAULT 0,
  average_score double precision NOT NULL DEFAULT 0,
  messages_count integer NOT NULL DEFAULT 0,
  nps_count integer NOT NULL DEFAULT 0,
  tasks_count integer NOT NULL DEFAULT 0,
  reviews_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(date, client_id)
);

CREATE INDEX IF NOT EXISTS idx_sentiment_daily_stats_date
  ON public.sentiment_daily_stats(date DESC);

-- Config per-client (opcional)
CREATE TABLE IF NOT EXISTS public.sentiment_automation_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid UNIQUE REFERENCES public.clients(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  provider text NOT NULL DEFAULT 'auto' CHECK (provider IN ('auto','google','openai','claude')),
  alert_on_negative boolean NOT NULL DEFAULT true,
  alert_threshold double precision NOT NULL DEFAULT -0.25,
  alert_channels jsonb NOT NULL DEFAULT '["in_app"]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =========================
-- 2) TRIGGERS updated_at
-- =========================

DO $$
BEGIN
  -- `update_updated_at_column` é criado em migrations iniciais; se não existir, ignorar.
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'update_updated_at_column'
  ) THEN
    DROP TRIGGER IF EXISTS update_sentiment_processing_queue_updated_at ON public.sentiment_processing_queue;
    CREATE TRIGGER update_sentiment_processing_queue_updated_at
      BEFORE UPDATE ON public.sentiment_processing_queue
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

    DROP TRIGGER IF EXISTS update_sentiment_analyses_updated_at ON public.sentiment_analyses;
    CREATE TRIGGER update_sentiment_analyses_updated_at
      BEFORE UPDATE ON public.sentiment_analyses
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

    DROP TRIGGER IF EXISTS update_sentiment_alerts_updated_at ON public.sentiment_alerts;
    CREATE TRIGGER update_sentiment_alerts_updated_at
      BEFORE UPDATE ON public.sentiment_alerts
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

    DROP TRIGGER IF EXISTS update_sentiment_daily_stats_updated_at ON public.sentiment_daily_stats;
    CREATE TRIGGER update_sentiment_daily_stats_updated_at
      BEFORE UPDATE ON public.sentiment_daily_stats
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

    DROP TRIGGER IF EXISTS update_sentiment_automation_config_updated_at ON public.sentiment_automation_config;
    CREATE TRIGGER update_sentiment_automation_config_updated_at
      BEFORE UPDATE ON public.sentiment_automation_config
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- =========================
-- 3) RPCs (Queue)
-- =========================

CREATE OR REPLACE FUNCTION public.add_to_sentiment_queue(
  p_source_type character varying,
  p_source_id uuid,
  p_source_table character varying,
  p_content text,
  p_client_id uuid,
  p_user_id uuid,
  p_priority integer,
  p_metadata jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_catalog
AS $$
DECLARE
  v_id uuid;
BEGIN
  -- Permitir apenas service_role ou admin
  IF (SELECT auth.role()) <> 'service_role' AND NOT (SELECT public.is_admin()) THEN
    RAISE EXCEPTION 'not_allowed';
  END IF;

  INSERT INTO public.sentiment_processing_queue (
    source_type, source_id, source_table, content, client_id, user_id, priority, metadata, status, created_at, updated_at
  ) VALUES (
    p_source_type, p_source_id, p_source_table, p_content, p_client_id, p_user_id, COALESCE(p_priority, 0), COALESCE(p_metadata, '{}'::jsonb), 'pending', now(), now()
  )
  ON CONFLICT (source_type, source_id)
  DO UPDATE SET
    content = EXCLUDED.content,
    client_id = EXCLUDED.client_id,
    user_id = EXCLUDED.user_id,
    priority = GREATEST(public.sentiment_processing_queue.priority, EXCLUDED.priority),
    metadata = public.sentiment_processing_queue.metadata || EXCLUDED.metadata,
    status = CASE WHEN public.sentiment_processing_queue.status IN ('completed','failed') THEN 'pending' ELSE public.sentiment_processing_queue.status END,
    updated_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_next_sentiment_queue_item()
RETURNS SETOF public.sentiment_processing_queue
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_catalog
AS $$
BEGIN
  IF (SELECT auth.role()) <> 'service_role' AND NOT (SELECT public.is_admin()) THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH next_item AS (
    SELECT id
    FROM public.sentiment_processing_queue
    WHERE status = 'pending'
    ORDER BY priority DESC, created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT 1
  )
  UPDATE public.sentiment_processing_queue q
  SET status = 'processing', updated_at = now()
  FROM next_item
  WHERE q.id = next_item.id
  RETURNING q.*;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_sentiment_stat(
  p_stat_id uuid,
  p_sentiment_field text,
  p_source_field text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_catalog
AS $$
DECLARE
  sql text;
BEGIN
  IF (SELECT auth.role()) <> 'service_role' AND NOT (SELECT public.is_admin()) THEN
    RAISE EXCEPTION 'not_allowed';
  END IF;

  -- incrementa total_analyses + campo de sentimento + campo de origem
  sql := format(
    'UPDATE public.sentiment_daily_stats
     SET total_analyses = total_analyses + 1,
         %I = %I + 1,
         %I = %I + 1,
         updated_at = now()
     WHERE id = $1',
    p_sentiment_field, p_sentiment_field,
    p_source_field, p_source_field
  );
  EXECUTE sql USING p_stat_id;
END;
$$;

-- =========================
-- 4) RLS (admin/service role)
-- =========================

ALTER TABLE public.sentiment_processing_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sentiment_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sentiment_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sentiment_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sentiment_automation_config ENABLE ROW LEVEL SECURITY;

-- Admin/service_role: full access
DROP POLICY IF EXISTS sentiment_processing_queue_admin_all ON public.sentiment_processing_queue;
CREATE POLICY sentiment_processing_queue_admin_all
  ON public.sentiment_processing_queue
  FOR ALL
  TO authenticated
  USING ((SELECT auth.role()) = 'service_role' OR (SELECT public.is_admin()))
  WITH CHECK ((SELECT auth.role()) = 'service_role' OR (SELECT public.is_admin()));

DROP POLICY IF EXISTS sentiment_analyses_admin_all ON public.sentiment_analyses;
CREATE POLICY sentiment_analyses_admin_all
  ON public.sentiment_analyses
  FOR ALL
  TO authenticated
  USING ((SELECT auth.role()) = 'service_role' OR (SELECT public.is_admin()))
  WITH CHECK ((SELECT auth.role()) = 'service_role' OR (SELECT public.is_admin()));

DROP POLICY IF EXISTS sentiment_alerts_admin_all ON public.sentiment_alerts;
CREATE POLICY sentiment_alerts_admin_all
  ON public.sentiment_alerts
  FOR ALL
  TO authenticated
  USING ((SELECT auth.role()) = 'service_role' OR (SELECT public.is_admin()))
  WITH CHECK ((SELECT auth.role()) = 'service_role' OR (SELECT public.is_admin()));

DROP POLICY IF EXISTS sentiment_daily_stats_admin_all ON public.sentiment_daily_stats;
CREATE POLICY sentiment_daily_stats_admin_all
  ON public.sentiment_daily_stats
  FOR ALL
  TO authenticated
  USING ((SELECT auth.role()) = 'service_role' OR (SELECT public.is_admin()))
  WITH CHECK ((SELECT auth.role()) = 'service_role' OR (SELECT public.is_admin()));

DROP POLICY IF EXISTS sentiment_automation_config_admin_all ON public.sentiment_automation_config;
CREATE POLICY sentiment_automation_config_admin_all
  ON public.sentiment_automation_config
  FOR ALL
  TO authenticated
  USING ((SELECT auth.role()) = 'service_role' OR (SELECT public.is_admin()))
  WITH CHECK ((SELECT auth.role()) = 'service_role' OR (SELECT public.is_admin()));



