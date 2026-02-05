-- Expandir tabela instagram_posts para suportar Agendar Postagem (perfil/canais/backends/aprovação/boost)

ALTER TABLE public.instagram_posts
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id),
  ADD COLUMN IF NOT EXISTS platforms text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS channels jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS backend text NOT NULL DEFAULT 'instagramback' CHECK (backend IN ('instagramback','meta')),
  ADD COLUMN IF NOT EXISTS is_draft boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'approved' CHECK (approval_status IN ('pending','approved','changes_requested')),
  ADD COLUMN IF NOT EXISTS boost_requested boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS error_message text;

CREATE INDEX IF NOT EXISTS idx_instagram_posts_client_id ON public.instagram_posts (client_id);
CREATE INDEX IF NOT EXISTS idx_instagram_posts_backend ON public.instagram_posts (backend);
CREATE INDEX IF NOT EXISTS idx_instagram_posts_approval_status ON public.instagram_posts (approval_status);


