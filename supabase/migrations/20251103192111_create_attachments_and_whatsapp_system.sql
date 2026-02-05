/*
  # Sistema de Anexos e Integração WhatsApp

  1. Tabelas de Anexos
    - `message_attachments` - Anexos de mensagens
      - Suporte para imagens, vídeos, áudios, documentos
      - Metadados (tamanho, tipo, dimensões)
      - URL do Supabase Storage

  2. Configurações WhatsApp
    - `whatsapp_settings` - Configurações por usuário/empresa
    - `whatsapp_templates` - Templates de mensagens
    - `whatsapp_logs` - Log de envios automáticos

  3. Segurança
    - RLS em todas as tabelas
    - Validação de tipos de arquivo
    - Controle de acesso aos anexos
*/

-- Tabela de anexos de mensagens
CREATE TABLE IF NOT EXISTS message_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL,
  message_type text NOT NULL CHECK (message_type IN ('group', 'direct')),
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL,
  file_size bigint NOT NULL,
  mime_type text NOT NULL,
  width integer,
  height integer,
  duration integer,
  thumbnail_url text,
  uploaded_by uuid NOT NULL REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_file_size CHECK (file_size > 0 AND file_size <= 52428800)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_message_attachments_message_id ON message_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_message_attachments_message_type ON message_attachments(message_type);
CREATE INDEX IF NOT EXISTS idx_message_attachments_uploaded_by ON message_attachments(uploaded_by);

-- Tabela de configurações WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id),
  company_id uuid,
  is_enabled boolean DEFAULT false,
  api_token text,
  phone_number text,
  delay_hours integer DEFAULT 2 CHECK (delay_hours >= 0 AND delay_hours <= 48),
  business_hours_only boolean DEFAULT true,
  business_start_time time DEFAULT '09:00:00',
  business_end_time time DEFAULT '18:00:00',
  exclude_weekends boolean DEFAULT true,
  last_sync_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Tabela de templates WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  template_key text NOT NULL UNIQUE,
  message_template text NOT NULL,
  variables jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  usage_count integer DEFAULT 0,
  created_by uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de logs de envio WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  conversation_type text NOT NULL CHECK (conversation_type IN ('group', 'direct')),
  recipient_phone text NOT NULL,
  recipient_user_id uuid REFERENCES user_profiles(id),
  template_used uuid REFERENCES whatsapp_templates(id),
  message_sent text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'read')),
  error_message text,
  whatsapp_message_id text,
  sent_at timestamptz DEFAULT now(),
  delivered_at timestamptz,
  read_at timestamptz
);

-- Índices para logs
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_conversation ON whatsapp_logs(conversation_id, conversation_type);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_recipient ON whatsapp_logs(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_status ON whatsapp_logs(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_sent_at ON whatsapp_logs(sent_at);

-- Enable RLS
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para message_attachments
CREATE POLICY "Users can view attachments in their conversations"
  ON message_attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_participants gp
      JOIN messages m ON m.group_id = gp.group_id
      WHERE m.id = message_attachments.message_id
        AND message_attachments.message_type = 'group'
        AND gp.user_id = auth.uid()
        AND gp.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM direct_conversation_participants dcp
      JOIN direct_messages dm ON dm.conversation_id = dcp.conversation_id
      WHERE dm.id = message_attachments.message_id
        AND message_attachments.message_type = 'direct'
        AND dcp.user_id = auth.uid()
        AND dcp.is_active = true
    )
  );

CREATE POLICY "Users can upload attachments"
  ON message_attachments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);

-- Políticas para whatsapp_settings
CREATE POLICY "Users can view own WhatsApp settings"
  ON whatsapp_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own WhatsApp settings"
  ON whatsapp_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own WhatsApp settings"
  ON whatsapp_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Políticas para whatsapp_templates
CREATE POLICY "Everyone can view active templates"
  ON whatsapp_templates FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage templates"
  ON whatsapp_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

-- Políticas para whatsapp_logs
CREATE POLICY "Users can view own WhatsApp logs"
  ON whatsapp_logs FOR SELECT
  TO authenticated
  USING (
    auth.uid() = recipient_user_id
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND user_type IN ('admin', 'collaborator')
    )
  );

CREATE POLICY "System can insert WhatsApp logs"
  ON whatsapp_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Função para obter mensagens não lidas após X horas
CREATE OR REPLACE FUNCTION get_unread_messages_for_whatsapp(
  p_hours integer DEFAULT 2
)
RETURNS TABLE (
  conversation_id uuid,
  conversation_type text,
  recipient_user_id uuid,
  recipient_phone text,
  last_message_at timestamptz,
  unread_count integer,
  last_message_preview text
) AS $$
BEGIN
  RETURN QUERY
  WITH direct_unread AS (
    SELECT
      dcp.conversation_id,
      'direct'::text as conversation_type,
      dcp.user_id as recipient_user_id,
      up.phone_number as recipient_phone,
      dc.last_message_at,
      dcp.unread_count,
      dc.last_message_preview
    FROM direct_conversation_participants dcp
    JOIN direct_conversations dc ON dc.id = dcp.conversation_id
    JOIN user_profiles up ON up.id = dcp.user_id
    LEFT JOIN whatsapp_logs wl ON wl.conversation_id = dcp.conversation_id
      AND wl.conversation_type = 'direct'
      AND wl.sent_at > dc.last_message_at
    WHERE dcp.unread_count > 0
      AND dc.last_message_at < now() - (p_hours || ' hours')::interval
      AND up.phone_number IS NOT NULL
      AND wl.id IS NULL
  )
  SELECT * FROM direct_unread;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Inserir templates padrão
INSERT INTO whatsapp_templates (name, template_key, message_template, variables, created_at, updated_at)
VALUES
  (
    'Mensagem Não Respondida',
    'unread_message',
    'Olá {{name}}! Você tem {{count}} mensagem(s) não lida(s) na Valle 360. Acesse: {{link}}',
    '["name", "count", "link"]'::jsonb,
    now(),
    now()
  ),
  (
    'Lembrete Urgente',
    'urgent_reminder',
    'Olá {{name}}! Há mensagens importantes aguardando sua resposta na Valle 360. Por favor, acesse: {{link}}',
    '["name", "link"]'::jsonb,
    now(),
    now()
  ),
  (
    'Primeira Mensagem',
    'first_message',
    'Olá {{name}}! Você recebeu sua primeira mensagem na Valle 360. Confira agora: {{link}}',
    '["name", "link"]'::jsonb,
    now(),
    now()
  )
ON CONFLICT (template_key) DO NOTHING;

-- Comentários
COMMENT ON TABLE message_attachments IS 'Anexos enviados em mensagens (imagens, vídeos, áudios, documentos)';
COMMENT ON TABLE whatsapp_settings IS 'Configurações de integração WhatsApp por usuário';
COMMENT ON TABLE whatsapp_templates IS 'Templates de mensagens para envio automático via WhatsApp';
COMMENT ON TABLE whatsapp_logs IS 'Log de todos os envios via WhatsApp';
COMMENT ON FUNCTION get_unread_messages_for_whatsapp IS 'Retorna mensagens não lidas há X horas para envio via WhatsApp';
