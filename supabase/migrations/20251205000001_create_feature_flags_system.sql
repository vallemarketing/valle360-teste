-- =====================================================
-- VALLE 360 - SISTEMA DE FEATURE FLAGS
-- Controle de funcionalidades por cliente/contrato
-- =====================================================

-- Tabela de Features (funcionalidades disponíveis)
CREATE TABLE IF NOT EXISTS features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- 'reputation', 'insights', 'franchisee', etc
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general', -- 'analytics', 'ai', 'management', 'integration', 'engagement'
  icon TEXT, -- nome do ícone lucide-react
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Serviços (Social Media, Tráfego, etc)
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  base_price DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Relacionamento Serviço x Features (quais features cada serviço libera)
CREATE TABLE IF NOT EXISTS service_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  feature_id UUID REFERENCES features(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(service_id, feature_id)
);

-- Features por cliente (controle individual)
CREATE TABLE IF NOT EXISTS client_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL, -- referência para clients
  feature_id UUID REFERENCES features(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT false,
  enabled_by TEXT DEFAULT 'manual', -- 'contract', 'manual', 'request'
  enabled_by_user_id UUID,
  enabled_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, feature_id)
);

-- Solicitações de features (Comercial solicita, Super Admin aprova)
CREATE TABLE IF NOT EXISTS feature_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  feature_id UUID REFERENCES features(id) ON DELETE CASCADE,
  requested_by_user_id UUID NOT NULL,
  requested_by_name TEXT,
  justification TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  reviewed_by_user_id UUID,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Histórico de alterações de features
CREATE TABLE IF NOT EXISTS feature_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  feature_id UUID REFERENCES features(id) ON DELETE SET NULL,
  feature_code TEXT, -- backup caso feature seja deletada
  action TEXT NOT NULL, -- 'enabled', 'disabled', 'request_created', 'request_approved', 'request_rejected'
  changed_by_user_id UUID,
  changed_by_name TEXT,
  reason TEXT,
  previous_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_client_features_client ON client_features(client_id);
CREATE INDEX IF NOT EXISTS idx_client_features_enabled ON client_features(client_id, is_enabled);
CREATE INDEX IF NOT EXISTS idx_feature_requests_status ON feature_requests(status);
CREATE INDEX IF NOT EXISTS idx_feature_requests_client ON feature_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_feature_logs_client ON feature_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_feature_logs_created ON feature_logs(created_at DESC);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_feature_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_features_updated_at
  BEFORE UPDATE ON features
  FOR EACH ROW EXECUTE FUNCTION update_feature_updated_at();

CREATE TRIGGER trigger_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_feature_updated_at();

CREATE TRIGGER trigger_client_features_updated_at
  BEFORE UPDATE ON client_features
  FOR EACH ROW EXECUTE FUNCTION update_feature_updated_at();

CREATE TRIGGER trigger_feature_requests_updated_at
  BEFORE UPDATE ON feature_requests
  FOR EACH ROW EXECUTE FUNCTION update_feature_updated_at();

-- =====================================================
-- SEED: Features iniciais
-- =====================================================

INSERT INTO features (code, name, description, category, icon, sort_order) VALUES
  ('reputation', 'Central de Reputação', 'NPS, Google Meu Negócio, Reclame Aqui, análise de sentimento', 'analytics', 'Star', 1),
  ('insights_predictive', 'Insights Preditivos', 'Análises preditivas e recomendações com IA', 'ai', 'Sparkles', 2),
  ('franchisee_analysis', 'Análise de Franqueados', 'Gestão de franquias, testes, ranking', 'management', 'Building2', 3),
  ('franchisee_recruitment', 'Recrutamento de Franqueados', 'Pipeline de candidatos e testes comportamentais', 'management', 'UserPlus', 4),
  ('competitor_analysis', 'Análise de Concorrentes', 'Monitoramento de concorrência e benchmarks', 'analytics', 'Users', 5),
  ('val_ai', 'Assistente Val IA', 'Chat inteligente com IA', 'ai', 'Bot', 6),
  ('gamification', 'Valle Club', 'Sistema de gamificação e recompensas', 'engagement', 'Trophy', 7),
  ('advanced_reports', 'Relatórios Avançados', 'Exportação PDF, BI, dashboards customizados', 'analytics', 'FileText', 8),
  ('integrations_google', 'Integração Google', 'Google Ads, Analytics, Business Profile', 'integration', 'Chrome', 9),
  ('integrations_meta', 'Integração Meta', 'Facebook Ads, Instagram Business', 'integration', 'Facebook', 10),
  ('team_management', 'Gestão de Equipe', 'Visão da equipe e colaboradores', 'management', 'Users', 11),
  ('nps_surveys', 'Pesquisas NPS', 'Envio e análise de pesquisas NPS', 'analytics', 'ThumbsUp', 12)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order;

-- =====================================================
-- SEED: Serviços iniciais
-- =====================================================

INSERT INTO services (code, name, description, base_price, sort_order) VALUES
  ('social_media', 'Social Media', 'Gestão completa de redes sociais', 2500.00, 1),
  ('trafego_pago', 'Tráfego Pago', 'Gestão de campanhas pagas', 3000.00, 2),
  ('design', 'Design Gráfico', 'Criação de peças e identidade visual', 1500.00, 3),
  ('video', 'Produção de Vídeo', 'Edição e produção audiovisual', 2000.00, 4),
  ('web', 'Desenvolvimento Web', 'Sites, landing pages, manutenção', 3500.00, 5),
  ('franquias', 'Gestão de Franquias', 'Solução completa para franqueadoras', 5000.00, 6),
  ('completo', 'Pacote Completo', 'Todos os serviços integrados', 8000.00, 7)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  base_price = EXCLUDED.base_price,
  sort_order = EXCLUDED.sort_order;

-- =====================================================
-- SEED: Relacionamento Serviço x Features
-- =====================================================

-- Social Media libera: insights, val_ai, integrations_meta, gamification
INSERT INTO service_features (service_id, feature_id)
SELECT s.id, f.id FROM services s, features f
WHERE s.code = 'social_media' AND f.code IN ('insights_predictive', 'val_ai', 'integrations_meta', 'gamification')
ON CONFLICT DO NOTHING;

-- Tráfego Pago libera: insights, val_ai, integrations_google, integrations_meta, advanced_reports
INSERT INTO service_features (service_id, feature_id)
SELECT s.id, f.id FROM services s, features f
WHERE s.code = 'trafego_pago' AND f.code IN ('insights_predictive', 'val_ai', 'integrations_google', 'integrations_meta', 'advanced_reports')
ON CONFLICT DO NOTHING;

-- Design libera: val_ai, gamification
INSERT INTO service_features (service_id, feature_id)
SELECT s.id, f.id FROM services s, features f
WHERE s.code = 'design' AND f.code IN ('val_ai', 'gamification')
ON CONFLICT DO NOTHING;

-- Video libera: val_ai, gamification
INSERT INTO service_features (service_id, feature_id)
SELECT s.id, f.id FROM services s, features f
WHERE s.code = 'video' AND f.code IN ('val_ai', 'gamification')
ON CONFLICT DO NOTHING;

-- Web libera: val_ai, integrations_google, advanced_reports
INSERT INTO service_features (service_id, feature_id)
SELECT s.id, f.id FROM services s, features f
WHERE s.code = 'web' AND f.code IN ('val_ai', 'integrations_google', 'advanced_reports')
ON CONFLICT DO NOTHING;

-- Franquias libera: todas as features de franqueado + extras
INSERT INTO service_features (service_id, feature_id)
SELECT s.id, f.id FROM services s, features f
WHERE s.code = 'franquias' AND f.code IN ('franchisee_analysis', 'franchisee_recruitment', 'insights_predictive', 'val_ai', 'advanced_reports', 'nps_surveys', 'team_management')
ON CONFLICT DO NOTHING;

-- Pacote Completo libera: TUDO
INSERT INTO service_features (service_id, feature_id)
SELECT s.id, f.id FROM services s, features f
WHERE s.code = 'completo'
ON CONFLICT DO NOTHING;

-- =====================================================
-- FUNÇÃO: Sincronizar features por contrato
-- =====================================================

CREATE OR REPLACE FUNCTION sync_client_features_from_contract(
  p_client_id UUID,
  p_service_codes TEXT[]
)
RETURNS void AS $$
DECLARE
  v_feature_id UUID;
BEGIN
  -- Buscar todas as features dos serviços contratados
  FOR v_feature_id IN
    SELECT DISTINCT sf.feature_id
    FROM service_features sf
    JOIN services s ON s.id = sf.service_id
    WHERE s.code = ANY(p_service_codes) AND s.is_active = true
  LOOP
    -- Inserir ou atualizar feature do cliente
    INSERT INTO client_features (client_id, feature_id, is_enabled, enabled_by, enabled_at)
    VALUES (p_client_id, v_feature_id, true, 'contract', now())
    ON CONFLICT (client_id, feature_id) 
    DO UPDATE SET 
      is_enabled = true,
      enabled_by = 'contract',
      enabled_at = CASE WHEN client_features.is_enabled = false THEN now() ELSE client_features.enabled_at END,
      updated_at = now();
    
    -- Registrar log
    INSERT INTO feature_logs (client_id, feature_id, action, reason)
    VALUES (p_client_id, v_feature_id, 'enabled', 'Sincronizado por contrato');
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÃO: Verificar se cliente tem feature
-- =====================================================

CREATE OR REPLACE FUNCTION client_has_feature(
  p_client_id UUID,
  p_feature_code TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_feature BOOLEAN;
BEGIN
  SELECT cf.is_enabled INTO v_has_feature
  FROM client_features cf
  JOIN features f ON f.id = cf.feature_id
  WHERE cf.client_id = p_client_id 
    AND f.code = p_feature_code
    AND f.is_active = true
    AND (cf.expires_at IS NULL OR cf.expires_at > now());
  
  RETURN COALESCE(v_has_feature, false);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- RLS Policies
-- =====================================================

ALTER TABLE features ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_logs ENABLE ROW LEVEL SECURITY;

-- Features e Services: leitura para todos autenticados, escrita apenas super_admin
CREATE POLICY "features_read_all" ON features FOR SELECT TO authenticated USING (true);
CREATE POLICY "features_write_admin" ON features FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND user_type IN ('super_admin', 'admin')));

CREATE POLICY "services_read_all" ON services FOR SELECT TO authenticated USING (true);
CREATE POLICY "services_write_admin" ON services FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND user_type IN ('super_admin', 'admin')));

CREATE POLICY "service_features_read_all" ON service_features FOR SELECT TO authenticated USING (true);
CREATE POLICY "service_features_write_admin" ON service_features FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND user_type IN ('super_admin', 'admin')));

-- Client features: cliente vê as suas, admin vê todas
CREATE POLICY "client_features_read" ON client_features FOR SELECT TO authenticated 
  USING (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND user_type IN ('super_admin', 'admin', 'comercial'))
  );
CREATE POLICY "client_features_write_admin" ON client_features FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND user_type IN ('super_admin', 'admin')));

-- Feature requests: comercial pode criar, admin pode ver e gerenciar
CREATE POLICY "feature_requests_read" ON feature_requests FOR SELECT TO authenticated 
  USING (
    requested_by_user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND user_type IN ('super_admin', 'admin'))
  );
CREATE POLICY "feature_requests_create" ON feature_requests FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND user_type IN ('super_admin', 'admin', 'comercial')));
CREATE POLICY "feature_requests_update_admin" ON feature_requests FOR UPDATE TO authenticated 
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND user_type IN ('super_admin', 'admin')));

-- Feature logs: admin pode ver
CREATE POLICY "feature_logs_read_admin" ON feature_logs FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND user_type IN ('super_admin', 'admin')));
CREATE POLICY "feature_logs_write" ON feature_logs FOR INSERT TO authenticated WITH CHECK (true);

-- =====================================================
-- Comentários
-- =====================================================

COMMENT ON TABLE features IS 'Funcionalidades disponíveis no sistema Valle 360';
COMMENT ON TABLE services IS 'Serviços comercializados (Social Media, Tráfego, etc)';
COMMENT ON TABLE service_features IS 'Quais features cada serviço libera automaticamente';
COMMENT ON TABLE client_features IS 'Features habilitadas por cliente';
COMMENT ON TABLE feature_requests IS 'Solicitações de features (Comercial → Super Admin)';
COMMENT ON TABLE feature_logs IS 'Histórico de alterações de features';

