# Processing Flow

This document provides a step-by-step walkthrough of what happens when a PDF is uploaded to IntelliRead.

## Overview

The processing pipeline transforms a raw PDF file into a searchable, queryable knowledge base in eight distinct stages.

## Stage 1: PDF Upload

**Trigger**: User selects a PDF file via drag-and-drop or file picker

**Process**:
1. File is read into browser memory using `FileReader` API
2. File metadata is extracted (name, size, type)
3. Initial document record is created in IndexedDB with status `processing`

**Output**:
```typescript
{
  id: "uuid-xxxx",
  title: "document.pdf",
  status: "processing",
  uploadedAt: Date
}
```

**Duration**: < 100ms for most files

---

## Stage 2: Local PDF Analysis

**Trigger**: PDF binary is loaded into memory

**Process**:
1. PDF.js parses the document structure
2. Total page count is determined
3. Document metadata is extracted (title, author, subject, keywords)
4. Outline (table of contents) is extracted if present

**Output**:
```typescript
{
  pageCount: 42,
  metadata: {
    title: "Annual Report 2024",
    author: "Finance Department"
  },
  outline: [
    { title: "Introduction", page: 1 },
    { title: "Financial Summary", page: 5 }
  ]
}
```

**Duration**: 100-500ms depending on document size

---

## Stage 3: Page-by-Page Extraction

**Trigger**: Document structure is parsed

**Process**:
For each page (1 to N):
1. Extract text content using `page.getTextContent()`
2. Analyze operator list for image operations
3. Classify page as TEXT, IMAGE_ONLY, or MIXED

**Decision Tree**:
```
                    Page N
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
    Text > 50      Text < 20       Text > 50
    chars          chars           chars
    No images      Has images      Has images
        │              │              │
        ▼              ▼              ▼
      TEXT        IMAGE_ONLY        MIXED
```

**Output per page**:
```typescript
{
  page: 5,
  type: 'TEXT' | 'IMAGE_ONLY' | 'MIXED',
  rawText: "...",
  imageCount: 0 | N
}
```

---

## Stage 4: Image-Only Page Handling

**Trigger**: Page is classified as IMAGE_ONLY

**Process**:
1. Create off-screen canvas
2. Render page at 2x scale to canvas
3. Export canvas as PNG blob
4. Send to Gemini API for description
5. Store description as page text

**API Call**:
```
POST https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent
Body: { image: base64_png, prompt: "Describe this page..." }
```

**Fallback** (no API key or error):
```typescript
{
  text: "Visual content on this page. AI analysis requires Gemini API configuration.",
  isImageOnly: true,
  aiAnalyzed: false
}
```

**Duration**: 1-3 seconds per image page

---

## Stage 5: Content Normalization

**Trigger**: All pages have been processed

**Process**:
1. Merge text and image descriptions into unified page array
2. Standardize text formatting (trim, normalize whitespace)
3. Extract tables using pattern detection
4. Identify section headings using regex patterns

**Heading Detection Patterns**:
```typescript
const HEADING_PATTERNS = [
  /^(?:Chapter|Section|Part)\s+\d+/i,
  /^\d+\.\s+[A-Z]/,
  /^[A-Z][A-Z\s]+$/  // ALL CAPS
];
```

**Output**:
```typescript
{
  pages: ExtractedPage[],
  tables: Table[],
  sections: Section[]
}
```

---

## Stage 6: Chunking & Structuring

**Trigger**: Normalized content is ready

**Process**:
1. Group pages into sections based on headings
2. Split section content into chunks at sentence boundaries
3. Attach metadata to each chunk

**Chunking Rules**:
- Target chunk size: 800 characters
- Maximum chunk size: 1200 characters
- Never split mid-sentence
- Include overlap: last 100 chars of previous chunk

**Chunk Structure**:
```typescript
{
  id: "chunk-uuid",
  documentId: "doc-uuid",
  sectionTitle: "Financial Summary",
  text: "Revenue increased 15% year-over-year...",
  pageStart: 5,
  pageEnd: 5,
  chunkIndex: 12,
  isImageDerived: false
}
```

---

## Stage 7: Local Indexing

**Trigger**: Chunks are created

**Process**:
1. Store document record in `documents` store
2. Store sections in `sections` store
3. Store chunks in `chunks` store
4. Store tables in `tables` store
5. Update document status to `indexed`

**IndexedDB Transaction**:
```typescript
const tx = db.transaction(['documents', 'sections', 'chunks', 'tables'], 'readwrite');
await Promise.all([
  tx.objectStore('documents').put(document),
  ...sections.map(s => tx.objectStore('sections').put(s)),
  ...chunks.map(c => tx.objectStore('chunks').put(c)),
  ...tables.map(t => tx.objectStore('tables').put(t))
]);
await tx.done;
```

**Duration**: 50-200ms for typical documents

---

## Stage 8: Search & Q&A Ready

**Trigger**: Indexing complete, status = `indexed`

**Available Operations**:

| Operation | Description |
|-----------|-------------|
| **Section Browse** | Navigate by section headings |
| **Table View** | Display extracted tables with headers |
| **Text Search** | Keyword search across chunks |
| **AI Q&A** | Ask questions, get cited answers |

**Query Flow**:
```
User Question
     │
     ▼
┌────────────────┐
│ Retrieve top-k │
│ relevant chunks│
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ Build prompt   │
│ with context   │
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ Send to AI     │
│ provider       │
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ Parse response │
│ + citations    │
└────────────────┘
```

---

## Complete Pipeline Timing

| Stage | Typical Duration | Bottleneck |
|-------|-----------------|------------|
| Upload | < 100ms | File size |
| Analysis | 100-500ms | Page count |
| Text Extraction | 50-200ms/page | Content complexity |
| Image Analysis | 1-3s/image page | API latency |
| Normalization | 100-300ms | Text volume |
| Chunking | 50-150ms | Chunk count |
| Indexing | 50-200ms | IndexedDB write speed |

**Total for 50-page text PDF**: ~15-30 seconds  
**Total for 50-page image PDF**: ~2-5 minutes (API dependent)

---

## Error Handling

| Error Type | Handling |
|------------|----------|
| **Invalid PDF** | Reject upload, show error message |
| **Corrupt page** | Skip page, log warning, continue |
| **API failure** | Use fallback text, mark as partial |
| **IndexedDB full** | Alert user, offer cleanup options |

---

## Progress Reporting

The UI displays real-time progress:

```typescript
interface ProcessingProgress {
  stage: 'analyzing' | 'extracting' | 'ai-processing' | 'indexing';
  currentPage: number;
  totalPages: number;
  message: string;
}
```

Visual indicator shows percentage completion with stage labels.