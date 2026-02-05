# DEBUG: Modal Nova Conversa Não Abre

## 🔍 PROBLEMA IDENTIFICADO

O modal "Nova Conversa" não estava abrindo quando o botão era clicado na aba "Equipe".

## 🎯 POSSÍVEIS CAUSAS

### 1. **Erro na função RPC `update_user_presence` (MAIS PROVÁVEL)**
   - **Sintoma**: Console mostra erro 404 na função `update_user_presence`
   - **Impacto**: Hook `usePresence` está causando erros contínuos (a cada 30 segundos)
   - **Resultado**: JavaScript pode estar quebrando silenciosamente, impedindo clicks de funcionar

### 2. **Estado do Modal não está mudando**
   - **Sintoma**: Click no botão não dispara `setIsNewConversationModalOpen(true)`
   - **Impacto**: Modal nunca recebe `isOpen={true}`

## ✅ CORREÇÕES APLICADAS

### 1. **Logs de Debug Adicionados**
Foram adicionados logs extensivos em 3 locais:

#### A) `src/app/app/mensagens/page.tsx`
```typescript
const handleOpenNewConversation = () => {
  console.log('🚀 Abrindo modal Nova Conversa');
  console.log('🚀 CurrentUserId:', currentUserId);
  console.log('🚀 IsSuperAdmin:', isSuperAdmin);
  console.log('🚀 ActiveTab:', activeTab);
  setIsNewConversationModalOpen(true);
};
```

#### B) `src/components/messaging/NewDirectConversationModal.tsx`
```typescript
console.log('🎭 NewDirectConversationModal renderizado');
console.log('🎭 isOpen:', isOpen);
console.log('🎭 currentUserId:', currentUserId);
console.log('🎭 filterType:', filterType);
```

#### C) `src/hooks/usePresence.ts`
- Melhorado tratamento de erro para não quebrar a aplicação
- Adicionado warning específico se a função RPC não existir

### 2. **Tratamento Robusto de Erro em `usePresence`**
```typescript
const updatePresence = async (status: 'online' | 'away' | 'offline') => {
  if (!userId) return;

  try {
    const { error } = await supabase.rpc('update_user_presence', {
      p_user_id: userId,
      p_status: status,
      p_group_id: groupId || null,
    });
    
    if (error) {
      // Silenciosamente falha se a função não existir (404)
      if (error.message?.includes('Could not find') || error.code === '42883') {
        console.warn('⚠️ Função update_user_presence não existe no banco.');
        return;
      }
      throw error;
    }
  } catch (error: any) {
    // Não quebrar a aplicação se presença falhar
    console.warn('⚠️ Erro ao atualizar presença (não crítico):', error?.message || error);
  }
};
```

## 🧪 COMO TESTAR

### 1. **Recarregue a aplicação no navegador**
   - Limpe o cache se necessário (Ctrl+Shift+R ou Cmd+Shift+R)

### 2. **Abra o Console do navegador (F12)**

### 3. **Vá até a aba "Equipe"**

### 4. **Clique no botão "Nova Conversa"**

### 5. **Observe os logs no console:**

#### ✅ **Se aparecer:**
```
🚀 Abrindo modal Nova Conversa
🚀 CurrentUserId: [algum-uuid]
🚀 IsSuperAdmin: true
🚀 ActiveTab: team
🎭 NewDirectConversationModal renderizado
🎭 isOpen: true
🎭 Modal ESTÁ ABERTO, renderizando...
```
**ÓTIMO!** O modal deveria abrir.

#### ❌ **Se NÃO aparecer nada:**
O click não está funcionando. Pode ser:
- Botão está desabilitado
- Outro elemento está sobrepondo o botão
- Erro no React está quebrando o componente

#### ⚠️ **Se aparecer warnings sobre `update_user_presence`:**
```
⚠️ Função update_user_presence não existe no banco.
```
Isso não deve impedir o modal de abrir, mas você deve executar o SQL em `supabase/criar_funcoes_rpc_presenca.sql`.

## 🔧 PRÓXIMOS PASSOS

1. **Execute o SQL no Supabase** (arquivo: `supabase/criar_funcoes_rpc_presenca.sql`)
   - Isso vai eliminar os erros 404
   - Vai permitir que o sistema de presença funcione corretamente

2. **Verifique os logs no console** após clicar em "Nova Conversa"

3. **Se ainda não funcionar**, copie TODOS os logs e erros do console e me envie

## 📋 ARQUIVOS MODIFICADOS

1. `src/app/app/mensagens/page.tsx` - Adicionado `handleOpenNewConversation` com logs
2. `src/components/messaging/NewDirectConversationModal.tsx` - Adicionados logs de renderização
3. `src/hooks/usePresence.ts` - Melhorado tratamento de erro
4. `supabase/criar_funcoes_rpc_presenca.sql` - SQL para criar funções RPC (já existia)
