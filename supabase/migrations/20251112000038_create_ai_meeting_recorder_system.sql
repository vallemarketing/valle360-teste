-- =====================================================================================
-- Migration: Gravação de Reuniões com IA
-- Descrição: Integração com Zoom/Meet/Teams, transcrição automática e insights
-- Versão: 1.0
-- Data: 2025-11-12
-- =====================================================================================

CREATE TABLE IF NOT EXISTS meeting_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform VARCHAR(50) NOT NULL, -- 'zoom', 'google_meet', 'microsoft_teams', 'whereby'
    
    -- Credenciais
    api_key TEXT, -- CRIPTOGRAFADO
    access_token TEXT, -- CRIPTOGRAFADO
    refresh_token TEXT, -- CRIPTOGRAFADO
    
    -- Configuração
    auto_record BOOLEAN DEFAULT true,
    auto_transcribe BOOLEAN DEFAULT true,
    recording_consent_required BOOLEAN DEFAULT true,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_synced_at TIMESTAMP WITH TIME ZONE,
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recorded_meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID REFERENCES meeting_integrations(id),
    
    -- Reunião
    external_meeting_id VARCHAR(255), -- ID na plataforma
    platform VARCHAR(50) NOT NULL,
    meeting_title VARCHAR(255),
    meeting_url TEXT,
    
    -- Participantes
    host_user_id UUID REFERENCES users(id),
    participants JSONB, -- [{name: 'João', email: 'joao@x.com', duration_minutes: 45}]
    
    -- Lead/Cliente relacionado
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
    
    -- Gravação
    recording_url VARCHAR(500),
    recording_duration_minutes INTEGER,
    recording_size_mb INTEGER,
    
    -- Transcrição
    transcript_text TEXT,
    transcript_url VARCHAR(500),
    transcript_language VARCHAR(10) DEFAULT 'pt-BR',
    
    -- Status
    recording_status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'recording', 'processing', 'completed', 'failed'
    transcription_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    
    -- Timing
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS meeting_ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recorded_meeting_id UUID NOT NULL REFERENCES recorded_meetings(id) ON DELETE CASCADE,
    
    -- Análise automática
    key_topics JSONB, -- ['pricing', 'timeline', 'features']
    action_items JSONB, -- [{action: 'enviar proposta', assigned_to: 'João', deadline: '2025-12-15'}]
    decisions_made JSONB, -- ['Aprovado orçamento', 'Definido prazo']
    
    -- Objections detectadas
    objections_raised JSONB, -- [{objection: 'preço alto', timestamp: '00:15:23', response: '...'}]
    concerns_mentioned JSONB,
    
    -- Sentimento
    overall_sentiment VARCHAR(20), -- 'very_positive', 'positive', 'neutral', 'negative'
    sentiment_by_participant JSONB,
    client_engagement_level VARCHAR(20), -- 'high', 'medium', 'low'
    
    -- Budget e timeline
    budget_mentioned VARCHAR(50),
    budget_amount DECIMAL(10,2),
    timeline_mentioned VARCHAR(100),
    decision_makers_identified JSONB,
    
    -- Próximos passos
    next_meeting_scheduled BOOLEAN DEFAULT false,
    next_meeting_date TIMESTAMP WITH TIME ZONE,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_suggestions TEXT,
    
    -- Proposta
    proposal_requested BOOLEAN DEFAULT false,
    proposal_requirements JSONB,
    
    -- Scoring
    deal_temperature VARCHAR(20), -- 'hot', 'warm', 'cold'
    win_probability DECIMAL(5,2), -- 0-100
    
    -- IA
    model_version VARCHAR(50),
    confidence_score DECIMAL(5,2),
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS meeting_auto_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recorded_meeting_id UUID NOT NULL REFERENCES recorded_meetings(id) ON DELETE CASCADE,
    
    -- Ação automática
    action_type VARCHAR(50) NOT NULL, -- 'create_task', 'send_email', 'create_proposal', 'update_deal', 'schedule_followup'
    action_description TEXT,
    
    -- Detalhes
    action_data JSONB,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'executed', 'failed', 'cancelled'
    executed_at TIMESTAMP WITH TIME ZONE,
    execution_result TEXT,
    
    -- Relação
    task_id UUID, -- Se criou task
    proposal_id UUID REFERENCES generated_proposals(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recorded_meetings_lead ON recorded_meetings(lead_id);
CREATE INDEX idx_recorded_meetings_client ON recorded_meetings(client_id);
CREATE INDEX idx_recorded_meetings_deal ON recorded_meetings(deal_id);
CREATE INDEX idx_recorded_meetings_status ON recorded_meetings(recording_status);
CREATE INDEX idx_meeting_insights_meeting ON meeting_ai_insights(recorded_meeting_id);
CREATE INDEX idx_meeting_auto_actions_meeting ON meeting_auto_actions(recorded_meeting_id);
CREATE INDEX idx_meeting_auto_actions_status ON meeting_auto_actions(status);

COMMENT ON TABLE recorded_meetings IS 'Reuniões gravadas com transcrição automática';
COMMENT ON TABLE meeting_ai_insights IS 'Insights gerados por IA das reuniões';

-- RLS
ALTER TABLE meeting_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE recorded_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_auto_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_meeting_integrations ON meeting_integrations FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role IN ('super_admin', 'admin'))
);

CREATE POLICY sales_recorded_meetings ON recorded_meetings FOR ALL TO authenticated USING (
    host_user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role IN ('super_admin', 'admin', 'comercial'))
);

CREATE POLICY sales_meeting_insights ON meeting_ai_insights FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM recorded_meetings 
        WHERE recorded_meetings.id = meeting_ai_insights.recorded_meeting_id 
        AND (recorded_meetings.host_user_id = auth.uid() OR EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role IN ('super_admin', 'admin', 'comercial')))
    )
);

CREATE POLICY sales_meeting_actions ON meeting_auto_actions FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role IN ('super_admin', 'admin', 'comercial'))
);

CREATE TRIGGER update_recorded_meetings_timestamp BEFORE UPDATE ON recorded_meetings FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
CREATE TRIGGER update_meeting_insights_timestamp BEFORE UPDATE ON meeting_ai_insights FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

COMMENT ON SCHEMA public IS 'Migration 38: Gravação de Reuniões com IA';

