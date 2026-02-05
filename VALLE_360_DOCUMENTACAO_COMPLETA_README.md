# VALLE 360 - DOCUMENTAÇÃO TÉCNICA COMPLETA
## Análise Completa do Frontend e Especificação de Backend

> **Projeto**: Valle 360 - Portal Integrado (Área Interna + Portal do Cliente)  
> **Repositório**: https://github.com/vallemarketing/valle-360.git  
> **Data da Análise**: Novembro 2025  
> **Versão**: 1.0

---

## 📚 ÍNDICE DA DOCUMENTAÇÃO

Esta documentação foi dividida em partes para facilitar a leitura e implementação:

### **PARTE 1: ESTRUTURA DE TABELAS DO BANCO DE DADOS**
📄 Arquivos:
- `VALLE_360_DOCUMENTACAO_COMPLETA_PARTE_1_TABELAS.md` (Módulos 1-5)
- `VALLE_360_DOCUMENTACAO_COMPLETA_PARTE_1B_TABELAS_CONT.md` (Módulos 6-9)
- `VALLE_360_DOCUMENTACAO_COMPLETA_PARTE_1C_TABELAS_FINAL.md` (Módulos 10-15)

**Conteúdo**: 75+ tabelas organizadas em 15 módulos

### **PARTE 2: RELACIONAMENTOS ENTRE TABELAS**
📄 Arquivo: `VALLE_360_DOCUMENTACAO_COMPLETA_PARTE_2_RELACIONAMENTOS.md`

**Conteúdo**: 150+ relacionamentos mapeados, incluindo 1:1, 1:N, N:N e polimórficos

### **PARTE 3: ENDPOINTS DE API NECESSÁRIOS**
📄 Arquivos:
- `VALLE_360_DOCUMENTACAO_COMPLETA_PARTE_3A_ENDPOINTS_API.md` (Auth, Clientes, Créditos, Produção)
- `VALLE_360_DOCUMENTACAO_COMPLETA_PARTE_3B_ENDPOINTS_KANBAN_MENSAGENS.md` (Kanban, Mensagens)

**Conteúdo**: 100+ endpoints com Request/Response detalhados

---

## 🎯 VISÃO GERAL DO SISTEMA

### O que é o Valle 360?

O **Valle 360** é um sistema integrado que conecta:

1. **Área Interna (/app)**: Dashboard e ferramentas para a equipe Valle
2. **Portal do Cliente (/cliente)**: Dashboard e interação para clientes

### Tecnologias Utilizadas

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS 3
- Framer Motion
- React Query (TanStack Query)
- Zod (Validação)

**Backend Necessário:**
- Supabase (PostgreSQL + Auth + Storage + Realtime)
- Row Level Security (RLS)
- Real-time com WebSockets
- Storage de arquivos

---

## 📊 RESUMO DAS TABELAS DO BANCO DE DADOS

### Total: **75+ Tabelas** organizadas em 15 módulos

#### 1. Autenticação e Usuários (3 tabelas)
- `user_profiles` - Perfis de usuários
- `user_preferences` - Preferências individuais
- `user_sessions` - Sessões ativas

#### 2. Clientes (5 tabelas)
- `clients` - Dados básicos dos clientes
- `client_profiles_extended` - Informações detalhadas
- `client_contracts` - Contratos
- `client_rules_documents` - Documentos de regras
- `client_referrals` - Sistema de indicações

#### 3. Créditos e Financeiro do Cliente (6 tabelas)
- `client_credits` - Transações de créditos
- `client_credit_balance` - Saldo atual
- `client_benefits` - Benefícios e descontos
- `invoices` - Faturas
- `payments` - Pagamentos realizados
- `payment_reminders` - Lembretes de pagamento

#### 4. Métricas do Cliente (5 tabelas)
- `client_metrics` - Métricas mensais consolidadas
- `social_media_accounts` - Contas de redes sociais
- `contract_services` - Serviços ativos
- `before_after_metrics` - Comparativo antes/depois
- `client_dashboard_settings` - Personalização do dashboard

#### 5. Produção e Aprovações (3 tabelas)
- `production_items` - Itens criados pela equipe
- `production_comments` - Feedback e comentários
- `production_approvals` - Histórico de aprovações

#### 6. Kanban (6 tabelas)
- `kanban_boards` - Quadros Kanban
- `kanban_columns` - Colunas dos quadros
- `kanban_labels` - Etiquetas
- `kanban_tasks` - Tarefas/cards
- `kanban_task_comments` - Comentários em tarefas
- `kanban_task_history` - Histórico de mudanças

#### 7. Mensagens (8 tabelas)
- `message_groups` - Grupos de mensagens
- `message_group_members` - Membros dos grupos
- `direct_conversations` - Conversas diretas (DM)
- `direct_conversation_status` - Status de leitura
- `messages` - Mensagens (grupos e diretas)
- `message_reactions` - Reações às mensagens
- `user_presence` - Status de presença online
- `message_notifications` - Notificações de mensagens

#### 8. Arquivos (2 tabelas)
- `client_files` - Arquivos compartilhados
- `file_access_log` - Log de acessos

#### 9. Calendário (3 tabelas)
- `calendar_events` - Eventos e reuniões
- `calendar_event_participants` - Participantes e RSVP
- `meeting_requests` - Solicitações de reunião

#### 10. Colaboradores e RH (8 tabelas)
- `employees` - Dados dos colaboradores
- `employee_areas` - Áreas/departamentos
- `employee_client_assignments` - Atribuição a clientes
- `employee_invitations` - Convites
- `employee_requests` - Solicitações (home office, folgas, etc)
- `employee_goals` - Metas mensais
- `employee_performance` - Performance mensal
- `nps_ratings` - Avaliações NPS

#### 11. Financeiro Interno (12 tabelas)
- `expense_categories` - Categorias de despesas
- `accounts_payable` - Contas a pagar
- `accounts_receivable` - Contas a receber
- `reimbursement_requests` - Reembolsos
- `payroll_benefits` - Benefícios disponíveis
- `employee_benefits` - Benefícios atribuídos
- `payroll_records` - Folha de pagamento
- `bank_accounts` - Contas bancárias
- `bank_transactions` - Transações bancárias
- `tax_obligations` - Obrigações fiscais
- `cost_centers` - Centro de custos por cliente
- `financial_alerts` - Alertas financeiros

#### 12. IA e Recomendações (2 tabelas)
- `ai_recommendations` - Recomendações da IA
- `ai_conversations` - Conversas com assistente IA

#### 13. Auditoria (2 tabelas)
- `activity_logs` - Log de ações importantes
- `error_logs` - Logs de erros

#### 14. Notificações (1 tabela)
- `notifications` - Notificações do sistema

#### 15. Dashboard (1 tabela)
- `dashboard_widgets` - Widgets customizáveis

---

## 🔗 RESUMO DOS RELACIONAMENTOS

### Tipos de Relacionamentos Mapeados:

- **1:1 (Um para Um)**: 15 relacionamentos
- **1:N (Um para Muitos)**: 100+ relacionamentos
- **N:N (Muitos para Muitos)**: 8 relacionamentos principais
- **Polimórficos**: 5 relacionamentos

### Tabelas Mais Conectadas:

1. **user_profiles**: Hub central - 30+ relacionamentos
2. **clients**: 25+ relacionamentos
3. **employees**: 15+ relacionamentos
4. **messages**: 10+ relacionamentos
5. **kanban_tasks**: 10+ relacionamentos

### Relacionamentos N:N Principais:

1. **Usuários ↔ Grupos de Mensagens** (via `message_group_members`)
2. **Colaboradores ↔ Clientes** (via `employee_client_assignments`)
3. **Tarefas Kanban ↔ Usuários** (via JSONB `assigned_to`)
4. **Eventos ↔ Participantes** (via `calendar_event_participants`)
5. **Colaboradores ↔ Benefícios** (via `employee_benefits`)

---

## 📡 RESUMO DOS ENDPOINTS DE API

### Total: **100+ Endpoints** organizados por módulos

#### Módulos de Endpoints:

1. **Autenticação** (9 endpoints)
   - Login, Registro, Logout, Refresh Token, Reset de Senha, etc.

2. **Clientes** (10 endpoints)
   - CRUD completo, contratos, perfil estendido, indicações

3. **Créditos** (4 endpoints)
   - Saldo, transações, recarga, uso

4. **Produção** (8 endpoints)
   - CRUD de itens, aprovações, rejeições, comentários

5. **Kanban** (10 endpoints)
   - Quadros, colunas, tarefas, movimentação, comentários, histórico

6. **Mensagens** (19 endpoints)
   - Grupos, mensagens, conversas diretas, reações, presença, anexos

7. **Calendário** (8 endpoints)
   - Eventos, participantes, RSVP, reuniões

8. **Arquivos** (6 endpoints)
   - Upload, download, listagem, compartilhamento

9. **Colaboradores** (12 endpoints)
   - CRUD, solicitações, metas, performance, NPS

10. **Financeiro** (15 endpoints)
    - Contas a pagar/receber, folha, impostos, centro de custos

11. **IA** (5 endpoints)
    - Recomendações, assistente, conversas

12. **Notificações** (4 endpoints)
    - Listagem, marcar como lida, preferências

### Endpoints Real-Time (WebSocket):

- Mensagens em tempo real
- Presença de usuários (online/offline)
- Indicador "digitando..."
- Notificações push
- Atualizações de Kanban

---

## 🏗️ ARQUITETURA DO SISTEMA

### Frontend (Next.js 14)

```
/src
├── /app                    # Pages (App Router)
│   ├── /app               # Área interna da equipe
│   │   ├── /dashboard
│   │   ├── /kanban
│   │   ├── /mensagens
│   │   ├── /pessoas
│   │   ├── /solicitacoes
│   │   ├── /agenda
│   │   └── /financeiro
│   ├── /cliente           # Portal do cliente
│   │   ├── /dashboard
│   │   ├── /producao
│   │   ├── /creditos
│   │   ├── /beneficios
│   │   ├── /ia
│   │   ├── /arquivos
│   │   ├── /agenda
│   │   └── /financeiro
│   └── /auth              # Autenticação
├── /components            # Componentes reutilizáveis
│   ├── /ui               # Componentes UI básicos
│   ├── /dashboard        # Componentes de dashboard
│   ├── /kanban           # Componentes de Kanban
│   ├── /messaging        # Componentes de mensagens
│   └── /layout           # Layout e navegação
├── /lib                   # Utilitários
│   ├── supabase.ts
│   ├── auth.ts
│   └── utils.ts
├── /types                 # Tipos TypeScript
└── /hooks                 # Custom hooks
```

### Backend (Supabase)

```
PostgreSQL Database
├── Tabelas (75+)
├── Row Level Security (RLS) em todas
├── Triggers para automação
├── Functions para lógica complexa
└── Índices para performance

Supabase Auth
├── JWT Authentication
├── Roles e permissões
└── Session management

Supabase Storage
├── Bucket: production-items
├── Bucket: client-files
├── Bucket: attachments
└── Bucket: avatars

Supabase Realtime
├── Mensagens em tempo real
├── Presença de usuários
├── Notificações push
└── Atualizações de Kanban
```

---

## 🔐 SEGURANÇA E PERMISSÕES

### Row Level Security (RLS)

**Todas as tabelas devem ter RLS habilitado** com políticas específicas:

#### Exemplo de Políticas:

```sql
-- Clientes só veem seus próprios dados
CREATE POLICY "Clientes veem apenas seus dados"
ON clients FOR SELECT
USING (auth.uid() = user_id);

-- Colaboradores veem clientes atribuídos
CREATE POLICY "Colaboradores veem clientes atribuídos"
ON clients FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM employee_client_assignments
    WHERE client_id = clients.id
    AND employee_id = auth.uid()
  )
);

-- Super admins veem tudo
CREATE POLICY "Super admins veem tudo"
ON clients FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND user_type = 'super_admin'
  )
);
```

### Hierarquia de Permissões:

1. **super_admin**: Acesso total
2. **marketing_head**: Acesso a todos os módulos internos
3. **Gestores por área**: Acesso à sua área específica
4. **Colaboradores**: Acesso limitado às suas tarefas
5. **Clientes**: Acesso apenas aos seus dados

---

## 🚀 IMPLEMENTAÇÃO RECOMENDADA

### Fase 1: Fundação (2-3 semanas)
- [ ] Setup do Supabase
- [ ] Criação das tabelas principais (Usuários, Clientes)
- [ ] Implementação de autenticação
- [ ] RLS básico

### Fase 2: Módulos Core (4-6 semanas)
- [ ] Módulo de Clientes completo
- [ ] Módulo de Créditos
- [ ] Módulo de Produção/Aprovações
- [ ] Dashboard do Cliente (básico)

### Fase 3: Colaboração (3-4 semanas)
- [ ] Módulo de Kanban
- [ ] Módulo de Mensagens (com real-time)
- [ ] Módulo de Calendário

### Fase 4: Gestão Interna (3-4 semanas)
- [ ] Módulo de Colaboradores/RH
- [ ] Módulo Financeiro Interno
- [ ] Módulo de Relatórios

### Fase 5: IA e Otimizações (2-3 semanas)
- [ ] Integração com IA (recomendações)
- [ ] Assistente IA
- [ ] Otimizações de performance
- [ ] Testes e refinamentos

### Fase 6: Lançamento (1-2 semanas)
- [ ] Testes finais
- [ ] Documentação de uso
- [ ] Treinamento da equipe
- [ ] Deploy em produção

---

## 📊 FUNCIONALIDADES PRINCIPAIS

### Área Interna (/app)

✅ **Dashboard**: KPIs, métricas e visão geral  
✅ **Kanban**: Gestão de projetos com drag & drop  
✅ **Mensagens**: Comunicação em tempo real (grupos + DM)  
✅ **Pessoas**: Gestão de equipe com análise de IA  
✅ **Solicitações**: Home office, folgas, reembolsos  
✅ **Agenda**: Eventos, reuniões, prazos  
✅ **Relatórios**: Performance e analytics  
✅ **Financeiro**: Gestão completa (contas, folha, impostos)

### Portal do Cliente (/cliente)

✅ **Dashboard**: Métricas de performance (redes sociais, ROI, etc)  
✅ **Produção**: Aprovação/rejeição de materiais  
✅ **Créditos**: Gestão de saldo e transações  
✅ **Benefícios**: Programa de fidelidade e indicações  
✅ **Assistente IA**: Suporte inteligente  
✅ **Arquivos**: Upload e compartilhamento  
✅ **Agenda**: Eventos e webinars  
✅ **Financeiro**: Faturas e pagamentos

---

## 🎨 DESIGN SYSTEM

### Cores Principais:
- **Navy Blue**: `#0b1220` (Fundo escuro)
- **Valle Blue**: `#2b7de9` (Primária)
- **Orange**: `#f97316` (Secundária/CTAs)
- **Prata/Cinza**: `#94a3b8` (Neutro)

### Componentes UI:
- shadcn/ui (base)
- Lucide Icons
- Framer Motion (animações)
- TailwindCSS (estilização)

---

## 📝 CONVENÇÕES E PADRÕES

### Nomenclatura de Tabelas:
- Plural: `users`, `clients`, `messages`
- Snake_case: `user_profiles`, `kanban_tasks`
- Relacionamentos N:N: `employee_client_assignments`

### Nomenclatura de Endpoints:
- RESTful: `GET /clients`, `POST /clients/:id/contracts`
- Kebab-case: `/production-items`, `/credit-balance`
- Versioning: `/api/v1/...`

### Campos Padrão em Todas as Tabelas:
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
```

---

## 🔍 PRÓXIMOS PASSOS

### Para Implementar o Backend:

1. **Ler todos os documentos na ordem**:
   - Parte 1 (A, B, C): Criar todas as tabelas
   - Parte 2: Entender os relacionamentos
   - Parte 3 (A, B): Implementar os endpoints

2. **Setup inicial do Supabase**:
   - Criar projeto
   - Configurar variáveis de ambiente
   - Executar migrations

3. **Implementar autenticação**:
   - JWT tokens
   - Refresh tokens
   - Políticas RLS

4. **Criar tabelas sequencialmente**:
   - Começar por `user_profiles`
   - Depois `clients`
   - Seguir a ordem lógica dos módulos

5. **Implementar endpoints módulo por módulo**:
   - Testar cada endpoint
   - Validar com Zod
   - Documentar com Swagger/OpenAPI

6. **Configurar Real-time**:
   - WebSocket connections
   - Presence system
   - Message streaming

---

## 📧 SUPORTE E CONTATO

Para dúvidas sobre a implementação:
- Consultar os arquivos de documentação detalhados
- Verificar os tipos TypeScript em `/src/types`
- Analisar os componentes do frontend como referência

---

## ✅ CHECKLIST DE VALIDAÇÃO

Antes de considerar completo, verifique:

- [ ] Todas as 75+ tabelas foram criadas
- [ ] RLS está habilitado em TODAS as tabelas
- [ ] Todos os relacionamentos estão mapeados corretamente
- [ ] Índices de performance foram criados
- [ ] Todos os endpoints principais foram implementados
- [ ] Autenticação JWT está funcionando
- [ ] Real-time de mensagens está operacional
- [ ] Upload de arquivos está configurado
- [ ] Notificações estão sendo enviadas
- [ ] Logs de auditoria estão sendo gravados

---

## 📚 DOCUMENTOS RELACIONADOS

1. `VALLE_360_DOCUMENTACAO_COMPLETA_PARTE_1_TABELAS.md`
2. `VALLE_360_DOCUMENTACAO_COMPLETA_PARTE_1B_TABELAS_CONT.md`
3. `VALLE_360_DOCUMENTACAO_COMPLETA_PARTE_1C_TABELAS_FINAL.md`
4. `VALLE_360_DOCUMENTACAO_COMPLETA_PARTE_2_RELACIONAMENTOS.md`
5. `VALLE_360_DOCUMENTACAO_COMPLETA_PARTE_3A_ENDPOINTS_API.md`
6. `VALLE_360_DOCUMENTACAO_COMPLETA_PARTE_3B_ENDPOINTS_KANBAN_MENSAGENS.md`

---

**Data de Criação**: Novembro 2025  
**Versão**: 1.0  
**Status**: ✅ Completo e Detalhado

---

> **Nota Importante**: Esta documentação foi criada DO ZERO baseada na análise completa do código frontend do Valle 360. Não reutiliza tabelas existentes - todas foram especificadas desde o início para garantir consistência e completude.

