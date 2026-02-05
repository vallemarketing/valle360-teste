# Predictive Agency (CrewAI Service)

Serviço **Python/FastAPI** para rodar o blueprint **Predictive Agency (CrewAI)** fora do Vercel (ex.: **Railway**) e integrar com o sistema Next.js existente.

## Objetivo (V1)

- Expor uma API HTTP para disparar execuções (CrewAI) e consultar status/resultados.
- Conectar no Supabase via **service role** (server-side).
- Rodar em Docker (Railway) sem impactar UI/layout do frontend.

## Variáveis de ambiente

- **SUPABASE_URL**: URL do projeto Supabase
- **SUPABASE_SERVICE_ROLE_KEY**: service role key (NUNCA expor no browser)
- **OPENAI_API_KEY**: chave do provedor LLM (ex.: OpenAI)
- **BRIDGE_SECRET** (opcional): se definido, exige header `x-bridge-secret` em rotas protegidas
- **PORT** (opcional): porta do servidor (default 8000)

## Rotas

- `GET /health`: health check simples
- `GET /health/supabase`: valida conexão com Supabase usando service role

## Rodar local (sem Docker)

```bash
cd services/predictive_agency
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.api.server:app --host 0.0.0.0 --port 8000 --reload
```

## Docker

Build & run:

```bash
docker build -t predictive-agency ./services/predictive_agency
docker run --rm -p 8000:8000 --env-file ./services/predictive_agency/ENV_FILE_EXAMPLE.txt predictive-agency
```

## Deploy no Railway (Docker)

- Aponte o Railway para este repositório
- Selecione **Dockerfile path**: `services/predictive_agency/Dockerfile`
- Configure as env vars acima no Railway

