-- =====================================================================================
-- Migration: Rede de Parceiros & Co-venda
-- Descrição: Sistema de parcerias estratégicas com split de comissão
-- Versão: 1.0
-- Data: 2025-11-12
-- =====================================================================================

CREATE TABLE IF NOT EXISTS partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_name VARCHAR(255) NOT NULL,
    partner_type VARCHAR(50), -- 'agency', 'freelancer', 'consultant', 'influencer', 'reseller'
    company_name VARCHAR(255),
    
    -- Contato
    contact_person VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    website VARCHAR(500),
    
    -- Especialização
    specialties JSONB, -- ['design', 'dev', 'video', ...]
    services_offered JSONB,
    target_industries JSONB,
    
    -- Comissionamento
    default_commission_percent DECIMAL(5,2) DEFAULT 10,
    payment_terms VARCHAR(100),
    pix_key VARCHAR(255),
    
    -- Performance
    deals_closed INTEGER DEFAULT 0,
    total_revenue_generated DECIMAL(12,2) DEFAULT 0,
    total_commission_paid DECIMAL(12,2) DEFAULT 0,
    avg_deal_size DECIMAL(10,2) DEFAULT 0,
    partner_rating DECIMAL(3,2) DEFAULT 0, -- 0-5
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- 'pending', 'active', 'paused', 'terminated'
    onboarded_at TIMESTAMP WITH TIME ZONE,
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cosale_deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id),
    
    -- Parceiros envolvidos
    partners JSONB NOT NULL, -- [{partner_id: UUID, role: 'lead|support', commission: 15}]
    
    -- Split
    our_revenue_percent DECIMAL(5,2) NOT NULL,
    partner_revenue_percent DECIMAL(5,2) NOT NULL,
    
    -- Valores
    total_deal_value DECIMAL(10,2) NOT NULL,
    our_revenue DECIMAL(10,2),
    partner_revenue DECIMAL(10,2),
    
    -- Status
    status VARCHAR(20) DEFAULT 'proposed', -- 'proposed', 'accepted', 'in_progress', 'won', 'lost'
    
    -- Acordo
    agreement_terms TEXT,
    agreement_signed_at TIMESTAMP WITH TIME ZONE,
    
    -- Resultado
    won_at TIMESTAMP WITH TIME ZONE,
    lost_reason TEXT,
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS partner_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    cosale_deal_id UUID REFERENCES cosale_deals(id),
    
    -- Comissão
    commission_amount DECIMAL(10,2) NOT NULL,
    commission_percent DECIMAL(5,2),
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'paid', 'cancelled'
    
    -- Pagamento
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    payment_method VARCHAR(50),
    payment_proof_url VARCHAR(500),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_partners_type ON partners(partner_type);
CREATE INDEX idx_partners_status ON partners(status);
CREATE INDEX idx_cosale_deals_deal ON cosale_deals(deal_id);
CREATE INDEX idx_cosale_deals_status ON cosale_deals(status);
CREATE INDEX idx_partner_commissions_partner ON partner_commissions(partner_id);
CREATE INDEX idx_partner_commissions_status ON partner_commissions(status);

COMMENT ON TABLE partners IS 'Rede de parceiros estratégicos';
COMMENT ON TABLE cosale_deals IS 'Deals em co-venda com parceiros';

-- RLS
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE cosale_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_partners ON partners FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role IN ('super_admin', 'admin', 'comercial'))
);

CREATE POLICY admin_cosale_deals ON cosale_deals FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role IN ('super_admin', 'admin', 'comercial'))
);

CREATE POLICY admin_partner_commissions ON partner_commissions FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role IN ('super_admin', 'admin', 'financeiro'))
);

CREATE TRIGGER update_partners_timestamp BEFORE UPDATE ON partners FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
CREATE TRIGGER update_cosale_deals_timestamp BEFORE UPDATE ON cosale_deals FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
CREATE TRIGGER update_partner_commissions_timestamp BEFORE UPDATE ON partner_commissions FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

COMMENT ON SCHEMA public IS 'Migration 36: Rede de Parceiros';

