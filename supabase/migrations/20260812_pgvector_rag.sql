-- ==============================================================================
-- CampusOS AI – Production Supabase PostgreSQL pgvector Migration
-- RAG Document Chunks, Vector Index & Stored Search Function (RPC)
-- ==============================================================================

-- 1. Enable pgvector Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. Ensure Master Knowledge Documents Table Exists
CREATE TABLE IF NOT EXISTS public.knowledge_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    content TEXT NOT NULL,
    source_url TEXT,
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    allowed_roles TEXT[] DEFAULT '{"student", "faculty", "admin", "hostel_warden", "placement_officer"}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create Vector Document Chunks Table (768-dim embeddings for all-mpnet-base-v2)
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

-- 4. Create Indexes for Vector Search and Filtering
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id 
    ON public.document_chunks(document_id);

CREATE INDEX IF NOT EXISTS idx_document_chunks_allowed_roles 
    ON public.document_chunks USING GIN (allowed_roles);

-- IVFFlat Index for High-Performance Vector Cosine Distance Search
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding_ivfflat 
    ON public.document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

-- Grant RLS Read/Write Access for Authenticated CampusOS Users
DROP POLICY IF EXISTS "Authenticated users knowledge_documents access" ON public.knowledge_documents;
CREATE POLICY "Authenticated users knowledge_documents access" 
    ON public.knowledge_documents FOR ALL 
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users document_chunks access" ON public.document_chunks;
CREATE POLICY "Authenticated users document_chunks access" 
    ON public.document_chunks FOR ALL 
    USING (auth.role() = 'authenticated');

-- 6. Vector Similarity Search Stored Procedure (RPC)
CREATE OR REPLACE FUNCTION public.match_document_chunks(
    query_embedding vector(768),
    match_threshold float DEFAULT 0.20,
    match_count int DEFAULT 5,
    user_role text DEFAULT 'student'
)
RETURNS TABLE (
    id UUID,
    document_id UUID,
    content TEXT,
    page_number INT,
    chunk_index INT,
    source_path TEXT,
    allowed_roles TEXT[],
    metadata JSONB,
    similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        dc.id,
        dc.document_id,
        dc.content,
        dc.page_number,
        dc.chunk_index,
        dc.source_path,
        dc.allowed_roles,
        dc.metadata,
        1 - (dc.embedding <=> query_embedding) AS similarity
    FROM public.document_chunks dc
    WHERE 
        (1 - (dc.embedding <=> query_embedding)) >= match_threshold
        AND (
            dc.allowed_roles IS NULL 
            OR ARRAY_LENGTH(dc.allowed_roles, 1) IS NULL
            OR user_role = 'super_admin'
            OR user_role = ANY(dc.allowed_roles)
        )
    ORDER BY dc.embedding <=> query_embedding ASC
    LIMIT match_count;
END;
$$;
