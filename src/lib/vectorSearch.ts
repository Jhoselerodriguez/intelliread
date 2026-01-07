import type { Chunk } from '@/types';

// Simple embedding generation using TF-IDF style approach
// In production, you'd use Universal Sentence Encoder or similar
export const generateEmbedding = (text: string): number[] => {
  // Create a simple embedding based on character and word frequencies
  const embedding: number[] = new Array(128).fill(0);
  const words = text.toLowerCase().split(/\s+/);
  
  words.forEach((word, idx) => {
    // Hash word to index
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = ((hash << 5) - hash) + word.charCodeAt(i);
      hash = hash & hash;
    }
    const index = Math.abs(hash) % embedding.length;
    embedding[index] += 1;
    
    // Add positional encoding
    const posIndex = (index + idx) % embedding.length;
    embedding[posIndex] += 0.5;
  });
  
  // Normalize
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] /= magnitude;
    }
  }
  
  return embedding;
};

export const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  if (vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
};

export const searchChunks = (
  query: string,
  chunks: Chunk[],
  topK: number = 5
): (Chunk & { score: number })[] => {
  const queryEmbedding = generateEmbedding(query);
  
  const results = chunks.map(chunk => ({
    ...chunk,
    score: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));
  
  // Also add keyword matching boost
  const queryWords = query.toLowerCase().split(/\s+/);
  results.forEach(result => {
    const textLower = result.text.toLowerCase();
    queryWords.forEach(word => {
      if (textLower.includes(word)) {
        result.score += 0.1;
      }
    });
  });

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, topK);
};
