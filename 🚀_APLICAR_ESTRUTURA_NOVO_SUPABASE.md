# 🚀 APLICAR ESTRUTURA NO NOVO SUPABASE

## ✅ STATUS ATUAL

- ✅ Nova conta Supabase criada
- ✅ Credenciais configuradas em `.env.local`
- ⏳ **PRÓXIMO PASSO:** Aplicar estrutura do banco

---

## 📋 PASSO 1: ACESSAR SQL EDITOR

### 🔗 Link Direto:
```
https://supabase.com/dashboard/project/ikjgsqtykkhqimypacro/sql/new
```

### Ou navegue:
1. Vá para: https://supabase.com/dashboard
2. Clique no projeto: **ikjgsqtykkhqimypacro**
3. No menu lateral esquerdo, clique em **SQL Editor**
4. Clique em **+ New query**

---

## 📋 PASSO 2: APLICAR ESTRUTURA COMPLETA

### 📁 Arquivo a executar:
```
valle-360/supabase/⚡_SCRIPT_COMPLETO_EXECUTAR_TUDO.sql
```

### Como executar:

1. **Abra o arquivo** `⚡_SCRIPT_COMPLETO_EXECUTAR_TUDO.sql` no seu editor

2. **Copie TODO o conteúdo** (Cmd+A → Cmd+C)

3. **Cole no SQL Editor do Supabase** (Cmd+V)

4. **Clique em "Run"** (canto inferior direito) ou pressione **Cmd+Enter**

5. **Aguarde** a execução (pode levar 10-30 segundos)

6. **Verifique** se apareceu:
   ```
   Success. No rows returned
   ```

### ⚠️ Se der erro:

Se aparecer algum erro de tabela já existente, execute este comando primeiro:

```sql
-- LIMPAR BANCO (USE COM CUIDADO!)
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

Depois execute novamente o script completo.

---

## 📋 PASSO 3: CRIAR ADMIN GUILHERME

### 📁 Arquivo a executar:
```
valle-360/supabase/criar_admin_novo_v2.sql
```

### Como executar:

1. **Abra uma nova query** no SQL Editor (+ New query)

2. **Copie o conteúdo** de `criar_admin_novo_v2.sql`

3. **Cole no SQL Editor**

4. **Clique em "Run"**

5. **Verifique** o resultado esperado:

```
DADOS CRIADOS:
auth_users: 1
user_profiles: 1
users: 1
employees: 1
permissions: 19
gamification: 1
achievements: 3
```

---

## 📋 PASSO 4: VERIFICAR CRIAÇÃO

Execute esta query para confirmar:

```sql
SELECT 
    'auth_users' as tabela,
    COUNT(*) as registros
FROM auth.users
WHERE email = 'guilherme@vallegroup.com.br'

UNION ALL

SELECT 
    'user_profiles' as tabela,
    COUNT(*) as registros
FROM user_profiles
WHERE email = 'guilherme@vallegroup.com.br'

UNION ALL

SELECT 
    'users' as tabela,
    COUNT(*) as registros
FROM users
WHERE email = 'guilherme@vallegroup.com.br'

UNION ALL

SELECT 
    'employees' as tabela,
    COUNT(*) as registros
FROM employees e
JOIN users u ON e.user_id = u.id
WHERE u.email = 'guilherme@vallegroup.com.br'

UNION ALL

SELECT 
    'permissions' as tabela,
    COUNT(*) as registros
FROM employee_permissions ep
JOIN employees e ON ep.employee_id = e.id
JOIN users u ON e.user_id = u.id
WHERE u.email = 'guilherme@vallegroup.com.br'

UNION ALL

SELECT 
    'gamification' as tabela,
    COUNT(*) as registros
FROM user_gamification ug
JOIN users u ON ug.user_id = u.id
WHERE u.email = 'guilherme@vallegroup.com.br'

UNION ALL

SELECT 
    'achievements' as tabela,
    COUNT(*) as registros
FROM user_achievements ua
JOIN users u ON ua.user_id = u.id
WHERE u.email = 'guilherme@vallegroup.com.br';
```

### ✅ Resultado esperado:
```
auth_users      1
user_profiles   1
users           1
employees       1
permissions    19
gamification    1
achievements    3
```

---

## 📋 PASSO 5: CONFIGURAR AUTHENTICATION

### 1. Vá para Authentication Settings:
```
https://supabase.com/dashboard/project/ikjgsqtykkhqimypacro/auth/users
```

### 2. Verifique se o usuário aparece:
- Email: `guilherme@vallegroup.com.br`
- Status: **Confirmed** (ou confirme manualmente)

### 3. Se precisar confirmar manualmente:
1. Clique no usuário
2. Clique em **"Confirm email"**

---

## 📋 PASSO 6: TESTAR LOGIN

### 1. Reinicie o servidor:
```bash
cd /Users/imac/Desktop/N8N/valle-360
pkill -f "next dev"
npm run dev
```

### 2. Acesse:
```
http://localhost:3000/login
```

### 3. Credenciais:
```
Email: guilherme@vallegroup.com.br
Senha: *Valle2307
```

### 4. Resultado esperado:
✅ Redirecionamento para: `http://localhost:3000/admin/dashboard`

---

## 🎯 RESUMO DOS ARQUIVOS

| Arquivo | Descrição |
|---------|-----------|
| `⚡_SCRIPT_COMPLETO_EXECUTAR_TUDO.sql` | Cria toda estrutura (40+ tabelas) |
| `criar_admin_novo_v2.sql` | Cria admin com permissões e gamificação |
| `🔑_CREDENCIAIS_SUPABASE_NOVA.md` | Documento com todas as credenciais |

---

## ⚠️ PROBLEMAS COMUNS

### ❌ "relation already exists"
**Solução:** Execute o comando de limpar banco primeiro (DROP SCHEMA)

### ❌ "email not confirmed"
**Solução:** Vá em Auth → Users → Clique no usuário → Confirm email

### ❌ "invalid login credentials"
**Solução:** Verifique se digitou a senha corretamente: `*Valle2307` (com asterisco)

### ❌ Erro 500 ao fazer login
**Solução:** 
1. Verifique se as tabelas foram criadas
2. Verifique o `.env.local`
3. Reinicie o servidor

---

## 🎉 QUANDO TUDO ESTIVER FUNCIONANDO

Me avise e vou:
1. ✅ Configurar as permissões RLS (Row Level Security)
2. ✅ Configurar Storage para uploads
3. ✅ Ativar Real-time subscriptions
4. ✅ Configurar Email templates
5. ✅ E muito mais!

---

**🚀 AGORA É SÓ EXECUTAR OS PASSOS ACIMA!**

