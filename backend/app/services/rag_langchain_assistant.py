"""
=============================================================================
CampusOS AI Assistant - Complete LangChain RAG Implementation
=============================================================================
This module provides a complete Retrieval-Augmented Generation (RAG) system
using LangChain, HuggingFace Embeddings, Chroma VectorDB, and Gemini LLM.

RAG Target Documents:
1. Students:   "preparing-for-college-success_-_WEB.pdf"
2. Placements: "college-success_-_WEB.pdf"
3. Faculty:    "principles-management_-_WEB.pdf"
=============================================================================
"""

import os
import sys
from pathlib import Path
from typing import List, Dict, Any, Optional

# Reconfigure stdout/stderr encoding for Windows compatibility
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

# LangChain & Community Imports
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma

# Google Gemini / Chat Model Integration
try:
    from langchain_google_genai import ChatGoogleGenerativeAI
except ImportError:
    ChatGoogleGenerativeAI = None

try:
    from langchain.chat_models import init_chat_model
except ImportError:
    init_chat_model = None


# Paths Configuration
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
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
        embedding_model_name: str = "sentence-transformers/all-mpnet-base-v2",
        gemini_api_key: Optional[str] = None
    ):
        self.persist_dir = str(persist_directory)
        self.api_key = gemini_api_key or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        
        print("[1/4] Initializing HuggingFace Embeddings model...")
        try:
            self.embeddings = HuggingFaceEmbeddings(model_name=embedding_model_name)
        except Exception as e:
            print(f"[!] Primary model {embedding_model_name} load failed: {e}. Falling back to all-MiniLM-L6-v2...")
            self.embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
            
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            add_start_index=True
        )

        self.vector_stores: Dict[str, Chroma] = {}
        self.chat_model = self._init_llm()

    def _init_llm(self):
        """Initializes Google Gemini / Chat model via LangChain."""
        if not self.api_key:
            print("[INFO] GEMINI_API_KEY is not set. Retrieval will work; generation will use context fallback.")
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
                print(f"  -> Sampling first {max_pages_per_doc} pages out of {len(raw_docs)} for fast indexing...")
                docs_to_split = raw_docs[:max_pages_per_doc]
            else:
                docs_to_split = raw_docs

            # Add metadata tags
            for d in docs_to_split:
                d.metadata["category"] = cat
                d.metadata["doc_description"] = meta["description"]

            all_splits = self.text_splitter.split_documents(docs_to_split)
            print(f"  -> Split {len(docs_to_split)} pages into {len(all_splits)} text chunks.")

            # Create/get persistent vector store collection
            vstore = Chroma(
                collection_name=meta["collection_name"],
                embedding_function=self.embeddings,
                persist_directory=self.persist_dir
            )
            
            # Check if vector store is empty before adding
            existing_count = vstore._collection.count()
            if existing_count == 0:
                doc_ids = vstore.add_documents(documents=all_splits)
                print(f"  [SUCCESS] Indexed {len(doc_ids)} chunk vectors into '{meta['collection_name']}'.")
                indexed_counts[cat] = len(doc_ids)
            else:
                print(f"  [SUCCESS] Collection '{meta['collection_name']}' already contains {existing_count} indexed chunks.")
                indexed_counts[cat] = existing_count

            self.vector_stores[cat] = vstore

        return indexed_counts

    def get_vector_store(self, category: str = "students") -> Chroma:
        """Retrieves or loads vector store collection for a specific category."""
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
        
        # Ensure collection has indexed docs if empty
        if vstore._collection.count() == 0:
            print(f"[INFO] Collection for '{category}' empty. Indexing target PDF document...")
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
        context, source_docs = self.retrieve_context(user_query, category=category, k=k)

        system_message = (
            "You are a helpful CampusOS AI Assistant.\n"
            "Use ONLY the following retrieved pieces of context to answer the user's question accurately.\n"
            "If the context does not contain enough information, provide a helpful response based strictly on the text provided, "
            "and do not invent facts.\n\n"
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
                answer_text = f"Context retrieved successfully. Summary of retrieved content:\n\n{context}"
        else:
            answer_text = (
                f"Retrieved context from {category.upper()} RAG Document:\n\n"
                f"{context}\n\n"
                "*(Note: Provide GEMINI_API_KEY in environment for live Gemini generation)*"
            )

        return {
            "answer": answer_text,
            "category": category,
            "source_documents": source_docs,
            "context_used": context
        }


# =============================================================================
# Direct Script Execution Demonstration
# =============================================================================
if __name__ == "__main__":
    print("=================================================================")
    print(" CampusOS LangChain RAG System - Multi-Document AI Assistant")
    print("=================================================================")

    # Initialize RAG Assistant
    assistant = CampusRAGAssistant()

    # Index 15 pages per PDF for fast demonstration test
    assistant.load_and_index_documents(category="all", max_pages_per_doc=15)

    print("\n[4/4] Executing Sample Queries across 3 Target Documents...\n")

    queries = [
        ("students", "What are effective strategies for college academic success and time management?"),
        ("placements", "What skills and preparation are essential for career success and job interviews?"),
        ("faculty", "What are the core principles of management and academic leadership?")
    ]

    for cat, query in queries:
        print("-----------------------------------------------------------------")
        print(f"Target RAG Category: [{cat.upper()}]")
        print(f"Query: {query}")
        print("-----------------------------------------------------------------")

        result = assistant.docu_chat(query, category=cat, k=2)

        print(f"Answer:\n{result['answer']}\n")
        print(f"Source Chunks ({len(result['source_documents'])} retrieved):")
        for idx, src in enumerate(result['source_documents'], 1):
            print(f"   [{idx}] Page {src['page']} in {src['file_name']} (Score: {round(src['score'], 3)})")
            print(f"       Snippet: {src['content'][:120]}...\n")

    print("=================================================================")
    print(" [SUCCESS] LangChain RAG Execution completed successfully!")
    print("=================================================================")
