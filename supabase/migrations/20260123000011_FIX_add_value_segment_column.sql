-- =====================================================================================
-- FIX: Adicionar coluna value_segment que estava faltando
-- =====================================================================================

-- Adicionar coluna value_segment se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'client_ltv_predictions' 
    AND column_name = 'value_segment'
  ) THEN
    ALTER TABLE public.client_ltv_predictions
    ADD COLUMN value_segment text CHECK (value_segment IN ('low', 'medium', 'high', 'vip'));
    
    RAISE NOTICE '✅ Coluna value_segment adicionada com sucesso!';
  ELSE
    RAISE NOTICE '⚠️ Coluna value_segment já existe!';
  END IF;
END $$;

-- Criar índice se não existir
CREATE INDEX IF NOT EXISTS idx_client_ltv_predictions_value_segment 
ON public.client_ltv_predictions(value_segment);

-- Adicionar comentário
COMMENT ON COLUMN public.client_ltv_predictions.value_segment 
IS 'Segmento de valor: low (<R$2k), medium (R$2-5k), high (R$5-10k), vip (>R$10k)';

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Fix aplicado com sucesso!';
  RAISE NOTICE '📋 Coluna value_segment agora está disponível na tabela client_ltv_predictions';
END $$;
