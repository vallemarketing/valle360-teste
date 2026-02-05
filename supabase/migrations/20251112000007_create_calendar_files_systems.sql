-- =====================================================
-- MIGRATION: Sistemas de Calendário e Arquivos
-- Descrição: Eventos, reuniões, arquivos e storage
-- Dependências: 20251112000002_create_clients_system.sql
-- =====================================================

-- =====================================================
-- CALENDÁRIO
-- =====================================================

CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('company', 'client_meeting', 'internal_meeting', 'recording', 'deadline', 'webinar', 'training', 'holiday', 'other')),
  
  start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  all_day BOOLEAN DEFAULT false,
  
  location VARCHAR(255),
  meeting_link TEXT,
  is_online BOOLEAN DEFAULT false,
  
  organizer_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  participants JSONB DEFAULT '[]'::jsonb,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'cancelled', 'completed', 'no_show')),
  
  reminder_minutes JSONB DEFAULT '[15, 60]'::jsonb,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT,
  is_public BOOLEAN DEFAULT false,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  CHECK (end_datetime > start_datetime)
);

CREATE INDEX idx_calendar_events_organizer ON calendar_events(organizer_id);
CREATE INDEX idx_calendar_events_client ON calendar_events(client_id);
CREATE INDEX idx_calendar_events_type ON calendar_events(event_type);
CREATE INDEX idx_calendar_events_status ON calendar_events(status);
CREATE INDEX idx_calendar_events_dates ON calendar_events(start_datetime, end_datetime);

CREATE TABLE IF NOT EXISTS calendar_event_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  
  rsvp_status VARCHAR(20) DEFAULT 'pending' CHECK (rsvp_status IN ('pending', 'accepted', 'declined', 'tentative')),
  rsvp_at TIMESTAMP WITH TIME ZONE,
  attended BOOLEAN,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  UNIQUE(event_id, user_id)
);

CREATE INDEX idx_calendar_participants_event ON calendar_event_participants(event_id);
CREATE INDEX idx_calendar_participants_user ON calendar_event_participants(user_id);

CREATE TABLE IF NOT EXISTS meeting_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  target_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  meeting_type VARCHAR(50),
  
  proposed_dates JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'rescheduled', 'cancelled')),
  
  selected_date TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  counter_proposal_dates JSONB,
  calendar_event_id UUID REFERENCES calendar_events(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  responded_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_meeting_requests_requester ON meeting_requests(requester_id);
CREATE INDEX idx_meeting_requests_target ON meeting_requests(target_id);
CREATE INDEX idx_meeting_requests_status ON meeting_requests(status);

-- =====================================================
-- ARQUIVOS
-- =====================================================

CREATE TABLE IF NOT EXISTS client_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,
  file_type VARCHAR(100),
  file_extension VARCHAR(10),
  
  storage_path TEXT NOT NULL,
  storage_bucket VARCHAR(100) DEFAULT 'client-files',
  public_url TEXT,
  
  category VARCHAR(50) DEFAULT 'other' CHECK (category IN ('reference', 'briefing', 'brand', 'content', 'contract', 'other')),
  tags JSONB DEFAULT '[]'::jsonb,
  description TEXT,
  notes TEXT,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  
  uploaded_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  upload_status VARCHAR(20) DEFAULT 'completed' CHECK (upload_status IN ('uploading', 'completed', 'failed')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_client_files_client ON client_files(client_id);
CREATE INDEX idx_client_files_category ON client_files(category);
CREATE INDEX idx_client_files_uploaded_by ON client_files(uploaded_by);
CREATE INDEX idx_client_files_active ON client_files(is_active) WHERE is_active = true;

CREATE TABLE IF NOT EXISTS file_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES client_files(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  access_type VARCHAR(20) NOT NULL CHECK (access_type IN ('view', 'download', 'share', 'delete')),
  ip_address INET,
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_file_access_log_file ON file_access_log(file_id);
CREATE INDEX idx_file_access_log_user ON file_access_log(user_id);
CREATE INDEX idx_file_access_log_accessed ON file_access_log(accessed_at DESC);

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_files_updated_at
  BEFORE UPDATE ON client_files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_access_log ENABLE ROW LEVEL SECURITY;

-- Políticas para calendar_events
CREATE POLICY "Ver eventos próprios ou públicos"
  ON calendar_events FOR SELECT
  USING (
    is_public = true
    OR organizer_id = auth.uid()
    OR auth.uid() = ANY(SELECT jsonb_array_elements_text(participants)::uuid)
  );

CREATE POLICY "Criar eventos"
  ON calendar_events FOR INSERT
  WITH CHECK (organizer_id = auth.uid());

-- Políticas para client_files
CREATE POLICY "Clientes veem seus arquivos"
  ON client_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN clients c ON c.id = up.client_id
      WHERE c.id = client_files.client_id
      AND up.user_id = auth.uid()
    )
  );

CREATE POLICY "Colaboradores veem todos os arquivos"
  ON client_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type != 'client'
      AND user_profiles.is_active = true
    )
  );

-- =====================================================
-- Fim da Migration: Calendário e Arquivos
-- =====================================================

