# Project Structure

Complete file and folder structure of the IntelliRead application.

## Directory Tree

```
intelliread/
├── docs/                                   # Documentation files
│   ├── ARCHITECTURE.md                     # System architecture and module responsibilities
│   ├── IMAGE_PIPELINE.md                   # Image-only PDF processing pipeline details
│   ├── INDEXING_AND_SEARCH.md              # Chunking strategy and search implementation
│   ├── LIMITATIONS.md                      # Known limitations and constraints
│   ├── PROCESSING_FLOW.md                  # Step-by-step PDF processing lifecycle
│   └── STRUCTURE.md                        # This file - project structure reference
│
├── public/                                 # Static assets (served as-is)
│   ├── favicon.ico                         # Browser tab icon
│   ├── placeholder.svg                     # Default placeholder image
│   └── robots.txt                          # Search engine crawling rules
│
├── src/                                    # Application source code
│   ├── components/                         # React components
│   │   ├── ui/                             # shadcn/ui base components
│   │   │   ├── accordion.tsx               # Collapsible accordion component
│   │   │   ├── alert-dialog.tsx            # Modal confirmation dialogs
│   │   │   ├── alert.tsx                   # Inline alert messages
│   │   │   ├── aspect-ratio.tsx            # Responsive aspect ratio container
│   │   │   ├── avatar.tsx                  # User avatar component
│   │   │   ├── badge.tsx                   # Status badges and labels
│   │   │   ├── breadcrumb.tsx              # Navigation breadcrumbs
│   │   │   ├── button.tsx                  # Button variants and states
│   │   │   ├── calendar.tsx                # Date picker calendar
│   │   │   ├── card.tsx                    # Card container component
│   │   │   ├── carousel.tsx                # Image/content carousel
│   │   │   ├── chart.tsx                   # Chart wrapper component
│   │   │   ├── checkbox.tsx                # Checkbox input component
│   │   │   ├── collapsible.tsx             # Collapsible panel component
│   │   │   ├── command.tsx                 # Command palette component
│   │   │   ├── context-menu.tsx            # Right-click context menus
│   │   │   ├── dialog.tsx                  # Modal dialog component
│   │   │   ├── drawer.tsx                  # Slide-out drawer panel
│   │   │   ├── dropdown-menu.tsx           # Dropdown menu component
│   │   │   ├── form.tsx                    # Form wrapper with validation
│   │   │   ├── hover-card.tsx              # Hover-triggered popover
│   │   │   ├── input-otp.tsx               # One-time password input
│   │   │   ├── input.tsx                   # Text input component
│   │   │   ├── label.tsx                   # Form label component
│   │   │   ├── menubar.tsx                 # Horizontal menu bar
│   │   │   ├── navigation-menu.tsx         # Navigation dropdown menus
│   │   │   ├── pagination.tsx              # Page navigation component
│   │   │   ├── popover.tsx                 # Popover tooltip component
│   │   │   ├── progress.tsx                # Progress bar component
│   │   │   ├── radio-group.tsx             # Radio button group
│   │   │   ├── resizable.tsx               # Resizable panel component
│   │   │   ├── scroll-area.tsx             # Custom scrollbar container
│   │   │   ├── select.tsx                  # Dropdown select component
│   │   │   ├── separator.tsx               # Visual divider line
│   │   │   ├── sheet.tsx                   # Side sheet panel
│   │   │   ├── sidebar.tsx                 # Application sidebar
│   │   │   ├── skeleton.tsx                # Loading skeleton placeholder
│   │   │   ├── slider.tsx                  # Range slider input
│   │   │   ├── sonner.tsx                  # Toast notification provider
│   │   │   ├── switch.tsx                  # Toggle switch component
│   │   │   ├── table.tsx                   # Data table component
│   │   │   ├── tabs.tsx                    # Tab navigation component
│   │   │   ├── textarea.tsx                # Multi-line text input
│   │   │   ├── toast.tsx                   # Toast notification component
│   │   │   ├── toaster.tsx                 # Toast container
│   │   │   ├── toggle-group.tsx            # Toggle button group
│   │   │   ├── toggle.tsx                  # Toggle button component
│   │   │   ├── tooltip.tsx                 # Hover tooltip component
│   │   │   └── use-toast.ts                # Toast hook (deprecated location)
│   │   │
│   │   ├── APISettingsModal.tsx            # API key configuration modal with provider sections
│   │   ├── ChatInterface.tsx               # Q&A chat panel with provider selection
│   │   ├── DocumentLibrary.tsx             # Sidebar document list and management
│   │   ├── FeatureCards.tsx                # Landing page feature highlights
│   │   ├── Footer.tsx                      # App footer with API status indicator
│   │   ├── Header.tsx                      # Top navigation with settings and theme toggle
│   │   ├── NavLink.tsx                     # Navigation link with active state
│   │   ├── PDFUploader.tsx                 # Drag-and-drop PDF upload zone
│   │   ├── PDFViewer.tsx                   # Document viewer with content tabs
│   │   ├── ProcessingProgress.tsx          # PDF processing status overlay
│   │   ├── TextSelectionPopup.tsx          # Text selection context menu for Q&A
│   │   └── ThemeToggle.tsx                 # Light/Dark/AMOLED theme switcher
│   │
│   ├── hooks/                              # Custom React hooks
│   │   ├── use-mobile.tsx                  # Mobile viewport detection hook
│   │   ├── use-toast.ts                    # Toast notification hook
│   │   ├── useAPIKeys.ts                   # API key storage and validation hook
│   │   ├── useChat.ts                      # Chat state management and AI calls
│   │   └── useDocuments.ts                 # Document CRUD operations hook
│   │
│   ├── lib/                                # Core utility libraries
│   │   ├── apiClient.ts                    # Unified AI provider API client
│   │   ├── db.ts                           # IndexedDB wrapper using idb library
│   │   ├── imageExtractor.ts               # PDF page image detection and rendering
│   │   ├── intelligentChunker.ts           # Smart content chunking with boundaries
│   │   ├── pdfProcessor.ts                 # PDF ingestion orchestrator
│   │   ├── textChunker.ts                  # Text splitting at natural boundaries
│   │   ├── utils.ts                        # General utility functions (cn, etc.)
│   │   └── vectorSearch.ts                 # Embedding generation and similarity search
│   │
│   ├── pages/                              # Route-level page components
│   │   ├── HowItWorks.tsx                  # Processing pipeline visualization page
│   │   ├── Index.tsx                       # Main application page with layout
│   │   └── NotFound.tsx                    # 404 error page
│   │
│   ├── types/                              # TypeScript type definitions
│   │   └── index.ts                        # Shared interfaces and types
│   │
│   ├── App.css                             # Global app styles (minimal)
│   ├── App.tsx                             # Root component with routing
│   ├── index.css                           # Tailwind CSS with custom design tokens
│   ├── main.tsx                            # Application entry point
│   └── vite-env.d.ts                       # Vite environment type declarations
│
├── .gitignore                              # Git ignored files and folders
├── components.json                         # shadcn/ui component configuration
├── eslint.config.js                        # ESLint linting configuration
├── index.html                              # HTML entry point
├── package.json                            # NPM dependencies and scripts
├── postcss.config.js                       # PostCSS configuration
├── README.md                               # Project overview and setup guide
├── tailwind.config.ts                      # Tailwind CSS configuration
├── tsconfig.app.json                       # TypeScript app configuration
├── tsconfig.json                           # Root TypeScript configuration
├── tsconfig.node.json                      # TypeScript Node.js configuration
└── vite.config.ts                          # Vite build configuration
```

## Key File Descriptions

### Source Code (`src/`)

#### Components

| File | Purpose |
|------|---------|
| `APISettingsModal.tsx` | Modal dialog for configuring API keys for Groq, Gemini, Perplexity, and Anthropic. Includes connection testing for each provider. |
| `ChatInterface.tsx` | Q&A chat panel with AI provider selection, message history, citation display, and chat export functionality. |
| `DocumentLibrary.tsx` | Collapsible sidebar listing all uploaded documents with metadata (pages, words, date) and delete functionality. |
| `PDFUploader.tsx` | Drag-and-drop upload zone with visual feedback. Shows warning when mandatory API keys are missing. |
| `PDFViewer.tsx` | Main document viewer with tabbed interface: Summary (sections), Full Text, and Themes. Supports text selection for Q&A. |
| `TextSelectionPopup.tsx` | Context popup that appears on text selection, allowing users to ask AI about the selected text. |
| `ProcessingProgress.tsx` | Overlay showing PDF processing status with animated progress indicators. |
| `Header.tsx` | Top navigation bar with logo, settings button, info button, theme toggle, and GitHub link. |
| `Footer.tsx` | Application footer showing API key configuration status (mandatory keys required). |

#### Hooks

| File | Purpose |
|------|---------|
| `useAPIKeys.ts` | Manages API key storage in IndexedDB. Tracks mandatory keys (Gemini, Groq, Perplexity) vs optional (Claude). |
| `useChat.ts` | Handles chat message state, sends queries to AI providers, and manages chat history persistence. |
| `useDocuments.ts` | CRUD operations for documents in IndexedDB: add, remove, get, list, and refresh. |
| `use-toast.ts` | Toast notification system hook for displaying success/error messages. |

#### Libraries

| File | Purpose |
|------|---------|
| `apiClient.ts` | Unified interface for all AI providers. Handles request formatting, authentication, and response parsing. |
| `db.ts` | IndexedDB wrapper using idb library. Manages stores for documents, chunks, tables, images, chat history, and settings. |
| `pdfProcessor.ts` | Orchestrates PDF ingestion: coordinates text extraction, image detection, section extraction, and chunking. |
| `imageExtractor.ts` | Detects image-only pages by checking text content length. Renders PDF pages to PNG blobs for AI analysis. |
| `textChunker.ts` | Splits document content into chunks at sentence boundaries. Preserves metadata (page, section, position). |
| `vectorSearch.ts` | Generates text embeddings and performs cosine similarity search for semantic retrieval. |

#### Pages

| File | Purpose |
|------|---------|
| `Index.tsx` | Main application page. Manages layout state, document selection, upload handling, and panel visibility. |
| `HowItWorks.tsx` | Interactive visualization of the PDF processing pipeline with animated steps and explanations. |
| `NotFound.tsx` | 404 error page with navigation back to home. |

### Configuration Files

| File | Purpose |
|------|---------|
| `vite.config.ts` | Vite bundler configuration. Sets up React, path aliases, and build optimization. |
| `tailwind.config.ts` | Tailwind CSS configuration with custom colors, animations, and design tokens. |
| `tsconfig.json` | TypeScript compiler configuration. Enables strict mode and path aliases. |
| `eslint.config.js` | ESLint rules for code quality and consistency. |
| `components.json` | shadcn/ui configuration specifying component paths and styling options. |

### Documentation

| File | Purpose |
|------|---------|
| `ARCHITECTURE.md` | System design, module responsibilities, data flow diagrams, and extensibility points. |
| `IMAGE_PIPELINE.md` | Detailed explanation of image-only PDF handling, Gemini integration, and fallback behavior. |
| `PROCESSING_FLOW.md` | Step-by-step walkthrough of PDF lifecycle from upload to search-ready state. |
| `INDEXING_AND_SEARCH.md` | Chunking strategy, metadata handling, IndexedDB schema, and search implementation. |
| `LIMITATIONS.md` | Known constraints: image interpretation limits, OCR accuracy, storage limits, etc. |
| `STRUCTURE.md` | This file - complete project structure reference. |

## Data Flow Summary

```
User Upload → pdfProcessor.ts → imageExtractor.ts → apiClient.ts (Gemini)
                    ↓
              textChunker.ts
                    ↓
                 db.ts (IndexedDB)
                    ↓
              vectorSearch.ts → apiClient.ts (Groq/Perplexity/Claude)
                    ↓
              ChatInterface.tsx (Display)
```

## Environment Requirements

- **Node.js**: 18.x or higher
- **Browser**: Modern browser with IndexedDB support (Chrome, Firefox, Safari, Edge)
- **API Keys**: Required for Gemini (images), Groq (Q&A), Perplexity (Q&A)
- **API Keys**: Optional for Anthropic/Claude