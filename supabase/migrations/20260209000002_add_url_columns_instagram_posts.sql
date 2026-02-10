-- Adicionar colunas específicas para cada tipo de mídia
ALTER TABLE public.instagram_posts
ADD COLUMN IF NOT EXISTS url_imagem TEXT,
ADD COLUMN IF NOT EXISTS url_video TEXT,
ADD COLUMN IF NOT EXISTS url_carrossel JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS carrossel_type TEXT CHECK (carrossel_type IN ('image', 'video')),
ADD COLUMN IF NOT EXISTS cover_imagem TEXT;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_instagram_posts_url_imagem ON public.instagram_posts (url_imagem) WHERE url_imagem IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_instagram_posts_url_video ON public.instagram_posts (url_video) WHERE url_video IS NOT NULL;

-- Comentários
COMMENT ON COLUMN public.instagram_posts.url_imagem IS 'URL da imagem quando post_type = image';
COMMENT ON COLUMN public.instagram_posts.url_video IS 'URL do vídeo quando post_type = video';
COMMENT ON COLUMN public.instagram_posts.url_carrossel IS 'Array de URLs quando post_type = carousel';
COMMENT ON COLUMN public.instagram_posts.carrossel_type IS 'Tipo do carrossel: image ou video';
COMMENT ON COLUMN public.instagram_posts.cover_imagem IS 'Imagem de capa do carrossel (primeira imagem)';
