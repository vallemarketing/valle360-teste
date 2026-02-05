from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

from app.api.server import require_bridge_secret
from app.tools.memory.rag_brand_tool import RAGBrandTool


router = APIRouter(prefix="/v1/brand", tags=["brand"])


class IngestTextBody(BaseModel):
    client_id: str = Field(..., min_length=10)
    title: str | None = None
    content: str = Field(..., min_length=1)
    source_type: str = "manual"
    source_ref: str | None = None
    created_by_user_id: str | None = None
    metadata: dict | None = None


class SearchBody(BaseModel):
    client_id: str = Field(..., min_length=10)
    query: str = Field(..., min_length=1)
    match_count: int = 8
    similarity_threshold: float = 0.70


@router.post("/ingest-text")
async def ingest_text(body: IngestTextBody, x_bridge_secret: str | None = Header(default=None)):
    require_bridge_secret(x_bridge_secret)
    try:
        tool = RAGBrandTool(client_id=body.client_id)
        result = await tool.ingest_text(
            title=body.title,
            content=body.content,
            source_type=body.source_type,
            source_ref=body.source_ref,
            created_by_user_id=body.created_by_user_id,
            metadata=body.metadata,
        )
        return {"success": True, **result}
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/search")
async def search(body: SearchBody, x_bridge_secret: str | None = Header(default=None)):
    require_bridge_secret(x_bridge_secret)
    try:
        tool = RAGBrandTool(client_id=body.client_id)
        result = await tool.search(query=body.query, match_count=body.match_count, similarity_threshold=body.similarity_threshold)
        return {"success": True, **result}
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=str(e))

