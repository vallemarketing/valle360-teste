-- Criar tabela espelho de posts do InstagramBack (para relatórios/integrações internas)

CREATE TABLE IF NOT EXISTS public.instagram_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id text UNIQUE,
  post_type text NOT NULL CHECK (post_type IN ('image', 'video', 'carousel')),
  caption text,
  collaborators text,
  status text,
  scheduled_at timestamptz,
  media_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  raw_payload jsonb
);

COMMENT ON TABLE public.instagram_posts IS 'Espelho interno dos posts do InstagramBack (Upload/Posts).';

CREATE INDEX IF NOT EXISTS idx_instagram_posts_created_at ON public.instagram_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_instagram_posts_scheduled_at ON public.instagram_posts (scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_instagram_posts_status ON public.instagram_posts (status);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_instagram_posts_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_instagram_posts_updated_at ON public.instagram_posts;
CREATE TRIGGER trigger_instagram_posts_updated_at
  BEFORE UPDATE ON public.instagram_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_instagram_posts_updated_at();

-- RLS
ALTER TABLE public.instagram_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_posts FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS instagram_posts_admin_all ON public.instagram_posts;
DROP POLICY IF EXISTS instagram_posts_employee_all ON public.instagram_posts;

CREATE POLICY instagram_posts_admin_all
  ON public.instagram_posts
  FOR ALL
  TO public
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY instagram_posts_employee_all
  ON public.instagram_posts
  FOR ALL
  TO public
  USING (
    is_employee()
    AND (employee_area_keys() && ARRAY['social_media','head_marketing']::text[])
  )
  WITH CHECK (
    is_employee()
    AND (employee_area_keys() && ARRAY['social_media','head_marketing']::text[])
  );



