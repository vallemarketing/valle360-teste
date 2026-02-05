-- Policies para audit_logs
CREATE POLICY "Super admin can view all audit logs"
  ON audit_logs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'super_admin'));

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Policies para permissions
CREATE POLICY "Authenticated users can view permissions"
  ON permissions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admin can manage permissions"
  ON permissions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'super_admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'super_admin'));

-- Policies para role_permissions
CREATE POLICY "Authenticated users can view role permissions"
  ON role_permissions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admin can manage role permissions"
  ON role_permissions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'super_admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'super_admin'));

-- Policies para ai_recommendations
CREATE POLICY "Super admin can view recommendations"
  ON ai_recommendations FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'super_admin'));

CREATE POLICY "Super admin can manage recommendations"
  ON ai_recommendations FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'super_admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'super_admin'));

-- Popular permissões básicas
INSERT INTO permissions (name, description, resource, action) VALUES
  ('view_clients', 'Visualizar clientes', 'clients', 'view'),
  ('create_clients', 'Criar novos clientes', 'clients', 'create'),
  ('edit_clients', 'Editar clientes', 'clients', 'edit'),
  ('delete_clients', 'Deletar clientes', 'clients', 'delete'),
  ('view_users', 'Visualizar colaboradores', 'users', 'view'),
  ('create_users', 'Criar novos colaboradores', 'users', 'create'),
  ('edit_users', 'Editar colaboradores', 'users', 'edit'),
  ('delete_users', 'Deletar colaboradores', 'users', 'delete'),
  ('view_contracts', 'Visualizar contratos', 'contracts', 'view'),
  ('create_contracts', 'Criar contratos', 'contracts', 'create'),
  ('edit_contracts', 'Editar contratos', 'contracts', 'edit'),
  ('delete_contracts', 'Deletar contratos', 'contracts', 'delete'),
  ('view_financial', 'Visualizar dados financeiros', 'financial', 'view'),
  ('manage_financial', 'Gerenciar financeiro', 'financial', 'manage'),
  ('approve_requests', 'Aprovar solicitações', 'requests', 'approve'),
  ('view_requests', 'Visualizar solicitações', 'requests', 'view'),
  ('view_audit', 'Visualizar logs de auditoria', 'audit', 'view'),
  ('export_data', 'Exportar dados', 'system', 'export'),
  ('manage_settings', 'Gerenciar configurações', 'system', 'manage');

-- Popular role_permissions para super_admin
INSERT INTO role_permissions (role, permission_id, enabled)
SELECT 'super_admin', id, true FROM permissions;

-- Funções auxiliares
CREATE OR REPLACE FUNCTION log_audit_event(
  p_action_type text,
  p_table_name text DEFAULT NULL,
  p_record_id text DEFAULT NULL,
  p_old_data jsonb DEFAULT NULL,
  p_new_data jsonb DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_user_id uuid;
  v_user_email text;
  v_audit_id uuid;
BEGIN
  v_user_id := auth.uid();
  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
  INSERT INTO audit_logs (user_id, user_email, action_type, table_name, record_id, old_data, new_data)
  VALUES (v_user_id, v_user_email, p_action_type, p_table_name, p_record_id, p_old_data, p_new_data)
  RETURNING id INTO v_audit_id;
  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_permission(p_permission_name text) RETURNS boolean AS $$
DECLARE
  v_user_role text;
  v_has_permission boolean;
BEGIN
  SELECT role INTO v_user_role FROM user_profiles WHERE id = auth.uid();
  IF v_user_role = 'super_admin' THEN RETURN true; END IF;
  SELECT EXISTS (SELECT 1 FROM role_permissions rp JOIN permissions p ON p.id = rp.permission_id
    WHERE rp.role = v_user_role AND p.name = p_permission_name AND rp.enabled = true) INTO v_has_permission;
  RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION cleanup_old_audit_logs() RETURNS void AS $$
BEGIN
  DELETE FROM audit_logs WHERE created_at < now() - interval '12 months';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;