-- =====================================================================================
-- VALLE 360 - SCRIPT DE CRIAÇÃO DO BANCO DE DADOS
-- Execute este script no SQL Editor do Supabase
-- =====================================================================================

-- =====================================================================================
-- 1. EXTENSÕES NECESSÁRIAS
-- =====================================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- =====================================================================================
-- 2. TIPOS ENUMERADOS (ENUMs)
-- =====================================================================================

DO $$ BEGIN
    CREATE TYPE user_type AS ENUM ('super_admin', 'admin', 'hr', 'finance', 'manager', 'employee', 'client');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'hr', 'finance', 'manager', 'employee', 'client');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('backlog', 'todo', 'in_progress', 'in_review', 'done', 'blocked', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================================================
-- 3. TABELAS PRINCIPAIS (SEM FOREIGN KEYS PRIMEIRO)
-- =====================================================================================

-- Tabela: users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'employee',
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret TEXT,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: user_profiles
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    avatar TEXT,
    role user_role NOT NULL DEFAULT 'employee',
    user_type user_type NOT NULL DEFAULT 'employee',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: clients
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    company_name TEXT NOT NULL,
    company_size TEXT,
    industry TEXT,
    website TEXT,
    logo_url TEXT,
    contact_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'Brasil',
    postal_code TEXT,
    tax_id TEXT,
    status TEXT DEFAULT 'active',
    onboarding_completed BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: employees
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    avatar TEXT,
    department TEXT,
    position TEXT,
    area_of_expertise TEXT,
    hire_date DATE,
    birth_date DATE,
    emergency_contact TEXT,
    emergency_phone TEXT,
    pix_key TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: message_groups
CREATE TABLE IF NOT EXISTS message_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    avatar TEXT,
    created_by UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================================================
-- 4. TABELAS KANBAN
-- =====================================================================================

-- Tabela: kanban_boards
CREATE TABLE IF NOT EXISTS kanban_boards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    client_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: kanban_columns
CREATE TABLE IF NOT EXISTS kanban_columns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id UUID,
    name TEXT NOT NULL,
    position INTEGER NOT NULL,
    color TEXT DEFAULT '#6B7280',
    wip_limit INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: kanban_tasks
CREATE TABLE IF NOT EXISTS kanban_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id UUID,
    column_id UUID,
    title TEXT NOT NULL,
    description TEXT,
    priority task_priority DEFAULT 'medium',
    status task_status DEFAULT 'todo',
    assigned_to UUID,
    created_by UUID,
    due_date DATE,
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    position INTEGER NOT NULL,
    tags TEXT[],
    attachments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================================================
-- 5. TABELAS DE MENSAGENS
-- =====================================================================================

-- Tabela: messages
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID,
    recipient_id UUID,
    group_id UUID,
    content TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: group_members
CREATE TABLE IF NOT EXISTS group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID,
    user_id UUID,
    role TEXT DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================================================
-- 6. TABELAS DE NOTIFICAÇÕES E GAMIFICAÇÃO
-- =====================================================================================

-- Tabela: notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    link TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: user_gamification
CREATE TABLE IF NOT EXISTS user_gamification (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE,
    total_points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    productivity_score DECIMAL(5,2) DEFAULT 0,
    quality_score DECIMAL(5,2) DEFAULT 0,
    collaboration_score DECIMAL(5,2) DEFAULT 0,
    wellbeing_score DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: user_achievements
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    achievement_name TEXT NOT NULL,
    achievement_description TEXT,
    achievement_icon TEXT,
    points_earned INTEGER DEFAULT 0,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: employee_permissions
CREATE TABLE IF NOT EXISTS employee_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID,
    permission_name TEXT NOT NULL,
    permission_description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: employee_referral_codes
CREATE TABLE IF NOT EXISTS employee_referral_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID UNIQUE,
    referral_code TEXT UNIQUE NOT NULL,
    discount_percentage DECIMAL(5,2) DEFAULT 10.00,
    commission_percentage DECIMAL(5,2) DEFAULT 10.00,
    total_referrals INTEGER DEFAULT 0,
    total_earnings DECIMAL(12,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================================================
-- 7. ADICIONAR FOREIGN KEYS (AGORA QUE TODAS AS TABELAS EXISTEM)
-- =====================================================================================

-- Foreign keys para user_profiles
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Foreign keys para clients
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_user_id_fkey;
ALTER TABLE clients ADD CONSTRAINT clients_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Foreign keys para employees
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_user_id_fkey;
ALTER TABLE employees ADD CONSTRAINT employees_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Foreign keys para kanban_boards
ALTER TABLE kanban_boards DROP CONSTRAINT IF EXISTS kanban_boards_client_id_fkey;
ALTER TABLE kanban_boards ADD CONSTRAINT kanban_boards_client_id_fkey 
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE kanban_boards DROP CONSTRAINT IF EXISTS kanban_boards_created_by_fkey;
ALTER TABLE kanban_boards ADD CONSTRAINT kanban_boards_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES auth.users(id);

-- Foreign keys para kanban_columns
ALTER TABLE kanban_columns DROP CONSTRAINT IF EXISTS kanban_columns_board_id_fkey;
ALTER TABLE kanban_columns ADD CONSTRAINT kanban_columns_board_id_fkey 
    FOREIGN KEY (board_id) REFERENCES kanban_boards(id) ON DELETE CASCADE;

-- Foreign keys para kanban_tasks
ALTER TABLE kanban_tasks DROP CONSTRAINT IF EXISTS kanban_tasks_board_id_fkey;
ALTER TABLE kanban_tasks ADD CONSTRAINT kanban_tasks_board_id_fkey 
    FOREIGN KEY (board_id) REFERENCES kanban_boards(id) ON DELETE CASCADE;

ALTER TABLE kanban_tasks DROP CONSTRAINT IF EXISTS kanban_tasks_column_id_fkey;
ALTER TABLE kanban_tasks ADD CONSTRAINT kanban_tasks_column_id_fkey 
    FOREIGN KEY (column_id) REFERENCES kanban_columns(id) ON DELETE CASCADE;

ALTER TABLE kanban_tasks DROP CONSTRAINT IF EXISTS kanban_tasks_assigned_to_fkey;
ALTER TABLE kanban_tasks ADD CONSTRAINT kanban_tasks_assigned_to_fkey 
    FOREIGN KEY (assigned_to) REFERENCES auth.users(id);

ALTER TABLE kanban_tasks DROP CONSTRAINT IF EXISTS kanban_tasks_created_by_fkey;
ALTER TABLE kanban_tasks ADD CONSTRAINT kanban_tasks_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES auth.users(id);

-- Foreign keys para messages
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE messages ADD CONSTRAINT messages_sender_id_fkey 
    FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_recipient_id_fkey;
ALTER TABLE messages ADD CONSTRAINT messages_recipient_id_fkey 
    FOREIGN KEY (recipient_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Foreign keys para message_groups
ALTER TABLE message_groups DROP CONSTRAINT IF EXISTS message_groups_created_by_fkey;
ALTER TABLE message_groups ADD CONSTRAINT message_groups_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES auth.users(id);

-- Foreign keys para group_members
ALTER TABLE group_members DROP CONSTRAINT IF EXISTS group_members_group_id_fkey;
ALTER TABLE group_members ADD CONSTRAINT group_members_group_id_fkey 
    FOREIGN KEY (group_id) REFERENCES message_groups(id) ON DELETE CASCADE;

ALTER TABLE group_members DROP CONSTRAINT IF EXISTS group_members_user_id_fkey;
ALTER TABLE group_members ADD CONSTRAINT group_members_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Adicionar UNIQUE constraint para group_members
ALTER TABLE group_members DROP CONSTRAINT IF EXISTS group_members_group_id_user_id_key;
ALTER TABLE group_members ADD CONSTRAINT group_members_group_id_user_id_key 
    UNIQUE(group_id, user_id);

-- Foreign keys para notifications
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE notifications ADD CONSTRAINT notifications_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Foreign keys para user_gamification
ALTER TABLE user_gamification DROP CONSTRAINT IF EXISTS user_gamification_user_id_fkey;
ALTER TABLE user_gamification ADD CONSTRAINT user_gamification_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Foreign keys para user_achievements
ALTER TABLE user_achievements DROP CONSTRAINT IF EXISTS user_achievements_user_id_fkey;
ALTER TABLE user_achievements ADD CONSTRAINT user_achievements_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Foreign keys para employee_permissions
ALTER TABLE employee_permissions DROP CONSTRAINT IF EXISTS employee_permissions_employee_id_fkey;
ALTER TABLE employee_permissions ADD CONSTRAINT employee_permissions_employee_id_fkey 
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;

-- Foreign keys para employee_referral_codes
ALTER TABLE employee_referral_codes DROP CONSTRAINT IF EXISTS employee_referral_codes_employee_id_fkey;
ALTER TABLE employee_referral_codes ADD CONSTRAINT employee_referral_codes_employee_id_fkey 
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;

-- =====================================================================================
-- 8. ÍNDICES PARA PERFORMANCE
-- =====================================================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_kanban_boards_client_id ON kanban_boards(client_id);
CREATE INDEX IF NOT EXISTS idx_kanban_columns_board_id ON kanban_columns(board_id);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_board_id ON kanban_tasks(board_id);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_column_id ON kanban_tasks(column_id);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_assigned_to ON kanban_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_group_id ON messages(group_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_user_gamification_user_id ON user_gamification(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_employee_permissions_employee_id ON employee_permissions(employee_id);

-- =====================================================================================
-- 9. FUNÇÃO E TRIGGERS PARA UPDATED_AT
-- =====================================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_kanban_boards_updated_at ON kanban_boards;
CREATE TRIGGER update_kanban_boards_updated_at BEFORE UPDATE ON kanban_boards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_kanban_columns_updated_at ON kanban_columns;
CREATE TRIGGER update_kanban_columns_updated_at BEFORE UPDATE ON kanban_columns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_kanban_tasks_updated_at ON kanban_tasks;
CREATE TRIGGER update_kanban_tasks_updated_at BEFORE UPDATE ON kanban_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_message_groups_updated_at ON message_groups;
CREATE TRIGGER update_message_groups_updated_at BEFORE UPDATE ON message_groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_gamification_updated_at ON user_gamification;
CREATE TRIGGER update_user_gamification_updated_at BEFORE UPDATE ON user_gamification
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_employee_referral_codes_updated_at ON employee_referral_codes;
CREATE TRIGGER update_employee_referral_codes_updated_at BEFORE UPDATE ON employee_referral_codes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================================================
-- ✅ SCRIPT EXECUTADO COM SUCESSO!
-- =====================================================================================

SELECT 
    '✅ ESTRUTURA DO BANCO CRIADA COM SUCESSO!' as status,
    'Próximo passo: Execute o arquivo criar_admin_novo_v2.sql' as proxima_acao;

