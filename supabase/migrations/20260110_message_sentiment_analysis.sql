-- Migration: Criar tabela message_sentiment_analysis
-- Data: 2026-01-10
-- Descrição: Tabela para armazenar análise de sentimento das mensagens do chat

-- Tabela principal
CREATE TABLE IF NOT EXISTS message_sentiment_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  conversation_type VARCHAR(20), -- 'group', 'direct_team', 'direct_client'
  sender_type VARCHAR(20), -- 'client', 'collaborator', 'admin'
  sender_id UUID,
  client_id UUID, -- Se conversa envolve cliente
  group_id UUID, -- Se for mensagem de grupo
  sentiment VARCHAR(20), -- 'positive', 'neutral', 'negative'
  score DECIMAL(4,3), -- -1.0 a 1.0
  magnitude DECIMAL(4,3),
  confidence DECIMAL(3,2),
  entities JSONB DEFAULT '[]',
  keywords TEXT[] DEFAULT '{}',
  summary TEXT,
  alert_generated BOOLEAN DEFAULT FALSE,
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_sentiment CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  CONSTRAINT valid_conversation_type CHECK (conversation_type IN ('group', 'direct_team', 'direct_client')),
  CONSTRAINT valid_sender_type CHECK (sender_type IN ('client', 'collaborator', 'admin', 'super_admin'))
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_sentiment_date ON message_sentiment_analysis(analyzed_at DESC);
CREATE INDEX IF NOT EXISTS idx_sentiment_score ON message_sentiment_analysis(score);
CREATE INDEX IF NOT EXISTS idx_sentiment_client ON message_sentiment_analysis(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sentiment_type ON message_sentiment_analysis(conversation_type);
CREATE INDEX IF NOT EXISTS idx_sentiment_sentiment ON message_sentiment_analysis(sentiment);
CREATE INDEX IF NOT EXISTS idx_sentiment_message ON message_sentiment_analysis(message_id);

-- Tabela de alertas de sentimento (para notificar Super Admin)
CREATE TABLE IF NOT EXISTS sentiment_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES message_sentiment_analysis(id) ON DELETE CASCADE,
  alert_type VARCHAR(50), -- 'negative_client', 'negative_trend', 'conflict_detected'
  severity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  title TEXT NOT NULL,
  description TEXT,
  conversation_id UUID, -- ID do grupo ou conversa direta
  conversation_name TEXT,
  suggested_action TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'acknowledged', 'resolved', 'dismissed'
  acknowledged_by UUID,
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_status ON sentiment_alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON sentiment_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_created ON sentiment_alerts(created_at DESC);

-- Comentários
COMMENT ON TABLE message_sentiment_analysis IS 'Armazena análise de sentimento das mensagens do chat para insights do Super Admin';
COMMENT ON TABLE sentiment_alerts IS 'Alertas gerados quando sentimento negativo é detectado';
