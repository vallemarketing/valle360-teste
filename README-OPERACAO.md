# Operação (passo a passo) — Valle 360

## 1) Pré-requisitos (Vercel)
- **Env Vars obrigatórias (mínimo viável)**:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_APP_URL` (URL do deploy)
  - `CRON_SECRET` (string forte)
  - `OPENROUTER_API_KEY` (IA primária)
  - `SENDGRID_API_KEY` (Email transacional)
  - `STRIPE_SECRET_KEY` (Stripe)

### Recomendadas (produção)
- **Email (SendGrid)**:
  - `SENDGRID_FROM_EMAIL` (ex.: `noreply@suaempresa.com`)
  - `SENDGRID_FROM_NAME` (ex.: `Valle 360`)
- **Stripe Webhooks**:
  - `STRIPE_WEBHOOK_SECRET` (ex.: `whsec_...`)
- **Alertas Financeiro (opcional)**:
  - `FINANCE_ALERT_EMAILS` (lista separada por vírgula, ex.: `financeiro@...,admin@...`)
- **Hardening de setup**:
  - `ENABLE_SETUP_ROUTES=0` (padrão). Para liberar rotas de setup temporariamente: `ENABLE_SETUP_ROUTES=1`
  - `ADMIN_SECRET` (obrigatório para `/api/admin/create-users` quando setup estiver habilitado)

> Não cole chaves no chat. Use Vercel Env Vars ou `/admin/integracoes`.

## 2) Validar prontidão (Super Admin)
1. Faça login como admin.
2. Abra `/admin/prontidao`.
3. Verifique:
   - **IA**: OpenRouter deve aparecer `OK` e `source=openrouter: env|db`.
   - **Integrações**: pelo menos OpenRouter OK.
   - **ML / Metas**: pode ficar `OK` após rodar o job (ver seção 5).

## 3) Integrações (OpenRouter como primária + política por função)
1. Abra `/admin/integracoes`.
2. OpenRouter:
   - (Opcional) Conectar via UI (salva no banco).
   - (Recomendado) Definir `config.model_policy` (JSON) para escolher modelos por função.
3. Clique **Testar**.

### Exemplo de `config.model_policy`
```json
{
  "default": ["openrouter/auto"],
  "kanban_insights": ["anthropic/claude-3.5-sonnet", "openrouter/auto"],
  "kanban_message": ["openai/gpt-4o-mini", "openrouter/auto"],
  "analysis": ["anthropic/claude-3.5-sonnet", "openrouter/auto"],
  "strategy": ["anthropic/claude-3.5-sonnet", "openrouter/auto"],
  "copywriting": ["openai/gpt-4o-mini", "openrouter/auto"],
  "sales": ["openai/gpt-4o-mini", "openrouter/auto"],
  "classification": ["google/gemini-1.5-flash", "openrouter/auto"],
  "sentiment": ["google/gemini-1.5-flash", "openrouter/auto"],
  "hr": ["anthropic/claude-3.5-sonnet", "openrouter/auto"]
}
```

## 4) Colaboradores (sem criar novos usuários no Supabase)
### 4.1) Vincular colaborador existente (recomendado para seu caso)
Use quando o usuário **já existe** no Supabase Auth (login/senha).

1. Abra `/admin/colaboradores`.
2. Clique em **Vincular existente**.
3. Informe:
   - Email do login existente
   - Áreas (isso define quais boards o colaborador acessa)
4. Clique **Vincular**.
5. O colaborador deve logar e abrir `/colaborador/kanban`.

> Importante: para Financeiro selecione `financeiro_pagar` e/ou `financeiro_receber` (não use “Financeiro” genérico).

### 4.2) Criar novo colaborador
`/admin/colaboradores/novo` cria usuário **novo** no Auth (use apenas quando você realmente quiser criar).

## 5) ML / Preditivo (ativo)
### 5.1) Rodar jobs manualmente (admin)
1. Abra `/admin/machine-learning`.
2. Clique **Executar jobs agora**.
3. Recarregue e valide:
   - `Predições` preenchidas (`ml_predictions_log`)
   - `Clientes em risco` preenchidos (`client_health_scores` / `ml_client_behavior_patterns`)
   - `Insights` (tabela `super_admin_insights`)

### 5.2) Cron automático (Vercel)
O `vercel.json` já agenda:
- `/api/cron/overdue` a cada 30 min
- `/api/cron/ml` a cada 2 horas

Garanta `CRON_SECRET` e verifique nos logs da Vercel.

## 6) Validações rápidas (checklist final)
- `/admin/prontidao` => IA OK, Integrações OK
- `/admin/integracoes` => OpenRouter Test OK
- `/app/kanban` => Insights mostram provider/model
- `/admin/machine-learning` => Jobs rodam e preenchem dados
- `/colaborador/kanban` => colaborador vê apenas board(s) da(s) área(s)


