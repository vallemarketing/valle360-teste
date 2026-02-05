-- =====================================================================================
-- CRIAR ADMIN: Guilherme Valle - VERSÃO CORRIGIDA
-- Email: guilherme@vallegroup.com.br
-- Novo Projeto Supabase: ojlcvpqhbfnehuferyci
-- =====================================================================================

-- VARIÁVEL DO USER_ID (usar sempre o mesmo)
DO $$
DECLARE
  v_user_id UUID := 'a1b2c3d4-e5f6-4789-a012-3456789abcde';
  v_employee_id UUID;
BEGIN

-- =====================================================================================
-- 1. DELETAR DADOS ANTIGOS (se existirem)
-- =====================================================================================

-- Deletar permissões antigas
DELETE FROM employee_permissions 
WHERE employee_id IN (SELECT id FROM employees WHERE user_id = v_user_id);

-- Deletar employee antigo
DELETE FROM employees WHERE user_id = v_user_id;

-- Deletar users antigo
DELETE FROM users WHERE id = v_user_id;

-- Deletar user_profiles antigo
DELETE FROM user_profiles WHERE user_id = v_user_id;

-- Deletar auth.users antigo
DELETE FROM auth.users WHERE id = v_user_id;

-- =====================================================================================
-- 2. CRIAR USUÁRIO NO AUTH.USERS (sem confirmed_at - é gerado automaticamente)
-- =====================================================================================

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  v_user_id,
  'authenticated',
  'authenticated',
  'guilherme@vallegroup.com.br',
  crypt('*Valle2307', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"],"role":"super_admin"}',
  '{"full_name":"Guilherme Valle","role":"super_admin"}',
  false
);

-- =====================================================================================
-- 3. CRIAR PERFIL DE SUPER ADMIN (user_profiles)
-- =====================================================================================

INSERT INTO user_profiles (
  id,
  user_id,
  full_name,
  email,
  role,
  user_type,
  is_active,
  avatar,
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
  'https://api.dicebear.com/7.x/avataaars/svg?seed=guilherme',
  '(11) 99999-9999',
  NOW(),
  NOW()
);

-- =====================================================================================
-- 4. CRIAR USUÁRIO NA TABELA USERS
-- =====================================================================================

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

-- =====================================================================================
-- 5. CRIAR REGISTRO DE EMPLOYEE
-- =====================================================================================

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

-- =====================================================================================
-- 6. CRIAR GAMIFICAÇÃO DO EMPLOYEE
-- =====================================================================================

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

-- =====================================================================================
-- 7. CRIAR CÓDIGO DE INDICAÇÃO (FIDELIDADE)
-- =====================================================================================

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

-- =====================================================================================
-- 8. CONCEDER TODAS AS PERMISSÕES (estrutura adaptada ao banco atual)
-- =====================================================================================

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

-- =====================================================================================
-- 9. CRIAR CONQUISTAS INICIAIS
-- =====================================================================================

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

END $$;

-- =====================================================================================
-- 10. VERIFICAÇÃO FINAL
-- =====================================================================================

SELECT 
  '✅ ADMIN CRIADO COM SUCESSO!' as status,
  'guilherme@vallegroup.com.br' as email,
  'super_admin' as role,
  '*Valle2307' as senha,
  'http://localhost:3000/login' as login_url;

-- Verificar dados criados
SELECT 
  '📊 DADOS CRIADOS:' as info,
  (SELECT COUNT(*) FROM auth.users WHERE email = 'guilherme@vallegroup.com.br') as auth_users,
  (SELECT COUNT(*) FROM user_profiles WHERE email = 'guilherme@vallegroup.com.br') as user_profiles,
  (SELECT COUNT(*) FROM users WHERE email = 'guilherme@vallegroup.com.br') as users,
  (SELECT COUNT(*) FROM employees WHERE email = 'guilherme@vallegroup.com.br') as employees,
  (SELECT COUNT(*) FROM employee_permissions WHERE employee_id IN (SELECT id FROM employees WHERE email = 'guilherme@vallegroup.com.br')) as permissions,
  (SELECT COUNT(*) FROM employee_gamification WHERE employee_id IN (SELECT id FROM employees WHERE email = 'guilherme@vallegroup.com.br')) as gamification,
  (SELECT COUNT(*) FROM employee_achievements WHERE employee_id IN (SELECT id FROM employees WHERE email = 'guilherme@vallegroup.com.br')) as achievements;

-- =====================================================================================
-- FIM ✅
-- =====================================================================================


