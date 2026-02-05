# 🔧 Correções: RLS e Rate Limiting

## ❌ Problemas Resolvidos

### **1. Row Level Security (RLS) Violation**
```
Error: new row violates row-level security policy for table "users"
```

**Causa:** O cliente tentava inserir dados diretamente na tabela `users`, mas o RLS bloqueava.

**Solução:** Criar API backend que usa **Service Role Key** do Supabase para bypassar RLS.

---

### **2. Rate Limiting (429 Too Many Requests)**
```
Error: For security purposes, you can only request this after 2 seconds.
```

**Causa:** Múltiplas tentativas de `signUp` em poucos segundos no lado do cliente.

**Solução:** Usar API Admin do Supabase (`auth.admin.createUser`) que não tem rate limit.

---

## ✅ Solução Implementada

### **Arquitetura Anterior (ERRADA):**

```
Frontend (page.tsx)
  ├─> supabase.auth.signUp() ❌ Rate limited
  ├─> supabase.from('users').insert() ❌ Bloqueado por RLS
  └─> supabase.from('employees').insert() ❌ Bloqueado por RLS
```

### **Arquitetura Nova (CORRETA):**

```
Frontend (page.tsx)
  └─> POST /api/admin/create-employee
       └─> Backend API (route.ts)
            ├─> supabaseAdmin.auth.admin.createUser() ✅ Sem rate limit
            ├─> supabaseAdmin.from('users').insert() ✅ Bypassa RLS
            └─> supabaseAdmin.from('employees').insert() ✅ Bypassa RLS
```

---

## 📁 Arquivos Criados/Modificados

### **1. Nova API Backend:** `/api/admin/create-employee/route.ts`

```typescript
// Usa Service Role Key para bypassar RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Cria usuário usando Admin API (sem rate limit)
const { data: authData, error: authError } = 
  await supabaseAdmin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: {
      full_name: `${nome} ${sobrenome}`,
      role: 'employee'
    }
  })
```

**Vantagens:**
- ✅ **Bypassa RLS** (Service Role tem acesso total)
- ✅ **Sem rate limiting** (API Admin não tem limite)
- ✅ **Email já confirmado** (`email_confirm: true`)
- ✅ **Rollback automático** se algo falhar

---

### **2. Modificado:** `src/app/admin/colaboradores/novo/page.tsx`

**Antes:**
```typescript
// Chamadas diretas no cliente ❌
const { data: authData, error: authError } = 
  await supabase.auth.signUp({ email, password })

const { data: userData, error: userError } = 
  await supabase.from('users').insert({ ... })
```

**Depois:**
```typescript
// Chama API backend ✅
const response = await fetch('/api/admin/create-employee', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nome: formData.nome,
    sobrenome: formData.sobrenome,
    email: formData.email,
    emailPessoal: formData.email_pessoal,
    senha: senhaProvisoria,
    // ... outros campos
  })
})
```

---

## 🔑 Service Role Key

### **O que é?**
O **Service Role Key** é uma chave especial do Supabase que tem **acesso total** ao banco de dados, bypassando todas as políticas de RLS.

### **Onde encontrar?**
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **API**
4. Copie a chave `service_role` (não a `anon`!)

### **Configuração no `.env.local`:**
```env
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
```

### **⚠️ Segurança:**
- ❌ **NUNCA** exponha esta chave no frontend
- ✅ **SEMPRE** use apenas no backend (rotas API)
- ✅ **NUNCA** commite no Git (`.env.local` está no `.gitignore`)

---

## 🧪 Testar Agora

### **1. Acesse o cadastro:**
```
http://localhost:3000/admin/colaboradores/novo
```

### **2. Preencha o formulário:**
- **Nome:** Guilherme
- **Sobrenome:** Valle
- **Email Pessoal:** seu-email@gmail.com
- **CPF:** 075.355.516-61
- **Telefone:** (11) 99999-9999
- **Selecione áreas**

### **3. Clique em "Criar Colaborador"**

### **4. O que vai acontecer:**
1. ✅ Frontend chama `/api/admin/create-employee`
2. ✅ Backend usa Service Role Key
3. ✅ Cria usuário no `auth.users` (sem rate limit)
4. ✅ Insere na tabela `users` (bypassa RLS)
5. ✅ Insere na tabela `employees` (bypassa RLS)
6. ✅ Cria permissões básicas
7. ✅ Envia email para o email pessoal
8. ✅ Mostra alerta com as credenciais
9. ✅ Redireciona para lista de colaboradores

---

## 📊 Comparação de Métodos

| Aspecto | Cliente (Anterior) | API Admin (Atual) |
|---------|-------------------|-------------------|
| **RLS** | ❌ Bloqueado | ✅ Bypassa |
| **Rate Limiting** | ❌ 2 segundos | ✅ Sem limite |
| **Email Confirmado** | ❌ Precisa confirmar | ✅ Auto-confirmado |
| **Segurança** | ❌ Expõe lógica | ✅ Backend seguro |
| **Rollback** | ❌ Manual | ✅ Automático |

---

## 🎯 Fluxo Completo de Cadastro

```mermaid
1. Admin preenche formulário
   ↓
2. Gera senha provisória (Valle@Abc123)
   ↓
3. POST /api/admin/create-employee
   ├─ Cria no auth.users (Service Role)
   ├─ Insere em users (bypassa RLS)
   ├─ Insere em employees (bypassa RLS)
   └─ Cria permissões básicas
   ↓
4. POST /api/cpanel/create-email
   └─ Cria email corporativo (opcional)
   ↓
5. POST /api/send-welcome-email
   └─ Envia credenciais para email pessoal
   ↓
6. Alerta de sucesso com credenciais
   ↓
7. Redireciona para lista de colaboradores
```

---

## ✅ Checklist de Verificação

- [x] Service Role Key configurado no `.env.local`
- [x] API `/api/admin/create-employee` criada
- [x] Frontend modificado para chamar API
- [x] Servidor reiniciado
- [ ] Teste de cadastro completo
- [ ] Verificar recebimento de email

---

## 🚨 Troubleshooting

### **Erro: Service Role Key não configurado**
```bash
cd /Users/imac/Desktop/N8N/valle-360
echo 'SUPABASE_SERVICE_ROLE_KEY=sua_chave_aqui' >> .env.local
```

### **Erro: API não encontrada (404)**
- Verifique se o arquivo existe em: `src/app/api/admin/create-employee/route.ts`
- Reinicie o servidor: `npm run dev`

### **Erro: RLS ainda bloqueando**
- Confirme que está usando `supabaseAdmin` e não `supabase`
- Verifique se a Service Role Key está correta

---

🎉 **Pronto para testar!** O sistema agora cria colaboradores sem problemas de RLS ou rate limiting!



