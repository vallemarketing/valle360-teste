-- =====================================================================================
-- SEEDS: Dados de Exemplo para Novas Funcionalidades
-- Descrição: Popular tabelas com dados de teste para validação
-- =====================================================================================

-- =====================================================================================
-- 1. MACHINE LEARNING - Padrões de Exemplo
-- =====================================================================================

INSERT INTO ml_marketing_patterns (pattern_type, pattern_name, pattern_description, success_rate, avg_engagement_rate, recommendation, confidence_score) VALUES
('timing', 'Melhor Horário Posts Instagram', 'Posts às 18h-19h têm 45% mais engajamento', 87.50, 5.2, 'Agende posts entre 18h-19h para máximo alcance', 92.0),
('format', 'Reels vs Posts Estáticos', 'Reels geram 3x mais alcance que posts estáticos', 92.00, 8.5, 'Priorize criação de Reels no Instagram', 95.0),
('hashtag', 'Hashtags Ideais', 'Entre 5-10 hashtags gera melhor performance', 78.00, 4.8, 'Use 7-9 hashtags por post', 85.0);

-- =====================================================================================
-- 2. CONCORRENTES - Exemplos
-- =====================================================================================

INSERT INTO competitors (company_name, trading_name, competitor_tier, threat_level, market_position, website_url, instagram_handle) VALUES
('Agência Exemplo Digital', 'Exemplo Digital', 'medium', 'medium', 'challenger', 'https://exemplodigi.com.br', '@exemplodigital'),
('Marketing Pro Ltda', 'Marketing Pro', 'top', 'high', 'leader', 'https://marketingpro.com.br', '@marketingprobr'),
('Social Media Expert', 'SM Expert', 'small', 'low', 'niche', 'https://smexpert.com.br', '@smexpertbr');

-- =====================================================================================
-- 3. PRICING INTELLIGENCE - Estratégias
-- =====================================================================================

INSERT INTO pricing_strategies (strategy_name, strategy_type, target_market_position, target_profit_margin_percent, is_default) VALUES
('Estratégia Premium', 'value_based', 'premium', 45.00, true),
('Estratégia Competitiva', 'competitive', 'mid_market', 35.00, false),
('Estratégia Penetração', 'penetration', 'value', 25.00, false);

-- =====================================================================================
-- 4. CATÁLOGO DE SERVIÇOS - Exemplos
-- =====================================================================================

INSERT INTO service_catalog (service_name, service_category, service_description_short, base_price, min_price, max_price, is_active, is_featured) VALUES
('Gestão de Redes Sociais', 'Social Media', 'Gestão completa de Instagram e Facebook', 2500.00, 2000.00, 3500.00, true, true),
('Tráfego Pago', 'Ads', 'Gerenciamento de campanhas no Google e Meta Ads', 3500.00, 3000.00, 5000.00, true, true),
('Criação de Conteúdo', 'Content', 'Produção de posts, stories e reels', 1800.00, 1500.00, 2500.00, true, false),
('Design Gráfico', 'Design', 'Artes para redes sociais e materiais', 1200.00, 1000.00, 1800.00, true, false);

-- =====================================================================================
-- 5. TEMPLATES DE PROPOSTAS
-- =====================================================================================

INSERT INTO proposal_templates (template_name, template_type, intro_text, is_default, is_active) VALUES
('Template Padrão', 'standard', 'Agradecemos o interesse em nossos serviços. Apresentamos abaixo nossa proposta comercial.', true, true),
('Template Premium', 'premium', 'É com grande satisfação que apresentamos nossa proposta exclusiva para sua empresa.', false, true),
('Template Simplificado', 'simplified', 'Confira nossa proposta:', false, true);

-- =====================================================================================
-- 6. OBJEÇÕES DE VENDAS COMUNS
-- =====================================================================================

INSERT INTO sales_objections (objection_text, objection_category, objection_severity) VALUES
('O preço está muito alto', 'price', 'high'),
('Não é o momento certo', 'timing', 'medium'),
('Preciso consultar meu sócio', 'authority', 'low'),
('Já tenho uma agência', 'competitor', 'high'),
('Não vejo o retorno', 'need', 'high');

-- Respostas para objeções
INSERT INTO sales_objection_responses (objection_id, response_text, response_approach, is_recommended) VALUES
((SELECT id FROM sales_objections WHERE objection_text = 'O preço está muito alto' LIMIT 1), 
 'Entendo sua preocupação. Vamos calcular o ROI juntos? Nossos clientes geralmente veem retorno em 3-6 meses.', 
 'data', true),
((SELECT id FROM sales_objections WHERE objection_text = 'Não é o momento certo' LIMIT 1), 
 'Compreendo. Posso perguntar: quando seria o momento ideal? Podemos agendar para daqui 30 dias.', 
 'question', true),
((SELECT id FROM sales_objections WHERE objection_text = 'Já tenho uma agência' LIMIT 1), 
 'Que bom que você já investe em marketing! O que poderia ser melhor no serviço atual?', 
 'question', true);

-- =====================================================================================
-- 7. PROGRAMA DE RECOMPENSAS
-- =====================================================================================

INSERT INTO client_reward_programs (program_name, program_description, points_per_referral, points_per_feedback, is_active) VALUES
('Programa VIP Valle 360', 'Ganhe pontos e troque por descontos e benefícios exclusivos', 100, 50, true);

-- Catálogo de recompensas
INSERT INTO client_reward_catalog (reward_name, reward_type, reward_description, points_cost, reward_value, is_available) VALUES
('Desconto 10% próxima mensalidade', 'discount', 'Ganhe 10% de desconto na sua próxima fatura', 500, 250.00, true),
('Consultoria Estratégica Grátis', 'service_upgrade', '1 hora de consultoria com nosso time', 1000, 500.00, true),
('Vale-presente Amazon R$ 100', 'gift_card', 'Vale-presente Amazon no valor de R$ 100', 800, 100.00, true),
('Post Extra no Mês', 'service_upgrade', 'Ganhe 2 posts extras no próximo mês', 300, 200.00, true);

-- =====================================================================================
-- 8. TÁTICAS DE URGÊNCIA
-- =====================================================================================

INSERT INTO urgency_tactics (tactic_name, tactic_type, description, urgency_level, urgency_message_template) VALUES
('Desconto Expira em 48h', 'time_limited', 'Desconto especial válido por tempo limitado', 'high', 'Este desconto expira em {hours} horas! Aproveite agora.'),
('Vagas Limitadas Este Mês', 'quantity_limited', 'Apenas X vagas disponíveis', 'medium', 'Restam apenas {slots} vagas para este mês.'),
('Preço Aumenta na Próxima Semana', 'price_increase', 'Preço sobe após data limite', 'high', 'Após {date}, o preço aumentará {percent}%.');

-- =====================================================================================
-- 9. PARCEIROS - Exemplos
-- =====================================================================================

INSERT INTO partners (partner_name, partner_type, email, specialties, default_commission_percent, status) VALUES
('João Designer Freelancer', 'freelancer', 'joao@example.com', '["design", "motion graphics"]', 15.00, 'active'),
('Agência de Vídeo Pro', 'agency', 'contato@videopro.com', '["video production", "editing"]', 20.00, 'active'),
('Consultora Maria Silva', 'consultant', 'maria@consultant.com', '["strategy", "branding"]', 10.00, 'active');

-- =====================================================================================
-- 10. ROI SIMULATOR - Configurações
-- =====================================================================================

INSERT INTO roi_simulator_configs (industry, avg_conversion_rate, avg_lead_value, avg_customer_lifetime_value, avg_roi_percent, is_active) VALUES
('E-commerce', 3.50, 800.00, 6000.00, 350.00, true),
('Serviços B2B', 5.00, 1500.00, 12000.00, 450.00, true),
('Restaurantes', 4.00, 250.00, 3000.00, 280.00, true),
('Imobiliária', 2.50, 5000.00, 50000.00, 600.00, true);

-- =====================================================================================
-- 11. SUPER ADMIN INSIGHTS - Exemplos
-- =====================================================================================

INSERT INTO super_admin_insights (insight_category, insight_priority, insight_title, insight_description, potential_impact_revenue, confidence_score) VALUES
('opportunity', 'high', 'Oportunidade: Aumentar Preço do Plano Social Media', 
 'Análise de mercado indica que podemos aumentar em 15% sem perda de clientes. Concorrentes cobram em média 18% a mais.', 
 48000.00, 87.5),
('trend', 'medium', 'Tendência: Reels em Alta', 
 'Conteúdo em formato Reel está gerando 3x mais engajamento. Sugerimos aumentar produção.', 
 NULL, 92.0),
('risk', 'critical', 'Alerta: Cliente XYZ com Alto Risco de Churn', 
 'NPS baixo (3) e 3 reclamações no último mês. Ação imediata necessária.', 
 -36000.00, 78.0);

-- =====================================================================================
-- 12. REALTIME ALERTS - Exemplos
-- =====================================================================================

INSERT INTO realtime_alerts (alert_type, alert_severity, alert_title, alert_message, recommended_action) VALUES
('spike_traffic', 'info', 'Pico de Tráfego Detectado', 
 'Cliente ABC teve aumento de 350% no tráfego nas últimas 2 horas. Possível post viral!', 
 'Monitore comentários e prepare conteúdo adicional para aproveitar o momento'),
('negative_comment', 'high', 'Comentário Negativo no Instagram', 
 'Comentário negativo detectado no post mais recente do cliente XYZ', 
 'Responda em até 1 hora com empatia e solução'),
('budget_exceeded', 'critical', 'Orçamento de Campanha Excedido', 
 'Campanha "Black Friday 2025" excedeu 95% do budget diário', 
 'Pausar campanha ou aumentar orçamento imediatamente');

-- =====================================================================================
-- FIM DOS SEEDS
-- =====================================================================================

-- Mensagem de confirmação
DO $$
BEGIN
    RAISE NOTICE '✅ Seeds criados com sucesso!';
    RAISE NOTICE '📊 Dados de exemplo inseridos em:';
    RAISE NOTICE '   - Machine Learning (3 padrões)';
    RAISE NOTICE '   - Concorrentes (3 empresas)';
    RAISE NOTICE '   - Pricing (3 estratégias)';
    RAISE NOTICE '   - Serviços (4 itens)';
    RAISE NOTICE '   - Propostas (3 templates)';
    RAISE NOTICE '   - Objeções (5 + respostas)';
    RAISE NOTICE '   - Recompensas (1 programa + 4 itens)';
    RAISE NOTICE '   - Urgência (3 táticas)';
    RAISE NOTICE '   - Parceiros (3 parceiros)';
    RAISE NOTICE '   - ROI Configs (4 indústrias)';
    RAISE NOTICE '   - Insights (3 exemplos)';
    RAISE NOTICE '   - Alertas (3 exemplos)';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Sistema pronto para testes!';
END $$;

