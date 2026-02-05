## CrewAI (Predictive Agency) — Deploy no Railway + Integração com Vercel

Este documento adiciona o **serviço externo** (Python/FastAPI + CrewAI) rodando no **Railway**, e a **ponte** no Next.js (Vercel), sem mudar layout/UI.

### 1) Supabase (migrations)

- Aplique a migration de RAG/brand memory:
  - `supabase/migrations/20260109000001_create_brand_memory_rag.sql`
- Isso cria:
  - `brand_memory_documents`
  - `brand_memory_chunks` (com pgvector)
  - `match_brand_memory_chunks(...)`

### 2) Railway — criar serviço Docker

Crie um serviço no Railway apontando para este repositório.

- **Dockerfile path**: `services/predictive_agency/Dockerfile`
- **Port**: 8000 (Railway normalmente injeta `$PORT`; o serviço já respeita)

#### Variáveis de ambiente (Railway)

- **SUPABASE_URL**
- **SUPABASE_SERVICE_ROLE_KEY**
- **OPENAI_API_KEY**
- **BRIDGE_SECRET** (recomendado)
- **PORT** (opcional, default 8000)

#### Endpoints (Railway)

- `GET /health`
- `GET /health/supabase` (se `BRIDGE_SECRET` estiver configurado, exija header `x-bridge-secret`)

### 3) Vercel — variáveis e redeploy

No projeto do Vercel, adicione:

- **CREW_SERVICE_URL**: base URL do Railway (ex.: `https://<seu-servico>.railway.app`)
- **CREW_SERVICE_BRIDGE_SECRET**: deve ser igual ao `BRIDGE_SECRET` do Railway

Depois, faça **redeploy em produção** no Vercel.

### 4) Ponte Next.js (já implementada)

Rotas (admin-only):

- `POST /api/admin/agency/brand/ingest-text`
- `POST /api/admin/agency/brand/search`
- `POST /api/admin/agency/kanban-task-draft`
- `GET /api/admin/agency/draft-status?draft_id=...`

Essas rotas chamam o Railway server-side e **não expõem** segredos no browser.

### 5) Fluxo de aprovação humana (reuso C‑Suite)

O serviço pode criar drafts em `ai_executive_action_drafts`.

O humano aprova/executa no app (Histórico C‑Suite), reutilizando:

- `/admin/diretoria/historico`
- `/api/admin/csuite/actions/confirm` (executor existente)

