# 🗄️ Migrations do Valle 360

Este diretório contém todas as migrations do banco de dados para o sistema Valle 360.

## 📋 Ordem de Execução

As migrations devem ser executadas na seguinte ordem (numeradas sequencialmente):

### 1️⃣ **20251112000000_init_database_functions.sql**
**Funções e Configurações Base**
- Extensões PostgreSQL (uuid-ossp, pgcrypto, unaccent)
- Funções auxiliares (`update_updated_at_column`, validadores, formatadores)
- Configurações de timezone e roles
- **IMPORTANTE**: Esta migration DEVE ser executada PRIMEIRO!

### 2️⃣ **20251112000001_create_user_system.sql**
**Sistema de Usuários**
- `users` (gerenciada pelo Supabase Auth)
- `user_profiles` (perfis estendidos dos usuários)
- RLS policies para controle de acesso
- Triggers automáticos para criação de perfis

### 3️⃣ **20251112000002_create_clients_system.sql**
**Sistema de Clientes**
- `clients` (dados dos clientes)
- `client_contracts` (contratos)
- RLS policies por tipo de usuário
- Relacionamento com account managers

### 4️⃣ **20251112000003_create_credits_financial_system.sql**
**Sistema de Créditos e Transações**
- `client_credits` (créditos dos clientes)
- `financial_transactions` (transações financeiras)
- Controle de saldo e histórico

### 5️⃣ **20251112000004_create_production_system.sql**
**Sistema de Produção**
- `production_items` (posts, vídeos, banners)
- `production_comments` (feedback)
- `production_approvals` (histórico de aprovações)
- Workflow de aprovação cliente/equipe

### 6️⃣ **20251112000005_create_kanban_system.sql**
**Sistema Kanban**
- `kanban_boards` (quadros)
- `kanban_columns` (colunas)
- `kanban_tasks` (cards/tarefas)
- `kanban_task_comments` (comentários)
- `kanban_task_history` (histórico de mudanças)
- Drag & drop com posicionamento

### 7️⃣ **20251112000006_create_messaging_system.sql**
**Sistema de Mensagens (Real-time)**
- `message_groups` (grupos de mensagens)
- `message_group_members` (membros dos grupos)
- `direct_conversations` (conversas diretas/DM)
- `messages` (mensagens)
- `message_reactions` (reações/emojis)
- `user_presence` (status online/offline)
- `message_notifications` (notificações de mensagens)

### 8️⃣ **20251112000007_create_calendar_files_systems.sql**
**Calendário e Arquivos**
- `calendar_events` (eventos e reuniões)
- `calendar_event_participants` (participantes)
- `meeting_requests` (solicitações de reunião)
- `client_files` (arquivos dos clientes)
- `file_access_log` (log de acessos a arquivos)

### 9️⃣ **20251112000008_create_employees_hr_system.sql**
**Sistema de Colaboradores e RH**
- `employees` (colaboradores)
- `employee_areas` (áreas/departamentos)
- `employee_client_assignments` (atribuições de clientes)
- `employee_goals` (metas)
- `employee_performance` (avaliações de desempenho)
- `employee_requests` (solicitações: home office, férias, etc)
- `reimbursement_requests` (reembolsos)

### 🔟 **20251112000009_create_financial_system.sql**
**Sistema Financeiro Completo**
- `bank_accounts` (contas bancárias)
- `bank_transactions` (transações bancárias)
- `accounts_payable` (contas a pagar)
- `accounts_receivable` (contas a receber)
- `cost_centers` (centros de custo)
- `payroll_records` (folha de pagamento)
- `payroll_benefits` (benefícios)
- `employee_benefits` (benefícios dos colaboradores)
- `tax_obligations` (obrigações fiscais)
- `financial_alerts` (alertas financeiros)
- `payment_reminders` (lembretes de pagamento)

### 1️⃣1️⃣ **20251112000010_create_dashboards_metrics_system.sql**
**Dashboards e Métricas**
- `client_metrics` (métricas dos clientes)
- `before_after_metrics` (comparações antes/depois)
- `client_dashboard_settings` (configurações de dashboard)
- `social_posts` e `social_metrics` (redes sociais)
- `video_projects` e `design_assets` (vídeo e design)
- `web_projects` e `web_metrics` (web)
- `leads` e `deals` (comercial/vendas)

### 1️⃣2️⃣ **20251112000011_create_ai_notifications_audit_system.sql**
**IA, Notificações e Auditoria**
- `ai_recommendations` (recomendações de IA)
- `ai_conversations` (conversas com IA)
- `ai_prompts` (templates de prompts)
- `ai_feedback` (feedback das recomendações)
- `notifications` (notificações do sistema)
- `notification_preferences` (preferências de notificações)
- `audit_logs` (logs de auditoria)
- `activity_logs` (logs de atividades)
- `client_gamification_scores` (pontuação de gamificação)
- `employee_gamification_scores` (gamificação dos colaboradores)
- `gamification_achievements` (conquistas)
- `system_settings` (configurações do sistema)
- `system_integrations` (integrações)

### 1️⃣3️⃣ **20251112000012_create_complementary_tables.sql**
**Tabelas Complementares**
- `nps_ratings` (avaliações NPS)
- `client_referrals` (indicações de clientes)
- `service_categories` e `services` (catálogo de serviços)
- `contract_services` (serviços dos contratos)
- `client_profile_extended` (perfil estendido)
- `additional_contacts` (contatos adicionais)
- `client_documents` (documentos)
- `client_rules_documents` (regras e diretrizes)
- `client_benefits` (benefícios dos clientes)
- `expense_categories` (categorias de despesas)
- `client_social_accounts` (contas sociais)
- `employee_invitations` (convites)

---

## 🚀 Como Executar

### Usando Supabase CLI

```bash
# 1. Instalar Supabase CLI (se ainda não tiver)
npm install -g supabase

# 2. Fazer login no Supabase
supabase login

# 3. Linkar ao projeto
supabase link --project-ref seu-projeto-id

# 4. Executar todas as migrations
supabase db push
```

### Execução Manual

```bash
# Executar em ordem
psql -h seu-host -U seu-usuario -d seu-database -f 20251112000000_init_database_functions.sql
psql -h seu-host -U seu-usuario -d seu-database -f 20251112000001_create_user_system.sql
# ... e assim por diante
```

### Usando Supabase Dashboard

1. Acesse o **SQL Editor** no dashboard do Supabase
2. Copie e cole o conteúdo de cada migration **na ordem correta**
3. Execute uma por uma

---

## 📊 Estatísticas

- **Total de Migrations**: 13
- **Total de Tabelas**: ~100+
- **Recursos Implementados**:
  - ✅ Row Level Security (RLS) em todas as tabelas
  - ✅ Triggers automáticos (`updated_at`)
  - ✅ Índices otimizados
  - ✅ Validações e constraints
  - ✅ Relacionamentos e foreign keys
  - ✅ Funções auxiliares (validadores, formatadores)
  - ✅ Tipos ENUM personalizados
  - ✅ JSONB para metadados flexíveis
  - ✅ Timestamps automáticos
  - ✅ Soft deletes onde apropriado

---

## 🔒 Segurança (RLS)

Todas as tabelas possuem **Row Level Security** habilitado com políticas específicas:

- **Super Admins**: Acesso total
- **Colaboradores**: Acesso baseado em departamento e atribuições
- **Clientes**: Acesso apenas aos próprios dados
- **Roles específicas**: Políticas personalizadas por funcionalidade

---

## 🧪 Validações

As migrations incluem validações para:

- ✅ CPF e CNPJ (funções brasileiras)
- ✅ Emails
- ✅ Status enums
- ✅ Datas (início < fim)
- ✅ Valores numéricos (scores, percentuais)
- ✅ Comprimentos de texto

---

## 📝 Observações Importantes

1. **Dependências**: Respeite a ordem de execução! Algumas tabelas dependem de outras.
2. **Auth Users**: A tabela `auth.users` é gerenciada pelo Supabase Auth - não modificar.
3. **Timezone**: Configurado para `America/Sao_Paulo` por padrão.
4. **JSONB**: Usado extensivamente para flexibilidade e metadados.
5. **Funções**: A migration `000` cria funções reutilizáveis usadas em todas as outras.

---

## 🔄 Rollback

Para desfazer migrations (use com cuidado!):

```sql
-- Exemplo: Remover última migration (complementary_tables)
DROP TABLE IF EXISTS client_social_accounts CASCADE;
DROP TABLE IF EXISTS employee_invitations CASCADE;
-- ... etc
```

**⚠️ ATENÇÃO**: Sempre faça backup antes de fazer rollback!

---

## 📚 Documentação Complementar

Consulte também:
- `VALLE_360_DOCUMENTACAO_COMPLETA_README.md` - Documentação geral do sistema
- `VALLE_360_DOCUMENTACAO_COMPLETA_PARTE_2_RELACIONAMENTOS.md` - Relacionamentos entre tabelas
- `VALLE_360_DOCUMENTACAO_COMPLETA_PARTE_3A_ENDPOINTS_API.md` - Endpoints da API

---

## 🆘 Suporte

Em caso de problemas:
1. Verifique a ordem de execução
2. Confira logs de erro
3. Valide se todas as extensões foram criadas
4. Confirme se a função `update_updated_at_column()` existe

---

## ✅ Checklist de Validação

Após executar todas as migrations:

- [ ] Todas as 13 migrations executaram sem erros
- [ ] Função `update_updated_at_column()` existe
- [ ] Extensões instaladas (`uuid-ossp`, `pgcrypto`, `unaccent`)
- [ ] RLS habilitado em todas as tabelas
- [ ] Triggers criados corretamente
- [ ] Índices criados
- [ ] Validar com: `SELECT * FROM pg_tables WHERE schemaname = 'public';`

---

**Desenvolvido para Valle 360** 🚀
*Database Architecture - Novembro 2024*

