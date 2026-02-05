-- Sistema de Auditoria e Permissões v2

-- Tabela de audit logs
CREATE TABLE audit_logs (
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

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action_type ON audit_logs(action_type);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Tabela de permissões
CREATE TABLE permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  resource text NOT NULL,
  action text NOT NULL CHECK (action IN ('view', 'create', 'edit', 'delete', 'approve', 'export', 'manage')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

-- Tabela de role_permissions
CREATE TABLE role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL,
  permission_id uuid REFERENCES permissions(id) ON DELETE CASCADE,
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(role, permission_id)
);

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Tabela de recomendações IA
CREATE TABLE ai_recommendations (
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

CREATE INDEX idx_ai_recommendations_priority ON ai_recommendations(priority);
CREATE INDEX idx_ai_recommendations_category ON ai_recommendations(category);
CREATE INDEX idx_ai_recommendations_is_executed ON ai_recommendations(is_executed);
CREATE INDEX idx_ai_recommendations_created_at ON ai_recommendations(created_at DESC);

ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;