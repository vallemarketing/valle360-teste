-- =====================================================
-- VALLE 360 - SEEDS COMPLETOS
-- Dados de exemplo para testar o sistema
-- =====================================================

-- =====================================================
-- 1. SUPER ADMIN USER
-- =====================================================

-- Primeiro, crie o usuário via Supabase Dashboard ou CLI
-- Depois execute este seed com o ID do usuário criado

-- Substitua 'USER_ID_FROM_AUTH' pelo ID real do auth.users
DO $$
DECLARE
  v_admin_user_id UUID := 'c47f4e4a-8b6d-4c9e-9e1f-2a3b4c5d6e7f'; -- MUDE ESTE ID
BEGIN
  -- Criar perfil de super admin
  INSERT INTO user_profiles (
    id,
    user_id,
    full_name,
    email,
    role,
    user_type,
    is_active,
    avatar
  ) VALUES (
    gen_random_uuid(),
    v_admin_user_id,
    'Admin Valle',
    'admin@valle360.com',
    'super_admin',
    'super_admin',
    true,
    'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'
  ) ON CONFLICT (user_id) DO NOTHING;
  
  RAISE NOTICE 'Super Admin criado!';
END $$;

-- =====================================================
-- 2. ÁREAS DE COLABORADORES
-- =====================================================

INSERT INTO employee_areas (name, description, color, icon, is_active) VALUES
('Social Media', 'Gestão de redes sociais e engajamento', '#E1306C', 'instagram', true),
('Design', 'Criação visual e identidade de marca', '#FF6B6B', 'palette', true),
('Vídeo', 'Produção audiovisual e edição', '#4ECDC4', 'video', true),
('Desenvolvimento Web', 'Sites e aplicações web', '#95E1D3', 'code', true),
('Tráfego Pago', 'Gestão de anúncios e mídia paga', '#F38181', 'trending-up', true),
('SEO', 'Otimização e posicionamento', '#AA96DA', 'search', true),
('Comercial', 'Vendas e relacionamento com cliente', '#FCBAD3', 'briefcase', true),
('Financeiro', 'Gestão financeira e administrativa', '#FFD93D', 'dollar-sign', true),
('RH', 'Recursos humanos e gestão de pessoas', '#6BCB77', 'users', true)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 3. CATEGORIAS DE SERVIÇOS
-- =====================================================

INSERT INTO service_categories (name, description, icon, color, is_active) VALUES
('Social Media', 'Gestão completa de redes sociais', 'instagram', '#E1306C', true),
('Design Gráfico', 'Criação de peças visuais e identidade', 'palette', '#FF6B6B', true),
('Produção de Vídeo', 'Vídeos profissionais e edição', 'video', '#4ECDC4', true),
('Desenvolvimento Web', 'Sites e aplicações web', 'code', '#95E1D3', true),
('Tráfego Pago', 'Gestão de anúncios Google e Meta', 'trending-up', '#F38181', true),
('SEO', 'Otimização para mecanismos de busca', 'search', '#AA96DA', true),
('Consultoria', 'Consultoria estratégica de marketing', 'lightbulb', '#FCBAD3', true),
('Conteúdo', 'Produção de conteúdo e copywriting', 'edit', '#FFD93D', true)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 4. SERVIÇOS
-- =====================================================

INSERT INTO services (category_id, name, description, base_price, unit_type, is_active, is_featured) VALUES
(
  (SELECT id FROM service_categories WHERE name = 'Social Media'),
  'Gestão Instagram Completa',
  'Posts diários, stories, reels e interação com seguidores',
  2500.00,
  'monthly',
  true,
  true
),
(
  (SELECT id FROM service_categories WHERE name = 'Social Media'),
  'Gestão Multi-Plataforma',
  'Instagram, Facebook, LinkedIn e TikTok',
  4500.00,
  'monthly',
  true,
  true
),
(
  (SELECT id FROM service_categories WHERE name = 'Design Gráfico'),
  'Identidade Visual Completa',
  'Logo, manual da marca, papelaria completa',
  5000.00,
  'one_time',
  true,
  true
),
(
  (SELECT id FROM service_categories WHERE name = 'Design Gráfico'),
  'Pacote de Posts Mensais',
  '30 posts + 30 stories customizados',
  1200.00,
  'monthly',
  true,
  false
),
(
  (SELECT id FROM service_categories WHERE name = 'Produção de Vídeo'),
  'Produção de Reels',
  'Roteiro, filmagem e edição profissional',
  1500.00,
  'per_unit',
  true,
  true
),
(
  (SELECT id FROM service_categories WHERE name = 'Desenvolvimento Web'),
  'Site Institucional',
  'Site responsivo com CMS',
  8000.00,
  'one_time',
  true,
  true
),
(
  (SELECT id FROM service_categories WHERE name = 'Tráfego Pago'),
  'Gestão Google Ads',
  'Criação, gestão e otimização de campanhas',
  2000.00,
  'monthly',
  true,
  true
),
(
  (SELECT id FROM service_categories WHERE name = 'Tráfego Pago'),
  'Gestão Meta Ads',
  'Facebook e Instagram Ads com otimização',
  2000.00,
  'monthly',
  true,
  true
),
(
  (SELECT id FROM service_categories WHERE name = 'SEO'),
  'SEO Completo',
  'Auditoria, otimização e link building',
  3500.00,
  'monthly',
  true,
  false
),
(
  (SELECT id FROM service_categories WHERE name = 'Consultoria'),
  'Planejamento Estratégico',
  'Estratégia de marketing 360º',
  5000.00,
  'one_time',
  true,
  true
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 5. COLABORADORES DE EXEMPLO
-- =====================================================

-- Obs: Você precisará criar os usuários no Supabase Auth primeiro
-- Este é apenas um exemplo de estrutura

DO $$
DECLARE
  v_social_area_id UUID := (SELECT id FROM employee_areas WHERE name = 'Social Media');
  v_design_area_id UUID := (SELECT id FROM employee_areas WHERE name = 'Design');
  v_video_area_id UUID := (SELECT id FROM employee_areas WHERE name = 'Vídeo');
BEGIN
  -- Exemplo: Colaborador Social Media
  -- INSERT INTO employees (
  --   user_id,
  --   area_id,
  --   position,
  --   hire_date,
  --   is_active,
  --   is_manager
  -- ) VALUES (
  --   'user-id-from-auth',
  --   v_social_area_id,
  --   'Social Media Manager',
  --   '2024-01-15',
  --   true,
  --   false
  -- );
  
  RAISE NOTICE 'Colaboradores devem ser criados após criar usuários no Auth';
END $$;

-- =====================================================
-- 6. CLIENTES DE EXEMPLO
-- =====================================================

INSERT INTO clients (
  name,
  email,
  phone,
  company_name,
  document_type,
  document_number,
  client_type,
  industry,
  is_active,
  monthly_budget
) VALUES
(
  'João Silva',
  'joao@empresa1.com',
  '(11) 98765-4321',
  'Empresa 1 Ltda',
  'cnpj',
  '12.345.678/0001-90',
  'lead',
  'Tecnologia',
  true,
  5000.00
),
(
  'Maria Santos',
  'maria@empresa2.com',
  '(11) 97654-3210',
  'Empresa 2 Comércio',
  'cnpj',
  '98.765.432/0001-10',
  'active',
  'Varejo',
  true,
  8000.00
),
(
  'Pedro Costa',
  'pedro@empresa3.com',
  '(11) 96543-2109',
  'Empresa 3 Serviços',
  'cnpj',
  '11.222.333/0001-44',
  'active',
  'Serviços',
  true,
  12000.00
),
(
  'Ana Paula',
  'ana@empresa4.com',
  '(11) 95432-1098',
  'Empresa 4 Ltda',
  'cnpj',
  '22.333.444/0001-55',
  'lead',
  'Saúde',
  true,
  3000.00
),
(
  'Carlos Mendes',
  'carlos@empresa5.com',
  '(11) 94321-0987',
  'Empresa 5 Alimentos',
  'cnpj',
  '33.444.555/0001-66',
  'active',
  15000.00
)
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- 7. CONTRATOS DOS CLIENTES
-- =====================================================

DO $$
DECLARE
  v_client1_id UUID := (SELECT id FROM clients WHERE email = 'maria@empresa2.com');
  v_client2_id UUID := (SELECT id FROM clients WHERE email = 'pedro@empresa3.com');
  v_client3_id UUID := (SELECT id FROM clients WHERE email = 'carlos@empresa5.com');
  v_service_social_id UUID := (SELECT id FROM services WHERE name = 'Gestão Instagram Completa');
  v_service_design_id UUID := (SELECT id FROM services WHERE name = 'Pacote de Posts Mensais');
BEGIN
  IF v_client1_id IS NOT NULL THEN
    INSERT INTO client_contracts (
      client_id,
      contract_number,
      contract_type,
      status,
      monthly_value,
      start_date,
      end_date,
      payment_day,
      is_active
    ) VALUES (
      v_client1_id,
      'CONT-2024-001',
      'monthly',
      'active',
      8000.00,
      '2024-01-01',
      '2024-12-31',
      10,
      true
    );
  END IF;
  
  IF v_client2_id IS NOT NULL THEN
    INSERT INTO client_contracts (
      client_id,
      contract_number,
      contract_type,
      status,
      monthly_value,
      start_date,
      end_date,
      payment_day,
      is_active
    ) VALUES (
      v_client2_id,
      'CONT-2024-002',
      'monthly',
      'active',
      12000.00,
      '2024-02-01',
      '2024-12-31',
      5,
      true
    );
  END IF;
  
  IF v_client3_id IS NOT NULL THEN
    INSERT INTO client_contracts (
      client_id,
      contract_number,
      contract_type,
      status,
      monthly_value,
      start_date,
      end_date,
      payment_day,
      is_active
    ) VALUES (
      v_client3_id,
      'CONT-2024-003',
      'monthly',
      'active',
      15000.00,
      '2024-03-01',
      '2024-12-31',
      15,
      true
    );
  END IF;
END $$;

-- =====================================================
-- 8. CRÉDITOS DOS CLIENTES
-- =====================================================

DO $$
DECLARE
  v_client_id UUID;
BEGIN
  FOR v_client_id IN SELECT id FROM clients WHERE client_type = 'active' LOOP
    INSERT INTO client_credits (
      client_id,
      total_credits,
      used_credits,
      available_credits,
      monthly_limit
    ) VALUES (
      v_client_id,
      1000,
      250,
      750,
      1000
    ) ON CONFLICT (client_id) DO NOTHING;
  END LOOP;
END $$;

-- =====================================================
-- 9. CONQUISTAS DE GAMIFICAÇÃO
-- =====================================================

INSERT INTO gamification_achievements (
  achievement_name,
  achievement_description,
  achievement_type,
  icon,
  points_awarded,
  criteria,
  rarity,
  is_active
) VALUES
(
  'Primeira Meta Alcançada',
  'Completou sua primeira meta com sucesso',
  'employee',
  'trophy',
  100,
  '{"type": "goals_hit", "value": 1}'::jsonb,
  'common',
  true
),
(
  'Streak de 7 Dias',
  'Manteve performance alta por 7 dias seguidos',
  'employee',
  'fire',
  200,
  '{"type": "streak", "value": 7}'::jsonb,
  'uncommon',
  true
),
(
  'Cliente Satisfeito',
  'Recebeu avaliação NPS 9 ou 10',
  'both',
  'smile',
  50,
  '{"type": "nps_score", "value": 9}'::jsonb,
  'common',
  true
),
(
  'Indicação Convertida',
  'Indicou um cliente que fechou contrato',
  'client',
  'gift',
  300,
  '{"type": "referral_converted", "value": 1}'::jsonb,
  'rare',
  true
),
(
  'Meta Master',
  'Bateu 10 metas consecutivas',
  'employee',
  'star',
  500,
  '{"type": "goals_streak", "value": 10}'::jsonb,
  'epic',
  true
),
(
  'Velocista',
  'Completou 10 tarefas em 1 dia',
  'employee',
  'zap',
  150,
  '{"type": "tasks_per_day", "value": 10}'::jsonb,
  'uncommon',
  true
),
(
  'Ajudante',
  'Ajudou 5 colegas com tarefas',
  'employee',
  'users',
  100,
  '{"type": "helped_colleagues", "value": 5}'::jsonb,
  'common',
  true
),
(
  'Estudioso',
  'Completou 5 cursos de desenvolvimento',
  'employee',
  'book',
  200,
  '{"type": "courses_completed", "value": 5}'::jsonb,
  'uncommon',
  true
),
(
  'Unicórnio',
  'Conquista secreta - desbloqueie todas as outras',
  'employee',
  'sparkles',
  2000,
  '{"type": "all_achievements", "value": 1}'::jsonb,
  'legendary',
  true
),
(
  'Cliente Fiel',
  'Completou 1 ano como cliente ativo',
  'client',
  'heart',
  500,
  '{"type": "active_months", "value": 12}'::jsonb,
  'rare',
  true
)
ON CONFLICT (achievement_name) DO NOTHING;

-- =====================================================
-- 10. MODELOS DE ATRIBUIÇÃO
-- =====================================================

INSERT INTO attribution_models (name, model_type, description, config, is_default, is_active) VALUES
(
  'First Touch',
  'first_touch',
  'Atribui 100% do crédito ao primeiro ponto de contato',
  '{"weight_first": 1.0}'::jsonb,
  false,
  true
),
(
  'Last Touch',
  'last_touch',
  'Atribui 100% do crédito ao último ponto de contato',
  '{"weight_last": 1.0}'::jsonb,
  false,
  true
),
(
  'Linear',
  'linear',
  'Distribui crédito igualmente entre todos os pontos de contato',
  '{"weight_distribution": "equal"}'::jsonb,
  false,
  true
),
(
  'Time Decay',
  'time_decay',
  'Dá mais peso aos pontos de contato mais recentes',
  '{"decay_rate": 0.5, "half_life_days": 7}'::jsonb,
  true,
  true
),
(
  'Position Based (U-Shaped)',
  'position_based',
  '40% primeiro e último, 20% distribuído no meio',
  '{"weight_first": 0.4, "weight_last": 0.4, "weight_middle": 0.2}'::jsonb,
  false,
  true
)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 11. TEMPLATES DE EMAIL
-- =====================================================

INSERT INTO email_templates (
  name,
  slug,
  category,
  subject_template,
  html_template,
  text_template,
  variables,
  from_name,
  from_email,
  is_active
) VALUES
(
  'Boas-vindas Cliente',
  'welcome-client',
  'transactional',
  'Bem-vindo à Valle 360, {{client_name}}! 🎉',
  '<html><body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;"><div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px;"><h1 style="color: #6366f1;">Olá {{client_name}}!</h1><p>Estamos muito felizes em tê-lo conosco! 🎊</p><p>Seu gestor de conta é: <strong>{{account_manager_name}}</strong></p><p>Estamos prontos para fazer seu marketing decolar! 🚀</p><p>Abraços,<br>Equipe Valle 360</p></div></body></html>',
  'Olá {{client_name}}!\n\nEstamos muito felizes em tê-lo conosco!\n\nSeu gestor de conta é: {{account_manager_name}}\n\nAbraços,\nEquipe Valle 360',
  '["client_name", "account_manager_name"]'::jsonb,
  'Valle 360',
  'contato@valle360.com',
  true
),
(
  'NPS Detrator - Follow-up',
  'nps-detractor-followup',
  'notification',
  'Sentimos muito pela sua experiência, {{client_name}}',
  '<html><body style="font-family: Arial, sans-serif;"><h2>Olá {{client_name}},</h2><p>Notamos que você deu uma avaliação baixa (NPS {{nps_score}}).</p><p>Queremos entender o que aconteceu e melhorar!</p><p>Seu feedback: "{{feedback}}"</p><p>Podemos agendar uma conversa?</p></body></html>',
  null,
  '["client_name", "nps_score", "feedback"]'::jsonb,
  'Valle 360',
  'contato@valle360.com',
  true
),
(
  'Aniversário Colaborador',
  'birthday-employee',
  'celebration',
  'Feliz Aniversário, {{employee_name}}! 🎂',
  '<html><body style="font-family: Arial; text-align: center; padding: 40px;"><h1 style="font-size: 48px;">🎉</h1><h2>Feliz Aniversário, {{employee_name}}!</h2><p style="font-size: 20px;">Você completa {{age}} anos hoje!</p><p>A Valle te deseja um dia incrível! ❤️</p><img src="https://media.giphy.com/media/g5R9dok94mrIvplmZd/giphy.gif" width="300"></body></html>',
  null,
  '["employee_name", "age"]'::jsonb,
  'Valle 360',
  'rh@valle360.com',
  true
),
(
  'Relatório Diário',
  'daily-report',
  'report',
  'Seu Relatório Diário - {{date}}',
  '<html><body><h1>Relatório de {{date}}</h1><p>Performance: {{performance_score}}/100</p><p>Tarefas completadas: {{tasks_completed}}</p></body></html>',
  null,
  '["date", "performance_score", "tasks_completed"]'::jsonb,
  'Valle 360 Reports',
  'reports@valle360.com',
  true
)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- 12. CONFIGURAÇÃO DE AUTOMAÇÃO DE ANIVERSÁRIOS
-- =====================================================

INSERT INTO celebration_automation_config (
  config_name,
  celebration_type,
  auto_send_message,
  message_template,
  auto_order_food,
  food_budget_limit,
  food_provider,
  auto_send_money,
  money_amount,
  money_method,
  auto_notify_team,
  notification_channels,
  auto_create_feed_post,
  trigger_days_before,
  trigger_time,
  requires_admin_approval,
  is_active
) VALUES
(
  'Aniversário Padrão',
  'birthday',
  true,
  'Feliz aniversário, {{name}}! 🎂 Você completa {{age}} anos hoje! A Valle te deseja um dia incrível! ❤️',
  true,
  100.00,
  'ifood',
  true,
  100.00,
  'pix',
  true,
  ARRAY['slack', 'email', 'in_app'],
  true,
  0,
  '08:00:00',
  false,
  true
),
(
  'Aniversário de Trabalho',
  'work_anniversary',
  true,
  'Parabéns, {{name}}! Hoje você completa {{years}} anos na Valle! 🎉 Obrigado por fazer parte da nossa história!',
  true,
  150.00,
  'ifood',
  true,
  200.00,
  'pix',
  true,
  ARRAY['slack', 'email', 'in_app'],
  true,
  0,
  '09:00:00',
  false,
  true
),
(
  'Promoção',
  'promotion',
  true,
  'Parabéns pela promoção, {{name}}! 🚀 Você merece! Continue assim!',
  true,
  200.00,
  'ifood',
  true,
  500.00,
  'pix',
  true,
  ARRAY['slack', 'email', 'in_app'],
  true,
  0,
  '10:00:00',
  true,
  true
)
ON CONFLICT (config_name) DO NOTHING;

-- =====================================================
-- 13. GRUPOS DE HASHTAGS
-- =====================================================

INSERT INTO content_hashtag_groups (
  name,
  hashtags,
  category,
  language,
  avg_performance_score,
  is_active
) VALUES
(
  'Marketing Digital BR',
  ARRAY['#marketingdigital', '#marketingdigitalbrasil', '#socialmedia', '#instagram', '#reels', '#tiktok', '#marketingdeconteudo', '#inbound', '#outbound', '#agenciadigital', '#marketingbr', '#publicidade', '#propaganda', '#branding', '#estrategia'],
  'marketing',
  'pt-BR',
  85,
  true
),
(
  'Fitness e Saúde',
  ARRAY['#fitness', '#saude', '#treino', '#academia', '#vidasaudavel', '#emagrecer', '#musculacao', '#fit', '#dieta', '#nutricao', '#bemestar', '#saudavel', '#exercicio', '#lifestyle', '#motivation'],
  'fitness',
  'pt-BR',
  78,
  true
),
(
  'Food & Gastronomia',
  ARRAY['#comida', '#food', '#gastronomia', '#receita', '#chef', '#cozinha', '#foodporn', '#instafood', '#delivery', '#restaurante', '#gourmet', '#culinaria', '#delicious', '#yummy', '#foodie'],
  'food',
  'pt-BR',
  82,
  true
),
(
  'Tecnologia e Inovação',
  ARRAY['#tecnologia', '#inovacao', '#tech', '#startup', '#empreendedorismo', '#digital', '#ia', '#inteligenciaartificial', '#futuro', '#developer', '#programming', '#coding', '#software', '#app', '#mobile'],
  'technology',
  'pt-BR',
  90,
  true
),
(
  'E-commerce',
  ARRAY['#ecommerce', '#loja', '#vendasonline', '#compras', '#shopping', '#blackfriday', '#promocao', '#desconto', '#fretegratis', '#lojavirtual', '#marketplace', '#vendas', '#negocios', '#empreender', '#lucro'],
  'ecommerce',
  'pt-BR',
  88,
  true
)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 14. BOARDS DE KANBAN PADRÃO
-- =====================================================

DO $$
DECLARE
  v_board_id UUID;
  v_col_todo_id UUID;
  v_col_doing_id UUID;
  v_col_review_id UUID;
  v_col_done_id UUID;
BEGIN
  -- Criar board padrão
  INSERT INTO kanban_boards (
    name,
    description,
    is_default,
    is_active
  ) VALUES (
    'Projetos Valle',
    'Board principal de projetos',
    true,
    true
  ) RETURNING id INTO v_board_id;
  
  -- Criar colunas padrão
  INSERT INTO kanban_columns (board_id, name, position, color, card_limit)
  VALUES (v_board_id, 'A Fazer', 0, '#94a3b8', null)
  RETURNING id INTO v_col_todo_id;
  
  INSERT INTO kanban_columns (board_id, name, position, color, card_limit)
  VALUES (v_board_id, 'Em Andamento', 1, '#3b82f6', 5)
  RETURNING id INTO v_col_doing_id;
  
  INSERT INTO kanban_columns (board_id, name, position, color, card_limit)
  VALUES (v_board_id, 'Em Revisão', 2, '#f59e0b', null)
  RETURNING id INTO v_col_review_id;
  
  INSERT INTO kanban_columns (board_id, name, position, color, card_limit)
  VALUES (v_board_id, 'Concluído', 3, '#10b981', null)
  RETURNING id INTO v_col_done_id;
  
  -- Criar labels padrão
  INSERT INTO kanban_labels (board_id, name, color) VALUES
  (v_board_id, 'Urgente', '#ef4444'),
  (v_board_id, 'Bug', '#dc2626'),
  (v_board_id, 'Feature', '#3b82f6'),
  (v_board_id, 'Design', '#8b5cf6'),
  (v_board_id, 'Cliente VIP', '#f59e0b');
  
  RAISE NOTICE 'Board de Kanban criado com sucesso!';
END $$;

-- =====================================================
-- FIM DOS SEEDS
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '==================================================';
  RAISE NOTICE '✅ SEEDS EXECUTADOS COM SUCESSO!';
  RAISE NOTICE '==================================================';
  RAISE NOTICE 'Dados criados:';
  RAISE NOTICE '- Áreas de colaboradores: 9';
  RAISE NOTICE '- Categorias de serviços: 8';
  RAISE NOTICE '- Serviços: 10';
  RAISE NOTICE '- Clientes de exemplo: 5';
  RAISE NOTICE '- Contratos: 3';
  RAISE NOTICE '- Conquistas: 10';
  RAISE NOTICE '- Modelos de atribuição: 5';
  RAISE NOTICE '- Templates de email: 4';
  RAISE NOTICE '- Configurações de celebração: 3';
  RAISE NOTICE '- Grupos de hashtags: 5';
  RAISE NOTICE '- Board de Kanban: 1 (com 4 colunas e 5 labels)';
  RAISE NOTICE '==================================================';
  RAISE NOTICE 'Próximos passos:';
  RAISE NOTICE '1. Criar usuários no Supabase Auth';
  RAISE NOTICE '2. Atualizar ID do admin no seed';
  RAISE NOTICE '3. Criar colaboradores vinculados aos usuários';
  RAISE NOTICE '4. Testar funcionalidades!';
  RAISE NOTICE '==================================================';
END $$;

