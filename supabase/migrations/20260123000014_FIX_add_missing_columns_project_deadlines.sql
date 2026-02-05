-- =====================================================================================
-- FIX: Adicionar colunas que estavam faltando em project_deadline_predictions
-- =====================================================================================

-- Adicionar colunas faltantes
DO $$ 
BEGIN
  -- progress_status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'project_deadline_predictions' 
    AND column_name = 'progress_status'
  ) THEN
    ALTER TABLE public.project_deadline_predictions
    ADD COLUMN progress_status text CHECK (progress_status IN ('ahead', 'on_track', 'slightly_behind', 'significantly_behind', 'critical'));
    RAISE NOTICE '✅ Coluna progress_status adicionada!';
  END IF;
  
  -- resource_adequacy
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'project_deadline_predictions' 
    AND column_name = 'resource_adequacy'
  ) THEN
    ALTER TABLE public.project_deadline_predictions
    ADD COLUMN resource_adequacy text CHECK (resource_adequacy IN ('insufficient', 'adequate', 'optimal', 'over_allocated'));
    RAISE NOTICE '✅ Coluna resource_adequacy adicionada!';
  END IF;
  
  -- team_experience_level
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'project_deadline_predictions' 
    AND column_name = 'team_experience_level'
  ) THEN
    ALTER TABLE public.project_deadline_predictions
    ADD COLUMN team_experience_level text CHECK (team_experience_level IN ('junior', 'mid', 'senior', 'expert'));
    RAISE NOTICE '✅ Coluna team_experience_level adicionada!';
  END IF;
  
  -- client_responsiveness
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'project_deadline_predictions' 
    AND column_name = 'client_responsiveness'
  ) THEN
    ALTER TABLE public.project_deadline_predictions
    ADD COLUMN client_responsiveness text CHECK (client_responsiveness IN ('excellent', 'good', 'fair', 'poor', 'critical'));
    RAISE NOTICE '✅ Coluna client_responsiveness adicionada!';
  END IF;
  
  -- benchmark_comparison
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'project_deadline_predictions' 
    AND column_name = 'benchmark_comparison'
  ) THEN
    ALTER TABLE public.project_deadline_predictions
    ADD COLUMN benchmark_comparison text CHECK (benchmark_comparison IN ('faster', 'typical', 'slower'));
    RAISE NOTICE '✅ Coluna benchmark_comparison adicionada!';
  END IF;
END $$;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_project_deadline_predictions_progress_status 
ON public.project_deadline_predictions(progress_status);

-- Adicionar comentários
COMMENT ON COLUMN public.project_deadline_predictions.progress_status 
IS 'Status: ahead, on_track, slightly_behind, significantly_behind, critical';

COMMENT ON COLUMN public.project_deadline_predictions.resource_adequacy 
IS 'Adequação de recursos: insufficient, adequate, optimal, over_allocated';

COMMENT ON COLUMN public.project_deadline_predictions.team_experience_level 
IS 'Nível de experiência da equipe: junior, mid, senior, expert';

COMMENT ON COLUMN public.project_deadline_predictions.client_responsiveness 
IS 'Responsividade do cliente: excellent, good, fair, poor, critical';

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Fix aplicado com sucesso!';
  RAISE NOTICE '📋 Colunas adicionadas à tabela project_deadline_predictions';
END $$;
