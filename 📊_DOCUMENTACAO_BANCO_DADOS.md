# 📊 DOCUMENTAÇÃO COMPLETA - Banco de Dados Valle 360

## 📋 ÍNDICE

1. [Resumo Geral](#resumo-geral)
2. [Autenticação e Usuários](#autenticação-e-usuários)
3. [Clientes](#clientes)
4. [Colaboradores](#colaboradores)
5. [Kanban e Tarefas](#kanban-e-tarefas)
6. [Mensagens](#mensagens)
7. [Gamificação](#gamificação)
8. [Fidelidade](#fidelidade)
9. [Financeiro](#financeiro)
10. [Notificações](#notificações)
11. [Calendário](#calendário)
12. [Métricas e Analytics](#métricas-e-analytics)
13. [IA e Machine Learning](#ia-e-machine-learning)
14. [Arquivos](#arquivos)
15. [Auditoria](#auditoria)
16. [Configurações](#configurações)

---

## 📊 RESUMO GERAL

### Estatísticas do Banco

- **Total de Tabelas:** 35+ tabelas
- **Total de Colunas:** 400+ colunas
- **Relacionamentos:** 50+ foreign keys
- **Índices:** 100+ índices
- **Triggers:** 20+ triggers automáticos
- **Functions:** 30+ stored procedures

### Tipos Personalizados (ENUM)

```sql
-- Tipos de usuário
user_type: super_admin | admin | hr | finance | manager | employee | client
user_role: super_admin | admin | hr | finance | manager | employee | client

-- Tarefas
task_status: backlog | todo | in_progress | in_review | done | blocked | cancelled
task_priority: low | medium | high | urgent

-- Outros
payment_status: pending | completed | cancelled | failed
request_status: pending | approved | rejected
```

---

## 🔐 AUTENTICAÇÃO E USUÁRIOS

### Tabela: `auth.users` (Supabase Auth)

**Propósito:** Gerenciar autenticação e sessões dos usuários

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID (PK) | ID único do usuário |
| `email` | TEXT | Email para login |
| `encrypted_password` | TEXT | Senha criptografada (bcrypt) |
| `email_confirmed_at` | TIMESTAMP | Data de confirmação do email |
| `raw_app_meta_data` | JSONB | Metadata da aplicação |
| `raw_user_meta_data` | JSONB | Metadata do usuário |
| `created_at` | TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | Data de atualização |

### Tabela: `users`

**Propósito:** Usuários do sistema (camada adicional sobre auth.users)

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID (PK) | ID único |
| `email` | TEXT | Email |
| `password_hash` | TEXT | Hash da senha |
| `full_name` | TEXT | Nome completo |
| `role` | user_role | super_admin, admin, hr, employee, client |
| `is_active` | BOOLEAN | Usuário ativo? |
| `email_verified` | BOOLEAN | Email verificado? |
| `two_factor_enabled` | BOOLEAN | 2FA habilitado? |
| `two_factor_secret` | TEXT | Secret do 2FA (TOTP) |
| `last_login_at` | TIMESTAMP | Último login |

### Tabela: `user_profiles`

**Propósito:** Perfis detalhados dos usuários

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID (PK) | ID do perfil |
| `user_id` | UUID (FK) | → auth.users(id) |
| `full_name` | TEXT | Nome completo |
| `email` | TEXT | Email |
| `phone` | TEXT | Telefone |
| `avatar` | TEXT | URL do avatar |
| `role` | user_role | Role do usuário |
| `user_type` | user_type | Tipo do usuário |
| `is_active` | BOOLEAN | Perfil ativo? |

---

## 👥 CLIENTES

### Tabela: `clients`

**Propósito:** Gerenciar dados dos clientes

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID (PK) | ID do cliente |
| `user_id` | UUID (FK) | → auth.users(id) |
| `company_name` | TEXT | Nome da empresa |
| `company_size` | TEXT | Pequena/Média/Grande |
| `industry` | TEXT | Segmento de atuação |
| `website` | TEXT | Site da empresa |
| `logo_url` | TEXT | URL do logo |
| `contact_name` | TEXT | Nome do contato principal |
| `contact_email` | TEXT | Email do contato |
| `contact_phone` | TEXT | Telefone |
| `address` | TEXT | Endereço completo |
| `city` | TEXT | Cidade |
| `state` | TEXT | Estado/UF |
| `country` | TEXT | País (default: Brasil) |
| `postal_code` | TEXT | CEP |
| `tax_id` | TEXT | CNPJ |
| `status` | TEXT | active, inactive, pending |
| `onboarding_completed` | BOOLEAN | Onboarding completo? |

### Tabela: `plans`

**Propósito:** Planos de serviço oferecidos

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID (PK) | ID do plano |
| `name` | TEXT | Nome (Básico, Business, Premium) |
| `description` | TEXT | Descrição |
| `price` | DECIMAL(12,2) | Preço mensal |
| `features` | TEXT[] | Array de features |
| `is_active` | BOOLEAN | Plano ativo? |

### Tabela: `client_contracts`

**Propósito:** Contratos dos clientes

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID (PK) | ID do contrato |
| `client_id` | UUID (FK) | → clients(id) |
| `plan_id` | UUID (FK) | → plans(id) |
| `start_date` | DATE | Data de início |
| `end_date` | DATE | Data de término |
| `monthly_value` | DECIMAL(12,2) | Valor mensal |
| `payment_day` | INTEGER | Dia do pagamento (1-31) |
| `status` | TEXT | active, suspended, cancelled |

### Tabela: `client_services`

**Propósito:** Serviços contratados por cliente

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID (PK) | ID do serviço |
| `client_id` | UUID (FK) | → clients(id) |
| `service_name` | TEXT | Nome do serviço |
| `service_type` | TEXT | social_media, paid_traffic, design, video, seo |
| `responsible_id` | UUID (FK) | → employees(id) - Responsável |
| `start_date` | DATE | Início |
| `end_date` | DATE | Término |
| `is_active` | BOOLEAN | Ativo? |

---

## 👔 COLABORADORES

### Tabela: `employees`

**Propósito:** Dados dos colaboradores

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID (PK) | ID do colaborador |
| `user_id` | UUID (FK) | → auth.users(id) |
| `full_name` | TEXT | Nome completo |
| `email` | TEXT | Email corporativo |
| `phone` | TEXT | Telefone |
| `avatar` | TEXT | URL do avatar |
| `department` | TEXT | Marketing, Design, Comercial, etc |
| `position` | TEXT | Cargo |
| `area_of_expertise` | TEXT | Social Media, Tráfego, Design, etc |
| `hire_date` | DATE | Data de contratação |
| `birth_date` | DATE | Data de nascimento |
| `emergency_contact` | TEXT | Contato de emergência |
| `emergency_phone` | TEXT | Telefone de emergência |
| `pix_key` | TEXT | Chave PIX |
| `is_active` | BOOLEAN | Colaborador ativo? |

### Tabela: `employee_permissions`

**Propósito:** Permissões granulares por colaborador

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID (PK) | ID da permissão |
| `employee_id` | UUID (FK) | → employees(id) |
| `permission_key` | TEXT | dashboard, clients, employees, financial, etc |
| `can_view` | BOOLEAN | Pode visualizar? |
| `can_create` | BOOLEAN | Pode criar? |
| `can_edit` | BOOLEAN | Pode editar? |
| `can_delete` | BOOLEAN | Pode deletar? |
| `can_approve` | BOOLEAN | Pode aprovar? |
| `granted_at` | TIMESTAMP | Data de concessão |

### Tabela: `employee_requests`

**Propósito:** Solicitações dos colaboradores

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID (PK) | ID da solicitação |
| `employee_id` | UUID (FK) | → employees(id) |
| `request_type` | TEXT | home_office, vacation, time_off, expense |
| `start_date` | DATE | Data de início |
| `end_date` | DATE | Data de término |
| `description` | TEXT | Justificativa |
| `amount` | DECIMAL(12,2) | Valor (para reembolsos) |
| `status` | TEXT | pending, approved, rejected |
| `approved_by` | UUID (FK) | → auth.users(id) |
| `approved_at` | TIMESTAMP | Data de aprovação |
| `rejection_reason` | TEXT | Motivo da rejeição |

---

## 📋 KANBAN E TAREFAS

### Tabela: `kanban_boards`

**Propósito:** Quadros Kanban

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID (PK) | ID do quadro |
| `name` | TEXT | Nome do quadro |
| `description` | TEXT | Descrição |
| `client_id` | UUID (FK) | → clients(id) - Cliente relacionado |
| `is_active` | BOOLEAN | Quadro ativo? |
| `created_by` | UUID (FK) | → auth.users(id) |

### Tabela: `kanban_columns`

**Propósito:** Colunas do Kanban

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID (PK) | ID da coluna |
| `board_id` | UUID (FK) | → kanban_boards(id) |
| `name` | TEXT | Backlog, To Do, In Progress, etc |
| `position` | INTEGER | Ordem da coluna |
| `color` | TEXT | Cor em hexadecimal |
| `wip_limit` | INTEGER | Limite WIP (Work In Progress) |

### Tabela: `kanban_tasks`

**Propósito:** Tarefas do Kanban

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID (PK) | ID da tarefa |
| `board_id` | UUID (FK) | → kanban_boards(id) |
| `column_id` | UUID (FK) | → kanban_columns(id) |
| `title` | TEXT | Título |
| `description` | TEXT | Descrição detalhada |
| `priority` | task_priority | low, medium, high, urgent |
| `status` | task_status | backlog, todo, in_progress, done, etc |
| `assigned_to` | UUID (FK) | → auth.users(id) - Atribuído a |
| `created_by` | UUID (FK) | → auth.users(id) - Criado por |
| `due_date` | DATE | Data de vencimento |
| `estimated_hours` | DECIMAL(5,2) | Horas estimadas |
| `actual_hours` | DECIMAL(5,2) | Horas reais |
| `position` | INTEGER | Posição na coluna |
| `tags` | TEXT[] | Tags/labels |
| `attachments` | JSONB | Anexos (array de objetos) |
| `completed_at` | TIMESTAMP | Data de conclusão |

---

## 💬 MENSAGENS

### Tabela: `messages`

**Propósito:** Sistema de mensagens

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID (PK) | ID da mensagem |
| `sender_id` | UUID (FK) | → auth.users(id) - Remetente |
| `recipient_id` | UUID (FK) | → auth.users(id) - Destinatário (DM) |
| `group_id` | UUID (FK) | → message_groups(id) - Grupo |
| `content` | TEXT | Conteúdo |
| `attachments` | JSONB | Anexos |
| `is_read` | BOOLEAN | Lida? |
| `read_at` | TIMESTAMP | Data de leitura |

### Tabela: `message_groups`

**Propósito:** Grupos de mensagens

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID (PK) | ID do grupo |
| `name` | TEXT | Nome do grupo |
| `description` | TEXT | Descrição |
| `avatar` | TEXT | Avatar do grupo |
| `created_by` | UUID (FK) | → auth.users(id) |
| `is_active` | BOOLEAN | Grupo ativo? |

### Tabela: `group_members`

**Propósito:** Membros dos grupos

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID (PK) | ID do membro |
| `group_id` | UUID (FK) | → message_groups(id) |
| `user_id` | UUID (FK) | → auth.users(id) |
| `role` | TEXT | admin, member |
| `joined_at` | TIMESTAMP | Data de entrada |

---

## 🎮 GAMIFICAÇÃO

### Tabela: `employee_gamification`

**Propósito:** Sistema de pontos, níveis e scores

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID (PK) | ID |
| `employee_id` | UUID (FK) | → employees(id) |
| `total_points` | INTEGER | Total de pontos acumulados |
| `level` | INTEGER | Nível atual |
| `current_streak` | INTEGER | Sequência atual (dias) |
| `longest_streak` | INTEGER | Maior sequência alcançada |
| `last_activity_date` | DATE | Última atividade |
| `productivity_score` | DECIMAL(5,2) | Score de produtividade (0-100) |
| `quality_score` | DECIMAL(5,2) | Score de qualidade (0-100) |
| `collaboration_score` | DECIMAL(5,2) | Score de colaboração (0-100) |
| `wellbeing_score` | DECIMAL(5,2) | Score de bem-estar (0-100) |

### Tabela: `employee_achievements`

**Propósito:** Conquistas e badges

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID (PK) | ID da conquista |
| `employee_id` | UUID (FK) | → employees(id) |
| `achievement_type` | TEXT | first_task, streak_7, level_up, etc |
| `title` | TEXT | Título da conquista |
| `description` | TEXT | Descrição |
| `icon` | TEXT | Ícone/badge |
| `points_awarded` | INTEGER | Pontos concedidos |
| `earned_at` | TIMESTAMP | Data de conquista |

---

## 🎁 FIDELIDADE

### Tabela: `employee_referral_codes`

**Propósito:** Códigos de indicação dos colaboradores

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID (PK) | ID |
| `employee_id` | UUID (FK) | → employees(id) |
| `referral_code` | TEXT | Código único (ex: VALLE-ANA-2024) |
| `discount_percentage` | DECIMAL(5,2) | % desconto para cliente |
| `commission_percentage` | DECIMAL(5,2) | % comissão para colaborador |
| `total_referrals` | INTEGER | Total de indicações |
| `total_earnings` | DECIMAL(12,2) | Total ganho |
| `is_active` | BOOLEAN | Código ativo? |

### Tabela: `client_referrals`

**Propósito:** Indicações realizadas

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID (PK) | ID |
| `referral_code_id` | UUID (FK) | → employee_referral_codes(id) |
| `client_id` | UUID (FK) | → clients(id) |
| `contract_value` | DECIMAL(12,2) | Valor do contrato |
| `commission_paid` | BOOLEAN | Comissão paga? |
| `commission_amount` | DECIMAL(12,2) | Valor da comissão |
| `paid_at` | TIMESTAMP | Data do pagamento |

---

## 💰 FINANCEIRO

### Tabela: `financial_transactions`

**Propósito:** Transações financeiras

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID (PK) | ID |
| `client_id` | UUID (FK) | → clients(id) |
| `employee_id` | UUID (FK) | → employees(id) |
| `type` | TEXT | income (receita), expense (despesa) |
| `category` | TEXT | subscription, commission, salary, service |
| `description` | TEXT | Descrição |
| `amount` | DECIMAL(12,2) | Valor |
| `payment_method` | TEXT | PIX, Cartão, Boleto, etc |
| `status` | TEXT | pending, completed, cancelled |
| `due_date` | DATE | Vencimento |
| `paid_at` | TIMESTAMP | Data de pagamento |

---

## 🔔 NOTIFICAÇÕES

### Tabela: `notifications`

**Propósito:** Notificações do sistema

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID (PK) | ID |
| `user_id` | UUID (FK) | → auth.users(id) - Destinatário |
| `title` | TEXT | Título |
| `message` | TEXT | Mensagem |
| `type` | TEXT | task, message, system, alert, success, warning |
| `is_read` | BOOLEAN | Lida? |
| `read_at` | TIMESTAMP | Data de leitura |
| `link` | TEXT | Link de ação |
| `metadata` | JSONB | Dados adicionais |

---

## 📅 CALENDÁRIO

### Tabela: `calendar_events`

**Propósito:** Eventos e reuniões

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID (PK) | ID |
| `title` | TEXT | Título |
| `description` | TEXT | Descrição |
| `start_date` | TIMESTAMP | Data/hora início |
| `end_date` | TIMESTAMP | Data/hora término |
| `all_day` | BOOLEAN | Dia inteiro? |
| `location` | TEXT | Local |
| `organizer_id` | UUID (FK) | → auth.users(id) |
| `client_id` | UUID (FK) | → clients(id) |
| `event_type` | TEXT | meeting, deadline, birthday, holiday |
| `reminder_minutes` | INTEGER | Lembrete (minutos antes) |

### Tabela: `calendar_participants`

**Propósito:** Participantes dos eventos

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID (PK) | ID |
| `event_id` | UUID (FK) | → calendar_events(id) |
| `user_id` | UUID (FK) | → auth.users(id) |
| `status` | TEXT | pending, accepted, declined |

---

## 📈 MÉTRICAS E ANALYTICS

### Tabela: `client_metrics`

**Propósito:** Métricas de performance dos clientes

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID (PK) | ID |
| `client_id` | UUID (FK) | → clients(id) |
| `metric_type` | TEXT | social_media, paid_traffic, seo |
| `metric_date` | DATE | Data da métrica |
| `impressions` | INTEGER | Impressões |
| `reach` | INTEGER | Alcance |
| `engagement` | INTEGER | Engajamento |
| `clicks` | INTEGER | Cliques |
| `conversions` | INTEGER | Conversões |
| `cost` | DECIMAL(12,2) | Custo |
| `revenue` | DECIMAL(12,2) | Receita |
| `roi` | DECIMAL(8,2) | ROI (%) |
| `metadata` | JSONB | Dados adicionais |

### Tabela: `client_satisfaction_surveys`

**Propósito:** Pesquisas de satisfação

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID (PK) | ID |
| `client_id` | UUID (FK) | → clients(id) |
| `nps_score` | INTEGER | NPS (0-10) |
| `satisfaction_score` | INTEGER | Satisfação (1-5) |
| `feedback` | TEXT | Feedback textual |
| `survey_type` | TEXT | monthly, quarterly, project_end |
| `sent_at` | TIMESTAMP | Enviado em |
| `answered_at` | TIMESTAMP | Respondido em |

---

## 🤖 IA E MACHINE LEARNING

### Tabela: `ai_chat_history`

**Propósito:** Histórico de conversas com a Val (IA)

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID (PK) | ID |
| `user_id` | UUID (FK) | → auth.users(id) |
| `message` | TEXT | Mensagem do usuário |
| `response` | TEXT | Resposta da Val |
| `area` | TEXT | social_media, paid_traffic, design, etc |
| `model_used` | TEXT | gpt-4, gpt-3.5-turbo |
| `tokens_used` | INTEGER | Tokens consumidos |

### Tabela: `employee_churn_predictions`

**Propósito:** Predições de saída de colaboradores (ML)

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID (PK) | ID |
| `employee_id` | UUID (FK) | → employees(id) |
| `churn_probability` | DECIMAL(5,2) | Probabilidade (0-100%) |
| `risk_level` | TEXT | low, medium, high |
| `contributing_factors` | TEXT[] | Fatores contribuintes |
| `recommended_actions` | TEXT[] | Ações recomendadas |
| `prediction_date` | DATE | Data da predição |

### Tabela: `ml_models`

**Propósito:** Modelos de Machine Learning

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID (PK) | ID |
| `model_name` | TEXT | Nome do modelo |
| `model_type` | TEXT | churn_prediction, lead_scoring, sentiment |
| `version` | TEXT | Versão (ex: v1.2.0) |
| `accuracy` | DECIMAL(5,2) | Acurácia (%) |
| `training_data_count` | INTEGER | Qtd dados de treino |
| `last_trained_at` | TIMESTAMP | Último treino |
| `is_active` | BOOLEAN | Modelo ativo? |

---

## 📁 ARQUIVOS

### Tabela: `files`

**Propósito:** Gerenciamento de arquivos

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID (PK) | ID |
| `uploaded_by` | UUID (FK) | → auth.users(id) |
| `client_id` | UUID (FK) | → clients(id) |
| `task_id` | UUID (FK) | → kanban_tasks(id) |
| `file_name` | TEXT | Nome do arquivo |
| `file_type` | TEXT | Tipo MIME |
| `file_size` | BIGINT | Tamanho (bytes) |
| `storage_path` | TEXT | Caminho no storage |
| `public_url` | TEXT | URL pública |
| `is_public` | BOOLEAN | Público? |

---

## 📝 AUDITORIA

### Tabela: `audit_logs`

**Propósito:** Logs de todas as ações do sistema

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID (PK) | ID |
| `user_id` | UUID (FK) | → auth.users(id) - Quem fez |
| `action` | TEXT | create, update, delete, login, logout |
| `entity_type` | TEXT | client, employee, task, message |
| `entity_id` | UUID | ID da entidade afetada |
| `old_values` | JSONB | Valores antes da mudança |
| `new_values` | JSONB | Valores depois da mudança |
| `ip_address` | TEXT | IP de origem |
| `user_agent` | TEXT | User agent |

---

## ⚙️ CONFIGURAÇÕES

### Tabela: `system_settings`

**Propósito:** Configurações do sistema

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID (PK) | ID |
| `key` | TEXT | Chave única (ex: smtp_host) |
| `value` | JSONB | Valor (JSON) |
| `description` | TEXT | Descrição |
| `is_public` | BOOLEAN | Visível para todos? |

---

## 🔗 RELACIONAMENTOS PRINCIPAIS

```
auth.users
├── user_profiles (1:1)
├── clients (1:1)
├── employees (1:1)
├── messages (sender) (1:N)
├── messages (recipient) (1:N)
├── kanban_tasks (assigned_to) (1:N)
├── kanban_tasks (created_by) (1:N)
├── notifications (1:N)
└── audit_logs (1:N)

clients
├── client_contracts (1:N)
├── client_services (1:N)
├── client_metrics (1:N)
├── client_referrals (1:N)
├── financial_transactions (1:N)
└── kanban_boards (1:N)

employees
├── employee_permissions (1:N)
├── employee_gamification (1:1)
├── employee_achievements (1:N)
├── employee_referral_codes (1:1)
├── employee_requests (1:N)
├── employee_churn_predictions (1:N)
└── client_services (responsible) (1:N)

kanban_boards
├── kanban_columns (1:N)
└── kanban_tasks (1:N)

kanban_columns
└── kanban_tasks (1:N)

message_groups
├── group_members (1:N)
└── messages (1:N)
```

---

## 📊 ÍNDICES PRINCIPAIS

### Performance

- `users.email` (UNIQUE)
- `user_profiles.user_id` (UNIQUE)
- `user_profiles.email` (UNIQUE)
- `clients.user_id` (UNIQUE)
- `employees.user_id` (UNIQUE)
- `employees.email` (UNIQUE)
- `employee_referral_codes.referral_code` (UNIQUE)

### Busca e Filtros

- `kanban_tasks.board_id`
- `kanban_tasks.column_id`
- `kanban_tasks.assigned_to`
- `messages.sender_id`
- `messages.recipient_id`
- `messages.group_id`
- `notifications.user_id`
- `notifications.is_read`
- `audit_logs.user_id`
- `audit_logs.created_at`

---

## 🔒 ROW LEVEL SECURITY (RLS)

Todas as tabelas possuem políticas RLS configuradas:

- **Super Admin:** Acesso total a tudo
- **Admin:** Acesso a tudo exceto configurações de sistema
- **HR:** Acesso a dados de colaboradores
- **Finance:** Acesso a dados financeiros
- **Manager:** Acesso a sua equipe e clientes
- **Employee:** Acesso apenas aos seus dados
- **Client:** Acesso apenas aos seus dados

---

## 📈 TRIGGERS AUTOMÁTICOS

### updated_at

Todas as tabelas principais possuem trigger para atualizar `updated_at` automaticamente.

### Gamificação

- `points_update_trigger`: Atualiza pontos ao completar tarefas
- `streak_update_trigger`: Atualiza sequências diárias
- `level_up_trigger`: Calcula e atualiza nível

### Auditoria

- `audit_log_trigger`: Registra todas mudanças em tabelas críticas

---

## 🎯 TOTAIS

- **35+ Tabelas**
- **400+ Colunas**
- **50+ Foreign Keys**
- **100+ Índices**
- **20+ Triggers**
- **30+ Stored Procedures**
- **10+ ENUM Types**
- **RLS em todas as tabelas**

---

**📄 Documento gerado automaticamente em:** 14/11/2025  
**📊 CSV disponível em:** `📊_ESTRUTURA_BANCO_DADOS.csv`







