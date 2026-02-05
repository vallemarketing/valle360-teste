-- =====================================================================================
-- SEED: Usuários de Teste para Desenvolvimento
-- Descrição: Acessos para testar Cliente e Colaboradores de cada área
-- =====================================================================================

-- =====================================================================================
-- IMPORTANTE: Execute este SQL no Supabase SQL Editor
-- =====================================================================================

-- =====================================================================================
-- 1. CLIENTE DE TESTE
-- =====================================================================================

-- Inserir usuário de teste no auth (faça isso manualmente no Supabase Dashboard)
-- Email: cliente@teste.com.br
-- Senha: Cliente@123

-- Depois de criar no auth, pegue o ID e substitua abaixo
DO $$
DECLARE
  v_cliente_user_id UUID := 'b1111111-1111-1111-1111-111111111111'; -- SUBSTITUA pelo ID real
BEGIN
  
  -- Criar perfil do cliente
  INSERT INTO user_profiles (
    user_id,
    full_name,
    email,
    role,
    user_type,
    is_active,
    avatar
  ) VALUES (
    v_cliente_user_id,
    'Cliente Teste',
    'cliente@teste.com.br',
    'cliente',
    'client',
    true,
    'https://api.dicebear.com/7.x/avataaars/svg?seed=cliente'
  ) ON CONFLICT (user_id) DO UPDATE SET
    full_name = 'Cliente Teste',
    email = 'cliente@teste.com.br',
    role = 'cliente',
    user_type = 'client',
    is_active = true;

  -- Criar registro na tabela clients
  INSERT INTO clients (
    user_id,
    company_name,
    trading_name,
    document_number,
    phone,
    website,
    industry,
    company_size,
    estimated_revenue,
    billing_address,
    onboarding_status,
    is_active
  ) VALUES (
    v_cliente_user_id,
    'Empresa Teste Ltda',
    'Empresa Teste',
    '12.345.678/0001-90',
    '(15) 99999-0001',
    'https://empresateste.com.br',
    'Tecnologia',
    '10-50',
    500000.00,
    'Rua Teste, 123 - São Paulo/SP',
    'completed',
    true
  ) ON CONFLICT (user_id) DO NOTHING;

  RAISE NOTICE 'Cliente de teste criado!';
END $$;

-- =====================================================================================
-- 2. COLABORADORES DE TESTE (Um por área)
-- =====================================================================================

-- 2.1. COMERCIAL
DO $$
DECLARE
  v_comercial_user_id UUID := 'c2222222-2222-2222-2222-222222222222'; -- SUBSTITUA pelo ID real
BEGIN
  INSERT INTO user_profiles (
    user_id,
    full_name,
    email,
    role,
    user_type,
    is_active,
    avatar
  ) VALUES (
    v_comercial_user_id,
    'João Comercial',
    'joao.comercial@valle360.com.br',
    'colaborador',
    'employee',
    true,
    'https://api.dicebear.com/7.x/avataaars/svg?seed=joao'
  ) ON CONFLICT (user_id) DO UPDATE SET
    full_name = 'João Comercial',
    role = 'colaborador',
    user_type = 'employee';

  INSERT INTO employees (
    user_id,
    full_name,
    email,
    phone,
    department,
    position,
    hierarchical_level,
    admission_date,
    is_active
  ) VALUES (
    v_comercial_user_id,
    'João Comercial',
    'joao.comercial@valle360.com.br',
    '(15) 99999-1001',
    'commercial',
    'Executivo de Vendas',
    'junior',
    '2024-01-15',
    true
  ) ON CONFLICT (user_id) DO NOTHING;

  RAISE NOTICE 'Colaborador Comercial criado!';
END $$;

-- 2.2. TRÁFEGO PAGO
DO $$
DECLARE
  v_trafego_user_id UUID := 'c3333333-3333-3333-3333-333333333333'; -- SUBSTITUA pelo ID real
BEGIN
  INSERT INTO user_profiles (
    user_id,
    full_name,
    email,
    role,
    user_type,
    is_active,
    avatar
  ) VALUES (
    v_trafego_user_id,
    'Maria Tráfego',
    'maria.trafego@valle360.com.br',
    'colaborador',
    'employee',
    true,
    'https://api.dicebear.com/7.x/avataaars/svg?seed=maria'
  ) ON CONFLICT (user_id) DO UPDATE SET
    full_name = 'Maria Tráfego',
    role = 'colaborador',
    user_type = 'employee';

  INSERT INTO employees (
    user_id,
    full_name,
    email,
    phone,
    department,
    position,
    hierarchical_level,
    admission_date,
    is_active
  ) VALUES (
    v_trafego_user_id,
    'Maria Tráfego',
    'maria.trafego@valle360.com.br',
    '(15) 99999-1002',
    'paid_traffic',
    'Especialista em Tráfego',
    'pleno',
    '2024-02-01',
    true
  ) ON CONFLICT (user_id) DO NOTHING;

  RAISE NOTICE 'Colaborador Tráfego Pago criado!';
END $$;

-- 2.3. DESIGNER GRÁFICO
DO $$
DECLARE
  v_designer_user_id UUID := 'c4444444-4444-4444-4444-444444444444'; -- SUBSTITUA pelo ID real
BEGIN
  INSERT INTO user_profiles (
    user_id,
    full_name,
    email,
    role,
    user_type,
    is_active,
    avatar
  ) VALUES (
    v_designer_user_id,
    'Carlos Designer',
    'carlos.designer@valle360.com.br',
    'colaborador',
    'employee',
    true,
    'https://api.dicebear.com/7.x/avataaars/svg?seed=carlos'
  ) ON CONFLICT (user_id) DO UPDATE SET
    full_name = 'Carlos Designer',
    role = 'colaborador',
    user_type = 'employee';

  INSERT INTO employees (
    user_id,
    full_name,
    email,
    phone,
    department,
    position,
    hierarchical_level,
    admission_date,
    is_active
  ) VALUES (
    v_designer_user_id,
    'Carlos Designer',
    'carlos.designer@valle360.com.br',
    '(15) 99999-1003',
    'design',
    'Designer Gráfico',
    'pleno',
    '2024-03-01',
    true
  ) ON CONFLICT (user_id) DO NOTHING;

  RAISE NOTICE 'Colaborador Designer Gráfico criado!';
END $$;

-- 2.4. HEAD DE MARKETING
DO $$
DECLARE
  v_head_user_id UUID := 'c5555555-5555-5555-5555-555555555555'; -- SUBSTITUA pelo ID real
BEGIN
  INSERT INTO user_profiles (
    user_id,
    full_name,
    email,
    role,
    user_type,
    is_active,
    avatar
  ) VALUES (
    v_head_user_id,
    'Ana Head Marketing',
    'ana.head@valle360.com.br',
    'colaborador',
    'employee',
    true,
    'https://api.dicebear.com/7.x/avataaars/svg?seed=ana'
  ) ON CONFLICT (user_id) DO UPDATE SET
    full_name = 'Ana Head Marketing',
    role = 'colaborador',
    user_type = 'employee';

  INSERT INTO employees (
    user_id,
    full_name,
    email,
    phone,
    department,
    position,
    hierarchical_level,
    admission_date,
    is_active
  ) VALUES (
    v_head_user_id,
    'Ana Head Marketing',
    'ana.head@valle360.com.br',
    '(15) 99999-1004',
    'marketing',
    'Head de Marketing',
    'senior',
    '2023-06-01',
    true
  ) ON CONFLICT (user_id) DO NOTHING;

  RAISE NOTICE 'Colaborador Head Marketing criado!';
END $$;

-- 2.5. RH (Recursos Humanos)
DO $$
DECLARE
  v_rh_user_id UUID := 'c6666666-6666-6666-6666-666666666666'; -- SUBSTITUA pelo ID real
BEGIN
  INSERT INTO user_profiles (
    user_id,
    full_name,
    email,
    role,
    user_type,
    is_active,
    avatar
  ) VALUES (
    v_rh_user_id,
    'Paula RH',
    'paula.rh@valle360.com.br',
    'colaborador',
    'employee',
    true,
    'https://api.dicebear.com/7.x/avataaars/svg?seed=paula'
  ) ON CONFLICT (user_id) DO UPDATE SET
    full_name = 'Paula RH',
    role = 'colaborador',
    user_type = 'employee';

  INSERT INTO employees (
    user_id,
    full_name,
    email,
    phone,
    department,
    position,
    hierarchical_level,
    admission_date,
    is_active
  ) VALUES (
    v_rh_user_id,
    'Paula RH',
    'paula.rh@valle360.com.br',
    '(15) 99999-1005',
    'hr',
    'Analista de RH',
    'pleno',
    '2023-09-01',
    true
  ) ON CONFLICT (user_id) DO NOTHING;

  RAISE NOTICE 'Colaborador RH criado!';
END $$;

-- 2.6. FINANCEIRO
DO $$
DECLARE
  v_fin_user_id UUID := 'c7777777-7777-7777-7777-777777777777'; -- SUBSTITUA pelo ID real
BEGIN
  INSERT INTO user_profiles (
    user_id,
    full_name,
    email,
    role,
    user_type,
    is_active,
    avatar
  ) VALUES (
    v_fin_user_id,
    'Roberto Financeiro',
    'roberto.financeiro@valle360.com.br',
    'colaborador',
    'employee',
    true,
    'https://api.dicebear.com/7.x/avataaars/svg?seed=roberto'
  ) ON CONFLICT (user_id) DO UPDATE SET
    full_name = 'Roberto Financeiro',
    role = 'colaborador',
    user_type = 'employee';

  INSERT INTO employees (
    user_id,
    full_name,
    email,
    phone,
    department,
    position,
    hierarchical_level,
    admission_date,
    is_active
  ) VALUES (
    v_fin_user_id,
    'Roberto Financeiro',
    'roberto.financeiro@valle360.com.br',
    '(15) 99999-1006',
    'finance',
    'Analista Financeiro',
    'pleno',
    '2023-10-01',
    true
  ) ON CONFLICT (user_id) DO NOTHING;

  RAISE NOTICE 'Colaborador Financeiro criado!';
END $$;

-- =====================================================================================
-- FIM DO SEED
-- =====================================================================================

SELECT 
  '✅ SEED DE USUÁRIOS DE TESTE EXECUTADO COM SUCESSO!' as status,
  'Lembre-se de criar os usuários no Supabase Auth primeiro!' as importante;

