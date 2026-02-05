-- =====================================================================================
-- CRIAR ADMIN: Guilherme Valle
-- Email: guilherme@vallegroup.com.br
-- Novo Projeto Supabase: ojlcvpqhbfnehuferyci
-- =====================================================================================

-- 1. CRIAR USUÁRIO NO AUTH
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
  confirmation_token,
  recovery_token,
  raw_app_meta_data,
  raw_user_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a1b2c3d4-e5f6-4789-a012-3456789abcde',
  'authenticated',
  'authenticated',
  'guilherme@vallegroup.com.br',
  crypt('*Valle2307', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Guilherme Valle","role":"super_admin"}'
) ON CONFLICT (email) DO UPDATE SET
  encrypted_password = crypt('*Valle2307', gen_salt('bf')),
  updated_at = NOW();

-- 2. CRIAR PERFIL DE SUPER ADMIN
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
  'a1b2c3d4-e5f6-4789-a012-3456789abcde',
  'Guilherme Valle',
  'guilherme@vallegroup.com.br',
  'super_admin',
  'super_admin',
  true,
  'https://api.dicebear.com/7.x/avataaars/svg?seed=guilherme',
  '(11) 99999-9999',
  NOW(),
  NOW()
) ON CONFLICT (user_id) DO UPDATE SET
  full_name = 'Guilherme Valle',
  email = 'guilherme@vallegroup.com.br',
  role = 'super_admin',
  user_type = 'super_admin',
  is_active = true,
  updated_at = NOW();

-- 3. ATUALIZAR TABELA USERS (se existir)
INSERT INTO users (
  id,
  email,
  password_hash,
  full_name,
  role,
  is_active,
  email_verified,
  two_factor_enabled,
  created_at,
  updated_at
) VALUES (
  'a1b2c3d4-e5f6-4789-a012-3456789abcde',
  'guilherme@vallegroup.com.br',
  crypt('*Valle2307', gen_salt('bf')),
  'Guilherme Valle',
  'super_admin',
  true,
  true,
  false,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = 'guilherme@vallegroup.com.br',
  password_hash = crypt('*Valle2307', gen_salt('bf')),
  role = 'super_admin',
  is_active = true,
  email_verified = true,
  updated_at = NOW();

-- 4. CRIAR REGISTRO DE EMPLOYEE (para gamificação, etc)
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
  is_active,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'a1b2c3d4-e5f6-4789-a012-3456789abcde',
  'Guilherme Valle',
  'guilherme@vallegroup.com.br',
  '(11) 99999-9999',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=guilherme',
  'Administração',
  'CEO',
  'Gestão',
  '2020-01-01',
  true,
  NOW(),
  NOW()
) ON CONFLICT (user_id) DO UPDATE SET
  full_name = 'Guilherme Valle',
  email = 'guilherme@vallegroup.com.br',
  department = 'Administração',
  position = 'CEO',
  is_active = true,
  updated_at = NOW();

-- 5. CONCEDER PERMISSÕES TOTAIS
INSERT INTO employee_permissions (
  employee_id,
  permission_key,
  can_view,
  can_create,
  can_edit,
  can_delete,
  can_approve,
  granted_at
) 
SELECT 
  e.id,
  perm.key,
  true,
  true,
  true,
  true,
  true,
  NOW()
FROM employees e
CROSS JOIN (
  VALUES 
    ('dashboard'),
    ('clients'),
    ('employees'),
    ('kanban'),
    ('financial'),
    ('reports'),
    ('analytics'),
    ('ai'),
    ('settings'),
    ('machine_learning'),
    ('pricing_intelligence'),
    ('competitive_intelligence'),
    ('sales_intelligence')
) AS perm(key)
WHERE e.user_id = 'a1b2c3d4-e5f6-4789-a012-3456789abcde'
ON CONFLICT (employee_id, permission_key) DO UPDATE SET
  can_view = true,
  can_create = true,
  can_edit = true,
  can_delete = true,
  can_approve = true;

-- =====================================================================================
-- SUCESSO! ✅
-- =====================================================================================
-- 
-- Suas credenciais de acesso:
-- 
-- 📧 Email: guilherme@vallegroup.com.br
-- 🔑 Senha: *Valle2307
-- 🌐 URL: http://localhost:3000/login
-- 
-- =====================================================================================

SELECT 
  '✅ ADMIN CRIADO COM SUCESSO!' as status,
  'guilherme@vallegroup.com.br' as email,
  'super_admin' as role,
  'http://localhost:3000/login' as login_url;






