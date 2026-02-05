from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.supabase_client import get_supabase_admin
from app.api.brand import router as brand_router
from app.api.approval import router as approval_router


app = FastAPI(title="Predictive Agency (CrewAI Service)", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def require_bridge_secret(x_bridge_secret: str | None):
    if not settings.bridge_secret:
        return
    if not x_bridge_secret or x_bridge_secret != settings.bridge_secret:
        raise HTTPException(status_code=401, detail="unauthorized")


@app.get("/health")
def health():
    return {"ok": True}


@app.get("/health/supabase")
def health_supabase(x_bridge_secret: str | None = Header(default=None)):
    # opcionalmente protegido para evitar expor detalhes do ambiente
    require_bridge_secret(x_bridge_secret)

    admin = get_supabase_admin()
    # best-effort: valida conexão e permissão de leitura (service role)
    try:
        res = admin.table("clients").select("id").limit(1).execute()
        # `res.data` pode ser [] — isso é ok; o importante é não dar erro
        return {"ok": True, "checked_table": "clients", "rows_sampled": len(res.data or [])}
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(e))


app.include_router(brand_router)
app.include_router(approval_router)

