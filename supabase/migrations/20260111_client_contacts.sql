-- Tabela de contatos/clientes do cliente
CREATE TABLE IF NOT EXISTS client_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Dados básicos
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  instagram_handle VARCHAR(100),
  instagram_id VARCHAR(50),
  
  -- Dados do Meta/Instagram
  profile_picture_url TEXT,
  followers_count INTEGER,
  is_business BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  
  -- Categorização
  tags TEXT[] DEFAULT '{}',
  category VARCHAR(100), -- lead, customer, vip, partner, etc
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, blocked
  
  -- Notas e interações
  notes TEXT,
  last_interaction_at TIMESTAMPTZ,
  total_interactions INTEGER DEFAULT 0,
  
  -- Metadata
  source VARCHAR(50) DEFAULT 'manual', -- manual, instagram_dm, instagram_comment, form, etc
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_contacts_client ON client_contacts(client_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON client_contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_instagram ON client_contacts(instagram_handle);
CREATE INDEX IF NOT EXISTS idx_contacts_category ON client_contacts(category);
CREATE INDEX IF NOT EXISTS idx_contacts_tags ON client_contacts USING GIN(tags);

-- Tabela de tags customizadas do cliente
CREATE TABLE IF NOT EXISTS client_contact_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(20) DEFAULT '#3B82F6',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_tags_client ON client_contact_tags(client_id);

-- Tabela de interações com contatos
CREATE TABLE IF NOT EXISTS client_contact_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES client_contacts(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  
  interaction_type VARCHAR(50), -- dm, comment, like, mention, story_reply, purchase, etc
  direction VARCHAR(10), -- inbound, outbound
  content TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interactions_contact ON client_contact_interactions(contact_id);
CREATE INDEX IF NOT EXISTS idx_interactions_type ON client_contact_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_interactions_date ON client_contact_interactions(created_at DESC);

-- Tabela para sincronização do Instagram
CREATE TABLE IF NOT EXISTS instagram_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  sync_type VARCHAR(50), -- followers, dms, comments, mentions
  status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
  items_synced INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- RLS Policies
ALTER TABLE client_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_contact_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_contact_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_sync_logs ENABLE ROW LEVEL SECURITY;

-- Policies para contatos
CREATE POLICY "Clients can manage own contacts" ON client_contacts
FOR ALL USING (
  client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
);

-- Policies para tags
CREATE POLICY "Clients can manage own tags" ON client_contact_tags
FOR ALL USING (
  client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
);

-- Policies para interações
CREATE POLICY "Clients can view own interactions" ON client_contact_interactions
FOR SELECT USING (
  client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
);

-- Policies para logs de sync
CREATE POLICY "Clients can view own sync logs" ON instagram_sync_logs
FOR SELECT USING (
  client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
);

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_contact_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contact_timestamp
BEFORE UPDATE ON client_contacts
FOR EACH ROW
EXECUTE FUNCTION update_contact_timestamp();
