-- Adicionar colunas data e horario à tabela instagram_posts
ALTER TABLE public.instagram_posts
ADD COLUMN IF NOT EXISTS data DATE,
ADD COLUMN IF NOT EXISTS horario TIME;

-- Criar índices para busca
CREATE INDEX IF NOT EXISTS idx_instagram_posts_data ON public.instagram_posts (data);
CREATE INDEX IF NOT EXISTS idx_instagram_posts_horario ON public.instagram_posts (horario);

-- Comentários
COMMENT ON COLUMN public.instagram_posts.data IS 'Data do agendamento (formato: YYYY-MM-DD)';
COMMENT ON COLUMN public.instagram_posts.horario IS 'Horário do agendamento (formato: HH:MM:SS)';
