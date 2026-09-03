import json
from typing import List, Dict, Any, Optional
import numpy as np
from sqlalchemy.orm import Session
from app.models.database_models import StudyChunk, StudyCollection
from .indexer import generate_chunk_embedding


def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    """Calculates cosine similarity between two unit vectors."""
    a = np.array(v1, dtype=np.float32)
    b = np.array(v2, dtype=np.float32)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))


def retrieve_collection_chunks(
    db: Session,
    collection_id: str,
    query: str,
    k: int = 6,
    unit: Optional[str] = None,
    match_threshold: float = 0.10
) -> List[Dict[str, Any]]:
    """
    Retrieves the top K most semantically relevant chunks for a study collection.
    Enforces collection isolation.
    """
    q = db.query(StudyChunk).filter(StudyChunk.collection_id == collection_id)
    if unit and unit != "all" and unit != "All Units":
        q = q.filter(StudyChunk.unit.ilike(f"%{unit.strip()}%"))

    chunks = q.all()
    if not chunks:
        return []

    q_emb = generate_chunk_embedding(query)
    q_words = [w.lower().strip("?,.!") for w in query.split() if len(w) > 2]

    scored = []
    for c in chunks:
        # Cosine similarity
        emb = c.embedding
        if emb is None:
            # On-the-fly embedding fallback
            emb = generate_chunk_embedding(c.content)
        
        sim = cosine_similarity(q_emb, emb)

        # Keyword boost if exact technical term matches
        c_low = c.content.lower()
        for w in q_words:
            if w in c_low:
                sim += 0.08

        if sim >= match_threshold:
            meta = {}
            if c.metadata_json:
                try:
                    meta = json.loads(c.metadata_json)
                except Exception:
                    pass

            scored.append({
                "id": c.id,
                "content": c.content,
                "unit": c.unit,
                "topic": c.topic,
                "page_number": c.page_number,
                "source_file": meta.get("source_file") or (c.document.file_name if c.document else "Study Note.pdf"),
                "has_diagram": c.has_diagram,
                "diagram_caption": c.diagram_caption,
                "score": round(sim, 3)
            })

    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:k]


def retrieve_unit_chunks(
    db: Session,
    collection_id: str,
    unit: str,
    limit: int = 25
) -> List[Dict[str, Any]]:
    """
    Retrieves all chunks belonging to a specific unit within a collection.
    """
    chunks = (
        db.query(StudyChunk)
        .filter(StudyChunk.collection_id == collection_id)
        .filter(StudyChunk.unit.ilike(f"%{unit.strip()}%"))
        .order_by(StudyChunk.page_number.asc(), StudyChunk.chunk_index.asc())
        .limit(limit)
        .all()
    )

    results = []
    for c in chunks:
        meta = {}
        if c.metadata_json:
            try:
                meta = json.loads(c.metadata_json)
            except Exception:
                pass

        results.append({
            "id": c.id,
            "content": c.content,
            "unit": c.unit,
            "topic": c.topic,
            "page_number": c.page_number,
            "source_file": meta.get("source_file") or (c.document.file_name if c.document else "Study Note.pdf"),
            "has_diagram": c.has_diagram,
            "diagram_caption": c.diagram_caption,
        })
    return results
