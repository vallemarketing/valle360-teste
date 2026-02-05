from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

from app.api.server import require_bridge_secret
from app.core.supabase_client import get_supabase_admin


router = APIRouter(prefix="/v1/approval", tags=["approval"])


class CreateKanbanTaskDraftBody(BaseModel):
    client_id: str = Field(..., min_length=10)
    title: str = Field(..., min_length=1)
    description: str | None = None
    priority: str | None = "medium"
    due_date: str | None = None

    # hints para roteamento inteligente (reaproveita lógica já implementada no executor TS)
    area_key: str | None = None
    stage_key: str | None = None

    # opcional: amarrar ao usuário que disparou (se você quiser trilha/audit)
    created_by_user_id: str | None = None

    # opcional: qual executivo “assina” o draft (default: coo)
    executive_role: str | None = "coo"


class DraftStatusResponse(BaseModel):
    id: str
    status: str
    executed_at: str | None = None
    execution_result: dict | None = None


async def resolve_executive_id_by_role(role: str) -> str | None:
    admin = get_supabase_admin()
    r = admin.table("ai_executives").select("id").eq("role", role).limit(1).execute()
    row = (r.data or [None])[0]
    if row and row.get("id"):
        return str(row["id"])
    return None


@router.post("/kanban-task-draft")
async def create_kanban_task_draft(body: CreateKanbanTaskDraftBody, x_bridge_secret: str | None = Header(default=None)):
    require_bridge_secret(x_bridge_secret)
    try:
        admin = get_supabase_admin()
        exec_id = await resolve_executive_id_by_role(str(body.executive_role or "coo").lower())

        payload: dict = {
            "title": body.title,
            "description": body.description,
            "priority": body.priority,
            "due_date": body.due_date,
            "metadata": {
                "client_id": body.client_id,
                "area_key": body.area_key,
                "stage_key": body.stage_key,
                "source": "predictive_agency",
            },
        }

        preview = {
            "label": "Criar tarefa no Kanban",
            "description": body.title,
        }

        ins = (
            admin.table("ai_executive_action_drafts")
            .insert(
                {
                    "executive_id": exec_id,
                    "created_by_user_id": body.created_by_user_id,
                    "action_type": "create_kanban_task",
                    "action_payload": payload,
                    "preview": preview,
                    "risk_level": "low",
                    "requires_external": False,
                    "is_executable": True,
                    "status": "draft",
                }
            )
            .execute()
        )
        row = (ins.data or [None])[0]
        if not row or not row.get("id"):
            raise RuntimeError("Falha ao criar ai_executive_action_drafts")

        return {"success": True, "draft_id": str(row["id"])}
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/draft-status")
async def get_draft_status(draft_id: str, x_bridge_secret: str | None = Header(default=None)):
    require_bridge_secret(x_bridge_secret)
    try:
        admin = get_supabase_admin()
        r = admin.table("ai_executive_action_drafts").select("id,status,executed_at,execution_result").eq("id", draft_id).limit(1).execute()
        row = (r.data or [None])[0]
        if not row:
            raise RuntimeError("Draft não encontrado")
        return {"success": True, "draft": row}
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=str(e))

