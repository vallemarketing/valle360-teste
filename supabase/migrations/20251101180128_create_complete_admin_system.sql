/*
  # Sistema Completo Admin Valle 360
  
  ## Visão Geral
  Esta migration cria toda a infraestrutura necessária para o sistema administrativo
  completo da Valle 360, incluindo métricas comerciais, comparativos de tráfego,
  agendamento de reuniões, solicitações de material e configurações de pagamento.
  
  ## Novas Tabelas
  
  ### 1. commercial_metrics (Métricas Comerciais por Cliente)
    - `id` (uuid, PK)
    - `client_id` (uuid, FK -> client_profiles)
    - `period_start` (date) - Início do período
    - `period_end` (date) - Fim do período
    - `meetings_scheduled` (int) - Reuniões agendadas
    - `meetings_completed` (int) - Reuniões realizadas
    - `clients_closed` (int) - Clientes fechados
    - `revenue_generated` (decimal) - Faturamento gerado
    - `conversion_rate` (decimal) - Taxa de conversão
    - `pipeline_value` (decimal) - Valor em pipeline
    - `new_contracts_in_negotiation` (int) - Novos contratos em negociação
    - `lead_sources` (jsonb) - Fontes de leads
    - `sales_cycle_days` (int) - Dias do ciclo de vendas
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)
  
  ### 2. traffic_metrics_comparison (Comparativo de Tráfego Pago)
    - `id` (uuid, PK)
    - `client_id` (uuid, FK -> client_profiles)
    - `before_roas` (decimal) - ROAS antes
    - `before_cpc` (decimal) - CPC antes
    - `before_cpm` (decimal) - CPM antes
    - `before_ctr` (decimal) - CTR antes
    - `before_investment` (decimal) - Investimento antes
    - `before_conversions` (int) - Conversões antes
    - `before_leads` (int) - Leads antes
    - `after_roas` (decimal) - ROAS depois
    - `after_cpc` (decimal) - CPC depois
    - `after_cpm` (decimal) - CPM depois
    - `after_ctr` (decimal) - CTR depois
    - `after_investment` (decimal) - Investimento depois
    - `after_conversions` (int) - Conversões depois
    - `after_leads` (int) - Leads depois
    - `improvement_percentage` (decimal) - Percentual de melhoria
    - `period_comparison` (text) - Descrição do período
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)
  
  ### 3. employee_schedules (Agendas dos Colaboradores)
    - `id` (uuid, PK)
    - `employee_id` (uuid, FK -> users)
    - `day_of_week` (int) - 0-6 (Domingo a Sábado)
    - `start_time` (time) - Horário de início
    - `end_time` (time) - Horário de fim
    - `is_available` (boolean) - Está disponível
    - `break_start` (time) - Início do intervalo
    - `break_end` (time) - Fim do intervalo
    - `timezone` (text) - Fuso horário
    - `notes` (text) - Observações
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)
  
  ### 4. schedule_exceptions (Exceções na Agenda)
    - `id` (uuid, PK)
    - `employee_id` (uuid, FK -> users)
    - `exception_date` (date) - Data da exceção
    - `is_available` (boolean) - Está disponível neste dia
    - `reason` (text) - Motivo (férias, feriado, etc)
    - `start_time` (time) - Horário de início (se parcial)
    - `end_time` (time) - Horário de fim (se parcial)
    - `created_at` (timestamptz)
  
  ### 5. meeting_bookings (Agendamentos de Reuniões)
    - `id` (uuid, PK)
    - `client_id` (uuid, FK -> client_profiles)
    - `employee_id` (uuid, FK -> users)
    - `meeting_date` (date) - Data da reunião
    - `meeting_time` (time) - Horário da reunião
    - `duration_minutes` (int) - Duração em minutos
    - `status` (text) - scheduled, completed, cancelled, no_show
    - `notes` (text) - Observações do cliente
    - `meeting_link` (text) - Link da reunião online
    - `reminder_sent` (boolean) - Lembrete enviado
    - `completed_at` (timestamptz) - Data de conclusão
    - `feedback` (text) - Feedback da reunião
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)
  
  ### 6. material_requests (Solicitações de Material)
    - `id` (uuid, PK)
    - `client_id` (uuid, FK -> client_profiles)
    - `request_types` (text[]) - Array de tipos solicitados
    - `detailed_description` (text) - Descrição detalhada
    - `status` (text) - pending, in_progress, completed, cancelled
    - `priority` (text) - low, medium, high, urgent
    - `assigned_to` (uuid, FK -> users) - Responsável
    - `estimated_delivery` (date) - Previsão de entrega
    - `completed_at` (timestamptz) - Data de conclusão
    - `files_delivered` (text[]) - URLs dos arquivos entregues
    - `client_feedback` (text) - Feedback do cliente
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)
  
  ### 7. payment_gateway_config (Configuração de Gateway de Pagamento)
    - `id` (uuid, PK)
    - `gateway_provider` (text) - stripe, mercadopago, pagseguro, asaas
    - `api_key_encrypted` (text) - API Key criptografada
    - `public_key` (text) - Chave pública
    - `webhook_url` (text) - URL do webhook
    - `webhook_secret` (text) - Secret do webhook
    - `is_active` (boolean) - Está ativo
    - `environment` (text) - production, sandbox
    - `supported_methods` (text[]) - Métodos suportados
    - `fees_config` (jsonb) - Configuração de taxas
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)
  
  ### 8. admin_activity_log (Log de Atividades Admin)
    - `id` (uuid, PK)
    - `admin_id` (uuid, FK -> users)
    - `action_type` (text) - create, update, delete, view
    - `entity_type` (text) - client, employee, contract, etc
    - `entity_id` (uuid) - ID da entidade afetada
    - `changes_made` (jsonb) - Detalhes das mudanças
    - `ip_address` (text) - IP de origem
    - `user_agent` (text) - User agent do navegador
    - `created_at` (timestamptz)
  
  ## Segurança
  - RLS habilitado em todas as tabelas
  - Super Admin tem acesso total via políticas específicas
  - Clientes só veem seus próprios dados
  - Logs de auditoria para rastreabilidade completa
*/

-- 1. Tabela de Métricas Comerciais
CREATE TABLE IF NOT EXISTS commercial_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  meetings_scheduled int DEFAULT 0,
  meetings_completed int DEFAULT 0,
  clients_closed int DEFAULT 0,
  revenue_generated decimal(12,2) DEFAULT 0,
  conversion_rate decimal(5,2) DEFAULT 0,
  pipeline_value decimal(12,2) DEFAULT 0,
  new_contracts_in_negotiation int DEFAULT 0,
  lead_sources jsonb DEFAULT '{}'::jsonb,
  sales_cycle_days int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Tabela de Comparativo de Tráfego
CREATE TABLE IF NOT EXISTS traffic_metrics_comparison (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  before_roas decimal(10,2) DEFAULT 0,
  before_cpc decimal(10,2) DEFAULT 0,
  before_cpm decimal(10,2) DEFAULT 0,
  before_ctr decimal(5,2) DEFAULT 0,
  before_investment decimal(12,2) DEFAULT 0,
  before_conversions int DEFAULT 0,
  before_leads int DEFAULT 0,
  after_roas decimal(10,2) DEFAULT 0,
  after_cpc decimal(10,2) DEFAULT 0,
  after_cpm decimal(10,2) DEFAULT 0,
  after_ctr decimal(5,2) DEFAULT 0,
  after_investment decimal(12,2) DEFAULT 0,
  after_conversions int DEFAULT 0,
  after_leads int DEFAULT 0,
  improvement_percentage decimal(5,2) DEFAULT 0,
  period_comparison text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Tabela de Agendas dos Colaboradores
CREATE TABLE IF NOT EXISTS employee_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_of_week int NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_available boolean DEFAULT true,
  break_start time,
  break_end time,
  timezone text DEFAULT 'America/Sao_Paulo',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Tabela de Exceções na Agenda
CREATE TABLE IF NOT EXISTS schedule_exceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exception_date date NOT NULL,
  is_available boolean DEFAULT false,
  reason text,
  start_time time,
  end_time time,
  created_at timestamptz DEFAULT now()
);

-- 5. Tabela de Agendamentos de Reuniões
CREATE TABLE IF NOT EXISTS meeting_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  meeting_date date NOT NULL,
  meeting_time time NOT NULL,
  duration_minutes int NOT NULL DEFAULT 60,
  status text NOT NULL DEFAULT 'scheduled',
  notes text,
  meeting_link text,
  reminder_sent boolean DEFAULT false,
  completed_at timestamptz,
  feedback text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. Tabela de Solicitações de Material
CREATE TABLE IF NOT EXISTS material_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  request_types text[] NOT NULL,
  detailed_description text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  priority text DEFAULT 'medium',
  assigned_to uuid REFERENCES users(id),
  estimated_delivery date,
  completed_at timestamptz,
  files_delivered text[],
  client_feedback text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 7. Tabela de Configuração de Gateway
CREATE TABLE IF NOT EXISTS payment_gateway_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway_provider text NOT NULL,
  api_key_encrypted text NOT NULL,
  public_key text,
  webhook_url text,
  webhook_secret text,
  is_active boolean DEFAULT true,
  environment text DEFAULT 'sandbox',
  supported_methods text[] DEFAULT ARRAY['pix', 'credit_card'],
  fees_config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 8. Tabela de Log de Atividades Admin
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  changes_made jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_commercial_metrics_client_id ON commercial_metrics(client_id);
CREATE INDEX IF NOT EXISTS idx_commercial_metrics_period ON commercial_metrics(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_traffic_comparison_client_id ON traffic_metrics_comparison(client_id);
CREATE INDEX IF NOT EXISTS idx_employee_schedules_employee_id ON employee_schedules(employee_id);
CREATE INDEX IF NOT EXISTS idx_schedule_exceptions_employee_id ON schedule_exceptions(employee_id);
CREATE INDEX IF NOT EXISTS idx_schedule_exceptions_date ON schedule_exceptions(exception_date);
CREATE INDEX IF NOT EXISTS idx_meeting_bookings_client_id ON meeting_bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_meeting_bookings_employee_id ON meeting_bookings(employee_id);
CREATE INDEX IF NOT EXISTS idx_meeting_bookings_date ON meeting_bookings(meeting_date);
CREATE INDEX IF NOT EXISTS idx_meeting_bookings_status ON meeting_bookings(status);
CREATE INDEX IF NOT EXISTS idx_material_requests_client_id ON material_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_material_requests_status ON material_requests(status);
CREATE INDEX IF NOT EXISTS idx_material_requests_assigned_to ON material_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_id ON admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_entity ON admin_activity_log(entity_type, entity_id);

-- Habilitar RLS em todas as tabelas
ALTER TABLE commercial_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE traffic_metrics_comparison ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_gateway_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para commercial_metrics
CREATE POLICY "Clientes podem ver suas próprias métricas comerciais"
  ON commercial_metrics FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

CREATE POLICY "Super Admin pode gerenciar todas as métricas comerciais"
  ON commercial_metrics FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Políticas RLS para traffic_metrics_comparison
CREATE POLICY "Clientes podem ver seu comparativo de tráfego"
  ON traffic_metrics_comparison FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

CREATE POLICY "Super Admin pode gerenciar todos os comparativos"
  ON traffic_metrics_comparison FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Políticas RLS para employee_schedules
CREATE POLICY "Colaboradores podem ver sua própria agenda"
  ON employee_schedules FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid());

CREATE POLICY "Clientes podem ver agendas para agendar reuniões"
  ON employee_schedules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super Admin pode gerenciar todas as agendas"
  ON employee_schedules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Políticas RLS para schedule_exceptions
CREATE POLICY "Todos autenticados podem ver exceções"
  ON schedule_exceptions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super Admin pode gerenciar exceções"
  ON schedule_exceptions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Políticas RLS para meeting_bookings
CREATE POLICY "Clientes podem ver suas reuniões"
  ON meeting_bookings FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

CREATE POLICY "Clientes podem criar reuniões"
  ON meeting_bookings FOR INSERT
  TO authenticated
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Clientes podem atualizar suas reuniões"
  ON meeting_bookings FOR UPDATE
  TO authenticated
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Colaboradores podem ver suas reuniões"
  ON meeting_bookings FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid());

CREATE POLICY "Super Admin pode gerenciar todas as reuniões"
  ON meeting_bookings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Políticas RLS para material_requests
CREATE POLICY "Clientes podem ver suas solicitações"
  ON material_requests FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

CREATE POLICY "Clientes podem criar solicitações"
  ON material_requests FOR INSERT
  TO authenticated
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Colaboradores podem ver solicitações atribuídas"
  ON material_requests FOR SELECT
  TO authenticated
  USING (assigned_to = auth.uid());

CREATE POLICY "Colaboradores podem atualizar solicitações atribuídas"
  ON material_requests FOR UPDATE
  TO authenticated
  USING (assigned_to = auth.uid())
  WITH CHECK (assigned_to = auth.uid());

CREATE POLICY "Super Admin pode gerenciar todas as solicitações"
  ON material_requests FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Políticas RLS para payment_gateway_config
CREATE POLICY "Apenas Super Admin pode acessar configurações de gateway"
  ON payment_gateway_config FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Políticas RLS para admin_activity_log
CREATE POLICY "Apenas Super Admin pode ver logs de auditoria"
  ON admin_activity_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

CREATE POLICY "Sistema pode inserir logs"
  ON admin_activity_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Triggers para atualizar updated_at
DROP TRIGGER IF EXISTS update_commercial_metrics_updated_at ON commercial_metrics;
CREATE TRIGGER update_commercial_metrics_updated_at
  BEFORE UPDATE ON commercial_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_traffic_metrics_comparison_updated_at ON traffic_metrics_comparison;
CREATE TRIGGER update_traffic_metrics_comparison_updated_at
  BEFORE UPDATE ON traffic_metrics_comparison
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_employee_schedules_updated_at ON employee_schedules;
CREATE TRIGGER update_employee_schedules_updated_at
  BEFORE UPDATE ON employee_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meeting_bookings_updated_at ON meeting_bookings;
CREATE TRIGGER update_meeting_bookings_updated_at
  BEFORE UPDATE ON meeting_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_material_requests_updated_at ON material_requests;
CREATE TRIGGER update_material_requests_updated_at
  BEFORE UPDATE ON material_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_gateway_config_updated_at ON payment_gateway_config;
CREATE TRIGGER update_payment_gateway_config_updated_at
  BEFORE UPDATE ON payment_gateway_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();