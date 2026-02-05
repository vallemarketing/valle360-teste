# ✅ VERSÃO FINAL - SEM ERROS

## 📁 Arquivo: `supabase/VERSAO_FINAL_SEM_ERROS.sql`

## 🚀 EXECUTE NA ORDEM:

### ✅ QUERY 1: Ver quem tem e quem não tem user_profile

Cole e execute no Supabase:

```sql
SELECT 
  u.id,
  u.email,
  CASE 
    WHEN EXISTS (SELECT 1 FROM user_profiles WHERE user_id = u.id) THEN '✅ Tem user_profile'
    ELSE '❌ SEM user_profile'
  END as tem_profile
FROM auth.users u
WHERE u.email LIKE '%@valle360.com.br'
ORDER BY u.email;
```

**Esperado:** 
- 4 linhas mostrando os 4 colaboradores
- Pode ter "❌ SEM user_profile" para Leonardo e/ou Gustavo

---

### ✅ QUERY 2: Criar user_profiles faltantes

```sql
INSERT INTO user_profiles (
  user_id,
  full_name,
  email,
  user_type,
  is_active
)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', SPLIT_PART(u.email, '@', 1)) as full_name,
  u.email,
  'employee',
  true
FROM auth.users u
WHERE u.email LIKE '%@valle360.com.br'
  AND NOT EXISTS (
    SELECT 1 FROM user_profiles WHERE user_id = u.id
  );
```

**Esperado:** 
- "2 rows inserted" (se Leonardo e Gustavo não tinham)
- OU "0 rows" (se já existiam)

---

### ✅ QUERY 3: Ativar todos

```sql
UPDATE user_profiles
SET is_active = true
WHERE email LIKE '%@valle360.com.br';
```

**Esperado:** "4 rows updated"

---

### ✅ QUERY 4: Corrigir user_type NULL (se houver)

```sql
UPDATE user_profiles
SET user_type = 'employee'
WHERE email LIKE '%@valle360.com.br'
  AND user_type IS NULL;
```

**Esperado:** 
- "0 rows" (se todos já tinham user_type)
- OU "X rows updated" (se tinha NULL)

---

### ✅ QUERY 5: Verificar resultado final

```sql
SELECT 
  full_name,
  email,
  user_type,
  is_active,
  CASE 
    WHEN is_active = true AND user_type IS NOT NULL THEN '✅ VAI APARECER'
    WHEN is_active = false THEN '❌ INATIVO'
    WHEN user_type IS NULL THEN '❌ SEM user_type'
    ELSE '❌ PROBLEMA'
  END as status
FROM user_profiles
WHERE email LIKE '%@valle360.com.br'
ORDER BY full_name;
```

**ESPERADO - TODOS COM "✅ VAI APARECER":**

| full_name | email | user_type | is_active | status |
|-----------|-------|-----------|-----------|--------|
| Gustavo Mendes | gustavo@valle360.com.br | employee | true | ✅ VAI APARECER |
| João Viana | joaoviana@valle360.com.br | employee | true | ✅ VAI APARECER |
| Leonardo Augusto | leonardo@valle360.com.br | employee | true | ✅ VAI APARECER |
| Shane Santiago | shane.santiago@valle360.com.br | employee | true | ✅ VAI APARECER |

---

## 🧪 TESTE

Depois de executar TODAS as 5 queries:

1. Recarregue: **Ctrl+Shift+R**
2. Vá em: **Mensagens → Equipe → Nova Conversa**
3. Resultado: **Os 4 colaboradores aparecem!**

---

## 📝 DIFERENÇA DESTA VERSÃO

✅ **Não verifica `user_type = ''`** (só `IS NULL`)
✅ **Dividido em 5 queries pequenas** (mais fácil de debugar)
✅ **Sem JOIN com employees** (evita erros de coluna)

---

## 🆘 SE DER ERRO

Me envie print do erro + qual query estava executando
