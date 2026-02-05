# 🔧 CORRIGIR ENVIO DE MENSAGENS

## 📋 O QUE PODE ESTAR ACONTECENDO

Quando você tenta enviar uma mensagem, pode estar falhando por:

1. **Funções RPC não existem no banco**
   - `get_or_create_direct_conversation`
   - `update_user_presence`
   - `upsert_typing_indicator`

2. **RLS (Row Level Security) bloqueando INSERT**
   - Você desabilitou RLS em algumas tabelas, mas pode ter faltado `direct_messages`

3. **Erro de permissão ou constraint**

## ✅ SOLUÇÃO

### PASSO 1: Criar Funções RPC

No Supabase SQL Editor, execute TODO o conteúdo de:

📁 `supabase/CRIAR_FUNCOES_MENSAGENS.sql`

Isso vai criar as 3 funções RPC necessárias e verificar se foram criadas.

**Resultado esperado:**
```
| funcao                             | status     |
|------------------------------------|------------|
| get_or_create_direct_conversation  | ✅ Criada  |
| update_user_presence               | ✅ Criada  |
| upsert_typing_indicator            | ✅ Criada  |
```

---

### PASSO 2: Verificar RLS em direct_messages

Execute esta query no Supabase:

```sql
-- Ver se RLS está ativo
SELECT 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE tablename = 'direct_messages';
```

**Se `rowsecurity = true`:**

Execute para desabilitar temporariamente:

```sql
ALTER TABLE direct_messages DISABLE ROW LEVEL SECURITY;
```

---

### PASSO 3: Testar no Navegador

1. **Salve o código** (Ctrl+S)
2. **Recarregue a página** (Ctrl+Shift+R)
3. **Abra o Console** (F12)
4. **Vá em Mensagens → Equipe**
5. **Clique em um colaborador**
6. **Tente enviar uma mensagem**

**Observe os logs no console:**

```
📤 ========== TENTANDO ENVIAR MENSAGEM ==========
📤 ReadOnly: false
📤 NewMessage: teste
📤 Attachments: 0
📤 IsSending: false
📤 ConversationId: [uuid]
📤 CurrentUserId: [uuid]
📤 Inserindo mensagem no banco...
✅ Mensagem inserida com sucesso: [dados]
✅ MENSAGEM ENVIADA COM SUCESSO!
```

**Se der erro:**

Você verá:
```
❌ ERRO AO INSERIR MENSAGEM: [detalhes]
❌ Detalhes do erro: {...}
```

**ME ENVIE UM PRINT DO CONSOLE COM O ERRO**

---

## 🆘 ERROS COMUNS

### Erro: "Could not find the function..."
→ Execute o SQL `CRIAR_FUNCOES_MENSAGENS.sql`

### Erro: "new row violates row-level security policy"
→ Desabilite RLS: `ALTER TABLE direct_messages DISABLE ROW LEVEL SECURITY;`

### Erro: "null value in column ... violates not-null constraint"
→ Algum campo obrigatório está faltando
→ Me envie o erro completo

### Erro: "permission denied for table"
→ Problema de permissão do Supabase
→ Verifique se está logado como super_admin

---

## 📁 ARQUIVOS

**SQL para executar:**
- `supabase/CRIAR_FUNCOES_MENSAGENS.sql` - Criar funções RPC

**Código modificado (já salvo):**
- `src/components/messaging/DirectChatWindow.tsx` - Logs detalhados

---

## 🎯 PRÓXIMOS PASSOS

1. Execute `CRIAR_FUNCOES_MENSAGENS.sql`
2. Verifique RLS em `direct_messages`
3. Recarregue a página e teste
4. Me envie print do console
