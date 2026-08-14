"""
=============================================================================
CampusOS AI - Production FAISS Vector RAG Service (Ultra Low-Memory <450MB)
=============================================================================
Optimizations:
1. Lazy-load SentenceTransformer model (never at import time).
2. Singleton embedding model instance.
3. Startup-only FAISS index loading (loaded once in FastAPI lifespan).
4. Global retriever reuse across all requests.
5. Zero per-request embedding re-creation.
6. Explicit torch.no_grad() inference.
7. Forced CPU execution (CUDA_VISIBLE_DEVICES="").
8. Post-indexing garbage collection.
9. Zero duplicate document copies in memory.
=============================================================================
"""

import os
import gc
import json
import io
import sys
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple

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

try:
    import docx
except ImportError:
    docx = None

# Global Singletons
_embedding_model_instance: Optional[Any] = None
_faiss_index: Optional[Any] = None
_doc_chunks: List[Dict[str, Any]] = []
_rag_initialized: bool = False


def get_embedding_model():
    """
    Lazy-loads and returns the singleton SentenceTransformer embedding model on CPU.
    Never imports or instantiates heavy torch/transformers models at module import time.
    """
    global _embedding_model_instance
    if _embedding_model_instance is None:
        os.environ["CUDA_VISIBLE_DEVICES"] = ""
        import torch
        torch.set_grad_enabled(False)
        from sentence_transformers import SentenceTransformer
        
        print("[RAG Service] Loading singleton SentenceTransformer ('all-MiniLM-L6-v2') on CPU...")
        _embedding_model_instance = SentenceTransformer(
            "sentence-transformers/all-MiniLM-L6-v2",
            device="cpu"
        )
        print("[RAG Service] Singleton embedding model loaded successfully.")
    return _embedding_model_instance


def get_embeddings_model():
    """Compatibility helper returning singleton embedding model."""
    return get_embedding_model()


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


def init_rag_service():
    """
    FastAPI Lifespan Startup Hook:
    Loads knowledge corpus, generates vector embeddings ONCE, builds the FAISS index,
    and immediately releases temporary memory objects via garbage collection.
    """
    global _faiss_index, _doc_chunks, _rag_initialized
    if _rag_initialized:
        return

    print("[RAG Service] Starting vector index initialization...")

    corpus = load_knowledge_corpus()
    if not corpus:
        # Fallback inline knowledge chunks
        corpus = [
            {
                "id": 1,
                "category": "students",
                "file_name": "CampusOS Student Handbook.pdf",
                "page": 1,
                "content": "CampusOS Attendance Policy: Students must maintain at least 75% overall attendance to appear for semester exams. Medical leave certificates can condone shortage up to 10%."
            },
            {
                "id": 2,
                "category": "placements",
                "file_name": "Placement Guidelines.pdf",
                "page": 1,
                "content": "Placement Eligibility: Minimum CGPA of 6.0 with no active backlogs is required for campus recruitment drives."
            },
            {
                "id": 3,
                "category": "faculty",
                "file_name": "Faculty Guide.pdf",
                "page": 1,
                "content": "Faculty Guidance: Grade submissions must be completed within 7 business days following final examinations."
            }
        ]

    # Extract clean text chunks and store minimal metadata
    chunk_list = []
    raw_texts = []
    for item in corpus:
        text = item.get("content", "").strip()
        if not text:
            continue
        raw_texts.append(text)
        chunk_list.append({
            "id": item.get("id"),
            "category": item.get("category", "general").lower(),
            "file_name": item.get("file_name", "CampusOS Document"),
            "page_number": item.get("page", 1),
            "content": text
        })

    if not raw_texts:
        print("[RAG Service] Warning: No document chunks found to index.")
        _rag_initialized = True
        return

    # Generate embeddings ONCE using torch.no_grad()
    import torch
    import numpy as np
    model = get_embedding_model()

    print(f"[RAG Service] Generating embeddings for {len(raw_texts)} document chunks...")
    with torch.no_grad():
        embeddings = model.encode(
            raw_texts,
            batch_size=32,
            show_progress_bar=False,
            convert_to_numpy=True
        )

    # Normalize vectors for cosine similarity
    norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    embeddings = (embeddings / norms).astype(np.float32)

    # Try building FAISS index with NumPy fallback if faiss library unavailable
    try:
        import faiss
        dim = embeddings.shape[1]
        index = faiss.IndexFlatIP(dim)
        index.add(embeddings)
        _faiss_index = ("faiss", index)
        print(f"[RAG Service] Built FAISS vector index with {index.ntotal} vectors.")
    except Exception as faiss_err:
        print(f"[RAG Service] FAISS library fallback to NumPy vector matrix: {faiss_err}")
        _faiss_index = ("numpy", embeddings)

    _doc_chunks = chunk_list
    _rag_initialized = True

    # Immediate garbage collection to free temporary raw text buffers and intermediate tensors
    del raw_texts, embeddings
    gc.collect()
    print("[RAG Service] Indexing complete. Temporary indexing memory garbage collected.")


class GlobalFAISSRetriever:
    """Singleton global retriever that operates over pre-indexed FAISS/NumPy vectors."""

    @staticmethod
    def retrieve(query: str, category: str = "all", k: int = 3) -> List[Dict[str, Any]]:
        global _faiss_index, _doc_chunks
        if _faiss_index is None or not _doc_chunks:
            return []

        import torch
        import numpy as np
        model = get_embedding_model()

        # Compute query embedding with torch.no_grad()
        with torch.no_grad():
            q_emb = model.encode([query], convert_to_numpy=True)
            q_norm = np.linalg.norm(q_emb, axis=1, keepdims=True)
            q_norm[q_norm == 0] = 1.0
            q_emb = (q_emb / q_norm).astype(np.float32)

        index_type, index_obj = _faiss_index
        scored_indices = []

        if index_type == "faiss":
            distances, indices = index_obj.search(q_emb, max(k * 3, 10))
            if len(indices) > 0:
                for idx, score in zip(indices[0], distances[0]):
                    if idx >= 0 and idx < len(_doc_chunks):
                        scored_indices.append((idx, float(score)))
        else:
            # NumPy matrix dot product cosine similarity
            sims = np.dot(index_obj, q_emb.T).flatten()
            top_k_idx = np.argsort(sims)[::-1][:max(k * 3, 10)]
            for idx in top_k_idx:
                scored_indices.append((idx, float(sims[idx])))

        # Filter by category if requested
        cat_filter = category.lower().strip()
        cat_map = {
            "student": "students",
            "placement": "placements",
            "placement_officer": "placements",
            "faculty": "faculty"
        }
        target_cat = cat_map.get(cat_filter, cat_filter)

        results = []
        for idx, score in scored_indices:
            chunk = _doc_chunks[idx]
            chunk_cat = chunk.get("category", "").lower()
            if target_cat not in ["all", "general", ""] and chunk_cat not in ["all", "general", "", target_cat]:
                continue

            results.append({
                "id": chunk.get("id"),
                "content": chunk.get("content", ""),
                "file_name": chunk.get("file_name", "CampusOS Document"),
                "page_number": chunk.get("page_number", 1),
                "score": round(score, 3)
            })
            if len(results) >= k:
                break

        # If category filter yielded nothing, return top unfiltered matches
        if not results and scored_indices:
            for idx, score in scored_indices[:k]:
                chunk = _doc_chunks[idx]
                results.append({
                    "id": chunk.get("id"),
                    "content": chunk.get("content", ""),
                    "file_name": chunk.get("file_name", "CampusOS Document"),
                    "page_number": chunk.get("page_number", 1),
                    "score": round(score, 3)
                })

        return results


def generate_llm_answer(query: str, retrieved_chunks: List[Dict[str, Any]], user_role: str) -> str:
    """Generates grounded answer using OpenAI or Gemini REST API with zero local memory overhead."""
    if not retrieved_chunks:
        return "The requested information could not be found in the CampusOS knowledge base."

    context_blocks = []
    for idx, c in enumerate(retrieved_chunks, 1):
        context_blocks.append(
            f"[Source {idx} | Document: {c['file_name']} | Page {c['page_number']} | Relevance: {c['score']}]:\n{c['content']}"
        )
    formatted_context = "\n\n".join(context_blocks)

    # 1. Try OpenAI API if key available
    openai_key = os.getenv("OPENAI_API_KEY")
    if openai_key:
        try:
            import httpx
            prompt = (
                "You are CampusOS AI, the official University Operating System Assistant.\n"
                "Answer the user's question using ONLY the provided retrieved context below.\n"
                "Be concise, clear, and professional. If the context does not fully answer the question, summarize the relevant guidelines.\n\n"
                f"--- RETRIEVED CONTEXT (User Role: {user_role.upper()}) ---\n"
                f"{formatted_context}\n"
                "-----------------------------------------------\n"
                f"USER QUESTION: {query}"
            )
            res = httpx.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {openai_key}"},
                json={
                    "model": "gpt-3.5-turbo",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.3,
                    "max_tokens": 400
                },
                timeout=8.0
            )
            if res.status_code == 200:
                return res.json()["choices"][0]["message"]["content"].strip()
        except Exception as e:
            print(f"[RAG Service] OpenAI REST call error: {e}")

    # 2. Try Gemini REST API if key available
    gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if gemini_key:
        try:
            import httpx
            prompt = (
                "You are CampusOS AI, the official University Operating System Assistant.\n"
                "Answer the user's question using ONLY the provided retrieved context below.\n"
                f"--- RETRIEVED CONTEXT ---\n{formatted_context}\n"
                f"USER QUESTION: {query}"
            )
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
            res = httpx.post(
                url,
                json={"contents": [{"parts": [{"text": prompt}]}]},
                timeout=8.0
            )
            if res.status_code == 200:
                return res.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
        except Exception as e:
            print(f"[RAG Service] Gemini REST call error: {e}")

    # 3. Grounded fallback direct context answer
    return f"Based on official CampusOS Knowledge Documents:\n\n{formatted_context}"


def execute_pgvector_rag_query(
    query: str,
    user_role: str = "student",
    match_threshold: float = 0.10,
    k: int = 3
) -> Dict[str, Any]:
    """
    Executes Production RAG Search:
    Reuses global FAISS retriever and singleton model without recreating embeddings per request.
    """
    if not _rag_initialized:
        init_rag_service()

    retrieved_chunks = GlobalFAISSRetriever.retrieve(query=query, category=user_role, k=k)
    answer_text = generate_llm_answer(query=query, retrieved_chunks=retrieved_chunks, user_role=user_role)

    # Format sources list
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
        "confidence": 0.95 if retrieved_chunks else 0.50
    }


def execute_rag_query(query: str, role_or_category: str = "students", k: int = 3) -> Dict[str, Any]:
    """Compatibility wrapper for execute_pgvector_rag_query."""
    return execute_pgvector_rag_query(query=query, user_role=role_or_category, k=k)


def extract_text_from_pdf(file_bytes: bytes) -> List[Tuple[int, str]]:
    """Extracts text page-by-page from PDF binary data."""
    pages = []
    if pypdf:
        try:
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            for idx, page in enumerate(reader.pages, 1):
                t = page.extract_text() or ""
                if t.strip():
                    pages.append((idx, t.strip()))
        except Exception:
            pass
    if not pages:
        fallback = file_bytes.decode("utf-8", errors="ignore").strip()
        if fallback:
            pages.append((1, fallback))
    return pages


def extract_text_from_docx(file_bytes: bytes) -> List[Tuple[int, str]]:
    """Extracts text from DOCX binary data."""
    pages = []
    if docx:
        try:
            doc = docx.Document(io.BytesIO(file_bytes))
            full_t = "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
            if full_t.strip():
                pages.append((1, full_t.strip()))
        except Exception:
            pass
    return pages


def process_and_ingest_document(
    file_name: str,
    file_bytes: bytes,
    category: str = "General",
    uploader_id: Optional[str] = None,
    allowed_roles: Optional[List[str]] = None
) -> Dict[str, Any]:
    """Ingests new document into global vector index dynamically."""
    global _faiss_index, _doc_chunks
    ext = Path(file_name).suffix.lower()
    if ext == ".pdf":
        pages = extract_text_from_pdf(file_bytes)
    elif ext in [".docx", ".doc"]:
        pages = extract_text_from_docx(file_bytes)
    else:
        pages = [(1, file_bytes.decode("utf-8", errors="ignore"))]

    if not pages:
        raise ValueError(f"No text extracted from document '{file_name}'.")

    import torch
    import numpy as np
    model = get_embedding_model()

    new_chunks = []
    new_texts = []
    for page_num, page_text in pages:
        # Split text into 800-char blocks
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

    if new_texts:
        with torch.no_grad():
            embeddings = model.encode(new_texts, convert_to_numpy=True)
            norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
            norms[norms == 0] = 1.0
            embeddings = (embeddings / norms).astype(np.float32)

        if _faiss_index is not None:
            index_type, index_obj = _faiss_index
            if index_type == "faiss":
                index_obj.add(embeddings)
            else:
                _faiss_index = ("numpy", np.vstack([index_obj, embeddings]))
        _doc_chunks.extend(new_chunks)
        gc.collect()

    return {
        "file_name": file_name,
        "category": category,
        "chunks_indexed": len(new_chunks)
    }



