// Intelligent semantic chunking using Groq LLaMA

interface ChunkResult {
  text: string;
  section: string;
  startOffset: number;
  endOffset: number;
  chunkIndex: number;
}

// Create intelligent chunks with semantic boundaries
export const createIntelligentChunks = async (
  text: string,
  groqApiKey?: string
): Promise<ChunkResult[]> => {
  try {
    // First, split text into rough sections
    const sections = splitIntoSections(text);
    
    const chunks: ChunkResult[] = [];
    let globalChunkIndex = 0;

    for (const section of sections) {
      let sectionChunks: ChunkResult[];
      
      // Use Groq LLaMA for semantic chunking if API key available
      if (groqApiKey && section.text.length > 500) {
        sectionChunks = await findSemanticBoundaries(
          section.text,
          section.title,
          groqApiKey,
          globalChunkIndex
        );
      } else {
        // Fallback to sentence-boundary chunking
        sectionChunks = sentenceBoundaryChunking(section.text, section.title, globalChunkIndex);
      }

      chunks.push(...sectionChunks);
      globalChunkIndex += sectionChunks.length;
    }

    return chunks;
  } catch (error) {
    console.error('Intelligent chunking error, falling back to simple chunking:', error);
    return fallbackChunking(text);
  }
};

// Find semantic boundaries using Groq LLaMA
const findSemanticBoundaries = async (
  text: string,
  sectionTitle: string,
  apiKey: string,
  startIndex: number
): Promise<ChunkResult[]> => {
  try {
    // Limit text length for API
    const limitedText = text.slice(0, 8000);
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are a document chunking expert. Split text into semantic chunks of 600-1000 characters. 
Each chunk should:
- End at natural boundaries (end of paragraph, sentence, or idea)
- NOT cut off mid-sentence
- Be meaningful and self-contained
- Preserve context

Return ONLY a JSON array of chunk texts. Example: ["First chunk text...", "Second chunk text..."]`
          },
          {
            role: 'user',
            content: `Section: "${sectionTitle}"\n\nText to chunk:\n${limitedText}`
          }
        ],
        temperature: 0.1,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      throw new Error('Groq API error');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Parse JSON response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const chunkTexts = JSON.parse(jsonMatch[0]);
      
      // Map back to ChunkResult format
      let currentOffset = 0;
      return chunkTexts.map((chunkText: string, idx: number) => {
        const start = currentOffset;
        const end = start + chunkText.length;
        currentOffset = end;
        
        return {
          text: chunkText.trim(),
          section: sectionTitle,
          startOffset: start,
          endOffset: end,
          chunkIndex: startIndex + idx
        };
      });
    }

    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Groq semantic chunking error:', error);
    // Fallback to sentence-boundary chunking
    return sentenceBoundaryChunking(text, sectionTitle, startIndex);
  }
};

// Fallback: Simple sentence-boundary chunking
const sentenceBoundaryChunking = (
  text: string,
  sectionTitle: string,
  startIndex: number
): ChunkResult[] => {
  const chunks: ChunkResult[] = [];
  const targetSize = 800;
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  let currentChunk = '';
  let startOffset = 0;
  let chunkIndex = 0;

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > targetSize && currentChunk.length > 0) {
      // Save current chunk
      chunks.push({
        text: currentChunk.trim(),
        section: sectionTitle,
        startOffset,
        endOffset: startOffset + currentChunk.length,
        chunkIndex: startIndex + chunkIndex
      });
      
      startOffset += currentChunk.length;
      currentChunk = sentence;
      chunkIndex++;
    } else {
      currentChunk += sentence;
    }
  }

  // Add final chunk
  if (currentChunk.trim().length > 0) {
    chunks.push({
      text: currentChunk.trim(),
      section: sectionTitle,
      startOffset,
      endOffset: startOffset + currentChunk.length,
      chunkIndex: startIndex + chunkIndex
    });
  }

  return chunks;
};

// Simple fallback chunking
const fallbackChunking = (text: string): ChunkResult[] => {
  return sentenceBoundaryChunking(text, 'Document', 0);
};

// Split text into major sections
const splitIntoSections = (text: string): Array<{ title: string; text: string }> => {
  const lines = text.split('\n');
  const sections: Array<{ title: string; text: string }> = [];
  let currentSection = { title: 'Introduction', text: '' };

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Check if it's a header
    if (
      trimmed.length > 5 && 
      trimmed.length < 100 && 
      (
        /^[A-Z\s]{5,}$/.test(trimmed) || // ALL CAPS
        (trimmed.endsWith(':') && trimmed.length < 80) || // Ends with colon
        /^(Chapter|Section|Part)\s+\d+/i.test(trimmed) // Chapter/Section/Part
      )
    ) {
      // Save previous section
      if (currentSection.text.trim().length > 0) {
        sections.push({ ...currentSection });
      }
      
      // Start new section
      currentSection = {
        title: trimmed.replace(/:$/, ''),
        text: ''
      };
    } else {
      currentSection.text += line + '\n';
    }
  }

  // Add final section
  if (currentSection.text.trim().length > 0) {
    sections.push(currentSection);
  }

  return sections.length > 0 ? sections : [{ title: 'Document', text }];
};
