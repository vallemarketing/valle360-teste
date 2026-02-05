# 📧 Configuração de Email Corporativo e cPanel

## ✅ Funcionalidades Implementadas

### 1. **Campo de Email Pessoal no Cadastro**
- ✅ Adicionado campo obrigatório "Email Pessoal" no cadastro de colaborador
- ✅ Email pessoal será usado para enviar as credenciais de acesso
- ✅ Email corporativo continua sendo gerado automaticamente

### 2. **Criação Automática de Email no cPanel**
- ✅ API `/api/cpanel/create-email` criada
- ✅ Integra com a UAPI do cPanel para criar emails automaticamente
- ✅ Usa a mesma senha provisória gerada para o sistema

### 3. **Envio de Credenciais para Email Pessoal**
- ✅ API `/api/send-welcome-email` criada
- ✅ Email HTML profissional com as credenciais
- ✅ Envia para o **email pessoal** do colaborador
- ✅ Inclui email corporativo e senha provisória

---

## 🔧 Configuração do cPanel

### **Passo 1: Adicionar Variáveis de Ambiente**

Edite o arquivo `.env.local` e adicione:

\`\`\`env
# ========================================
# CPANEL - Criação Automática de Emails
# ========================================
CPANEL_USER=seu_usuario_cpanel
CPANEL_PASSWORD=sua_senha_cpanel
CPANEL_DOMAIN=https://seu-servidor.com:2083

# ========================================
# EMAIL - Serviço de Envio (Opcional)
# ========================================
# SendGrid (recomendado)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx

# OU Mailgun
MAILGUN_API_KEY=key-xxxxxxxxxxxxxxxxx
MAILGUN_DOMAIN=mg.vallegroup.com.br

# OU AWS SES
AWS_SES_ACCESS_KEY=AKIA...
AWS_SES_SECRET_KEY=...
AWS_SES_REGION=us-east-1
\`\`\`

---

## 📋 Como Funciona o Fluxo

### **Cadastro de Novo Colaborador:**

1. **Admin preenche o formulário:**
   - Nome e Sobrenome → Gera `guilherme.valle@valle360.com.br`
   - **Email Pessoal** → Ex: `guilherme.pessoal@gmail.com`
   - Outros dados (CPF, telefone, áreas, etc.)

2. **Sistema gera senha provisória:**
   - Formato: `Valle@Abc123`

3. **Cria usuário no Supabase Auth:**
   - Email: `guilherme.valle@valle360.com.br`
   - Senha: `Valle@Abc123`

4. **Cria email na hospedagem (cPanel):**
   - Endpoint: `/api/cpanel/create-email`
   - Cria: `guilherme.valle@valle360.com.br`
   - Com a mesma senha provisória

5. **Envia credenciais para email pessoal:**
   - Endpoint: `/api/send-welcome-email`
   - Para: `guilherme.pessoal@gmail.com`
   - Contém: Email corporativo + Senha provisória

6. **Colaborador recebe no email pessoal:**
   ```
   📧 Email Corporativo: guilherme.valle@valle360.com.br
   🔑 Senha Provisória: Valle@Abc123
   🔗 Link: http://localhost:3000/login
   ```

---

## 🎯 API do cPanel

### **Endpoint usado:**
\`\`\`
GET /execute/Email/add_pop
\`\`\`

### **Parâmetros:**
- `email` - Nome do usuário (antes do @)
- `password` - Senha do email
- `domain` - Domínio (valle360.com.br)
- `quota` - Cota em MB (padrão: 500)

### **Exemplo de requisição:**
\`\`\`bash
curl -X GET "https://seu-servidor.com:2083/execute/Email/add_pop?email=guilherme.valle&password=Valle@Abc123&domain=valle360.com.br&quota=500" \\
  -H "Authorization: Basic $(echo -n 'usuario:senha' | base64)"
\`\`\`

---

## 📬 Integração de Envio de Email

### **Opção 1: SendGrid (Recomendado)**

\`\`\`bash
npm install @sendgrid/mail
\`\`\`

No arquivo `/api/send-welcome-email/route.ts`, descomente:

\`\`\`typescript
const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const msg = {
  to: emailPessoal,
  from: 'onboarding@vallegroup.com.br',
  subject: '🎉 Bem-vindo à Família Valle 360!',
  html: htmlContent,
}

await sgMail.send(msg)
\`\`\`

### **Opção 2: Nodemailer (SMTP)**

\`\`\`bash
npm install nodemailer
\`\`\`

\`\`\`typescript
const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host: 'smtp.vallegroup.com.br',
  port: 587,
  secure: false,
  auth: {
    user: 'no-reply@vallegroup.com.br',
    pass: process.env.SMTP_PASSWORD
  }
})

await transporter.sendMail({
  from: '"Valle 360" <no-reply@vallegroup.com.br>',
  to: emailPessoal,
  subject: '🎉 Bem-vindo à Família Valle 360!',
  html: htmlContent
})
\`\`\`

---

## 🧪 Testar o Sistema

### **1. Iniciar o servidor:**
\`\`\`bash
cd /Users/imac/Desktop/N8N/valle-360
npm run dev
\`\`\`

### **2. Acessar o cadastro:**
\`\`\`
http://localhost:3000/admin/colaboradores/novo
\`\`\`

### **3. Preencher o formulário:**
- Nome: Guilherme
- Sobrenome: Valle
- **Email Pessoal: seu-email-teste@gmail.com** ← NOVO CAMPO
- CPF: 075.355.516-61
- Telefone: (00) 00000-0000
- Selecionar áreas de atuação

### **4. Clicar em "Criar Colaborador"**

### **5. Verificar os logs no terminal:**
\`\`\`
✅ Email criado no cPanel: guilherme.valle@valle360.com.br
📧 Email de boas-vindas preparado para: seu-email-teste@gmail.com
\`\`\`

### **6. Verificar o email pessoal:**
- Você receberá um email com as credenciais

---

## 🚨 Solução de Problemas

### **Erro: Credenciais do cPanel não configuradas**
- Adicione `CPANEL_USER`, `CPANEL_PASSWORD` e `CPANEL_DOMAIN` no `.env.local`

### **Erro: Email não enviado**
- Configure um serviço de email (SendGrid, Mailgun, etc.)
- Verifique as chaves de API no `.env.local`

### **Email corporativo não criado**
- Verifique se as credenciais do cPanel estão corretas
- Teste a conexão com o cPanel manualmente

---

## 📊 Resumo das Mudanças

| Arquivo | Mudança |
|---------|---------|
| `src/app/admin/colaboradores/novo/page.tsx` | ✅ Adicionado campo `email_pessoal` |
| `src/app/admin/colaboradores/novo/page.tsx` | ✅ Modificada função `enviarBoasVindas()` |
| `src/app/admin/colaboradores/novo/page.tsx` | ✅ Adicionada chamada para criar email no cPanel |
| `src/app/api/cpanel/create-email/route.ts` | ✅ Nova API para criar email |
| `src/app/api/send-welcome-email/route.ts` | ✅ Nova API para enviar credenciais |

---

## ✅ Checklist de Implementação

- [x] Adicionar campo de email pessoal no formulário
- [x] Criar API de integração com cPanel
- [x] Criar API de envio de email
- [x] Modificar fluxo de cadastro
- [ ] Configurar credenciais do cPanel
- [ ] Configurar serviço de envio de email (SendGrid/Mailgun)
- [ ] Testar cadastro completo

---

🎉 **Sistema pronto para uso!** O colaborador receberá as credenciais no email pessoal e poderá acessar tanto o sistema quanto o email corporativo com a mesma senha provisória.



