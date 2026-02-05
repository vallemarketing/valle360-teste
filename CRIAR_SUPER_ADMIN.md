# 🔐 CRIAR SUPER ADMIN - INSTRUÇÕES

## MÉTODO 1: Via API Route (RECOMENDADO)

### Passo 1: Iniciar o servidor
```bash
npm run dev
```

### Passo 2: Acessar a URL no navegador
Abra no navegador ou use curl:
```
http://localhost:3000/api/create-admin
```

Ou via curl:
```bash
curl -X POST http://localhost:3000/api/create-admin
```

### Passo 3: Credenciais criadas
- **Email**: admin@valle360.com
- **Senha**: Admin123!
- **URL Login**: http://localhost:3000/admin/login

---

## MÉTODO 2: Via Supabase Dashboard

1. Acesse: https://lsntudnqcxprorvrrhnn.supabase.co
2. Vá em **Authentication** > **Users**
3. Clique em **Add User** > **Create new user**
4. Preencha:
   - **Email**: admin@valle360.com
   - **Password**: Admin123!
   - **Auto Confirm User**: ✅ Marque esta opção
5. Clique em **Create User**
6. Depois que o usuário for criado, clique nele
7. Vá na aba **Raw User Meta Data**
8. Adicione este JSON:
```json
{
  "role": "super_admin",
  "full_name": "Super Admin Valle 360"
}
```
9. Salve

---

## MÉTODO 3: Via SQL no Supabase (se tiver service_role_key)

Execute este SQL no SQL Editor do Supabase:

```sql
-- Buscar o ID do usuário admin@valle360.com
SELECT id FROM auth.users WHERE email = 'admin@valle360.com';

-- Atualizar os metadados do usuário
UPDATE auth.users
SET raw_user_meta_data = '{"role":"super_admin","full_name":"Super Admin Valle 360"}'::jsonb
WHERE email = 'admin@valle360.com';

-- Verificar se foi criado na tabela user_profiles
SELECT * FROM user_profiles WHERE email = 'admin@valle360.com';

-- Se não existir, criar manualmente
INSERT INTO user_profiles (id, email, full_name, role, user_type)
SELECT
  id,
  'admin@valle360.com',
  'Super Admin Valle 360',
  'super_admin',
  'admin'
FROM auth.users
WHERE email = 'admin@valle360.com'
ON CONFLICT (id) DO UPDATE SET
  role = 'super_admin',
  user_type = 'admin';
```

---

## ✅ TESTAR O LOGIN

1. Acesse: http://localhost:3000/admin/login
2. Email: **admin@valle360.com**
3. Senha: **Admin123!**
4. Você será redirecionado para: http://localhost:3000/admin/centro-inteligencia

---

## 🚨 IMPORTANTE

- O sistema já está configurado para aceitar super_admin
- A página de login está em `/admin/login`
- O redirect após login vai para `/admin/centro-inteligencia`
- Todas as ações serão registradas no audit_logs
- O sistema de permissões está 100% funcional

---

## 🐛 TROUBLESHOOTING

### Erro: "Acesso negado"
- Verifique se o campo `role` no `raw_user_meta_data` está como `super_admin`
- Verifique se o usuário existe na tabela `user_profiles` com `role = 'super_admin'`

### Erro: "Credenciais inválidas"
- Reset a senha no Supabase Dashboard
- Certifique-se que o email está confirmado (email_confirmed_at não é NULL)

### Erro: "user_type constraint violation"
- Execute a migration que corrige o constraint:
```sql
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_user_type_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_user_type_check
CHECK (user_type = ANY (ARRAY['client'::text, 'collaborator'::text, 'admin'::text]));
```
