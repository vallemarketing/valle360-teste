# 🔧 SQL Corrigido - Criar Perfis Apenas para Usuários Válidos

## ⚠️ Problema Identificado

O erro mostra que há IDs em outras tabelas que não existem em `users`. Vamos criar perfis **apenas para usuários que realmente existem**.

---

## ✅ SQL CORRETO - Execute Este

```sql
-- PASSO 1: Criar perfis para usuários válidos que têm employee
INSERT INTO user_profiles (id, user_id, email, full_name, user_type, role, is_active, avatar_url)
SELECT 
  u.id,
  u.id as user_id,
  u.email,
  u.full_name,
  COALESCE(u.user_type, 'employee') as user_type,
  COALESCE(u.role, 'employee') as role,
  COALESCE(u.is_active, true) as is_active,
  COALESCE(
    e.avatar, 
    e.photo_url,
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || u.email
  ) as avatar_url
FROM users u
INNER JOIN employees e ON e.user_id = u.id  -- Só pega se existir em employees
WHERE NOT EXISTS (
  SELECT 1 FROM user_profiles up WHERE up.id = u.id
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  user_type = EXCLUDED.user_type,
  is_active = EXCLUDED.is_active,
  avatar_url = EXCLUDED.avatar_url;
```

---

## 🔍 Se Ainda Der Erro

Execute este SQL para ver quem está causando problema:

```sql
-- Ver usuários que existem mas não têm perfil
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.user_type,
  u.role,
  e.id as tem_employee
FROM users u
LEFT JOIN employees e ON e.user_id = u.id
LEFT JOIN user_profiles up ON up.id = u.id
WHERE up.id IS NULL
ORDER BY u.email;
```

---

## 📋 Depois Execute Este Para Confirmar

```sql
-- Verificar se todos os colaboradores têm perfil agora
SELECT 
  'Total em users' as tipo,
  COUNT(*) as quantidade
FROM users
WHERE user_type = 'employee'

UNION ALL

SELECT 
  'Total em user_profiles' as tipo,
  COUNT(*) as quantidade
FROM user_profiles
WHERE user_type = 'employee'

UNION ALL

SELECT 
  'Sem perfil' as tipo,
  COUNT(*) as quantidade
FROM users u
LEFT JOIN user_profiles up ON up.id = u.id
WHERE u.user_type = 'employee'
  AND up.id IS NULL;
```

---

## 🎯 O Que Mudou

- ✅ Usa `INNER JOIN` em vez de `LEFT JOIN` para garantir que só pega usuários válidos
- ✅ Verifica se o usuário NÃO existe em `user_profiles` antes de inserir
- ✅ Usa `COALESCE` para valores null
- ✅ Atualiza se houver conflito

---

## ⚡ Execute na Ordem

1. **SQL de criação** (o primeiro acima)
2. **SQL de verificação** (o segundo)
3. **SQL de confirmação** (o terceiro)

---

**Execute o primeiro SQL agora e me avise se funcionou!**
