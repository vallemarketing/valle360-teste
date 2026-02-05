-- =====================================================
-- MIGRATION: Sistema de Fidelidade e Indicação
-- Descrição: Sistema completo de indicação de clientes pelos colaboradores
-- =====================================================

-- =====================================================
-- 1. TABELA: employee_referral_program
-- Programa de indicação do colaborador
-- =====================================================

CREATE TABLE IF NOT EXISTS employee_referral_program (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Cupom único
  referral_code VARCHAR(50) UNIQUE NOT NULL,
  
  -- Estatísticas
  times_used INTEGER DEFAULT 0,
  total_earned NUMERIC(10, 2) DEFAULT 0.00,
  pending_amount NUMERIC(10, 2) DEFAULT 0.00,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Compartilhamentos
  shares_count INTEGER DEFAULT 0,
  last_shared_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_referral_program_employee ON employee_referral_program(employee_id);
CREATE INDEX idx_referral_program_code ON employee_referral_program(referral_code);
CREATE INDEX idx_referral_program_active ON employee_referral_program(is_active) WHERE is_active = true;

COMMENT ON TABLE employee_referral_program IS 'Programa de indicação de clientes pelos colaboradores';

-- =====================================================
-- 2. TABELA: employee_referrals
-- Indicações realizadas
-- =====================================================

CREATE TABLE IF NOT EXISTS employee_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  
  referral_code VARCHAR(50) NOT NULL,
  
  -- Informações do lead
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255),
  client_phone VARCHAR(50),
  client_company VARCHAR(255),
  
  -- Valor do contrato
  contract_value NUMERIC(10, 2),
  commission_percentage NUMERIC(5, 2) DEFAULT 10.00,
  commission_amount NUMERIC(10, 2),
  
  -- Status da indicação
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending', -- Lead em negociação
    'qualified', -- Lead qualificado
    'proposal_sent', -- Proposta enviada
    'contract_signed', -- Contrato assinado
    'paid', -- Comissão paga
    'cancelled', -- Cancelado
    'expired' -- Expirado (sem resposta)
  )),
  
  -- Datas importantes
  referred_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  qualified_at TIMESTAMP WITH TIME ZONE,
  proposal_sent_at TIMESTAMP WITH TIME ZONE,
  contract_signed_at TIMESTAMP WITH TIME ZONE,
  commission_paid_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  -- Pagamento
  payment_month VARCHAR(7), -- "2024-12"
  payment_reference VARCHAR(100),
  
  -- Notas e observações
  notes TEXT,
  cancellation_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_referrals_employee ON employee_referrals(employee_id);
CREATE INDEX idx_referrals_client ON employee_referrals(client_id);
CREATE INDEX idx_referrals_code ON employee_referrals(referral_code);
CREATE INDEX idx_referrals_status ON employee_referrals(status);
CREATE INDEX idx_referrals_payment_month ON employee_referrals(payment_month);

COMMENT ON TABLE employee_referrals IS 'Indicações de clientes realizadas pelos colaboradores';

-- =====================================================
-- 3. TABELA: employee_referral_shares
-- Rastreamento de compartilhamentos do cupom
-- =====================================================

CREATE TABLE IF NOT EXISTS employee_referral_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  referral_code VARCHAR(50) NOT NULL,
  
  -- Canal de compartilhamento
  channel VARCHAR(20) NOT NULL CHECK (channel IN ('whatsapp', 'email', 'link', 'sms', 'linkedin', 'instagram', 'other')),
  
  -- Destinatário (se aplicável)
  recipient_name VARCHAR(255),
  recipient_contact VARCHAR(255),
  
  -- Tracking
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  clicked BOOLEAN DEFAULT false,
  clicked_at TIMESTAMP WITH TIME ZONE,
  
  -- Conversão
  converted BOOLEAN DEFAULT false,
  referral_id UUID REFERENCES employee_referrals(id) ON DELETE SET NULL
);

CREATE INDEX idx_referral_shares_employee ON employee_referral_shares(employee_id);
CREATE INDEX idx_referral_shares_code ON employee_referral_shares(referral_code);
CREATE INDEX idx_referral_shares_channel ON employee_referral_shares(channel);

COMMENT ON TABLE employee_referral_shares IS 'Rastreamento de compartilhamentos de cupons de indicação';

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER update_employee_referral_program_updated_at
  BEFORE UPDATE ON employee_referral_program
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_referrals_updated_at
  BEFORE UPDATE ON employee_referrals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION: Gerar Cupom de Indicação Único
-- =====================================================

CREATE OR REPLACE FUNCTION generate_referral_code(p_employee_id UUID)
RETURNS VARCHAR AS $$
DECLARE
  v_employee_name VARCHAR;
  v_first_name VARCHAR;
  v_random_suffix VARCHAR;
  v_referral_code VARCHAR;
  v_exists BOOLEAN;
BEGIN
  -- Buscar nome do colaborador
  SELECT up.full_name
  INTO v_employee_name
  FROM employees e
  JOIN user_profiles up ON up.id = e.user_id
  WHERE e.id = p_employee_id;
  
  -- Pegar primeiro nome (até o espaço)
  v_first_name := UPPER(SPLIT_PART(v_employee_name, ' ', 1));
  
  -- Remover acentos e caracteres especiais
  v_first_name := TRANSLATE(v_first_name, 
    'ÀÁÂÃÄÅĀĂĄÈÉÊËĒĔĖĘĚÌÍÎÏĪĬĮÒÓÔÕÖŌŎŐÙÚÛÜŪŬŮŰŲÇĆĈĊČ',
    'AAAAAAAAAEEEEEEEEEIIIIIIIOOOOOOOOOUUUUUUUUUCCCCC'
  );
  
  -- Gerar sufixo aleatório único
  LOOP
    v_random_suffix := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 6));
    v_referral_code := 'VALLE-' || v_first_name || '-' || v_random_suffix;
    
    -- Verificar se já existe
    SELECT EXISTS(SELECT 1 FROM employee_referral_program WHERE referral_code = v_referral_code)
    INTO v_exists;
    
    EXIT WHEN NOT v_exists;
  END LOOP;
  
  RETURN v_referral_code;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_referral_code IS 'Gera cupom de indicação único para colaborador';

-- =====================================================
-- FUNCTION: Criar Programa de Indicação para Colaborador
-- =====================================================

CREATE OR REPLACE FUNCTION create_employee_referral_program(p_employee_id UUID)
RETURNS VARCHAR AS $$
DECLARE
  v_referral_code VARCHAR;
BEGIN
  -- Verificar se já tem programa
  SELECT referral_code
  INTO v_referral_code
  FROM employee_referral_program
  WHERE employee_id = p_employee_id;
  
  IF v_referral_code IS NOT NULL THEN
    RETURN v_referral_code;
  END IF;
  
  -- Gerar novo cupom
  v_referral_code := generate_referral_code(p_employee_id);
  
  -- Inserir programa
  INSERT INTO employee_referral_program (
    employee_id,
    referral_code,
    is_active
  ) VALUES (
    p_employee_id,
    v_referral_code,
    true
  );
  
  RETURN v_referral_code;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_employee_referral_program IS 'Cria programa de indicação para colaborador';

-- =====================================================
-- FUNCTION: Calcular Comissão de Indicação
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_referral_commission(
  p_referral_id UUID,
  p_contract_value NUMERIC,
  p_commission_percentage NUMERIC DEFAULT 10.00
)
RETURNS NUMERIC AS $$
DECLARE
  v_commission_amount NUMERIC;
  v_employee_id UUID;
BEGIN
  -- Calcular comissão
  v_commission_amount := (p_contract_value * p_commission_percentage / 100);
  
  -- Atualizar indicação
  UPDATE employee_referrals
  SET 
    contract_value = p_contract_value,
    commission_percentage = p_commission_percentage,
    commission_amount = v_commission_amount,
    status = 'contract_signed',
    contract_signed_at = now(),
    payment_month = TO_CHAR(DATE_TRUNC('month', now() + INTERVAL '1 month'), 'YYYY-MM')
  WHERE id = p_referral_id
  RETURNING employee_id INTO v_employee_id;
  
  -- Atualizar programa do colaborador
  UPDATE employee_referral_program
  SET 
    times_used = times_used + 1,
    pending_amount = pending_amount + v_commission_amount,
    updated_at = now()
  WHERE employee_id = v_employee_id;
  
  RETURN v_commission_amount;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_referral_commission IS 'Calcula e registra comissão de indicação';

-- =====================================================
-- FUNCTION: Marcar Comissão como Paga
-- =====================================================

CREATE OR REPLACE FUNCTION mark_referral_commission_paid(
  p_referral_id UUID,
  p_payment_reference VARCHAR DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_commission_amount NUMERIC;
  v_employee_id UUID;
BEGIN
  -- Buscar informações da indicação
  SELECT commission_amount, employee_id
  INTO v_commission_amount, v_employee_id
  FROM employee_referrals
  WHERE id = p_referral_id;
  
  IF v_commission_amount IS NULL THEN
    RETURN false;
  END IF;
  
  -- Atualizar indicação
  UPDATE employee_referrals
  SET 
    status = 'paid',
    commission_paid_at = now(),
    payment_reference = p_payment_reference
  WHERE id = p_referral_id;
  
  -- Atualizar programa do colaborador
  UPDATE employee_referral_program
  SET 
    total_earned = total_earned + v_commission_amount,
    pending_amount = pending_amount - v_commission_amount,
    updated_at = now()
  WHERE employee_id = v_employee_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION mark_referral_commission_paid IS 'Marca comissão de indicação como paga';

-- =====================================================
-- FUNCTION: Registrar Compartilhamento de Cupom
-- =====================================================

CREATE OR REPLACE FUNCTION track_referral_share(
  p_employee_id UUID,
  p_channel VARCHAR,
  p_recipient_name VARCHAR DEFAULT NULL,
  p_recipient_contact VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_referral_code VARCHAR;
  v_share_id UUID;
BEGIN
  -- Buscar cupom do colaborador
  SELECT referral_code
  INTO v_referral_code
  FROM employee_referral_program
  WHERE employee_id = p_employee_id;
  
  IF v_referral_code IS NULL THEN
    -- Criar programa se não existir
    v_referral_code := create_employee_referral_program(p_employee_id);
  END IF;
  
  -- Registrar compartilhamento
  INSERT INTO employee_referral_shares (
    employee_id,
    referral_code,
    channel,
    recipient_name,
    recipient_contact
  ) VALUES (
    p_employee_id,
    v_referral_code,
    p_channel,
    p_recipient_name,
    p_recipient_contact
  ) RETURNING id INTO v_share_id;
  
  -- Atualizar contadores do programa
  UPDATE employee_referral_program
  SET 
    shares_count = shares_count + 1,
    last_shared_at = now()
  WHERE employee_id = p_employee_id;
  
  RETURN v_share_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION track_referral_share IS 'Registra compartilhamento de cupom de indicação';

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE employee_referral_program ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_referral_shares ENABLE ROW LEVEL SECURITY;

-- Colaborador vê apenas seu próprio programa
CREATE POLICY "Ver próprio programa de indicação"
  ON employee_referral_program FOR SELECT
  USING (
    employee_id = (SELECT id FROM employees WHERE user_id = auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type IN ('super_admin', 'hr', 'finance')
    )
  );

-- Colaborador vê apenas suas próprias indicações
CREATE POLICY "Ver próprias indicações"
  ON employee_referrals FOR SELECT
  USING (
    employee_id = (SELECT id FROM employees WHERE user_id = auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type IN ('super_admin', 'commercial', 'finance')
    )
  );

-- Colaborador insere suas próprias indicações
CREATE POLICY "Criar próprias indicações"
  ON employee_referrals FOR INSERT
  WITH CHECK (
    employee_id = (SELECT id FROM employees WHERE user_id = auth.uid())
  );

-- Comercial e Admin podem atualizar status
CREATE POLICY "Atualizar status de indicações"
  ON employee_referrals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type IN ('super_admin', 'commercial', 'finance')
    )
  );

-- =====================================================
-- SEED: Criar programas para colaboradores existentes
-- =====================================================

-- Criar programa de indicação para todos os colaboradores que ainda não têm
INSERT INTO employee_referral_program (employee_id, referral_code, is_active)
SELECT 
  e.id,
  'VALLE-' || UPPER(SPLIT_PART(up.full_name, ' ', 1)) || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6)),
  true
FROM employees e
JOIN user_profiles up ON up.id = e.user_id
WHERE NOT EXISTS (
  SELECT 1 FROM employee_referral_program WHERE employee_id = e.id
);

-- =====================================================
-- Fim da Migration: Sistema de Fidelidade e Indicação
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration: Sistema de Fidelidade e Indicação concluída!';
  RAISE NOTICE '🎁 3 tabelas criadas para programa de indicação';
  RAISE NOTICE '💰 Sistema completo de comissões e tracking';
END $$;











