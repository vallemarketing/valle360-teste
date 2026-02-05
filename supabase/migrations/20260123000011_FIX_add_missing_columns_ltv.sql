-- =====================================================================================
-- FIX: Adicionar colunas faltantes em client_ltv_predictions
-- =====================================================================================

DO $$ 
BEGIN
  -- estimated_upsell_value
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'client_ltv_predictions' 
    AND column_name = 'estimated_upsell_value'
  ) THEN
    ALTER TABLE public.client_ltv_predictions
    ADD COLUMN estimated_upsell_value decimal(10,2) DEFAULT 0;
    RAISE NOTICE '✅ Coluna estimated_upsell_value adicionada!';
  END IF;
  
  -- best_time_to_upsell
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'client_ltv_predictions' 
    AND column_name = 'best_time_to_upsell'
  ) THEN
    ALTER TABLE public.client_ltv_predictions
    ADD COLUMN best_time_to_upsell date;
    RAISE NOTICE '✅ Coluna best_time_to_upsell adicionada!';
  END IF;
  
  -- expansion_opportunities
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'client_ltv_predictions' 
    AND column_name = 'expansion_opportunities'
  ) THEN
    ALTER TABLE public.client_ltv_predictions
    ADD COLUMN expansion_opportunities text[] DEFAULT '{}';
    RAISE NOTICE '✅ Coluna expansion_opportunities adicionada!';
  END IF;
  
  -- calculation_factors
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'client_ltv_predictions' 
    AND column_name = 'calculation_factors'
  ) THEN
    ALTER TABLE public.client_ltv_predictions
    ADD COLUMN calculation_factors jsonb DEFAULT '{}'::jsonb;
    RAISE NOTICE '✅ Coluna calculation_factors adicionada!';
  END IF;
  
  -- updated_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'client_ltv_predictions' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.client_ltv_predictions
    ADD COLUMN updated_at timestamptz DEFAULT NOW();
    RAISE NOTICE '✅ Coluna updated_at adicionada!';
  END IF;
END $$;

COMMENT ON COLUMN public.client_ltv_predictions.estimated_upsell_value 
IS 'Valor estimado de upsell';

DO $$
BEGIN
  RAISE NOTICE '✅ Fix aplicado com sucesso!';
  RAISE NOTICE '📋 Colunas adicionadas à tabela client_ltv_predictions';
END $$;
