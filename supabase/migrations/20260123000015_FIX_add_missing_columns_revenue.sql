-- =====================================================================================
-- FIX: Adicionar colunas que estavam faltando em revenue_predictions
-- =====================================================================================

-- Adicionar colunas faltantes
DO $$ 
BEGIN
  -- prediction_period
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'revenue_predictions' 
    AND column_name = 'prediction_period'
  ) THEN
    ALTER TABLE public.revenue_predictions
    ADD COLUMN prediction_period text NOT NULL DEFAULT 'monthly' CHECK (prediction_period IN ('monthly', 'quarterly', 'annual'));
    RAISE NOTICE '✅ Coluna prediction_period adicionada!';
  END IF;
  
  -- market_conditions
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'revenue_predictions' 
    AND column_name = 'market_conditions'
  ) THEN
    ALTER TABLE public.revenue_predictions
    ADD COLUMN market_conditions text CHECK (market_conditions IN ('excellent', 'good', 'neutral', 'challenging', 'crisis'));
    RAISE NOTICE '✅ Coluna market_conditions adicionada!';
  END IF;
  
  -- performance_status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'revenue_predictions' 
    AND column_name = 'performance_status'
  ) THEN
    ALTER TABLE public.revenue_predictions
    ADD COLUMN performance_status text CHECK (performance_status IN ('exceeding', 'on_target', 'slightly_below', 'significantly_below', 'critical'));
    RAISE NOTICE '✅ Coluna performance_status adicionada!';
  END IF;
  
  -- trend
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'revenue_predictions' 
    AND column_name = 'trend'
  ) THEN
    ALTER TABLE public.revenue_predictions
    ADD COLUMN trend text CHECK (trend IN ('upward', 'stable', 'downward', 'volatile'));
    RAISE NOTICE '✅ Coluna trend adicionada!';
  END IF;
END $$;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_revenue_predictions_period 
ON public.revenue_predictions(prediction_period);

CREATE INDEX IF NOT EXISTS idx_revenue_predictions_status 
ON public.revenue_predictions(performance_status);

-- Adicionar comentários
COMMENT ON COLUMN public.revenue_predictions.prediction_period 
IS 'Período da predição: monthly, quarterly, annual';

COMMENT ON COLUMN public.revenue_predictions.market_conditions 
IS 'Condições de mercado: excellent, good, neutral, challenging, crisis';

COMMENT ON COLUMN public.revenue_predictions.performance_status 
IS 'Status de performance: exceeding, on_target, slightly_below, significantly_below, critical';

COMMENT ON COLUMN public.revenue_predictions.trend 
IS 'Tendência: upward, stable, downward, volatile';

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Fix aplicado com sucesso!';
  RAISE NOTICE '📋 Colunas adicionadas à tabela revenue_predictions';
END $$;
