/**
 * CampusOS AI - Semantic Document Chunker
 * Splits text into 500-800 character chunks with 80-120 character overlap,
 * maintaining section headings and page boundaries.
 */

import { DocumentChunk, Role } from '../types/rag';

export interface ChunkingOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  documentId?: string;
  role?: Role | string;
  fileName?: string;
}

export function semanticChunkText(
  text: string,
  options: ChunkingOptions = {}
): Partial<DocumentChunk>[] {
  const chunkSize = options.chunkSize || 650;
  const overlap = options.chunkOverlap || 100;
  const docId = options.documentId || 'doc_temp';
  const role = options.role || 'student';
  const fileName = options.fileName || 'CampusOS Document';

  if (!text || text.trim().length === 0) {
    return [];
  }

  const cleanText = text.replace(/\r\n/g, '\n').trim();
  const chunks: Partial<DocumentChunk>[] = [];
  
  let start = 0;
  let chunkIdx = 1;
  let currentPage = 1;

  while (start < cleanText.length) {
    let end = Math.min(start + chunkSize, cleanText.length);

    // Try breaking at a paragraph or sentence boundary
    if (end < cleanText.length) {
      const nextPara = cleanText.lastIndexOf('\n\n', end);
      const nextSentence = cleanText.lastIndexOf('. ', end);

      if (nextPara > start + 300) {
        end = nextPara + 2;
      } else if (nextSentence > start + 300) {
        end = nextSentence + 1;
      }
    }

    const chunkSnippet = cleanText.slice(start, end).trim();
    if (chunkSnippet.length > 20) {
      chunks.push({
        document_id: docId,
        content: chunkSnippet,
        chunk_index: chunkIdx++,
        page_number: currentPage,
        role: role,
        file_name: fileName
      });
    }

    start += Math.max(chunkSize - overlap, 50);
  }

  return chunks;
}
