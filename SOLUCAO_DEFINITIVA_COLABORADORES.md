# 🎯 SOLUÇÃO DEFINITIVA - COLABORADORES NÃO APARECEM

## 🔥 PROBLEMA

Você cria colaboradores mas eles **NÃO aparecem** na lista "Equipe" para iniciar conversas.

## ✅ SOLUÇÃO EM 3 PASSOS

### PASSO 1: TESTE RÁPIDO NO SUPABASE

1. Abra Supabase Dashboard → SQL Editor
2. Cole o conteúdo de `supabase/teste_query_user_profiles.sql`
3. Execute
4. **Anote quantas linhas retornou**

**O QUE ESPERAR:**
- ✅ Se retornar 1+ linhas com categoria "👨‍💼 EQUIPE" → ÓTIMO, dados existem
- ⚠️ Se retornar 0 linhas → Nenhum user_profile ativo (PROBLEMA NO BANCO)
- ⚠️ Se retornar linhas mas todas "👤 CLIENTE" → Não tem colaboradores cadastrados
- ⚠️ Se retornar linhas com "⚠️ SEM TIPO" → user_type está NULL (PROBLEMA)

### PASSO 2: EXECUTE AS FUNÇÕES RPC

1. No mesmo SQL Editor do Supabase
2. Cole o conteúdo de `supabase/criar_funcoes_rpc_presenca.sql`
3. Execute
4. Deveria retornar "Success" sem erros

Isso vai criar as funções `update_user_presence` e `upsert_typing_indicator` que estão faltando.

### PASSO 3: RECARREGUE E TESTE COM LOGS

1. **Salve todos os arquivos no editor**
2. **Reinicie o servidor de desenvolvimento**:
   - Pressione Ctrl+C no terminal
   - Execute `npm run dev` novamente
3. **No navegador**:
   - Limpe o cache: Ctrl+Shift+R (ou Cmd+Shift+R no Mac)
   - Abra o Console (F12)
   - Vá em "Mensagens" → aba "Equipe"
   - Clique no botão "Nova Conversa"

4. **Observe os logs no console**:
   - Procure por `🔍 ========== INICIANDO BUSCA DE USUÁRIOS ==========`
   - Veja quantos user_profiles foram retornados
   - Veja se algum passou no filtro "team"
   - Veja a "LISTA FINAL"

5. **ME ENVIE UM PRINT DO CONSOLE COMPLETO**

## 🩹 CORREÇÕES RÁPIDAS (SE NECESSÁRIO)

### Se o PASSO 1 retornou 0 linhas:

Execute este SQL para criar user_profiles para todos os colaboradores:

```sql
INSERT INTO user_profiles (
  user_id, 
  full_name, 
  email, 
  user_type, 
  avatar_url, 
  is_active
)
SELECT 
  u.id as user_id,
  e.name as full_name,
  e.email,
  COALESCE(e.position, 'employee')::text as user_type,
  NULL as avatar_url,
  true as is_active
FROM auth.users u
INNER JOIN employees e ON e.user_id = u.id
LEFT JOIN user_profiles up ON up.user_id = u.id
WHERE up.id IS NULL;
```

### Se o PASSO 1 retornou linhas com "⚠️ SEM TIPO":

Execute este SQL para corrigir user_type:

```sql
UPDATE user_profiles up
SET user_type = COALESCE(e.position, 'employee')
FROM employees e
WHERE e.user_id = up.user_id 
AND (up.user_type IS NULL OR up.user_type = '');
```

### Se is_active está FALSE:

```sql
UPDATE user_profiles 
SET is_active = true 
WHERE user_type != 'client' OR user_type IS NULL;
```

## 📊 O QUE FOI ALTERADO NO CÓDIGO

### 1. `src/components/messaging/NewDirectConversationModal.tsx`
- Adicionados logs DETALHADOS em cada etapa da busca
- Agora mostra alertas se não encontrar usuários
- Logs mostram dados brutos, filtros aplicados, e resultado final

### 2. `src/hooks/usePresence.ts`
- Melhorado tratamento de erro
- Não quebra mais a aplicação se RPC não existir
- Mostra warning específico no console

### 3. `src/app/app/mensagens/page.tsx`
- Adicionado handler `handleOpenNewConversation` com logs
- Logs mostram quando o botão é clicado

## 🎯 RESULTADO ESPERADO

Depois de seguir todos os passos:

1. ✅ Funções RPC criadas (sem mais erros 404)
2. ✅ user_profiles existem e estão ativos
3. ✅ user_type está preenchido corretamente
4. ✅ Modal "Nova Conversa" abre
5. ✅ Lista mostra todos os colaboradores (exceto você)
6. ✅ Você pode clicar em um colaborador e iniciar conversa
7. ✅ Conversa aparece na lista da esquerda

## 🆘 SE AINDA NÃO FUNCIONAR

Me envie:
1. Print do resultado do SQL `teste_query_user_profiles.sql`
2. Print do console quando clicar em "Nova Conversa"
3. Print da aba Network mostrando a requisição para `user_profiles`

Com isso vou identificar o problema exato.

## 📁 ARQUIVOS CRIADOS/MODIFICADOS

**Arquivos SQL para executar no Supabase:**
- `supabase/criar_funcoes_rpc_presenca.sql` - Criar funções RPC
- `supabase/verificar_user_profiles.sql` - Diagnóstico completo
- `supabase/teste_query_user_profiles.sql` - Teste rápido

**Código modificado (já salvo):**
- `src/components/messaging/NewDirectConversationModal.tsx` - Logs detalhados
- `src/hooks/usePresence.ts` - Tratamento de erro robusto
- `src/app/app/mensagens/page.tsx` - Logs no click do botão

**Documentação:**
- `DIAGNOSTICO_COLABORADORES_LISTA.md` - Diagnóstico completo
- `SOLUCAO_DEFINITIVA_COLABORADORES.md` - Este arquivo
