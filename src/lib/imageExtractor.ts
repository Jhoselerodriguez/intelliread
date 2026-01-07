import * as pdfjsLib from 'pdfjs-dist';

export interface PageImageResult {
  pageNum: number;
  hasText: boolean;
  isImageOnly: boolean;
  pageImageBlob?: Blob;
  imageCount: number;
}

/**
 * Detect if a page is image-only (no text content but has images)
 */
export const detectImageOnlyPages = async (
  pdfBlob: Blob,
  onProgress?: (status: string) => void
): Promise<PageImageResult[]> => {
  const arrayBuffer = await pdfBlob.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  const results: PageImageResult[] = [];
  
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    onProgress?.(`Analyzing page ${pageNum}/${pdf.numPages} for images...`);
    
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    // Get text from page
    const items = textContent.items as any[];
    const pageText = items.map(item => item.str).join(' ').trim();
    const hasText = pageText.length > 20; // More than 20 chars = has meaningful text
    
    // Check for images in the page
    const operatorList = await page.getOperatorList();
    let imageCount = 0;
    
    for (let i = 0; i < operatorList.fnArray.length; i++) {
      if (
        operatorList.fnArray[i] === pdfjsLib.OPS.paintImageXObject ||
        operatorList.fnArray[i] === pdfjsLib.OPS.paintXObject
      ) {
        imageCount++;
      }
    }
    
    const isImageOnly = !hasText && imageCount > 0;
    
    results.push({
      pageNum,
      hasText,
      isImageOnly,
      imageCount,
    });
  }
  
  return results;
};

/**
 * Render a PDF page to an image blob
 */
export const renderPageToImage = async (
  pdfBlob: Blob,
  pageNum: number,
  scale: number = 2.0
): Promise<Blob> => {
  const arrayBuffer = await pdfBlob.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(pageNum);
  
  const viewport = page.getViewport({ scale });
  
  // Create canvas
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  if (!context) {
    throw new Error('Could not get canvas context');
  }
  
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  
  // Render page to canvas
  await page.render({
    canvasContext: context,
    viewport,
  }).promise;
  
  // Convert canvas to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create image blob'));
        }
      },
      'image/png',
      0.95
    );
  });
};

/**
 * Get all image-only pages with their rendered images
 */
export const getImageOnlyPagesWithImages = async (
  pdfBlob: Blob,
  onProgress?: (status: string) => void
): Promise<Array<{ pageNum: number; imageBlob: Blob }>> => {
  const pageResults = await detectImageOnlyPages(pdfBlob, onProgress);
  const imageOnlyPages = pageResults.filter(p => p.isImageOnly);
  
  const results: Array<{ pageNum: number; imageBlob: Blob }> = [];
  
  for (const page of imageOnlyPages) {
    onProgress?.(`Rendering image from page ${page.pageNum}...`);
    try {
      const imageBlob = await renderPageToImage(pdfBlob, page.pageNum);
      results.push({
        pageNum: page.pageNum,
        imageBlob,
      });
    } catch (error) {
      console.error(`Failed to render page ${page.pageNum}:`, error);
    }
  }
  
  return results;
};

/**
 * Check if a PDF is primarily image-based
 */
export const isPdfImageBased = async (pdfBlob: Blob): Promise<{
  isImageBased: boolean;
  imageOnlyPageCount: number;
  totalPages: number;
  textPageCount: number;
}> => {
  const pageResults = await detectImageOnlyPages(pdfBlob);
  const imageOnlyPageCount = pageResults.filter(p => p.isImageOnly).length;
  const textPageCount = pageResults.filter(p => p.hasText).length;
  
  return {
    isImageBased: imageOnlyPageCount > textPageCount,
    imageOnlyPageCount,
    totalPages: pageResults.length,
    textPageCount,
  };
};
