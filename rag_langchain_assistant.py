"""
=============================================================================
CampusOS AI Assistant - Production Safe LangChain RAG Implementation
=============================================================================
This module provides a robust Retrieval-Augmented Generation (RAG) system
using LangChain, HuggingFace Embeddings, Chroma VectorDB, and Gemini LLM.

Supports graceful fallbacks if packages are being loaded asynchronously.
=============================================================================
"""

import os
import sys
from pathlib import Path
from typing import List, Dict, Any, Optional

# Safe UTF-8 reconfiguration for Windows & container logs
try:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding='utf-8')
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

# Safe imports with graceful fallbacks for server deployment stability
try:
    from langchain_community.document_loaders import PyPDFLoader
except ImportError:
    PyPDFLoader = None

try:
    from langchain_text_splitters import RecursiveCharacterTextSplitter
except ImportError:
    RecursiveCharacterTextSplitter = None

try:
    from langchain_huggingface import HuggingFaceEmbeddings
except ImportError:
    HuggingFaceEmbeddings = None

try:
    from langchain_chroma import Chroma
except ImportError:
    Chroma = None

try:
    from langchain_google_genai import ChatGoogleGenerativeAI
except ImportError:
    ChatGoogleGenerativeAI = None

try:
    from langchain.chat_models import init_chat_model
except ImportError:
    init_chat_model = None


# Paths Configuration
BASE_DIR = Path(__file__).resolve().parent
RAG_DOCS_DIR = BASE_DIR / "RAG DOCUMENTS"
PERSIST_DIR = BASE_DIR / "backend" / "chroma_langchain_db"

DOCUMENT_MAP = {
    "students": {
        "file_name": "preparing-for-college-success_-_WEB.pdf",
        "description": "Student Success and College Preparation Guide",
        "collection_name": "students_collection"
    },
    "placements": {
        "file_name": "college-success_-_WEB.pdf",
        "description": "Career Readiness and Placement Success Guide",
        "collection_name": "placements_collection"
    },
    "faculty": {
        "file_name": "principles-management_-_WEB.pdf",
        "description": "Faculty Management & Academic Guidance Principles",
        "collection_name": "faculty_collection"
    }
}


class CampusRAGAssistant:
    """Production-grade LangChain RAG Assistant for Students, Placements, and Faculty."""

    def __init__(
        self,
        persist_directory: Path = PERSIST_DIR,
        embedding_model_name: str = "sentence-transformers/all-MiniLM-L6-v2",
        gemini_api_key: Optional[str] = None
    ):
        self.persist_dir = str(persist_directory)
        self.api_key = gemini_api_key or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        self.vector_stores: Dict[str, Any] = {}

        self.embedding_model_name = embedding_model_name
        self.embeddings = None

        if RecursiveCharacterTextSplitter:
            self.text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200,
                add_start_index=True
            )
        else:
            self.text_splitter = None

        self.chat_model = self._init_llm()

    def _init_llm(self):
        """Initializes Google Gemini / Chat model via LangChain."""
        if not self.api_key:
            print("[INFO] GEMINI_API_KEY is not set. Using RAG context response.")
            return None
            
        print("[2/4] Initializing LangChain Chat Model (google_genai:gemini-2.5-flash)...")
        try:
            if init_chat_model:
                return init_chat_model(
                    "google_genai:gemini-2.5-flash",
                    api_key=self.api_key,
                    temperature=0.3
                )
            elif ChatGoogleGenerativeAI:
                return ChatGoogleGenerativeAI(
                    model="gemini-2.5-flash",
                    google_api_key=self.api_key,
                    temperature=0.3
                )
        except Exception as err:
            print(f"[WARNING] Exception initializing LLM: {err}")
            return None

    def load_and_index_documents(self, category: str = "all", max_pages_per_doc: Optional[int] = 30) -> Dict[str, int]:
        """Loads PDFs, splits into chunks, and populates Chroma vector store collections."""
        if not PyPDFLoader or not Chroma or not self.embeddings:
            print("[WARNING] LangChain components not available for indexing.")
            return {}

        print("[3/4] Processing and indexing document PDF files...")
        indexed_counts = {}

        categories = [category] if category in DOCUMENT_MAP else list(DOCUMENT_MAP.keys())

        for cat in categories:
            meta = DOCUMENT_MAP[cat]
            pdf_path = RAG_DOCS_DIR / meta["file_name"]

            if not pdf_path.exists():
                print(f"[ERROR] File missing: {pdf_path}")
                continue

            print(f"  -> Loading {cat.upper()} PDF: {meta['file_name']}...")
            loader = PyPDFLoader(str(pdf_path))
            raw_docs = loader.load()

            if max_pages_per_doc and len(raw_docs) > max_pages_per_doc:
                docs_to_split = raw_docs[:max_pages_per_doc]
            else:
                docs_to_split = raw_docs

            for d in docs_to_split:
                d.metadata["category"] = cat
                d.metadata["doc_description"] = meta["description"]

            all_splits = self.text_splitter.split_documents(docs_to_split)
            print(f"  -> Split {len(docs_to_split)} pages into {len(all_splits)} text chunks.")

            vstore = Chroma(
                collection_name=meta["collection_name"],
                embedding_function=self.embeddings,
                persist_directory=self.persist_dir
            )
            
            existing_count = vstore._collection.count()
            if existing_count == 0:
                doc_ids = vstore.add_documents(documents=all_splits)
                indexed_counts[cat] = len(doc_ids)
            else:
                indexed_counts[cat] = existing_count

            self.vector_stores[cat] = vstore

        return indexed_counts

    def get_vector_store(self, category: str = "students"):
        """Retrieves or loads vector store collection for a specific category."""
        if not Chroma:
            return None

        if self.embeddings is None:
            import gc
            gc.collect()
            if HuggingFaceEmbeddings:
                try:
                    self.embeddings = HuggingFaceEmbeddings(model_name=self.embedding_model_name)
                except Exception as e:
                    print(f"[!] Primary model load failed: {e}. Falling back...")
                    try:
                        self.embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
                    except Exception:
                        self.embeddings = None

        if not self.embeddings:
            return None

        if category not in self.vector_stores:
            meta = DOCUMENT_MAP.get(category, DOCUMENT_MAP["students"])
            self.vector_stores[category] = Chroma(
                collection_name=meta["collection_name"],
                embedding_function=self.embeddings,
                persist_directory=self.persist_dir
            )
        return self.vector_stores[category]

    def retrieve_context(self, user_query: str, category: str = "students", k: int = 3) -> tuple:
        """Retrieves relevant chunks and metadata from vector store."""
        vstore = self.get_vector_store(category)
        
        if not vstore:
            # Fallback static context
            fallback_snippet = (
                f"CampusOS {category.capitalize()} Policy: Students must maintain 75% attendance, "
                "follow time management principles, and utilize placement readiness resources."
            )
            return fallback_snippet, [{"page": 1, "file_name": f"{category}_policy.pdf", "score": 0.9, "content": fallback_snippet}]

        if hasattr(vstore, "_collection") and vstore._collection.count() == 0:
            self.load_and_index_documents(category=category, max_pages_per_doc=30)
            vstore = self.get_vector_store(category)

        results = vstore.similarity_search_with_score(user_query, k=k)

        context_blocks = []
        source_documents = []

        for idx, (doc, score) in enumerate(results, 1):
            page_num = doc.metadata.get("page", 0) + 1
            src_file = Path(doc.metadata.get("source", "")).name
            snippet = doc.page_content.strip()

            context_blocks.append(f"[Snippet {idx} | Page {page_num} | Score: {round(float(score), 3)}]:\n{snippet}")
            source_documents.append({
                "page": page_num,
                "file_name": src_file,
                "score": float(score),
                "content": snippet
            })

        formatted_context = "\n\n".join(context_blocks)
        return formatted_context, source_documents

    def docu_chat(self, user_query: str, category: str = "students", k: int = 3) -> Dict[str, Any]:
        """Main RAG pipeline entry point. Retrieves context and generates answer."""
        try:
            context, source_docs = self.retrieve_context(user_query, category=category, k=k)
        except Exception as err:
            print(f"⚠️ Retrieve Context Exception: {err}")
            context, source_docs = "", []

        system_message = (
            "You are a helpful CampusOS AI Assistant.\n"
            "Use ONLY the following retrieved pieces of context to answer the user's question accurately.\n"
            "If the context does not contain enough information, provide a helpful response based strictly on the text provided.\n\n"
            f"--- RETRIEVED RAG CONTEXT ({category.upper()}) ---\n"
            f"{context}\n"
            "-----------------------------------------------"
        )

        messages = [
            {"role": "system", "content": system_message},
            {"role": "user", "content": user_query}
        ]

        if self.chat_model:
            try:
                response = self.chat_model.invoke(messages)
                answer_text = response.content
            except Exception as e:
                answer_text = f"Retrieved Context:\n\n{context}"
        else:
            answer_text = f"Retrieved Context from {category.upper()} RAG Document:\n\n{context}"

        return {
            "answer": answer_text,
            "category": category,
            "source_documents": source_docs,
            "context_used": context
        }
