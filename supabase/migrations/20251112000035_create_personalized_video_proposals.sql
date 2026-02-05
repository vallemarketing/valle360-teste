-- =====================================================================================
-- Migration: Vídeos de Proposta Personalizados
-- Descrição: IA gera vídeos personalizados com nome, logo e dados do cliente
-- Versão: 1.0
-- Data: 2025-11-12
-- =====================================================================================

CREATE TABLE IF NOT EXISTS video_proposal_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name VARCHAR(255) NOT NULL,
    base_video_url VARCHAR(500) NOT NULL,
    duration_seconds INTEGER,
    
    -- Campos personalizáveis
    personalization_fields JSONB, -- [{field: 'client_name', position: '00:05'}, ...]
    
    -- Assets
    intro_template_url VARCHAR(500),
    outro_template_url VARCHAR(500),
    background_music_url VARCHAR(500),
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS personalized_video_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES video_proposal_templates(id),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    proposal_id UUID REFERENCES generated_proposals(id) ON DELETE CASCADE,
    
    -- Personalização
    client_name VARCHAR(255) NOT NULL,
    client_company VARCHAR(255),
    client_logo_url VARCHAR(500),
    personalization_data JSONB, -- Todos os dados personalizados
    
    -- Vídeo gerado
    video_url VARCHAR(500),
    thumbnail_url VARCHAR(500),
    video_duration_seconds INTEGER,
    
    -- Geração
    generation_status VARCHAR(20) DEFAULT 'queued', -- 'queued', 'processing', 'completed', 'failed'
    generation_started_at TIMESTAMP WITH TIME ZONE,
    generation_completed_at TIMESTAMP WITH TIME ZONE,
    generation_error TEXT,
    
    -- Envio
    sent_via JSONB, -- ['email', 'whatsapp']
    sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Tracking
    views_count INTEGER DEFAULT 0,
    first_viewed_at TIMESTAMP WITH TIME ZONE,
    last_viewed_at TIMESTAMP WITH TIME ZONE,
    total_watch_time_seconds INTEGER DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Resposta
    client_responded BOOLEAN DEFAULT false,
    client_response TEXT,
    responded_at TIMESTAMP WITH TIME ZONE,
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_video_proposals_lead ON personalized_video_proposals(lead_id);
CREATE INDEX idx_video_proposals_proposal ON personalized_video_proposals(proposal_id);
CREATE INDEX idx_video_proposals_status ON personalized_video_proposals(generation_status);
CREATE INDEX idx_video_proposals_sent ON personalized_video_proposals(sent_at DESC);

COMMENT ON TABLE personalized_video_proposals IS 'Vídeos de proposta personalizados gerados com IA';

-- RLS
ALTER TABLE video_proposal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE personalized_video_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_video_templates ON video_proposal_templates FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role IN ('super_admin', 'admin'))
);

CREATE POLICY sales_team_video_proposals ON personalized_video_proposals FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role IN ('super_admin', 'admin', 'comercial'))
);

CREATE TRIGGER update_video_proposals_timestamp BEFORE UPDATE ON personalized_video_proposals FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

COMMENT ON SCHEMA public IS 'Migration 35: Vídeos Personalizados';

