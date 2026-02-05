-- =====================================================================================
-- SEEDS COMPLETOS: Dados Fictícios para TODAS as Novas Funcionalidades
-- Descrição: Popular todas as tabelas com dados de teste realistas
-- =====================================================================================

-- =====================================================================================
-- 1. MACHINE LEARNING - Padrões de Marketing
-- =====================================================================================

INSERT INTO ml_marketing_patterns (pattern_type, pattern_name, pattern_description, success_rate, avg_engagement_rate, recommendation, confidence_score) VALUES
('timing', 'Melhor Horário Posts Instagram', 'Posts às 18h-19h têm 45% mais engajamento', 87.50, 5.2, 'Agende posts entre 18h-19h para máximo alcance', 92.0),
('format', 'Reels vs Posts Estáticos', 'Reels geram 3x mais alcance que posts estáticos', 92.00, 8.5, 'Priorize criação de Reels no Instagram', 95.0),
('hashtag', 'Hashtags Ideais', 'Entre 5-10 hashtags gera melhor performance', 78.00, 4.8, 'Use 7-9 hashtags por post', 85.0),
('content', 'Conteúdo Educacional', 'Posts educacionais têm 60% mais saves', 82.00, 6.3, 'Crie carrosséis educativos semanalmente', 88.0),
('audience', 'Público 25-34 anos', 'Maior engajamento entre 25-34 anos', 75.00, 5.8, 'Personalize conteúdo para esta faixa etária', 80.0);

-- Super Admin Insights
INSERT INTO super_admin_insights (insight_category, insight_priority, insight_title, insight_description, potential_impact_revenue, confidence_score) VALUES
('opportunity', 'high', 'Oportunidade: Aumentar Preço do Plano Social Media', 'Análise de mercado indica que podemos aumentar em 15% sem perda de clientes. Concorrentes cobram em média 18% a mais.', 48000.00, 87.5),
('trend', 'medium', 'Tendência: Reels em Alta', 'Conteúdo em formato Reel está gerando 3x mais engajamento. Sugerimos aumentar produção.', NULL, 92.0),
('risk', 'critical', 'Alerta: Cliente ABC com Alto Risco de Churn', 'NPS baixo (3) e 3 reclamações no último mês. Ação imediata necessária.', -36000.00, 78.0),
('opportunity', 'high', 'Novo Serviço: TikTok Marketing', 'Demanda crescente por TikTok. 12 clientes solicitaram no último mês.', 72000.00, 85.0),
('cost', 'medium', 'Otimização de Custos: Ferramentas de Design', 'Consolidar ferramentas de design pode economizar R$ 2.400/mês', 28800.00, 90.0);

-- ML Client Behavior Patterns
INSERT INTO ml_client_behavior_patterns (
  churn_risk_score, renewal_probability, upsell_probability, 
  predicted_ltv, engagement_trend, payment_behavior_score
) VALUES
(85, 15, 10, 50000, 'declining', 45),
(25, 85, 70, 180000, 'stable', 95),
(45, 65, 55, 120000, 'improving', 80),
(90, 10, 5, 30000, 'declining', 30),
(15, 95, 80, 250000, 'improving', 100);

-- =====================================================================================
-- 2. INTELIGÊNCIA DE CONCORRÊNCIA
-- =====================================================================================

INSERT INTO competitors (company_name, trading_name, competitor_tier, threat_level, market_position, website_url, instagram_handle, estimated_clients, estimated_revenue) VALUES
('Agência Digital Pro', 'Digital Pro', 'top', 'high', 'leader', 'https://digitalpro.com.br', '@digitalproagencia', 150, 2500000),
('Marketing 360 Ltda', 'Marketing 360', 'medium', 'medium', 'challenger', 'https://marketing360.com.br', '@marketing360br', 80, 1200000),
('Social Media Expert', 'SM Expert', 'small', 'low', 'niche', 'https://smexpert.com.br', '@smexpertbr', 35, 450000),
('Criativa Agência', 'Criativa', 'medium', 'medium', 'follower', 'https://criativaag.com.br', '@criativaagencia', 60, 800000);

-- Competitor Social Profiles
INSERT INTO competitor_social_profiles (platform, profile_handle, followers_count, following_count, posts_count, avg_engagement_rate, verified) VALUES
('instagram', '@digitalproagencia', 45000, 320, 1250, 5.8, true),
('instagram', '@marketing360br', 28000, 450, 890, 4.2, false),
('instagram', '@smexpertbr', 12000, 180, 560, 6.5, false),
('instagram', '@criativaagencia', 35000, 290, 1050, 5.1, true);

-- Competitor Alerts
INSERT INTO competitor_alerts (alert_title, alert_description, severity, change_detected, impact_assessment) VALUES
('Digital Pro lançou novo serviço de TikTok', 'Concorrente começou a oferecer gestão de TikTok por R$ 1.800', 'high', 'new_service', 'Risco de perda de market share. Recomendamos avaliar lançamento similar.'),
('Marketing 360 reduziu preços em 20%', 'Guerra de preços detectada. Preços 20% abaixo da média do mercado.', 'critical', 'price_drop', 'Alto risco! 5 clientes mencionaram proposta mais barata. Ação urgente necessária.'),
('SM Expert cresceu 40% em seguidores', 'Crescimento expressivo nas últimas 4 semanas', 'medium', 'growth_spike', 'Investigar estratégia de crescimento orgânico.'),
('Criativa contratou time de Reels', 'LinkedIn mostra 3 novas contratações especializadas em vídeo', 'medium', 'team_expansion', 'Concorrente investindo em conteúdo de vídeo.');

-- Competitor Battle Cards
INSERT INTO competitor_battle_cards (
  our_strengths, their_weaknesses, win_strategy, 
  pricing_differentiators, key_talking_points
) VALUES
(
  ARRAY['IA integrada', 'Dashboard 24/7', 'Suporte em tempo real', 'ROI comprovado'],
  ARRAY['Sem IA', 'Relatórios mensais apenas', 'Suporte apenas email'],
  'Demonstrar dashboard em tempo real + análise de IA. Mostrar casos de ROI 3x maior.',
  'Mesmo preço mas com 3x mais valor: IA + Real-time + Suporte prioritário',
  ARRAY['ROI médio 350%', '99.5% uptime', 'IA exclusiva', 'Time dedicado']
);

-- Competitor Sentiment Analysis
INSERT INTO competitor_sentiment_analysis (
  overall_sentiment_score, positive_mentions, neutral_mentions, 
  negative_mentions, sentiment_trend, analyzed_sources
) VALUES
(7.2, 45, 28, 12, 'stable', ARRAY['Google Reviews', 'Reclame Aqui', 'Instagram']),
(5.8, 32, 35, 23, 'declining', ARRAY['Google Reviews', 'Facebook']),
(8.1, 58, 15, 8, 'improving', ARRAY['Google Reviews', 'Instagram']),
(6.5, 38, 30, 18, 'stable', ARRAY['Reclame Aqui', 'Google Reviews']);

-- =====================================================================================
-- 3. SALES INTELLIGENCE
-- =====================================================================================

-- Lead Scoring History
INSERT INTO lead_scoring_history (score, budget_score, fit_score, urgency_score, engagement_score) VALUES
(85, 90, 85, 80, 85),
(45, 40, 50, 45, 45),
(92, 95, 90, 90, 90),
(35, 30, 40, 35, 35),
(78, 80, 75, 75, 80),
(65, 70, 65, 60, 65),
(88, 85, 90, 90, 85),
(42, 45, 40, 40, 45);

-- Service Catalog
INSERT INTO service_catalog (service_name, service_category, service_description_short, base_price, min_price, max_price, is_active, is_featured) VALUES
('Gestão de Redes Sociais', 'Social Media', 'Gestão completa de Instagram e Facebook', 2500.00, 2000.00, 3500.00, true, true),
('Tráfego Pago', 'Ads', 'Gerenciamento de campanhas no Google e Meta Ads', 3500.00, 3000.00, 5000.00, true, true),
('Criação de Conteúdo', 'Content', 'Produção de posts, stories e reels', 1800.00, 1500.00, 2500.00, true, false),
('Design Gráfico', 'Design', 'Artes para redes sociais e materiais', 1200.00, 1000.00, 1800.00, true, false),
('Gestão TikTok', 'Social Media', 'Criação e gestão de conteúdo para TikTok', 2200.00, 1800.00, 3000.00, true, true),
('Email Marketing', 'Marketing', 'Automação e campanhas de email', 1500.00, 1200.00, 2000.00, true, false);

-- Proposal Templates
INSERT INTO proposal_templates (template_name, template_type, intro_text, is_default, is_active) VALUES
('Template Padrão', 'standard', 'Agradecemos o interesse em nossos serviços. Apresentamos abaixo nossa proposta comercial.', true, true),
('Template Premium', 'premium', 'É com grande satisfação que apresentamos nossa proposta exclusiva para sua empresa.', false, true),
('Template Simplificado', 'simplified', 'Confira nossa proposta:', false, true);

-- Generated Proposals
INSERT INTO generated_proposals (recipient_name, recipient_email, status, total_value, discount_percent) VALUES
('João Silva', 'joao@empresa1.com', 'sent', 5000.00, 10),
('Maria Santos', 'maria@empresa2.com', 'accepted', 7500.00, 15),
('Pedro Costa', 'pedro@empresa3.com', 'draft', 4200.00, 5),
('Ana Paula', 'ana@empresa4.com', 'sent', 8900.00, 20),
('Carlos Mendes', 'carlos@empresa5.com', 'expired', 3800.00, 0);

-- Sales Objections
INSERT INTO sales_objections (objection_text, objection_category, objection_severity) VALUES
('O preço está muito alto', 'price', 'high'),
('Não é o momento certo', 'timing', 'medium'),
('Preciso consultar meu sócio', 'authority', 'low'),
('Já tenho uma agência', 'competitor', 'high'),
('Não vejo o retorno', 'need', 'high'),
('Não tenho budget agora', 'budget', 'high'),
('Vocês são muito grandes para mim', 'fit', 'medium');

-- Sales Objection Responses
INSERT INTO sales_objection_responses (objection_id, response_text, response_approach, is_recommended, success_rate, times_used) VALUES
(1, 'Entendo sua preocupação. Vamos calcular o ROI juntos? Nossos clientes geralmente veem retorno em 3-6 meses.', 'data', true, 75, 45),
(2, 'Compreendo. Posso perguntar: quando seria o momento ideal? Podemos agendar para daqui 30 dias.', 'question', true, 68, 32),
(3, 'Perfeito! Que tal agendarmos uma reunião com vocês dois? Posso preparar uma apresentação personalizada.', 'accommodation', true, 82, 28),
(4, 'Que bom que você já investe em marketing! O que poderia ser melhor no serviço atual?', 'question', true, 70, 38),
(5, 'Entendo. Nossos clientes tiveram um ROI médio de 350% no primeiro ano. Posso mostrar cases similares ao seu?', 'data', true, 78, 42);

-- Upsell Suggestions
INSERT INTO upsell_suggestions (success_probability, ai_recommendation, estimated_additional_revenue, best_timing_window, suggested_services) VALUES
(85, 'Cliente muito satisfeito com social media. Momento ideal para sugerir tráfego pago.', 3500, 'próximas 2 semanas', ARRAY['Tráfego Pago', 'Email Marketing']),
(70, 'Empresa crescendo rápido. Ótima oportunidade para upsell de TikTok e design.', 3700, 'próximo mês', ARRAY['Gestão TikTok', 'Design Gráfico']),
(92, 'NPS 10, empresa em expansão. Cliente mencionou interesse em ampliar canais.', 5200, 'imediato', ARRAY['Tráfego Pago', 'Gestão TikTok', 'Email Marketing']),
(65, 'Bom momento para sugerir criação de conteúdo adicional.', 1800, 'próximas 3 semanas', ARRAY['Criação de Conteúdo']);

-- Sales Coaching Suggestions
INSERT INTO sales_coaching_suggestions (coaching_type, priority, suggestion_title, suggestion_description, action_items) VALUES
('skill_improvement', 'high', 'Melhore Técnica de Discovery', 'Análise de reuniões mostra que você faz poucas perguntas de discovery', ARRAY['Prepare 10 perguntas antes de cada call', 'Use técnica SPIN Selling', 'Grave e revise suas calls']),
('opportunity', 'medium', 'Cliente XYZ Pronto para Upsell', '3 sinais detectados: crescimento, satisfação e budget disponível', ARRAY['Agende reunião esta semana', 'Prepare proposta de tráfego pago', 'Mostre case similar']),
('pipeline', 'high', 'Pipeline Fraco Este Mês', 'Apenas 12 leads no pipeline vs meta de 25', ARRAY['Prospecção ativa diária', 'Reativar leads dormentes', 'Pedir indicações dos clientes atuais']);

-- =====================================================================================
-- 4. PRICING INTELLIGENCE
-- =====================================================================================

-- Pricing Strategies
INSERT INTO pricing_strategies (strategy_name, strategy_type, target_market_position, target_profit_margin_percent, is_default) VALUES
('Estratégia Premium', 'value_based', 'premium', 45.00, true),
('Estratégia Competitiva', 'competitive', 'mid_market', 35.00, false),
('Estratégia Penetração', 'penetration', 'value', 25.00, false);

-- Market Pricing Data
INSERT INTO market_pricing_data (service_name, source_name, observed_price, market_average_price, competitor_name) VALUES
('Gestão de Redes Sociais', '99Freelas', 2200, 2400, 'Digital Pro'),
('Gestão de Redes Sociais', 'Workana', 2600, 2400, 'Marketing 360'),
('Tráfego Pago', '99Freelas', 3200, 3500, 'Digital Pro'),
('Tráfego Pago', 'Workana', 3800, 3500, 'Criativa'),
('Design Gráfico', '99Freelas', 1100, 1200, 'SM Expert'),
('TikTok', 'Workana', 2000, 2100, 'Digital Pro');

-- Pricing Recommendations
INSERT INTO pricing_recommendations (
  recommendation_type, priority_score, title, description, 
  current_price, recommended_price, rationale, 
  risk_level, estimated_roi
) VALUES
(
  'increase', 85, 'Aumentar Preço: Gestão de Redes Sociais',
  'Análise de mercado mostra que estamos 12% abaixo da média. Podemos aumentar sem impactar conversão.',
  2500, 2800,
  'Concorrentes cobram média de R$ 2.800. Nosso serviço inclui IA (diferencial único). Taxa de churn baixa (2%) indica satisfação alta.',
  'low', 72000
),
(
  'new_service', 90, 'Lançar: Pacote TikTok Marketing',
  '12 clientes solicitaram TikTok no último trimestre. Demanda clara no mercado.',
  0, 2200,
  'Concorrência já oferece. Risco de perder clientes. Margem projetada de 40%.',
  'medium', 158400
),
(
  'discount', 65, 'Desconto Estratégico: Design Gráfico',
  'Serviço com baixa adesão. Desconto temporário pode aumentar volume.',
  1200, 999,
  'Aumentar volume em 40% compensaria redução de preço. Teste A/B recomendado.',
  'medium', 28800
);

-- Pricing Alerts
INSERT INTO pricing_alerts (alert_type, urgency_score, alert_title, alert_description, recommended_action) VALUES
('competitor_undercut', 95, 'Concorrente 20% Mais Barato!', 'Marketing 360 está oferecendo social media por R$ 2.000 (20% abaixo de nós)', 'Avaliar match de preço OU destacar diferenciais (IA, real-time, suporte)'),
('market_shift', 75, 'Aumento Geral de Preços no Mercado', 'Mercado aumentou preços em 8% nos últimos 60 dias', 'Aproveitar momento para ajustar nossa tabela em 10%'),
('low_margin', 85, 'Margem Baixa: Criação de Conteúdo', 'Serviço com margem de apenas 18% (meta: 30%)', 'Aumentar preço em 15% OU reduzir custos de produção');

-- Service Profitability
INSERT INTO service_profitability (service_name, avg_price, avg_cost, avg_profit, profit_margin_percent, sales_volume) VALUES
('Gestão de Redes Sociais', 2500, 1250, 1250, 50.0, 45),
('Tráfego Pago', 3500, 1750, 1750, 50.0, 38),
('Criação de Conteúdo', 1800, 1100, 700, 38.9, 52),
('Design Gráfico', 1200, 600, 600, 50.0, 28),
('Gestão TikTok', 2200, 1100, 1100, 50.0, 12),
('Email Marketing', 1500, 750, 750, 50.0, 15);

-- Pricing A/B Tests
INSERT INTO pricing_ab_tests (
  test_name, variant_a_price, variant_b_price,
  variant_a_conversions, variant_b_conversions,
  variant_a_conversion_rate, variant_b_conversion_rate,
  test_status, statistical_confidence
) VALUES
('Teste: Design Gráfico R$ 1.200 vs R$ 999', 1200, 999, 8, 15, 8.0, 15.0, 'running', 78.5),
('Teste: Social Media R$ 2.500 vs R$ 2.800', 2500, 2800, 12, 9, 12.0, 9.0, 'running', 65.2);

-- =====================================================================================
-- 5. REAL-TIME ANALYTICS
-- =====================================================================================

-- Realtime Metrics
INSERT INTO realtime_metrics (
  active_users, page_views_per_minute, conversions_today, 
  conversion_rate, revenue_today, avg_session_duration,
  bounce_rate, pages_per_session
) VALUES
(127, 45, 8, 3.2, 22500, 185, 32.5, 4.2);

-- Active Sessions
INSERT INTO active_sessions (user_type, current_page, duration_seconds, is_active) VALUES
('client', '/cliente/dashboard', 320, true),
('client', '/cliente/producao', 180, true),
('employee', '/app/social-media', 540, true),
('client', '/cliente/financeiro', 95, true),
('employee', '/app/designer-grafico', 420, true),
('admin', '/admin/dashboard', 720, true),
('client', '/cliente/mensagens', 250, true),
('employee', '/app/trafego', 380, true);

-- Realtime Alerts
INSERT INTO realtime_alerts (alert_type, alert_severity, alert_title, alert_message, recommended_action) VALUES
('spike_traffic', 'info', 'Pico de Tráfego Detectado', 'Aumento de 280% no tráfego nas últimas 2 horas. Post pode ter viralizado!', 'Monitore comentários e prepare conteúdo adicional'),
('negative_comment', 'high', 'Comentário Negativo Detectado', 'Cliente XYZ postou comentário negativo no Instagram', 'Responda em até 1 hora com empatia e solução'),
('budget_exceeded', 'critical', 'Orçamento de Campanha Excedido', 'Campanha "Black Friday" atingiu 95% do budget diário', 'Pausar campanha OU aumentar orçamento'),
('conversion_drop', 'high', 'Queda Brusca em Conversões', 'Conversões caíram 45% nas últimas 3 horas', 'Verificar funil, landing pages e campanhas');

-- Anomaly Detections
INSERT INTO anomaly_detections (
  metric_name, anomaly_type, expected_value, actual_value,
  deviation_percentage, severity, status
) VALUES
('page_views', 'spike', 30.0, 85.0, 183.3, 'high', 'new'),
('conversion_rate', 'drop', 4.5, 1.8, -60.0, 'critical', 'new'),
('bounce_rate', 'spike', 28.0, 52.0, 85.7, 'medium', 'new');

-- Realtime Traffic (últimos 15 minutos)
INSERT INTO realtime_traffic (minute_timestamp, page_views, unique_visitors, conversions) VALUES
(NOW() - INTERVAL '15 minutes', 32, 28, 1),
(NOW() - INTERVAL '14 minutes', 38, 32, 0),
(NOW() - INTERVAL '13 minutes', 45, 38, 2),
(NOW() - INTERVAL '12 minutes', 42, 35, 1),
(NOW() - INTERVAL '11 minutes', 48, 40, 1),
(NOW() - INTERVAL '10 minutes', 52, 44, 3),
(NOW() - INTERVAL '9 minutes', 58, 48, 2),
(NOW() - INTERVAL '8 minutes', 55, 46, 1),
(NOW() - INTERVAL '7 minutes', 62, 52, 2),
(NOW() - INTERVAL '6 minutes', 68, 56, 3),
(NOW() - INTERVAL '5 minutes', 72, 60, 2),
(NOW() - INTERVAL '4 minutes', 78, 65, 4),
(NOW() - INTERVAL '3 minutes', 82, 68, 3),
(NOW() - INTERVAL '2 minutes', 88, 72, 2),
(NOW() - INTERVAL '1 minute', 95, 78, 5);

-- =====================================================================================
-- 6. ROI SIMULATOR
-- =====================================================================================

-- ROI Simulator Configs
INSERT INTO roi_simulator_configs (industry, avg_conversion_rate, avg_lead_value, avg_customer_lifetime_value, avg_roi_percent, is_active) VALUES
('E-commerce', 3.50, 800.00, 6000.00, 350.00, true),
('Serviços B2B', 5.00, 1500.00, 12000.00, 450.00, true),
('Restaurantes', 4.00, 250.00, 3000.00, 280.00, true),
('Imobiliária', 2.50, 5000.00, 50000.00, 600.00, true),
('Saúde', 4.50, 1200.00, 8000.00, 380.00, true);

-- ROI Simulations
INSERT INTO roi_simulations (current_revenue, projected_revenue, investment_amount, roi_percentage, time_horizon_months, simulation_parameters) VALUES
(50000, 175000, 30000, 483.3, 6, '{"target_leads": 100, "marketing_budget": 5000}'::jsonb),
(80000, 280000, 45000, 522.2, 12, '{"target_leads": 150, "marketing_budget": 7500}'::jsonb),
(30000, 105000, 18000, 483.3, 6, '{"target_leads": 60, "marketing_budget": 3000}'::jsonb);

-- =====================================================================================
-- 7. PARTNERS NETWORK
-- =====================================================================================

INSERT INTO partners (partner_name, partner_type, email, specialties, default_commission_percent, status) VALUES
('João Designer Freelancer', 'freelancer', 'joao@example.com', '["design", "motion graphics", "branding"]', 15.00, 'active'),
('Agência de Vídeo Pro', 'agency', 'contato@videopro.com', '["video production", "editing", "animation"]', 20.00, 'active'),
('Consultora Maria Silva', 'consultant', 'maria@consultant.com', '["strategy", "branding", "positioning"]', 10.00, 'active'),
('Fotógrafo Pedro Costa', 'freelancer', 'pedro@foto.com', '["photography", "product photo", "events"]', 12.00, 'active');

-- =====================================================================================
-- 8. URGENCY TACTICS
-- =====================================================================================

INSERT INTO urgency_tactics (tactic_name, tactic_type, description, urgency_level, urgency_message_template, is_active) VALUES
('Desconto Expira em 48h', 'time_limited', 'Desconto especial válido por tempo limitado', 'high', '⏰ Este desconto expira em {hours} horas! Não perca esta oportunidade única.', true),
('Vagas Limitadas Este Mês', 'quantity_limited', 'Apenas X vagas disponíveis', 'medium', '🔥 Restam apenas {slots} vagas para este mês. Garanta a sua agora!', true),
('Preço Aumenta na Próxima Semana', 'price_increase', 'Preço sobe após data limite', 'high', '💰 Após {date}, o preço aumentará {percent}%. Aproveite o valor atual!', true),
('Bônus Exclusivo por Tempo Limitado', 'bonus', 'Bônus especial para primeiros clientes', 'medium', '🎁 Bônus exclusivo para quem fechar até {date}: {bonus_description}', true);

-- =====================================================================================
-- 9. RECORDED MEETINGS & AI INSIGHTS
-- =====================================================================================

INSERT INTO recorded_meetings (meeting_title, meeting_date, status) VALUES
('Reunião Discovery - Empresa ABC', NOW() - INTERVAL '2 days', 'completed'),
('Follow-up - Cliente XYZ', NOW() - INTERVAL '1 day', 'completed'),
('Apresentação Proposta - StartupDev', NOW() - INTERVAL '3 days', 'completed');

-- Meeting AI Insights
INSERT INTO meeting_ai_insights (
  summary, key_topics, sentiment_score,
  objections_detected, budget_mentioned, decision_timeframe,
  next_steps_suggested, action_items
) VALUES
(
  'Reunião produtiva com foco em gestão de redes sociais. Cliente demonstrou interesse mas tem concerns sobre preço.',
  ARRAY['gestão social media', 'preço', 'ROI', 'cases de sucesso'],
  7.5,
  ARRAY['preço alto', 'precisa aprovar com sócio'],
  '3000-4000',
  '15 dias',
  ARRAY['Enviar proposta personalizada', 'Incluir 3 cases similares', 'Agendar call com sócio'],
  ARRAY['Enviar proposta até sexta', 'Preparar apresentação de ROI', 'Conectar no LinkedIn']
),
(
  'Cliente muito satisfeito com resultados. Momento ideal para upsell de tráfego pago.',
  ARRAY['resultados', 'crescimento', 'tráfego pago', 'expansion'],
  9.2,
  ARRAY[],
  '5000-6000',
  'imediato',
  ARRAY['Criar proposta de tráfego pago', 'Apresentar cases de ROI'],
  ARRAY['Enviar proposta tráfego pago', 'Agendar call de alinhamento']
);

-- =====================================================================================
-- 10. CLIENT GAMIFICATION & REWARDS
-- =====================================================================================

INSERT INTO client_reward_programs (program_name, program_description, points_per_referral, points_per_feedback, is_active) VALUES
('Programa VIP Valle 360', 'Ganhe pontos e troque por descontos e benefícios exclusivos', 100, 50, true);

-- Client Reward Catalog
INSERT INTO client_reward_catalog (reward_name, reward_type, reward_description, points_cost, reward_value, is_available) VALUES
('Desconto 10% próxima mensalidade', 'discount', 'Ganhe 10% de desconto na sua próxima fatura', 500, 250.00, true),
('Consultoria Estratégica Grátis', 'service_upgrade', '1 hora de consultoria com nosso time', 1000, 500.00, true),
('Vale-presente Amazon R$ 100', 'gift_card', 'Vale-presente Amazon no valor de R$ 100', 800, 100.00, true),
('Post Extra no Mês', 'service_upgrade', 'Ganhe 2 posts extras no próximo mês', 300, 200.00, true),
('Análise Competitiva Completa', 'service_upgrade', 'Relatório completo de análise da concorrência', 1200, 800.00, true),
('Desconto 15% em Novo Serviço', 'discount', '15% off ao contratar qualquer serviço novo', 600, 300.00, true);

-- =====================================================================================
-- 11. VIDEO PROPOSALS
-- =====================================================================================

INSERT INTO personalized_video_proposals (recipient_name, recipient_email, status) VALUES
('João Empresário', 'joao@empresa.com', 'delivered'),
('Maria CEO', 'maria@startup.com', 'viewed'),
('Pedro Diretor', 'pedro@corp.com', 'sent');

-- =====================================================================================
-- FIM DOS SEEDS COMPLETOS
-- =====================================================================================

-- Mensagem de confirmação
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
    RAISE NOTICE '   ✅ SEEDS COMPLETOS INSERIDOS COM SUCESSO!';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Dados inseridos em:';
    RAISE NOTICE '   🤖 Machine Learning (5 padrões + 5 insights + 5 behaviors)';
    RAISE NOTICE '   🕵️  Concorrentes (4 empresas + profiles + alertas + battle cards)';
    RAISE NOTICE '   💼 Sales Intelligence (8 leads + 6 serviços + 5 propostas + 7 objeções)';
    RAISE NOTICE '   💰 Pricing Intelligence (3 estratégias + 6 dados mercado + 3 recomendações)';
    RAISE NOTICE '   📊 Real-time Analytics (métricas + 8 sessões + 4 alertas + 15 pontos tráfego)';
    RAISE NOTICE '   🎯 ROI Simulator (5 configs + 3 simulações)';
    RAISE NOTICE '   🤝 Partners (4 parceiros)';
    RAISE NOTICE '   ⏰ Urgency (4 táticas)';
    RAISE NOTICE '   🎙️  Meetings (3 reuniões + insights IA)';
    RAISE NOTICE '   🏆 Gamification (1 programa + 6 recompensas)';
    RAISE NOTICE '   🎥 Video Proposals (3 vídeos)';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Sistema pronto para demonstração!';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
END $$;

