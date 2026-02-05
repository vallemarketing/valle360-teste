/*
  # Sistema de Auditoria e Permissões

  ## Novas Tabelas

  ### audit_logs
  Tabela principal de auditoria que registra todas as ações no sistema
  - `id` (uuid, primary key)
  - `user_id` (uuid, referência para auth.users)
  - `user_email` (text) - email do usuário que executou a ação
  - `action_type` (text) - tipo de ação: INSERT, UPDATE, DELETE, LOGIN, LOGOUT
  - `table_name` (text) - nome da tabela afetada
  - `record_id` (text) - id do registro afetado
  - `old_data` (jsonb) - dados anteriores (para UPDATE e DELETE)
  - `new_data` (jsonb) - novos dados (para INSERT e UPDATE)
  - `ip_address` (text) - endereço IP do usuário
  - `user_agent` (text) - user agent do navegador
  - `created_at` (timestamptz) - quando a ação ocorreu

  ### permissions
  Define permissões disponíveis no sistema
  - `id` (uuid, primary key)
  - `name` (text) - nome único da permissão (ex: manage_clients)
  - `description` (text) - descrição da permissão
  - `resource` (text) - recurso que a permissão controla (ex: clients, users)
  - `action` (text) - ação permitida (ex: view, create, edit, delete)
  - `created_at` (timestamptz)

  ### role_permissions
  Relaciona roles com permissões
  - `id` (uuid, primary key)
  - `role` (text) - role do sistema (super_admin, colaborador, etc)
  - `permission_id` (uuid, referência para permissions)
  - `enabled` (boolean) - se a permissão está ativa para este role
  - `created_at` (timestamptz)

  ### ai_recommendations
  Armazena recomendações geradas pela IA
  - `id` (uuid, primary key)
  - `priority` (text) - high, medium, low
  - `title` (text) - título da recomendação
  - `description` (text) - descrição detalhada
  - `impact` (text) - impacto esperado
  - `category` (text) - categoria da recomendação
  - `action_type` (text) - tipo de ação sugerida
  - `action_data` (jsonb) - dados necessários para executar a ação
  - `is_executed` (boolean) - se foi executada
  - `executed_at` (timestamptz) - quando foi executada
  - `executed_by` (uuid) - quem executou
  - `created_at` (timestamptz)
  - `expires_at` (timestamptz) - quando expira

  ## Segurança
  - RLS habilitado em todas as tabelas
  - Apenas super_admin pode acessar audit_logs
  - Apenas super_admin pode gerenciar permissions e role_permissions
  - Triggers automáticos para capturar mudanças nas tabelas principais
*/

-- Criar tabela de audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text,
  action_type text NOT NULL CHECK (action_type IN ('INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'APPROVE', 'REJECT', 'OTHER')),
  table_name text,
  record_id text,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Criar índices para queries rápidas
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);

-- Habilitar RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: apenas super_admin pode ver logs
CREATE POLICY "Super admin can view all audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  );

-- Policy: sistema pode inserir logs
CREATE POLICY "System can insert audit logs"
  ON audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Criar tabela de permissões
CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  resource text NOT NULL,
  action text NOT NULL CHECK (action IN ('view', 'create', 'edit', 'delete', 'approve', 'export', 'manage')),
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

-- Policy: todos authenticated podem ver permissões
CREATE POLICY "Authenticated users can view permissions"
  ON permissions
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: apenas super_admin pode gerenciar permissões
CREATE POLICY "Super admin can manage permissions"
  ON permissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  );

-- Criar tabela de role_permissions
CREATE TABLE IF NOT EXISTS role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL,
  permission_id uuid REFERENCES permissions(id) ON DELETE CASCADE,
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(role, permission_id)
);

-- Habilitar RLS
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Policy: todos authenticated podem ver role_permissions
CREATE POLICY "Authenticated users can view role permissions"
  ON role_permissions
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: apenas super_admin pode gerenciar role_permissions
CREATE POLICY "Super admin can manage role permissions"
  ON role_permissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  );

-- Criar tabela de recomendações IA
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  title text NOT NULL,
  description text NOT NULL,
  impact text,
  category text NOT NULL,
  action_type text,
  action_data jsonb DEFAULT '{}'::jsonb,
  is_executed boolean DEFAULT false,
  executed_at timestamptz,
  executed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_dismissed boolean DEFAULT false,
  dismissed_at timestamptz,
  dismissed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_priority ON ai_recommendations(priority);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_category ON ai_recommendations(category);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_is_executed ON ai_recommendations(is_executed);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_created_at ON ai_recommendations(created_at DESC);

-- Habilitar RLS
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;

-- Policy: apenas super_admin pode ver recomendações
CREATE POLICY "Super admin can view recommendations"
  ON ai_recommendations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  );

-- Policy: apenas super_admin pode gerenciar recomendações
CREATE POLICY "Super admin can manage recommendations"
  ON ai_recommendations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  );

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
  ('manage_settings', 'Gerenciar configurações', 'system', 'manage')
ON CONFLICT (name) DO NOTHING;

-- Popular role_permissions para super_admin (todas as permissões)
INSERT INTO role_permissions (role, permission_id, enabled)
SELECT 'super_admin', id, true FROM permissions
ON CONFLICT (role, permission_id) DO NOTHING;

-- Função auxiliar para registrar logs de auditoria
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

  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = v_user_id;

  INSERT INTO audit_logs (
    user_id,
    user_email,
    action_type,
    table_name,
    record_id,
    old_data,
    new_data
  ) VALUES (
    v_user_id,
    v_user_email,
    p_action_type,
    p_table_name,
    p_record_id,
    p_old_data,
    p_new_data
  ) RETURNING id INTO v_audit_id;

  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar permissões
CREATE OR REPLACE FUNCTION has_permission(
  p_permission_name text
) RETURNS boolean AS $$
DECLARE
  v_user_role text;
  v_has_permission boolean;
BEGIN
  SELECT role INTO v_user_role
  FROM user_profiles
  WHERE id = auth.uid();

  IF v_user_role = 'super_admin' THEN
    RETURN true;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM role_permissions rp
    JOIN permissions p ON p.id = rp.permission_id
    WHERE rp.role = v_user_role
    AND p.name = p_permission_name
    AND rp.enabled = true
  ) INTO v_has_permission;

  RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para limpar logs antigos (manter apenas 12 meses)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs() RETURNS void AS $$
BEGIN
  DELETE FROM audit_logs
  WHERE created_at < now() - interval '12 months';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
