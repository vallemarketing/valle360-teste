-- =====================================================
-- MIGRATION: Sistema de Créditos e Financeiro do Cliente
-- Descrição: Créditos, saldo, benefícios, faturas e pagamentos
-- Dependências: 20251112000002_create_clients_system.sql
-- =====================================================

-- =====================================================
-- 1. TABELA: client_credit_balance
-- Saldo atual de créditos de cada cliente
-- =====================================================

CREATE TABLE IF NOT EXISTS client_credit_balance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Saldo
  current_balance DECIMAL(10, 2) DEFAULT 0 NOT NULL,
  total_purchased DECIMAL(10, 2) DEFAULT 0 NOT NULL,
  total_used DECIMAL(10, 2) DEFAULT 0 NOT NULL,
  
  -- Timestamps
  last_transaction_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_client_credit_balance_client_id ON client_credit_balance(client_id);
CREATE INDEX IF NOT EXISTS idx_client_credit_balance_updated ON client_credit_balance(updated_at DESC);

-- Comentários
COMMENT ON TABLE client_credit_balance IS 'Saldo consolidado de créditos de cada cliente';
COMMENT ON COLUMN client_credit_balance.current_balance IS 'Saldo disponível atual';

-- =====================================================
-- 2. TABELA: client_credits
-- Histórico de transações de créditos
-- =====================================================

CREATE TABLE IF NOT EXISTS client_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  
  -- Tipo de transação
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('recharge', 'usage', 'adjustment', 'refund')),
  
  -- Descrição
  description TEXT NOT NULL,
  
  -- Valores
  amount DECIMAL(10, 2) NOT NULL,
  balance_after DECIMAL(10, 2) NOT NULL,
  
  -- Referência (opcional - link para campanha, etc)
  reference_type VARCHAR(50),
  reference_id UUID,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_client_credits_client_id ON client_credits(client_id);
CREATE INDEX IF NOT EXISTS idx_client_credits_transaction_type ON client_credits(transaction_type);
CREATE INDEX IF NOT EXISTS idx_client_credits_created_at ON client_credits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_credits_reference ON client_credits(reference_type, reference_id);

-- Comentários
COMMENT ON TABLE client_credits IS 'Histórico completo de todas as transações de créditos dos clientes';
COMMENT ON COLUMN client_credits.balance_after IS 'Saldo após esta transação (para auditoria)';

-- =====================================================
-- 3. TABELA: client_benefits
-- Benefícios e descontos do cliente
-- =====================================================

CREATE TABLE IF NOT EXISTS client_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  
  -- Tipo de benefício
  benefit_type VARCHAR(50) NOT NULL CHECK (benefit_type IN ('loyalty_discount', 'referral_discount', 'annual_payment_discount', 'custom')),
  
  -- Detalhes
  benefit_name VARCHAR(255) NOT NULL,
  benefit_value DECIMAL(10, 2) NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Indicações (se aplicável)
  referral_count INTEGER DEFAULT 0,
  
  -- Período de validade
  start_date DATE NOT NULL,
  end_date DATE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_client_benefits_client_id ON client_benefits(client_id);
CREATE INDEX IF NOT EXISTS idx_client_benefits_active ON client_benefits(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_client_benefits_type ON client_benefits(benefit_type);
CREATE INDEX IF NOT EXISTS idx_client_benefits_dates ON client_benefits(start_date, end_date);

-- Comentários
COMMENT ON TABLE client_benefits IS 'Benefícios, descontos e vantagens concedidas aos clientes';

-- =====================================================
-- 4. TABELA: invoices
-- Faturas dos clientes
-- =====================================================

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  
  -- Identificação
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- Datas
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  
  -- Valores
  value DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'BRL' NOT NULL,
  
  -- Status
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'partial', 'paid', 'overdue', 'cancelled')),
  
  -- Arquivo
  pdf_url TEXT,
  
  -- Observações
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date DESC);

-- Comentários
COMMENT ON TABLE invoices IS 'Faturas emitidas para os clientes';
COMMENT ON COLUMN invoices.status IS 'Status: open (aberta), partial (parcialmente paga), paid (paga), overdue (vencida), cancelled (cancelada)';

-- =====================================================
-- 5. TABELA: payments
-- Pagamentos realizados
-- =====================================================

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  
  -- Método de pagamento
  payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('credit_card', 'debit_card', 'bank_transfer', 'pix', 'boleto', 'cash')),
  
  -- Valor
  amount DECIMAL(10, 2) NOT NULL,
  
  -- Gateway de pagamento
  payment_gateway VARCHAR(50) CHECK (payment_gateway IN ('mercadopago', 'stripe', 'manual')),
  
  -- ID da transação no gateway
  transaction_id TEXT,
  confirmation_code TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  error_message TEXT,
  
  -- Observações
  notes TEXT,
  
  -- Comprovante
  receipt_url TEXT,
  
  -- Timestamps
  paid_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON payments(paid_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(payment_method);

-- Comentários
COMMENT ON TABLE payments IS 'Pagamentos realizados pelos clientes (vinculados a faturas)';

-- =====================================================
-- 6. TABELA: payment_reminders
-- Lembretes de pagamento enviados
-- =====================================================

CREATE TABLE IF NOT EXISTS payment_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  
  -- Tipo de lembrete
  reminder_type VARCHAR(50) NOT NULL CHECK (reminder_type IN ('3_days_before', 'due_date', '3_days_after', '7_days_after', '15_days_after')),
  
  -- Canal
  sent_via VARCHAR(20) NOT NULL CHECK (sent_via IN ('email', 'whatsapp', 'both')),
  
  -- Status
  status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'failed')),
  
  -- Timestamp
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_payment_reminders_invoice_id ON payment_reminders(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_type ON payment_reminders(reminder_type);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_sent_at ON payment_reminders(sent_at DESC);

-- Comentários
COMMENT ON TABLE payment_reminders IS 'Registro de lembretes de pagamento enviados aos clientes';

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para atualizar updated_at
CREATE TRIGGER update_client_credit_balance_updated_at
  BEFORE UPDATE ON client_credit_balance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_benefits_updated_at
  BEFORE UPDATE ON client_benefits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION: Atualizar saldo de créditos após transação
-- =====================================================

CREATE OR REPLACE FUNCTION update_credit_balance_after_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir ou atualizar o saldo
  INSERT INTO client_credit_balance (client_id, current_balance, total_purchased, total_used, last_transaction_at)
  VALUES (
    NEW.client_id, 
    NEW.balance_after,
    CASE WHEN NEW.transaction_type IN ('recharge', 'refund') THEN NEW.amount ELSE 0 END,
    CASE WHEN NEW.transaction_type = 'usage' THEN ABS(NEW.amount) ELSE 0 END,
    NEW.created_at
  )
  ON CONFLICT (client_id) 
  DO UPDATE SET
    current_balance = NEW.balance_after,
    total_purchased = client_credit_balance.total_purchased + CASE WHEN NEW.transaction_type IN ('recharge', 'refund') THEN NEW.amount ELSE 0 END,
    total_used = client_credit_balance.total_used + CASE WHEN NEW.transaction_type = 'usage' THEN ABS(NEW.amount) ELSE 0 END,
    last_transaction_at = NEW.created_at,
    updated_at = now();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar saldo automaticamente
CREATE TRIGGER update_balance_trigger
  AFTER INSERT ON client_credits
  FOR EACH ROW
  EXECUTE FUNCTION update_credit_balance_after_transaction();

-- =====================================================
-- FUNCTION: Atualizar status da fatura baseado em pagamentos
-- =====================================================

CREATE OR REPLACE FUNCTION update_invoice_status_on_payment()
RETURNS TRIGGER AS $$
DECLARE
  invoice_total DECIMAL(10, 2);
  payments_total DECIMAL(10, 2);
BEGIN
  -- Buscar valor total da fatura
  SELECT value INTO invoice_total
  FROM invoices
  WHERE id = NEW.invoice_id;
  
  -- Calcular total pago
  SELECT COALESCE(SUM(amount), 0) INTO payments_total
  FROM payments
  WHERE invoice_id = NEW.invoice_id
  AND status = 'completed';
  
  -- Atualizar status da fatura
  IF payments_total >= invoice_total THEN
    UPDATE invoices 
    SET status = 'paid', paid_at = now()
    WHERE id = NEW.invoice_id;
  ELSIF payments_total > 0 THEN
    UPDATE invoices 
    SET status = 'partial'
    WHERE id = NEW.invoice_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar status da fatura
CREATE TRIGGER update_invoice_status_trigger
  AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION update_invoice_status_on_payment();

-- =====================================================
-- FUNCTION: Marcar faturas como vencidas
-- =====================================================

CREATE OR REPLACE FUNCTION mark_overdue_invoices()
RETURNS void AS $$
BEGIN
  UPDATE invoices
  SET status = 'overdue'
  WHERE status IN ('open', 'partial')
  AND due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS
ALTER TABLE client_credit_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_reminders ENABLE ROW LEVEL SECURITY;

-- ===== POLÍTICAS: client_credit_balance =====

-- Clientes veem seu próprio saldo
CREATE POLICY "Clientes veem seu saldo"
  ON client_credit_balance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN clients c ON c.id = up.client_id
      WHERE c.id = client_credit_balance.client_id
      AND up.user_id = auth.uid()
    )
  );

-- Admins e financeiro veem todos os saldos
CREATE POLICY "Admins veem todos os saldos"
  ON client_credit_balance FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type IN ('super_admin', 'financial', 'commercial')
      AND user_profiles.is_active = true
    )
  );

-- ===== POLÍTICAS: client_credits =====

-- Clientes veem suas transações
CREATE POLICY "Clientes veem suas transações"
  ON client_credits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN clients c ON c.id = up.client_id
      WHERE c.id = client_credits.client_id
      AND up.user_id = auth.uid()
    )
  );

-- Admins gerenciam créditos
CREATE POLICY "Admins gerenciam créditos"
  ON client_credits FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type IN ('super_admin', 'financial')
      AND user_profiles.is_active = true
    )
  );

-- ===== POLÍTICAS: client_benefits =====

-- Clientes veem seus benefícios
CREATE POLICY "Clientes veem seus benefícios"
  ON client_benefits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN clients c ON c.id = up.client_id
      WHERE c.id = client_benefits.client_id
      AND up.user_id = auth.uid()
    )
  );

-- Admins gerenciam benefícios
CREATE POLICY "Admins gerenciam benefícios"
  ON client_benefits FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type IN ('super_admin', 'commercial')
      AND user_profiles.is_active = true
    )
  );

-- ===== POLÍTICAS: invoices =====

-- Clientes veem suas faturas
CREATE POLICY "Clientes veem suas faturas"
  ON invoices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN clients c ON c.id = up.client_id
      WHERE c.id = invoices.client_id
      AND up.user_id = auth.uid()
    )
  );

-- Admins gerenciam faturas
CREATE POLICY "Admins gerenciam faturas"
  ON invoices FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type IN ('super_admin', 'financial')
      AND user_profiles.is_active = true
    )
  );

-- ===== POLÍTICAS: payments =====

-- Clientes veem seus pagamentos
CREATE POLICY "Clientes veem seus pagamentos"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN clients c ON c.id = up.client_id
      WHERE c.id = payments.client_id
      AND up.user_id = auth.uid()
    )
  );

-- Admins gerenciam pagamentos
CREATE POLICY "Admins gerenciam pagamentos"
  ON payments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type IN ('super_admin', 'financial')
      AND user_profiles.is_active = true
    )
  );

-- ===== POLÍTICAS: payment_reminders =====

-- Admins veem lembretes
CREATE POLICY "Admins veem lembretes"
  ON payment_reminders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type IN ('super_admin', 'financial')
      AND user_profiles.is_active = true
    )
  );

-- =====================================================
-- Fim da Migration: Créditos e Financeiro do Cliente
-- =====================================================

