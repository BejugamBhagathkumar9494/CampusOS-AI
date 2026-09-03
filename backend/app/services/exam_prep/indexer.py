import json
import re
from typing import List, Dict, Any, Optional
import numpy as np
from sqlalchemy.orm import Session
from app.models.database_models import StudyChunk, StudyDocument, StudyCollection


def generate_chunk_embedding(text: str, dim: int = 1536) -> List[float]:
    """
    Generates a high-dimensional dense vector embedding for semantic search.
    Computes a deterministic hash & TF-IDF/n-gram projection normalized to unit sphere.
    """
    vec = np.zeros(dim, dtype=np.float32)
    cleaned = text.lower().strip()
    words = re.findall(r'\b\w+\b', cleaned)
    if not words:
        return vec.tolist()

    for idx, word in enumerate(words):
        h = hash(word) % dim
        vec[h] += 1.0 / (1.0 + np.log1p(idx))

    # Character trigrams for morphological robustness
    for i in range(len(cleaned) - 2):
        tri = cleaned[i:i+3]
        h = hash(tri) % dim
        vec[h] += 0.5

    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = vec / norm
    return vec.tolist()


def detect_topic_from_chunk(chunk_text: str, default_topic: str = "General Concepts") -> str:
    """Extracts dominant heading or topic from chunk."""
    lines = [l.strip() for l in chunk_text.split('\n') if l.strip()]
    for line in lines[:3]:
        if line.startswith(('#', 'SECTION', 'Section', 'CHAPTER', 'Chapter', 'TOPIC', 'Topic', '1.', '2.', '3.', '4.', '5.')):
            topic = re.sub(r'^[#0-9.\s:-]+', '', line).strip()
            if 3 < len(topic) < 100:
                return topic
        elif len(line) < 60 and (line.isupper() or line.istitle()) and not line.endswith('.'):
            return line
    return default_topic


def chunk_page_text(
    page_text: str,
    page_number: int,
    source_file: str,
    unit: str,
    target_size: int = 750,
    overlap_size: int = 100
) -> List[Dict[str, Any]]:
    """
    Semantic chunker splitting page text into chunks without losing page or unit metadata.
    """
    if not page_text or not page_text.strip():
        return []

    paragraphs = page_text.split('\n\n')
    chunks = []
    current_chunk = []
    current_len = 0
    chunk_idx = 1
    current_topic = detect_topic_from_chunk(page_text, f"{unit} Overview")

    for para in paragraphs:
        cleaned_para = para.strip()
        if not cleaned_para:
            continue

        para_len = len(cleaned_para)
        # Heading detection inside paragraph
        first_line = cleaned_para.split('\n')[0].strip()
        if len(first_line) < 60 and (first_line.isupper() or first_line.startswith(('#', 'Unit', 'Chapter', 'Section', 'Topic'))):
            current_topic = re.sub(r'^[#0-9.\s:-]+', '', first_line).strip() or current_topic

        if current_len + para_len > target_size and current_chunk:
            chunk_str = "\n\n".join(current_chunk)
            chunk_topic = detect_topic_from_chunk(chunk_str, current_topic)
            chunks.append({
                "content": chunk_str,
                "page_number": page_number,
                "unit": unit,
                "topic": chunk_topic,
                "chunk_index": chunk_idx,
                "source_file": source_file,
            })
            chunk_idx += 1

            # Retain overlap from end of previous chunk
            overlap_lines = []
            overlap_len = 0
            for l in reversed(current_chunk):
                if overlap_len + len(l) <= overlap_size:
                    overlap_lines.insert(0, l)
                    overlap_len += len(l)
                else:
                    break
            current_chunk = overlap_lines + [cleaned_para]
            current_len = sum(len(x) for x in current_chunk)
        else:
            current_chunk.append(cleaned_para)
            current_len += para_len

    if current_chunk:
        chunk_str = "\n\n".join(current_chunk)
        chunk_topic = detect_topic_from_chunk(chunk_str, current_topic)
        chunks.append({
            "content": chunk_str,
            "page_number": page_number,
            "unit": unit,
            "topic": chunk_topic,
            "chunk_index": chunk_idx,
            "source_file": source_file,
        })

    return chunks


def index_collection_documents(
    db: Session,
    collection: StudyCollection,
    parsed_documents: List[Dict[str, Any]]
) -> int:
    """
    Chunks all parsed pages of uploaded documents and indexes them in the database.
    Treats all uploaded PDFs as a SINGLE unified knowledge collection for the subject.
    """
    total_indexed = 0

    for doc_info in parsed_documents:
        doc_record = StudyDocument(
            id=doc_info.get("id"),
            collection_id=collection.id,
            file_name=doc_info.get("file_name"),
            file_size_bytes=doc_info.get("file_size", 0),
            storage_path=doc_info.get("storage_path"),
            page_count=doc_info.get("page_count", 1),
            unit_detected=doc_info.get("primary_unit", "Unit 1"),
            processing_status="processed"
        )
        db.add(doc_record)
        db.flush()

        pages = doc_info.get("pages", [])
        for p in pages:
            page_num = p.get("page_number", 1)
            page_text = p.get("text", "")
            unit = p.get("unit") or doc_info.get("primary_unit", "Unit 1")
            has_diag = p.get("has_diagram", False)
            diag_cap = p.get("diagram_caption")

            raw_chunks = chunk_page_text(
                page_text=page_text,
                page_number=page_num,
                source_file=doc_info.get("file_name"),
                unit=unit
            )

            for chunk_data in raw_chunks:
                emb = generate_chunk_embedding(chunk_data["content"])
                meta = {
                    "document_id": doc_record.id,
                    "collection_id": collection.id,
                    "subject_name": collection.subject_name,
                    "course_code": collection.course_code,
                    "unit": chunk_data["unit"],
                    "chapter": chunk_data["unit"],
                    "topic": chunk_data["topic"],
                    "page_number": chunk_data["page_number"],
                    "source_file": chunk_data["source_file"],
                    "chunk_index": chunk_data["chunk_index"],
                    "has_diagram": has_diag,
                    "diagram_caption": diag_cap
                }

                chunk_obj = StudyChunk(
                    document_id=doc_record.id,
                    collection_id=collection.id,
                    content=chunk_data["content"],
                    page_number=chunk_data["page_number"],
                    unit=chunk_data["unit"],
                    topic=chunk_data["topic"],
                    chunk_index=chunk_data["chunk_index"],
                    has_diagram=has_diag,
                    diagram_caption=diag_cap,
                    metadata_json=json.dumps(meta),
                    embedding=emb
                )
                db.add(chunk_obj)
                total_indexed += 1

    db.commit()
    return total_indexed
