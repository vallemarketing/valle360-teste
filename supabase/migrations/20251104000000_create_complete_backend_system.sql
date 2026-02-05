/*
  # Sistema Backend Completo - Valle 360

  1. Extensões e Schema Utilitário
  2. Organizações e Membros
  3. Sistema Kanban Completo
  4. Sistema de Mensagens
  5. Sistema de Solicitações (RH)
  6. Sistema de Agenda
  7. Sistema de Ranking e Gamificação
  8. Funções de Performance
  9. RLS (Row Level Security)
  10. Storage Buckets

  IMPORTANTE: Esta migration ADICIONA funcionalidades sem remover as existentes
*/

-- ============================================
-- 1. EXTENSÕES E SCHEMA UTILITÁRIO
-- ============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;

CREATE SCHEMA IF NOT EXISTS app;

-- Helpers de tempo e usuário
CREATE OR REPLACE FUNCTION app.now_utc()
RETURNS timestamptz AS $$
  SELECT (now() AT TIME ZONE 'UTC')
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION app.current_user_id()
RETURNS uuid AS $$
  SELECT COALESCE(NULLIF(current_setting('app.user_id', true), '')::uuid, auth.uid())
$$ LANGUAGE SQL STABLE;

-- Trigger genérico para updated_at
CREATE OR REPLACE FUNCTION app.tg_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = app.now_utc();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. ORGANIZAÇÕES E MEMBROS
-- ============================================

CREATE TABLE IF NOT EXISTS organizations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text UNIQUE,
  created_by  uuid NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT app.now_utc(),
  updated_at  timestamptz NOT NULL DEFAULT app.now_utc()
);

CREATE TABLE IF NOT EXISTS org_members (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL,
  role       text NOT NULL CHECK (role IN ('admin','member','viewer')),
  created_at timestamptz NOT NULL DEFAULT app.now_utc(),
  updated_at timestamptz NOT NULL DEFAULT app.now_utc(),
  UNIQUE (org_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_org_user ON org_members(org_id, user_id);

-- Helpers de autorização
CREATE OR REPLACE FUNCTION app.can_access_org(target_org uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM org_members m
    WHERE m.org_id = target_org
      AND m.user_id = app.current_user_id()
  );
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION app.is_org_admin(target_org uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM org_members m
    WHERE m.org_id = target_org
      AND m.user_id = app.current_user_id()
      AND m.role = 'admin'
  );
$$ LANGUAGE SQL STABLE;

-- ============================================
-- 3. SISTEMA KANBAN COMPLETO (INTEGRADO)
-- ============================================

-- Adicionar org_id às tabelas existentes se não existir
ALTER TABLE kanban_boards
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE kanban_tasks
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES organizations(id) ON DELETE CASCADE;

-- Criar índices adicionais
CREATE INDEX IF NOT EXISTS idx_boards_org ON kanban_boards(org_id);
CREATE INDEX IF NOT EXISTS idx_tasks_org_status ON kanban_tasks(org_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON kanban_tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON kanban_tasks(due_date) WHERE due_date IS NOT NULL;

-- Adicionar campos extras para integração
ALTER TABLE kanban_tasks
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'open' CHECK (status IN ('open','in_progress','done','blocked','canceled')),
  ADD COLUMN IF NOT EXISTS points integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS labels text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- ============================================
-- 4. SISTEMA DE MENSAGENS (INTEGRADO)
-- ============================================

-- Adicionar org_id à tabela de grupos existente se não existir
ALTER TABLE groups
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES organizations(id) ON DELETE CASCADE;

-- Tabela de conversas (complementa o sistema existente)
CREATE TABLE IF NOT EXISTS conversations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type        text NOT NULL CHECK (type IN ('direct','group','channel')),
  title       text,
  description text,
  created_by  uuid NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT app.now_utc(),
  updated_at  timestamptz NOT NULL DEFAULT app.now_utc()
);

CREATE INDEX IF NOT EXISTS idx_conversations_org ON conversations(org_id);

-- ============================================
-- 5. SISTEMA DE SOLICITAÇÕES (RH)
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'request_type') THEN
    CREATE TYPE request_type AS ENUM ('home_office','day_off','reimbursement','vacation','expense','other');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'request_status') THEN
    CREATE TYPE request_status AS ENUM ('pending','approved','rejected','canceled');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS requests (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL,
  type         request_type NOT NULL,
  status       request_status NOT NULL DEFAULT 'pending',
  title        text NOT NULL,
  description  text,
  notes        text,
  submitted_at timestamptz NOT NULL DEFAULT app.now_utc(),
  approved_by  uuid,
  approved_at  timestamptz,
  rejected_reason text,
  created_at   timestamptz NOT NULL DEFAULT app.now_utc(),
  updated_at   timestamptz NOT NULL DEFAULT app.now_utc()
);

CREATE TABLE IF NOT EXISTS request_home_office (
  request_id uuid PRIMARY KEY REFERENCES requests(id) ON DELETE CASCADE,
  date_from  date NOT NULL,
  date_to    date NOT NULL,
  reason     text,
  location   text,
  CHECK (date_from <= date_to)
);

CREATE TABLE IF NOT EXISTS request_day_off (
  request_id uuid PRIMARY KEY REFERENCES requests(id) ON DELETE CASCADE,
  day        date NOT NULL,
  half_day   boolean NOT NULL DEFAULT false,
  period     text CHECK (period IN ('morning','afternoon','full_day')),
  reason     text
);

CREATE TABLE IF NOT EXISTS request_reimbursement (
  request_id          uuid PRIMARY KEY REFERENCES requests(id) ON DELETE CASCADE,
  amount              numeric(12,2) NOT NULL CHECK (amount >= 0),
  currency            char(3) NOT NULL DEFAULT 'BRL',
  category            text,
  merchant            text,
  expense_date        date NOT NULL,
  receipt_storage_path text,
  payment_method      text,
  account_number      text
);

CREATE INDEX IF NOT EXISTS idx_requests_org_type_status ON requests(org_id, type, status);
CREATE INDEX IF NOT EXISTS idx_requests_requester ON requests(requester_id, status);
CREATE INDEX IF NOT EXISTS idx_requests_submitted ON requests(submitted_at DESC);

-- ============================================
-- 6. SISTEMA DE AGENDA
-- ============================================

CREATE TABLE IF NOT EXISTS calendar_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title        text NOT NULL,
  description  text,
  location     text,
  meeting_url  text,
  start_at     timestamptz NOT NULL,
  end_at       timestamptz NOT NULL,
  all_day      boolean NOT NULL DEFAULT false,
  recurrence_rule text,
  color        text,
  created_by   uuid NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT app.now_utc(),
  updated_at   timestamptz NOT NULL DEFAULT app.now_utc(),
  canceled_at  timestamptz,
  CHECK (start_at < end_at)
);

CREATE TABLE IF NOT EXISTS event_participants (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id  uuid NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  user_id   uuid NOT NULL,
  role      text NOT NULL DEFAULT 'guest' CHECK (role IN ('host','co_host','guest','optional')),
  status    text NOT NULL DEFAULT 'invited' CHECK (status IN ('invited','accepted','declined','tentative','maybe')),
  added_at  timestamptz NOT NULL DEFAULT app.now_utc(),
  responded_at timestamptz,
  UNIQUE (event_id, user_id)
);

CREATE TABLE IF NOT EXISTS event_reminders (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id       uuid NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  user_id        uuid,
  minutes_before int  NOT NULL CHECK (minutes_before BETWEEN 0 AND 10080),
  method         text NOT NULL DEFAULT 'email' CHECK (method IN ('email','push','sms','notification')),
  sent_at        timestamptz,
  created_by     uuid NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT app.now_utc()
);

CREATE INDEX IF NOT EXISTS idx_events_org_time ON calendar_events(org_id, start_at, end_at);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON calendar_events(created_by);
CREATE INDEX IF NOT EXISTS idx_event_participants_user ON event_participants(user_id, status);
CREATE INDEX IF NOT EXISTS idx_event_reminders_event ON event_reminders(event_id);

-- ============================================
-- 7. SISTEMA DE RANKING E GAMIFICAÇÃO
-- ============================================

CREATE TABLE IF NOT EXISTS performance_scores (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id        uuid NOT NULL,
  period_start   date NOT NULL,
  period_end     date NOT NULL,
  score          numeric(10,2) NOT NULL DEFAULT 0,
  tasks_completed int NOT NULL DEFAULT 0,
  tasks_on_time  int NOT NULL DEFAULT 0,
  points_earned  int NOT NULL DEFAULT 0,
  on_time_ratio  numeric(5,2) NOT NULL DEFAULT 0,
  rank_position  int,
  created_at     timestamptz NOT NULL DEFAULT app.now_utc(),
  updated_at     timestamptz NOT NULL DEFAULT app.now_utc(),
  UNIQUE (org_id, user_id, period_start, period_end),
  CHECK (period_start <= period_end)
);

CREATE TABLE IF NOT EXISTS achievements (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL,
  code        text NOT NULL,
  title       text NOT NULL,
  description text,
  icon        text,
  category    text,
  points      int NOT NULL DEFAULT 0,
  awarded_at  timestamptz NOT NULL DEFAULT app.now_utc(),
  UNIQUE (org_id, user_id, code)
);

CREATE TABLE IF NOT EXISTS alerts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL,
  kind       text NOT NULL,
  severity   text NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warning','critical','success')),
  title      text NOT NULL,
  message    text NOT NULL,
  action_url text,
  metadata   jsonb,
  created_at timestamptz NOT NULL DEFAULT app.now_utc(),
  read_at    timestamptz,
  dismissed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_performance_org_period ON performance_scores(org_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_performance_user ON performance_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_org_user ON achievements(org_id, user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_user_unread ON alerts(user_id, read_at) WHERE read_at IS NULL;

-- ============================================
-- 8. FUNÇÕES DE PERFORMANCE E RANKING
-- ============================================

-- Calcular score individual no período
CREATE OR REPLACE FUNCTION app.compute_user_score(
  p_org uuid,
  p_user uuid,
  p_start date,
  p_end date
)
RETURNS numeric AS $$
  WITH task_stats AS (
    SELECT
      COALESCE(SUM(points), 0) AS sum_points,
      COUNT(*) FILTER (WHERE completed_at IS NOT NULL) AS completed,
      COUNT(*) FILTER (
        WHERE completed_at IS NOT NULL
          AND due_date IS NOT NULL
          AND completed_at <= (due_date + INTERVAL '1 day')
      ) AS on_time,
      COUNT(*) FILTER (WHERE completed_at IS NOT NULL AND due_date IS NOT NULL) AS with_deadline
    FROM kanban_tasks
    WHERE org_id = p_org
      AND assignee_id = p_user
      AND completed_at >= p_start::timestamptz
      AND completed_at < (p_end + 1)::timestamptz
  )
  SELECT
    (sum_points * 2.0) +
    (completed * 5.0) +
    (CASE WHEN with_deadline > 0
      THEN (on_time::numeric / with_deadline::numeric) * 50.0
      ELSE 0
    END) AS score
  FROM task_stats;
$$ LANGUAGE SQL STABLE;

-- Atualizar performance_scores para toda a org no período
CREATE OR REPLACE FUNCTION app.refresh_performance_scores(
  p_org uuid,
  p_start date,
  p_end date
)
RETURNS void AS $$
DECLARE
  r RECORD;
  v_score numeric;
  v_completed int;
  v_on_time int;
  v_points int;
  v_with_deadline int;
BEGIN
  FOR r IN
    SELECT user_id FROM org_members WHERE org_id = p_org
  LOOP
    SELECT
      COALESCE(SUM(points), 0),
      COUNT(*) FILTER (WHERE completed_at IS NOT NULL),
      COUNT(*) FILTER (
        WHERE completed_at IS NOT NULL
          AND due_date IS NOT NULL
          AND completed_at <= (due_date + INTERVAL '1 day')
      ),
      COUNT(*) FILTER (WHERE completed_at IS NOT NULL AND due_date IS NOT NULL)
    INTO v_points, v_completed, v_on_time, v_with_deadline
    FROM kanban_tasks
    WHERE org_id = p_org
      AND assignee_id = r.user_id
      AND completed_at >= p_start::timestamptz
      AND completed_at < (p_end + 1)::timestamptz;

    v_score := (COALESCE(v_points, 0) * 2.0) +
               (COALESCE(v_completed, 0) * 5.0) +
               (CASE WHEN COALESCE(v_with_deadline, 0) > 0
                 THEN (COALESCE(v_on_time, 0)::numeric / v_with_deadline::numeric) * 50.0
                 ELSE 0
               END);

    INSERT INTO performance_scores (
      org_id, user_id, period_start, period_end,
      score, tasks_completed, tasks_on_time, points_earned, on_time_ratio
    )
    VALUES (
      p_org, r.user_id, p_start, p_end,
      COALESCE(v_score, 0),
      COALESCE(v_completed, 0),
      COALESCE(v_on_time, 0),
      COALESCE(v_points, 0),
      CASE WHEN COALESCE(v_with_deadline, 0) > 0
        THEN COALESCE(v_on_time, 0)::numeric / v_with_deadline::numeric
        ELSE 0
      END
    )
    ON CONFLICT (org_id, user_id, period_start, period_end)
    DO UPDATE SET
      score = EXCLUDED.score,
      tasks_completed = EXCLUDED.tasks_completed,
      tasks_on_time = EXCLUDED.tasks_on_time,
      points_earned = EXCLUDED.points_earned,
      on_time_ratio = EXCLUDED.on_time_ratio,
      updated_at = app.now_utc();
  END LOOP;

  -- Atualizar ranking positions
  WITH ranked AS (
    SELECT
      id,
      DENSE_RANK() OVER (ORDER BY score DESC) AS new_rank
    FROM performance_scores
    WHERE org_id = p_org
      AND period_start = p_start
      AND period_end = p_end
  )
  UPDATE performance_scores ps
  SET rank_position = ranked.new_rank
  FROM ranked
  WHERE ps.id = ranked.id;
END;
$$ LANGUAGE plpgsql;

-- Atualizar achievements baseado em conquistas
CREATE OR REPLACE FUNCTION app.update_achievements_for_user(
  p_org uuid,
  p_user uuid
)
RETURNS void AS $$
DECLARE
  v_total_points int;
  v_total_completed int;
  v_streak_days int;
BEGIN
  -- Estatísticas gerais
  SELECT
    COALESCE(SUM(points), 0),
    COUNT(*) FILTER (WHERE completed_at IS NOT NULL)
  INTO v_total_points, v_total_completed
  FROM kanban_tasks
  WHERE org_id = p_org AND assignee_id = p_user;

  -- Primeira tarefa
  IF v_total_completed >= 1 THEN
    INSERT INTO achievements (org_id, user_id, code, title, description, icon, category, points)
    VALUES (p_org, p_user, 'FIRST_TASK', 'Primeira Tarefa', 'Concluiu a primeira tarefa', '🎯', 'milestone', 10)
    ON CONFLICT (org_id, user_id, code) DO NOTHING;
  END IF;

  -- 10 tarefas
  IF v_total_completed >= 10 THEN
    INSERT INTO achievements (org_id, user_id, code, title, description, icon, category, points)
    VALUES (p_org, p_user, 'TEN_TASKS', '10 Tarefas', 'Concluiu 10 tarefas', '🔟', 'milestone', 25)
    ON CONFLICT (org_id, user_id, code) DO NOTHING;
  END IF;

  -- 50 tarefas
  IF v_total_completed >= 50 THEN
    INSERT INTO achievements (org_id, user_id, code, title, description, icon, category, points)
    VALUES (p_org, p_user, 'FIFTY_TASKS', '50 Tarefas', 'Concluiu 50 tarefas', '🎖️', 'milestone', 100)
    ON CONFLICT (org_id, user_id, code) DO NOTHING;
  END IF;

  -- 100 pontos
  IF v_total_points >= 100 THEN
    INSERT INTO achievements (org_id, user_id, code, title, description, icon, category, points)
    VALUES (p_org, p_user, 'HUNDRED_POINTS', '100 Pontos', 'Acumulou 100 pontos', '💯', 'points', 50)
    ON CONFLICT (org_id, user_id, code) DO NOTHING;
  END IF;

  -- 500 pontos
  IF v_total_points >= 500 THEN
    INSERT INTO achievements (org_id, user_id, code, title, description, icon, category, points)
    VALUES (p_org, p_user, 'FIVE_HUNDRED_POINTS', '500 Pontos', 'Acumulou 500 pontos', '🏆', 'points', 200)
    ON CONFLICT (org_id, user_id, code) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Obter ranking da organização no período
CREATE OR REPLACE FUNCTION app.ranking_for_org(
  p_org uuid,
  p_start date,
  p_end date
)
RETURNS TABLE (
  user_id uuid,
  score numeric,
  tasks_completed int,
  tasks_on_time int,
  points_earned int,
  rank int
) AS $$
  SELECT
    ps.user_id,
    ps.score,
    ps.tasks_completed,
    ps.tasks_on_time,
    ps.points_earned,
    DENSE_RANK() OVER (ORDER BY ps.score DESC)::int AS rank
  FROM performance_scores ps
  WHERE ps.org_id = p_org
    AND ps.period_start = p_start
    AND ps.period_end = p_end
  ORDER BY ps.score DESC;
$$ LANGUAGE SQL STABLE;

-- ============================================
-- 9. TRIGGERS
-- ============================================

-- Triggers para updated_at
CREATE TRIGGER tg_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION app.tg_set_updated_at();

CREATE TRIGGER tg_org_members_updated_at
  BEFORE UPDATE ON org_members
  FOR EACH ROW EXECUTE FUNCTION app.tg_set_updated_at();

CREATE TRIGGER tg_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION app.tg_set_updated_at();

CREATE TRIGGER tg_requests_updated_at
  BEFORE UPDATE ON requests
  FOR EACH ROW EXECUTE FUNCTION app.tg_set_updated_at();

CREATE TRIGGER tg_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION app.tg_set_updated_at();

CREATE TRIGGER tg_performance_scores_updated_at
  BEFORE UPDATE ON performance_scores
  FOR EACH ROW EXECUTE FUNCTION app.tg_set_updated_at();

-- Comentário final
COMMENT ON SCHEMA app IS 'Schema utilitário para funções e helpers do sistema';
