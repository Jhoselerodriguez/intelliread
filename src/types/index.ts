// Document types
export interface Document {
  id: string;
  filename: string;
  title: string;
  uploadDate: Date;
  pageCount: number;
  wordCount: number;
  pdfBlob: Blob;
  tableOfContents: TableOfContentsItem[];
  themes: string[];
  summary: string;
  sections: Section[];
}

export interface TableOfContentsItem {
  title: string;
  page: number;
  level: number;
}

export interface Section {
  title: string;
  content: string;
  page: number;
  bulletPoints: string[];
}

// Chunk types for vector search
export interface Chunk {
  id: string;
  documentId: string;
  chunkIndex: number;
  text: string;
  section: string;
  page: number;
  startOffset: number;
  endOffset: number;
  embedding: number[];
}

// Table types
export interface ExtractedTable {
  id: string;
  documentId: string;
  tableIndex: number;
  page: number;
  rows: number;
  columns: number;
  headers: string[];
  data: string[][];
  caption?: string;
}

// Image types with chart data support
export interface ExtractedImage {
  id: string;
  documentId: string;
  imageIndex: number;
  page: number;
  imageData: Blob;
  description: string;
  type: 'image' | 'chart' | 'diagram';
  chartData?: ChartData;
}

// Chart data structure
export interface ChartData {
  type: string;
  labels: string[];
  values: number[];
  rawData: any;
}

// Chat types
export type AIProvider = 'groq' | 'perplexity' | 'anthropic';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  timestamp: Date;
}

export interface Citation {
  chunkId: string;
  page: number;
  text: string;
}

export interface ChatHistory {
  id: string;
  documentId: string;
  provider: AIProvider;
  timestamp: Date;
  messages: ChatMessage[];
}

// API Keys types - Updated to include Gemini, removed HuggingFace
export interface APIKeys {
  groqApiKey?: string;
  perplexityApiKey?: string;
  anthropicApiKey?: string;
  geminiApiKey?: string;
}

// Processing status
export interface ProcessingStatus {
  stage: string;
  progress: number;
  detail?: string;
}

// API models configuration
export const API_MODELS = {
  groq: {
    model: 'llama-3.3-70b-versatile',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
  },
  perplexity: {
    model: 'sonar-pro',
    endpoint: 'https://api.perplexity.ai/chat/completions',
  },
  anthropic: {
    model: 'claude-sonnet-4-20250514',
    endpoint: 'https://api.anthropic.com/v1/messages',
  },
  gemini: {
    model: 'gemini-1.5-flash-latest',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
  },
} as const;
