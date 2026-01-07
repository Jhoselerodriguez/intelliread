import * as pdfjsLib from 'pdfjs-dist';
import type { Section, ExtractedTable } from '@/types';
import { detectImageOnlyPages, renderPageToImage } from './imageExtractor';
import { generateImageDescription } from './apiClient';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export interface ExtractedPage {
  page: number;
  text: string;
  items: any[];
  isImageOnly?: boolean;
  imageDescription?: string;
}

export interface PDFExtractionResult {
  pages: ExtractedPage[];
  tables: ExtractedTable[];
  pageCount: number;
  wordCount: number;
  title: string;
  isImageBased: boolean;
  imageOnlyPageCount: number;
}

export interface ExtractionOptions {
  geminiApiKey?: string;
  onProgress?: (status: string) => void;
}

/**
 * Extract text from PDF with support for image-only pages
 * Image-only pages are processed using Gemini to generate descriptions
 */
export const extractTextFromPDF = async (
  pdfBlob: Blob,
  onProgress?: (status: string) => void,
  options?: ExtractionOptions
): Promise<PDFExtractionResult> => {
  const geminiApiKey = options?.geminiApiKey;
  const arrayBuffer = await pdfBlob.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  const pages: ExtractedPage[] = [];
  const allTables: ExtractedTable[] = [];
  let totalWordCount = 0;
  let documentTitle = '';
  let imageOnlyPageCount = 0;

  // First, detect which pages are image-only
  onProgress?.('Analyzing page content types...');
  const pageAnalysis = await detectImageOnlyPages(pdfBlob, onProgress);

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    onProgress?.(`Processing page ${pageNum}/${pdf.numPages}...`);
    
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    // Extract text
    const items = textContent.items as any[];
    let pageText = items.map(item => item.str).join(' ').trim();
    
    const pageInfo = pageAnalysis.find(p => p.pageNum === pageNum);
    const isImageOnly = pageInfo?.isImageOnly || false;
    let imageDescription = '';

    // If this is an image-only page, try to get description via Gemini
    if (isImageOnly) {
      imageOnlyPageCount++;
      onProgress?.(`Page ${pageNum} is image-only, processing with AI...`);
      
      if (geminiApiKey) {
        try {
          const pageImageBlob = await renderPageToImage(pdfBlob, pageNum);
          imageDescription = await generateImageDescription(pageImageBlob, geminiApiKey);
          
          // Use the image description as the page text
          pageText = `[Image Content - Page ${pageNum}]\n${imageDescription}`;
        } catch (error) {
          console.error(`Failed to process image on page ${pageNum}:`, error);
          pageText = `[Image Content - Page ${pageNum}]\nImage content detected on this page.`;
          imageDescription = 'Image content detected on this page.';
        }
      } else {
        // No Gemini API key - use placeholder
        pageText = `[Image Content - Page ${pageNum}]\nImage content detected on this page. Configure Gemini API for AI-powered image analysis.`;
        imageDescription = 'Image content detected on this page.';
      }
    }
    
    pages.push({
      page: pageNum,
      text: pageText,
      items: items,
      isImageOnly,
      imageDescription,
    });
    
    totalWordCount += pageText.split(/\s+/).filter(w => w.length > 0).length;
    
    // Try to get title from first page
    if (pageNum === 1 && items.length > 0) {
      // Find the largest text on first page as title
      const sortedBySize = items
        .filter(item => item.str.trim().length > 0)
        .sort((a, b) => (b.height || 12) - (a.height || 12));
      
      if (sortedBySize.length > 0) {
        documentTitle = sortedBySize[0].str.trim().substring(0, 100);
      }
    }
    
    // Detect tables (only on text pages)
    if (!isImageOnly) {
      const tables = detectTables(textContent, pageNum);
      allTables.push(...tables);
    }
  }

  // Calculate if document is primarily image-based
  const isImageBased = imageOnlyPageCount > (pdf.numPages - imageOnlyPageCount);

  return {
    pages,
    tables: allTables,
    pageCount: pdf.numPages,
    wordCount: totalWordCount,
    title: documentTitle || 'Untitled Document',
    isImageBased,
    imageOnlyPageCount,
  };
};

const detectTables = (textContent: any, pageNum: number): ExtractedTable[] => {
  const tables: ExtractedTable[] = [];
  const items = textContent.items as any[];
  
  if (items.length === 0) return tables;

  // Group items by Y coordinate (rows)
  const rows = new Map<number, any[]>();
  items.forEach((item: any) => {
    if (!item.str.trim()) return;
    const y = Math.round(item.transform[5] / 5) * 5; // Round to nearest 5
    if (!rows.has(y)) rows.set(y, []);
    rows.get(y)!.push(item);
  });

  // Sort rows by Y coordinate (top to bottom)
  const sortedRows = Array.from(rows.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([_, items]) => 
      items.sort((a, b) => a.transform[4] - b.transform[4])
    );

  // Find table-like structures (rows with similar column counts)
  let currentTable: any[][] = [];
  let prevColCount = 0;

  sortedRows.forEach((row, idx) => {
    const colCount = row.length;
    
    // Check if this row is part of a table (2+ columns and similar to previous)
    if (colCount >= 2 && (currentTable.length === 0 || Math.abs(colCount - prevColCount) <= 2)) {
      currentTable.push(row);
      prevColCount = colCount;
    } else {
      // End of table, save if we have enough rows
      if (currentTable.length >= 3) {
        tables.push(structureTable(currentTable, pageNum, tables.length));
      }
      currentTable = colCount >= 2 ? [row] : [];
      prevColCount = colCount;
    }
  });

  // Don't forget last table
  if (currentTable.length >= 3) {
    tables.push(structureTable(currentTable, pageNum, tables.length));
  }

  return tables;
};

const structureTable = (rows: any[][], pageNum: number, tableIndex: number): ExtractedTable => {
  const headers = rows[0].map((item: any) => item.str.trim());
  const data = rows.slice(1).map(row => row.map((item: any) => item.str.trim()));

  return {
    id: crypto.randomUUID(),
    documentId: '',
    tableIndex,
    page: pageNum,
    headers,
    data,
    rows: data.length,
    columns: headers.length,
  };
};

export const extractSections = (pages: ExtractedPage[]): Section[] => {
  const sections: Section[] = [];
  
  // Separate image-only pages from text pages for section building
  const imageOnlyPages = pages.filter(p => p.isImageOnly);
  const textPages = pages.filter(p => !p.isImageOnly);
  
  // Build sections from text pages
  const fullText = textPages.map(p => p.text).join('\n\n');
  
  // Split by common section patterns
  const sectionPatterns = /(?:^|\n)(?:(?:Chapter|Section|Part)\s+\d+[.:]\s*|(?:\d+\.?\s+)?[A-Z][A-Z\s]{3,}(?:\n|$))/gm;
  const matches = [...fullText.matchAll(sectionPatterns)];
  
  if (matches.length === 0 && fullText.trim().length > 50) {
    // No clear sections found, create chunks by paragraphs
    const paragraphs = fullText.split(/\n{2,}/).filter(p => p.trim().length > 50);
    const chunkSize = Math.ceil(paragraphs.length / Math.max(1, Math.floor(paragraphs.length / 5)));
    
    for (let i = 0; i < paragraphs.length; i += chunkSize) {
      const chunk = paragraphs.slice(i, i + chunkSize);
      const content = chunk.join('\n\n');
      
      sections.push({
        title: `Section ${sections.length + 1}`,
        content,
        page: Math.ceil((i / paragraphs.length) * textPages.length) + 1,
        bulletPoints: extractBulletPoints(content),
      });
    }
  } else if (matches.length > 0) {
    // Create sections from detected patterns
    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].index!;
      const end = i < matches.length - 1 ? matches[i + 1].index : fullText.length;
      const content = fullText.substring(start, end).trim();
      
      const titleMatch = content.match(/^(.+?)(?:\n|$)/);
      const title = titleMatch ? titleMatch[1].trim() : `Section ${i + 1}`;
      
      sections.push({
        title: title.substring(0, 80),
        content,
        page: Math.ceil((start / fullText.length) * textPages.length) + 1,
        bulletPoints: extractBulletPoints(content),
      });
    }
  }
  
  // Add sections for image-only pages
  if (imageOnlyPages.length > 0) {
    // Group consecutive image-only pages
    const imageGroups: ExtractedPage[][] = [];
    let currentGroup: ExtractedPage[] = [];
    
    for (const page of imageOnlyPages) {
      if (currentGroup.length === 0) {
        currentGroup.push(page);
      } else {
        const lastPage = currentGroup[currentGroup.length - 1];
        if (page.page === lastPage.page + 1) {
          currentGroup.push(page);
        } else {
          imageGroups.push([...currentGroup]);
          currentGroup = [page];
        }
      }
    }
    if (currentGroup.length > 0) {
      imageGroups.push(currentGroup);
    }
    
    // Create sections for each group
    for (const group of imageGroups) {
      const startPage = group[0].page;
      const endPage = group[group.length - 1].page;
      const content = group.map(p => p.text).join('\n\n');
      
      const pageRange = startPage === endPage 
        ? `Page ${startPage}` 
        : `Pages ${startPage}–${endPage}`;
      
      sections.push({
        title: `Image Content (${pageRange})`,
        content,
        page: startPage,
        bulletPoints: group
          .filter(p => p.imageDescription)
          .map(p => p.imageDescription!)
          .slice(0, 5),
      });
    }
  }
  
  // Ensure at least one section
  if (sections.length === 0) {
    const allText = pages.map(p => p.text).join('\n\n');
    sections.push({
      title: pages.some(p => p.isImageOnly) ? 'Image Content' : 'Section 1',
      content: allText || 'No content extracted from this document.',
      page: 1,
      bulletPoints: extractBulletPoints(allText),
    });
  }

  // Sort sections by page number
  sections.sort((a, b) => a.page - b.page);

  return sections;
};

const extractBulletPoints = (text: string): string[] => {
  if (!text || text.length === 0) {
    return ['No text content available'];
  }
  
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const bullets: string[] = [];
  
  // Take key sentences (first few and any with important keywords)
  const importantKeywords = ['important', 'key', 'main', 'conclusion', 'result', 'finding', 'must', 'should', 'shows', 'displays', 'illustrates'];
  
  sentences.forEach((sentence, idx) => {
    const trimmed = sentence.trim();
    if (bullets.length < 5) {
      const isImportant = importantKeywords.some(kw => 
        trimmed.toLowerCase().includes(kw)
      );
      if (idx < 3 || isImportant) {
        bullets.push(trimmed.substring(0, 200));
      }
    }
  });

  return bullets.length > 0 ? bullets : [text.substring(0, 200).trim() || 'Content available'];
};

export const generateChunks = (
  pages: ExtractedPage[],
  sections: Section[],
  documentId: string
): { text: string; section: string; page: number; chunkIndex: number }[] => {
  const chunks: { text: string; section: string; page: number; chunkIndex: number }[] = [];
  const chunkSize = 800;
  const overlap = 200;

  sections.forEach((section, sectionIdx) => {
    let startIdx = 0;
    let chunkIdx = 0;

    while (startIdx < section.content.length) {
      const endIdx = Math.min(startIdx + chunkSize, section.content.length);
      const chunkText = section.content.substring(startIdx, endIdx).trim();

      if (chunkText.length > 50) { // Lower threshold to include image descriptions
        chunks.push({
          text: chunkText,
          section: section.title,
          page: section.page,
          chunkIndex: chunkIdx,
        });
        chunkIdx++;
      }

      startIdx += chunkSize - overlap;
    }
  });

  return chunks;
};
