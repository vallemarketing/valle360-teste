-- =====================================================================================
-- FIX: Adicionar colunas que estavam faltando em hiring_needs_predictions
-- =====================================================================================

-- Adicionar colunas faltantes
DO $$ 
BEGIN
  -- prediction_period
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'hiring_needs_predictions' 
    AND column_name = 'prediction_period'
  ) THEN
    ALTER TABLE public.hiring_needs_predictions
    ADD COLUMN prediction_period text NOT NULL DEFAULT 'monthly' CHECK (prediction_period IN ('monthly', 'quarterly', 'annual'));
    RAISE NOTICE '✅ Coluna prediction_period adicionada!';
  END IF;
  
  -- priority_level
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'hiring_needs_predictions' 
    AND column_name = 'priority_level'
  ) THEN
    ALTER TABLE public.hiring_needs_predictions
    ADD COLUMN priority_level text DEFAULT 'low' CHECK (priority_level IN ('low', 'medium', 'high', 'urgent'));
    RAISE NOTICE '✅ Coluna priority_level adicionada!';
  END IF;
  
  -- capacity_status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'hiring_needs_predictions' 
    AND column_name = 'capacity_status'
  ) THEN
    ALTER TABLE public.hiring_needs_predictions
    ADD COLUMN capacity_status text CHECK (capacity_status IN ('underutilized', 'optimal', 'near_capacity', 'overloaded', 'critical'));
    RAISE NOTICE '✅ Coluna capacity_status adicionada!';
  END IF;
  
  -- hiring_urgency
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'hiring_needs_predictions' 
    AND column_name = 'hiring_urgency'
  ) THEN
    ALTER TABLE public.hiring_needs_predictions
    ADD COLUMN hiring_urgency text CHECK (hiring_urgency IN ('immediate', 'short_term', 'medium_term', 'long_term', 'optional'));
    RAISE NOTICE '✅ Coluna hiring_urgency adicionada!';
  END IF;
  
  -- benchmark_comparison
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'hiring_needs_predictions' 
    AND column_name = 'benchmark_comparison'
  ) THEN
    ALTER TABLE public.hiring_needs_predictions
    ADD COLUMN benchmark_comparison text CHECK (benchmark_comparison IN ('above', 'at', 'below'));
    RAISE NOTICE '✅ Coluna benchmark_comparison adicionada!';
  END IF;
END $$;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_hiring_needs_predictions_period 
ON public.hiring_needs_predictions(prediction_period);

CREATE INDEX IF NOT EXISTS idx_hiring_needs_predictions_priority 
ON public.hiring_needs_predictions(priority_level);

CREATE INDEX IF NOT EXISTS idx_hiring_needs_predictions_urgency 
ON public.hiring_needs_predictions(hiring_urgency);

CREATE INDEX IF NOT EXISTS idx_hiring_needs_predictions_capacity 
ON public.hiring_needs_predictions(capacity_status);

-- Adicionar comentários
COMMENT ON COLUMN public.hiring_needs_predictions.prediction_period 
IS 'Período da predição: monthly, quarterly, annual';

COMMENT ON COLUMN public.hiring_needs_predictions.priority_level 
IS 'Prioridade: low, medium, high, urgent';

COMMENT ON COLUMN public.hiring_needs_predictions.capacity_status 
IS 'Status de capacidade: underutilized, optimal, near_capacity, overloaded, critical';

COMMENT ON COLUMN public.hiring_needs_predictions.hiring_urgency 
IS 'Urgência de contratação: immediate, short_term, medium_term, long_term, optional';

COMMENT ON COLUMN public.hiring_needs_predictions.benchmark_comparison 
IS 'Comparação com benchmark: above (mais eficiente), at (na média), below (menos eficiente)';

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Fix aplicado com sucesso!';
  RAISE NOTICE '📋 Colunas adicionadas à tabela hiring_needs_predictions';
END $$;
