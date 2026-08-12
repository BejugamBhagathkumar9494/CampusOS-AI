# Supabase PostgreSQL + pgvector RAG Setup & Integration Guide

CampusOS AI utilizes a production-ready **Supabase PostgreSQL + pgvector** Retrieval-Augmented Generation (RAG) architecture.

## 🏗️ Architecture Overview

```
User Document (PDF/DOCX)
        │
        ▼
Supabase Storage ('campusos-media')
        │
        ▼
FastAPI Document Processor
        │
        ├── Extract Text (PyPDF / python-docx)
        ├── Chunk Text (RecursiveCharacterTextSplitter)
        └── Generate 768-dim Embeddings (HuggingFace / Gemini)
        │
        ▼
Supabase PostgreSQL ('document_chunks' table)
        │
        ▼
Role-Filtered Vector Similarity Search ('match_document_chunks' RPC)
        │
        ▼
Grounded Answer Generation (Google Gemini LLM)
```

## 📜 Database Migration Setup

Execute `supabase/migrations/20260812_pgvector_rag.sql` in your Supabase SQL Editor:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Document Chunks Table with 768-dim Embeddings
CREATE TABLE IF NOT EXISTS public.document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES public.knowledge_documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding vector(768) NOT NULL,
    chunk_index INT NOT NULL DEFAULT 0,
    page_number INT DEFAULT 1,
    source_path TEXT,
    allowed_roles TEXT[] DEFAULT '{"student", "faculty", "admin", "hostel_warden", "placement_officer"}',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cosine Distance IVFFlat Index
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding_ivfflat 
    ON public.document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

## 🔒 Role-Based Access Control

The stored procedure `match_document_chunks` automatically filters search results based on the querying user's active role (`student`, `faculty`, `placement_officer`, `hostel_warden`, `admin`, `super_admin`).

## 📡 API Endpoints

### 1. Ingest Knowledge Document
- **Endpoint**: `POST /api/v1/ai/knowledge/upload`
- **Body**: `Multipart/Form-Data`
  - `file`: PDF or DOCX file
  - `category`: Knowledge category (e.g. `Academics`, `Placements`, `Faculty`)
  - `allowed_roles`: Comma-separated roles (e.g. `student,faculty,admin`)

### 2. Search Knowledge Base
- **Endpoint**: `POST /api/v1/ai/knowledge/search`
- **Body**: `JSON`
  - `query`: Search query text
  - `category`: Target role or category

### 3. Role-Aware AI Chat
- **Endpoint**: `POST /api/v1/ai/chat`
- **Body**: `JSON`
  - `message`: User message
  - `chat_id`: Session ID
