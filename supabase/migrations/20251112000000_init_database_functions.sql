-- =====================================================
-- MIGRATION INICIAL: Funções e Configurações Base
-- Descrição: Funções auxiliares, extensões e configurações iniciais do banco
-- Dependências: Nenhuma (primeira migration)
-- =====================================================

-- =====================================================
-- EXTENSÕES
-- =====================================================

-- UUID Generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PG Crypto para criptografia
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Full Text Search em Português
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para atualizar automaticamente o campo updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS 'Atualiza automaticamente o campo updated_at antes de cada UPDATE';

-- Compat: alguns arquivos usam trigger function `moddatetime(updated_at)`.
-- No Postgres/Supabase, a trigger function não recebe parâmetros na assinatura;
-- os argumentos (ex.: updated_at) entram via TG_ARGV. Para manter compatibilidade,
-- definimos `moddatetime()` como alias simples que atualiza NEW.updated_at.
CREATE OR REPLACE FUNCTION moddatetime()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION moddatetime() IS 'Compat: atualiza NEW.updated_at antes de cada UPDATE (alias de update_updated_at_column).';

-- =====================================================
-- FUNÇÃO: Gerar número sequencial (para contracts, invoices, etc)
-- =====================================================

CREATE OR REPLACE FUNCTION generate_sequential_number(
  prefix TEXT,
  table_name TEXT,
  column_name TEXT
)
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  formatted_number TEXT;
BEGIN
  EXECUTE format(
    'SELECT COALESCE(MAX(CAST(SUBSTRING(%I FROM ''[0-9]+$'') AS INTEGER)), 0) + 1 FROM %I WHERE %I LIKE %L',
    column_name,
    table_name,
    column_name,
    prefix || '%'
  ) INTO next_number;
  
  formatted_number := prefix || LPAD(next_number::TEXT, 6, '0');
  
  RETURN formatted_number;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_sequential_number IS 'Gera números sequenciais para contratos, faturas, etc. Exemplo: CONT-000001';

-- =====================================================
-- FUNÇÃO: Calcular dias úteis entre duas datas
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_business_days(
  start_date DATE,
  end_date DATE
)
RETURNS INTEGER AS $$
DECLARE
  business_days INTEGER := 0;
  current_date DATE := start_date;
BEGIN
  WHILE current_date <= end_date LOOP
    -- Se não for sábado (6) nem domingo (0)
    IF EXTRACT(DOW FROM current_date) NOT IN (0, 6) THEN
      business_days := business_days + 1;
    END IF;
    current_date := current_date + 1;
  END LOOP;
  
  RETURN business_days;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_business_days IS 'Calcula o número de dias úteis entre duas datas (excluindo sábados e domingos)';

-- =====================================================
-- FUNÇÃO: Validar CPF
-- =====================================================

CREATE OR REPLACE FUNCTION validate_cpf(cpf TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  cpf_numbers TEXT;
  digit1 INTEGER;
  digit2 INTEGER;
  sum INTEGER;
  i INTEGER;
BEGIN
  -- Remove caracteres não numéricos
  cpf_numbers := regexp_replace(cpf, '[^0-9]', '', 'g');
  
  -- Verifica se tem 11 dígitos
  IF length(cpf_numbers) != 11 THEN
    RETURN FALSE;
  END IF;
  
  -- Verifica se todos os dígitos são iguais (CPF inválido)
  IF cpf_numbers ~ '^(\d)\1{10}$' THEN
    RETURN FALSE;
  END IF;
  
  -- Calcula o primeiro dígito verificador
  sum := 0;
  FOR i IN 1..9 LOOP
    sum := sum + (substring(cpf_numbers, i, 1)::INTEGER * (11 - i));
  END LOOP;
  digit1 := 11 - (sum % 11);
  IF digit1 >= 10 THEN
    digit1 := 0;
  END IF;
  
  -- Calcula o segundo dígito verificador
  sum := 0;
  FOR i IN 1..10 LOOP
    sum := sum + (substring(cpf_numbers, i, 1)::INTEGER * (12 - i));
  END LOOP;
  digit2 := 11 - (sum % 11);
  IF digit2 >= 10 THEN
    digit2 := 0;
  END IF;
  
  -- Verifica se os dígitos calculados são iguais aos informados
  RETURN (substring(cpf_numbers, 10, 1)::INTEGER = digit1) AND 
         (substring(cpf_numbers, 11, 1)::INTEGER = digit2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION validate_cpf IS 'Valida um número de CPF brasileiro';

-- =====================================================
-- FUNÇÃO: Validar CNPJ
-- =====================================================

CREATE OR REPLACE FUNCTION validate_cnpj(cnpj TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  cnpj_numbers TEXT;
  digit1 INTEGER;
  digit2 INTEGER;
  sum INTEGER;
  i INTEGER;
  multiplier INTEGER;
BEGIN
  -- Remove caracteres não numéricos
  cnpj_numbers := regexp_replace(cnpj, '[^0-9]', '', 'g');
  
  -- Verifica se tem 14 dígitos
  IF length(cnpj_numbers) != 14 THEN
    RETURN FALSE;
  END IF;
  
  -- Verifica se todos os dígitos são iguais (CNPJ inválido)
  IF cnpj_numbers ~ '^(\d)\1{13}$' THEN
    RETURN FALSE;
  END IF;
  
  -- Calcula o primeiro dígito verificador
  sum := 0;
  multiplier := 5;
  FOR i IN 1..12 LOOP
    sum := sum + (substring(cnpj_numbers, i, 1)::INTEGER * multiplier);
    multiplier := multiplier - 1;
    IF multiplier < 2 THEN
      multiplier := 9;
    END IF;
  END LOOP;
  digit1 := 11 - (sum % 11);
  IF digit1 >= 10 THEN
    digit1 := 0;
  END IF;
  
  -- Calcula o segundo dígito verificador
  sum := 0;
  multiplier := 6;
  FOR i IN 1..13 LOOP
    sum := sum + (substring(cnpj_numbers, i, 1)::INTEGER * multiplier);
    multiplier := multiplier - 1;
    IF multiplier < 2 THEN
      multiplier := 9;
    END IF;
  END LOOP;
  digit2 := 11 - (sum % 11);
  IF digit2 >= 10 THEN
    digit2 := 0;
  END IF;
  
  -- Verifica se os dígitos calculados são iguais aos informados
  RETURN (substring(cnpj_numbers, 13, 1)::INTEGER = digit1) AND 
         (substring(cnpj_numbers, 14, 1)::INTEGER = digit2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION validate_cnpj IS 'Valida um número de CNPJ brasileiro';

-- =====================================================
-- FUNÇÃO: Formatar moeda brasileira
-- =====================================================

CREATE OR REPLACE FUNCTION format_currency_brl(amount NUMERIC)
RETURNS TEXT AS $$
BEGIN
  RETURN 'R$ ' || TO_CHAR(amount, 'FM999G999G999D00');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION format_currency_brl IS 'Formata um valor numérico como moeda brasileira (R$)';

-- =====================================================
-- FUNÇÃO: Calcular idade
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_age(birth_date DATE)
RETURNS INTEGER AS $$
BEGIN
  RETURN DATE_PART('year', AGE(birth_date));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_age IS 'Calcula a idade a partir de uma data de nascimento';

-- =====================================================
-- FUNÇÃO: Gerar slug a partir de texto
-- =====================================================

CREATE OR REPLACE FUNCTION generate_slug(text_input TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(
        unaccent(text_input),
        '[^a-zA-Z0-9\s-]',
        '',
        'g'
      ),
      '\s+',
      '-',
      'g'
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION generate_slug IS 'Gera um slug URL-friendly a partir de um texto';

-- =====================================================
-- FUNÇÃO: Criar notificação
-- =====================================================

CREATE OR REPLACE FUNCTION create_notification(
  p_recipient_id UUID,
  p_type VARCHAR,
  p_title VARCHAR,
  p_message TEXT,
  p_related_entity_type VARCHAR DEFAULT NULL,
  p_related_entity_id UUID DEFAULT NULL,
  p_action_url TEXT DEFAULT NULL,
  p_priority VARCHAR DEFAULT 'normal'
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (
    recipient_id,
    notification_type,
    title,
    message,
    related_entity_type,
    related_entity_id,
    action_url,
    priority
  ) VALUES (
    p_recipient_id,
    p_type,
    p_title,
    p_message,
    p_related_entity_type,
    p_related_entity_id,
    p_action_url,
    p_priority
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_notification IS 'Cria uma notificação para um usuário';

-- =====================================================
-- FUNÇÃO: Registrar atividade no audit log
-- =====================================================

CREATE OR REPLACE FUNCTION log_audit(
  p_user_id UUID,
  p_action VARCHAR,
  p_entity_type VARCHAR,
  p_entity_id UUID,
  p_changes JSONB DEFAULT NULL,
  p_status VARCHAR DEFAULT 'success'
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    changes,
    status,
    ip_address
  ) VALUES (
    p_user_id,
    p_action,
    p_entity_type,
    p_entity_id,
    p_changes,
    p_status,
    inet_client_addr()
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION log_audit IS 'Registra uma ação no log de auditoria';

-- =====================================================
-- CONFIGURAÇÕES DE TIMEZONE
-- =====================================================

-- Define timezone padrão como São Paulo
ALTER DATABASE postgres SET timezone TO 'America/Sao_Paulo';

-- =====================================================
-- ROLES E PERMISSÕES BÁSICAS
-- =====================================================

-- Criar role para aplicação (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'valle360_app') THEN
    CREATE ROLE valle360_app WITH LOGIN PASSWORD NULL;
  END IF;
END
$$;

-- Grant permissões básicas
GRANT USAGE ON SCHEMA public TO valle360_app;
GRANT ALL ON ALL TABLES IN SCHEMA public TO valle360_app;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO valle360_app;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO valle360_app;

-- =====================================================
-- CONFIGURAÇÃO: Habilitar RLS por padrão
-- =====================================================

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON TABLES TO valle360_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON SEQUENCES TO valle360_app;

-- =====================================================
-- Fim da Migration Inicial
-- =====================================================

-- Mensagem de confirmação
DO $$
BEGIN
  RAISE NOTICE 'Migration inicial concluída com sucesso!';
  RAISE NOTICE 'Extensões, funções auxiliares e configurações base foram criadas.';
END $$;

