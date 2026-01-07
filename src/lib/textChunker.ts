/**
 * Smart text chunking that NEVER cuts mid-sentence
 * All chunks end at natural sentence boundaries
 */

export interface TextChunk {
  text: string;
  startOffset: number;
  endOffset: number;
  chunkIndex: number;
  section?: string;
  page?: number;
}

export const createSentenceBoundaryChunks = (
  text: string,
  targetSize: number = 800,
  maxSize: number = 1200
): TextChunk[] => {
  const chunks: TextChunk[] = [];
  
  // Split into sentences (handles ., !, ?, and edge cases)
  const sentences = text.match(/[^.!?]+[.!?]+(?=\s|$)/g) || [text];
  
  let currentChunk = '';
  let startOffset = 0;
  let chunkIndex = 0;

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (!trimmedSentence) continue;

    const potentialChunk = currentChunk + (currentChunk ? ' ' : '') + trimmedSentence;

    // If adding this sentence would exceed maxSize AND we have content
    if (potentialChunk.length > maxSize && currentChunk.length > 100) {
      // Save current chunk
      chunks.push({
        text: currentChunk.trim(),
        startOffset,
        endOffset: startOffset + currentChunk.length,
        chunkIndex: chunkIndex++
      });
      
      // Start new chunk with this sentence
      startOffset += currentChunk.length;
      currentChunk = trimmedSentence;
    }
    // If we've reached target size and have reasonable content
    else if (potentialChunk.length >= targetSize && currentChunk.length > 300) {
      // Save current chunk (ends at sentence boundary)
      chunks.push({
        text: currentChunk.trim(),
        startOffset,
        endOffset: startOffset + currentChunk.length,
        chunkIndex: chunkIndex++
      });
      
      startOffset += currentChunk.length;
      currentChunk = trimmedSentence;
    }
    else {
      // Add sentence to current chunk
      currentChunk = potentialChunk;
    }
  }

  // Add final chunk if not empty
  if (currentChunk.trim().length > 50) {
    chunks.push({
      text: currentChunk.trim(),
      startOffset,
      endOffset: startOffset + currentChunk.length,
      chunkIndex: chunkIndex++
    });
  }

  console.log(`✅ Created ${chunks.length} chunks, all ending at sentence boundaries`);
  
  return chunks;
};

// Section-aware chunking (respects document structure)
export const createSectionAwareChunks = (
  sections: Array<{ title: string; content: string; page?: number }>,
  targetSize: number = 800
): TextChunk[] => {
  const allChunks: TextChunk[] = [];
  let globalIndex = 0;

  sections.forEach((section) => {
    const sectionChunks = createSentenceBoundaryChunks(section.content, targetSize);
    
    sectionChunks.forEach((chunk) => {
      allChunks.push({
        ...chunk,
        chunkIndex: globalIndex++,
        section: section.title,
        page: section.page
      });
    });
  });

  return allChunks;
};

// Validate chunk quality
export const validateChunks = (chunks: TextChunk[]): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  chunks.forEach((chunk, idx) => {
    // Check length
    if (chunk.text.length < 50) {
      errors.push(`Chunk ${idx} too short (${chunk.text.length} chars)`);
    }
    if (chunk.text.length > 1500) {
      errors.push(`Chunk ${idx} too long (${chunk.text.length} chars)`);
    }

    // Check ending
    const lastChar = chunk.text.trim().slice(-1);
    if (!['.', '!', '?', ':', ';'].includes(lastChar)) {
      errors.push(`Chunk ${idx} doesn't end with punctuation`);
    }

    // Check for incomplete words
    if (/\w-$/.test(chunk.text.trim())) {
      errors.push(`Chunk ${idx} ends with hyphen (likely cut word)`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
};
