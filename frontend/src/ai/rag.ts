/**
 * CampusOS AI - RAG Orchestrator & Source Citation Engine
 * Combines role-based document retrieval, hallucination checks, prompt formatting,
 * and structured source citations.
 */

import { RAGResponse, Role, SourceCitation } from '../types/rag';
import { retrieveDocuments } from './retriever';
import { getRolePrompt, REFUSAL_MESSAGE } from './prompts';

export async function executeRoleGroundedRAG(
  question: string,
  role: Role = 'student'
): Promise<RAGResponse> {
  // 1. Validate query input
  if (!question || question.trim().length === 0) {
    return {
      answer: REFUSAL_MESSAGE,
      sources: [],
      confidence_score: 0.0
    };
  }

  // 2. Perform role-filtered document retrieval
  const { chunks, maxSimilarity } = await retrieveDocuments(question, role, 5, 0.20);

  // 3. Hallucination Control Check
  if (chunks.length === 0 || maxSimilarity < 0.20) {
    return {
      answer: REFUSAL_MESSAGE,
      sources: [],
      confidence_score: 0.0
    };
  }

  // 4. Format structured source citations
  const seenSources = new Set<string>();
  const citations: SourceCitation[] = [];

  for (const chunk of chunks) {
    const docName = chunk.file_name || 'CampusOS Handbook';
    const pageNum = chunk.page_number || 1;
    const score = Number((chunk.similarity || 0.85).toFixed(2));
    const key = `${docName}-p${pageNum}`;

    if (!seenSources.has(key)) {
      seenSources.add(key);
      citations.push({
        document_name: docName,
        page_number: pageNum,
        similarity_score: score
      });
    }
  }

  // 5. Query Backend Role-Aware Grounded RAG Endpoint
  try {
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const response = await fetch(`${API_BASE}/api/v1/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: question,
        role: role
      })
    });

    if (response.ok) {
      const data = await response.json();
      const rawAnswer = data.response || data.answer || '';
      
      if (rawAnswer.includes(REFUSAL_MESSAGE) || rawAnswer.trim().length < 15) {
        return {
          answer: REFUSAL_MESSAGE,
          sources: [],
          confidence_score: 0.0
        };
      }

      return {
        answer: rawAnswer,
        sources: citations,
        confidence_score: Math.min(Number(maxSimilarity.toFixed(2)), 0.98)
      };
    }
  } catch (err) {
    console.warn('[RAG Engine] Backend endpoint unreachable, synthesizing grounded response:', err);
  }

  // 6. Grounded synthesis fallback from retrieved chunks
  const promptConfig = getRolePrompt(role);
  const snippetText = chunks.slice(0, 3).map(c => c.content).join('\n\n');

  const answerText = `${promptConfig.description}:\n\n${snippetText}`;

  return {
    answer: answerText,
    sources: citations,
    confidence_score: Number(maxSimilarity.toFixed(2))
  };
}
