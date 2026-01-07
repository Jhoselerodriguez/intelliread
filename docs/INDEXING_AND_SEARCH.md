# Indexing and Search

This document describes how IntelliRead indexes document content and performs search operations.

## Indexing Strategy

### Storage Architecture

All data is stored in IndexedDB using the `idb` library:

```typescript
const DB_NAME = 'intelliread-db';
const DB_VERSION = 1;

const stores = {
  documents: 'id',       // Document metadata
  sections: 'id',        // Extracted sections
  chunks: 'id',          // Text chunks for retrieval
  tables: 'id',          // Extracted tables
  chatHistory: 'id',     // Conversation history
  apiSettings: 'key'     // API configuration
};
```

### Document Store Schema

```typescript
interface StoredDocument {
  id: string;
  title: string;
  pageCount: number;
  wordCount: number;
  uploadedAt: Date;
  status: 'processing' | 'indexed' | 'error';
  hasImages: boolean;
  hasAIAnalysis: boolean;
  metadata?: {
    author?: string;
    subject?: string;
    keywords?: string[];
  };
}
```

### Section Store Schema

```typescript
interface StoredSection {
  id: string;
  documentId: string;
  title: string;
  content: string;
  pageStart: number;
  pageEnd: number;
  order: number;
  isImageDerived: boolean;
  bulletPoints: string[];
}
```

### Chunk Store Schema

```typescript
interface StoredChunk {
  id: string;
  documentId: string;
  sectionId: string;
  text: string;
  pageStart: number;
  pageEnd: number;
  chunkIndex: number;
  charCount: number;
  isImageDerived: boolean;
}
```

---

## Chunking Strategy

### Goals

1. **Semantic coherence**: Each chunk should be a complete thought
2. **Optimal size**: Balance between context and precision
3. **Retrieval efficiency**: Chunks should be distinguishable
4. **Source traceability**: Every chunk links to source pages

### Algorithm

```typescript
function createChunks(
  content: string,
  targetSize: number = 800,
  maxSize: number = 1200
): Chunk[] {
  const sentences = splitIntoSentences(content);
  const chunks: Chunk[] = [];
  let currentChunk = '';
  let chunkIndex = 0;
  
  for (const sentence of sentences) {
    const potential = currentChunk + ' ' + sentence;
    
    if (potential.length > maxSize && currentChunk.length > 100) {
      // Save current chunk
      chunks.push({
        text: currentChunk.trim(),
        chunkIndex: chunkIndex++
      });
      currentChunk = sentence;
    } else if (potential.length >= targetSize && currentChunk.length > 300) {
      // Target reached, save
      chunks.push({
        text: currentChunk.trim(),
        chunkIndex: chunkIndex++
      });
      currentChunk = sentence;
    } else {
      currentChunk = potential;
    }
  }
  
  // Save remaining
  if (currentChunk.trim().length > 50) {
    chunks.push({
      text: currentChunk.trim(),
      chunkIndex: chunkIndex
    });
  }
  
  return chunks;
}
```

### Sentence Splitting

```typescript
function splitIntoSentences(text: string): string[] {
  // Match sentences ending with . ! ? followed by space or end
  return text.match(/[^.!?]+[.!?]+(?=\s|$)/g) || [text];
}
```

### Chunk Validation

Every chunk is validated before storage:

| Validation | Rule |
|------------|------|
| Minimum length | > 50 characters |
| Maximum length | < 1500 characters |
| Ends with punctuation | `.` `!` `?` `:` `;` |
| No cut words | Does not end with hyphen |

---

## Section Handling

### Section Detection

Sections are identified by heading patterns:

```typescript
const HEADING_PATTERNS = [
  /^(?:Chapter|Section|Part)\s+\d+[:.]/i,
  /^\d+\.\d*\s+[A-Z]/,                      // 1.2 Title
  /^[A-Z][A-Z\s]{4,}$/,                     // ALL CAPS (5+ chars)
  /^(?:Introduction|Conclusion|Summary|Abstract)$/i
];

function isHeading(text: string): boolean {
  return HEADING_PATTERNS.some(p => p.test(text.trim()));
}
```

### Section Building

```typescript
function buildSections(pages: ExtractedPage[]): Section[] {
  const sections: Section[] = [];
  let currentSection: Section | null = null;
  
  for (const page of pages) {
    const lines = page.text.split('\n');
    
    for (const line of lines) {
      if (isHeading(line)) {
        // Save previous section
        if (currentSection) {
          sections.push(currentSection);
        }
        // Start new section
        currentSection = {
          title: line.trim(),
          content: '',
          pageStart: page.page,
          pageEnd: page.page
        };
      } else if (currentSection) {
        currentSection.content += line + '\n';
        currentSection.pageEnd = page.page;
      }
    }
  }
  
  return sections;
}
```

---

## Metadata Handling

### Chunk Metadata

Each chunk carries metadata for retrieval context:

```typescript
interface ChunkMetadata {
  documentId: string;
  documentTitle: string;
  sectionTitle: string;
  pageStart: number;
  pageEnd: number;
  isImageDerived: boolean;
  charOffset: number;
}
```

### Usage in Q&A

When building prompts for AI:

```typescript
function buildContext(chunks: ChunkWithMeta[]): string {
  return chunks.map(c => 
    `[Source: "${c.sectionTitle}", Page ${c.pageStart}]\n${c.text}`
  ).join('\n\n---\n\n');
}
```

---

## Search Implementation

### Keyword Search

Basic keyword matching with ranking:

```typescript
async function keywordSearch(
  documentId: string,
  query: string
): Promise<SearchResult[]> {
  const chunks = await db.getAllFromIndex('chunks', 'documentId', documentId);
  const queryTerms = query.toLowerCase().split(/\s+/);
  
  const scored = chunks.map(chunk => {
    const text = chunk.text.toLowerCase();
    let score = 0;
    
    for (const term of queryTerms) {
      // Exact match bonus
      const matches = (text.match(new RegExp(term, 'g')) || []).length;
      score += matches * 10;
      
      // Partial match
      if (text.includes(term)) {
        score += 5;
      }
    }
    
    return { chunk, score };
  });
  
  return scored
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(r => ({
      text: r.chunk.text,
      page: r.chunk.pageStart,
      score: r.score
    }));
}
```

### Retrieval for Q&A

When a user asks a question:

1. **Extract key terms** from the question
2. **Retrieve relevant chunks** using keyword matching
3. **Rank by relevance** score
4. **Build context** from top-k chunks (typically k=5)
5. **Include citations** in the response

```typescript
async function retrieveContext(
  documentId: string,
  question: string,
  maxChunks: number = 5
): Promise<RetrievalResult> {
  const results = await keywordSearch(documentId, question);
  const topChunks = results.slice(0, maxChunks);
  
  return {
    context: topChunks.map(r => r.text).join('\n\n'),
    citations: topChunks.map(r => ({
      page: r.page,
      text: r.text.substring(0, 100) + '...'
    }))
  };
}
```

---

## Index Maintenance

### Re-indexing

Documents can be re-indexed without re-upload:

```typescript
async function reindexDocument(documentId: string): Promise<void> {
  // Get stored raw content
  const sections = await db.getAllFromIndex('sections', 'documentId', documentId);
  
  // Delete existing chunks
  const existingChunks = await db.getAllFromIndex('chunks', 'documentId', documentId);
  await Promise.all(existingChunks.map(c => db.delete('chunks', c.id)));
  
  // Re-chunk and store
  const newChunks = sections.flatMap(s => createChunks(s.content));
  await Promise.all(newChunks.map(c => db.add('chunks', c)));
}
```

### Document Deletion

Complete cleanup when document is deleted:

```typescript
async function deleteDocument(documentId: string): Promise<void> {
  const tx = db.transaction(['documents', 'sections', 'chunks', 'tables', 'chatHistory'], 'readwrite');
  
  // Delete all related data
  await tx.objectStore('documents').delete(documentId);
  
  // Delete sections
  const sections = await tx.objectStore('sections').index('documentId').getAll(documentId);
  await Promise.all(sections.map(s => tx.objectStore('sections').delete(s.id)));
  
  // Delete chunks
  const chunks = await tx.objectStore('chunks').index('documentId').getAll(documentId);
  await Promise.all(chunks.map(c => tx.objectStore('chunks').delete(c.id)));
  
  // Delete tables
  const tables = await tx.objectStore('tables').index('documentId').getAll(documentId);
  await Promise.all(tables.map(t => tx.objectStore('tables').delete(t.id)));
  
  await tx.done;
}
```

---

## Performance Considerations

| Factor | Optimization |
|--------|-------------|
| **Large documents** | Process pages in batches of 10 |
| **Many chunks** | Use IndexedDB indexes for fast lookup |
| **Frequent queries** | Cache recent search results in memory |
| **Re-indexing** | Delete old chunks before creating new ones |

---

## Future Enhancements

| Feature | Status |
|---------|--------|
| **Vector embeddings** | Planned - requires embedding API |
| **Semantic search** | Planned - cosine similarity on embeddings |
| **Cross-document search** | Planned - search across all documents |
| **Fuzzy matching** | Under consideration |