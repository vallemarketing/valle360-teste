# 🎨 ESTUDO DE CORES - VALLE 360
## Paleta Harmônica Baseada nas Logos

---

## 📊 ANÁLISE DAS CORES DA LOGO

### Cores Primárias Extraídas:
```
Azul Escuro Principal:  #0f1b35  (Fundo, headers principais)
Azul Médio:            #1a2d5a  (Gradientes, transições)
Azul Claro Vibrante:   #4370d1  (CTAs, destaques, links)
Azul Claro Suave:      #6b8dd6  (Hover states, bordas ativas)
```

---

## 🎨 PALETA COMPLETA HARMONIZADA

### 1. CORES PRINCIPAIS (da Logo)
```css
/* Azul Escuro - Background escuro, headers */
--primary-dark: #0f1b35;
--primary-dark-hover: #1a2642;

/* Azul Médio - Transições, gradientes */
--primary-medium: #2d4373;
--primary-medium-hover: #3a5491;

/* Azul Claro - CTAs, botões, links */
--primary-light: #4370d1;
--primary-light-hover: #5680e0;

/* Azul Extra Claro - Backgrounds suaves */
--primary-extra-light: #e8eef9;
--primary-ultralight: #f5f8fd;
```

### 2. CORES DE SUPORTE (Complementares Harmônicas)

#### Sucesso (Verde - Complementar do Azul)
```css
--success-dark: #0e7c3c;
--success-main: #10b981;
--success-light: #34d399;
--success-bg: #d1fae5;
--success-text: #065f46;
```

#### Alerta (Amarelo/Âmbar - Análogo)
```css
--warning-dark: #d97706;
--warning-main: #f59e0b;
--warning-light: #fbbf24;
--warning-bg: #fef3c7;
--warning-text: #92400e;
```

#### Erro (Vermelho - Complementar Triádico)
```css
--error-dark: #b91c1c;
--error-main: #ef4444;
--error-light: #f87171;
--error-bg: #fee2e2;
--error-text: #7f1d1d;
```

#### Info (Ciano - Análogo ao Azul)
```css
--info-dark: #0e7490;
--info-main: #06b6d4;
--info-light: #22d3ee;
--info-bg: #cffafe;
--info-text: #164e63;
```

#### Roxo (Análogo ao Azul - IA/Premium)
```css
--purple-dark: #6b21a8;
--purple-main: #a855f7;
--purple-light: #c084fc;
--purple-bg: #f3e8ff;
--purple-text: #581c87;
```

### 3. CORES NEUTRAS (Baseadas no Azul Escuro)
```css
/* Backgrounds */
--bg-primary: #ffffff;
--bg-secondary: #f8fafc;
--bg-tertiary: #f1f5f9;

/* Borders */
--border-light: #e2e8f0;
--border-medium: #cbd5e1;
--border-dark: #94a3b8;

/* Textos */
--text-primary: #0f172a;
--text-secondary: #475569;
--text-tertiary: #64748b;
--text-disabled: #94a3b8;
--text-inverse: #ffffff;
```

---

## 🎯 APLICAÇÃO POR ÁREA/FUNCIONALIDADE

### DASHBOARD (Visão Geral)
```css
Background: #f8fafc (neutro claro)
Header: gradient(#0f1b35 → #2d4373)
Cards: #ffffff com border #e2e8f0
CTAs: #4370d1
Hover: #5680e0
```

### GAMIFICAÇÃO
```css
Background: #f8fafc
Header: gradient(#f59e0b → #ef4444 → #dc2626)
Level Badge: #fbbf24
Points: #0f1b35
Conquistas Ativas: #10b981
Conquistas Bloqueadas: #94a3b8
Progress Bars: #4370d1
```

### FIDELIDADE
```css
Background: #f8fafc
Header: gradient(#10b981 → #059669)
Cupom Card: gradient(#0f1b35 → #4370d1)
Stats Cards: #ffffff
Comissão Paga: #10b981
Comissão Pendente: #f59e0b
```

### NOTIFICAÇÕES
```css
Background: #f8fafc
Não Lida: gradient(#e8eef9 → #f5f8fd) com border #4370d1
Lida: #ffffff com opacity 70%
Mensagens Val: #a855f7 (roxo - IA)
Reconhecimentos: #fbbf24 (dourado)
Lembretes: #ef4444 (vermelho)
```

### METAS
```css
Background: #f8fafc
Plano Carreira: gradient(#a855f7 → #6b21a8)
Curto Prazo: #10b981
Médio Prazo: #f59e0b
Longo Prazo: #4370d1
Progress Completo: #10b981
Progress Médio: #fbbf24
Progress Baixo: #ef4444
```

### DESEMPENHO
```css
Background: #f8fafc
Tendência Alta: #10b981 + bg-green-50
Tendência Baixa: #ef4444 + bg-red-50
Tendência Estável: #64748b + bg-gray-50
Score Produtividade: #4370d1
Score Qualidade: #10b981
Score Colaboração: #a855f7
Score Bem-Estar: #f59e0b
```

### MENSAGENS (Chat)
```css
Background: #ffffff
Sidebar: #f8fafc
Header: #0f1b35
Minhas Mensagens: gradient(#4370d1 → #5680e0) + text white
Mensagens Recebidas: #f1f5f9 + text #0f172a
Online: #10b981
Ausente: #f59e0b
Offline: #94a3b8
```

### VAL (IA)
```css
Background: gradient radial (#a855f7/5 → #4370d1/5)
Header Text: #0f172a
Resposta Val: gradient(#e8eef9 → #f3e8ff) + border-left #a855f7
Sugestões: #4370d1
Botão Enviar: #4370d1 → hover #a855f7
```

---

## 🎭 GRADIENTES HARMÔNICOS

### Gradientes Principais
```css
/* Valle Primary */
--gradient-primary: linear-gradient(135deg, #0f1b35 0%, #4370d1 100%);

/* Valle Reverse */
--gradient-primary-reverse: linear-gradient(135deg, #4370d1 0%, #0f1b35 100%);

/* Valle Subtle */
--gradient-subtle: linear-gradient(135deg, #e8eef9 0%, #f5f8fd 100%);

/* Success */
--gradient-success: linear-gradient(135deg, #10b981 0%, #059669 100%);

/* Warning */
--gradient-warning: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);

/* Error */
--gradient-error: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);

/* Premium (IA) */
--gradient-premium: linear-gradient(135deg, #a855f7 0%, #6b21a8 100%);

/* Gamification Fire */
--gradient-fire: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #ef4444 100%);
```

---

## 🌈 SISTEMA DE CORES POR TIPO DE COMPONENTE

### Botões
```css
/* Primário */
background: #4370d1;
hover: #5680e0;
active: #2d4373;
disabled: #cbd5e1;

/* Secundário */
border: #4370d1;
color: #4370d1;
hover-bg: #e8eef9;

/* Sucesso */
background: #10b981;
hover: #059669;

/* Perigo */
background: #ef4444;
hover: #dc2626;
```

### Cards
```css
background: #ffffff;
border: #e2e8f0;
hover-border: #cbd5e1;
shadow: 0 1px 3px rgba(15, 27, 53, 0.08);
hover-shadow: 0 4px 12px rgba(15, 27, 53, 0.12);
```

### Badges
```css
/* Info */
bg: #e8eef9;
text: #2d4373;

/* Success */
bg: #d1fae5;
text: #065f46;

/* Warning */
bg: #fef3c7;
text: #92400e;

/* Error */
bg: #fee2e2;
text: #7f1d1d;

/* Premium */
bg: #f3e8ff;
text: #581c87;
```

### Progress Bars
```css
/* Container */
background: #e2e8f0;
border-radius: 9999px;

/* Fill - baseado no valor */
0-25%: #ef4444 (vermelho)
26-50%: #f59e0b (amarelo)
51-75%: #4370d1 (azul)
76-100%: #10b981 (verde)
```

---

## 💡 GUIA DE USO

### Quando Usar Cada Cor:

**Azul Escuro (#0f1b35)**
- Headers principais
- Navegação
- Textos importantes
- Footers

**Azul Claro (#4370d1)**
- Botões primários
- Links
- CTAs
- Ícones ativos
- Destaques

**Verde (#10b981)**
- Sucessos
- Aprovações
- Métricas positivas
- Indicadores de progresso alto

**Amarelo (#f59e0b)**
- Alertas
- Pendências
- Atenção necessária
- Indicadores médios

**Vermelho (#ef4444)**
- Erros
- Cancelamentos
- Crítico/Urgente
- Indicadores baixos

**Roxo (#a855f7)**
- IA/Automação
- Premium/Especial
- Conquistas raras
- Funcionalidades inteligentes

---

## 🎨 EXEMPLOS VISUAIS DE COMBINAÇÕES

### Combinação 1: Header de Seção
```
Background: gradient(#0f1b35 → #2d4373)
Texto: #ffffff
Ícone: #4370d1
Botão: #ffffff com background #4370d1/20
```

### Combinação 2: Card de Métrica Positiva
```
Background: #ffffff
Border: #10b981
Ícone Background: #d1fae5
Ícone: #10b981
Valor: #0f172a
Label: #64748b
```

### Combinação 3: Notificação Importante
```
Background: gradient(#e8eef9 → #f5f8fd)
Border Left: 4px solid #4370d1
Ícone: #4370d1
Título: #0f172a
Texto: #475569
```

### Combinação 4: Resposta da IA
```
Background: gradient(#f3e8ff → #faf5ff)
Border Left: 4px solid #a855f7
Ícone Val: #a855f7
Texto: #0f172a
Botões: #4370d1
```

---

## 🔄 ACESSIBILIDADE

### Contraste Mínimo (WCAG AA)
```
#0f1b35 em #ffffff: 15.8:1 ✅ (Excelente)
#4370d1 em #ffffff: 5.2:1 ✅ (Bom)
#64748b em #ffffff: 4.6:1 ✅ (Adequado)
#10b981 em #ffffff: 2.8:1 ⚠️ (Usar para ícones/badges, não texto pequeno)
```

### Recomendações:
- Textos pequenos (<14px): usar #0f172a ou #475569
- Textos médios (14-18px): pode usar #64748b
- Badges/Labels: cores de suporte OK
- Ícones: todas as cores OK

---

## 📦 IMPLEMENTAÇÃO (CSS Variables)

```css
:root {
  /* Primárias */
  --primary-50: #f5f8fd;
  --primary-100: #e8eef9;
  --primary-200: #d4dff3;
  --primary-300: #b3c5e8;
  --primary-400: #8da8dc;
  --primary-500: #6b8dd6;
  --primary-600: #4370d1;
  --primary-700: #2d4373;
  --primary-800: #1a2d5a;
  --primary-900: #0f1b35;
  
  /* Sucesso */
  --success-50: #d1fae5;
  --success-500: #10b981;
  --success-900: #065f46;
  
  /* Alerta */
  --warning-50: #fef3c7;
  --warning-500: #f59e0b;
  --warning-900: #92400e;
  
  /* Erro */
  --error-50: #fee2e2;
  --error-500: #ef4444;
  --error-900: #7f1d1d;
  
  /* Premium */
  --purple-50: #f3e8ff;
  --purple-500: #a855f7;
  --purple-900: #581c87;
}
```

---

**Esta paleta garante:**
✅ Harmonia visual com a marca
✅ Consistência em todas as páginas
✅ Acessibilidade (contraste adequado)
✅ Hierarquia clara de informações
✅ Identidade única da Valle 360











