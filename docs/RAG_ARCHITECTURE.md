# CampusOS AI – Production RAG System Architecture

Visual system architecture for the persistent **Supabase PostgreSQL + pgvector** Retrieval-Augmented Generation (RAG) pipeline in CampusOS AI.

## 📊 End-to-End Ingestion & Query Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Campus User / Officer
    participant API as FastAPI Backend
    participant Storage as Supabase Storage (campusos-media)
    participant Embed as Embeddings Engine (sentence-transformers / Gemini)
    participant DB as Supabase PostgreSQL (pgvector)
    participant LLM as Google Gemini LLM

    rect rgb(235, 245, 255)
    note right of User: Document Ingestion Pipeline
    User->>API: Upload PDF/DOCX (POST /ai/knowledge/upload)
    API->>Storage: Store original binary file (knowledge/{category}/{file})
    API->>API: Extract text & split into chunks (RecursiveCharacterSplitter)
    API->>Embed: Generate 768-dim embeddings for text chunks
    API->>DB: Insert document metadata & vector embeddings into `document_chunks`
    API-->>User: Return ingestion success status & chunk counts
    end

    rect rgb(245, 255, 235)
    note right of User: Role-Aware Grounded RAG Query Pipeline
    User->>API: Send query (POST /ai/chat or /ai/knowledge/search)
    API->>Embed: Embed query text to 768-dim vector
    API->>DB: Call RPC `match_document_chunks(vector, threshold, k, user_role)`
    DB-->>API: Return top-k matching chunks respecting role permissions
    alt Relevant chunks found
        API->>LLM: Send query + retrieved context blocks
        LLM-->>API: Return grounded answer with citations
    else Similarity below threshold
        API-->>API: Return exact non-hallucination fallback response
    end
    API-->>User: Display answer with source document & page number citations
    end
```

## 🔒 Security & Access Matrix

| Role | Access Permissions |
| :--- | :--- |
| `student` | Student success guides, course documents, general campus knowledge |
| `faculty` | Faculty policies, course management, academic research documents |
| `placement_officer` | Placement drives, recruiter statistics, student resume bank |
| `hostel_warden` | Hostel rules, occupancy guidelines, leave policies |
| `admin` / `super_admin` | Universal access to all knowledge bases & administrative documents |
