-- =====================================================================================
-- CRIAR ADMIN GUILHERME - Usando SignUp do Supabase
-- =====================================================================================
-- Este script cria APENAS as tabelas auxiliares
-- O usuário será criado via SignUp depois
-- =====================================================================================

DO $$
DECLARE
  v_user_id UUID := 'a1b2c3d4-e5f6-4789-a012-3456789abcde';
  v_employee_id UUID;
BEGIN

-- =====================================================================================
-- LIMPAR DADOS ANTIGOS
-- =====================================================================================
RAISE NOTICE 'Limpando dados antigos...';

DELETE FROM employee_achievements WHERE employee_id IN (SELECT id FROM employees WHERE email = 'guilherme@vallegroup.com.br');
DELETE FROM employee_referral_codes WHERE employee_id IN (SELECT id FROM employees WHERE email = 'guilherme@vallegroup.com.br');
DELETE FROM employee_gamification WHERE employee_id IN (SELECT id FROM employees WHERE email = 'guilherme@vallegroup.com.br');
DELETE FROM employee_permissions WHERE employee_id IN (SELECT id FROM employees WHERE email = 'guilherme@vallegroup.com.br');
DELETE FROM employees WHERE email = 'guilherme@vallegroup.com.br';
DELETE FROM users WHERE email = 'guilherme@vallegroup.com.br';
DELETE FROM user_profiles WHERE email = 'guilherme@vallegroup.com.br';

RAISE NOTICE '✅ Dados antigos removidos';

-- =====================================================================================
-- CRIAR PERFIL NA TABELA user_profiles
-- =====================================================================================
RAISE NOTICE 'Criando perfil...';

INSERT INTO user_profiles (
  id,
  user_id,
  full_name,
  email,
  role,
  user_type,
  is_active,
  phone,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  v_user_id,
  'Guilherme Valle',
  'guilherme@vallegroup.com.br',
  'super_admin',
  'super_admin',
  true,
  '(11) 99999-9999',
  NOW(),
  NOW()
);

RAISE NOTICE '✅ Perfil criado';

-- =====================================================================================
-- CRIAR USUÁRIO NA TABELA users
-- =====================================================================================
RAISE NOTICE 'Criando usuário...';

INSERT INTO users (
  id,
  email,
  password_hash,
  full_name,
  role,
  is_active,
  email_verified,
  two_factor_enabled,
  last_login_at,
  created_at,
  updated_at
) VALUES (
  v_user_id,
  'guilherme@vallegroup.com.br',
  crypt('*Valle2307', gen_salt('bf')),
  'Guilherme Valle',
  'super_admin',
  true,
  true,
  false,
  NOW(),
  NOW(),
  NOW()
);

RAISE NOTICE '✅ Usuário criado';

-- =====================================================================================
-- CRIAR EMPLOYEE
-- =====================================================================================
RAISE NOTICE 'Criando employee...';

INSERT INTO employees (
  id,
  user_id,
  full_name,
  email,
  phone,
  avatar,
  department,
  position,
  area_of_expertise,
  hire_date,
  birth_date,
  emergency_contact,
  emergency_phone,
  pix_key,
  is_active,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  v_user_id,
  'Guilherme Valle',
  'guilherme@vallegroup.com.br',
  '(11) 99999-9999',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=guilherme',
  'Administração',
  'CEO',
  'Gestão',
  '2020-01-01',
  '1985-01-01',
  'Contato Emergência',
  '(11) 98888-8888',
  'guilherme@vallegroup.com.br',
  true,
  NOW(),
  NOW()
)
RETURNING id INTO v_employee_id;

RAISE NOTICE '✅ Employee criado: %', v_employee_id;

-- =====================================================================================
-- CRIAR GAMIFICAÇÃO
-- =====================================================================================
RAISE NOTICE 'Criando gamificação...';

INSERT INTO employee_gamification (
  id,
  employee_id,
  total_points,
  level,
  current_streak,
  longest_streak,
  last_activity_date,
  productivity_score,
  quality_score,
  collaboration_score,
  wellbeing_score,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  v_employee_id,
  1000,
  5,
  10,
  15,
  NOW(),
  95.00,
  92.00,
  88.00,
  90.00,
  NOW(),
  NOW()
);

RAISE NOTICE '✅ Gamificação criada';

-- =====================================================================================
-- CRIAR CÓDIGO DE INDICAÇÃO
-- =====================================================================================
RAISE NOTICE 'Criando código de indicação...';

INSERT INTO employee_referral_codes (
  id,
  employee_id,
  referral_code,
  discount_percentage,
  commission_percentage,
  total_referrals,
  total_earnings,
  is_active,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  v_employee_id,
  'GUILHERME10',
  10.00,
  10.00,
  0,
  0,
  true,
  NOW(),
  NOW()
);

RAISE NOTICE '✅ Código de indicação criado';

-- =====================================================================================
-- CRIAR PERMISSÕES
-- =====================================================================================
RAISE NOTICE 'Criando permissões...';

INSERT INTO employee_permissions (
  id,
  employee_id,
  permission_name,
  permission_description,
  is_active,
  created_at
) 
SELECT 
  gen_random_uuid(),
  v_employee_id,
  perm.name,
  perm.description,
  true,
  NOW()
FROM (
  VALUES 
    ('dashboard', 'Acesso ao dashboard principal'),
    ('clients', 'Gerenciar clientes'),
    ('employees', 'Gerenciar colaboradores'),
    ('kanban', 'Acesso ao quadro Kanban'),
    ('financial', 'Acesso financeiro'),
    ('reports', 'Visualizar relatórios'),
    ('analytics', 'Acesso a analytics'),
    ('ai', 'Acesso à inteligência artificial'),
    ('settings', 'Configurações do sistema'),
    ('machine_learning', 'Machine Learning'),
    ('pricing_intelligence', 'Inteligência de preços'),
    ('competitive_intelligence', 'Inteligência competitiva'),
    ('sales_intelligence', 'Inteligência de vendas'),
    ('gamification', 'Sistema de gamificação'),
    ('messages', 'Mensagens'),
    ('calendar', 'Calendário'),
    ('files', 'Arquivos'),
    ('contracts', 'Contratos'),
    ('invoices', 'Faturas')
) AS perm(name, description);

RAISE NOTICE '✅ Permissões criadas';

-- =====================================================================================
-- CRIAR CONQUISTAS
-- =====================================================================================
RAISE NOTICE 'Criando conquistas...';

INSERT INTO employee_achievements (
  id,
  employee_id,
  achievement_type,
  title,
  description,
  icon,
  points_awarded,
  earned_at
) VALUES 
  (gen_random_uuid(), v_employee_id, 'first_login', 'Bem-vindo!', 'Primeiro acesso ao sistema', '🎉', 50, NOW()),
  (gen_random_uuid(), v_employee_id, 'super_admin', 'Super Admin', 'Permissões de super administrador', '👑', 1000, NOW()),
  (gen_random_uuid(), v_employee_id, 'founder', 'Fundador', 'Membro fundador da Valle 360', '⭐', 5000, NOW());

RAISE NOTICE '✅ Conquistas criadas';

END $$;

-- =====================================================================================
-- VERIFICAÇÃO
-- =====================================================================================
SELECT 
  '✅ DADOS AUXILIARES CRIADOS!' as status,
  'Agora crie o usuário no auth.users via API' as proxima_etapa;

SELECT 
  '📊 RESUMO:' as info,
  (SELECT COUNT(*) FROM user_profiles WHERE email = 'guilherme@vallegroup.com.br') as user_profiles,
  (SELECT COUNT(*) FROM users WHERE email = 'guilherme@vallegroup.com.br') as users,
  (SELECT COUNT(*) FROM employees WHERE email = 'guilherme@vallegroup.com.br') as employees,
  (SELECT COUNT(*) FROM employee_permissions WHERE employee_id IN (SELECT id FROM employees WHERE email = 'guilherme@vallegroup.com.br')) as permissions;

