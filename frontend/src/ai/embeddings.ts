/**
 * CampusOS AI - Vector Embedding & Cosine Similarity Helpers
 * Utility functions for vector math and embedding calculations.
 */

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function generateTextEmbedding(text: string): Promise<number[]> {
  // Simple deterministic 128-dim hash vector representation for fallback offline math
  const clean = text.toLowerCase();
  const vector = new Array(128).fill(0);
  
  for (let i = 0; i < clean.length; i++) {
    const charCode = clean.charCodeAt(i);
    const idx = (charCode * (i + 1)) % 128;
    vector[idx] += (charCode / 255.0);
  }

  // Normalize vector to unit length
  const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return norm > 0 ? vector.map(v => v / norm) : vector;
}
