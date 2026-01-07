# IntelliRead - PDF Intelligence Platform

Transform enterprise PDFs into searchable, structured knowledge using AI-powered analysis.

## Overview

IntelliRead is a **local-first, browser-only application** that converts PDFs into searchable structured knowledge. All processing happens client-side using IndexedDB for storage - no backend servers, no external databases.

### The Problem It Solves

Organizations manage thousands of PDFs: manuals, reports, policies, research papers. Finding specific information across these documents is time-consuming because:

- PDF content is unstructured
- Search tools only find exact text matches
- Images, charts, and scanned pages are invisible to search
- No way to ask questions and get contextual answers

IntelliRead transforms PDFs into **queryable knowledge bases** where you can search semantically and ask natural language questions.

## Supported PDF Types

| Type                 | Description                         | Processing Method                            |
| -------------------- | ----------------------------------- | -------------------------------------------- |
| **Text-based PDFs**  | Standard PDFs with selectable text  | Direct text extraction via PDF.js            |
| **Mixed PDFs**       | Documents combining text and images | Hybrid extraction with AI image analysis     |
| **Image-only PDFs**  | Scanned documents, photo PDFs       | Full page rendering + Gemini AI descriptions |
| **Chart-heavy PDFs** | Data visualizations and diagrams    | AI-powered chart interpretation              |

## Core Features

### Intelligent Document Processing

- **Structure Preservation**: Maintains headings, sections, chapters, and page numbers
- **Smart Chunking**: Splits content at natural boundaries (sentences, paragraphs, sections) - never mid-word
- **Table Extraction**: Detects and extracts tables with row/column integrity
- **Image Analysis**: AI-generated descriptions make visual content searchable

### AI-Powered Search & Q&A

- **Semantic Search**: Find content by meaning, not just keywords
- **Multi-Provider AI**: Choose between Groq, Perplexity, Anthropic, or Google Gemini
- **Cited Answers**: AI responses include page references for verification
- **Document-Scoped**: Answers are grounded in your uploaded documents

### Privacy-First Architecture

- **100% Client-Side**: All processing happens in your browser
- **IndexedDB Storage**: Documents persist locally, never uploaded to servers
- **API Calls Only When Needed**: AI providers are called only for:
  - Generating image descriptions (Gemini)
  - Answering questions (Groq/Perplexity/Anthropic)

## Technology Stack

| Layer              | Technology                                 |
| ------------------ | ------------------------------------------ |
| **Frontend**       | React 18 + TypeScript + Vite               |
| **UI Components**  | shadcn/ui + Tailwind CSS                   |
| **PDF Processing** | PDF.js (client-side)                       |
| **Storage**        | IndexedDB via idb library                  |
| **AI Providers**   | Groq, Perplexity, Anthropic, Google Gemini |

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- **Required API keys** (these three must be configured):
  - Google Gemini (for image analysis)
  - Groq (for fast Q&A)
  - Perplexity (for web-grounded answers)
- **Optional API key**:
  - Anthropic Claude (for complex reasoning)

### Installation

```bash
# Clone the repository.
git clone https://github.com/Illusory-warden/intelliread.git
cd intelliread

# Install dependencies
npm install

# Start development server
npm run dev
```

### Configuration

1. Open IntelliRead in your browser
2. Click **API Settings** in the header
3. Enter API keys for the **required** providers:
   - **Gemini** (Required): For image analysis ([Get key](https://aistudio.google.com/app/apikey))
   - **Groq** (Required): For fast LLM responses ([Get key](https://console.groq.com))
   - **Perplexity** (Required): For web-grounded answers ([Get key](https://www.perplexity.ai))
   - **Anthropic** (Optional): For Claude models ([Get key](https://console.anthropic.com))
4. Test each connection before saving
5. PDF upload is disabled until all required keys are configured

### Usage

1. **Upload a PDF**: Drag and drop or click to select
2. **Wait for Processing**: Watch the progress indicator
3. **Explore Content**: Browse sections, tables, and images
4. **Ask Questions**: Use the chat interface to query your document
5. **Export**: Download chat history as PDF

## System Flow

```
PDF Upload → Page Analysis → Content Extraction → Chunking → Indexing → Search Ready
                 ↓
         Image Detection
                 ↓
         AI Description (Gemini)
                 ↓
         Content Normalization
```

For detailed architecture, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Limitations

| Limitation               | Description                                                    |
| ------------------------ | -------------------------------------------------------------- |
| **Image Interpretation** | AI descriptions are interpretive, not exact transcriptions     |
| **Complex Charts**       | Multi-layered visualizations may not be fully captured         |
| **OCR Accuracy**         | Depends on scan quality; handwritten text may not process well |
| **Offline AI**           | Image analysis and Q&A require internet connection             |
| **Browser Storage**      | IndexedDB has browser-specific storage limits                  |

For complete limitations, see [docs/LIMITATIONS.md](docs/LIMITATIONS.md).

## Project Structure

```
src/
├── components/           # React UI components
│   ├── ui/              # shadcn/ui base components
│   ├── Header.tsx       # App header with navigation
│   ├── PDFViewer.tsx    # Document viewer with tabs
│   ├── ChatInterface.tsx # Q&A chat panel
│   └── ...
├── hooks/               # Custom React hooks
│   ├── useAPIKeys.ts    # API key management
│   ├── useChat.ts       # Chat state and API calls
│   └── useDocuments.ts  # Document CRUD operations
├── lib/
│   ├── apiClient.ts     # AI provider integrations
│   ├── db.ts            # IndexedDB operations
│   ├── imageExtractor.ts # PDF image detection
│   ├── pdfProcessor.ts  # PDF parsing and extraction
│   ├── textChunker.ts   # Content chunking logic
│   └── vectorSearch.ts  # Embedding and similarity
├── pages/
│   ├── Index.tsx        # Main application page
│   └── HowItWorks.tsx   # Processing explanation page
└── types/               # TypeScript definitions
```

## Documentation

- [Architecture Overview](docs/ARCHITECTURE.md)
- [Image Processing Pipeline](docs/IMAGE_PIPELINE.md)
- [Processing Flow](docs/PROCESSING_FLOW.md)
- [Indexing & Search](docs/INDEXING_AND_SEARCH.md)
- [Known Limitations](docs/LIMITATIONS.md)
- [Project Structure](docs/STRUCTURE.md)

## License

MIT

## Contributing

Contributions are welcome. Please open an issue first to discuss proposed changes.

## Author

[Illusory-warden](https://github.com/Illusory-warden)
