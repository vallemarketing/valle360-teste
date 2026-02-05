-- =====================================================
-- MIGRATION: Brand Memory / RAG (pgvector)
-- Objetivo: Memória de marca multi-tenant para uso por agentes (CrewAI)
-- =====================================================

-- 1) Habilitar pgvector
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- 2) Tabelas: documentos e chunks com embeddings
CREATE TABLE IF NOT EXISTS public.brand_memory_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,

  title text,
  source_type text DEFAULT 'manual' CHECK (source_type IN ('manual','upload','url','pdf','doc')),
  source_ref text,

  raw_text text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

  created_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brand_memory_documents_client
  ON public.brand_memory_documents (client_id, created_at DESC);

DROP TRIGGER IF EXISTS trg_brand_memory_documents_updated_at ON public.brand_memory_documents;
CREATE TRIGGER trg_brand_memory_documents_updated_at
  BEFORE UPDATE ON public.brand_memory_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.brand_memory_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES public.brand_memory_documents(id) ON DELETE CASCADE,

  chunk_index integer NOT NULL DEFAULT 0,
  content text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- dimensão padrão: 1536 (ex.: text-embedding-3-small)
  embedding extensions.vector(1536),

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_brand_memory_chunks_doc_chunk
  ON public.brand_memory_chunks (document_id, chunk_index);

CREATE INDEX IF NOT EXISTS idx_brand_memory_chunks_client
  ON public.brand_memory_chunks (client_id, created_at DESC);

-- Índice vetorial (cosine). OBS: ivfflat requer ANALYZE/ajuste de lists; mantemos simples por enquanto.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_am WHERE amname = 'ivfflat') THEN
    EXECUTE $q$
      CREATE INDEX IF NOT EXISTS idx_brand_memory_chunks_embedding
        ON public.brand_memory_chunks
        USING ivfflat (embedding extensions.vector_cosine_ops)
        WITH (lists = 100)
    $q$;
  END IF;
END $$;

-- 3) RLS
ALTER TABLE public.brand_memory_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_memory_documents FORCE ROW LEVEL SECURITY;
ALTER TABLE public.brand_memory_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_memory_chunks FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS brand_memory_documents_admin_all ON public.brand_memory_documents;
DROP POLICY IF EXISTS brand_memory_documents_client_read_own ON public.brand_memory_documents;
DROP POLICY IF EXISTS brand_memory_documents_employee_read ON public.brand_memory_documents;
DROP POLICY IF EXISTS brand_memory_documents_employee_write ON public.brand_memory_documents;

CREATE POLICY brand_memory_documents_admin_all
  ON public.brand_memory_documents
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY brand_memory_documents_client_read_own
  ON public.brand_memory_documents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = brand_memory_documents.client_id
        AND c.user_id = auth.uid()
    )
  );

CREATE POLICY brand_memory_documents_employee_read
  ON public.brand_memory_documents
  FOR SELECT
  TO authenticated
  USING (
    is_employee()
    AND (employee_area_keys() && ARRAY['social_media','head_marketing']::text[])
  );

CREATE POLICY brand_memory_documents_employee_write
  ON public.brand_memory_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_employee()
    AND (employee_area_keys() && ARRAY['social_media','head_marketing']::text[])
  );

DROP POLICY IF EXISTS brand_memory_chunks_admin_all ON public.brand_memory_chunks;
DROP POLICY IF EXISTS brand_memory_chunks_client_read_own ON public.brand_memory_chunks;
DROP POLICY IF EXISTS brand_memory_chunks_employee_read ON public.brand_memory_chunks;
DROP POLICY IF EXISTS brand_memory_chunks_employee_write ON public.brand_memory_chunks;

CREATE POLICY brand_memory_chunks_admin_all
  ON public.brand_memory_chunks
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY brand_memory_chunks_client_read_own
  ON public.brand_memory_chunks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = brand_memory_chunks.client_id
        AND c.user_id = auth.uid()
    )
  );

CREATE POLICY brand_memory_chunks_employee_read
  ON public.brand_memory_chunks
  FOR SELECT
  TO authenticated
  USING (
    is_employee()
    AND (employee_area_keys() && ARRAY['social_media','head_marketing']::text[])
  );

CREATE POLICY brand_memory_chunks_employee_write
  ON public.brand_memory_chunks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_employee()
    AND (employee_area_keys() && ARRAY['social_media','head_marketing']::text[])
  );

-- 4) Função de busca vetorial (cosine)
CREATE OR REPLACE FUNCTION public.match_brand_memory_chunks(
  p_client_id uuid,
  query_embedding extensions.vector,
  match_count int DEFAULT 8,
  similarity_threshold float DEFAULT 0.70
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  chunk_index int,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    c.id,
    c.document_id,
    c.chunk_index,
    c.content,
    c.metadata,
    (1 - (c.embedding <=> query_embedding))::float AS similarity
  FROM public.brand_memory_chunks c
  WHERE c.client_id = p_client_id
    AND c.embedding IS NOT NULL
    AND (1 - (c.embedding <=> query_embedding)) >= similarity_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
$$;

