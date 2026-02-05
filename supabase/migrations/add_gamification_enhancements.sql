-- Migration: Gamificação e Melhorias do Sistema
-- Data: 2025-01-15

-- Tabela: val_icebreaker_responses (quebra-gelos da Val)
CREATE TABLE IF NOT EXISTS val_icebreaker_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  area TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_val_responses_user ON val_icebreaker_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_val_responses_date ON val_icebreaker_responses(created_at);

-- Tabela: gamification_badges (badges customizadas)
CREATE TABLE IF NOT EXISTS gamification_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  icon_url TEXT,
  criteria_json JSONB NOT NULL,
  rarity TEXT CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')) DEFAULT 'common',
  category TEXT,
  is_custom BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_badges_rarity ON gamification_badges(rarity);
CREATE INDEX IF NOT EXISTS idx_badges_category ON gamification_badges(category);

-- Tabela: gamification_rules (regras de pontuação)
CREATE TABLE IF NOT EXISTS gamification_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_type TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  points_awarded INTEGER NOT NULL,
  criteria_json JSONB,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rules_active ON gamification_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_rules_type ON gamification_rules(rule_type);

-- Tabela: support_tickets (sistema de suporte)
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  category TEXT,
  description TEXT NOT NULL,
  status TEXT CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')) DEFAULT 'open',
  priority TEXT CHECK (priority IN ('low', 'normal', 'high', 'urgent')) DEFAULT 'normal',
  assigned_to UUID REFERENCES auth.users(id),
  attachment_urls JSONB,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned ON support_tickets(assigned_to);

-- Adicionar campos em employee_gamification se não existirem
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employee_gamification' AND column_name = 'weekly_score') THEN
    ALTER TABLE employee_gamification ADD COLUMN weekly_score INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employee_gamification' AND column_name = 'monthly_score') THEN
    ALTER TABLE employee_gamification ADD COLUMN monthly_score INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employee_gamification' AND column_name = 'current_streak') THEN
    ALTER TABLE employee_gamification ADD COLUMN current_streak INTEGER DEFAULT 0;
  END IF;
END $$;

-- Adicionar campos em kanban_tasks para Google Drive e anexos
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kanban_tasks' AND column_name = 'drive_link') THEN
    ALTER TABLE kanban_tasks ADD COLUMN drive_link TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kanban_tasks' AND column_name = 'attachment_urls') THEN
    ALTER TABLE kanban_tasks ADD COLUMN attachment_urls JSONB;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kanban_tasks' AND column_name = 'client_id') THEN
    ALTER TABLE kanban_tasks ADD COLUMN client_id UUID REFERENCES clients(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kanban_tasks' AND column_name = 'estimated_hours') THEN
    ALTER TABLE kanban_tasks ADD COLUMN estimated_hours DECIMAL(5,2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kanban_tasks' AND column_name = 'area') THEN
    ALTER TABLE kanban_tasks ADD COLUMN area TEXT;
  END IF;

  -- CORRIGIDO: usando aspas duplas para evitar conflito com palavra reservada
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kanban_tasks' AND column_name = 'reference_links') THEN
    ALTER TABLE kanban_tasks ADD COLUMN reference_links JSONB;
  END IF;
END $$;

-- Habilitar RLS nas novas tabelas
ALTER TABLE val_icebreaker_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Policies para val_icebreaker_responses
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'val_icebreaker_responses' 
    AND policyname = 'Users can view their own icebreaker responses'
  ) THEN
    CREATE POLICY "Users can view their own icebreaker responses"
      ON val_icebreaker_responses FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'val_icebreaker_responses' 
    AND policyname = 'Users can insert their own icebreaker responses'
  ) THEN
    CREATE POLICY "Users can insert their own icebreaker responses"
      ON val_icebreaker_responses FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Policies para gamification_badges
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'gamification_badges' 
    AND policyname = 'Everyone can view badges'
  ) THEN
    CREATE POLICY "Everyone can view badges"
      ON gamification_badges FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'gamification_badges' 
    AND policyname = 'Only admins can manage badges'
  ) THEN
    CREATE POLICY "Only admins can manage badges"
      ON gamification_badges FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_id = auth.uid()
          AND user_type IN ('super_admin', 'admin')
        )
      );
  END IF;
END $$;

-- Policies para support_tickets
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'support_tickets' 
    AND policyname = 'Users can view their own tickets'
  ) THEN
    CREATE POLICY "Users can view their own tickets"
      ON support_tickets FOR SELECT
      USING (auth.uid() = user_id OR auth.uid() = assigned_to);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'support_tickets' 
    AND policyname = 'Users can create tickets'
  ) THEN
    CREATE POLICY "Users can create tickets"
      ON support_tickets FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'support_tickets' 
    AND policyname = 'Users can update their own tickets'
  ) THEN
    CREATE POLICY "Users can update their own tickets"
      ON support_tickets FOR UPDATE
      USING (auth.uid() = user_id OR auth.uid() = assigned_to);
  END IF;
END $$;

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers com verificação de existência
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_gamification_badges_updated_at'
  ) THEN
    CREATE TRIGGER update_gamification_badges_updated_at
      BEFORE UPDATE ON gamification_badges
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_gamification_rules_updated_at'
  ) THEN
    CREATE TRIGGER update_gamification_rules_updated_at
      BEFORE UPDATE ON gamification_rules
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_support_tickets_updated_at'
  ) THEN
    CREATE TRIGGER update_support_tickets_updated_at
      BEFORE UPDATE ON support_tickets
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Comentários
COMMENT ON TABLE val_icebreaker_responses IS 'Respostas dos colaboradores aos quebra-gelos diários da Val';
COMMENT ON TABLE gamification_badges IS 'Badges customizadas criadas pelo super admin';
COMMENT ON TABLE gamification_rules IS 'Regras de pontuação configuráveis';
COMMENT ON TABLE support_tickets IS 'Sistema de tickets de suporte';
