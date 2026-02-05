# Valle 360 - Plano de Implementação Completo

## Visão Geral
Sistema integrado de gestão para clientes e colaboradores da Valle 360, com dashboards personalizados por role, sistema de aprovações, kanban, mensagens, IA, ranking e gamificação.

---

## 1. ÁREA DO CLIENTE

### 1.1 Dashboard do Cliente
- **Saudação personalizada**: "Olá, [Nome], sejam bem-vindo! Sempre bom te ver por aqui."
- **Gráficos interativos**:
  - Pizza/Barra com comparativo mensal
  - Métricas de performance
  - Crescimento de seguidores
  - Engajamento
- **Recomendações de IA**: Sugestões de novos serviços baseadas em performance

### 1.2 Produção/Aprovações
- **Abas**:
  - Aguardando Aprovação
  - Aprovados
  - Recusados
- **Fluxo de Aprovação**:
  - Aprovar → Mensagem de agradecimento
  - Recusar → Campo de comentários para equipe
- **Histórico**: Data e horário de cada ação
- **Notificação**: Badge no ícone do rodapé com número de pendências

### 1.3 Benefícios
- Lista de benefícios ativos
- **Indicações**: Visualizar clientes indicados e que entraram

### 1.4 Assistente de IA
- **Layout**: Elemento giratório (igual referência)
- **Saudação**: "Olá [Nome], como posso ajudá-lo hoje?"
- **Quebra-gelos**:
  - "Quero uma análise geral da evolução da minha marca"
  - "Traga novidades do meu setor"
  - "Quero agendar uma reunião com a equipe"
  - "O que meus concorrentes estão fazendo?"

### 1.5 Agenda
- **3 Seções**:
  - Eventos Valle 360
  - Minhas Reuniões
  - Minha Agenda para a Equipe (disponibilidade para gravações)

### 1.6 Serviços
- **Organização por categorias**:
  - Atendimento
  - Vendas
  - Marketing
  - Comercial
- **Destaques**: Serviços em destaque
- **IA**: Recomendar serviços baseados nos números e pacote atual

---

## 2. ÁREA DOS COLABORADORES

### 2.1 Roles e Departamentos
1. **Super Admin**: Acesso total
2. **Video Maker**: Produção de vídeos
3. **Web Designer**: Desenvolvimento web
4. **Designer Gráfico**: Peças gráficas
5. **Social Media**: Gestão de redes sociais
6. **Gestor de Tráfego**: Campanhas pagas
7. **Head de Marketing**: Estratégia geral
8. **Financeiro**: Gestão financeira
9. **RH**: Recursos humanos
10. **Comercial**: Vendas e prospecção

### 2.2 Dashboard por Departamento

#### Gestor de Tráfego
- Seletor de cliente
- Métricas completas do cliente:
  - ROAS, CPC, CPM, CTR
  - Gastos, conversões
  - Comparativo mensal
- Controle de campanhas
- Alerta de créditos
- Performance vs Meta

#### Social Media
- Calendário de publicações
- Posts pendentes de aprovação
- Métricas de engajamento
- Conteúdo agendado
- Cadastro de clientes

#### Video Maker
- Projetos em andamento
- Solicitações de gravação
- Prazo de entregas
- Arquivos/Materiais

#### Designer Gráfico
- Briefings recebidos
- Peças em produção
- Aprovações pendentes
- Banco de artes

#### Web Designer
- Projetos web
- Tickets de manutenção
- Performance de sites
- Deploy tracking

#### Comercial
- Pipeline de vendas
- Clientes fechados
- Indicações de IA para novos leads
- Alerta de renovação de contratos
- IA para negociação
- Métricas de conversão
- Cadastro de leads

#### Financeiro
- Dashboard financeiro
- Histórico de pagamentos
- Lembretes de cobrança
- Notificações de entrada
- Informações contratuais

#### RH
- Cadastro de colaboradores
- Performance da equipe
- Solicitações (reembolso, folga, home)
- Ranking
- Alertas de desempenho

### 2.3 Sistema Kanban
- **Por departamento**: Cada setor tem seu board
- **Colunas personalizáveis**:
  - Arrastar para reordenar
  - Adicionar/remover colunas
  - Inserir etapas no meio
- **Cards**:
  - Arrastar entre colunas
  - Marcar responsáveis (cross-department)
  - Labels/Tags
  - Comentários
  - Anexos
- **Permissões**:
  - Todos criam etiquetas
  - Super admin: exclui cards, colunas, etapas
  - Notificações quando marcado

### 2.4 Sistema de Mensagens
- **Contatos diretos**: Click e abre conversa 1:1
- **Grupos**: Grupo geral + grupos por projeto
- **Histórico**: Salvo com data/hora
- **Notificações**:
  - Badge de mensagens não lidas
  - Após 2h sem ler: WhatsApp automático
- **Mensagens com cliente**: Canal separado

### 2.5 Ranking e Gamificação
- **Visível para todos**:
  - Top performers do mês
  - Quem está com atrasos
  - Pendências por pessoa
- **Sistema de Benefícios**:
  - Bater meta = benefício do mês
  - 3 meses consecutivos = aumento salarial
  - Encontro mensal de premiação
- **Sistema de Alertas**:
  - 1 mês mal avaliado = alerta 1
  - Cliente avalia mal (NPS) = alerta
  - Muitos atrasos = alerta
  - 3 alertas = desligamento (com aviso progressivo)

### 2.6 Solicitações
- **Tipos**:
  - Reembolso (com anexo de nota)
  - Home Office
  - Folga
- **Status**: Pendente / Aprovado / Recusado
- **Aprovação**: RH ou Super Admin

### 2.7 Agenda
- **Agenda da empresa**: Eventos, reuniões semanais com links
- **Agenda dos colaboradores**:
  - Ver agenda de outros
  - Criar compromisso para outro
  - Solicitar gravação (vai para aprovação)

### 2.8 Pessoas
- **Visualização para todos**: Nome, email, telefone
- **Visualização Super Admin**:
  - Detalhes completos
  - Relatório de performance
  - Entregas, atrasos, NPS
  - Ranking
  - Visão da equipe
  - IA analisa: "merece aumento", "reter talento", "atenção", "risco de desligamento"
  - Histórico: home office, reembolsos, folgas

### 2.9 Cadastro de Cliente
- **Quem pode criar**: Super Admin, RH, Social Media
- **Dados**:
  - Nome, telefone, email
  - Redes sociais
  - Contrato
  - Departamentos que atendem
- **Acesso**: Cliente recebe link por email e WhatsApp
- **Exclusão**: Somente Super Admin

---

## 3. CONTROLE DE ACESSO (RLS)

### Super Admin
- Acesso total a tudo
- Vê todos os perfis
- Todas as métricas financeiras
- Todos os clientes

### Colaboradores
- Dashboard próprio do setor
- Kanban do setor
- Mensagens
- Solicitações (reembolso, home, folga)
- Ranking geral (visível para todos)
- Não vê valores de faturamento
- Só vê clientes atribuídos ao seu setor

### RH + Social Media
- Podem criar cadastros de clientes

### Financeiro
- Acesso a mensagens
- Dashboard financeiro dos clientes
- Histórico de pagamentos
- Lembretes de cobrança
- Notificações de entradas
- Informações contratuais

### Cliente
- Próprio dashboard
- Produção/Aprovações
- Benefícios e indicações
- IA
- Arquivos
- Agenda
- Serviços
- Financeiro (próprio)

---

## 4. TECNOLOGIAS E STACK

- **Frontend**: Next.js 14, React 18, TypeScript
- **UI**: Tailwind CSS, shadcn/ui, Framer Motion
- **Backend**: Supabase (Auth, Database, Storage, Realtime)
- **Gráficos**: Recharts, Chart.js
- **IA**: OpenAI API para recomendações e análises
- **Notificações**: Supabase Realtime + WhatsApp API
- **Calendário**: FullCalendar ou similar
- **Drag & Drop**: dnd-kit ou react-beautiful-dnd
- **Rich Text**: Tiptap ou similar para mensagens

---

## 5. ESTRUTURA DE PASTAS

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/
│   ├── cliente/
│   │   ├── dashboard/
│   │   ├── producao/
│   │   ├── beneficios/
│   │   ├── ia/
│   │   ├── arquivos/
│   │   ├── agenda/
│   │   ├── servicos/
│   │   └── financeiro/
│   └── app/ (colaboradores)
│       ├── dashboard/
│       ├── kanban/
│       ├── mensagens/
│       ├── agenda/
│       ├── pessoas/
│       ├── solicitacoes/
│       ├── relatorios/
│       └── [departamento]/
├── components/
│   ├── cliente/
│   ├── colaborador/
│   ├── shared/
│   ├── kanban/
│   ├── charts/
│   ├── messaging/
│   └── ai/
├── lib/
│   ├── supabase.ts
│   ├── auth.ts
│   ├── permissions.ts
│   └── utils.ts
├── types/
├── hooks/
└── services/
    ├── ai-service.ts
    ├── notification-service.ts
    └── analytics-service.ts
```

---

## 6. PRÓXIMAS ETAPAS DE IMPLEMENTAÇÃO

1. ✅ Banco de dados completo
2. ⏳ Componentes de UI base
3. ⏳ Dashboard do Cliente
4. ⏳ Sistema de Aprovações
5. ⏳ Assistente de IA
6. ⏳ Dashboards por Departamento
7. ⏳ Sistema Kanban
8. ⏳ Sistema de Mensagens
9. ⏳ Ranking e Gamificação
10. ⏳ Sistema de Solicitações
11. ⏳ Integrações (WhatsApp, IA)
12. ⏳ Testes e Deploy

---

## 7. OBSERVAÇÕES IMPORTANTES

- Todas as mudanças devem manter a navegação por rodapé
- Foco em UX/UI premium e profissional
- Animações sutis e fluidas
- Responsivo mobile-first
- Performance otimizada
- Segurança com RLS rigoroso
- IA integrada em pontos estratégicos
- Sistema de notificações robusto
- Gamificação motivadora mas justa
