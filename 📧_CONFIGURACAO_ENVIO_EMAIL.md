# 📧 Configuração de Envio de Emails

## ✅ Configurações Aplicadas

### **Remetente Configurado:**
- **Email:** guilherme@vallegroup.com.br
- **Nome:** Guilherme Valle - Valle 360
- Todos os emails do sistema serão enviados por este email

---

## 🎯 Funcionalidades Implementadas

### **1. Email de Boas-Vindas para Colaboradores** ✅
- Enviado do email: `guilherme@vallegroup.com.br`
- Para: Email pessoal do colaborador
- Contém: Credenciais de acesso (email corporativo + senha)

### **2. Configurações de Email via cPanel** ✅
- API: `/api/cpanel/send-email-settings`
- Função cPanel: `dispatch_client_settings`
- Envia automaticamente as configurações IMAP/SMTP/POP3 para o email pessoal

### **3. Criação Automática de Email Corporativo** ✅
- API: `/api/cpanel/create-email`
- Função cPanel: `add_pop`
- Cria o email com a mesma senha provisória

---

## 🔧 Opções de Configuração de Email

Você tem **3 opções** para enviar emails reais:

### **Opção 1: SendGrid (RECOMENDADO)** 🌟

**Vantagens:**
- ✅ 100 emails/dia GRÁTIS
- ✅ Fácil de configurar
- ✅ Alta deliverabilidade
- ✅ Dashboard com estatísticas

**Configuração:**

1. **Criar conta:** https://signup.sendgrid.com/
2. **Criar API Key:**
   - Acesse: Settings → API Keys
   - Clique em "Create API Key"
   - Nome: "Valle360 Production"
   - Permissões: "Full Access"
   - Copie a chave

3. **Adicionar no `.env.local`:**
```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

4. **Instalar dependência:**
```bash
cd /Users/imac/Desktop/N8N/valle-360
npm install @sendgrid/mail
```

5. **Verificar domínio (opcional mas recomendado):**
   - Settings → Sender Authentication
   - Verificar: guilherme@vallegroup.com.br

---

### **Opção 2: SMTP do seu Servidor** 🏢

**Use se você já tem email configurado no cPanel**

**Configuração:**

1. **Adicionar no `.env.local`:**
```env
# SMTP Configuration
SMTP_HOST=mail.vallegroup.com.br
SMTP_PORT=587
SMTP_USER=guilherme@vallegroup.com.br
SMTP_PASSWORD=sua_senha_email
SMTP_SECURE=false
```

2. **Instalar dependência:**
```bash
cd /Users/imac/Desktop/N8N/valle-360
npm install nodemailer
```

**Portas comuns:**
- `587` - TLS (recomendado)
- `465` - SSL
- `25` - Sem criptografia (não recomendado)

---

### **Opção 3: Gmail (Para testes)** 📮

**NÃO recomendado para produção, apenas testes**

**Configuração:**

1. **Criar senha de app no Gmail:**
   - Acesse: https://myaccount.google.com/apppasswords
   - Criar senha para "Valle360"

2. **Adicionar no `.env.local`:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=guilherme@vallegroup.com.br
SMTP_PASSWORD=sua_senha_app_16_digitos
SMTP_SECURE=false
```

3. **Instalar dependência:**
```bash
npm install nodemailer
```

---

## 📋 Configuração Completa do `.env.local`

```env
# ========================================
# SUPABASE
# ========================================
NEXT_PUBLIC_SUPABASE_URL=https://ojlcvpqhbfnehuferyci.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<NEXT_PUBLIC_SUPABASE_ANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY

# ========================================
# OPENAI
# ========================================
OPENAI_API_KEY=sk-proj-...

# ========================================
# DATABASE
# ========================================
DATABASE_URL=postgresql://postgres.<PROJECT_REF>:<DB_PASSWORD>@aws-1-us-east-1.pooler.supabase.com:6543/postgres

# ========================================
# APP
# ========================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# ========================================
# EMAIL - Remetente (OBRIGATÓRIO)
# ========================================
ADMIN_EMAIL_FROM=guilherme@vallegroup.com.br
ADMIN_EMAIL_NAME=Guilherme Valle - Valle 360
COMPANY_NAME=Valle 360

# ========================================
# EMAIL - Provedor (ESCOLHA UMA OPÇÃO)
# ========================================

# Opção 1: SendGrid (Recomendado)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# OU Opção 2: SMTP do Servidor
SMTP_HOST=mail.vallegroup.com.br
SMTP_PORT=587
SMTP_USER=guilherme@vallegroup.com.br
SMTP_PASSWORD=sua_senha_email
SMTP_SECURE=false

# ========================================
# CPANEL - Criação Automática de Emails
# ========================================
CPANEL_USER=seu_usuario_cpanel
CPANEL_PASSWORD=sua_senha_cpanel
CPANEL_DOMAIN=https://seu-servidor.com:2083
```

---

## 🔄 Fluxo Completo de Cadastro com Email

```mermaid
1. Admin cadastra colaborador
   ├─ Nome: João
   ├─ Email corporativo: joao.silva@valle360.com.br
   └─ Email pessoal: joao.pessoal@gmail.com
   ↓
2. Sistema gera senha provisória
   └─ Senha: Valle@Abc123
   ↓
3. Cria usuário no Supabase
   └─ joao.silva@valle360.com.br
   ↓
4. Cria email no cPanel
   └─ joao.silva@valle360.com.br (mesma senha)
   ↓
5. cPanel envia configurações IMAP/SMTP
   └─ Para: joao.pessoal@gmail.com
   └─ Contém: Como configurar no Outlook, Gmail, etc.
   ↓
6. Sistema envia email de boas-vindas
   └─ De: guilherme@vallegroup.com.br
   └─ Para: joao.pessoal@gmail.com
   └─ Contém: Email corporativo + Senha + Link
```

---

## 🧪 Testar Envio de Email

### **1. Com SendGrid configurado:**
```bash
# O email será enviado automaticamente
```

### **2. Sem provedor configurado:**
```bash
# Verifique os logs no terminal:
cd /Users/imac/Desktop/N8N/valle-360
tail -f /tmp/nextjs.log

# Você verá:
# ⚠️ Nenhum provedor de email configurado
# 📋 Configure SendGrid ou SMTP no .env.local
```

---

## 📊 APIs do cPanel Implementadas

### **1. `add_pop` - Criar Email**
- **Arquivo:** `/api/cpanel/create-email/route.ts`
- **Referência:** https://api.docs.cpanel.net/openapi/cpanel/operation/add_pop/
- **Uso:** Cria email corporativo automaticamente

### **2. `dispatch_client_settings` - Enviar Configurações** ✅
- **Arquivo:** `/api/cpanel/send-email-settings/route.ts`
- **Referência:** https://api.docs.cpanel.net/openapi/cpanel/operation/dispatch_client_settings/
- **Uso:** Envia IMAP/SMTP/POP3 automaticamente para o email pessoal

### **3. Outras APIs disponíveis (não implementadas):**
- `add_auto_responder` - Criar resposta automática
- `add_forwarder` - Encaminhar emails
- `add_domain_forwarder` - Encaminhar domínio inteiro

---

## ✅ Checklist de Configuração

- [x] Configurar email remetente no `.env.local`
- [x] Criar API de envio de email
- [x] Criar API de configurações do cPanel
- [x] Integrar com cadastro de colaborador
- [ ] **PENDENTE:** Escolher e configurar provedor de email (SendGrid ou SMTP)
- [ ] **PENDENTE:** Instalar dependência (@sendgrid/mail ou nodemailer)
- [ ] **PENDENTE:** Testar cadastro completo

---

## 🎯 Próximo Passo: Configurar Provedor de Email

### **Recomendação: SendGrid**

1. **Criar conta grátis:** https://signup.sendgrid.com/
2. **Criar API Key**
3. **Adicionar no `.env.local`:**
```env
SENDGRID_API_KEY=SG.sua_chave_aqui
```
4. **Instalar:**
```bash
cd /Users/imac/Desktop/N8N/valle-360
npm install @sendgrid/mail
```
5. **Reiniciar servidor:**
```bash
pkill -f "next dev"
npm run dev
```

---

🎉 **Pronto!** Com isso, os emails serão enviados automaticamente do seu email `guilherme@vallegroup.com.br` para o email pessoal dos colaboradores!



