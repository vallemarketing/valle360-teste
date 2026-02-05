-- Epic 11: Persistir segmento/nicho e concorrentes do cliente
-- Safe migration: adiciona colunas sem quebrar ambientes com schema legacy.

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS segment text;

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS competitors text[];

-- Compat PT-BR (algumas telas usam "concorrentes" como texto livre)
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS concorrentes text;


