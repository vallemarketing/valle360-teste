# Valle 360

Portal integrado com área interna da equipe e portal do cliente, desenvolvido com Next.js, TypeScript, Tailwind CSS e Supabase.

## Características

### 🎨 Design
- **Cores da marca**: Navy blue (#0b1220) e azul vibrante (#2b7de9)
- **Interface moderna**: Componentes UI com shadcn/ui e animações suaves
- **Responsivo**: Layout adaptável para desktop e mobile
- **PWA**: Instalável como aplicativo nativo

### 🏢 Área Interna (/app)
- **Dashboard**: Visão geral de tarefas, aprovações e métricas
- **Kanban**: Gestão visual de projetos com colunas (Backlog, Produção, Aprovação, Concluído)
- **Mensagens**: Sistema de comunicação da equipe (DM e grupos)
- **Pessoas**: Gerenciamento de colaboradores e permissões
- **Solicitações**: Home office, day off e reembolsos
- **Agenda**: Eventos, reuniões e webinars
- **Relatórios**: Performance da equipe e métricas
- **Financeiro**: Faturamento, faturas e pagamentos

### 👥 Portal do Cliente (/cliente)
- **Dashboard**: KPIs de redes sociais, engajamento e ROI
- **Produção**: Aprovação/reprovação de materiais com feedback
- **Créditos**: Gerenciamento de saldo e histórico de transações
- **Benefícios**: Programa de fidelidade e indicações
- **Assistente IA**: Suporte inteligente para Marketing, Vendas e Design
- **Arquivos**: Upload e compartilhamento de referências
- **Agenda**: Eventos e webinars disponíveis
- **Financeiro**: Faturas e histórico de pagamentos

## Tecnologias

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS 3**
- **Supabase** (PostgreSQL + Auth + Storage + Realtime)
- **Framer Motion** (Animações)
- **Lucide React** (Ícones)
- **Zod** (Validação)
- **TanStack Query** (State management)

## Estrutura do Banco de Dados

Todas as tabelas implementam Row Level Security (RLS) com políticas restritivas:

- **Usuários**: users (com roles: super_admin, gestor, colaborador, cliente)
- **Projetos**: teams, projects, tasks, task_comments, approvals
- **Comunicação**: message_groups, messages
- **Solicitações**: reimbursements, home_office_requests, day_off_requests
- **Eventos**: events
- **Portal Cliente**: credits, invoices, payments, social_accounts, benefits, referrals
- **Analytics**: nps, feedbacks, sales_overview
- **Segurança**: activity_logs (auditoria completa)

## Como Rodar

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente (.env)
NEXT_PUBLIC_SUPABASE_URL=sua_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build
npm start
```

## Acesso

- **Página inicial**: `/`
- **Área interna**: `/app/dashboard`
- **Portal do cliente**: `/cliente/dashboard`

## Segurança

- ✅ Row Level Security em todas as tabelas
- ✅ Políticas restritivas por role
- ✅ Logs de auditoria para todas as ações sensíveis
- ✅ Validação com Zod em todas as operações
- ✅ Isolamento de dados entre clientes

## PWA

O app é instalável como Progressive Web App com:
- Manifest configurado
- Service Worker para cache
- Suporte a notificações push
- Ícone Valle 360

---

Desenvolvido com ❤️ para Valle 360
# Valle360
# valle360-teste
