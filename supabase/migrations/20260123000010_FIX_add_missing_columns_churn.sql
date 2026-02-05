-- =====================================================================================
-- FIX: Adicionar colunas faltantes em client_churn_predictions
-- =====================================================================================

DO $$ 
BEGIN
  -- confidence_level
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'client_churn_predictions' 
    AND column_name = 'confidence_level'
  ) THEN
    ALTER TABLE public.client_churn_predictions
    ADD COLUMN confidence_level decimal(5,2) DEFAULT 50 CHECK (confidence_level >= 0 AND confidence_level <= 100);
    RAISE NOTICE '✅ Coluna confidence_level adicionada!';
  END IF;
  
  -- contributing_factors
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'client_churn_predictions' 
    AND column_name = 'contributing_factors'
  ) THEN
    ALTER TABLE public.client_churn_predictions
    ADD COLUMN contributing_factors jsonb DEFAULT '{}'::jsonb;
    RAISE NOTICE '✅ Coluna contributing_factors adicionada!';
  END IF;
  
  -- warning_signals
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'client_churn_predictions' 
    AND column_name = 'warning_signals'
  ) THEN
    ALTER TABLE public.client_churn_predictions
    ADD COLUMN warning_signals text[] DEFAULT '{}';
    RAISE NOTICE '✅ Coluna warning_signals adicionada!';
  END IF;
  
  -- recommended_actions
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'client_churn_predictions' 
    AND column_name = 'recommended_actions'
  ) THEN
    ALTER TABLE public.client_churn_predictions
    ADD COLUMN recommended_actions text[] DEFAULT '{}';
    RAISE NOTICE '✅ Coluna recommended_actions adicionada!';
  END IF;
  
  -- updated_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'client_churn_predictions' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.client_churn_predictions
    ADD COLUMN updated_at timestamptz DEFAULT NOW();
    RAISE NOTICE '✅ Coluna updated_at adicionada!';
  END IF;
END $$;

COMMENT ON COLUMN public.client_churn_predictions.confidence_level 
IS 'Nível de confiança da predição (0-100%)';

DO $$
BEGIN
  RAISE NOTICE '✅ Fix aplicado com sucesso!';
  RAISE NOTICE '📋 Colunas adicionadas à tabela client_churn_predictions';
END $$;
