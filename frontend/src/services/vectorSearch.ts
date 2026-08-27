export interface VectorSearchParams {
  query: string;
  role?: string;
  threshold?: number;
  topK?: number;
}

export async function searchVectorDatabase(params: VectorSearchParams): Promise<any[]> {
  try {
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const response = await fetch(`${API_BASE}/api/v1/ai/knowledge/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: params.query,
        category: params.role,
        match_threshold: params.threshold || 0.20,
        k: params.topK || 5
      })
    });

    if (!response.ok) {
      throw new Error(`Vector search failed with status ${response.status}`);
    }

    const data = await response.json();
    const results = data.results || [];

    return results.map((item: any) => ({
      id: String(item.id || Math.random()),
      document_id: item.document_id || 'doc_unknown',
      content: item.content || '',
      chunk_index: item.chunk_index || 1,
      page_number: item.page_number || 1,
      role: params.role,
      file_name: item.title || item.file_name || 'CampusOS Document',
      similarity: item.score || 0.85
    }));
  } catch (error) {
    console.warn('[VectorSearch] Falling back to backend RAG engine:', error);
    return [];
  }
}
