/*
  # Tabelas para Dashboard Corporativo Multi-Departamento

  Este arquivo cria TODAS as tabelas necessárias para os dashboards:
  - Social Media (posts, métricas)
  - Videomaker (projetos, solicitações de gravação)
  - Designer Gráfico (briefings, assets)
  - Web Designer (projetos web, tickets, métricas)
  - Comercial (leads, deals, contratos)
  - Financeiro (invoices, pagamentos, notificações)
  - RH (já existe em requests)

  IMPORTANTE: Integra com tabelas existentes (clients, employees, files)
*/

-- ============================================
-- TABELAS COMUNS (SE NÃO EXISTIREM)
-- ============================================

CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  brand text,
  industry text,
  owner_id uuid,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','prospect')),
  created_at timestamptz NOT NULL DEFAULT app.now_utc(),
  updated_at timestamptz NOT NULL DEFAULT app.now_utc()
);

CREATE TABLE IF NOT EXISTS files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  file_name text NOT NULL,
  url text NOT NULL,
  mime_type text,
  file_size bigint,
  created_at timestamptz NOT NULL DEFAULT app.now_utc()
);

CREATE INDEX IF NOT EXISTS idx_clients_owner ON clients(owner_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_files_entity ON files(entity_type, entity_id);

-- ============================================
-- SOCIAL MEDIA
-- ============================================

CREATE TABLE IF NOT EXISTS social_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  channel text NOT NULL CHECK (channel IN ('instagram','facebook','tiktok','youtube','linkedin','twitter')),
  title text NOT NULL,
  content text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','published','delayed','canceled')),
  scheduled_at timestamptz,
  published_at timestamptz,
  owner_id uuid NOT NULL,
  asset_file_id uuid REFERENCES files(id) ON DELETE SET NULL,
  hashtags text[],
  created_at timestamptz NOT NULL DEFAULT app.now_utc(),
  updated_at timestamptz NOT NULL DEFAULT app.now_utc()
);

CREATE TABLE IF NOT EXISTS social_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES social_posts(id) ON DELETE CASCADE NOT NULL,
  impressions int DEFAULT 0,
  reach int DEFAULT 0,
  likes int DEFAULT 0,
  comments int DEFAULT 0,
  shares int DEFAULT 0,
  saves int DEFAULT 0,
  clicks int DEFAULT 0,
  collected_at timestamptz NOT NULL DEFAULT app.now_utc()
);

CREATE INDEX IF NOT EXISTS idx_social_posts_client ON social_posts(client_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_owner ON social_posts(owner_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_scheduled ON social_posts(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_social_metrics_post ON social_metrics(post_id);

-- ============================================
-- VIDEOMAKER
-- ============================================

CREATE TABLE IF NOT EXISTS video_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  stage text NOT NULL DEFAULT 'pre' CHECK (stage IN ('pre','recording','editing','review','delivered')),
  due_date date,
  owner_id uuid NOT NULL,
  budget numeric(12,2),
  location text,
  created_at timestamptz NOT NULL DEFAULT app.now_utc(),
  updated_at timestamptz NOT NULL DEFAULT app.now_utc()
);

CREATE TABLE IF NOT EXISTS recording_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  title text NOT NULL,
  location text,
  date date NOT NULL,
  time time,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','approved','scheduled','done','canceled')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT app.now_utc(),
  updated_at timestamptz NOT NULL DEFAULT app.now_utc()
);

CREATE INDEX IF NOT EXISTS idx_video_projects_client ON video_projects(client_id);
CREATE INDEX IF NOT EXISTS idx_video_projects_owner ON video_projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_video_projects_stage ON video_projects(stage);
CREATE INDEX IF NOT EXISTS idx_recording_requests_date ON recording_requests(date);

-- ============================================
-- DESIGNER GRÁFICO
-- ============================================

CREATE TABLE IF NOT EXISTS design_briefings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  requester_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','in_design','review','approved','archived')),
  due_date date,
  created_at timestamptz NOT NULL DEFAULT app.now_utc(),
  updated_at timestamptz NOT NULL DEFAULT app.now_utc()
);

CREATE TABLE IF NOT EXISTS design_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  briefing_id uuid REFERENCES design_briefings(id) ON DELETE SET NULL,
  title text NOT NULL,
  storage_file_id uuid REFERENCES files(id) ON DELETE SET NULL,
  tags text[],
  status text NOT NULL DEFAULT 'wip' CHECK (status IN ('wip','approved','rejected')),
  owner_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT app.now_utc(),
  updated_at timestamptz NOT NULL DEFAULT app.now_utc()
);

CREATE INDEX IF NOT EXISTS idx_design_briefings_client ON design_briefings(client_id);
CREATE INDEX IF NOT EXISTS idx_design_briefings_status ON design_briefings(status);
CREATE INDEX IF NOT EXISTS idx_design_assets_briefing ON design_assets(briefing_id);
CREATE INDEX IF NOT EXISTS idx_design_assets_tags ON design_assets USING gin(tags);

-- ============================================
-- WEB DESIGNER
-- ============================================

CREATE TABLE IF NOT EXISTS web_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  title text NOT NULL,
  site_url text,
  repo_url text,
  status text NOT NULL DEFAULT 'planning' CHECK (status IN ('planning','building','testing','deployed','maintenance')),
  owner_id uuid NOT NULL,
  last_deploy_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT app.now_utc(),
  updated_at timestamptz NOT NULL DEFAULT app.now_utc()
);

CREATE TABLE IF NOT EXISTS web_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES web_projects(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'task' CHECK (type IN ('bug','task','improvement','feature')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','paused','done','canceled')),
  sla_due_at timestamptz,
  assigned_to uuid,
  created_at timestamptz NOT NULL DEFAULT app.now_utc(),
  updated_at timestamptz NOT NULL DEFAULT app.now_utc()
);

CREATE TABLE IF NOT EXISTS web_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES web_projects(id) ON DELETE CASCADE NOT NULL,
  collected_at timestamptz NOT NULL DEFAULT app.now_utc(),
  lighthouse_perf int CHECK (lighthouse_perf BETWEEN 0 AND 100),
  lighthouse_seo int CHECK (lighthouse_seo BETWEEN 0 AND 100),
  lighthouse_a11y int CHECK (lighthouse_a11y BETWEEN 0 AND 100),
  core_vitals_json jsonb
);

CREATE INDEX IF NOT EXISTS idx_web_projects_client ON web_projects(client_id);
CREATE INDEX IF NOT EXISTS idx_web_projects_owner ON web_projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_web_tickets_project ON web_tickets(project_id);
CREATE INDEX IF NOT EXISTS idx_web_tickets_status ON web_tickets(status);
CREATE INDEX IF NOT EXISTS idx_web_metrics_project ON web_metrics(project_id, collected_at DESC);

-- ============================================
-- COMERCIAL
-- ============================================

CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  company text,
  source text,
  owner_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','qualified','nurture','lost')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT app.now_utc(),
  updated_at timestamptz NOT NULL DEFAULT app.now_utc()
);

CREATE TABLE IF NOT EXISTS deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  title text NOT NULL,
  value numeric(12,2) NOT NULL CHECK (value >= 0),
  currency char(3) NOT NULL DEFAULT 'BRL',
  stage text NOT NULL DEFAULT 'lead' CHECK (stage IN ('lead','qualified','proposal','negotiation','won','lost')),
  close_date date,
  owner_id uuid NOT NULL,
  probability int CHECK (probability BETWEEN 0 AND 100),
  notes text,
  created_at timestamptz NOT NULL DEFAULT app.now_utc(),
  updated_at timestamptz NOT NULL DEFAULT app.now_utc()
);

CREATE TABLE IF NOT EXISTS contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  start_date date NOT NULL,
  end_date date,
  value numeric(12,2) NOT NULL CHECK (value >= 0),
  currency char(3) NOT NULL DEFAULT 'BRL',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','pending_renewal','canceled','renewed')),
  auto_renew boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT app.now_utc(),
  updated_at timestamptz NOT NULL DEFAULT app.now_utc(),
  CHECK (start_date <= end_date)
);

CREATE INDEX IF NOT EXISTS idx_leads_owner ON leads(owner_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_deals_owner ON deals(owner_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
CREATE INDEX IF NOT EXISTS idx_contracts_client ON contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_end_date ON contracts(end_date) WHERE status = 'active';

-- ============================================
-- FINANCEIRO
-- ============================================

CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  number text NOT NULL UNIQUE,
  issue_date date NOT NULL,
  due_date date NOT NULL,
  value numeric(12,2) NOT NULL CHECK (value >= 0),
  currency char(3) NOT NULL DEFAULT 'BRL',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','partial','paid','overdue','canceled')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT app.now_utc(),
  updated_at timestamptz NOT NULL DEFAULT app.now_utc(),
  CHECK (issue_date <= due_date)
);

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  method text NOT NULL CHECK (method IN ('credit_card','debit_card','bank_transfer','pix','boleto','cash')),
  paid_at timestamptz NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  tx_id text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT app.now_utc()
);

CREATE TABLE IF NOT EXISTS billing_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('reminder','overdue','receipt','statement')),
  sent_at timestamptz NOT NULL,
  channel text NOT NULL DEFAULT 'email' CHECK (channel IN ('email','sms','whatsapp','push')),
  content text,
  created_at timestamptz NOT NULL DEFAULT app.now_utc()
);

CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_billing_notifications_client ON billing_notifications(client_id);

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER tg_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION app.tg_set_updated_at();
CREATE TRIGGER tg_social_posts_updated_at BEFORE UPDATE ON social_posts FOR EACH ROW EXECUTE FUNCTION app.tg_set_updated_at();
CREATE TRIGGER tg_video_projects_updated_at BEFORE UPDATE ON video_projects FOR EACH ROW EXECUTE FUNCTION app.tg_set_updated_at();
CREATE TRIGGER tg_recording_requests_updated_at BEFORE UPDATE ON recording_requests FOR EACH ROW EXECUTE FUNCTION app.tg_set_updated_at();
CREATE TRIGGER tg_design_briefings_updated_at BEFORE UPDATE ON design_briefings FOR EACH ROW EXECUTE FUNCTION app.tg_set_updated_at();
CREATE TRIGGER tg_design_assets_updated_at BEFORE UPDATE ON design_assets FOR EACH ROW EXECUTE FUNCTION app.tg_set_updated_at();
CREATE TRIGGER tg_web_projects_updated_at BEFORE UPDATE ON web_projects FOR EACH ROW EXECUTE FUNCTION app.tg_set_updated_at();
CREATE TRIGGER tg_web_tickets_updated_at BEFORE UPDATE ON web_tickets FOR EACH ROW EXECUTE FUNCTION app.tg_set_updated_at();
CREATE TRIGGER tg_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION app.tg_set_updated_at();
CREATE TRIGGER tg_deals_updated_at BEFORE UPDATE ON deals FOR EACH ROW EXECUTE FUNCTION app.tg_set_updated_at();
CREATE TRIGGER tg_contracts_updated_at BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION app.tg_set_updated_at();
CREATE TRIGGER tg_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION app.tg_set_updated_at();

-- ============================================
-- RLS (HABILITADO MAS SEM POLICIES AINDA)
-- ============================================

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE recording_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_notifications ENABLE ROW LEVEL SECURITY;

-- Comentário
COMMENT ON TABLE social_posts IS 'Posts de redes sociais com agendamento e métricas';
COMMENT ON TABLE video_projects IS 'Projetos de vídeo com stages de produção';
COMMENT ON TABLE design_briefings IS 'Briefings de design gráfico';
COMMENT ON TABLE web_projects IS 'Projetos de sites e aplicações web';
COMMENT ON TABLE leads IS 'Leads do time comercial';
COMMENT ON TABLE deals IS 'Oportunidades comerciais no pipeline';
COMMENT ON TABLE invoices IS 'Faturas emitidas para clientes';
