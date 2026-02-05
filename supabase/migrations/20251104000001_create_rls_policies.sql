/*
  # RLS (Row Level Security) - Políticas Completas

  Este arquivo contém TODAS as políticas RLS para garantir segurança
  baseada em organizações e permissões de usuários.

  IMPORTANTE: Estas policies funcionam em conjunto com o sistema existente
*/

-- ============================================
-- HABILITAR RLS EM TODAS AS TABELAS
-- ============================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_home_office ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_day_off ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_reimbursement ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES: ORGANIZATIONS
-- ============================================

CREATE POLICY "org_select" ON organizations FOR SELECT
  TO authenticated
  USING (
    created_by = app.current_user_id()
    OR EXISTS (
      SELECT 1 FROM org_members m
      WHERE m.org_id = organizations.id
        AND m.user_id = app.current_user_id()
    )
  );

CREATE POLICY "org_insert" ON organizations FOR INSERT
  TO authenticated
  WITH CHECK (created_by = app.current_user_id());

CREATE POLICY "org_update" ON organizations FOR UPDATE
  TO authenticated
  USING (
    created_by = app.current_user_id()
    OR app.is_org_admin(organizations.id)
  )
  WITH CHECK (
    created_by = app.current_user_id()
    OR app.is_org_admin(organizations.id)
  );

CREATE POLICY "org_delete" ON organizations FOR DELETE
  TO authenticated
  USING (created_by = app.current_user_id());

-- ============================================
-- POLICIES: ORG_MEMBERS
-- ============================================

CREATE POLICY "orgm_select" ON org_members FOR SELECT
  TO authenticated
  USING (app.can_access_org(org_id));

CREATE POLICY "orgm_insert" ON org_members FOR INSERT
  TO authenticated
  WITH CHECK (app.is_org_admin(org_id));

CREATE POLICY "orgm_update" ON org_members FOR UPDATE
  TO authenticated
  USING (app.is_org_admin(org_id))
  WITH CHECK (app.is_org_admin(org_id));

CREATE POLICY "orgm_delete" ON org_members FOR DELETE
  TO authenticated
  USING (
    app.is_org_admin(org_id)
    OR user_id = app.current_user_id()
  );

-- ============================================
-- POLICIES: KANBAN (INTEGRAÇÃO)
-- ============================================

-- Adicionar policies para boards com org_id
CREATE POLICY "boards_select_org" ON kanban_boards FOR SELECT
  TO authenticated
  USING (
    org_id IS NULL
    OR app.can_access_org(org_id)
  );

CREATE POLICY "boards_insert_org" ON kanban_boards FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id IS NULL
    OR (app.can_access_org(org_id) AND created_by = app.current_user_id())
  );

CREATE POLICY "boards_update_org" ON kanban_boards FOR UPDATE
  TO authenticated
  USING (
    org_id IS NULL
    OR (app.can_access_org(org_id) AND (created_by = app.current_user_id() OR app.is_org_admin(org_id)))
  );

CREATE POLICY "boards_delete_org" ON kanban_boards FOR DELETE
  TO authenticated
  USING (
    org_id IS NULL
    OR (app.can_access_org(org_id) AND (created_by = app.current_user_id() OR app.is_org_admin(org_id)))
  );

-- Policies para tasks com org_id
CREATE POLICY "tasks_select_org" ON kanban_tasks FOR SELECT
  TO authenticated
  USING (
    org_id IS NULL
    OR app.can_access_org(org_id)
  );

CREATE POLICY "tasks_insert_org" ON kanban_tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id IS NULL
    OR app.can_access_org(org_id)
  );

CREATE POLICY "tasks_update_org" ON kanban_tasks FOR UPDATE
  TO authenticated
  USING (
    org_id IS NULL
    OR app.can_access_org(org_id)
  );

CREATE POLICY "tasks_delete_org" ON kanban_tasks FOR DELETE
  TO authenticated
  USING (
    org_id IS NULL
    OR app.can_access_org(org_id)
  );

-- ============================================
-- POLICIES: CONVERSATIONS
-- ============================================

CREATE POLICY "conv_select" ON conversations FOR SELECT
  TO authenticated
  USING (app.can_access_org(org_id));

CREATE POLICY "conv_insert" ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (
    app.can_access_org(org_id)
    AND created_by = app.current_user_id()
  );

CREATE POLICY "conv_update" ON conversations FOR UPDATE
  TO authenticated
  USING (
    app.can_access_org(org_id)
    AND (created_by = app.current_user_id() OR app.is_org_admin(org_id))
  );

CREATE POLICY "conv_delete" ON conversations FOR DELETE
  TO authenticated
  USING (
    app.can_access_org(org_id)
    AND (created_by = app.current_user_id() OR app.is_org_admin(org_id))
  );

-- ============================================
-- POLICIES: REQUESTS
-- ============================================

CREATE POLICY "req_select" ON requests FOR SELECT
  TO authenticated
  USING (app.can_access_org(org_id));

CREATE POLICY "req_insert" ON requests FOR INSERT
  TO authenticated
  WITH CHECK (
    app.can_access_org(org_id)
    AND requester_id = app.current_user_id()
  );

CREATE POLICY "req_update" ON requests FOR UPDATE
  TO authenticated
  USING (
    app.can_access_org(org_id)
    AND (requester_id = app.current_user_id() OR app.is_org_admin(org_id))
  );

CREATE POLICY "req_delete" ON requests FOR DELETE
  TO authenticated
  USING (
    app.can_access_org(org_id)
    AND (requester_id = app.current_user_id() OR app.is_org_admin(org_id))
  );

-- Policies para detalhes de requests
CREATE POLICY "req_ho_select" ON request_home_office FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM requests r
      WHERE r.id = request_home_office.request_id
        AND app.can_access_org(r.org_id)
    )
  );

CREATE POLICY "req_ho_insert" ON request_home_office FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM requests r
      WHERE r.id = request_home_office.request_id
        AND app.can_access_org(r.org_id)
        AND r.requester_id = app.current_user_id()
    )
  );

CREATE POLICY "req_do_select" ON request_day_off FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM requests r
      WHERE r.id = request_day_off.request_id
        AND app.can_access_org(r.org_id)
    )
  );

CREATE POLICY "req_do_insert" ON request_day_off FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM requests r
      WHERE r.id = request_day_off.request_id
        AND app.can_access_org(r.org_id)
        AND r.requester_id = app.current_user_id()
    )
  );

CREATE POLICY "req_reimb_select" ON request_reimbursement FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM requests r
      WHERE r.id = request_reimbursement.request_id
        AND app.can_access_org(r.org_id)
    )
  );

CREATE POLICY "req_reimb_insert" ON request_reimbursement FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM requests r
      WHERE r.id = request_reimbursement.request_id
        AND app.can_access_org(r.org_id)
        AND r.requester_id = app.current_user_id()
    )
  );

-- ============================================
-- POLICIES: CALENDAR_EVENTS
-- ============================================

CREATE POLICY "evt_select" ON calendar_events FOR SELECT
  TO authenticated
  USING (
    app.can_access_org(org_id)
    OR EXISTS (
      SELECT 1 FROM event_participants ep
      WHERE ep.event_id = calendar_events.id
        AND ep.user_id = app.current_user_id()
    )
  );

CREATE POLICY "evt_insert" ON calendar_events FOR INSERT
  TO authenticated
  WITH CHECK (
    app.can_access_org(org_id)
    AND created_by = app.current_user_id()
  );

CREATE POLICY "evt_update" ON calendar_events FOR UPDATE
  TO authenticated
  USING (
    app.can_access_org(org_id)
    AND (created_by = app.current_user_id() OR app.is_org_admin(org_id))
  );

CREATE POLICY "evt_delete" ON calendar_events FOR DELETE
  TO authenticated
  USING (
    app.can_access_org(org_id)
    AND (created_by = app.current_user_id() OR app.is_org_admin(org_id))
  );

-- ============================================
-- POLICIES: EVENT_PARTICIPANTS
-- ============================================

CREATE POLICY "evtp_select" ON event_participants FOR SELECT
  TO authenticated
  USING (
    user_id = app.current_user_id()
    OR EXISTS (
      SELECT 1 FROM calendar_events e
      WHERE e.id = event_participants.event_id
        AND app.can_access_org(e.org_id)
    )
  );

CREATE POLICY "evtp_insert" ON event_participants FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM calendar_events e
      WHERE e.id = event_participants.event_id
        AND (e.created_by = app.current_user_id() OR app.is_org_admin(e.org_id))
    )
  );

CREATE POLICY "evtp_update" ON event_participants FOR UPDATE
  TO authenticated
  USING (
    user_id = app.current_user_id()
    OR EXISTS (
      SELECT 1 FROM calendar_events e
      WHERE e.id = event_participants.event_id
        AND (e.created_by = app.current_user_id() OR app.is_org_admin(e.org_id))
    )
  );

CREATE POLICY "evtp_delete" ON event_participants FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM calendar_events e
      WHERE e.id = event_participants.event_id
        AND (e.created_by = app.current_user_id() OR app.is_org_admin(e.org_id))
    )
  );

-- ============================================
-- POLICIES: EVENT_REMINDERS
-- ============================================

CREATE POLICY "evtr_select" ON event_reminders FOR SELECT
  TO authenticated
  USING (
    user_id = app.current_user_id()
    OR EXISTS (
      SELECT 1 FROM calendar_events e
      WHERE e.id = event_reminders.event_id
        AND app.can_access_org(e.org_id)
    )
  );

CREATE POLICY "evtr_insert" ON event_reminders FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = app.current_user_id()
    AND EXISTS (
      SELECT 1 FROM calendar_events e
      WHERE e.id = event_reminders.event_id
        AND app.can_access_org(e.org_id)
    )
  );

CREATE POLICY "evtr_delete" ON event_reminders FOR DELETE
  TO authenticated
  USING (created_by = app.current_user_id());

-- ============================================
-- POLICIES: PERFORMANCE_SCORES
-- ============================================

CREATE POLICY "perf_select" ON performance_scores FOR SELECT
  TO authenticated
  USING (
    app.can_access_org(org_id)
    OR user_id = app.current_user_id()
  );

CREATE POLICY "perf_upsert" ON performance_scores FOR INSERT
  TO authenticated
  WITH CHECK (app.is_org_admin(org_id));

CREATE POLICY "perf_update" ON performance_scores FOR UPDATE
  TO authenticated
  USING (app.is_org_admin(org_id));

CREATE POLICY "perf_delete" ON performance_scores FOR DELETE
  TO authenticated
  USING (app.is_org_admin(org_id));

-- ============================================
-- POLICIES: ACHIEVEMENTS
-- ============================================

CREATE POLICY "ach_select" ON achievements FOR SELECT
  TO authenticated
  USING (
    app.can_access_org(org_id)
    OR user_id = app.current_user_id()
  );

CREATE POLICY "ach_insert" ON achievements FOR INSERT
  TO authenticated
  WITH CHECK (
    app.is_org_admin(org_id)
    OR user_id = app.current_user_id()
  );

CREATE POLICY "ach_delete" ON achievements FOR DELETE
  TO authenticated
  USING (
    app.is_org_admin(org_id)
    OR user_id = app.current_user_id()
  );

-- ============================================
-- POLICIES: ALERTS
-- ============================================

CREATE POLICY "alert_select" ON alerts FOR SELECT
  TO authenticated
  USING (
    user_id = app.current_user_id()
    OR app.is_org_admin(org_id)
  );

CREATE POLICY "alert_insert" ON alerts FOR INSERT
  TO authenticated
  WITH CHECK (app.can_access_org(org_id));

CREATE POLICY "alert_update" ON alerts FOR UPDATE
  TO authenticated
  USING (user_id = app.current_user_id())
  WITH CHECK (user_id = app.current_user_id());

CREATE POLICY "alert_delete" ON alerts FOR DELETE
  TO authenticated
  USING (
    user_id = app.current_user_id()
    OR app.is_org_admin(org_id)
  );

-- Comentário final
COMMENT ON POLICY "org_select" ON organizations IS 'Usuários podem ver organizações onde são membros ou criadores';
COMMENT ON POLICY "req_select" ON requests IS 'Membros da org podem ver todas as solicitações';
COMMENT ON POLICY "evt_select" ON calendar_events IS 'Membros da org e participantes podem ver eventos';
