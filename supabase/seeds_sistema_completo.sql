-- =====================================================
-- SEEDS COMPLETOS - SISTEMA VALLE 360
-- Dados fictícios para todas as funcionalidades
-- =====================================================

-- Limpar dados existentes (cuidado em produção!)
TRUNCATE TABLE employee_gamification_scores CASCADE;
TRUNCATE TABLE employee_referral_coupons CASCADE;
TRUNCATE TABLE client_referrals CASCADE;
TRUNCATE TABLE employee_motivation_messages CASCADE;
TRUNCATE TABLE employee_recognition_events CASCADE;
TRUNCATE TABLE employee_wellbeing_checkins CASCADE;
TRUNCATE TABLE employee_goals CASCADE;
TRUNCATE TABLE employee_goal_milestones CASCADE;
TRUNCATE TABLE employee_behavioral_analysis CASCADE;

-- =====================================================
-- 1. GAMIFICAÇÃO
-- =====================================================

-- Inserir scores de gamificação para colaboradores
-- (Assumindo que existem employees com IDs 1-5)

INSERT INTO employee_gamification_scores (employee_id, total_points, level, current_streak, longest_streak, productivity_score, quality_score, collaboration_score, badges, achievements) VALUES
(1, 1850, 18, 7, 15, 88, 92, 85, 
  '["first_week", "team_player", "quality_master", "consistent"]'::jsonb,
  '["100_points", "level_10", "streak_7"]'::jsonb
),
(2, 1200, 12, 3, 8, 75, 80, 78,
  '["first_week", "team_player"]'::jsonb,
  '["100_points", "level_10"]'::jsonb
),
(3, 2500, 25, 12, 18, 95, 88, 90,
  '["first_week", "team_player", "quality_master", "consistent", "leader"]'::jsonb,
  '["100_points", "level_10", "level_20", "streak_7", "streak_10"]'::jsonb
),
(4, 950, 9, 2, 5, 68, 72, 70,
  '["first_week"]'::jsonb,
  '["100_points"]'::jsonb
),
(5, 1650, 16, 5, 10, 82, 86, 80,
  '["first_week", "team_player", "quality_master"]'::jsonb,
  '["100_points", "level_10"]'::jsonb
);

-- =====================================================
-- 2. PROGRAMA DE FIDELIDADE
-- =====================================================

-- Cupons de indicação
INSERT INTO employee_referral_coupons (employee_id, coupon_code, is_active, times_shared) VALUES
(1, 'VALLE-JOAO-2024', true, 5),
(2, 'VALLE-MARIA-2024', true, 2),
(3, 'VALLE-PEDRO-2024', true, 8),
(4, 'VALLE-ANA-2024', true, 1),
(5, 'VALLE-CARLOS-2024', true, 3);

-- Indicações de clientes
INSERT INTO client_referrals (employee_id, coupon_used, client_name, client_email, client_phone, status, qualified_at, sent_proposal_at, signed_contract_at, contract_value, commission_percentage, commission_paid) VALUES
-- Indicações do employee 1
(1, 'VALLE-JOAO-2024', 'Tech Solutions Ltda', 'contato@techsolutions.com.br', '11987654321', 'signed', NOW() - INTERVAL '45 days', NOW() - INTERVAL '40 days', NOW() - INTERVAL '30 days', 5000.00, 10.00, true),
(1, 'VALLE-JOAO-2024', 'Marketing Plus', 'info@marketingplus.com.br', '11987654322', 'proposal_sent', NOW() - INTERVAL '15 days', NOW() - INTERVAL '10 days', NULL, 3500.00, 10.00, false),

-- Indicações do employee 3
(3, 'VALLE-PEDRO-2024', 'Digital Agency', 'contato@digitalagency.com.br', '11987654323', 'signed', NOW() - INTERVAL '60 days', NOW() - INTERVAL '50 days', NOW() - INTERVAL '40 days', 8000.00, 10.00, true),
(3, 'VALLE-PEDRO-2024', 'Startup XYZ', 'hello@startupxyz.com', '11987654324', 'signed', NOW() - INTERVAL '30 days', NOW() - INTERVAL '25 days', NOW() - INTERVAL '15 days', 4500.00, 10.00, false),
(3, 'VALLE-PEDRO-2024', 'E-commerce ABC', 'contato@ecommerceabc.com.br', '11987654325', 'qualified', NOW() - INTERVAL '5 days', NULL, NULL, NULL, 10.00, false);

-- =====================================================
-- 3. MENSAGENS MOTIVACIONAIS DA IA
-- =====================================================

INSERT INTO employee_motivation_messages (employee_id, message_type, message_content, status, sent_at) VALUES
-- Employee 1
(1, 'encouragement', 'Parabéns João! Você está com uma sequência de 7 dias consecutivos. Continue assim! 🔥', 'sent', NOW() - INTERVAL '1 hour'),
(1, 'reminder', 'Lembre-se de atualizar o status das suas tarefas no Kanban hoje.', 'sent', NOW() - INTERVAL '2 days'),

-- Employee 2
(2, 'wellbeing', 'Maria, percebi que seu score de bem-estar está um pouco baixo. Que tal fazer uma pausa? ☕', 'pending', NULL),

-- Employee 3
(3, 'achievement', 'Incrível, Pedro! Você atingiu o nível 25. Você é um dos top performers da equipe! 🏆', 'sent', NOW() - INTERVAL '3 days'),

-- Employee 4
(4, 'reminder', 'Ana, você tem 2 tarefas atrasadas. Precisa de ajuda para priorizá-las?', 'pending', NULL),

-- Employee 5
(5, 'encouragement', 'Carlos, seu trabalho em equipe tem sido exemplar. Continue colaborando! 👏', 'sent', NOW() - INTERVAL '1 day');

-- =====================================================
-- 4. RECONHECIMENTOS
-- =====================================================

INSERT INTO employee_recognition_events (employee_id, recognized_by, recognition_type, title, description, points_awarded, is_public) VALUES
-- Reconhecimentos para employee 1
(1, '00000000-0000-0000-0000-000000000001'::uuid, 'achievement', 'Excelente Apresentação', 'Apresentação impecável para o cliente Tech Solutions', 50, true),

-- Reconhecimentos para employee 3
(3, '00000000-0000-0000-0000-000000000001'::uuid, 'milestone', 'Top Performer Q3', 'Melhor desempenho geral do trimestre', 100, true),
(3, '00000000-0000-0000-0000-000000000001'::uuid, 'peer_recognition', 'Ajudou a equipe', 'Sempre disposto a ajudar os colegas', 30, true),

-- Reconhecimento para employee 5
(5, '00000000-0000-0000-0000-000000000001'::uuid, 'achievement', 'Entrega no Prazo', 'Todas as entregas do mês dentro do prazo', 40, true);

-- =====================================================
-- 5. BEM-ESTAR (WELLBEING)
-- =====================================================

-- Últimos 7 dias de check-ins
INSERT INTO employee_wellbeing_checkins (employee_id, checkin_date, mood_score, energy_score, stress_score, motivation_score, job_satisfaction_score, work_life_balance_score) VALUES
-- Employee 1 (última semana)
(1, CURRENT_DATE - INTERVAL '6 days', 8, 7, 3, 8, 8, 7),
(1, CURRENT_DATE - INTERVAL '5 days', 7, 8, 4, 7, 8, 7),
(1, CURRENT_DATE - INTERVAL '4 days', 9, 8, 2, 9, 9, 8),
(1, CURRENT_DATE - INTERVAL '3 days', 8, 7, 3, 8, 8, 7),
(1, CURRENT_DATE - INTERVAL '2 days', 7, 6, 4, 7, 7, 6),
(1, CURRENT_DATE - INTERVAL '1 day', 8, 8, 3, 8, 8, 8),
(1, CURRENT_DATE, 9, 8, 2, 9, 9, 8),

-- Employee 2
(2, CURRENT_DATE - INTERVAL '1 day', 6, 5, 6, 6, 6, 5),
(2, CURRENT_DATE, 7, 6, 5, 7, 7, 6),

-- Employee 3
(3, CURRENT_DATE - INTERVAL '2 days', 9, 9, 2, 9, 10, 9),
(3, CURRENT_DATE - INTERVAL '1 day', 10, 9, 1, 10, 10, 9),
(3, CURRENT_DATE, 9, 9, 2, 9, 9, 9);

-- =====================================================
-- 6. METAS
-- =====================================================

-- Metas dos colaboradores
INSERT INTO employee_goals (employee_id, goal_type, title, description, target_value, current_value, deadline, status, priority) VALUES
-- Employee 1
(1, 'productivity', 'Aumentar produtividade', 'Atingir 90% de produtividade', 90, 88, CURRENT_DATE + INTERVAL '30 days', 'active', 'high'),
(1, 'skill', 'Aprender Next.js', 'Completar curso avançado de Next.js', 100, 65, CURRENT_DATE + INTERVAL '60 days', 'active', 'medium'),

-- Employee 2
(2, 'quality', 'Melhorar qualidade', 'Atingir 85% de qualidade nas entregas', 85, 80, CURRENT_DATE + INTERVAL '45 days', 'active', 'high'),

-- Employee 3
(3, 'career', 'Promover para Sênior', 'Atingir todos os requisitos para promoção', 100, 85, CURRENT_DATE + INTERVAL '90 days', 'active', 'high'),
(3, 'leadership', 'Mentorar 2 júniores', 'Ajudar no desenvolvimento de colaboradores júnior', 2, 1, CURRENT_DATE + INTERVAL '60 days', 'active', 'medium'),

-- Employee 5
(5, 'productivity', 'Aumentar produtividade', 'Atingir 85% de produtividade', 85, 82, CURRENT_DATE + INTERVAL '30 days', 'active', 'normal');

-- Milestones das metas
INSERT INTO employee_goal_milestones (goal_id, title, description, target_date, status) VALUES
-- Milestones da meta 1 (Next.js do employee 1)
(2, 'Módulo 1: Fundamentos', 'Completar módulo de fundamentos', CURRENT_DATE + INTERVAL '15 days', 'completed'),
(2, 'Módulo 2: Avançado', 'Completar módulo avançado', CURRENT_DATE + INTERVAL '35 days', 'in_progress'),
(2, 'Projeto Final', 'Desenvolver projeto completo', CURRENT_DATE + INTERVAL '60 days', 'pending');

-- =====================================================
-- 7. ANÁLISE COMPORTAMENTAL
-- =====================================================

INSERT INTO employee_behavioral_analysis (employee_id, analysis_date, overall_health_score, engagement_score, productivity_trend, quality_trend, red_flags, positive_indicators, sentiment_analysis, ai_recommendations) VALUES
-- Employee 1
(1, CURRENT_DATE, 85, 88, 'stable', 'up', 
  '[]'::jsonb,
  '["consistent_performance", "high_engagement", "good_communication"]'::jsonb,
  '{"overall": "positive", "score": 85, "key_themes": ["satisfaction", "motivation"]}'::jsonb,
  '["continue_current_pace", "consider_new_challenges"]'::jsonb
),

-- Employee 2
(2, CURRENT_DATE, 65, 68, 'down', 'stable',
  '["low_wellbeing_score"]'::jsonb,
  '["meets_deadlines"]'::jsonb,
  '{"overall": "neutral", "score": 60, "key_themes": ["stress", "workload"]}'::jsonb,
  '["schedule_1on1", "workload_review", "wellbeing_support"]'::jsonb
),

-- Employee 3
(3, CURRENT_DATE, 95, 98, 'up', 'up',
  '[]'::jsonb,
  '["exceptional_performance", "leadership_potential", "high_engagement", "team_player"]'::jsonb,
  '{"overall": "very_positive", "score": 95, "key_themes": ["achievement", "growth", "collaboration"]}'::jsonb,
  '["promotion_candidate", "leadership_opportunities", "continue_development"]'::jsonb
),

-- Employee 4
(4, CURRENT_DATE, 55, 58, 'down', 'down',
  '["declining_performance", "low_engagement", "missed_deadlines"]'::jsonb,
  '[]'::jsonb,
  '{"overall": "concerning", "score": 45, "key_themes": ["disengagement", "struggle"]}'::jsonb,
  '["urgent_1on1", "pip_consideration", "support_resources"]'::jsonb
),

-- Employee 5
(5, CURRENT_DATE, 78, 80, 'stable', 'up',
  '[]'::jsonb,
  '["good_teamwork", "consistent_quality"]'::jsonb,
  '{"overall": "positive", "score": 75, "key_themes": ["collaboration", "reliability"]}'::jsonb,
  '["skill_development", "new_projects"]'::jsonb
);

-- =====================================================
-- 8. PREDIÇÃO DE CHURN
-- =====================================================

-- Inserir predições de saída (churn)
-- Assumindo que existe a tabela employee_churn_prediction

-- Comentado pois a tabela pode não existir
-- INSERT INTO employee_churn_prediction (employee_id, prediction_date, churn_probability, risk_level, contributing_factors, recommended_actions) VALUES
-- (1, CURRENT_DATE, 12, 'low', 
--   '{"engagement": 88, "wellbeing": 80, "performance": 90}'::jsonb,
--   '["maintain_current_support", "career_development_discussion"]'::jsonb
-- ),
-- (2, CURRENT_DATE, 45, 'medium',
--   '{"engagement": 68, "wellbeing": 60, "performance": 75}'::jsonb,
--   '["immediate_1on1", "workload_adjustment", "wellbeing_support"]'::jsonb
-- ),
-- (3, CURRENT_DATE, 5, 'very_low',
--   '{"engagement": 98, "wellbeing": 95, "performance": 95}'::jsonb,
--   '["retention_strategy", "promotion_discussion", "competitive_compensation"]'::jsonb
-- ),
-- (4, CURRENT_DATE, 75, 'high',
--   '{"engagement": 58, "wellbeing": 55, "performance": 55}'::jsonb,
--   '["urgent_intervention", "pip_or_transition", "exit_interview_prep"]'::jsonb
-- );

-- =====================================================
-- RESUMO DOS DADOS INSERIDOS
-- =====================================================

-- Gamificação: 5 colaboradores com scores variados
-- Fidelidade: 5 cupons ativos, 5 indicações (2 convertidas)
-- Mensagens IA: 6 mensagens (4 enviadas, 2 pendentes)
-- Reconhecimentos: 5 reconhecimentos públicos
-- Bem-Estar: 13 check-ins (últimos dias)
-- Metas: 6 metas ativas, 3 milestones
-- Análise Comportamental: 5 análises completas

-- FIM DOS SEEDS











