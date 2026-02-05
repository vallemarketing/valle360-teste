-- =====================================================================================
-- FIX: Adicionar coluna escalation_level que estava faltando
-- =====================================================================================

-- Adicionar coluna escalation_level se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'payment_default_predictions' 
    AND column_name = 'escalation_level'
  ) THEN
    ALTER TABLE public.payment_default_predictions
    ADD COLUMN escalation_level text DEFAULT 'none' 
    CHECK (escalation_level IN ('none', 'reminder', 'formal_notice', 'legal', 'collection'));
    
    RAISE NOTICE '✅ Coluna escalation_level adicionada com sucesso!';
  ELSE
    RAISE NOTICE '⚠️ Coluna escalation_level já existe!';
  END IF;
END $$;

-- Criar índice se não existir
CREATE INDEX IF NOT EXISTS idx_payment_default_predictions_escalation 
ON public.payment_default_predictions(escalation_level);

-- Adicionar comentário
COMMENT ON COLUMN public.payment_default_predictions.escalation_level 
IS 'Nível de escalação: none, reminder, formal_notice, legal, collection';

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Fix aplicado com sucesso!';
  RAISE NOTICE '📋 Coluna escalation_level agora está disponível na tabela payment_default_predictions';
END $$;
