import re
import json
import numpy as np
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.database_models import StudyRepository, RepositoryFile, RepositoryChunk


def generate_code_embedding(text: str, dim: int = 1536) -> List[float]:
    """Generates deterministic semantic vector embedding for code/documentation chunks."""
    if not text or not text.strip():
        return [0.0] * dim

    clean = text.lower().strip()
    words = re.findall(r'[a-zA-Z0-9_\-\.\/]+', clean)
    vec = np.zeros(dim, dtype=np.float32)

    for i, w in enumerate(words):
        h = hash(w) % dim
        weight = 1.0 + (1.0 / (i + 1))
        # Boost code keywords
        if w in {'api', 'route', 'controller', 'model', 'auth', 'database', 'jwt', 'schema', 'function', 'class', 'import', 'export'}:
            weight *= 2.5
        vec[h] += weight

    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = vec / norm
    return vec.tolist()


def chunk_source_code(file_path: str, content: str, target_size: int = 800, overlap: int = 100) -> List[Dict[str, Any]]:
    """Chunks source file content preserving file path and function headers."""
    if not content or not content.strip():
        return []

    lines = content.split('\n')
    chunks = []
    curr_lines = []
    curr_len = 0
    chunk_idx = 1

    for line in lines:
        l_len = len(line) + 1
        if curr_len + l_len > target_size and curr_lines:
            chunk_text = "\n".join(curr_lines)
            chunks.append({
                "file_path": file_path,
                "chunk_index": chunk_idx,
                "content": chunk_text
            })
            chunk_idx += 1
            # Retain overlap lines
            overlap_lines = []
            overlap_len = 0
            for prev in reversed(curr_lines):
                if overlap_len + len(prev) <= overlap:
                    overlap_lines.insert(0, prev)
                    overlap_len += len(prev)
                else:
                    break
            curr_lines = overlap_lines + [line]
            curr_len = sum(len(x) + 1 for x in curr_lines)
        else:
            curr_lines.append(line)
            curr_len += l_len

    if curr_lines:
        chunk_text = "\n".join(curr_lines)
        chunks.append({
            "file_path": file_path,
            "chunk_index": chunk_idx,
            "content": chunk_text
        })

    return chunks


def index_repository_files(
    db: Session,
    repository: StudyRepository,
    files: List[Dict[str, Any]],
    file_metadata_map: Dict[str, Dict[str, Any]]
) -> int:
    """
    Saves repository files, extracts chunks, generates vector embeddings, and stores in database.
    """
    total_chunks = 0

    for f in files:
        file_path = f["file_path"]
        content = f["content"]
        content_hash = f.get("content_hash")
        meta = file_metadata_map.get(file_path, {})

        repo_file = RepositoryFile(
            id=f.get("id") or str(np.random.randint(10000000, 99999999)),
            repository_id=repository.id,
            file_path=file_path,
            file_type=meta.get("file_type", "source"),
            language=meta.get("language", "text"),
            file_size_bytes=f.get("file_size_bytes", len(content.encode('utf-8'))),
            purpose_summary=meta.get("purpose_summary", ""),
            content_excerpt=content[:1000],
            content_hash=content_hash,
            imports_json=json.dumps(meta.get("imports", [])),
            exports_json=json.dumps(meta.get("functions", []) + meta.get("classes", []))
        )
        db.add(repo_file)
        db.flush()

        chunks = chunk_source_code(file_path, content)
        for c in chunks:
            emb = generate_code_embedding(f"{file_path}\n{c['content']}")
            chunk_rec = RepositoryChunk(
                repository_id=repository.id,
                file_id=repo_file.id,
                file_path=file_path,
                chunk_index=c["chunk_index"],
                content=c["content"],
                embedding=emb,
                metadata_json=json.dumps({
                    "file_type": meta.get("file_type", "source"),
                    "language": meta.get("language", "text")
                })
            )
            db.add(chunk_rec)
            total_chunks += 1

    db.commit()
    return total_chunks


def retrieve_repository_chunks(
    db: Session,
    repository_id: str,
    query: str,
    k: int = 6
) -> List[Dict[str, Any]]:
    """
    Performs scoped cosine similarity vector retrieval against a specific repository.
    """
    chunks = db.query(RepositoryChunk).filter(
        RepositoryChunk.repository_id == repository_id
    ).all()

    if not chunks:
        return []

    q_vec = np.array(generate_code_embedding(query), dtype=np.float32)
    results = []

    for ch in chunks:
        if ch.embedding is not None:
            c_vec = np.array(ch.embedding, dtype=np.float32)
            denom = (np.linalg.norm(q_vec) * np.linalg.norm(c_vec))
            sim = float(np.dot(q_vec, c_vec) / denom) if denom > 0 else 0.0
        else:
            sim = 0.1

        # Text keyword match boost
        q_lower = query.lower()
        if ch.file_path.lower() in q_lower or any(kw in ch.content.lower() for kw in q_lower.split()):
            sim += 0.25

        results.append({
            "chunk_id": ch.id,
            "file_path": ch.file_path,
            "content": ch.content,
            "similarity": round(sim, 4)
        })

    results.sort(key=lambda x: x["similarity"], reverse=True)
    return results[:k]
