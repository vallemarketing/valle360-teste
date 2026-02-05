from __future__ import annotations

from dataclasses import dataclass

from app.core.supabase_client import get_supabase_admin
from app.tools.memory.openai_embeddings import embed_texts, to_pgvector_literal


def chunk_text(text: str, *, chunk_size: int = 1200, overlap: int = 200) -> list[str]:
    t = (text or "").strip()
    if not t:
        return []
    if chunk_size <= 0:
        return [t]

    out: list[str] = []
    i = 0
    n = len(t)
    while i < n:
        end = min(n, i + chunk_size)
        out.append(t[i:end])
        if end >= n:
            break
        i = max(0, end - overlap)
    return out


@dataclass
class RAGBrandTool:
    client_id: str

    async def ingest_text(
        self,
        *,
        title: str | None,
        content: str,
        source_type: str = "manual",
        source_ref: str | None = None,
        created_by_user_id: str | None = None,
        metadata: dict | None = None,
    ) -> dict:
        admin = get_supabase_admin()
        metadata = metadata or {}

        doc_res = (
            admin.table("brand_memory_documents")
            .insert(
                {
                    "client_id": self.client_id,
                    "title": title,
                    "source_type": source_type,
                    "source_ref": source_ref,
                    "raw_text": content,
                    "metadata": metadata,
                    "created_by_user_id": created_by_user_id,
                }
            )
            .execute()
        )
        doc = (doc_res.data or [None])[0]
        if not doc or not doc.get("id"):
            raise RuntimeError("Falha ao criar brand_memory_documents")
        doc_id = str(doc["id"])

        chunks = chunk_text(content)
        if not chunks:
            return {"document_id": doc_id, "chunks_created": 0}

        embeddings = await embed_texts(chunks)
        rows = []
        for idx, (chunk, emb) in enumerate(zip(chunks, embeddings, strict=False)):
            rows.append(
                {
                    "client_id": self.client_id,
                    "document_id": doc_id,
                    "chunk_index": idx,
                    "content": chunk,
                    "metadata": {"title": title, **metadata, "chunk_size": len(chunk)},
                    # enviar como literal para evitar problemas de casting via PostgREST
                    "embedding": to_pgvector_literal(emb),
                }
            )

        if rows:
            admin.table("brand_memory_chunks").insert(rows).execute()

        return {"document_id": doc_id, "chunks_created": len(rows)}

    async def search(self, *, query: str, match_count: int = 8, similarity_threshold: float = 0.70) -> dict:
        admin = get_supabase_admin()
        emb = (await embed_texts([query]))[0]
        qv = to_pgvector_literal(emb)

        res = (
            admin.rpc(
                "match_brand_memory_chunks",
                {
                    "p_client_id": self.client_id,
                    "query_embedding": qv,
                    "match_count": int(match_count),
                    "similarity_threshold": float(similarity_threshold),
                },
            )
            .execute()
        )
        rows = res.data or []
        return {"matches": rows}

