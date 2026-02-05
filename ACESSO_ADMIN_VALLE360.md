# 🔐 ACESSO ADMIN - VALLE 360

## 📋 Credenciais de Administrador

### **Email:**
```
admin@valle360.com.br
```

### **Senha Inicial:**
```
Valle@Admin2024
```

---

## 🚀 Como Configurar o Primeiro Acesso

### **OPÇÃO 1: Via Supabase Dashboard (Recomendado)**

1. **Acesse o Supabase Dashboard:**
   - Vá para: https://supabase.com/dashboard
   - Faça login na sua conta

2. **Selecione o Projeto Valle 360**

3. **Navegue até Authentication > Users**

4. **Clique em "Add User"**

5. **Preencha os dados:**
   ```
   Email: admin@valle360.com.br
   Password: Valle@Admin2024
   ✅ Auto Confirm User
   ```

6. **Copie o User ID gerado** (algo como: `c47f4e4a-8b6d-4c9e-9e1f-2a3b4c5d6e7f`)

7. **Execute o Seed:**
   ```bash
   cd /Users/imac/Desktop/N8N/valle-360
   
   # Edite o arquivo seed.sql e substitua o ID
   # Linha 16: v_admin_user_id UUID := 'COLE_O_ID_AQUI';
   
   # Execute o seed
   psql $DATABASE_URL -f supabase/seed.sql
   ```

8. **Pronto! Agora faça login:**
   - URL: http://localhost:3000/login
   - Email: `admin@valle360.com.br`
   - Senha: `Valle@Admin2024`

---

### **OPÇÃO 2: Via Supabase CLI**

```bash
# 1. Navegue até o diretório
cd /Users/imac/Desktop/N8N/valle-360

# 2. Execute o seguinte SQL via CLI
supabase db execute "
-- Criar usuário admin
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@valle360.com.br',
  crypt('Valle@Admin2024', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  ''
) RETURNING id;
"

# 3. Copie o ID retornado e execute o seed
psql $DATABASE_URL -f supabase/seed.sql
```

---

### **OPÇÃO 3: Via SQL Editor no Supabase Dashboard**

1. **No Supabase Dashboard, vá em SQL Editor**

2. **Crie uma nova query e execute:**

```sql
-- Criar usuário admin no auth
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'c47f4e4a-8b6d-4c9e-9e1f-2a3b4c5d6e7f', -- Use um UUID fixo ou gen_random_uuid()
  'authenticated',
  'authenticated',
  'admin@valle360.com.br',
  crypt('Valle@Admin2024', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Admin Valle"}'
) ON CONFLICT (email) DO NOTHING;

-- Criar perfil do super admin
INSERT INTO user_profiles (
  id,
  user_id,
  full_name,
  email,
  role,
  user_type,
  is_active,
  avatar
) VALUES (
  gen_random_uuid(),
  'c47f4e4a-8b6d-4c9e-9e1f-2a3b4c5d6e7f', -- Mesmo UUID usado acima
  'Admin Valle',
  'admin@valle360.com.br',
  'super_admin',
  'super_admin',
  true,
  'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'
) ON CONFLICT (user_id) DO NOTHING;
```

---

## ✅ Após o Login

### **Você terá acesso a:**

1. **Dashboard Geral** - Visão 360° do negócio
2. **Clientes** - Gestão completa de clientes
3. **Colaboradores** - Gerenciamento de equipe
4. **Machine Learning** - IA e análises preditivas
5. **Inteligência de Concorrência** - Monitoramento 24/7
6. **Sales Intelligence** - SDR Automático com IA
7. **Pricing Intelligence** - Precificação inteligente
8. **Real-time Analytics** - Dashboards ao vivo
9. **Ferramentas Avançadas** - ROI, Vídeos, Gamificação
10. **Relatórios** - Relatórios automáticos

---

## 🔒 Configurar 2FA (Autenticação em Dois Fatores)

### **Após o primeiro login:**

1. Clique no seu avatar (canto superior direito)
2. Vá em **"Configurações de Segurança"**
3. Ative **"Autenticação em Dois Fatores"**
4. Escaneie o QR Code com o **Google Authenticator**
5. Digite o código de verificação

---

## 📱 Aplicativos Recomendados

### **Para 2FA:**
- 📲 **Google Authenticator** (iOS/Android)
- 🔐 **Authy** (iOS/Android/Desktop)
- 🛡️ **Microsoft Authenticator** (iOS/Android)

### **Para Monitoramento:**
- 💬 Configure notificações no **WhatsApp**
- 📧 Configure notificações no **Email**
- 💬 Configure alertas no **Slack**

---

## ❓ Problemas no Login?

### **Senha não funciona:**
1. Use a opção "Esqueceu a senha?" na tela de login
2. Verifique sua caixa de email e WhatsApp
3. Crie uma nova senha forte

### **Email não cadastrado:**
1. Verifique se executou o seed corretamente
2. Confira se o usuário foi criado no Supabase Auth
3. Entre em contato com o suporte técnico

### **2FA não funciona:**
1. Sincronize o horário do seu celular
2. Gere um novo código backup
3. Use o código de recuperação salvo

---

## 📊 Próximos Passos Após o Login

1. ✅ **Cadastrar Primeiro Cliente**
   - Menu: Admin > Clientes > Novo Cliente

2. ✅ **Cadastrar Colaboradores**
   - Menu: Admin > Colaboradores > Novo Colaborador

3. ✅ **Configurar Integrações**
   - Leia: `/Users/imac/Desktop/N8N/GUIA_CONFIGURACAO_INTEGRACOES.md`

4. ✅ **Explorar Dashboard**
   - Analytics em Tempo Real
   - Machine Learning
   - Pricing Intelligence

5. ✅ **Popular Dados Fictícios** (Opcional para testes)
   ```bash
   psql $DATABASE_URL -f supabase/seeds_dados_ficticios_completos.sql
   ```

---

## 🎉 Bem-vindo à Valle 360!

Você agora tem acesso ao **sistema de marketing mais inteligente do Brasil**, com:

- 🤖 **IA em cada decisão**
- 📊 **Analytics em tempo real**
- 💰 **Pricing inteligente**
- 🕵️ **Monitoramento de concorrentes 24/7**
- 📈 **Previsões e insights automáticos**
- 🎯 **ROI otimizado**
- 🏆 **Gamificação completa**

---

## 📞 Suporte

- 📧 Email: suporte@valle360.com.br
- 💬 WhatsApp: (15) 99999-9999
- 🌐 Docs: https://docs.valle360.com.br

---

**Última atualização:** 13 de Novembro de 2024

