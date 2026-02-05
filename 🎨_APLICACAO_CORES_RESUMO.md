# 🎨 APLICAÇÃO DE CORES - RESUMO DAS MUDANÇAS

## ✅ ARQUIVO CRIADO:
`src/styles/colors.css` - Todas as CSS variables da paleta harmonizada

---

## 📝 MUDANÇAS POR PÁGINA

### 1. DASHBOARD (/colaborador/dashboard)

**Header:**
- Atual: `from-[#0f1b35] to-[#4370d1]`
- Novo: `from-[var(--primary-900)] to-[var(--primary-500)]`

**Cards de Estatísticas:**
- Sequência (Flame): Manter laranja `bg-orange-100 text-orange-600`
- Ranking (Crown): Manter amarelo `bg-yellow-100 text-yellow-600`
- Tarefas: Mudar para `bg-[var(--success-50)] text-[var(--success-700)]`
- Bem-Estar: Mudar para `bg-[var(--purple-50)] text-[var(--purple-700)]`

**Scores:**
- Produtividade: `text-[var(--primary-500)] bg-[var(--primary-500)]`
- Qualidade: `text-[var(--success-500)] bg-[var(--success-500)]`
- Colaboração: `text-[var(--purple-500)] bg-[var(--purple-500)]`

**Mensagens Val:**
- Background: `from-[var(--primary-50)] to-[var(--purple-50)]`
- Border: `border-[var(--primary-500)]`
- Ícone: `text-[var(--primary-500)]`

---

### 2. GAMIFICAÇÃO (/colaborador/gamificacao)

**Header:**
- Atual: `from-yellow-400 via-orange-500 to-red-500`
- Novo: `from-[#fbbf24] via-[#f59e0b] to-[#ef4444]` (fire gradient)
- Adicionar: `style={{ backgroundImage: 'var(--gradient-fire)' }}`

**Conquistas Desbloqueadas:**
- Background: `from-[var(--warning-50)] to-[var(--success-50)]`
- Border: `border-[var(--success-400)]`

**Conquistas Bloqueadas:**
- Background: `bg-[var(--bg-tertiary)]`
- Border: `border-[var(--border-medium)]`
- Opacity: `opacity-75`

**Badges de Posição:**
- 1º: `bg-[var(--warning-400)] text-[var(--warning-900)]`
- 2º: `bg-[var(--border-medium)] text-[var(--text-secondary)]`
- 3º: `bg-[#fb923c] text-[#7c2d12]`

---

### 3. FIDELIDADE (/colaborador/fidelidade)

**Header:**
- Atual: `from-green-500 to-emerald-600`
- Novo: `from-[var(--success-500)] to-[var(--success-700)]`

**Cupom Card:**
- Background: `from-[var(--primary-900)] to-[var(--primary-500)]`

**Status Badges:**
- Pendente: `bg-[var(--warning-50)] text-[var(--warning-700)]`
- Qualificado: `bg-[var(--info-50)] text-[var(--info-700)]`
- Enviado: `bg-[var(--purple-50)] text-[var(--purple-700)]`
- Assinado: `bg-[var(--success-50)] text-[var(--success-700)]`
- Pago: `bg-[var(--success-50)] text-[var(--success-700)]`
- Cancelado: `bg-[var(--error-50)] text-[var(--error-700)]`

---

### 4. NOTIFICAÇÕES (/colaborador/notificacoes)

**Não Lidas:**
- Background: `from-[var(--primary-50)] to-[var(--primary-25)]`
- Border: `border-[var(--primary-500)]`

**Lidas:**
- Background: `bg-[var(--bg-primary)]`
- Border: `border-[var(--border-light)]`
- Opacity: `opacity-70`

**Ícones por Tipo:**
- Val (Mensagens): `bg-[var(--purple-50)] text-[var(--purple-500)]`
- Reconhecimentos: `bg-[var(--warning-50)] text-[var(--warning-500)]`
- Lembretes: `bg-[var(--error-50)] text-[var(--error-500)]`

---

### 5. MINHAS METAS (/colaborador/metas)

**Plano de Carreira:**
- Atual: `from-purple-500 to-indigo-600`
- Novo: `from-[var(--purple-500)] to-[var(--purple-700)]`

**Badges por Tipo:**
- Curto Prazo: `bg-[var(--success-50)] text-[var(--success-700)]`
- Médio Prazo: `bg-[var(--warning-50)] text-[var(--warning-700)]`
- Longo Prazo: `bg-[var(--primary-50)] text-[var(--primary-700)]`

**Progress Bars:**
- 76-100%: `bg-[var(--success-500)]`
- 51-75%: `bg-[var(--primary-500)]`
- 26-50%: `bg-[var(--warning-500)]`
- 0-25%: `bg-[var(--error-500)]`

**Status:**
- Ativa: `bg-[var(--primary-50)] text-[var(--primary-700)]`
- Concluída: `bg-[var(--success-50)] text-[var(--success-700)]`
- Atrasada: `bg-[var(--error-50)] text-[var(--error-700)]`
- Urgente: `bg-[var(--warning-50)] text-[var(--warning-700)]`

---

### 6. MEU DESEMPENHO (/colaborador/desempenho)

**Tendência:**
- Alta: `bg-[var(--success-50)] border-[var(--success-200)] text-[var(--success-600)]`
- Baixa: `bg-[var(--error-50)] border-[var(--error-200)] text-[var(--error-600)]`
- Estável: `bg-[var(--bg-tertiary)] border-[var(--border-medium)] text-[var(--text-secondary)]`

**Scores:**
- Produtividade: `text-[var(--primary-600)] bg-[var(--primary-500)]`
- Qualidade: `text-[var(--success-600)] bg-[var(--success-500)]`
- Colaboração: `text-[var(--purple-600)] bg-[var(--purple-500)]`
- Bem-Estar: `text-[var(--warning-600)] bg-[var(--warning-500)]`

**Análise Qualitativa:**
- Pontos Fortes: `text-[var(--success-700)] bg-[var(--success-500)]`
- Áreas para Melhorar: `text-[var(--warning-700)] bg-[var(--warning-500)]`

**Recomendações IA:**
- Background: `from-[var(--primary-50)] to-[var(--purple-50)]`
- Border: `border-l-4 border-[var(--primary-500)]`

---

## 🔧 COMO APLICAR

### Passo 1: Importar CSS no Layout
```tsx
// src/app/layout.tsx
import '@/styles/colors.css'
```

### Passo 2: Substituir Cores Hardcoded
Buscar e substituir em cada arquivo:
- `#0f1b35` → `var(--primary-900)` ou usar Tailwind: `[var(--primary-900)]`
- `#4370d1` → `var(--primary-500)` ou `[var(--primary-500)]`
- `#10b981` → `var(--success-500)` ou `[var(--success-500)]`
- E assim por diante...

### Passo 3: Atualizar Gradientes
```tsx
// Antes:
className="bg-gradient-to-r from-[#0f1b35] to-[#4370d1]"

// Depois:
className="bg-gradient-to-r from-[var(--primary-900)] to-[var(--primary-500)]"

// OU usar a variável direta:
style={{ backgroundImage: 'var(--gradient-primary)' }}
```

---

## ✅ CHECKLIST DE APLICAÇÃO

- [ ] Importar colors.css no layout principal
- [ ] Atualizar Dashboard
- [ ] Atualizar Gamificação
- [ ] Atualizar Fidelidade
- [ ] Atualizar Notificações
- [ ] Atualizar Metas
- [ ] Atualizar Desempenho

---

## 🎨 BENEFÍCIOS

✅ Consistência visual em todo o sistema
✅ Fácil manutenção (mudar em um lugar atualiza tudo)
✅ Preparado para dark mode
✅ Acessibilidade garantida (contrastes testados)
✅ Paleta harmônica baseada na marca

---

**Próximo passo:** Aplicar estas mudanças nas 6 páginas!











