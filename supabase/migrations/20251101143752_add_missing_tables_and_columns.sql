/*
  # Adicionar Tabelas e Colunas Faltantes

  ## Alterações nas Tabelas Existentes
  - Adicionar colunas em message_groups
  
  ## Novas Tabelas
  - group_members
  - kanban_columns  
  - kanban_cards
  - goals
  - performance_metrics
  - recruitment_posts
  - candidates
  - ai_recommendations
  - calendar_events (substituir eventos)
  - notifications

  ## Segurança
  - RLS habilitado
  - Políticas apropriadas
*/

-- Atualizar message_groups para ter as colunas necessárias
ALTER TABLE message_groups ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE message_groups ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE message_groups ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE message_groups ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE message_groups ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Criar group_members
CREATE TABLE IF NOT EXISTS group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES message_groups(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at timestamptz DEFAULT now(),
  last_read_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Criar kanban_columns
CREATE TABLE IF NOT EXISTS kanban_columns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id text NOT NULL,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#6B7280',
  position integer NOT NULL DEFAULT 0,
  wip_limit integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar kanban_cards
CREATE TABLE IF NOT EXISTS kanban_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  column_id uuid REFERENCES kanban_columns(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  assignee text NOT NULL,
  priority text NOT NULL DEFAULT 'media' CHECK (priority IN ('baixa', 'media', 'alta', 'urgente')),
  tags text[] DEFAULT '{}',
  position integer NOT NULL DEFAULT 0,
  comments_count integer DEFAULT 0,
  attachments_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar goals
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  target_value numeric NOT NULL,
  current_value numeric DEFAULT 0,
  unit text NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'failed')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar performance_metrics
CREATE TABLE IF NOT EXISTS performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  month integer NOT NULL CHECK (month BETWEEN 1 AND 12),
  year integer NOT NULL,
  tasks_completed integer DEFAULT 0,
  tasks_late integer DEFAULT 0,
  avg_completion_time numeric DEFAULT 0,
  client_satisfaction numeric DEFAULT 0,
  productivity_score numeric DEFAULT 0,
  ranking_position integer,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, month, year)
);

-- Criar recruitment_posts
CREATE TABLE IF NOT EXISTS recruitment_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  department text NOT NULL,
  employment_type text NOT NULL DEFAULT 'full-time' CHECK (employment_type IN ('full-time', 'part-time', 'contract', 'internship')),
  experience_level text NOT NULL DEFAULT 'mid' CHECK (experience_level IN ('entry', 'mid', 'senior', 'lead')),
  location text NOT NULL,
  salary_range text,
  requirements text[] DEFAULT '{}',
  benefits text[] DEFAULT '{}',
  linkedin_post_id text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'closed')),
  posted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  posted_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar candidates
CREATE TABLE IF NOT EXISTS candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recruitment_post_id uuid REFERENCES recruitment_posts(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  linkedin_url text,
  resume_url text,
  cover_letter text,
  status text NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'screening', 'interview', 'offer', 'hired', 'rejected')),
  rating numeric CHECK (rating BETWEEN 0 AND 5),
  notes text,
  applied_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar ai_recommendations
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('client', 'employee', 'company', 'project')),
  target_id uuid,
  title text NOT NULL,
  description text NOT NULL,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  action_items jsonb DEFAULT '[]',
  impact_score numeric DEFAULT 0,
  is_dismissed boolean DEFAULT false,
  is_acted_on boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- Criar calendar_events (completo)
CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_type text NOT NULL DEFAULT 'meeting' CHECK (event_type IN ('meeting', 'deadline', 'recording', 'company_event', 'client_meeting', 'other')),
  start_datetime timestamptz NOT NULL,
  end_datetime timestamptz NOT NULL,
  all_day boolean DEFAULT false,
  location text,
  meeting_link text,
  organizer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  participants uuid[] DEFAULT '{}',
  client_id uuid,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'cancelled', 'completed')),
  reminders integer[] DEFAULT '{15, 60}',
  is_recurring boolean DEFAULT false,
  recurrence_rule text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  action_url text,
  is_read boolean DEFAULT false,
  is_sent_whatsapp boolean DEFAULT false,
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at timestamptz DEFAULT now(),
  read_at timestamptz
);

-- Habilitar RLS
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Políticas para group_members
CREATE POLICY "Users can view their group memberships"
  ON group_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Super admin can manage group members"
  ON group_members FOR ALL
  TO authenticated
  USING ((SELECT auth.jwt()->>'role') = 'super_admin')
  WITH CHECK ((SELECT auth.jwt()->>'role') = 'super_admin');

-- Políticas para kanban_columns
CREATE POLICY "Authenticated users can view columns"
  ON kanban_columns FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage columns"
  ON kanban_columns FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Políticas para kanban_cards
CREATE POLICY "Authenticated users can view cards"
  ON kanban_cards FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage cards"
  ON kanban_cards FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Políticas para goals
CREATE POLICY "Users can view their goals"
  ON goals FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR (SELECT auth.jwt()->>'role') = 'super_admin');

CREATE POLICY "Super admin can manage goals"
  ON goals FOR ALL
  TO authenticated
  USING ((SELECT auth.jwt()->>'role') = 'super_admin')
  WITH CHECK ((SELECT auth.jwt()->>'role') = 'super_admin');

-- Políticas para performance_metrics
CREATE POLICY "Users can view their performance"
  ON performance_metrics FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR (SELECT auth.jwt()->>'role') = 'super_admin');

CREATE POLICY "System can manage performance metrics"
  ON performance_metrics FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Políticas para recruitment_posts
CREATE POLICY "Super admin can manage posts"
  ON recruitment_posts FOR ALL
  TO authenticated
  USING ((SELECT auth.jwt()->>'role') = 'super_admin')
  WITH CHECK ((SELECT auth.jwt()->>'role') = 'super_admin');

CREATE POLICY "Everyone can view active posts"
  ON recruitment_posts FOR SELECT
  TO authenticated
  USING (status = 'active');

-- Políticas para candidates
CREATE POLICY "Super admin can manage candidates"
  ON candidates FOR ALL
  TO authenticated
  USING ((SELECT auth.jwt()->>'role') = 'super_admin')
  WITH CHECK ((SELECT auth.jwt()->>'role') = 'super_admin');

-- Políticas para ai_recommendations
CREATE POLICY "Super admin and users can view recommendations"
  ON ai_recommendations FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.jwt()->>'role') = 'super_admin' 
    OR (target_id = auth.uid() AND target_type = 'employee')
  );

CREATE POLICY "System can create recommendations"
  ON ai_recommendations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Super admin can update recommendations"
  ON ai_recommendations FOR UPDATE
  TO authenticated
  USING ((SELECT auth.jwt()->>'role') = 'super_admin');

-- Políticas para calendar_events
CREATE POLICY "Users can view their events"
  ON calendar_events FOR SELECT
  TO authenticated
  USING (
    auth.uid() = ANY(participants) 
    OR organizer_id = auth.uid()
    OR (SELECT auth.jwt()->>'role') = 'super_admin'
  );

CREATE POLICY "Authenticated users can create events"
  ON calendar_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Organizers can update events"
  ON calendar_events FOR UPDATE
  TO authenticated
  USING (organizer_id = auth.uid() OR (SELECT auth.jwt()->>'role') = 'super_admin');

CREATE POLICY "Super admin can delete events"
  ON calendar_events FOR DELETE
  TO authenticated
  USING ((SELECT auth.jwt()->>'role') = 'super_admin');

-- Políticas para notifications
CREATE POLICY "Users can view their notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Índices
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_kanban_columns_board_id ON kanban_columns(board_id, position);
CREATE INDEX IF NOT EXISTS idx_kanban_cards_column_id ON kanban_cards(column_id, position);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_id ON performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_period ON performance_metrics(year, month);
CREATE INDEX IF NOT EXISTS idx_recruitment_posts_status ON recruitment_posts(status);
CREATE INDEX IF NOT EXISTS idx_candidates_post_id ON candidates(recruitment_post_id);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_target ON ai_recommendations(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_datetime ON calendar_events(start_datetime, end_datetime);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id, is_read);

-- Inserir colunas padrão no kanban
INSERT INTO kanban_columns (board_id, name, color, position) 
VALUES 
  ('general', 'Backlog', '#6B7280', 0),
  ('general', 'Em Produção', '#3B82F6', 1),
  ('general', 'Aguardando Aprovação', '#F59E0B', 2),
  ('general', 'Concluído', '#10B981', 3)
ON CONFLICT DO NOTHING;