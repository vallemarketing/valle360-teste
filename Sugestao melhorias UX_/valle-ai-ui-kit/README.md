# 🚀 Valle AI - UI Kit para Sistema de Agência de Marketing

Kit completo de componentes React/Next.js para o sistema de agência de marketing Valle AI.

## 📁 Estrutura de Arquivos

```
valle-ai-ui-kit/
├── components/
│   ├── cliente/
│   │   ├── ClienteDashboard.tsx    # Dashboard completo do cliente
│   │   ├── DisplayCards.tsx        # Cards de notícias empilhados
│   │   ├── FeatureGrid.tsx         # Grid de notícias do mercado
│   │   ├── PricingTable.tsx        # Tabela comparativa de planos
│   │   └── StatsCards.tsx          # Cards de métricas
│   ├── colaborador/
│   │   ├── FinanceiroSection.tsx   # Contas a pagar/receber
│   │   └── NoticiasInternas.tsx    # Comunicados + CardStack
│   └── admin/
│       ├── OrbitalTimeline.tsx     # Visão orbital de projetos
│       └── IntegrationsOrbit.tsx   # Semicírculo de integrações
├── config/
│   ├── tailwind.config.ts          # Configuração Tailwind com cores Valle AI
│   └── globals.css                 # Variáveis CSS e estilos globais
└── valle-ai-marketing-system-prompt.md  # Prompt master para Cursor
```

## 🛠️ Instalação

### 1. Instalar dependências

```bash
# Dependências principais
npm install framer-motion lucide-react recharts @tanstack/react-table date-fns class-variance-authority clsx tailwind-merge tailwindcss-animate

# Componentes shadcn/ui (rode cada comando)
npx shadcn@latest add button card badge avatar tabs progress scroll-area separator sheet skeleton slider spinner switch table tooltip dialog dropdown-menu input label pagination popover select
```

### 2. Configurar Tailwind

Substitua seu `tailwind.config.ts` pelo arquivo em `config/tailwind.config.ts`

### 3. Configurar CSS

Substitua ou merge seu `globals.css` com o arquivo em `config/globals.css`

### 4. Copiar componentes

Copie a pasta `components/` para `src/components/` do seu projeto

### 5. Ajustar imports

Se necessário, ajuste os imports de `@/lib/utils` e `@/components/ui/` conforme sua estrutura

## 🎨 Cores Valle AI

```css
--valle-navy: #001533      /* Azul escuro */
--valle-primary: #1672d6   /* Azul vibrante */
--valle-white: #ffffff     /* Branco */
```

## 📱 Componentes por Área

### Área Cliente
- **ClienteDashboard**: Dashboard completo com stats, notícias e quick links
- **DisplayCards**: Cards empilhados com efeito skew para destaques
- **FeatureGrid**: Grid de notícias com categorias (mercado, concorrente, tendência)
- **PricingTable**: Tabela de preços com toggle mensal/anual
- **StatsCards**: Cards de métricas com variação percentual

### Área Colaborador
- **FinanceiroSection**: Dashboard financeiro com contas a pagar/receber
- **NoticiasInternas**: Sistema de comunicados com CardStack animado

### Área SuperAdmin
- **OrbitalTimeline**: Visualização orbital de projetos com conexões
- **IntegrationsOrbit**: Semicírculo de integrações com status

## 🎯 Uso no Cursor

1. Abra o chat do Cursor (Ctrl+L ou Cmd+L)
2. Cole o conteúdo de `valle-ai-marketing-system-prompt.md`
3. Descreva o que quer criar/modificar
4. O Cursor seguirá os padrões definidos automaticamente

## ⚡ Performance

Todos os componentes incluem:
- Lazy loading com Framer Motion
- Animações otimizadas (60fps)
- Skeleton states
- Responsive design (mobile-first)

## 🔒 Segurança

Lembre-se de aplicar o Valle AI Security Framework em todas as implementações.

---

Desenvolvido com 💙 para Valle AI
