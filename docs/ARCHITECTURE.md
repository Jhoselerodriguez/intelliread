# Architecture Overview

This document describes the system architecture of IntelliRead, a client-side PDF intelligence platform.

## Design Principles

1. **Local-First**: All processing happens in the browser
2. **No Backend**: No server dependencies; IndexedDB is the only database
3. **Progressive Enhancement**: Core features work offline; AI features require API access
4. **Privacy by Design**: Documents never leave the user's device

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser Environment                      │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   React UI  │  │   Hooks     │  │   Pages     │              │
│  │  Components │  │  (State)    │  │  (Routes)   │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
│         └────────────────┼────────────────┘                      │
│                          │                                       │
│  ┌───────────────────────┴───────────────────────┐              │
│  │                  Core Libraries                │              │
│  ├───────────────────────────────────────────────┤              │
│  │  pdfProcessor  │  textChunker  │  imageExtractor │           │
│  │  vectorSearch  │  apiClient    │  db (IndexedDB) │           │
│  └───────────────────────────────────────────────┘              │
│                          │                                       │
│  ┌───────────────────────┴───────────────────────┐              │
│  │                   IndexedDB                    │              │
│  │  documents │ sections │ chunks │ settings      │              │
│  └───────────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                           │
                           │ HTTPS (AI API calls only)
                           ▼
         ┌─────────────────────────────────────┐
         │         External AI Providers        │
         │  Groq │ Gemini │ Perplexity │ Claude │
         └─────────────────────────────────────┘
```

## Module Responsibilities

### UI Layer

| Module | Responsibility |
|--------|----------------|
| `Header.tsx` | Navigation, theme toggle, settings access |
| `PDFViewer.tsx` | Document display with tabs (Content, Tables, Images) |
| `ChatInterface.tsx` | Q&A interface with provider selection |
| `DocumentLibrary.tsx` | Document list and management |
| `APISettingsModal.tsx` | API key configuration per provider |

### State Management (Hooks)

| Hook | Purpose |
|------|---------|
| `useAPIKeys` | Load, save, and validate API keys from IndexedDB |
| `useChat` | Manage chat messages, send queries, handle responses |
| `useDocuments` | CRUD operations for documents in IndexedDB |

### Core Libraries

| Library | Function |
|---------|----------|
| `pdfProcessor.ts` | Orchestrates PDF ingestion: text extraction, image detection, chunking |
| `textChunker.ts` | Splits content at sentence boundaries, preserves metadata |
| `imageExtractor.ts` | Detects image-only pages, renders pages to PNG blobs |
| `apiClient.ts` | Unified interface for all AI providers (Groq, Gemini, Perplexity, Anthropic) |
| `vectorSearch.ts` | Embedding generation and cosine similarity search |
| `db.ts` | IndexedDB wrapper using idb library |

### Data Layer (IndexedDB)

| Store | Contents |
|-------|----------|
| `documents` | Document metadata: id, title, pageCount, wordCount, status |
| `sections` | Extracted sections with page ranges and content |
| `chunks` | Text chunks with metadata for retrieval |
| `tables` | Extracted tables with row/column data |
| `images` | Image metadata and descriptions |
| `chatHistory` | Conversation history per document per provider |
| `apiSettings` | Encrypted API keys |

## Data Flow

### PDF Ingestion Flow

```
User selects PDF
       │
       ▼
┌──────────────────┐
│  pdfProcessor    │
│  (orchestrator)  │
└────────┬─────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌───────────┐
│ Text  │ │  Image    │
│ Pages │ │  Pages    │
└───┬───┘ └─────┬─────┘
    │           │
    │           ▼
    │     ┌───────────┐
    │     │ Gemini AI │ (if API key configured)
    │     └─────┬─────┘
    │           │
    │           ▼
    │     ┌───────────┐
    │     │Description│
    │     └─────┬─────┘
    │           │
    └─────┬─────┘
          │
          ▼
    ┌───────────┐
    │ Normalize │
    └─────┬─────┘
          │
          ▼
    ┌───────────┐
    │  Chunker  │
    └─────┬─────┘
          │
          ▼
    ┌───────────┐
    │ IndexedDB │
    └───────────┘
```

### Query Flow

```
User asks question
       │
       ▼
┌──────────────────┐
│ Retrieve relevant│
│ chunks from DB   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Build context    │
│ with citations   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Send to AI       │
│ (Groq/Claude/etc)│
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Display response │
│ with page refs   │
└──────────────────┘
```

## AI Provider Integration

All AI providers implement a consistent interface:

```typescript
interface AIProvider {
  testConnection(apiKey: string): Promise<{ success: boolean; message: string }>;
  generateResponse(params: QueryParams): Promise<AIResponse>;
}
```

### Provider-Specific Usage

| Provider | Primary Use | Model |
|----------|-------------|-------|
| **Groq** | Fast Q&A responses | llama-3.3-70b-versatile |
| **Gemini** | Image analysis | gemini-2.5-flash-lite |
| **Perplexity** | Web-grounded answers | sonar-pro |
| **Anthropic** | Complex reasoning | claude-sonnet-4-20250514 |

## Security Considerations

1. **API Key Storage**: Keys are stored in IndexedDB, not localStorage
2. **No Server Transmission**: Documents are never uploaded
3. **HTTPS Only**: API calls use encrypted connections
4. **User Control**: Users provide their own API keys

## Performance Optimizations

1. **Lazy Loading**: PDF pages are rendered on demand
2. **Chunked Processing**: Large PDFs are processed in batches
3. **IndexedDB Transactions**: Batch writes for efficiency
4. **Memoization**: React components use useMemo/useCallback appropriately

## Extensibility Points

| Extension | How |
|-----------|-----|
| New AI Provider | Add to `apiClient.ts`, update `APISettingsModal.tsx` |
| New Export Format | Add handler in relevant component |
| New PDF Feature | Extend `pdfProcessor.ts` pipeline |
| New Storage | Implement db interface (though IndexedDB is mandated) |