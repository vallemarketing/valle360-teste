# 🔍 DIAGNÓSTICO: Tarefa Não Aparece no Kanban

## Problema Reportado
Após aprovar um conteúdo na página `/admin/social-media/approvals`, a tarefa não aparece no Kanban em `/admin/kanban-app`.

---

## ✅ Checklist de Verificação

### 1. **Verificar se a tarefa foi criada no banco**

Execute o script [`VERIFICAR_TAREFAS_KANBAN.sql`](VERIFICAR_TAREFAS_KANBAN.sql) no SQL Editor do Supabase.

**O que procurar:**
- ✅ Deve aparecer uma linha na tabela `kanban_tasks` com:
  - `reference_links->>'source' = 'ai_draft'`
  - `title` = título do post aprovado
  - `created_at` = horário recente

**Se NÃO aparecer:**
- ❌ O draft não foi executado corretamente
- Verificar erros no console do navegador (F12)
- Verificar logs do servidor Next.js

---

### 2. **Verificar se existe um Board cadastrado**

```sql
SELECT id, name, area_key FROM kanban_boards;
```

**Problema comum:**
- Se retornar **0 linhas** = Não existe nenhum board!
- **Solução:** Criar um board primeiro

**Como criar um board:**

```sql
-- Criar board de Social Media
INSERT INTO kanban_boards (name, area_key, is_active)
VALUES ('Social Media', 'social_media', true)
RETURNING id;

-- Depois criar colunas básicas (usando o ID retornado acima)
INSERT INTO kanban_columns (board_id, name, stage_key, position, color)
VALUES 
  ('SEU_BOARD_ID_AQUI', 'A Fazer', 'demanda', 0, '#F59E0B'),
  ('SEU_BOARD_ID_AQUI', 'Em Progresso', 'em_andamento', 1, '#3B82F6'),
  ('SEU_BOARD_ID_AQUI', 'Revisão', 'revisao', 2, '#8B5CF6'),
  ('SEU_BOARD_ID_AQUI', 'Aprovação', 'aprovacao', 3, '#EC4899'),
  ('SEU_BOARD_ID_AQUI', 'Concluído', 'finalizado', 4, '#10B981');
```

---

### 3. **Verificar se está no board correto**

No Kanban, verifique:
- 🔍 **Dropdown no topo** (seletor de board)
- Pode estar selecionado outro board que não é o que a tarefa foi criada

**Solução:**
- Selecione "Todos os boards" ou
- Selecione o board específico onde a tarefa foi criada

---

### 4. **Verificar filtros ativos**

No Kanban, verifique se há:
- 🎯 Filtro por pessoa (assigned_to)
- 🏷️ Filtro por tags
- ⚡ Filtro por prioridade
- 📅 Filtro por data

**Solução:**
- Clicar no botão "Filtros" (ícone de funil)
- Limpar todos os filtros
- Atualizar a página (F5)

---

### 5. **Verificar se a página está atualizada**

- A página do Kanban estava aberta **antes** da aprovação?
- **Solução:** Pressione **F5** para atualizar

---

## 🐛 Debug Técnico

### Verificar Execução do Draft

```sql
-- Ver resultado da execução
SELECT 
    id,
    status,
    executed_at,
    execution_result
FROM ai_executive_action_drafts
WHERE id = 'SEU_DRAFT_ID_AQUI';
```

**Campos importantes:**
- `status` deve ser `'executed'`
- `execution_result->>'ok'` deve ser `true`
- `execution_result->>'entity_id'` = ID da tarefa criada
- `execution_result->>'board_id'` = ID do board onde foi criada

### Verificar se a tarefa existe

```sql
-- Buscar pela tarefa criada
SELECT *
FROM kanban_tasks
WHERE id = 'ENTITY_ID_DO_EXECUTION_RESULT';
```

---

## 🔧 Soluções Comuns

### Problema: Nenhum board existe
```sql
-- Criar estrutura básica
INSERT INTO kanban_boards (name, area_key, is_active)
VALUES ('Board Principal', 'geral', true);

-- Pegar o ID do board criado e criar colunas
-- (substituir UUID_DO_BOARD pelo ID retornado acima)
INSERT INTO kanban_columns (board_id, name, stage_key, position, color)
SELECT 
  'UUID_DO_BOARD'::uuid,
  unnest(ARRAY['Backlog', 'A Fazer', 'Em Progresso', 'Concluído']),
  unnest(ARRAY['demanda', 'a_fazer', 'em_andamento', 'finalizado']),
  unnest(ARRAY[0, 1, 2, 3]),
  unnest(ARRAY['#6B7280', '#F59E0B', '#3B82F6', '#10B981']);
```

### Problema: Tarefa criada mas em board diferente

1. Verificar qual board foi usado:
```sql
SELECT board_id, column_id 
FROM kanban_tasks 
WHERE reference_links->>'source' = 'ai_draft'
ORDER BY created_at DESC 
LIMIT 1;
```

2. No Kanban, selecionar esse board específico no dropdown

### Problema: Permissões RLS (Row Level Security)

Verificar se as políticas RLS permitem ver a tarefa:

```sql
-- Ver políticas da tabela
SELECT * FROM pg_policies WHERE tablename = 'kanban_tasks';
```

Se necessário, criar política temporária para admin:

```sql
-- Permitir admin ver todas as tarefas
CREATE POLICY "Admin pode ver todas as tarefas kanban"
ON kanban_tasks FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);
```

---

## 📝 Teste Manual Completo

1. **Aprovar conteúdo**
   - Ir para `/admin/social-media/approvals`
   - Clicar em um draft pendente
   - Aprovar

2. **Verificar toast**
   - Deve aparecer: "✅ Conteúdo aprovado! Tarefa criada no Kanban"
   - Clicar no botão "Ver no Kanban →"

3. **Abrir Kanban manualmente**
   - Ir para `/admin/kanban-app`
   - Verificar dropdown de boards no topo
   - Selecionar "Todos os boards"
   - Procurar pela tarefa com o título do post

4. **Se ainda não aparecer:**
   - Abrir console do navegador (F12)
   - Ir para aba "Network"
   - Atualizar página
   - Ver se há erro na requisição das tarefas

---

## 🆘 Última Solução: Verificar Diretamente

Se nada funcionar, verifique diretamente no Supabase:

1. **Abrir Supabase Dashboard**
2. **Ir para Table Editor**
3. **Abrir tabela `kanban_tasks`**
4. **Filtrar por:** `created_at` DESC
5. **Ver se a tarefa está lá**

Se estiver lá mas não aparecer na interface:
- ❌ Problema de RLS (permissões)
- ❌ Problema de filtro na query do frontend
- ❌ Bug no código do Kanban

Se NÃO estiver lá:
- ❌ A aprovação não criou a tarefa
- ❌ Erro no `executeActionDraft`
- ❌ Verificar logs do servidor

---

**Última atualização:** 23/01/2026
