/**
 * CampusOS AI - Role-Aware Document Retriever
 * Executes role-filtered vector similarity retrieval over document chunks.
 */

import { DocumentChunk, Role } from '../types/rag';
import { searchVectorDatabase } from '../services/vectorSearch';

export const ROLE_DOCUMENT_MAP: Record<Role, string[]> = {
  student: ['student', 'students', 'general', 'academic', 'attendance', 'hostel', 'exams', 'library', 'placement', 'placements'],
  faculty: ['faculty', 'academic', 'evaluation', 'courses', 'general'],
  warden: ['hostel', 'warden', 'leave', 'curfew', 'maintenance', 'general'],
  librarian: ['library', 'librarian', 'research', 'general'],
  admin: ['admin', 'student', 'faculty', 'warden', 'librarian', 'general', 'all']
};

export interface RetrievalResult {
  chunks: DocumentChunk[];
  maxSimilarity: number;
  roleUsed: Role;
}

/**
 * Single reusable retriever function for role-filtered RAG search.
 */
export async function retrieveDocuments(
  question: string,
  role: Role = 'student',
  k: number = 5,
  matchThreshold: number = 0.20
): Promise<RetrievalResult> {
  if (!question || question.trim().length === 0) {
    return { chunks: [], maxSimilarity: 0, roleUsed: role };
  }

  // 1. Role pre-retrieval filtering tags
  const allowedTags = ROLE_DOCUMENT_MAP[role] || ROLE_DOCUMENT_MAP.student;

  // 2. Perform role-filtered vector & keyword search against pgvector / API bridge
  const retrievedChunks = await searchVectorDatabase({
    query: question,
    role: role,
    allowedTags: allowedTags,
    topK: k,
    threshold: matchThreshold
  });

  // 3. Filter retrieved chunks to ensure strict role boundary (Admin can access all)
  const filteredChunks = retrievedChunks.filter(chunk => {
    if (role === 'admin') return true;
    const chunkRole = (chunk.role || '').toLowerCase();
    return allowedTags.some(tag => chunkRole.includes(tag));
  });

  const maxSimilarity = filteredChunks.reduce((max, c) => Math.max(max, c.similarity || 0), 0);

  return {
    chunks: filteredChunks.slice(0, k),
    maxSimilarity: maxSimilarity,
    roleUsed: role
  };
}
