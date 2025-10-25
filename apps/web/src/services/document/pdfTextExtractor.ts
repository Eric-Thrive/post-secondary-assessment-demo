
export class PDFTextExtractor {
  extractTextFromPage(textContent: any, pageNum: number): string {
    const textItems = textContent.items as any[];
    console.log(`Page ${pageNum}: Found ${textItems.length} text items`);
    
    if (textItems.length === 0) {
      console.warn(`⚠️  Page ${pageNum}: NO TEXT ITEMS FOUND - likely image-based or empty`);
      return '';
    }
    
    // Debug first few text items
    console.log(`Page ${pageNum}: First 3 text items:`, textItems.slice(0, 3).map(item => ({
      text: item.str,
      x: item.transform[4],
      y: item.transform[5]
    })));
    
    // Sort text items by Y position (top to bottom), then X position (left to right)
    const sortedItems = textItems.sort((a, b) => {
      const yDiff = Math.abs(a.transform[5] - b.transform[5]);
      if (yDiff > 5) { // Different lines if Y difference > 5
        return b.transform[5] - a.transform[5]; // Top to bottom (higher Y first)
      }
      return a.transform[4] - b.transform[4]; // Left to right (lower X first)
    });
    
    // Build text with proper spacing
    let pageText = '';
    let lastY = null;
    let lastX = null;
    
    for (const item of sortedItems) {
      const currentY = item.transform[5];
      const currentX = item.transform[4];
      const text = item.str.trim();
      
      if (!text) continue;
      
      if (lastY !== null) {
        const yDiff = Math.abs(currentY - lastY);
        const xDiff = currentX - lastX;
        
        if (yDiff > 5) {
          // New line
          pageText += '\n';
        } else if (xDiff > 10) {
          // Same line, but significant horizontal gap
          pageText += ' ';
        }
      }
      
      pageText += text;
      lastY = currentY;
      lastX = currentX + (item.width || 0);
    }
    
    // Calculate text density (characters per text item)
    const density = pageText.length / textItems.length;
    console.log(`Page ${pageNum}: Text density: ${density.toFixed(2)} chars/item`);
    
    // Show preview of extracted text
    const preview = pageText.substring(0, 100).replace(/\n/g, '\\n');
    console.log(`Page ${pageNum}: Preview: "${preview}${pageText.length > 100 ? '...' : ''}"`);
    console.log(`Page ${pageNum}: Total characters: ${pageText.length}`);
    
    // Flag potentially problematic pages
    if (density < 2) {
      console.warn(`⚠️  Page ${pageNum}: LOW TEXT DENSITY (${density.toFixed(2)}) - possible extraction issues`);
    }
    
    if (pageText.length < 50) {
      console.warn(`⚠️  Page ${pageNum}: VERY SHORT CONTENT (${pageText.length} chars) - possible missing sections`);
    }
    
    return pageText;
  }
}

export const pdfTextExtractor = new PDFTextExtractor();
