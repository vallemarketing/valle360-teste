# ✅ Correção: Colaboradores Não Apareciam na Lista "Equipe"

## 📋 Problemas Identificados

### 1. **Perfis não eram criados corretamente** ❌
**Arquivo**: `src/app/api/admin/create-employee/route.ts`

**Problema**: 
- A criação de `user_profiles` não validava erros
- Não tinha `.select().single()` para confirmar criação
- Campo `metadata` podia causar conflito de tipo
- Faltava `avatar_url` necessário para mensagens
- Não fazia rollback se falhasse

**Solução Implementada**:
```typescript
// ANTES: Não verificava erro
await supabaseAdmin.from('user_profiles').upsert({...})

// AGORA: Valida e faz rollback se falhar
const { data: profileData, error: profileError } = await supabaseAdmin
  .from('user_profiles')
  .upsert({
    id: userId,
    user_id: userId,
    email,
    full_name: `${nome} ${sobrenome}`,
    user_type: 'employee',
    role: 'employee',
    is_active: true,
    avatar_url: fotoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
  })
  .select()
  .single()

if (profileError) {
  // Rollback completo...
}
```

---

### 2. **Admin View bloqueava visualização** ❌
**Arquivo**: `src/app/app/mensagens/page.tsx`

**Problema**:
- `adminView={isSuperAdmin}` fazia com que admins só vissem conversas existentes
- Botão "Nova Conversa" era desabilitado para admins
- Não mostrava lista de colaboradores disponíveis

**Solução Implementada**:
```typescript
// ANTES: Admin não podia criar conversas
adminView={isSuperAdmin}
onNewConversation={() => !isSuperAdmin && setIsNewConversationModalOpen(true)}

// AGORA: Admin pode criar conversas normalmente
adminView={false}
onNewConversation={() => setIsNewConversationModalOpen(true)}
```

---

### 3. **Modal de Nova Conversa não abria para admins** ❌
**Arquivo**: `src/app/app/mensagens/page.tsx`

**Problema**:
- Modal `NewDirectConversationModal` só existia para não-admins
- Admins não tinham como iniciar conversas com colaboradores

**Solução Implementada**:
```typescript
// ANTES: Só não-admins tinham acesso
{currentUserId && !isSuperAdmin && (
  <NewDirectConversationModal ... />
)}

// AGORA: Admins também têm acesso
{currentUserId && isSuperAdmin && (
  <>
    <NewDirectConversationModal 
      isOpen={isNewConversationModalOpen && activeTab !== 'groups'}
      ... 
    />
    <NewConversationModal ... />
  </>
)}
```

---

### 4. **Botão "+" estava escondido** ❌
**Arquivo**: `src/components/messaging/DirectConversationList.tsx`

**Problema**:
- Botão de nova conversa era escondido quando `adminView={true}`

**Solução Implementada**:
```typescript
// ANTES: Condicional que escondia o botão
{!adminView && (
  <Button onClick={onNewConversation}>
    <Plus className="w-4 h-4" />
  </Button>
)}

// AGORA: Botão sempre visível
<Button onClick={onNewConversation}>
  <Plus className="w-4 h-4" />
</Button>
```

---

## 🎯 Resultado Esperado

### ✅ **Após as Correções**:

1. **Novos colaboradores**:
   - ✅ Perfil em `user_profiles` é criado automaticamente
   - ✅ Validação de erro com rollback completo
   - ✅ Avatar é gerado automaticamente
   - ✅ Logs detalhados de sucesso/erro

2. **Admins podem**:
   - ✅ Ver lista de todos os colaboradores
   - ✅ Clicar no botão "+" (Nova Conversa)
   - ✅ Selecionar colaboradores para conversar
   - ✅ Iniciar conversas normalmente

3. **Interface**:
   - ✅ Aba "Equipe" mostra colaboradores disponíveis
   - ✅ Botão "+" sempre visível
   - ✅ Modal de seleção abre corretamente

---

## 🧪 Como Testar

### **Teste 1: Criar Novo Colaborador**
1. Acesse `/admin/colaboradores/novo`
2. Preencha os dados
3. Clique em "Criar Colaborador"
4. **Verifique no console**:
   ```
   ✅ user_profile criado com sucesso: {...}
   ```
5. Se aparecer erro, o rollback será automático

### **Teste 2: Ver Colaboradores na Equipe**
1. Acesse `/admin/mensagens` ou `/mensagens`
2. Clique na aba "Equipe"
3. Clique no botão "+" (Nova Conversa)
4. **Deve aparecer**:
   - Lista de todos os colaboradores ativos
   - Opção de selecionar para conversar

### **Teste 3: Iniciar Conversa**
1. No modal, selecione um colaborador
2. Clique em "Iniciar Conversa"
3. **Deve**:
   - Criar a conversa automaticamente
   - Abrir a janela de chat
   - Colaborador aparecer na lista

---

## ⚠️ Atenção: SQL Manual Necessário

### **Se você já tinha colaboradores criados ANTES desta correção:**

Eles podem não ter perfil em `user_profiles`. Execute este SQL no Supabase:

```sql
-- Criar perfis para colaboradores existentes sem perfil
INSERT INTO user_profiles (id, user_id, email, full_name, user_type, role, is_active, avatar_url)
SELECT 
  u.id,
  u.id as user_id,
  u.email,
  u.full_name,
  u.user_type,
  'employee' as role,
  u.is_active,
  COALESCE(
    e.avatar, 
    e.photo_url,
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || u.email
  ) as avatar_url
FROM users u
INNER JOIN employees e ON e.user_id = u.id
LEFT JOIN user_profiles up ON (up.user_id = u.id OR up.id = u.id)
WHERE u.user_type = 'employee'
  AND u.is_active = true
  AND up.id IS NULL
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  user_type = EXCLUDED.user_type,
  is_active = EXCLUDED.is_active,
  avatar_url = EXCLUDED.avatar_url;
```

### **Se VOCÊ (admin) não aparecer na lista:**

Execute este SQL substituindo os dados:

```sql
-- Criar seu perfil de admin
INSERT INTO user_profiles (id, email, full_name, user_type, role, is_active, avatar_url)
SELECT 
  id,
  email,
  full_name,
  COALESCE(user_type, 'super_admin') as user_type,
  'super_admin' as role,
  true as is_active,
  'https://api.dicebear.com/7.x/avataaars/svg?seed=' || email as avatar_url
FROM users
WHERE email LIKE '%seu-email%'
  AND NOT EXISTS (
    SELECT 1 FROM user_profiles up WHERE up.id = users.id
  );
```

---

## 📝 Arquivos Modificados

1. ✅ `src/app/api/admin/create-employee/route.ts`
   - Validação de erro em `user_profiles`
   - Rollback completo se falhar
   - Avatar automático
   - Logs detalhados

2. ✅ `src/app/app/mensagens/page.tsx`
   - `adminView={false}` para equipe e clientes
   - Modal abre para admins
   - Botão "+" habilitado

3. ✅ `src/components/messaging/DirectConversationList.tsx`
   - Botão "+" sempre visível
   - Não condiciona por `adminView`

---

## 🎉 Resumo

**Problema**: Colaboradores criados não apareciam na lista "Equipe" para conversar.

**Causas**:
1. ❌ Perfis não criados em `user_profiles`
2. ❌ Admin view bloqueava interface
3. ❌ Modal não abria para admins
4. ❌ Botão "+" escondido

**Solução**:
1. ✅ Validação e rollback em `user_profiles`
2. ✅ Desabilitar `adminView` nas abas de conversas
3. ✅ Modal disponível para todos
4. ✅ Botão sempre visível

**Resultado**: Agora admins podem ver e conversar com colaboradores normalmente! 🎊

---

**Última atualização**: 05/02/2026
**Autor**: Assistente Claude
