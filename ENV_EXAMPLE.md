# Valle 360 - Variáveis de Ambiente

Este documento lista todas as variáveis de ambiente necessárias para o funcionamento completo do Valle 360.

## Configuração no Vercel

Todas as variáveis abaixo já foram configuradas no projeto `valle-360-platform`.

---

## SUPABASE (Obrigatório)

| Variável | Descrição |
|----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anônima do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço (backend) |
| `SUPABASE_JWT_SECRET` | Segredo JWT |

---

## INTELIGÊNCIA ARTIFICIAL

| Variável | Serviço | Descrição |
|----------|---------|-----------|
| `OPENAI_API_KEY` | OpenAI | GPT-4, embeddings, análise |
| `ANTHROPIC_API_KEY` | Claude | IA alternativa da Anthropic |
| `GOOGLE_GEMINI_API_KEY` | Gemini | IA do Google |
| `LANGCHAIN_API_KEY` | LangChain | Orquestração de IA |
| `TAVILY_API_KEY` | Tavily | Busca na web com IA |

---

## AUTOMAÇÃO (N8N)

| Variável | Descrição |
|----------|-----------|
| `N8N_BASE_URL` | URL da instância N8N |
| `N8N_API_KEY` | Token JWT de autenticação |

**URL Configurada:** `https://antigravity-n8n.ozkq7g.easypanel.host`

---

## LINKEDIN

| Variável | Descrição |
|----------|-----------|
| `LINKEDIN_CLIENT_ID` | ID do aplicativo LinkedIn |
| `LINKEDIN_CLIENT_SECRET` | Secret do aplicativo LinkedIn |

**Uso:** Publicação automática de vagas e oportunidades de franquia.

---

## EMAIL (SendGrid)

| Variável | Descrição |
|----------|-----------|
| `SENDGRID_API_KEY` | Chave da API SendGrid |

**Uso:** Envio de emails transacionais e marketing.

---

## PAGAMENTOS (Stripe)

| Variável | Descrição |
|----------|-----------|
| `STRIPE_SECRET_KEY` | Chave secreta (backend) |
| `STRIPE_WEBHOOK_SECRET` | Secret para webhooks |
| `STRIPE_PUBLISHABLE_KEY` | Chave pública (frontend) |

**Uso:** Processamento de pagamentos e assinaturas.

---

## Status das Integrações

| Integração | Status | Configurado |
|------------|--------|-------------|
| OpenAI | ✅ Ativo | Sim |
| N8N | ✅ Ativo | Sim |
| Claude | ✅ Ativo | Sim |
| Gemini | ✅ Ativo | Sim |
| LangChain | ✅ Ativo | Sim |
| Tavily | ✅ Ativo | Sim |
| LinkedIn | ✅ Ativo | Sim |
| SendGrid | ✅ Ativo | Sim |
| Stripe | ✅ Ativo | Sim |
| Supabase | ✅ Ativo | Sim (pré-configurado) |

---

## Desenvolvimento Local

Para desenvolvimento local, crie um arquivo `.env.local` na raiz do projeto com as variáveis necessárias.

Você pode baixar as variáveis do Vercel usando:

```bash
npx vercel env pull
```

Isso criará automaticamente o arquivo `.env.local` com os valores configurados.

