-- =====================================================
-- Valle 360 - RH: Gestão de Vagas (Job Openings)
-- (sem mock; admin-only)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.job_openings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  title text NOT NULL,
  department text,
  location text,
  location_type text, -- remote | hybrid | onsite
  contract_type text, -- clt | pj | internship | freelance | etc
  status text NOT NULL DEFAULT 'draft', -- draft | active | paused | closed

  platforms text[] DEFAULT '{}'::text[], -- linkedin, website, etc
  applications_count integer NOT NULL DEFAULT 0,
  views_count integer NOT NULL DEFAULT 0,
  published_at timestamptz,

  job_post jsonb NOT NULL DEFAULT '{}'::jsonb, -- dados completos gerados pelo JobPostGenerator
  created_by uuid,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_openings_status ON public.job_openings(status);
CREATE INDEX IF NOT EXISTS idx_job_openings_department ON public.job_openings(department);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_job_openings_updated_at'
  ) THEN
    CREATE TRIGGER trg_job_openings_updated_at
    BEFORE UPDATE ON public.job_openings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

ALTER TABLE public.job_openings ENABLE ROW LEVEL SECURITY;

-- Admin-only (usa função já existente no projeto)
DROP POLICY IF EXISTS "job_openings_select_admin" ON public.job_openings;
CREATE POLICY "job_openings_select_admin"
ON public.job_openings
FOR SELECT
USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "job_openings_insert_admin" ON public.job_openings;
CREATE POLICY "job_openings_insert_admin"
ON public.job_openings
FOR INSERT
WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "job_openings_update_admin" ON public.job_openings;
CREATE POLICY "job_openings_update_admin"
ON public.job_openings
FOR UPDATE
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "job_openings_delete_admin" ON public.job_openings;
CREATE POLICY "job_openings_delete_admin"
ON public.job_openings
FOR DELETE
USING ((SELECT public.is_admin()));



