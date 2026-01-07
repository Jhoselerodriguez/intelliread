# Image Processing Pipeline

This document describes how IntelliRead handles image-only PDFs and visual content.

## Overview

Traditional PDF tools treat images as attachments or ignore them entirely. IntelliRead treats **images as first-class content**, making them fully searchable and queryable through AI-generated descriptions.

## Pipeline Architecture

```
PDF Upload
    │
    ▼
┌─────────────────────────────────────────┐
│           Page Analysis                  │
│  • Extract text content                  │
│  • Detect images via operator list       │
│  • Classify: TEXT | IMAGE_ONLY | MIXED   │
└─────────────────────────────────────────┘
    │
    ├── TEXT Pages ──────────────────────────────────┐
    │   • Direct text extraction via PDF.js          │
    │   • Table detection and extraction             │
    │   • Section pattern matching                   │
    │                                                │
    ├── IMAGE_ONLY Pages ────────────────────────────┤
    │   • Render page to PNG at 2x scale             │
    │   • Send to Gemini API for description         │
    │   • Use AI description as page text            │
    │                                                │
    ├── MIXED Pages ─────────────────────────────────┤
    │   • Extract text content                       │
    │   • Detect and describe embedded images        │
    │   • Merge text and image descriptions          │
    │                                                │
    ▼                                                ▼
┌─────────────────────────────────────────────────────┐
│                   Content Merge                      │
│  • All pages now have text content                   │
│  • Image descriptions integrated as searchable text  │
│  • Ready for chunking and indexing                   │
└─────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│          IndexedDB Storage              │
│  • Documents with page metadata         │
│  • Sections (text + image-derived)      │
│  • Chunks with source references        │
└─────────────────────────────────────────┘
```

## Page Classification Logic

A page is classified based on its content composition:

| Classification | Criteria |
|----------------|----------|
| **TEXT** | `extractedText.length > 50` characters |
| **IMAGE_ONLY** | `extractedText.length < 20` AND `imageCount > 0` |
| **MIXED** | Both text and images present |

```typescript
function classifyPage(text: string, imageCount: number): PageType {
  const hasText = text.trim().length > 50;
  const hasImages = imageCount > 0;
  
  if (hasText && !hasImages) return 'TEXT';
  if (!hasText && hasImages) return 'IMAGE_ONLY';
  if (hasText && hasImages) return 'MIXED';
  return 'EMPTY';
}
```

## Image Detection Methods

### 1. Operator List Analysis

PDF.js exposes the operator list for each page, which includes image rendering commands:

```typescript
const operatorList = await page.getOperatorList();
const imageOps = [
  OPS.paintImageXObject,
  OPS.paintImageXObjectRepeat,
  OPS.paintXObject
];

const imageCount = operatorList.fnArray.filter(
  op => imageOps.includes(op)
).length;
```

### 2. Page Rendering for Analysis

For image-only pages, the entire page is rendered as a PNG:

```typescript
async function renderPageToImage(page: PDFPageProxy): Promise<Blob> {
  const scale = 2.0; // 2x for quality
  const viewport = page.getViewport({ scale });
  
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  
  await page.render({
    canvasContext: canvas.getContext('2d'),
    viewport
  }).promise;
  
  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob), 'image/png');
  });
}
```

## Gemini Integration

### API Configuration

| Setting | Value |
|---------|-------|
| **Model** | `gemini-2.5-flash-lite` |
| **Input** | Base64-encoded PNG image |
| **Output** | Text description (100-300 words typical) |

### Description Generation Prompt

```
Describe this document page image in detail. Include:
1. Main content or subject matter
2. Any visible text (headings, labels, captions)
3. Charts, graphs, or diagrams with key data points
4. Layout and visual organization
5. Purpose or context within a document

Be specific and factual. This description will be used for search indexing.
```

### Response Handling

```typescript
async function generateImageDescription(
  imageBlob: Blob,
  apiKey: string
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
  
  const base64 = await blobToBase64(imageBlob);
  
  const result = await model.generateContent([
    DESCRIPTION_PROMPT,
    { inlineData: { data: base64, mimeType: 'image/png' } }
  ]);
  
  return result.response.text();
}
```

## Fallback Behavior

| Scenario | Behavior |
|----------|----------|
| **No Gemini API key** | Use placeholder: "Visual content on this page requires AI analysis for search indexing." |
| **API rate limit** | Queue and retry with exponential backoff |
| **API error** | Log error, use placeholder, continue processing |
| **Network offline** | Skip AI analysis, mark document as "partially indexed" |

**Critical**: Document ingestion never fails due to image analysis errors. The system degrades gracefully.

## Chart vs Photo Detection

Gemini can distinguish between chart types:

```typescript
async function classifyImage(
  imageBlob: Blob,
  apiKey: string
): Promise<'chart' | 'photo' | 'diagram' | 'text' | 'unknown'> {
  const prompt = `Classify this image into exactly one category:
  - chart: Bar chart, line graph, pie chart, scatter plot, etc.
  - diagram: Flowchart, architecture diagram, process flow
  - photo: Photograph of real-world scene or object
  - text: Scanned text document or form
  - unknown: Cannot determine
  
  Respond with only the category name.`;
  
  // ... API call
}
```

### Chart Data Extraction

For identified charts, additional extraction is attempted:

```typescript
interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'other';
  title?: string;
  xAxis?: string;
  yAxis?: string;
  dataPoints: Array<{ label: string; value: number }>;
}
```

This data is stored alongside the description for enhanced searchability.

## Section Building from Image Content

Consecutive image-only pages are grouped into logical sections:

```typescript
function buildImageSections(pages: ExtractedPage[]): Section[] {
  const sections: Section[] = [];
  let currentGroup: ExtractedPage[] = [];
  
  for (const page of pages) {
    if (page.isImageOnly) {
      currentGroup.push(page);
    } else if (currentGroup.length > 0) {
      sections.push({
        title: `Visual Content (Pages ${currentGroup[0].page}–${currentGroup[currentGroup.length - 1].page})`,
        content: currentGroup.map(p => p.imageDescription).join('\n\n'),
        startPage: currentGroup[0].page,
        endPage: currentGroup[currentGroup.length - 1].page,
        isImageDerived: true
      });
      currentGroup = [];
    }
  }
  
  return sections;
}
```

## Storage Model

Image-derived content is stored identically to text content:

```typescript
interface ExtractedPage {
  page: number;
  text: string;              // Either extracted text OR image description
  items: TextItem[];         // Empty for image-only pages
  isImageOnly?: boolean;     // Flag for image pages
  imageDescription?: string; // Original AI description
  imageType?: 'chart' | 'photo' | 'diagram' | 'text';
}
```

## Search Integration

Image descriptions are chunked and indexed like regular text:

1. Descriptions are split at sentence boundaries
2. Each chunk includes `isImageDerived: true` metadata
3. Semantic search finds relevant visual content
4. Results display with page reference and "Visual Content" indicator

## Performance Considerations

| Factor | Impact | Mitigation |
|--------|--------|------------|
| **API Latency** | 1-3s per image | Process images in parallel (max 3 concurrent) |
| **Image Size** | Large PNGs slow upload | Render at 2x scale, not higher |
| **API Costs** | Per-image billing | Cache descriptions, skip re-processing |
| **Memory** | Canvas rendering uses RAM | Process pages sequentially, release canvases |

## Best Practices

1. **High-Resolution PDFs**: Use 300+ DPI scans for best AI interpretation
2. **Configure Gemini**: Image analysis only works with valid API key
3. **Mixed Documents**: Both text and images are processed seamlessly
4. **Review Descriptions**: AI interpretations may need human verification for critical documents