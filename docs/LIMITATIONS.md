# Known Limitations

This document describes the technical limitations and constraints of IntelliRead.

## Image Processing Limitations

### AI Interpretation Accuracy

| Limitation | Description | Mitigation |
|------------|-------------|------------|
| **Interpretive descriptions** | AI-generated descriptions are interpretations, not exact transcriptions | Review critical content manually |
| **Handwritten text** | OCR quality depends heavily on handwriting clarity | Use typed documents when possible |
| **Low-resolution scans** | Poor scan quality reduces AI accuracy | Use 300+ DPI scans |
| **Complex layouts** | Multi-column, rotated, or overlay layouts may confuse extraction | Prefer simple layouts |

### Chart and Graph Extraction

| Limitation | Description |
|------------|-------------|
| **Multi-layered charts** | Charts with many data series may not be fully captured |
| **3D visualizations** | 3D charts are difficult to interpret accurately |
| **Interactive elements** | Dynamic or animated charts in PDF are static |
| **Fine print** | Small labels or legends may be missed |
| **Custom chart types** | Non-standard visualizations may not be recognized |

### Image Types Not Fully Supported

- **Photographs with text overlays**: Text in photos may not be extracted
- **Watermarks**: May interfere with content extraction
- **Background images**: Decorative backgrounds may be described unnecessarily
- **Embedded videos**: Video frames are not extracted

---

## OCR Constraints

### Text Recognition Limitations

| Factor | Impact |
|--------|--------|
| **Language** | Best results with Latin scripts; CJK and Arabic support varies |
| **Font styles** | Decorative or unusual fonts reduce accuracy |
| **Text size** | Very small text (< 8pt) may not be recognized |
| **Contrast** | Low contrast between text and background causes errors |
| **Skew** | Rotated or skewed pages affect extraction quality |

### Not Supported

- Mathematical equations (LaTeX/MathML not interpreted)
- Musical notation
- Technical drawings with embedded measurements
- Barcodes and QR codes

---

## Storage Limitations

### IndexedDB Constraints

| Browser | Typical Limit | Notes |
|---------|--------------|-------|
| Chrome | ~80% of disk | Per-origin quota |
| Firefox | ~50% of disk | User can extend |
| Safari | ~1 GB | Strict enforcement |
| Edge | ~80% of disk | Similar to Chrome |

### Practical Limits

| Scenario | Approximate Capacity |
|----------|---------------------|
| Text-only PDFs | ~1000 documents (100 pages each) |
| Mixed content | ~500 documents |
| Image-heavy PDFs | ~200 documents |

### Storage Full Behavior

When storage approaches limits:
1. Warning displayed to user
2. New uploads may fail
3. Existing documents remain accessible
4. User must delete documents to free space

---

## AI Provider Dependencies

### API Requirements

| Feature | Required API |
|---------|-------------|
| Image description | Gemini (Google) |
| Q&A responses | Groq, Perplexity, or Anthropic |
| No API configured | Limited to text extraction only |

### Connectivity Requirements

| Feature | Offline Capable |
|---------|----------------|
| PDF upload | ✅ Yes |
| Text extraction | ✅ Yes |
| Image analysis | ❌ Requires internet |
| Q&A chat | ❌ Requires internet |
| Document browsing | ✅ Yes (after indexing) |

### API Failure Modes

| Failure | System Behavior |
|---------|-----------------|
| Rate limit exceeded | Retry with exponential backoff |
| Invalid API key | Clear error message, prompt reconfiguration |
| Network timeout | Retry up to 3 times, then fail gracefully |
| Service outage | Fallback to degraded mode (no AI features) |

---

## Browser Compatibility

### Fully Supported

| Browser | Minimum Version |
|---------|-----------------|
| Chrome | 90+ |
| Firefox | 88+ |
| Edge | 90+ |
| Safari | 14+ |

### Known Issues

| Browser | Issue |
|---------|-------|
| Safari | IndexedDB quotas more restrictive |
| Firefox Private Mode | IndexedDB may be disabled |
| Mobile browsers | Performance reduced on large documents |
| IE/Legacy Edge | Not supported |

### Required APIs

- `IndexedDB`
- `FileReader`
- `Canvas` (for PDF rendering)
- `Fetch` (for AI API calls)
- `Web Workers` (optional, for performance)

---

## Privacy and Security

### Data Handling

| Data Type | Location | Encryption |
|-----------|----------|------------|
| PDF content | Local (IndexedDB) | Browser-managed |
| API keys | Local (IndexedDB) | Stored as-is (user responsibility) |
| Chat history | Local (IndexedDB) | Browser-managed |
| Temporary images | Memory only | Cleared after processing |

### Data Sent to APIs

| API | Data Sent |
|-----|-----------|
| Gemini | Page images (for description) |
| Groq/Perplexity/Anthropic | Question + retrieved text chunks |

### Not Sent

- Full PDF files
- User identity information
- Document metadata beyond what's in chunks

---

## Feature Limitations

### Document Processing

| Limitation | Description |
|------------|-------------|
| **Maximum pages** | No hard limit, but 500+ pages may cause performance issues |
| **File size** | Limited by browser memory; ~100MB practical maximum |
| **Concurrent uploads** | One at a time (sequential processing) |
| **PDF versions** | PDF 1.7 and earlier; PDF 2.0 partial support |

### Search and Query

| Limitation | Description |
|------------|-------------|
| **Search scope** | Single document only (no cross-document search) |
| **Query length** | Practical limit ~500 characters |
| **Response length** | Depends on AI provider limits |
| **Real-time updates** | Requires re-indexing if document changes |

### Export

| Format | Supported |
|--------|-----------|
| Chat to PDF | ✅ Yes |
| Document to Markdown | ❌ Not yet |
| Chunks to JSON | ❌ Not yet |
| Tables to CSV | ❌ Not yet |

---

## Performance Considerations

### Processing Time Estimates

| Document Type | 50 Pages | 200 Pages |
|---------------|----------|-----------|
| Text-only PDF | 15-30 sec | 60-120 sec |
| Mixed content | 30-60 sec | 2-4 min |
| Image-only PDF | 2-5 min | 8-20 min |

### Memory Usage

| Operation | Approximate RAM |
|-----------|-----------------|
| Loading PDF | 2-5x file size |
| Rendering page | 5-10 MB per page |
| AI processing | Minimal (API-based) |
| Idle (indexed) | 10-50 MB |

---

## Workarounds

### For Large Documents

1. Split into smaller PDFs before upload
2. Process during low-activity periods
3. Close other browser tabs to free memory

### For Poor OCR Quality

1. Re-scan at higher resolution
2. Use image pre-processing tools
3. Convert to searchable PDF externally

### For API Limits

1. Use multiple API keys in rotation
2. Reduce image analysis for text-heavy docs
3. Cache responses where possible

---

## Planned Improvements

| Limitation | Planned Solution | Timeline |
|------------|------------------|----------|
| No vector search | Embedding integration | Future |
| Single document scope | Cross-document index | Future |
| No Markdown export | Export feature | Planned |
| Limited mobile support | Progressive Web App | Under consideration |
