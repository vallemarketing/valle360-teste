-- ═══════════════════════════════════════════════════════════════════════
-- CRIAR TODOS OS USUÁRIOS DE TESTE - VALLE 360
-- Execute este script UMA VEZ no SQL Editor do Supabase
-- ═══════════════════════════════════════════════════════════════════════

-- Limpar usuários de teste existentes (opcional - descomente se quiser resetar)
-- DELETE FROM employee_gamification WHERE employee_id IN (SELECT id FROM employees WHERE email LIKE '%valle360.com');
-- DELETE FROM employees WHERE email LIKE '%valle360.com';
-- DELETE FROM auth.users WHERE email LIKE '%valle360.com';

-- ═══════════════════════════════════════════════════════════════════════
-- 1. SUPER ADMIN
-- ═══════════════════════════════════════════════════════════════════════

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
  'admin@valle360.com', crypt('Valle@2024', gen_salt('bf')), NOW(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"Administrador Valle"}',
  NOW(), NOW(), '', ''
) ON CONFLICT (email) DO NOTHING;

INSERT INTO employees (id, name, email, role, area, active)
SELECT id, 'Administrador Valle', 'admin@valle360.com', 'super_admin', 'Gestão', true
FROM auth.users WHERE email = 'admin@valle360.com'
ON CONFLICT (email) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════
-- 2. DESIGNER
-- ═══════════════════════════════════════════════════════════════════════

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
  'designer@valle360.com', crypt('Valle@2024', gen_salt('bf')), NOW(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"Designer Valle"}',
  NOW(), NOW(), '', ''
) ON CONFLICT (email) DO NOTHING;

INSERT INTO employees (id, name, email, role, area, active)
SELECT id, 'Designer Valle', 'designer@valle360.com', 'colaborador', 'Designer', true
FROM auth.users WHERE email = 'designer@valle360.com'
ON CONFLICT (email) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════
-- 3. WEB DESIGNER
-- ═══════════════════════════════════════════════════════════════════════

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
  'webdesigner@valle360.com', crypt('Valle@2024', gen_salt('bf')), NOW(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"Web Designer Valle"}',
  NOW(), NOW(), '', ''
) ON CONFLICT (email) DO NOTHING;

INSERT INTO employees (id, name, email, role, area, active)
SELECT id, 'Web Designer Valle', 'webdesigner@valle360.com', 'colaborador', 'Web Designer', true
FROM auth.users WHERE email = 'webdesigner@valle360.com'
ON CONFLICT (email) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════
-- 4. HEAD DE MARKETING
-- ═══════════════════════════════════════════════════════════════════════

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
  'headmarketing@valle360.com', crypt('Valle@2024', gen_salt('bf')), NOW(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"Head de Marketing Valle"}',
  NOW(), NOW(), '', ''
) ON CONFLICT (email) DO NOTHING;

INSERT INTO employees (id, name, email, role, area, active)
SELECT id, 'Head de Marketing Valle', 'headmarketing@valle360.com', 'colaborador', 'Head de Marketing', true
FROM auth.users WHERE email = 'headmarketing@valle360.com'
ON CONFLICT (email) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════
-- 5. RH (RECURSOS HUMANOS)
-- ═══════════════════════════════════════════════════════════════════════

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
  'rh@valle360.com', crypt('Valle@2024', gen_salt('bf')), NOW(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"RH Valle"}',
  NOW(), NOW(), '', ''
) ON CONFLICT (email) DO NOTHING;

INSERT INTO employees (id, name, email, role, area, active)
SELECT id, 'RH Valle', 'rh@valle360.com', 'colaborador', 'RH', true
FROM auth.users WHERE email = 'rh@valle360.com'
ON CONFLICT (email) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════
-- 6. FINANCEIRO
-- ═══════════════════════════════════════════════════════════════════════

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
  'financeiro@valle360.com', crypt('Valle@2024', gen_salt('bf')), NOW(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"Financeiro Valle"}',
  NOW(), NOW(), '', ''
) ON CONFLICT (email) DO NOTHING;

INSERT INTO employees (id, name, email, role, area, active)
SELECT id, 'Financeiro Valle', 'financeiro@valle360.com', 'colaborador', 'Financeiro', true
FROM auth.users WHERE email = 'financeiro@valle360.com'
ON CONFLICT (email) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════
-- 7. VIDEOMAKER
-- ═══════════════════════════════════════════════════════════════════════

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
  'videomaker@valle360.com', crypt('Valle@2024', gen_salt('bf')), NOW(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"Videomaker Valle"}',
  NOW(), NOW(), '', ''
) ON CONFLICT (email) DO NOTHING;

INSERT INTO employees (id, name, email, role, area, active)
SELECT id, 'Videomaker Valle', 'videomaker@valle360.com', 'colaborador', 'Videomaker', true
FROM auth.users WHERE email = 'videomaker@valle360.com'
ON CONFLICT (email) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════
-- 8. SOCIAL MEDIA
-- ═══════════════════════════════════════════════════════════════════════

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
  'social@valle360.com', crypt('Valle@2024', gen_salt('bf')), NOW(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"Social Media Valle"}',
  NOW(), NOW(), '', ''
) ON CONFLICT (email) DO NOTHING;

INSERT INTO employees (id, name, email, role, area, active)
SELECT id, 'Social Media Valle', 'social@valle360.com', 'colaborador', 'Social Media', true
FROM auth.users WHERE email = 'social@valle360.com'
ON CONFLICT (email) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════
-- 9. TRÁFEGO PAGO
-- ═══════════════════════════════════════════════════════════════════════

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
  'trafego@valle360.com', crypt('Valle@2024', gen_salt('bf')), NOW(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"Tráfego Pago Valle"}',
  NOW(), NOW(), '', ''
) ON CONFLICT (email) DO NOTHING;

INSERT INTO employees (id, name, email, role, area, active)
SELECT id, 'Tráfego Pago Valle', 'trafego@valle360.com', 'colaborador', 'Tráfego Pago', true
FROM auth.users WHERE email = 'trafego@valle360.com'
ON CONFLICT (email) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════
-- 10. COMERCIAL
-- ═══════════════════════════════════════════════════════════════════════

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
  'comercial@valle360.com', crypt('Valle@2024', gen_salt('bf')), NOW(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"Comercial Valle"}',
  NOW(), NOW(), '', ''
) ON CONFLICT (email) DO NOTHING;

INSERT INTO employees (id, name, email, role, area, active)
SELECT id, 'Comercial Valle', 'comercial@valle360.com', 'colaborador', 'Comercial', true
FROM auth.users WHERE email = 'comercial@valle360.com'
ON CONFLICT (email) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════
-- 11. CLIENTE (Portal do Cliente)
-- ═══════════════════════════════════════════════════════════════════════

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
  'cliente@valle360.com', crypt('Valle@2024', gen_salt('bf')), NOW(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"Cliente Teste Valle"}',
  NOW(), NOW(), '', ''
) ON CONFLICT (email) DO NOTHING;

-- Cliente usa tabela 'clients' ao invés de 'employees'
INSERT INTO clients (id, name, email, company_name, active)
SELECT id, 'Cliente Teste Valle', 'cliente@valle360.com', 'Empresa Teste LTDA', true
FROM auth.users WHERE email = 'cliente@valle360.com'
ON CONFLICT (email) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════
-- INICIALIZAR GAMIFICAÇÃO PARA TODOS OS COLABORADORES
-- ═══════════════════════════════════════════════════════════════════════

INSERT INTO employee_gamification (employee_id, level, total_score, productivity_score, quality_score, collaboration_score, well_being_score, weekly_score, monthly_score, current_streak)
SELECT 
  id,
  'Iniciante',
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0
FROM employees
WHERE NOT EXISTS (
  SELECT 1 FROM employee_gamification WHERE employee_id = employees.id
);

-- ═══════════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO E RELATÓRIO
-- ═══════════════════════════════════════════════════════════════════════

-- Listar todos os colaboradores criados
SELECT 
  '👑 SUPER ADMIN' as tipo,
  e.name,
  e.email,
  e.area
FROM employees e
WHERE e.role = 'super_admin'

UNION ALL

SELECT 
  '👤 COLABORADOR' as tipo,
  e.name,
  e.email,
  e.area
FROM employees e
WHERE e.role = 'colaborador'
ORDER BY tipo DESC, area;

-- Listar clientes criados
SELECT 
  '🏢 CLIENTE' as tipo,
  c.name,
  c.email,
  c.company_name as area
FROM clients c
WHERE email LIKE '%valle360.com';

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ TODOS OS USUÁRIOS FORAM CRIADOS COM SUCESSO!';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '🔐 CREDENCIAIS DE ACESSO (Senha para todos: Valle@2024)';
  RAISE NOTICE '───────────────────────────────────────────────────────────────';
  RAISE NOTICE '';
  RAISE NOTICE '👑 SUPER ADMIN:';
  RAISE NOTICE '   Email: admin@valle360.com';
  RAISE NOTICE '   Área: Gestão';
  RAISE NOTICE '';
  RAISE NOTICE '👤 COLABORADORES:';
  RAISE NOTICE '   designer@valle360.com - Designer';
  RAISE NOTICE '   webdesigner@valle360.com - Web Designer';
  RAISE NOTICE '   headmarketing@valle360.com - Head de Marketing';
  RAISE NOTICE '   rh@valle360.com - RH';
  RAISE NOTICE '   financeiro@valle360.com - Financeiro';
  RAISE NOTICE '   videomaker@valle360.com - Videomaker';
  RAISE NOTICE '   social@valle360.com - Social Media';
  RAISE NOTICE '   trafego@valle360.com - Tráfego Pago';
  RAISE NOTICE '   comercial@valle360.com - Comercial';
  RAISE NOTICE '';
  RAISE NOTICE '🏢 CLIENTE:';
  RAISE NOTICE '   cliente@valle360.com - Portal do Cliente';
  RAISE NOTICE '';
  RAISE NOTICE '🌐 Acesse: http://localhost:3000/login';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;

