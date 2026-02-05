-- =====================================================================================
-- MIGRATION: Crew Memory System (3 níveis)
-- =====================================================================================
-- Cria estruturas para Short-Term, Mid-Term e Long-Term Memory
-- Short-term: Cache Redis (não precisa de tabela, mas backup aqui)
-- Mid-term: Histórico de campanhas e execuções
-- Long-term: Learnings, padrões de sucesso, benchmarks
-- =====================================================================================

-- =====================================================================================
-- SHORT-TERM MEMORY BACKUP (Redis backup)
-- =====================================================================================

CREATE TABLE IF NOT EXISTS public.crew_context_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  context_key text NOT NULL UNIQUE,
  context_data jsonb NOT NULL,
  ttl integer DEFAULT 3600, -- seconds
  created_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz DEFAULT (now() + interval '1 hour') NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_crew_context_cache_key ON public.crew_context_cache(context_key);
CREATE INDEX IF NOT EXISTS idx_crew_context_cache_expires ON public.crew_context_cache(expires_at);

COMMENT ON TABLE public.crew_context_cache IS 'Backup de contextos do Redis para recuperação';
COMMENT ON COLUMN public.crew_context_cache.context_key IS 'Chave única do contexto (ex: agent:agent-id:context)';
COMMENT ON COLUMN public.crew_context_cache.ttl IS 'Time to live em segundos';

-- =====================================================================================
-- MID-TERM MEMORY: Campaign History
-- =====================================================================================

CREATE TABLE IF NOT EXISTS public.crew_campaign_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  crew_id text NOT NULL,
  crew_name text NOT NULL,
  crew_type text NOT NULL,
  
  -- Execution details
  process_type text CHECK (process_type IN ('sequential', 'parallel', 'hierarchical')),
  total_tasks integer NOT NULL DEFAULT 0,
  completed_tasks integer NOT NULL DEFAULT 0,
  failed_tasks integer NOT NULL DEFAULT 0,
  
  -- Results
  final_output text,
  task_results jsonb DEFAULT '[]'::jsonb,
  
  -- Performance
  total_tokens integer DEFAULT 0,
  total_time_ms integer DEFAULT 0,
  success boolean DEFAULT true,
  error_message text,
  
  -- Context
  initial_context text,
  params jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_crew_history_client ON public.crew_campaign_history(client_id);
CREATE INDEX IF NOT EXISTS idx_crew_history_crew_type ON public.crew_campaign_history(crew_type);
CREATE INDEX IF NOT EXISTS idx_crew_history_created ON public.crew_campaign_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crew_history_success ON public.crew_campaign_history(success);

COMMENT ON TABLE public.crew_campaign_history IS 'Histórico completo de execuções de crews';
COMMENT ON COLUMN public.crew_campaign_history.task_results IS 'Array de resultados de cada tarefa (agent, output, tokens, etc)';

-- =====================================================================================
-- MID-TERM MEMORY: Agent Interactions Log
-- =====================================================================================

CREATE TABLE IF NOT EXISTS public.crew_agent_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_history_id uuid REFERENCES public.crew_campaign_history(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  
  agent_id text NOT NULL,
  agent_name text NOT NULL,
  agent_role text NOT NULL,
  
  task_id text,
  task_description text,
  
  -- Execution
  output text NOT NULL,
  tokens_used integer DEFAULT 0,
  execution_time_ms integer DEFAULT 0,
  
  -- Quality
  reflection_score decimal(3,1), -- 0-10
  reflection_confidence decimal(5,2), -- 0-100
  was_corrected boolean DEFAULT false,
  fallback_used boolean DEFAULT false,
  
  -- Tools used
  tools_called text[] DEFAULT '{}',
  
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_agent_interactions_campaign ON public.crew_agent_interactions(campaign_history_id);
CREATE INDEX IF NOT EXISTS idx_agent_interactions_client ON public.crew_agent_interactions(client_id);
CREATE INDEX IF NOT EXISTS idx_agent_interactions_agent ON public.crew_agent_interactions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_interactions_created ON public.crew_agent_interactions(created_at DESC);

COMMENT ON TABLE public.crew_agent_interactions IS 'Log detalhado de cada interação de agente';

-- =====================================================================================
-- LONG-TERM MEMORY: Learnings (com pgvector)
-- =====================================================================================

-- Habilitar pgvector se ainda não estiver
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS public.crew_learnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  
  -- Learning details
  type text NOT NULL CHECK (type IN (
    'successful_strategy',
    'failed_approach',
    'best_practice',
    'client_preference',
    'performance_insight',
    'optimization_tip'
  )),
  content text NOT NULL,
  context text,
  
  -- Performance association
  performance_score decimal(5,2), -- 0-100
  campaigns_count integer DEFAULT 1,
  
  -- Vector for similarity search
  embedding vector(1536), -- OpenAI text-embedding-3-small
  
  -- Metadata
  tags text[] DEFAULT '{}',
  confidence decimal(5,2) DEFAULT 70.0, -- 0-100
  
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  last_used_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_crew_learnings_client ON public.crew_learnings(client_id);
CREATE INDEX IF NOT EXISTS idx_crew_learnings_type ON public.crew_learnings(type);
CREATE INDEX IF NOT EXISTS idx_crew_learnings_created ON public.crew_learnings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crew_learnings_performance ON public.crew_learnings(performance_score DESC);

-- Vector similarity index
CREATE INDEX IF NOT EXISTS idx_crew_learnings_embedding 
ON public.crew_learnings USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

COMMENT ON TABLE public.crew_learnings IS 'Learnings de longo prazo com busca por similaridade (pgvector)';
COMMENT ON COLUMN public.crew_learnings.embedding IS 'Vector embedding para similarity search';

-- =====================================================================================
-- LONG-TERM MEMORY: Success Patterns
-- =====================================================================================

CREATE TABLE IF NOT EXISTS public.crew_success_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  
  -- Pattern details
  pattern_name text NOT NULL,
  pattern_description text NOT NULL,
  
  -- What works
  agents_combination text[] NOT NULL,
  crew_structure text NOT NULL, -- 'sequential', 'parallel', 'hierarchical'
  typical_params jsonb DEFAULT '{}'::jsonb,
  
  -- Performance
  success_rate decimal(5,2) NOT NULL, -- 0-100
  avg_performance_score decimal(5,2), -- 0-100
  times_used integer DEFAULT 0,
  
  -- Context
  best_for_contexts text[] DEFAULT '{}',
  industry text,
  
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_success_patterns_client ON public.crew_success_patterns(client_id);
CREATE INDEX IF NOT EXISTS idx_success_patterns_success_rate ON public.crew_success_patterns(success_rate DESC);
CREATE INDEX IF NOT EXISTS idx_success_patterns_industry ON public.crew_success_patterns(industry);

COMMENT ON TABLE public.crew_success_patterns IS 'Padrões de sucesso identificados automaticamente';

-- =====================================================================================
-- LONG-TERM MEMORY: Benchmarks por Indústria
-- =====================================================================================

CREATE TABLE IF NOT EXISTS public.crew_industry_benchmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  industry text NOT NULL,
  content_type text NOT NULL, -- 'instagram_post', 'linkedin_article', etc
  
  -- Benchmarks
  avg_engagement_rate decimal(5,2),
  avg_reach integer,
  avg_clicks integer,
  avg_conversions integer,
  best_time_to_post time,
  best_day_to_post integer, -- 0-6 (Sunday-Saturday)
  
  -- Metadata
  sample_size integer DEFAULT 0,
  data_updated_at timestamptz DEFAULT now(),
  
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  UNIQUE(industry, content_type)
);

CREATE INDEX IF NOT EXISTS idx_industry_benchmarks_industry ON public.crew_industry_benchmarks(industry);
CREATE INDEX IF NOT EXISTS idx_industry_benchmarks_type ON public.crew_industry_benchmarks(content_type);

COMMENT ON TABLE public.crew_industry_benchmarks IS 'Benchmarks de performance por indústria';

-- =====================================================================================
-- FUNCTION: Match Learnings (Similarity Search)
-- =====================================================================================

CREATE OR REPLACE FUNCTION match_crew_learnings(
  query_embedding vector(1536),
  match_count integer DEFAULT 5,
  filter_client_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  client_id uuid,
  type text,
  content text,
  context text,
  performance_score decimal,
  confidence decimal,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cl.id,
    cl.client_id,
    cl.type,
    cl.content,
    cl.context,
    cl.performance_score,
    cl.confidence,
    1 - (cl.embedding <=> query_embedding) as similarity
  FROM crew_learnings cl
  WHERE 
    (filter_client_id IS NULL OR cl.client_id = filter_client_id)
  ORDER BY cl.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION match_crew_learnings IS 'Busca learnings por similaridade vetorial';

-- =====================================================================================
-- TRIGGERS: Updated_at
-- =====================================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_crew_learnings_updated_at
  BEFORE UPDATE ON public.crew_learnings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_success_patterns_updated_at
  BEFORE UPDATE ON public.crew_success_patterns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_industry_benchmarks_updated_at
  BEFORE UPDATE ON public.crew_industry_benchmarks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================================================
-- RLS POLICIES
-- =====================================================================================

-- Campaign History
ALTER TABLE public.crew_campaign_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all campaign history"
  ON public.crew_campaign_history FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Clients can view their own campaign history"
  ON public.crew_campaign_history FOR SELECT
  TO authenticated
  USING (client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()));

-- Agent Interactions
ALTER TABLE public.crew_agent_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all agent interactions"
  ON public.crew_agent_interactions FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Learnings
ALTER TABLE public.crew_learnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all learnings"
  ON public.crew_learnings FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Success Patterns
ALTER TABLE public.crew_success_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all success patterns"
  ON public.crew_success_patterns FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Industry Benchmarks (público para leitura)
ALTER TABLE public.crew_industry_benchmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view industry benchmarks"
  ON public.crew_industry_benchmarks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage industry benchmarks"
  ON public.crew_industry_benchmarks FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- =====================================================================================
-- VIEWS: Analytics
-- =====================================================================================

CREATE OR REPLACE VIEW v_crew_performance_summary AS
SELECT
  client_id,
  crew_type,
  COUNT(*) as total_executions,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_executions,
  ROUND(AVG(CASE WHEN success THEN 100.0 ELSE 0.0 END), 2) as success_rate,
  ROUND(AVG(total_tokens), 0) as avg_tokens_used,
  ROUND(AVG(total_time_ms / 1000.0), 2) as avg_time_seconds,
  MAX(created_at) as last_execution_at
FROM crew_campaign_history
GROUP BY client_id, crew_type;

COMMENT ON VIEW v_crew_performance_summary IS 'Resumo de performance por cliente e tipo de crew';

-- =====================================================================================
-- SUCCESS MESSAGE
-- =====================================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 20260124000001: Crew Memory System criado com sucesso!';
  RAISE NOTICE '📊 Tabelas criadas:';
  RAISE NOTICE '   - crew_context_cache (Short-term backup)';
  RAISE NOTICE '   - crew_campaign_history (Mid-term)';
  RAISE NOTICE '   - crew_agent_interactions (Mid-term logs)';
  RAISE NOTICE '   - crew_learnings (Long-term com pgvector)';
  RAISE NOTICE '   - crew_success_patterns (Long-term padrões)';
  RAISE NOTICE '   - crew_industry_benchmarks (Long-term benchmarks)';
  RAISE NOTICE '🔍 Função match_crew_learnings() criada para similarity search';
  RAISE NOTICE '📈 View v_crew_performance_summary criada';
END $$;
