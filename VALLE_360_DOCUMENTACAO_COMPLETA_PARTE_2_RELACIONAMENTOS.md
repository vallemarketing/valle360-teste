# VALLE 360 - DOCUMENTAÇÃO COMPLETA DO SISTEMA
## PARTE 2: RELACIONAMENTOS ENTRE TABELAS

---

## 📊 DIAGRAMA DE RELACIONAMENTOS PRINCIPAIS

```
┌─────────────────┐
│   auth.users    │
└────────┬────────┘
         │
         ├─────────────────┐
         │                 │
    ┌────▼──────┐    ┌────▼────────┐
    │user_      │    │user_        │
    │profiles   │    │preferences  │
    └────┬──────┘    └─────────────┘
         │
    ┌────┼────────┬─────────┬──────────┐
    │    │        │         │          │
┌───▼──┐ │  ┌────▼────┐ ┌──▼──────┐ ┌─▼─────┐
│clients│ │  │employees│ │messages│ │kanban_│
│       │ │  │         │ │        │ │tasks  │
└───┬───┘ │  └────┬────┘ └────────┘ └───────┘
    │     │       │
    │     │       │
    └─────┴───────┴─────> production_items
```

---

## 1. RELACIONAMENTOS DO MÓDULO DE USUÁRIOS

### 1.1 user_profiles → Relacionamentos

**Tabela Central do Sistema**

```
user_profiles (1) ←→ (1) user_preferences
user_profiles (1) → (N) user_sessions
user_profiles (1) ←→ (0..1) clients [via client_id]
user_profiles (1) ←→ (0..1) employees [via employee_id]
user_profiles (1) → (N) activity_logs
user_profiles (1) → (N) notifications
user_profiles (1) → (N) kanban_tasks [como assigned_to]
user_profiles (1) → (N) messages [como sender]
user_profiles (1) → (N) production_items [como created_by]
user_profiles (1) → (N) calendar_events [como organizer]
user_profiles (1) → (N) employee_requests
user_profiles (1) → (N) ai_conversations
```

**Descrição**: `user_profiles` é a tabela central que conecta todas as outras. Cada usuário autenticado tem um perfil que determina suas permissões e relacionamentos.

---

## 2. RELACIONAMENTOS DO MÓDULO DE CLIENTES

### 2.1 clients → Relacionamentos

```
clients (1) ←→ (1) user_profiles [owner/account_manager]
clients (1) → (N) client_contracts
clients (1) → (N) client_metrics
clients (1) → (N) client_credits
clients (1) ←→ (1) client_credit_balance
clients (1) → (N) client_benefits
clients (1) → (N) invoices
clients (1) → (N) payments
clients (1) → (N) production_items
clients (1) → (N) social_media_accounts
clients (1) → (N) contract_services
clients (1) → (N) before_after_metrics
clients (1) ←→ (0..1) client_profiles_extended
clients (1) ←→ (0..1) client_dashboard_settings
clients (1) → (N) client_files
clients (1) → (N) calendar_events
clients (1) → (N) message_groups
clients (1) → (N) ai_recommendations
clients (1) → (N) cost_centers
clients (1) → (N) nps_ratings

-- Auto-relacionamento para indicações
clients (1) → (N) clients [via referred_by]
clients (1) ←→ (N) client_referrals [como referrer_id ou referred_id]

-- Relacionamento com colaboradores
clients (N) ←→ (N) employees [via employee_client_assignments]
```

### 2.2 Diagrama Detalhado do Cliente

```
                    ┌─────────────┐
                    │   clients   │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────▼────────┐  ┌─────▼──────┐  ┌────────▼─────────┐
│client_contracts│  │client_     │  │client_profiles_  │
│                │  │metrics     │  │extended          │
└────────────────┘  └────────────┘  └──────────────────┘
        │
┌───────▼──────────┐
│invoices          │
│                  │
└───────┬──────────┘
        │
┌───────▼──────────┐
│payments          │
└──────────────────┘
```

---

## 3. RELACIONAMENTOS DO MÓDULO DE PRODUÇÃO

### 3.1 production_items → Relacionamentos

```
production_items (N) → (1) clients
production_items (N) → (1) user_profiles [created_by]
production_items (N) → (1) user_profiles [assigned_to]
production_items (N) → (1) user_profiles [approved_by]
production_items (1) → (N) production_comments
production_items (1) → (N) production_approvals
```

### 3.2 Fluxo de Aprovação

```
┌──────────────────┐
│user_profiles     │ (Colaborador cria)
│(created_by)      │
└────────┬─────────┘
         │ creates
         ▼
┌──────────────────┐
│production_items  │
│status: pending   │
└────────┬─────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌───────────────────┐
│reject │ │approve            │
└───┬───┘ └─────────┬─────────┘
    │               │
    ▼               ▼
┌───────────────────────────┐
│production_approvals       │
│(histórico)                │
└───────────────────────────┘
```

---

## 4. RELACIONAMENTOS DO MÓDULO KANBAN

### 4.1 Hierarquia do Kanban

```
kanban_boards (1)
    │
    ├─→ kanban_columns (N)
    │       │
    │       └─→ kanban_tasks (N)
    │               │
    │               ├─→ kanban_task_comments (N)
    │               └─→ kanban_task_history (N)
    │
    └─→ kanban_labels (N)
```

### 4.2 kanban_tasks → Relacionamentos Externos

```
kanban_tasks (N) → (1) kanban_columns
kanban_tasks (N) → (1) kanban_boards
kanban_tasks (N) → (1) user_profiles [created_by]
kanban_tasks (N) → (0..1) clients
kanban_tasks (N) → (N) user_profiles [via assigned_to array]
kanban_tasks (1) → (N) kanban_task_comments
kanban_tasks (1) → (N) kanban_task_history
```

### 4.3 Integração Kanban com Mensagens

```
kanban_boards (1) ←→ (0..1) message_groups [via project_id]
```

**Descrição**: Cada board do Kanban pode ter um grupo de mensagens associado automaticamente.

---

## 5. RELACIONAMENTOS DO MÓDULO DE MENSAGENS

### 5.1 Estrutura de Mensagens

```
message_groups (1)
    │
    ├─→ message_group_members (N)
    │
    └─→ messages (N)
            │
            ├─→ message_reactions (N)
            └─→ message_notifications (N)

direct_conversations (1)
    │
    ├─→ direct_conversation_status (2) [um para cada user]
    │
    └─→ messages (N)
            │
            ├─→ message_reactions (N)
            └─→ message_notifications (N)
```

### 5.2 Relacionamentos de Mensagens

```
messages (N) → (0..1) message_groups
messages (N) → (0..1) direct_conversations
messages (N) → (1) user_profiles [sender_id]
messages (N) → (0..1) messages [reply_to]
messages (1) → (N) message_reactions
messages (1) → (N) message_notifications

message_groups (N) → (0..1) clients
message_groups (N) → (0..1) kanban_boards [project_id]
message_groups (1) → (N) message_group_members

direct_conversations:
  - user1_id → user_profiles
  - user2_id → user_profiles
```

### 5.3 Presença em Tempo Real

```
user_presence (1) ←→ (1) user_profiles
user_presence (N) → (0..1) message_groups [is_typing_in_group]
user_presence (N) → (0..1) direct_conversations [is_typing_in_conversation]
```

---

## 6. RELACIONAMENTOS DO MÓDULO DE CALENDÁRIO

### 6.1 calendar_events → Relacionamentos

```
calendar_events (N) → (1) user_profiles [organizer_id]
calendar_events (N) → (0..1) clients
calendar_events (1) → (N) calendar_event_participants
calendar_events (1) ←→ (0..N) meeting_requests [via calendar_event_id]
```

### 6.2 Fluxo de Agendamento

```
┌───────────────────┐
│meeting_requests   │
│status: pending    │
└────────┬──────────┘
         │ accepted
         ▼
┌───────────────────┐
│calendar_events    │
│status: confirmed  │
└───────────────────┘
```

---

## 7. RELACIONAMENTOS DO MÓDULO DE COLABORADORES

### 7.1 employees → Relacionamentos

```
employees (1) ←→ (1) user_profiles
employees (N) → (1) employee_areas
employees (1) → (N) employee_requests
employees (1) → (N) employee_goals
employees (1) → (N) employee_performance
employees (1) → (N) nps_ratings
employees (1) → (N) reimbursement_requests
employees (1) → (N) employee_benefits
employees (1) → (N) payroll_records

-- Relacionamento N:N com clientes
employees (N) ←→ (N) clients [via employee_client_assignments]
```

### 7.2 Hierarquia de Colaboradores

```
┌──────────────────┐
│employee_areas    │
│(Departamentos)   │
└────────┬─────────┘
         │ contains
         ▼
┌──────────────────┐
│employees         │
└────────┬─────────┘
         │
    ┌────┴────┬────────┬──────────┐
    │         │        │          │
    ▼         ▼        ▼          ▼
┌────────┐ ┌──────┐ ┌──────┐ ┌────────┐
│goals   │ │perf  │ │req   │ │payroll │
└────────┘ └──────┘ └──────┘ └────────┘
```

---

## 8. RELACIONAMENTOS DO MÓDULO FINANCEIRO

### 8.1 Fluxo Financeiro do Cliente

```
clients (1)
    │
    ├─→ invoices (N)
    │       │
    │       └─→ payments (N)
    │       └─→ payment_reminders (N)
    │
    ├─→ client_credits (N)
    │       │
    │       └─→ client_credit_balance (1)
    │
    └─→ accounts_receivable (N)
```

### 8.2 Fluxo Financeiro Interno

```
┌──────────────────┐
│expense_categories│
└────────┬─────────┘
         │
    ┌────┴────────────────┐
    │                     │
    ▼                     ▼
┌─────────────────┐ ┌──────────────┐
│accounts_payable │ │bank_         │
│                 │ │transactions  │
└─────────────────┘ └──────────────┘
         │                 │
         └────────┬────────┘
                  │
          ┌───────▼────────┐
          │bank_accounts   │
          └────────────────┘
```

### 8.3 Relacionamentos Financeiros Completos

```
accounts_payable (N) → (1) expense_categories
accounts_payable (N) → (1) user_profiles [created_by]

accounts_receivable (N) → (1) clients
accounts_receivable (N) → (0..1) client_contracts

bank_transactions (N) → (1) bank_accounts
bank_transactions (N) → (0..1) expense_categories

payroll_records (N) → (1) employees
payroll_records (N) → (1) user_profiles [created_by]

reimbursement_requests (N) → (1) employees

employee_benefits (N) → (1) employees
employee_benefits (N) → (1) payroll_benefits

cost_centers (N) → (1) clients
```

---

## 9. RELACIONAMENTOS DE ARQUIVOS E DOCUMENTOS

### 9.1 client_files → Relacionamentos

```
client_files (N) → (1) clients
client_files (N) → (1) user_profiles [uploaded_by]
client_files (1) → (N) file_access_log
```

### 9.2 Arquivos em Outros Contextos

```
production_items.file_url → Storage
client_contracts.pdf_url → Storage
client_contracts.signed_pdf_url → Storage
employee_requests.receipt_url → Storage
invoices.pdf_url → Storage
messages.attachments → Storage (via JSON)
kanban_tasks.attachments → Storage (via JSON)
```

---

## 10. RELACIONAMENTOS DE IA E RECOMENDAÇÕES

### 10.1 ai_recommendations → Relacionamentos Polimórficos

```
ai_recommendations (N) → (0..1) [Qualquer entidade via target_type + target_id]
  - target_type = 'client' → clients(id)
  - target_type = 'employee' → employees(id)
  - target_type = 'service' → contract_services(id)
  - target_type = 'general' → NULL
```

### 10.2 ai_conversations → Relacionamentos

```
ai_conversations (N) → (1) user_profiles
ai_conversations (N) → (0..1) [Qualquer entidade via context_type + context_id]
```

---

## 11. RELACIONAMENTOS DE AUDITORIA

### 11.1 activity_logs → Relacionamentos Polimórficos

```
activity_logs (N) → (1) user_profiles [user_id]
activity_logs (N) → (0..1) [Qualquer entidade via entity_type + entity_id]

Exemplos:
- entity_type = 'client' → clients(id)
- entity_type = 'production_item' → production_items(id)
- entity_type = 'invoice' → invoices(id)
```

### 11.2 Tabelas que Geram Logs

**Todas as operações importantes devem gerar activity_logs:**
- Criação/edição de clientes
- Aprovações de produção
- Mudanças financeiras
- Alterações de contratos
- Movimentações no Kanban
- Ações administrativas

---

## 12. RELACIONAMENTOS COMPLEXOS (N:N)

### 12.1 Usuários ↔ Grupos de Mensagens

```
user_profiles (N) ←→ (N) message_groups
[via message_group_members]

Tabela intermediária: message_group_members
  - group_id
  - user_id
  - role (admin/moderator/member)
  - permissions
```

### 12.2 Colaboradores ↔ Clientes

```
employees (N) ←→ (N) clients
[via employee_client_assignments]

Tabela intermediária: employee_client_assignments
  - employee_id
  - client_id
  - assigned_by
  - assigned_at
```

### 12.3 Tarefas Kanban ↔ Usuários

```
kanban_tasks (N) ←→ (N) user_profiles
[via campo JSONB assigned_to]

Armazenamento: Array de user_ids no campo assigned_to
```

### 12.4 Eventos ↔ Participantes

```
calendar_events (N) ←→ (N) user_profiles
[via calendar_event_participants]

Tabela intermediária: calendar_event_participants
  - event_id
  - user_id
  - rsvp_status
  - attended
```

### 12.5 Colaboradores ↔ Benefícios

```
employees (N) ←→ (N) payroll_benefits
[via employee_benefits]

Tabela intermediária: employee_benefits
  - employee_id
  - benefit_id
  - custom_amount
  - is_active
```

---

## 13. RELACIONAMENTOS DE NOTIFICAÇÕES

### 13.1 notifications → Relacionamentos

```
notifications (N) → (1) user_profiles
notifications (N) → (0..1) [Qualquer entidade via related_type + related_id]

Gatilhos de notificações:
- Nova mensagem → message_notifications
- Tarefa atribuída → notifications
- Aprovação necessária → notifications
- Prazo próximo → notifications
- Pagamento vencendo → notifications
- Nova recomendação IA → notifications
```

### 13.2 message_notifications (específico para mensagens)

```
message_notifications (N) → (1) user_profiles
message_notifications (N) → (1) messages
```

---

## 14. RELACIONAMENTOS DE MÉTRICAS E ANALYTICS

### 14.1 Métricas do Cliente

```
clients (1) → (N) client_metrics [um por mês]
clients (1) → (N) before_after_metrics
clients (1) → (N) social_media_accounts
clients (1) → (N) contract_services
```

### 14.2 Performance de Colaboradores

```
employees (1) → (N) employee_performance [um por mês]
employees (1) → (N) employee_goals [um por mês]
employees (1) → (N) nps_ratings [recebidos]
```

### 14.3 Centro de Custos

```
clients (1) → (N) cost_centers [um por mês]
```

---

## 15. RESTRIÇÕES E REGRAS DE INTEGRIDADE

### 15.1 Regras Críticas

**1. user_profiles deve ter OU client_id OU employee_id (ou nenhum para super_admin)**
```sql
CHECK (
  (user_type = 'client' AND client_id IS NOT NULL AND employee_id IS NULL) OR
  (user_type != 'client' AND client_id IS NULL) OR
  (user_type = 'super_admin')
)
```

**2. messages deve ter OU group_id OU conversation_id (não ambos)**
```sql
CHECK (
  (group_id IS NOT NULL AND conversation_id IS NULL) OR 
  (group_id IS NULL AND conversation_id IS NOT NULL)
)
```

**3. direct_conversations: user1_id < user2_id (ordem consistente)**
```sql
CHECK (user1_id < user2_id)
```

**4. calendar_events: end_datetime > start_datetime**
```sql
CHECK (end_datetime > start_datetime)
```

**5. nps_ratings: score entre 0 e 10**
```sql
CHECK (score BETWEEN 0 AND 10)
```

### 15.2 Unicidade Compostas Importantes

```sql
-- Um usuário não pode ter duplicatas de metas por mês
UNIQUE(user_id, month, year) em employee_goals

-- Um usuário não pode ter duplicatas de performance por mês
UNIQUE(user_id, month, year) em employee_performance

-- Um cliente não pode ter duplicatas de métricas por mês
UNIQUE(client_id, month, year) em client_metrics

-- Um colaborador não pode ter o mesmo benefício duas vezes
UNIQUE(employee_id, benefit_id) em employee_benefits

-- Um usuário não pode estar duas vezes no mesmo grupo
UNIQUE(group_id, user_id) em message_group_members

-- Uma conversa direta entre dois usuários é única
UNIQUE(user1_id, user2_id) em direct_conversations
```

---

## 16. CASCATAS E DELEÇÕES

### 16.1 ON DELETE CASCADE (Deleção em cascata)

**Quando o pai é deletado, os filhos também são:**

```
user_profiles → user_sessions (CASCADE)
user_profiles → user_presence (CASCADE)
user_profiles → notifications (CASCADE)
user_profiles → ai_conversations (CASCADE)

clients → client_contracts (CASCADE)
clients → client_credits (CASCADE)
clients → production_items (CASCADE)
clients → invoices (CASCADE)

kanban_boards → kanban_columns (CASCADE)
kanban_columns → kanban_tasks (CASCADE)
kanban_tasks → kanban_task_comments (CASCADE)

message_groups → message_group_members (CASCADE)
message_groups → messages (CASCADE)
messages → message_reactions (CASCADE)

employees → employee_requests (CASCADE)
employees → employee_benefits (CASCADE)
```

### 16.2 ON DELETE SET NULL (Define como NULL)

**Quando o pai é deletado, a referência vira NULL:**

```
user_profiles [created_by] → SET NULL em várias tabelas
user_profiles [assigned_to] → SET NULL
clients [referred_by] → SET NULL
kanban_boards [project_id] → SET NULL em message_groups
```

---

## 17. ÍNDICES PARA PERFORMANCE

### 17.1 Índices Críticos para Relacionamentos

```sql
-- Relacionamentos frequentes
CREATE INDEX idx_foreign_key_client_id ON [tabela](client_id);
CREATE INDEX idx_foreign_key_user_id ON [tabela](user_id);
CREATE INDEX idx_foreign_key_employee_id ON [tabela](employee_id);

-- Queries temporais
CREATE INDEX idx_created_at_desc ON [tabela](created_at DESC);
CREATE INDEX idx_month_year ON [tabela](year DESC, month DESC);

-- Filtros de status
CREATE INDEX idx_status ON [tabela](status);
CREATE INDEX idx_active ON [tabela](is_active) WHERE is_active = true;

-- Buscas de texto
CREATE INDEX idx_search_name ON [tabela] USING gin(to_tsvector('portuguese', name));
```

---

## 18. TRIGGERS E FUNÇÕES AUTOMÁTICAS

### 18.1 Triggers Recomendados

```sql
-- 1. Atualizar updated_at automaticamente
CREATE TRIGGER update_timestamp 
BEFORE UPDATE ON [tabela]
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. Atualizar contadores
CREATE TRIGGER update_message_count
AFTER INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION increment_group_message_count();

-- 3. Criar logs de auditoria
CREATE TRIGGER log_important_changes
AFTER INSERT OR UPDATE OR DELETE ON [tabela]
FOR EACH ROW EXECUTE FUNCTION log_to_activity_logs();

-- 4. Atualizar saldo de créditos
CREATE TRIGGER update_credit_balance
AFTER INSERT ON client_credits
FOR EACH ROW EXECUTE FUNCTION recalculate_credit_balance();

-- 5. Notificações automáticas
CREATE TRIGGER send_notification_on_assignment
AFTER INSERT ON kanban_tasks
FOR EACH ROW EXECUTE FUNCTION notify_assigned_users();
```

---

## RESUMO DOS RELACIONAMENTOS

**Total de Relacionamentos Mapeados: 150+**

### Tipos de Relacionamentos:
- **1:1 (Um para Um)**: 15 relacionamentos
- **1:N (Um para Muitos)**: 100+ relacionamentos  
- **N:N (Muitos para Muitos)**: 8 relacionamentos principais
- **Polimórficos**: 5 relacionamentos

### Tabelas Mais Conectadas:
1. **user_profiles**: 30+ relacionamentos
2. **clients**: 25+ relacionamentos
3. **employees**: 15+ relacionamentos
4. **messages**: 10+ relacionamentos
5. **kanban_tasks**: 10+ relacionamentos

---

*Fim da Parte 2 - Relacionamentos Entre Tabelas*

**Próximo**: Parte 3 - Endpoints de API Necessários

