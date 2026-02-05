# 🚀 GUIA COMPLETO DE DEPLOY - VALLE 360

## 📋 **ÍNDICE**

1. [Pré-requisitos](#1-pré-requisitos)
2. [Deploy Supabase](#2-deploy-supabase)
3. [Deploy Frontend (Vercel)](#3-deploy-frontend-vercel)
4. [Deploy N8N](#4-deploy-n8n)
5. [Configurações Finais](#5-configurações-finais)
6. [Monitoramento](#6-monitoramento)
7. [Backup e Segurança](#7-backup-e-segurança)

---

## **1. PRÉ-REQUISITOS**

### **Contas Necessárias:**
- ✅ Supabase (banco de dados)
- ✅ Vercel (frontend)
- ✅ Railway/Render (N8N)
- ✅ Domínio próprio (opcional)
- ✅ SendGrid (email)
- ✅ Sentry (monitoramento)

### **Ferramentas:**
```bash
# Instalar CLIs
npm install -g supabase vercel

# Verificar instalação
supabase --version
vercel --version
```

---

## **2. DEPLOY SUPABASE**

### **2.1. Criar Projeto**

1. Acesse: https://supabase.com/dashboard
2. New Project
3. Escolha:
   - Nome: `valle-360`
   - Região: São Paulo (South America)
   - Database Password: [senha forte]
   - Plan: Pro ($25/mês recomendado)

### **2.2. Executar Migrations**

```bash
# Conectar ao projeto
cd /Users/imac/Desktop/N8N/valle-360
supabase link --project-ref YOUR_PROJECT_REF

# Executar todas as migrations
supabase db push

# Verificar status
supabase db remote commit
```

### **2.3. Executar Seeds**

```bash
# Via CLI
psql $DATABASE_URL -f supabase/seed.sql

# Ou via Dashboard
# SQL Editor -> Cole o conteúdo de seed.sql -> Run
```

### **2.4. Configurar Cron Jobs**

No Dashboard: Database -> Cron Jobs

```sql
-- 1. Relatórios Diários (7h BRT)
SELECT cron.schedule(
  'generate-daily-reports',
  '0 10 * * *', -- 7h BRT = 10h UTC
  $$ SELECT generate_all_daily_reports(CURRENT_DATE); $$
);

-- 2. Aniversários (6h BRT)
SELECT cron.schedule(
  'birthday-detection',
  '0 9 * * *', -- 6h BRT = 9h UTC
  $$
    SELECT create_birthday_celebration(employee_id)
    FROM detect_birthdays_today()
    WHERE NOT already_celebrated;
  $$
);

-- 3. Churn Predictions (3h BRT)
SELECT cron.schedule(
  'churn-predictions',
  '0 6 * * *', -- 3h BRT = 6h UTC
  $$
    SELECT predict_employee_churn(id) FROM employees WHERE is_active = true;
    SELECT predict_client_churn(id) FROM clients WHERE is_active = true;
  $$
);

-- 4. Análises Comportamentais (6h BRT)
SELECT cron.schedule(
  'behavioral-analysis',
  '0 9 * * *',
  $$
    SELECT analyze_employee_behavior(id, CURRENT_DATE) 
    FROM employees WHERE is_active = true;
  $$
);

-- 5. Health Score Update (Daily)
SELECT cron.schedule(
  'health-score-update',
  '0 8 * * *',
  $$
    SELECT calculate_client_health_score(id) FROM clients WHERE is_active = true;
  $$
);
```

### **2.5. Configurar Storage**

```sql
-- Criar buckets
INSERT INTO storage.buckets (id, name, public) VALUES
('avatars', 'avatars', true),
('documents', 'documents', false),
('attachments', 'attachments', false),
('production-files', 'production-files', false);

-- Políticas de acesso
-- (Já estão nas migrations!)
```

### **2.6. Anotar Credenciais**

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.your-project.supabase.co:5432/postgres
```

---

## **3. DEPLOY FRONTEND (VERCEL)**

### **3.1. Preparar Projeto**

```bash
cd valle-360

# Criar .env.production
cat > .env.production << EOF
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Integrações
SENDGRID_API_KEY=SG.your-key
SLACK_BOT_TOKEN=xoxb-your-token
WHATSAPP_ACCESS_TOKEN=your-token

# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id

# N8N
N8N_WEBHOOK_URL=https://your-n8n.railway.app/webhook

# Banco (PIX)
BANCO_INTER_CLIENT_ID=your-id
BANCO_INTER_CLIENT_SECRET=your-secret

# iFood
IFOOD_CLIENT_ID=your-id
IFOOD_CLIENT_SECRET=your-secret
IFOOD_MERCHANT_ID=your-merchant-id
EOF
```

### **3.2. Otimizar Build**

```json
// next.config.js
module.exports = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['your-project.supabase.co', 'api.dicebear.com'],
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
}
```

### **3.3. Deploy na Vercel**

```bash
# Login
vercel login

# Deploy
vercel --prod

# Ou via Dashboard:
# 1. https://vercel.com/new
# 2. Import Git Repository
# 3. Selecione valle-360
# 4. Adicione variáveis de ambiente
# 5. Deploy!
```

### **3.4. Configurar Domínio**

```bash
# Via CLI
vercel domains add valle360.com.br
vercel domains add www.valle360.com.br

# Ou via Dashboard:
# Settings -> Domains -> Add
```

### **3.5. Configurar DNS**

No seu provedor de DNS (Cloudflare, GoDaddy, etc):

```
Type: A
Name: @
Value: 76.76.21.21 (Vercel IP)

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

---

## **4. DEPLOY N8N**

### **Opção A: Railway (Recomendado)**

#### **4.1. Criar Conta**
1. Acesse: https://railway.app/
2. Sign up with GitHub

#### **4.2. Deploy N8N**

```bash
# 1. New Project
# 2. Deploy from Template
# 3. Buscar "n8n"
# 4. Configurar variáveis:

N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=sua-senha-forte

N8N_HOST=0.0.0.0
N8N_PORT=5678
N8N_PROTOCOL=https
WEBHOOK_URL=https://your-n8n.railway.app

# Database (Postgres do Railway)
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=${{Postgres.RAILWAY_PRIVATE_DOMAIN}}
DB_POSTGRESDB_PORT=${{Postgres.RAILWAY_TCP_PORT}}
DB_POSTGRESDB_DATABASE=${{Postgres.PGDATABASE}}
DB_POSTGRESDB_USER=${{Postgres.PGUSER}}
DB_POSTGRESDB_PASSWORD=${{Postgres.PGPASSWORD}}

# 5. Deploy!
```

#### **4.3. Importar Workflows**

1. Acesse: https://your-n8n.railway.app
2. Login com credenciais acima
3. Workflows -> Import from File
4. Cole conteúdo de `WORKFLOWS_N8N_COMPLETOS.json`
5. Configure credenciais
6. Ative workflows

### **Opção B: Render**

```yaml
# render.yaml
services:
  - type: web
    name: n8n
    env: docker
    dockerfilePath: ./Dockerfile
    envVars:
      - key: N8N_BASIC_AUTH_ACTIVE
        value: true
      - key: N8N_BASIC_AUTH_USER
        value: admin
      - key: N8N_BASIC_AUTH_PASSWORD
        generateValue: true
```

### **4.4. Testar Workflows**

```bash
# Testar webhook de motivação
curl -X POST https://your-n8n.railway.app/webhook/motivation-trigger \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "goal_achieved",
    "employee_id": "uuid-here"
  }'

# Verificar resposta
# Status 200 = sucesso!
```

---

## **5. CONFIGURAÇÕES FINAIS**

### **5.1. Configurar SSL/HTTPS**

✅ Vercel: Automático
✅ Railway: Automático
✅ Supabase: Automático

### **5.2. Configurar CORS**

No Supabase Dashboard: Authentication -> URL Configuration

```
Site URL: https://valle360.com.br
Redirect URLs: 
  https://valle360.com.br/auth/callback
  https://www.valle360.com.br/auth/callback
```

### **5.3. Criar Primeiro Usuário Admin**

```sql
-- Via Supabase Dashboard -> Authentication -> Users

-- Criar usuário
-- Email: admin@valle360.com
-- Password: [senha forte]
-- Confirm Email: Yes

-- Depois, no SQL Editor:
INSERT INTO user_profiles (
  user_id,
  full_name,
  email,
  role,
  user_type,
  is_active
) VALUES (
  'USER_ID_FROM_AUTH', -- Copie o ID do usuário criado
  'Admin Valle',
  'admin@valle360.com',
  'super_admin',
  'super_admin',
  true
);
```

### **5.4. Configurar Emails Transacionais**

```typescript
// lib/email-config.ts
export const emailConfig = {
  from: {
    email: 'no-reply@valle360.com.br',
    name: 'Valle 360'
  },
  replyTo: 'contato@valle360.com.br',
  templates: {
    welcome: 'd-abc123',
    birthday: 'd-def456',
    report: 'd-ghi789'
  }
};
```

---

## **6. MONITORAMENTO**

### **6.1. Sentry**

```bash
# Já configurado nas instruções anteriores
# Verificar: https://sentry.io/organizations/your-org/projects/valle-360/
```

### **6.2. Vercel Analytics**

```bash
# Habilitar no Dashboard
# Settings -> Analytics -> Enable
```

### **6.3. Supabase Logs**

```bash
# Ver logs de produção
supabase logs --project-ref YOUR_PROJECT_REF

# Logs em tempo real
supabase logs --project-ref YOUR_PROJECT_REF --tail
```

### **6.4. Alertas**

Configure alertas no Sentry:
- Erro de database
- Falha em integração
- Taxa de erro > 5%
- Latência > 3s

---

## **7. BACKUP E SEGURANÇA**

### **7.1. Backup Automático**

Supabase faz backup automático (plano Pro):
- Point-in-time recovery (7 dias)
- Daily backups (30 dias)

Para backup manual:
```bash
# Backup completo
supabase db dump --project-ref YOUR_PROJECT_REF > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

### **7.2. Segurança**

```bash
# Habilitar 2FA no Supabase
# Dashboard -> Account -> Security -> Enable 2FA

# Rotacionar senhas a cada 90 dias
# Dashboard -> Settings -> Database -> Reset Password

# Monitorar acessos
# Dashboard -> Logs -> API Logs
```

### **7.3. Rate Limiting**

```typescript
// middleware.ts
import { rateLimit } from '@/lib/rate-limit';

export async function middleware(request: NextRequest) {
  const ip = request.ip ?? 'unknown';
  
  const { success, remaining } = await rateLimit.check(ip);
  
  if (!success) {
    return new Response('Too many requests', { status: 429 });
  }
  
  return NextResponse.next();
}
```

---

## **8. CHECKLIST FINAL DE DEPLOY**

### **✅ Supabase**
- [ ] Projeto criado
- [ ] Migrations executadas
- [ ] Seeds populados
- [ ] Cron jobs configurados
- [ ] Storage configurado
- [ ] Backup habilitado

### **✅ Frontend (Vercel)**
- [ ] Deploy realizado
- [ ] Variáveis de ambiente configuradas
- [ ] Domínio configurado
- [ ] SSL ativo
- [ ] Analytics habilitado

### **✅ N8N (Railway)**
- [ ] Deploy realizado
- [ ] Workflows importados
- [ ] Credenciais configuradas
- [ ] Workflows testados
- [ ] Logs monitorados

### **✅ Integrações**
- [ ] SendGrid configurado
- [ ] Slack conectado
- [ ] WhatsApp ativo
- [ ] iFood/PIX testados

### **✅ Monitoramento**
- [ ] Sentry configurado
- [ ] Alertas ativos
- [ ] Logs monitorados

### **✅ Segurança**
- [ ] 2FA habilitado
- [ ] Senhas fortes
- [ ] Rate limiting ativo
- [ ] CORS configurado

### **✅ Acesso**
- [ ] Admin criado
- [ ] Primeiro login testado
- [ ] Permissões verificadas

---

## **9. PRIMEIROS PASSOS PÓS-DEPLOY**

### **Dia 1:**
1. ✅ Login como admin
2. ✅ Criar 3-5 usuários de teste
3. ✅ Criar 2 clientes de exemplo
4. ✅ Testar criação de tarefas no Kanban
5. ✅ Enviar email de teste

### **Dia 2:**
1. ✅ Configurar relatórios diários
2. ✅ Testar workflow de aniversário
3. ✅ Verificar cron jobs rodaram
4. ✅ Monitorar logs por 24h

### **Dia 3:**
1. ✅ Onboarding do time
2. ✅ Treinamento básico
3. ✅ Configurar preferências
4. ✅ Feedback inicial

### **Semana 1:**
1. ✅ Ajustar automações
2. ✅ Otimizar performance
3. ✅ Resolver bugs
4. ✅ Documentar processos

---

## **10. TROUBLESHOOTING COMUM**

### **Erro: "Migration failed"**
```bash
# Reset e tentar novamente
supabase db reset --project-ref YOUR_PROJECT_REF
supabase db push
```

### **Erro: "N8N workflow não executa"**
```bash
# Verificar:
1. Workflow está ativo? (toggle no canto superior direito)
2. Credenciais corretas?
3. Logs do Railway: ver erros
4. Testar manualmente: "Execute Workflow"
```

### **Erro: "Email não envia"**
```typescript
// Testar SendGrid
import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

await sgMail.send({
  to: 'test@example.com',
  from: 'no-reply@valle360.com.br',
  subject: 'Test',
  text: 'Test email'
});
```

### **Erro: "Slow queries"**
```sql
-- Ver queries lentas
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Adicionar índices se necessário
CREATE INDEX idx_table_column ON table(column);
```

---

## **11. CUSTOS MENSAIS ESTIMADOS**

```
Supabase Pro: $25/mês
Vercel Pro: $20/mês
Railway (N8N): $5-10/mês
SendGrid Essentials: $20/mês (40k emails)
Sentry Team: $26/mês
Domínio: $15/ano

Total: ~$70-75/mês
```

---

## **12. SUPORTE E COMUNIDADE**

- **Documentação**: https://docs.valle360.com.br
- **Status**: https://status.valle360.com.br
- **Suporte**: suporte@valle360.com.br
- **Slack**: #valle-360-suporte

---

**🎉 DEPLOY COMPLETO!**

Sistema no ar e funcionando! 🚀

*Guia criado em: 12 de Novembro de 2024*
*Valle 360 - Em Produção*

