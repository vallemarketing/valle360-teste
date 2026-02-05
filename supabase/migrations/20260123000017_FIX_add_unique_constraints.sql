-- =====================================================================================
-- FIX: Adicionar UNIQUE constraint para ON CONFLICT funcionar
-- =====================================================================================

-- Para client_churn_predictions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'client_churn_predictions_client_id_key'
  ) THEN
    ALTER TABLE public.client_churn_predictions
    ADD CONSTRAINT client_churn_predictions_client_id_key UNIQUE (client_id);
    RAISE NOTICE '✅ Constraint UNIQUE adicionada em client_churn_predictions!';
  END IF;
END $$;

-- Para client_ltv_predictions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'client_ltv_predictions_client_id_key'
  ) THEN
    ALTER TABLE public.client_ltv_predictions
    ADD CONSTRAINT client_ltv_predictions_client_id_key UNIQUE (client_id);
    RAISE NOTICE '✅ Constraint UNIQUE adicionada em client_ltv_predictions!';
  END IF;
END $$;

DO $$
BEGIN
  RAISE NOTICE '✅ Constraints criadas com sucesso!';
  RAISE NOTICE '📋 Agora você pode usar ON CONFLICT (client_id)';
END $$;
