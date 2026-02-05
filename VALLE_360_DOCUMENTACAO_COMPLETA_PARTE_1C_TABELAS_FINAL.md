# VALLE 360 - DOCUMENTAÇÃO COMPLETA DO SISTEMA
## PARTE 1C: ESTRUTURA DE TABELAS DO BANCO DE DADOS (Final)

---

## 10. MÓDULO DE COLABORADORES E RH

### 10.1 Tabela: `employees`
**Descrição**: Dados dos colaboradores internos

```sql
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Informações básicas
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  
  -- Área/departamento
  area_id UUID REFERENCES employee_areas(id) ON DELETE SET NULL,
  
  -- Foto
  photo_url TEXT,
  
  -- Cargo e contratação
  position VARCHAR(100) NOT NULL,
  hire_date DATE NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Remuneração
  salary DECIMAL(10, 2) NOT NULL,
  
  -- Dados bancários
  pix_key VARCHAR(255),
  bank_name VARCHAR(100),
  bank_agency VARCHAR(20),
  bank_account VARCHAR(30),
  
  -- Último acesso
  last_access TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_employees_user_id ON employees(user_id);
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_area_id ON employees(area_id);
CREATE INDEX idx_employees_active ON employees(is_active) WHERE is_active = true;
```

### 10.2 Tabela: `employee_areas`
**Descrição**: Áreas/departamentos da empresa

```sql
CREATE TABLE employee_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Informações da área
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  
  -- Estilo
  color VARCHAR(20) DEFAULT '#cccccc',
  icon VARCHAR(50),
  
  -- Descrição
  description TEXT,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_employee_areas_slug ON employee_areas(slug);
```

### 10.3 Tabela: `employee_client_assignments`
**Descrição**: Atribuição de colaboradores a clientes

```sql
CREATE TABLE employee_client_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  
  -- Responsável pela atribuição
  assigned_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  -- Timestamps
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  UNIQUE(employee_id, client_id)
);

CREATE INDEX idx_employee_client_assignments_employee_id ON employee_client_assignments(employee_id);
CREATE INDEX idx_employee_client_assignments_client_id ON employee_client_assignments(client_id);
```

### 10.4 Tabela: `employee_invitations`
**Descrição**: Convites para novos colaboradores

```sql
CREATE TABLE employee_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Email do convidado
  email VARCHAR(255) NOT NULL,
  
  -- Quem convidou
  invited_by UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Token de convite
  token VARCHAR(255) UNIQUE NOT NULL,
  
  -- Validade
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Uso
  used_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_employee_invitations_email ON employee_invitations(email);
CREATE INDEX idx_employee_invitations_token ON employee_invitations(token);
CREATE INDEX idx_employee_invitations_expires ON employee_invitations(expires_at);
```

### 10.5 Tabela: `employee_requests`
**Descrição**: Solicitações de colaboradores (home office, folgas, reembolsos)

```sql
CREATE TABLE employee_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Tipo de solicitação
  request_type VARCHAR(30) NOT NULL CHECK (request_type IN ('home_office', 'day_off', 'reimbursement', 'vacation', 'other')),
  
  -- Informações básicas
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  
  -- Datas
  start_date DATE NOT NULL,
  end_date DATE,
  
  -- Valor (para reembolsos)
  amount DECIMAL(10, 2),
  
  -- Comprovante (para reembolsos)
  receipt_url TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  
  -- Revisão
  reviewed_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_employee_requests_user_id ON employee_requests(user_id);
CREATE INDEX idx_employee_requests_type ON employee_requests(request_type);
CREATE INDEX idx_employee_requests_status ON employee_requests(status);
CREATE INDEX idx_employee_requests_reviewed_by ON employee_requests(reviewed_by);
```

### 10.6 Tabela: `employee_goals`
**Descrição**: Metas mensais dos colaboradores

```sql
CREATE TABLE employee_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Período
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL CHECK (year >= 2020),
  
  -- Metas definidas (JSON)
  goals JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Formato: { "deliveries": 50, "nps_score": 9.0, "on_time_rate": 95 }
  
  -- Metas atingidas (JSON)
  achieved_goals JSONB DEFAULT '{}'::jsonb,
  
  -- Meta batida?
  goal_hit BOOLEAN DEFAULT false,
  
  -- Observações
  notes TEXT,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  UNIQUE(user_id, month, year)
);

CREATE INDEX idx_employee_goals_user_id ON employee_goals(user_id);
CREATE INDEX idx_employee_goals_period ON employee_goals(year DESC, month DESC);
CREATE INDEX idx_employee_goals_hit ON employee_goals(goal_hit);
```

### 10.7 Tabela: `employee_performance`
**Descrição**: Performance mensal dos colaboradores

```sql
CREATE TABLE employee_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Período
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL CHECK (year >= 2020),
  
  -- Entregas
  total_deliveries INTEGER DEFAULT 0,
  on_time_deliveries INTEGER DEFAULT 0,
  late_deliveries INTEGER DEFAULT 0,
  pending_tasks INTEGER DEFAULT 0,
  
  -- Satisfação do cliente
  average_nps DECIMAL(3, 1),
  client_complaints INTEGER DEFAULT 0,
  
  -- Frequência
  days_home_office INTEGER DEFAULT 0,
  days_off INTEGER DEFAULT 0,
  days_absent INTEGER DEFAULT 0,
  
  -- Nível de performance
  performance_level VARCHAR(30) CHECK (performance_level IN ('excellent', 'good', 'average', 'needs_improvement', 'critical')),
  
  -- Ranking
  ranking_position INTEGER,
  ranking_score DECIMAL(10, 2),
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  UNIQUE(user_id, month, year)
);

CREATE INDEX idx_employee_performance_user_id ON employee_performance(user_id);
CREATE INDEX idx_employee_performance_period ON employee_performance(year DESC, month DESC);
CREATE INDEX idx_employee_performance_level ON employee_performance(performance_level);
CREATE INDEX idx_employee_performance_ranking ON employee_performance(ranking_position);
```

### 10.8 Tabela: `nps_ratings`
**Descrição**: Avaliações NPS dos clientes sobre colaboradores

```sql
CREATE TABLE nps_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Cliente e colaborador
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Pontuação (0-10)
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 10),
  
  -- Categoria automática
  category VARCHAR(20) NOT NULL CHECK (category IN ('promoter', 'passive', 'detractor')),
  
  -- Feedback
  feedback TEXT,
  
  -- Relacionado a (projeto, entrega, etc)
  related_to TEXT,
  reference_id UUID,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_nps_ratings_client_id ON nps_ratings(client_id);
CREATE INDEX idx_nps_ratings_employee_id ON nps_ratings(employee_id);
CREATE INDEX idx_nps_ratings_category ON nps_ratings(category);
CREATE INDEX idx_nps_ratings_score ON nps_ratings(score);
CREATE INDEX idx_nps_ratings_created_at ON nps_ratings(created_at DESC);
```

---

## 11. MÓDULO DE FINANCEIRO INTERNO

### 11.1 Tabela: `expense_categories`
**Descrição**: Categorias de despesas

```sql
CREATE TABLE expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Nome da categoria
  name VARCHAR(100) NOT NULL UNIQUE,
  
  -- Tipo
  type VARCHAR(50) NOT NULL CHECK (type IN ('salaries', 'suppliers', 'taxes', 'rent', 'marketing', 'operational', 'software', 'other')),
  
  -- Descrição
  description TEXT,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_expense_categories_type ON expense_categories(type);
```

### 11.2 Tabela: `accounts_payable`
**Descrição**: Contas a pagar

```sql
CREATE TABLE accounts_payable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Fornecedor
  supplier_name VARCHAR(255) NOT NULL,
  
  -- Descrição
  description TEXT NOT NULL,
  
  -- Valor
  amount DECIMAL(10, 2) NOT NULL,
  
  -- Vencimento
  due_date DATE NOT NULL,
  
  -- Categoria
  category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
  
  -- Anexo
  attachment_url TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  
  -- Pagamento
  payment_date DATE,
  payment_method VARCHAR(50),
  payment_proof_url TEXT,
  
  -- Recorrência
  is_recurring BOOLEAN DEFAULT false,
  recurrence_frequency VARCHAR(20) CHECK (recurrence_frequency IN ('monthly', 'quarterly', 'yearly')),
  
  -- Observações
  notes TEXT,
  
  -- Criação
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_accounts_payable_supplier ON accounts_payable(supplier_name);
CREATE INDEX idx_accounts_payable_due_date ON accounts_payable(due_date);
CREATE INDEX idx_accounts_payable_status ON accounts_payable(status);
CREATE INDEX idx_accounts_payable_category_id ON accounts_payable(category_id);
```

### 11.3 Tabela: `accounts_receivable`
**Descrição**: Contas a receber

```sql
CREATE TABLE accounts_receivable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Cliente
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Contrato relacionado
  contract_id UUID REFERENCES client_contracts(id) ON DELETE SET NULL,
  
  -- Descrição
  description TEXT NOT NULL,
  
  -- Valor
  amount DECIMAL(10, 2) NOT NULL,
  
  -- Vencimento
  due_date DATE NOT NULL,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled', 'partial')),
  
  -- Pagamento
  payment_date DATE,
  payment_method VARCHAR(50),
  
  -- Link de pagamento
  payment_link TEXT,
  
  -- Recorrência
  is_recurring BOOLEAN DEFAULT false,
  recurrence_frequency VARCHAR(20) CHECK (recurrence_frequency IN ('monthly', 'quarterly', 'yearly')),
  
  -- Lembretes
  last_reminder_sent TIMESTAMP WITH TIME ZONE,
  reminder_count INTEGER DEFAULT 0,
  
  -- Observações
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_accounts_receivable_client_id ON accounts_receivable(client_id);
CREATE INDEX idx_accounts_receivable_contract_id ON accounts_receivable(contract_id);
CREATE INDEX idx_accounts_receivable_due_date ON accounts_receivable(due_date);
CREATE INDEX idx_accounts_receivable_status ON accounts_receivable(status);
```

### 11.4 Tabela: `reimbursement_requests`
**Descrição**: Solicitações de reembolso (cópia detalhada)

```sql
CREATE TABLE reimbursement_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  
  -- Tipo de despesa
  expense_type VARCHAR(50) NOT NULL CHECK (expense_type IN ('transport', 'food', 'lodging', 'materials', 'software', 'other')),
  
  -- Valor
  amount DECIMAL(10, 2) NOT NULL,
  
  -- Data da despesa
  expense_date DATE NOT NULL,
  
  -- Descrição
  description TEXT NOT NULL,
  
  -- Comprovantes (múltiplos)
  attachments JSONB DEFAULT '[]'::jsonb,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
  
  -- Aprovação
  approved_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  approval_date DATE,
  rejection_reason TEXT,
  
  -- Pagamento
  payment_date DATE,
  
  -- Observações
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_reimbursement_requests_employee_id ON reimbursement_requests(employee_id);
CREATE INDEX idx_reimbursement_requests_status ON reimbursement_requests(status);
CREATE INDEX idx_reimbursement_requests_expense_date ON reimbursement_requests(expense_date DESC);
```

### 11.5 Tabela: `payroll_benefits`
**Descrição**: Benefícios disponíveis para colaboradores

```sql
CREATE TABLE payroll_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Nome do benefício
  name VARCHAR(100) NOT NULL,
  
  -- Tipo
  type VARCHAR(50) NOT NULL CHECK (type IN ('health_insurance', 'meal_voucher', 'transport_voucher', 'home_office', 'gym', 'other')),
  
  -- Valor padrão
  amount DECIMAL(10, 2) NOT NULL,
  
  -- É tributável?
  is_taxable BOOLEAN DEFAULT false,
  
  -- Descrição
  description TEXT,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_payroll_benefits_type ON payroll_benefits(type);
```

### 11.6 Tabela: `employee_benefits`
**Descrição**: Benefícios atribuídos a colaboradores

```sql
CREATE TABLE employee_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  benefit_id UUID REFERENCES payroll_benefits(id) ON DELETE CASCADE NOT NULL,
  
  -- Valor customizado (se diferente do padrão)
  custom_amount DECIMAL(10, 2),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  UNIQUE(employee_id, benefit_id)
);

CREATE INDEX idx_employee_benefits_employee_id ON employee_benefits(employee_id);
CREATE INDEX idx_employee_benefits_benefit_id ON employee_benefits(benefit_id);
CREATE INDEX idx_employee_benefits_active ON employee_benefits(is_active) WHERE is_active = true;
```

### 11.7 Tabela: `payroll_records`
**Descrição**: Registros de folha de pagamento

```sql
CREATE TABLE payroll_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  
  -- Mês de referência
  reference_month DATE NOT NULL, -- primeiro dia do mês
  
  -- Salário bruto
  gross_salary DECIMAL(10, 2) NOT NULL,
  
  -- Descontos
  inss_deduction DECIMAL(10, 2) DEFAULT 0,
  irrf_deduction DECIMAL(10, 2) DEFAULT 0,
  fgts DECIMAL(10, 2) DEFAULT 0,
  other_deductions JSONB DEFAULT '{}'::jsonb,
  
  -- Benefícios
  benefits JSONB DEFAULT '{}'::jsonb,
  
  -- Salário líquido
  net_salary DECIMAL(10, 2) NOT NULL,
  
  -- Pagamento
  payment_date DATE,
  
  -- Holerite
  payslip_url TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
  
  -- Criação
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  UNIQUE(employee_id, reference_month)
);

CREATE INDEX idx_payroll_records_employee_id ON payroll_records(employee_id);
CREATE INDEX idx_payroll_records_reference_month ON payroll_records(reference_month DESC);
CREATE INDEX idx_payroll_records_status ON payroll_records(status);
```

### 11.8 Tabela: `bank_accounts`
**Descrição**: Contas bancárias da empresa

```sql
CREATE TABLE bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Banco
  bank_name VARCHAR(100) NOT NULL,
  
  -- Conta
  account_number VARCHAR(50) NOT NULL,
  agency VARCHAR(20) NOT NULL,
  account_type VARCHAR(20) CHECK (account_type IN ('checking', 'savings')),
  
  -- Saldo atual
  current_balance DECIMAL(12, 2) DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_bank_accounts_active ON bank_accounts(is_active) WHERE is_active = true;
```

### 11.9 Tabela: `bank_transactions`
**Descrição**: Transações bancárias

```sql
CREATE TABLE bank_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE CASCADE NOT NULL,
  
  -- Data da transação
  transaction_date DATE NOT NULL,
  
  -- Descrição
  description TEXT NOT NULL,
  
  -- Valor
  amount DECIMAL(12, 2) NOT NULL,
  
  -- Tipo
  type VARCHAR(20) NOT NULL CHECK (type IN ('credit', 'debit')),
  
  -- Categoria
  category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
  
  -- Conciliação
  is_reconciled BOOLEAN DEFAULT false,
  
  -- Vínculo com contas a pagar/receber
  linked_type VARCHAR(30) CHECK (linked_type IN ('accounts_payable', 'accounts_receivable', 'payroll', 'reimbursement')),
  linked_id UUID,
  
  -- Importação
  imported_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_bank_transactions_account_id ON bank_transactions(bank_account_id);
CREATE INDEX idx_bank_transactions_date ON bank_transactions(transaction_date DESC);
CREATE INDEX idx_bank_transactions_type ON bank_transactions(type);
CREATE INDEX idx_bank_transactions_reconciled ON bank_transactions(is_reconciled);
```

### 11.10 Tabela: `tax_obligations`
**Descrição**: Obrigações fiscais

```sql
CREATE TABLE tax_obligations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Nome do imposto
  tax_name VARCHAR(100) NOT NULL,
  
  -- Tipo
  tax_type VARCHAR(20) NOT NULL CHECK (tax_type IN ('DAS', 'DARF', 'GPS', 'GFIP', 'ISS', 'IRRF', 'INSS', 'PIS', 'COFINS', 'CSLL')),
  
  -- Mês de referência
  reference_month DATE NOT NULL,
  
  -- Valor
  amount DECIMAL(10, 2) NOT NULL,
  
  -- Vencimento
  due_date DATE NOT NULL,
  
  -- Pagamento
  payment_date DATE,
  
  -- Documento
  document_url TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_tax_obligations_reference_month ON tax_obligations(reference_month DESC);
CREATE INDEX idx_tax_obligations_due_date ON tax_obligations(due_date);
CREATE INDEX idx_tax_obligations_status ON tax_obligations(status);
CREATE INDEX idx_tax_obligations_type ON tax_obligations(tax_type);
```

### 11.11 Tabela: `cost_centers`
**Descrição**: Centros de custo por cliente

```sql
CREATE TABLE cost_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  
  -- Mês de referência
  reference_month DATE NOT NULL,
  
  -- Custos
  team_cost DECIMAL(10, 2) DEFAULT 0,
  tools_cost DECIMAL(10, 2) DEFAULT 0,
  infrastructure_cost DECIMAL(10, 2) DEFAULT 0,
  other_costs DECIMAL(10, 2) DEFAULT 0,
  total_cost DECIMAL(10, 2) DEFAULT 0,
  
  -- Receita
  revenue DECIMAL(10, 2) DEFAULT 0,
  
  -- Lucro
  profit DECIMAL(10, 2) DEFAULT 0,
  profit_margin DECIMAL(5, 2) DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  UNIQUE(client_id, reference_month)
);

CREATE INDEX idx_cost_centers_client_id ON cost_centers(client_id);
CREATE INDEX idx_cost_centers_reference_month ON cost_centers(reference_month DESC);
```

### 11.12 Tabela: `financial_alerts`
**Descrição**: Alertas financeiros

```sql
CREATE TABLE financial_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tipo de alerta
  alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('bill_due_soon', 'bill_overdue', 'low_balance', 'negative_projected_balance', 'client_overdue')),
  
  -- Severidade
  severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  -- Título e mensagem
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Relacionamento
  related_type VARCHAR(50),
  related_id UUID,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  
  -- Notificações enviadas
  sent_email BOOLEAN DEFAULT false,
  sent_whatsapp BOOLEAN DEFAULT false,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_financial_alerts_type ON financial_alerts(alert_type);
CREATE INDEX idx_financial_alerts_severity ON financial_alerts(severity);
CREATE INDEX idx_financial_alerts_unread ON financial_alerts(is_read) WHERE is_read = false;
CREATE INDEX idx_financial_alerts_created_at ON financial_alerts(created_at DESC);
```

---

## 12. MÓDULO DE IA E RECOMENDAÇÕES

### 12.1 Tabela: `ai_recommendations`
**Descrição**: Recomendações da IA para clientes e equipe

```sql
CREATE TABLE ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Alvo da recomendação
  target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('client', 'employee', 'service', 'general')),
  target_id UUID,
  
  -- Tipo de recomendação
  recommendation_type VARCHAR(50) NOT NULL,
  
  -- Conteúdo
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  
  -- Prioridade
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Ação sugerida
  action_url TEXT,
  action_label VARCHAR(100),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_dismissed BOOLEAN DEFAULT false,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Validade
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_ai_recommendations_target ON ai_recommendations(target_type, target_id);
CREATE INDEX idx_ai_recommendations_type ON ai_recommendations(recommendation_type);
CREATE INDEX idx_ai_recommendations_priority ON ai_recommendations(priority);
CREATE INDEX idx_ai_recommendations_active ON ai_recommendations(is_active) WHERE is_active = true;
```

### 12.2 Tabela: `ai_conversations`
**Descrição**: Conversas com o assistente de IA

```sql
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Histórico da conversa
  conversation_history JSONB DEFAULT '[]'::jsonb,
  -- Formato: [{ "role": "user|assistant", "content": "", "timestamp": "" }]
  
  -- Contexto
  context_type VARCHAR(50),
  context_id UUID,
  
  -- Última mensagem
  last_message_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX idx_ai_conversations_active ON ai_conversations(is_active) WHERE is_active = true;
CREATE INDEX idx_ai_conversations_last_message ON ai_conversations(last_message_at DESC);
```

---

## 13. MÓDULO DE AUDITORIA E LOGS

### 13.1 Tabela: `activity_logs`
**Descrição**: Log de todas as ações importantes no sistema

```sql
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Usuário que executou a ação
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  -- Tipo de ação
  action_type VARCHAR(50) NOT NULL,
  
  -- Entidade afetada
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  
  -- Descrição
  description TEXT NOT NULL,
  
  -- IP e localização
  ip_address INET,
  user_agent TEXT,
  
  -- Dados antes/depois (para auditoria)
  old_data JSONB,
  new_data JSONB,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_action_type ON activity_logs(action_type);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
```

### 13.2 Tabela: `error_logs`
**Descrição**: Logs de erros do sistema

```sql
CREATE TABLE error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Usuário (se aplicável)
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  -- Tipo de erro
  error_type VARCHAR(50) NOT NULL,
  
  -- Severidade
  severity VARCHAR(20) DEFAULT 'error' CHECK (severity IN ('warning', 'error', 'critical')),
  
  -- Mensagem
  error_message TEXT NOT NULL,
  
  -- Stack trace
  stack_trace TEXT,
  
  -- Contexto
  context JSONB DEFAULT '{}'::jsonb,
  
  -- URL e método
  request_url TEXT,
  request_method VARCHAR(10),
  
  -- Status code
  status_code INTEGER,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_error_logs_severity ON error_logs(severity);
CREATE INDEX idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX idx_error_logs_error_type ON error_logs(error_type);
CREATE INDEX idx_error_logs_created_at ON error_logs(created_at DESC);
```

---

## 14. MÓDULO DE NOTIFICAÇÕES

### 14.1 Tabela: `notifications`
**Descrição**: Notificações do sistema

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Tipo de notificação
  notification_type VARCHAR(50) NOT NULL,
  
  -- Título e conteúdo
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  
  -- URL de ação
  action_url TEXT,
  
  -- Relacionamento
  related_type VARCHAR(50),
  related_id UUID,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Canais
  sent_via_email BOOLEAN DEFAULT false,
  sent_via_push BOOLEAN DEFAULT false,
  sent_via_whatsapp BOOLEAN DEFAULT false,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(notification_type);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

---

## 15. MÓDULO DE DASHBOARD CONFIGURAÇÕES

### 15.1 Tabela: `dashboard_widgets`
**Descrição**: Widgets customizáveis para dashboards

```sql
CREATE TABLE dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Tipo de widget
  widget_type VARCHAR(50) NOT NULL,
  
  -- Posição e tamanho
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  width INTEGER DEFAULT 1,
  height INTEGER DEFAULT 1,
  
  -- Configurações
  settings JSONB DEFAULT '{}'::jsonb,
  
  -- Visibilidade
  is_visible BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_dashboard_widgets_user_id ON dashboard_widgets(user_id);
CREATE INDEX idx_dashboard_widgets_type ON dashboard_widgets(widget_type);
CREATE INDEX idx_dashboard_widgets_visible ON dashboard_widgets(is_visible) WHERE is_visible = true;
```

---

# RESUMO DAS TABELAS

**Total de tabelas: 75+**

## Por Módulo:
1. **Autenticação e Usuários**: 3 tabelas
2. **Clientes**: 5 tabelas
3. **Créditos e Financeiro do Cliente**: 6 tabelas
4. **Métricas do Cliente**: 5 tabelas
5. **Produção e Aprovações**: 3 tabelas
6. **Kanban**: 6 tabelas
7. **Mensagens**: 8 tabelas
8. **Arquivos**: 2 tabelas
9. **Calendário**: 3 tabelas
10. **Colaboradores e RH**: 8 tabelas
11. **Financeiro Interno**: 12 tabelas
12. **IA**: 2 tabelas
13. **Auditoria**: 2 tabelas
14. **Notificações**: 1 tabela
15. **Dashboard**: 1 tabela

---

*Fim da Parte 1C - Estrutura de Tabelas*

**Próximo**: Parte 2 - Relacionamentos Entre Tabelas

