# 🎯 EXECUTAR UMA QUERY DE CADA VEZ

## ⚠️ IMPORTANTE

**NÃO execute tudo de uma vez!** Execute **UMA query de cada vez** no Supabase SQL Editor.

## 📋 PASSO A PASSO

### 1️⃣ QUERY 1: DIAGNÓSTICO

Abra `supabase/EXECUTAR_UMA_POR_VEZ.sql` e copie apenas a **QUERY 1**:

```sql
SELECT 
  u.id,
  u.email,
  u.created_at,
  CASE 
    WHEN EXISTS (SELECT 1 FROM user_profiles WHERE user_id = u.id) THEN '✅ Tem user_profile'
    ELSE '❌ SEM user_profile'
  END as tem_profile
FROM auth.users u
WHERE u.email LIKE '%@valle360.com.br'
ORDER BY u.email;
```

**Execute no Supabase e veja:**
- ✅ Se todos têm `user_profile` → Pule para QUERY 3
- ❌ Se faltam `user_profiles` → Continue para QUERY 2

---

### 2️⃣ QUERY 2: CRIAR FALTANTES

Copie apenas a **QUERY 2**:

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

**Execute no Supabase**
- Deveria retornar algo como: "2 rows inserted" (para Leonardo e Gustavo)

---

### 3️⃣ QUERY 3: ATIVAR TODOS

Copie apenas a **QUERY 3**:

```sql
UPDATE user_profiles
SET is_active = true
WHERE email LIKE '%@valle360.com.br';
```

**Execute no Supabase**
- Deveria retornar: "4 rows updated"

---

### 4️⃣ QUERY 4: VERIFICAR RESULTADO

Copie apenas a **QUERY 4**:

```sql
SELECT 
  full_name,
  email,
  user_type,
  is_active,
  CASE 
    WHEN is_active = true AND user_type IS NOT NULL AND user_type != '' THEN '✅ VAI APARECER'
    ELSE '❌ PROBLEMA: ' || 
      CASE 
        WHEN is_active = false THEN 'inativo'
        WHEN user_type IS NULL THEN 'sem user_type'
        WHEN user_type = '' THEN 'user_type vazio'
      END
  END as status
FROM user_profiles
WHERE email LIKE '%@valle360.com.br'
ORDER BY full_name;
```

**Execute no Supabase e veja:**

Deveria mostrar todos com status **"✅ VAI APARECER"**:
- ✅ Leonardo Augusto
- ✅ João Viana
- ✅ Gustavo Mendes
- ✅ Shane Santiago

---

## 🧪 TESTE FINAL

Depois de executar todas as 4 queries:

1. **Recarregue a página** (Ctrl+Shift+R)
2. **Vá em**: Mensagens → Equipe → Nova Conversa
3. **Resultado esperado**: Os 4 colaboradores aparecem na lista

---

## 🆘 SE DER ERRO

Se alguma query der erro:
1. **Pare** e não execute as próximas
2. **Me envie um print** do erro
3. Vou ajustar e te dar a query corrigida

---

## 📁 ARQUIVO

Use: `supabase/EXECUTAR_UMA_POR_VEZ.sql`

Execute **UMA query de cada vez**, copiando e colando no SQL Editor do Supabase.
