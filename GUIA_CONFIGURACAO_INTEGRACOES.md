# 🔗 GUIA COMPLETO DE CONFIGURAÇÃO DE INTEGRAÇÕES

## 📋 **ÍNDICE**

1. [Supabase](#1-supabase)
2. [iFood Delivery](#2-ifood-delivery)
3. [PIX / Pagamentos](#3-pix--pagamentos)
4. [Slack](#4-slack)
5. [WhatsApp Business](#5-whatsapp-business)
6. [Email (SendGrid)](#6-email-sendgrid)
7. [N8N](#7-n8n)
8. [Monitoramento (Sentry)](#8-monitoramento-sentry)

---

## **1. SUPABASE**

### **1.1. Configuração Inicial**

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Inicializar projeto
cd valle-360
supabase init

# Link com projeto remoto
supabase link --project-ref YOUR_PROJECT_REF
```

### **1.2. Executar Migrations**

```bash
# Push todas as migrations
supabase db push

# Ou executar manualmente
supabase db reset
```

### **1.3. Configurar .env**

```env
# .env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.your-project.supabase.co:5432/postgres
```

### **1.4. Configurar RLS (Row Level Security)**

✅ **Já está configurado nas migrations!**

Teste com:
```sql
-- Verificar políticas
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

### **1.5. Configurar Cron Jobs**

```sql
-- No Supabase Dashboard -> Database -> Cron Jobs

-- 1. Relatórios Diários (7h)
SELECT cron.schedule(
  'generate-daily-reports',
  '0 7 * * *',
  $$ SELECT generate_all_daily_reports(CURRENT_DATE); $$
);

-- 2. Detectar Aniversários (6h)
SELECT cron.schedule(
  'birthday-detection',
  '0 6 * * *',
  $$
    SELECT create_birthday_celebration(employee_id)
    FROM detect_birthdays_today()
    WHERE NOT already_celebrated;
  $$
);

-- 3. Predições de Churn (3h)
SELECT cron.schedule(
  'churn-predictions',
  '0 3 * * *',
  $$
    SELECT predict_employee_churn(id) FROM employees WHERE is_active = true;
    SELECT predict_client_churn(id) FROM clients WHERE is_active = true;
  $$
);

-- 4. Análise Comportamental (6h)
SELECT cron.schedule(
  'behavioral-analysis',
  '0 6 * * *',
  $$
    SELECT analyze_employee_behavior(id, CURRENT_DATE) 
    FROM employees WHERE is_active = true;
  $$
);
```

---

## **2. iFOOD DELIVERY**

### **2.1. Criar Conta Merchant**

1. Acesse: https://portal.ifood.com.br/
2. Crie conta empresarial
3. Solicite acesso à API

### **2.2. Obter Credenciais**

```bash
# No Portal iFood:
# Dashboard -> Integrações -> API Keys

IFOOD_CLIENT_ID=your_client_id
IFOOD_CLIENT_SECRET=your_client_secret
IFOOD_MERCHANT_ID=your_merchant_id
```

### **2.3. Configurar no Banco**

```sql
INSERT INTO food_order_integrations (
  provider_name,
  api_key,
  api_secret,
  merchant_id,
  is_active
) VALUES (
  'ifood',
  'your_client_id',
  'your_client_secret',
  'your_merchant_id',
  true
);
```

### **2.4. Testar Integração**

```typescript
// test-ifood.ts
import axios from 'axios';

async function testIFood() {
  const auth = await axios.post('https://merchant-api.ifood.com.br/authentication/v1.0/oauth/token', {
    grantType: 'client_credentials',
    clientId: process.env.IFOOD_CLIENT_ID,
    clientSecret: process.env.IFOOD_CLIENT_SECRET
  });
  
  console.log('Token:', auth.data.accessToken);
  
  // Fazer pedido de teste
  const order = await axios.post('https://merchant-api.ifood.com.br/order/v1.0/orders', {
    merchantId: process.env.IFOOD_MERCHANT_ID,
    items: [{
      name: 'Pizza Margherita',
      quantity: 1,
      price: 50.00
    }],
    deliveryAddress: {
      street: 'Rua Teste',
      number: '123'
    }
  }, {
    headers: {
      'Authorization': `Bearer ${auth.data.accessToken}`
    }
  });
  
  console.log('Pedido criado:', order.data);
}

testIFood();
```

### **2.5. Alternativas**

Se iFood não disponível:
- **Rappi**: https://partners.rappi.com/
- **Uber Eats**: https://www.uber.com/br/pt-br/business/eats/
- **Custom**: Use qualquer API de delivery local

---

## **3. PIX / PAGAMENTOS**

### **3.1. Banco com API PIX**

Opções recomendadas:
- **Banco Inter**: API PIX gratuita
- **Mercado Pago**: Fácil integração
- **PagSeguro**: API completa
- **Asaas**: Focado em automação

### **3.2. Configurar Banco Inter (Exemplo)**

```bash
# 1. Criar conta Banco Inter PJ
# 2. Solicitar acesso à API
# 3. Obter certificado digital

BANCO_INTER_CLIENT_ID=your_client_id
BANCO_INTER_CLIENT_SECRET=your_client_secret
BANCO_INTER_CERT_PATH=/path/to/cert.pem
BANCO_INTER_KEY_PATH=/path/to/key.pem
```

### **3.3. Implementar PIX**

```typescript
// lib/pix.ts
import axios from 'axios';
import fs from 'fs';
import https from 'https';

export async function sendPix(
  pixKey: string,
  amount: number,
  description: string
) {
  // Carregar certificado
  const httpsAgent = new https.Agent({
    cert: fs.readFileSync(process.env.BANCO_INTER_CERT_PATH!),
    key: fs.readFileSync(process.env.BANCO_INTER_KEY_PATH!)
  });
  
  // Obter token
  const auth = await axios.post(
    'https://cdpj.partners.bancointer.com.br/oauth/v2/token',
    {
      client_id: process.env.BANCO_INTER_CLIENT_ID,
      client_secret: process.env.BANCO_INTER_CLIENT_SECRET,
      scope: 'pix.write',
      grant_type: 'client_credentials'
    },
    { httpsAgent }
  );
  
  // Criar PIX
  const pix = await axios.post(
    'https://cdpj.partners.bancointer.com.br/banking/v2/pix',
    {
      valor: amount,
      chave: pixKey,
      descricao: description
    },
    {
      httpsAgent,
      headers: {
        'Authorization': `Bearer ${auth.data.access_token}`
      }
    }
  );
  
  return pix.data;
}

// Uso:
await sendPix('joao@email.com', 100.00, 'Presente de aniversário');
```

### **3.4. Alternativa: Mercado Pago**

```typescript
// lib/mercadopago.ts
import mercadopago from 'mercadopago';

mercadopago.configure({
  access_token: process.env.MERCADOPAGO_ACCESS_TOKEN!
});

export async function sendMoneyMercadoPago(
  email: string,
  amount: number,
  description: string
) {
  const payment = await mercadopago.payment.create({
    transaction_amount: amount,
    description: description,
    payment_method_id: 'pix',
    payer: {
      email: email
    }
  });
  
  return payment.body;
}
```

---

## **4. SLACK**

### **4.1. Criar App Slack**

1. Acesse: https://api.slack.com/apps
2. Crie novo app
3. Adicione Bot User
4. Instale no workspace

### **4.2. Obter Token**

```bash
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret
SLACK_CHANNEL_ID=C01234567
```

### **4.3. Configurar Permissões**

Scopes necessários:
- `chat:write`
- `chat:write.public`
- `users:read`
- `channels:read`

### **4.4. Testar**

```typescript
// test-slack.ts
import { WebClient } from '@slack/web-api';

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

async function testSlack() {
  const result = await slack.chat.postMessage({
    channel: '#general',
    text: '🎂 Hoje é aniversário do João! Vamos todos parabenizar! 🎉'
  });
  
  console.log('Mensagem enviada:', result.ts);
}

testSlack();
```

### **4.5. Integrar com N8N**

No N8N, adicione credencial Slack com o token.

---

## **5. WHATSAPP BUSINESS**

### **5.1. Criar Conta Business**

1. Acesse: https://business.facebook.com/
2. Crie conta Business
3. Adicione WhatsApp Business

### **5.2. Configurar API**

```bash
WHATSAPP_BUSINESS_ACCOUNT_ID=your_account_id
WHATSAPP_PHONE_NUMBER_ID=your_phone_id
WHATSAPP_ACCESS_TOKEN=your_access_token
```

### **5.3. Criar Templates**

Templates necessários:
- **birthday_celebration**: "Feliz aniversário, {{1}}! 🎂"
- **task_reminder**: "Oi {{1}}! Você tem tarefas pendentes: {{2}}"
- **churn_alert**: "Olá! Notamos que você está ausente. Tudo bem? 😊"

### **5.4. Enviar Mensagem**

```typescript
// lib/whatsapp.ts
import axios from 'axios';

export async function sendWhatsApp(
  to: string,
  templateName: string,
  parameters: string[]
) {
  const response = await axios.post(
    `https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: 'whatsapp',
      to: to,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: 'pt_BR'
        },
        components: [
          {
            type: 'body',
            parameters: parameters.map(p => ({
              type: 'text',
              text: p
            }))
          }
        ]
      }
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  return response.data;
}

// Uso:
await sendWhatsApp('+5511999999999', 'birthday_celebration', ['João']);
```

---

## **6. EMAIL (SENDGRID)**

### **6.1. Criar Conta SendGrid**

1. Acesse: https://sendgrid.com/
2. Crie conta
3. Verifique domínio

### **6.2. Obter API Key**

```bash
SENDGRID_API_KEY=SG.your-api-key
SENDGRID_FROM_EMAIL=no-reply@valle360.com
SENDGRID_FROM_NAME=Valle 360
```

### **6.3. Configurar**

```typescript
// lib/email.ts
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  templateId?: string
) {
  const msg = {
    to: to,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL!,
      name: process.env.SENDGRID_FROM_NAME!
    },
    subject: subject,
    html: html,
    ...(templateId && { templateId })
  };
  
  const result = await sgMail.send(msg);
  return result;
}

// Uso:
await sendEmail(
  'joao@empresa.com',
  'Feliz Aniversário! 🎂',
  '<html>...</html>'
);
```

### **6.4. Criar Templates**

No SendGrid Dashboard:
1. Email API -> Dynamic Templates
2. Criar templates para:
   - Boas-vindas
   - Aniversário
   - Relatórios diários
   - Alertas

---

## **7. N8N**

### **7.1. Instalar N8N**

```bash
# Opção 1: Docker
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n

# Opção 2: NPM
npm install -g n8n
n8n start
```

### **7.2. Configurar Credenciais**

No N8N (http://localhost:5678):

1. **Supabase**:
   - Credentials -> Add
   - Type: Postgres
   - Host: db.your-project.supabase.co
   - Database: postgres
   - User: postgres
   - Password: [sua senha]

2. **SendGrid**:
   - Credentials -> Add
   - Type: SendGrid
   - API Key: [seu key]

3. **Slack**:
   - Credentials -> Add
   - Type: Slack
   - OAuth Token: [seu token]

### **7.3. Importar Workflows**

1. Copie o conteúdo de `WORKFLOWS_N8N_COMPLETOS.json`
2. No N8N: Workflows -> Import from File
3. Cole o JSON
4. Ative os workflows

### **7.4. Configurar Webhooks**

Para workflows com webhook trigger:
```
https://your-n8n-instance.com/webhook/motivation-trigger
```

Use no código:
```typescript
await axios.post('https://your-n8n-instance.com/webhook/motivation-trigger', {
  event_type: 'goal_achieved',
  employee_id: 'uuid-here'
});
```

---

## **8. MONITORAMENTO (SENTRY)**

### **8.1. Criar Conta Sentry**

1. Acesse: https://sentry.io/
2. Crie projeto Next.js

### **8.2. Configurar**

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

### **8.3. Monitorar Erros**

```typescript
try {
  await sendPix(pixKey, amount, description);
} catch (error) {
  Sentry.captureException(error);
  throw error;
}
```

---

## **9. CHECKLIST FINAL**

### **✅ Supabase**
- [ ] Migrations executadas
- [ ] RLS configurado
- [ ] Cron jobs ativos
- [ ] Variáveis de ambiente configuradas

### **✅ iFood**
- [ ] Conta merchant criada
- [ ] API keys obtidas
- [ ] Integração testada
- [ ] Configurado no banco

### **✅ PIX**
- [ ] Banco escolhido
- [ ] Certificados obtidos
- [ ] Função sendPix implementada
- [ ] Testes realizados

### **✅ Slack**
- [ ] App criado
- [ ] Bot token obtido
- [ ] Permissões configuradas
- [ ] Canal #general configurado

### **✅ WhatsApp**
- [ ] Conta Business criada
- [ ] Templates aprovados
- [ ] API key obtida
- [ ] Testes realizados

### **✅ Email**
- [ ] SendGrid configurado
- [ ] Domínio verificado
- [ ] Templates criados
- [ ] Testes de envio

### **✅ N8N**
- [ ] Instalado e rodando
- [ ] Workflows importados
- [ ] Credenciais configuradas
- [ ] Workflows ativos

### **✅ Monitoramento**
- [ ] Sentry configurado
- [ ] Logs implementados
- [ ] Alertas configurados

---

## **10. TROUBLESHOOTING**

### **Erro: "RLS policy violation"**
```sql
-- Verificar políticas
SELECT * FROM pg_policies WHERE tablename = 'sua_tabela';

-- Desabilitar RLS temporariamente (apenas para debug!)
ALTER TABLE sua_tabela DISABLE ROW LEVEL SECURITY;
```

### **Erro: "PIX transaction failed"**
```typescript
// Verificar certificado
console.log(fs.existsSync(process.env.BANCO_INTER_CERT_PATH));

// Testar autenticação
const auth = await testBankAuth();
console.log('Token:', auth);
```

### **Erro: "N8N workflow not triggering"**
- Verificar se workflow está ativo
- Checar cron expression
- Ver logs: Settings -> Log Streaming

### **Erro: "Email not sending"**
```typescript
// Testar SendGrid
const test = await sgMail.send({
  to: 'test@example.com',
  from: process.env.SENDGRID_FROM_EMAIL,
  subject: 'Test',
  text: 'Test'
});
console.log('Email sent:', test);
```

---

## **11. PRÓXIMOS PASSOS**

Após configurar tudo:

1. ✅ Executar seeds
2. ✅ Testar cada integração individualmente
3. ✅ Ativar workflows N8N um por um
4. ✅ Monitorar logs por 24h
5. ✅ Ajustar configurações conforme necessário

---

**🎉 Pronto! Todas as integrações configuradas!**

*Documentação criada em: 12 de Novembro de 2024*

