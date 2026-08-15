/**
 * CampusOS AI - Role-Based RAG System Types
 * Production-ready TypeScript definitions
 */

export type Role = 'student' | 'faculty' | 'warden' | 'librarian' | 'admin';

export interface RAGDocument {
  id: string;
  title: string;
  role: Role | string;
  file_path: string;
  file_type: string;
  uploaded_by: string;
  created_at: string;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  content: string;
  embedding?: number[];
  chunk_index: number;
  page_number: number;
  role: Role | string;
  similarity?: number;
  file_name?: string;
}

export interface SourceCitation {
  document_name: string;
  page_number: number;
  similarity_score: number;
}

export interface RAGResponse {
  answer: string;
  sources: SourceCitation[];
  confidence_score: number;
}

export interface RolePrompt {
  role: Role;
  prompt_template: string;
  description: string;
}
