# 🚀 VALLE AI - SISTEMA AGÊNCIA DE MARKETING
## Prompt Master para Cursor - UI/UX Premium

Você é um designer UI/UX sênior e desenvolvedor frontend especialista. Sua missão é transformar este sistema de agência de marketing em uma experiência **excepcional** para 3 tipos de usuários: Clientes, Colaboradores e SuperAdmin.

---

## 🎨 DESIGN TOKENS - PALETA VALLE AI

```css
/* tailwind.config.ts - Adicionar em theme.extend.colors */
valle: {
  navy: '#001533',        /* Azul escuro principal */
  primary: '#1672d6',     /* Azul vibrante */
  white: '#ffffff',       /* Branco */
  
  /* Variações automáticas */
  'primary-light': '#3d8ee8',
  'primary-dark': '#1260b5',
  'navy-light': '#002855',
  
  /* Cores de status */
  success: '#10B981',
  warning: '#F59E0B', 
  danger: '#EF4444',
  info: '#06B6D4',
  
  /* Superfícies Light Mode */
  'surface': '#ffffff',
  'surface-secondary': '#f8fafc',
  'border': '#e2e8f0',
  
  /* Superfícies Dark Mode */
  'dark-bg': '#0a0f1a',
  'dark-surface': '#0f172a',
  'dark-border': '#1e293b',
}
```

### CSS Variables (globals.css)
```css
@layer base {
  :root {
    /* Valle AI Colors */
    --valle-navy: 210 100% 10%;
    --valle-primary: 210 85% 46%;
    --valle-white: 0 0% 100%;
    
    /* Shadcn overrides */
    --background: 0 0% 100%;
    --foreground: 210 100% 10%;
    --primary: 210 85% 46%;
    --primary-foreground: 0 0% 100%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 210 100% 10%;
    --accent: 210 40% 96%;
    --accent-foreground: 210 100% 10%;
    --muted: 210 40% 96%;
    --muted-foreground: 210 20% 45%;
    --card: 0 0% 100%;
    --card-foreground: 210 100% 10%;
    --border: 210 30% 90%;
    --input: 210 30% 90%;
    --ring: 210 85% 46%;
    --radius: 0.75rem;
  }

  .dark {
    --background: 220 50% 5%;
    --foreground: 210 40% 98%;
    --primary: 210 85% 50%;
    --primary-foreground: 0 0% 100%;
    --secondary: 220 40% 12%;
    --secondary-foreground: 210 40% 98%;
    --accent: 220 40% 15%;
    --accent-foreground: 210 40% 98%;
    --muted: 220 40% 12%;
    --muted-foreground: 210 20% 60%;
    --card: 220 50% 8%;
    --card-foreground: 210 40% 98%;
    --border: 220 30% 18%;
    --input: 220 30% 18%;
    --ring: 210 85% 50%;
  }
}
```

---

## 📦 INSTALAÇÃO DE COMPONENTES

### Passo 1: Componentes Base shadcn
```bash
npx shadcn@latest add button accordion avatar badge breadcrumb calendar checkbox combobox command dialog dropdown-menu input label pagination popover progress scroll-area select separator sheet sidebar skeleton slider switch table tabs textarea toggle toggle-group tooltip card alert alert-dialog aspect-ratio collapsible context-menu hover-card menubar navigation-menu radio-group resizable sonner
```

### Passo 2: Dependências NPM
```bash
npm install framer-motion lucide-react recharts @tanstack/react-table date-fns class-variance-authority clsx tailwind-merge
```

### Passo 3: Dependências opcionais para efeitos avançados
```bash
npm install gsap dotted-map
```

---

## 🏗️ ESTRUTURA DE PASTAS RECOMENDADA

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/
│   │   ├── cliente/
│   │   │   ├── page.tsx
│   │   │   ├── noticias/
│   │   │   ├── relatorios/
│   │   │   └── planos/
│   │   ├── colaborador/
│   │   │   ├── page.tsx
│   │   │   ├── tarefas/
│   │   │   ├── financeiro/
│   │   │   └── noticias/
│   │   └── admin/
│   │       ├── page.tsx
│   │       ├── analytics/
│   │       ├── integracoes/
│   │       └── usuarios/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                    # shadcn components
│   ├── layouts/
│   │   ├── DashboardLayout.tsx
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   ├── shared/
│   │   ├── DisplayCards.tsx
│   │   ├── FeatureGrid.tsx
│   │   ├── StatsCard.tsx
│   │   └── EmptyState.tsx
│   ├── cliente/
│   │   ├── ClienteDashboard.tsx
│   │   ├── NoticiasGrid.tsx
│   │   ├── PricingTable.tsx
│   │   └── RelatoriosSection.tsx
│   ├── colaborador/
│   │   ├── ColaboradorDashboard.tsx
│   │   ├── TaskBoard.tsx
│   │   ├── FinanceiroCards.tsx
│   │   └── NoticiasInternas.tsx
│   └── admin/
│       ├── AdminDashboard.tsx
│       ├── OrbitalTimeline.tsx
│       ├── IntegrationsOrbit.tsx
│       └── AnalyticsChart.tsx
├── lib/
│   ├── utils.ts
│   └── constants.ts
├── hooks/
│   └── use-media-query.ts
└── types/
    └── index.ts
```

---

## 🎯 PADRÕES DE UX OBRIGATÓRIOS

### Animações Padrão (usar em todo o sistema)
```tsx
// Entrada de elementos
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeOut" }
}

// Hover em cards
const cardHover = "transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-valle-primary/10"

// Hover em botões
const buttonHover = "transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"

// Stagger para listas
const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1 } }
}
```

### Loading States
- Skeleton para cards e tabelas
- Spinner para ações pontuais
- Progress bar para uploads

### Empty States
- Ilustração contextual
- Mensagem clara
- CTA para próxima ação

### Feedback
- Toast (sonner) para sucesso/erro
- Badge animado para notificações
- Confetti para conquistas

---

## 🏢 ÁREA DO CLIENTE

### Páginas:
1. **Dashboard** - Visão geral do projeto/conta
2. **Notícias** - Grid de atualizações do mercado/concorrentes  
3. **Relatórios** - Métricas e analytics
4. **Planos** - Comparativo de planos disponíveis

### Componentes Principais:
- FeatureGrid (notícias em grid)
- DisplayCards (destaques empilhados)
- PricingComparison (tabela de planos)
- StatsCards (métricas rápidas)

---

## 👥 ÁREA DO COLABORADOR

### Páginas:
1. **Dashboard** - Produtividade e tarefas
2. **Tarefas** - Board estilo Kanban
3. **Financeiro** - Contas a pagar/receber
4. **Notícias** - Comunicados internos

### Componentes Principais:
- TaskBoard (kanban)
- FinanceiroSection (slider dashboards)
- DisplayCards (notícias internas)
- CardStack (feedbacks rotativos)

---

## 👑 ÁREA DO SUPERADMIN

### Páginas:
1. **Dashboard** - Analytics completo
2. **Usuários** - Gestão de clientes/colaboradores
3. **Integrações** - APIs e conexões
4. **Configurações** - Sistema

### Componentes Principais:
- OrbitalTimeline (projetos em órbita)
- IntegrationsOrbit (semicírculo integrações)
- AnalyticsChart (gráficos completos)
- MapSection (mapa de clientes)

---

## 📱 RESPONSIVIDADE

### Breakpoints Tailwind
```
sm: 640px   - Tablet portrait
md: 768px   - Tablet landscape  
lg: 1024px  - Desktop
xl: 1280px  - Large desktop
2xl: 1536px - Extra large
```

### Adaptações Mobile
- Sidebar → Sheet (bottom ou lateral)
- Tables → Cards empilhados
- Grid 3 cols → 1 col
- Charts → Simplificados

---

## ⚡ PERFORMANCE

1. Lazy loading para componentes pesados
2. Skeleton durante carregamento
3. Debounce em inputs de busca
4. Virtualização em listas longas
5. Otimização de imagens (next/image)

---

## 🔒 SEGURANÇA (Valle AI Security Framework)

Antes de criar qualquer funcionalidade:
1. Validar inputs no frontend E backend
2. Sanitizar dados antes de exibir
3. Implementar rate limiting
4. Usar HTTPS sempre
5. Tokens JWT com refresh
6. Roles e permissões por área

---

Agora analise o código atual e implemente as melhorias começando pela área de **CLIENTES**.
