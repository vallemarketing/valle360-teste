import httpx

from app.core.config import settings


async def embed_texts(texts: list[str]) -> list[list[float]]:
    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY não configurada")
    if not texts:
        return []

    payload = {"model": settings.openai_embedding_model, "input": texts}
    headers = {"Authorization": f"Bearer {settings.openai_api_key}"}

    async with httpx.AsyncClient(timeout=60) as client:
        r = await client.post("https://api.openai.com/v1/embeddings", json=payload, headers=headers)
        r.raise_for_status()
        j = r.json()

    data = j.get("data") or []
    # garantir ordenação por index
    data_sorted = sorted(data, key=lambda x: int(x.get("index", 0)))
    return [list(row["embedding"]) for row in data_sorted]


def to_pgvector_literal(vec: list[float]) -> str:
    # pgvector aceita formato: [1,2,3]
    return "[" + ",".join(f"{float(x):.8f}" for x in vec) + "]"

