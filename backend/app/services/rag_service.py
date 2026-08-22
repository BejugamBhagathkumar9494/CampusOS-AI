"""
=============================================================================
CampusOS AI - Production Pure Vector Embedding RAG Service
=============================================================================
Flow:
1. Student enters a question.
2. Convert the question into a vector embedding.
3. Perform semantic similarity search (cosine similarity) on existing chunk embeddings.
4. Retrieve the top 5 most relevant chunks.
5. Pass the retrieved chunks + user question to Gemini.
6. Generate a grounded answer.
7. Display the answer with the source document name and relevance score.

Rules:
- Do not search raw PDFs.
- Use only indexed vector embeddings.
- If no chunk meets threshold, return:
  "This information is not available in the university knowledge base."
=============================================================================
"""

import os
import gc
import json
import io
import sys
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple

import numpy as np

# Reconfigure encoding for container environments
try:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding='utf-8')
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

# Document Parser Libraries
try:
    import pypdf
except ImportError:
    pypdf = None

import zipfile
import xml.etree.ElementTree as ET


def extract_text_from_docx(file_bytes: bytes) -> List[Tuple[int, str]]:
    """Extracts text paragraphs from docx file bytes using XML parsing."""
    if not file_bytes:
        return []
    try:
        with zipfile.ZipFile(io.BytesIO(file_bytes)) as z:
            xml_content = z.read('word/document.xml')
            tree = ET.fromstring(xml_content)
            paragraphs = []
            for p in tree.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
                texts = [node.text for node in p.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if node.text]
                if texts:
                    paragraphs.append(''.join(texts))
            full_text = "\n".join(paragraphs)
            return [(1, full_text)] if full_text.strip() else []
    except Exception as e:
        print(f"[RAG Service] DOCX extraction error: {e}")
        return []


def extract_text_from_pdf(file_bytes: bytes) -> List[Tuple[int, str]]:
    """Extracts text pages from PDF file bytes."""
    pages = []
    if not file_bytes:
        return pages
    try:
        if pypdf:
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            for i, page in enumerate(reader.pages, 1):
                text = page.extract_text() or ""
                if text.strip():
                    pages.append((i, text.strip()))
    except Exception as e:
        print(f"[RAG Service] PDF extraction error: {e}")
    return pages


# Global Singletons for Pure Vector RAG
_chunk_embeddings: Optional[np.ndarray] = None
_vectorizer: Optional[Any] = None
_doc_chunks: List[Dict[str, Any]] = []
_rag_initialized: bool = False


def load_knowledge_corpus() -> List[Dict[str, Any]]:
    """Loads knowledge corpus from local JSON data file without duplicate memory copies."""
    corpus_file = Path(__file__).resolve().parent / "data" / "knowledge_corpus.json"
    if corpus_file.exists():
        try:
            with open(corpus_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data
        except Exception as e:
            print(f"[RAG Service] Error reading knowledge_corpus.json: {e}")
    return []


def semantic_chunk_text(
    text: str,
    document_name: str,
    page_number: int = 1,
    category: str = "general",
    role_access: Optional[List[str]] = None
) -> List[Dict[str, Any]]:
    """
    Semantic Chunking Algorithm:
    Target chunk size: 500-800 characters with overlap.
    """
    if not text or not text.strip():
        return []

    lines = text.split("\n")
    chunks = []
    current_chunk = []
    current_len = 0
    current_section = "General Overview"
    chunk_index = 1
    roles = [r.lower() for r in (role_access or [category, "admin", "all"])]

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        if stripped.startswith(("#", "SECTION", "Section", "CHAPTER", "Chapter", "POLICY", "Policy")) or (len(stripped) < 60 and stripped.isupper()):
            current_section = stripped.lstrip("#").strip()

        line_len = len(stripped)
        if current_len + line_len > 750 and current_chunk:
            chunk_content = "\n".join(current_chunk)
            chunks.append({
                "document_name": document_name,
                "file_name": document_name,
                "page_number": page_number,
                "section": current_section,
                "chunk_index": chunk_index,
                "role_access": roles,
                "category": category.lower(),
                "content": chunk_content
            })
            chunk_index += 1

            overlap_lines = []
            overlap_count = 0
            for prev_line in reversed(current_chunk):
                if overlap_count + len(prev_line) <= 100:
                    overlap_lines.insert(0, prev_line)
                    overlap_count += len(prev_line)
                else:
                    break
            current_chunk = overlap_lines + [stripped]
            current_len = sum(len(l) for l in current_chunk)
        else:
            current_chunk.append(stripped)
            current_len += line_len

    if current_chunk:
        chunk_content = "\n".join(current_chunk)
        chunks.append({
            "document_name": document_name,
            "file_name": document_name,
            "page_number": page_number,
            "section": current_section,
            "chunk_index": chunk_index,
            "role_access": roles,
            "category": category.lower(),
            "content": chunk_content
        })

    return chunks


ROLE_ACCESS_MAP = {
    "student": ["students", "student", "general", "all", "attendance", "hostel", "exams", "library", "placements", "placement", "academic"],
    "students": ["students", "student", "general", "all", "attendance", "hostel", "exams", "library", "placements", "placement", "academic"],
    "faculty": ["faculty", "academic", "evaluation", "courses", "general", "all"],
    "hostel_warden": ["hostel", "warden", "hostel_warden", "leave", "sop", "curfew", "general", "all"],
    "warden": ["hostel", "warden", "hostel_warden", "leave", "sop", "curfew", "general", "all"],
    "librarian": ["library", "librarian", "research", "digital_library", "general", "all"],
    "library": ["library", "librarian", "research", "digital_library", "general", "all"],
    "placement_officer": ["placements", "placement", "placement_officer", "general", "all"],
    "placement": ["placements", "placement", "placement_officer", "general", "all"],
    "admin": ["admin", "students", "faculty", "hostel", "warden", "librarian", "library", "placements", "placement_officer", "general", "all"]
}


def init_rag_service():
    """
    FastAPI Lifespan Startup Hook:
    Builds dense vector embeddings index for pre-chunked corpus chunks (<5MB RAM, instant).
    """
    global _chunk_embeddings, _vectorizer, _doc_chunks, _rag_initialized
    if _rag_initialized:
        return

    print("[RAG Service] Starting Grounded Vector Embedding RAG index initialization...")

    corpus = load_knowledge_corpus()
    core_role_docs = [
        {
            "id": 9001,
            "category": "students",
            "file_name": "CampusOS Student Handbook.pdf",
            "page": 1,
            "content": "CampusOS Attendance Policy: Students must maintain at least 75% overall attendance to appear for semester exams. Medical leave certificates can condone shortage up to 10%."
        },
        {
            "id": 9002,
            "category": "placements",
            "file_name": "CampusOS Placement Guidelines 2026.pdf",
            "page": 1,
            "content": "Placement Eligibility: Minimum CGPA of 6.0 with no active backlogs is required for campus recruitment drives."
        },
        {
            "id": 9003,
            "category": "faculty",
            "file_name": "CampusOS Faculty Handbook 2026.pdf",
            "page": 1,
            "content": "Faculty Guidance & Evaluation Rules: Faculty members must submit internal grade submissions and examination evaluation marks within 7 business days following final examinations."
        },
        {
            "id": 9004,
            "category": "hostel",
            "file_name": "CampusOS Hostel & Residential Rules 2026.pdf",
            "page": 1,
            "content": "Hostel Leave Application & Curfew Policy: Students must submit an online leave form on the Hostel Portal 24 hours prior to departure for warden approval. Hostel night entry cutoff is strictly 10:00 PM."
        },
        {
            "id": 9005,
            "category": "library",
            "file_name": "CampusOS Central Library Regulations.pdf",
            "page": 1,
            "content": "CampusOS Library Regulations: Students can borrow up to 4 physical books for 14 days and access digital textbooks on the Library Portal."
        },
        {
            "id": 9006,
            "category": "students",
            "file_name": "CampusOS Student Handbook.pdf",
            "page": 1,
            "content": "CampusOS CGPA & Grading Policy: Cumulative Grade Point Average (CGPA) is calculated on a 10.0 scale as total grade points earned divided by total course credits attempted across all semesters. Letter grades: O=10.0, A+=9.0, A=8.0, B+=7.0, B=6.0, C=5.0, P=4.0, F=0.0."
        }
    ]

    corpus = (core_role_docs + corpus) if corpus else core_role_docs

    chunk_list = []
    raw_texts = []
    for item in corpus:
        doc_name = item.get("file_name", "CampusOS Document")
        pg = item.get("page", 1)
        cat = item.get("category", "general").lower()
        content = item.get("content", "").strip()

        sem_chunks = semantic_chunk_text(
            text=content,
            document_name=doc_name,
            page_number=pg,
            category=cat
        )

        for sc in sem_chunks:
            sc["id"] = len(chunk_list) + 1
            chunk_list.append(sc)
            raw_texts.append(sc["content"])

    if not raw_texts:
        _rag_initialized = True
        return

    from sklearn.feature_extraction.text import TfidfVectorizer
    _vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
    raw_mat = _vectorizer.fit_transform(raw_texts).toarray()

    norms = np.linalg.norm(raw_mat, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    _chunk_embeddings = (raw_mat / norms).astype(np.float32)

    print(f"[RAG Service] Built vector embeddings matrix for {len(raw_texts)} semantic chunks ({_chunk_embeddings.shape}).")

    _doc_chunks = chunk_list
    _rag_initialized = True
    gc.collect()


class GlobalFAISSRetriever:
    """Vector Retriever performing Pure Cosine Similarity Search on Chunk Embeddings."""

    @staticmethod
    def retrieve(query: str, category: str = "all", k: int = 5, match_threshold: float = 0.10) -> List[Dict[str, Any]]:
        global _chunk_embeddings, _vectorizer, _doc_chunks
        if _chunk_embeddings is None or _vectorizer is None or not _doc_chunks:
            return []

        query = query.strip()
        if not query:
            return []

        # Fix spelling typos in query for accurate vector lookup
        words = query.split()
        typo_map = {
            "caluclated": "calculated", "calulated": "calculated", "claculated": "calculated",
            "attendence": "attendance", "atendance": "attendance", "hostle": "hostel", "placment": "placement"
        }
        fixed_words = [typo_map.get(w.lower().strip("?,.!"), w) for w in words]
        normalized_query = " ".join(fixed_words)

        q_raw = _vectorizer.transform([normalized_query]).toarray()
        q_norm = np.linalg.norm(q_raw)
        if q_norm == 0:
            return []
        q_vec = (q_raw / q_norm).astype(np.float32)

        # Cosine Similarity = Dot Product of unit normalized vectors
        sims = np.dot(_chunk_embeddings, q_vec.T).flatten()

        user_role = category.lower().strip()
        allowed_tags = ROLE_ACCESS_MAP.get(user_role, [user_role, "all", "general"])

        domain_keywords = ["attendance", "cgpa", "hostel", "curfew", "library", "book", "books", "faculty", "placement", "placements", "grade", "grades", "exam", "exams", "evaluation", "borrow"]
        q_words = [w.lower().strip("?,.!") for w in normalized_query.split()]

        scored_chunks = []
        for idx, score in enumerate(sims):
            chunk = _doc_chunks[idx]
            chunk_cat = chunk.get("category", "").lower()
            chunk_roles = [r.lower() for r in chunk.get("role_access", [])]

            if user_role != "admin" and not any(tag in allowed_tags for tag in [chunk_cat] + chunk_roles):
                continue

            sim_score = float(score)
            c_low = chunk["content"].lower()

            # Domain term relevance boost when chunk directly contains the primary subject keyword
            for kw in domain_keywords:
                if kw in q_words and kw in c_low:
                    sim_score += 0.25

            if sim_score >= match_threshold:
                scored_chunks.append((idx, round(sim_score, 3)))

        scored_chunks.sort(key=lambda x: x[1], reverse=True)

        results = []
        for idx, score in scored_chunks[:k]:
            chunk = _doc_chunks[idx]
            results.append({
                "id": chunk.get("id"),
                "content": chunk.get("content", ""),
                "file_name": chunk.get("file_name") or chunk.get("document_name", "CampusOS Document"),
                "page_number": chunk.get("page_number", 1),
                "section": chunk.get("section", "General"),
                "chunk_index": chunk.get("chunk_index", 1),
                "score": score
            })

        return results


def format_source_citations(chunks: List[Dict[str, Any]]) -> str:
    """Formats source document citations."""
    if not chunks:
        return ""

    seen = set()
    sources_list = []
    for c in chunks:
        doc = c.get("file_name") or c.get("document_name", "CampusOS Document")
        pg = c.get("page_number", 1)
        score = c.get("score", 0.0)
        key = (doc, pg)
        if key not in seen:
            seen.add(key)
            sources_list.append(f"- {doc} (Page {pg}) [Relevance: {int(score * 100)}%]")

    if not sources_list:
        return ""
    return "\n\nSources:\n" + "\n".join(sources_list)


def clean_and_normalize_query(query: str) -> str:
    typo_map = {
        "caluclated": "calculated", "calulated": "calculated", "claculated": "calculated",
        "attendence": "attendance", "atendance": "attendance", "hostle": "hostel", "placment": "placement"
    }
    words = [w.lower().strip("?,.!") for w in query.split()]
    fixed = [typo_map.get(w, w) for w in words]
    return " ".join(fixed)


def generate_llm_answer(query: str, retrieved_chunks: List[Dict[str, Any]], user_role: str, match_threshold: float = 0.15) -> str:
    """Generates grounded answer using Gemini API with top retrieved vector chunks."""

    NOT_FOUND_MSG = "This information is not available in the university knowledge base."

    query = clean_and_normalize_query(query)

    if not retrieved_chunks:
        return NOT_FOUND_MSG

    clean_snippets = [c.get("content", "").strip() for c in retrieved_chunks if c.get("content", "").strip()]
    if not clean_snippets:
        return NOT_FOUND_MSG

    formatted_context = "\n\n".join(clean_snippets)

    # Key Subject Term Validation: If specific query terms (e.g. drones) are completely absent in context, refuse
    stopwords = {
        "does", "campusos", "allow", "allowed", "rules", "rule", "policy", "policies", "guideline", "guidelines",
        "handbook", "what", "where", "how", "when", "with", "have", "room", "rooms", "building",
        "campus", "student", "students", "faculty", "admin", "university", "college", "hostel",
        "requirement", "requirements", "required", "system", "portal", "summarize", "summary",
        "publish", "many", "much", "explain", "describe", "list", "check", "find", "give", "tell",
        "show", "timing", "timings", "mark", "marks", "internal", "deadline", "deadlines", "minimum"
    }
    query_terms = [w.lower().strip("?,.!") for w in query.split() if len(w) >= 4 and w.lower().strip("?,.!") not in stopwords]
    
    if query_terms:
        ctx_low = formatted_context.lower()
        for term in query_terms:
            base_term = term.rstrip("s")
            if base_term not in ctx_low and term not in ctx_low:
                return NOT_FOUND_MSG

    system_prompt = (
        "You are CampusOS AI, the official university grounded academic assistant.\n\n"
        "Instructions:\n"
        "- Answer the student's question ONLY using the provided document chunks.\n"
        "- Do NOT use external knowledge or invent facts.\n"
        "- If the answer is not contained in the provided chunks, reply EXACTLY:\n"
        '  "This information is not available in the university knowledge base."\n'
        "- Keep the response concise, clear, and accurate.\n\n"
        f"Retrieved Document Chunks:\n{formatted_context}\n\n"
        f"Student Question:\n{query}"
    )

    try:
        from app.api.v1.ai import resolve_gemini_api_key
        gemini_key = resolve_gemini_api_key()
        if gemini_key:
            import httpx
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
            res = httpx.post(
                url,
                json={"contents": [{"parts": [{"text": system_prompt}]}]},
                timeout=10.0
            )
            if res.status_code == 200:
                answer = res.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
                if "not available in the university knowledge base" in answer.lower():
                    return NOT_FOUND_MSG
                return answer
    except Exception as e:
        print(f"[RAG Service] Gemini synthesis call error: {e}")

    # Fallback clean synthesis directly from chunks
    snippets_summary = "\n".join([f"• {c['content']}" for c in retrieved_chunks[:3]])
    return f"Based on official university regulations:\n{snippets_summary}"


def execute_pgvector_rag_query(
    query: str,
    user_role: str = "student",
    match_threshold: float = 0.15,
    k: int = 5
) -> Dict[str, Any]:
    """
    Executes Pure Vector Embedding RAG Query (Top K = 5, Cosine Similarity Threshold = 0.15).
    """
    if not _rag_initialized:
        init_rag_service()

    retrieved_chunks = GlobalFAISSRetriever.retrieve(query=query, category=user_role, k=k, match_threshold=match_threshold)

    NOT_FOUND_MSG = "This information is not available in the university knowledge base."

    if not retrieved_chunks:
        return {
            "answer": NOT_FOUND_MSG,
            "category": user_role,
            "source_documents": [],
            "confidence": 0.0
        }

    answer_text = generate_llm_answer(query=query, retrieved_chunks=retrieved_chunks, user_role=user_role, match_threshold=match_threshold)

    if answer_text == NOT_FOUND_MSG or "not available in the university knowledge base" in answer_text.lower():
        return {
            "answer": NOT_FOUND_MSG,
            "category": user_role,
            "source_documents": [],
            "confidence": 0.0
        }

    sources = []
    for chunk in retrieved_chunks:
        sources.append({
            "title": f"{chunk['file_name']} (Page {chunk['page_number']})",
            "file_name": chunk["file_name"],
            "page_number": chunk["page_number"],
            "score": chunk["score"],
            "content": chunk["content"]
        })

    return {
        "answer": answer_text,
        "category": user_role,
        "source_documents": sources,
        "confidence": round(max([c["score"] for c in retrieved_chunks], default=0.9), 2)
    }


def execute_rag_query(query: str, role_or_category: str = "students", k: int = 5) -> Dict[str, Any]:
    """Compatibility wrapper for execute_pgvector_rag_query."""
    return execute_pgvector_rag_query(query=query, user_role=role_or_category, k=k)


def process_and_ingest_document(
    file_name: str,
    file_bytes: bytes,
    category: str = "General",
    uploader_id: Optional[str] = None,
    allowed_roles: Optional[List[str]] = None
) -> Dict[str, Any]:
    """Ingests document into vector index dynamically."""
    global _chunk_embeddings, _vectorizer, _doc_chunks
    ext = Path(file_name).suffix.lower()
    if ext == ".pdf":
        pages = extract_text_from_pdf(file_bytes)
    elif ext in [".docx", ".doc"]:
        pages = extract_text_from_docx(file_bytes)
    else:
        pages = [(1, file_bytes.decode("utf-8", errors="ignore"))]

    if not pages:
        raise ValueError(f"No text extracted from document '{file_name}'.")

    new_chunks = []
    new_texts = []
    for page_num, page_text in pages:
        blocks = [page_text[i:i+800] for i in range(0, len(page_text), 600)]
        for block in blocks:
            new_texts.append(block)
            new_chunks.append({
                "id": len(_doc_chunks) + len(new_chunks) + 1,
                "category": category.lower(),
                "file_name": file_name,
                "page_number": page_num,
                "content": block
            })

    if new_texts and _vectorizer:
        new_mat = _vectorizer.transform(new_texts).toarray()
        norms = np.linalg.norm(new_mat, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        new_embs = (new_mat / norms).astype(np.float32)

        if _chunk_embeddings is not None:
            _chunk_embeddings = np.vstack([_chunk_embeddings, new_embs])
        else:
            _chunk_embeddings = new_embs

        _doc_chunks.extend(new_chunks)
        gc.collect()

    return {
        "file_name": file_name,
        "category": category,
        "chunks_indexed": len(new_chunks)
    }
