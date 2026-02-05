# 🔄 MENSAGENS EM TEMPO REAL - CONFIGURAR REALTIME

## 📋 PROBLEMA

As mensagens não aparecem em tempo real. Você precisa **recarregar a página** para ver novas mensagens.

## 🔍 POSSÍVEIS CAUSAS

1. **Realtime não está habilitado** nas tabelas do Supabase
2. **Subscrição não está conectando** (erro de conexão)
3. **Permissões RLS** bloqueando realtime

## ✅ SOLUÇÃO

### PASSO 1: Verificar Realtime no Supabase

No **Supabase SQL Editor**, execute a **primeira parte** de:

📁 `supabase/HABILITAR_REALTIME.sql`

```sql
SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN schemaname || '.' || tablename IN (
      SELECT publication_tables.schemaname || '.' || publication_tables.tablename
      FROM pg_publication_tables publication_tables
      WHERE publication_tables.pubname = 'supabase_realtime'
    ) THEN '✅ Realtime ATIVO'
    ELSE '❌ Realtime INATIVO'
  END as status
FROM pg_tables
WHERE tablename IN (
  'direct_messages',
  'direct_conversations',
  'direct_conversation_participants',
  'message_read_receipts'
)
ORDER BY tablename;
```

**Resultado esperado:**

| tablename | status |
|-----------|--------|
| direct_conversation_participants | ✅ Realtime ATIVO |
| direct_conversations | ✅ Realtime ATIVO |
| direct_messages | ✅ Realtime ATIVO |
| message_read_receipts | ✅ Realtime ATIVO |

---

### PASSO 2: Se Alguma Estiver INATIVA

Execute a **segunda parte** do SQL:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE message_read_receipts;
ALTER PUBLICATION supabase_realtime ADD TABLE direct_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE direct_conversation_participants;
```

---

### PASSO 3: Testar no Navegador

1. **Salve o código** (modificações já foram feitas)
2. **Recarregue a página** (Ctrl+Shift+R)
3. **Abra o Console** (F12)
4. **Vá em Mensagens → Equipe → Clique em um colaborador**

**Observe os logs no console:**

```
🔄 Configurando realtime para conversa: [uuid]
🔌 Status da subscrição realtime: SUBSCRIBED
✅ REALTIME CONECTADO com sucesso!
```

---

### PASSO 4: Testar Envio e Recebimento

#### Teste 1: Enviar mensagem
1. Digite "teste 1" e envie
2. Deveria aparecer na conversa **instantaneamente**

**Logs esperados:**
```
📤 ========== TENTANDO ENVIAR MENSAGEM ==========
📤 Inserindo mensagem no banco...
✅ Mensagem inserida com sucesso
🔔 NOVA MENSAGEM RECEBIDA (realtime)
🔔 Mensagem própria, não toca som
🔄 Recarregando mensagens...
✅ MENSAGEM ENVIADA COM SUCESSO!
```

#### Teste 2: Receber mensagem (simular)
1. Abra o Supabase → **Table Editor** → `direct_messages`
2. Clique em "Insert row"
3. Preencha:
   - `conversation_id`: [o ID da conversa que está aberta]
   - `from_user_id`: [ID de outro usuário]
   - `body`: "Mensagem de teste via Supabase"
4. Clique em "Save"

**No navegador, deveria aparecer:**
- ✅ Mensagem aparece **instantaneamente** sem recarregar
- 🔔 Som de notificação (se for de outro usuário)

**Logs esperados:**
```
🔔 NOVA MENSAGEM RECEBIDA (realtime): {...}
🔔 Mensagem de outro usuário, tocando som
🔄 Recarregando mensagens...
```

---

## 🆘 SE NÃO FUNCIONAR

### Problema: Status = "CHANNEL_ERROR"

```
🔌 Status da subscrição realtime: CHANNEL_ERROR
❌ ERRO no canal realtime
```

**Solução:** Problema de conexão com servidor realtime

1. Verifique se o plano do Supabase inclui realtime
2. Tente reconectar: recarregue a página
3. Verifique se há firewall bloqueando WebSocket

---

### Problema: Status = "TIMED_OUT"

```
🔌 Status da subscrição realtime: TIMED_OUT
⏱️ TIMEOUT na conexão realtime
```

**Solução:** Conexão lenta ou instável

1. Verifique sua conexão de internet
2. Recarregue a página
3. Verifique status do Supabase: https://status.supabase.com

---

### Problema: Nenhum log de "NOVA MENSAGEM RECEBIDA"

**Solução:** Realtime não está configurado

1. Execute o SQL `HABILITAR_REALTIME.sql` completo
2. Recarregue a página
3. Tente enviar mensagem novamente

---

## 📊 ARQUIVOS MODIFICADOS

**SQL para executar:**
- `supabase/HABILITAR_REALTIME.sql` - Verificar e habilitar realtime

**Código modificado (já salvo):**
- `src/components/messaging/DirectChatWindow.tsx` - Logs detalhados de realtime

---

## 🎯 CHECKLIST

- [ ] Executei SQL para verificar realtime
- [ ] Todas as tabelas estão com "✅ Realtime ATIVO"
- [ ] Recarreguei a página (Ctrl+Shift+R)
- [ ] Console mostra "✅ REALTIME CONECTADO com sucesso!"
- [ ] Enviei mensagem e apareceu instantaneamente
- [ ] Testei receber mensagem (via Supabase ou outro dispositivo)

---

**Execute o SQL e me diga o resultado! 🚀**
