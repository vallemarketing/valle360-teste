# 📋 Como Funciona a Aprovação de Conteúdo - Valle 360

## 🎯 Fluxo Completo (Do início ao fim)

### 1️⃣ **Criar Conteúdo com IA**
📍 Local: `/admin/social-media/command-center`

- Selecione um cliente
- Escolha o tipo de demanda (Post Social, Campanha, etc.)
- Preencha tópico e objetivo
- Clique em "Gerar com IA"
- O sistema cria o conteúdo completo (copy, hashtags, CTA, prompt visual)

**O que acontece nos bastidores:**
- É criado um registro na tabela `ai_executive_action_drafts` com status = `'draft'`
- Fica aguardando aprovação

---

### 2️⃣ **Revisar e Aprovar Conteúdo**
📍 Local: `/admin/social-media/approvals`

**Como Acessar:**
- Menu lateral: **Social → Aprovações**
- Ou card no Command Center: **"Aprovações"**

**O que você pode fazer:**
- ✅ Ver lista de todos os conteúdos pendentes
- 🔍 Filtrar por status (Pendente, Aprovado, Rejeitado)
- 🔎 Buscar por texto ou cliente
- 👁️ Pré-visualizar como ficará o post
- ✏️ Editar antes de aprovar:
  - Copy (texto do post)
  - Hashtags
  - CTA (Call to Action)
  - Prompt visual (para geração de imagem)
  - Redes sociais selecionadas
- ✅ Aprovar → Cria tarefa no Kanban
- ❌ Rejeitar → Cancela com motivo

---

### 3️⃣ **O que Acontece ao Aprovar** ✨

Quando você clica em **"Aprovar e Publicar"**:

#### A. No Banco de Dados:
1. Draft muda status de `'draft'` → `'executed'`
2. Registra data e hora da aprovação
3. **Cria automaticamente uma TAREFA no Kanban:**
   - Tabela: `kanban_tasks`
   - Título: O título do post
   - Descrição: O copy completo
   - Metadados: Todas as informações (hashtags, CTA, redes, etc.)
   - Status: `'todo'` ou `'in_progress'`
   - Board: Geralmente vai para o board principal ou de Social Media
   - Coluna: "A Fazer", "Backlog" ou "Demanda" (primeira coluna disponível)

#### B. Na Tela:
- **Toast de sucesso** aparece com:
  - Mensagem: "✅ Conteúdo aprovado! Tarefa criada no Kanban."
  - **Botão**: "Ver no Kanban →" (leva direto para a tarefa criada)
  - Duração: 10 segundos

---

### 4️⃣ **Visualizar Tarefa Criada no Kanban**
📍 Locais possíveis:

#### **Opção A: Kanban Geral** (Recomendado) 🎯
- Acesse: `/admin/kanban-app`
- Menu: **"Kanban Geral"**
- **O que você verá:**
  - Cards com todas as tarefas organizadas por colunas
  - Pode arrastar entre colunas (A Fazer → Em Progresso → Revisão → Concluído)
  - Clicar no card para ver detalhes completos

#### **Opção B: Meu Kanban** (Admin pessoal)
- Acesse: `/admin/meu-kanban`
- Ver apenas suas tarefas atribuídas

#### **Opção C: Para Colaboradores**
- Acesse: `/colaborador/kanban`
- Colaboradores veem apenas tarefas da sua área

---

## 🔍 **Por que a Tarefa Pode Não Aparecer?**

Se você não está vendo a tarefa no Kanban, pode ser:

### ❌ **Problema 1: Board Diferente**
- A tarefa foi criada em um board específico
- Você está visualizando outro board
- **Solução:** No topo do Kanban, selecione "Todos os Boards" ou o board de Social Media

### ❌ **Problema 2: Filtros Ativos**
- Pode ter filtros aplicados (por pessoa, tag, prioridade)
- **Solução:** Limpe os filtros e busque novamente

### ❌ **Problema 3: Página Não Atualizada**
- A página estava aberta antes da aprovação
- **Solução:** Pressione F5 ou clique no botão "Atualizar" (↻)

### ❌ **Problema 4: Nenhum Board Cadastrado**
- Se não existe nenhum board/coluna no sistema
- **Solução:** Criar um board básico de Social Media primeiro

---

## 📊 **Estrutura das Colunas Típicas do Kanban**

```
┌─────────────┬──────────────┬───────────┬────────────────┬────────────┐
│  Lead/      │  Qualificação│ Proposta  │  Negociação    │ Fechamento │
│  Demanda    │              │           │                │            │
│             │              │           │                │            │
│  (Novos)    │ (Em análise) │(Aguardando│ (Em conversa)  │ (Concluído)│
└─────────────┴──────────────┴───────────┴────────────────┴────────────┘
```

Ou para Social Media:

```
┌─────────────┬──────────────┬───────────┬────────────────┬────────────┐
│  A Fazer    │  Em Progresso│  Revisão  │  Aprovação     │ Publicado  │
│             │              │           │  Cliente       │            │
│  (Backlog)  │ (Produzindo) │(Revisando)│ (Aguardando)   │ (Feito)    │
└─────────────┴──────────────┴───────────┴────────────────┴────────────┘
```

---

## 🎬 **Próximos Passos Após Aprovação**

1. **Equipe vê a tarefa no Kanban**
2. **Move entre colunas conforme progresso:**
   - A Fazer → Em Progresso (começou a trabalhar)
   - Em Progresso → Revisão (terminou, precisa revisar)
   - Revisão → Aprovação Cliente (enviou para cliente aprovar)
   - Aprovação Cliente → Publicado (cliente aprovou e publicou)
3. **Adiciona comentários, anexos, checklists**
4. **Marca como concluída** quando publicar nas redes

---

## 💡 **Dicas Importantes**

✅ **Sempre use o botão "Ver no Kanban →"** que aparece no toast após aprovar  
✅ **Atualize a página do Kanban** (F5) antes de procurar a tarefa  
✅ **Verifique se está no board correto** (dropdown no topo)  
✅ **Use a busca** se tiver muitas tarefas (Ctrl+F ou campo de busca)  
✅ **Olhe em todas as colunas** - pode ter sido movida automaticamente  

---

## 🔧 **Troubleshooting Rápido**

| Problema | Solução |
|----------|---------|
| Não vejo a tarefa | 1. Atualize (F5)<br>2. Mude para "Todos os boards"<br>3. Limpe filtros |
| Tarefa em branco | Abra o card e veja os detalhes/metadados |
| Não consigo aprovar | Verifique se tem permissão de admin |
| Erro ao aprovar | Verifique se existe pelo menos 1 board com colunas cadastradas |
| Toast não aparece | O conteúdo foi aprovado mesmo assim, vá para `/admin/kanban-app` |

---

## 📞 **Precisa de Ajuda?**

Se mesmo seguindo este guia a tarefa não aparecer:

1. Verifique o console do navegador (F12) por erros
2. Confirme que o board existe: `/admin/kanban-app`
3. Veja os logs da API no terminal
4. Entre em contato com o suporte técnico

---

**Última atualização:** 23/01/2026  
**Versão:** 1.0
