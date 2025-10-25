
import * as pdfjsLib from 'pdfjs-dist';
import { pdfWorkerValidator } from './pdfWorkerValidator';
import { pdfTextExtractor } from './pdfTextExtractor';
import { pdfErrorHandler } from './pdfErrorHandler';
import { ocrService } from './ocrService';

// Configure PDF.js worker - using local worker file to avoid CORS issues
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

export class PDFExtractionService {
  private async performPDFOCR(pdf: any): Promise<string> {
    const MAX_OCR_PAGES = 10; // Limit OCR processing to prevent excessive resource usage
    const numPages = Math.min(pdf.numPages, MAX_OCR_PAGES);
    
    console.log(`Starting OCR for ${numPages} pages (limit: ${MAX_OCR_PAGES})`);
    let ocrText = '';
    
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      try {
        console.log(`OCR processing page ${pageNum}/${numPages}...`);
        
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR accuracy
        
        // Create canvas to render PDF page
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        if (!context) {
          throw new Error('Failed to get canvas context');
        }
        
        // Render PDF page to canvas
        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };
        
        await page.render(renderContext).promise;
        
        // Convert canvas to blob
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert canvas to blob'));
            }
          }, 'image/png', 0.8);
        });
        
        // Create file from blob for OCR
        const imageFile = new File([blob], `page_${pageNum}.png`, { type: 'image/png' });
        
        // Perform OCR on the page image
        const pageOcrText = await ocrService.performOCR(imageFile);
        ocrText += pageOcrText + '\n\n';
        
        console.log(`✅ OCR completed for page ${pageNum}`);
        
      } catch (pageOcrError) {
        console.error(`❌ OCR failed for page ${pageNum}:`, pageOcrError);
        // Continue with other pages even if one fails
      }
    }
    
    if (pdf.numPages > MAX_OCR_PAGES) {
      console.warn(`⚠️ PDF has ${pdf.numPages} pages but OCR was limited to ${MAX_OCR_PAGES} pages`);
      ocrText += `\n\n[Note: This PDF contains ${pdf.numPages} pages, but OCR processing was limited to the first ${MAX_OCR_PAGES} pages for performance reasons.]`;
    }
    
    console.log(`OCR completed: ${ocrText.length} characters extracted from ${numPages} pages`);
    return ocrText.trim();
  }

  async extractTextFromPDF(file: File): Promise<string> {
    try {
      console.log('=== PDF Extraction Starting (ENHANCED DEBUG) ===');
      console.log('PDF file:', file.name, 'Size:', file.size, 'bytes', 'Type:', file.type);
      console.log('PDF.js version:', pdfjsLib.version);
      console.log('Worker source configured:', pdfjsLib.GlobalWorkerOptions.workerSrc);
      
      // Validate worker first
      await pdfWorkerValidator.validateWorker();
      
      console.log('Creating ArrayBuffer from file...');
      const arrayBuffer = await file.arrayBuffer();
      console.log('ArrayBuffer created successfully, size:', arrayBuffer.byteLength);
      
      // Add extra debugging for PDF loading
      console.log('Attempting to load PDF document...');
      const loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer,
        verbosity: 1 // Enable PDF.js internal logging
      });
      
      console.log('Loading task created, waiting for promise...');
      const pdf = await loadingTask.promise;
      console.log('✅ PDF document loaded successfully');
      console.log('PDF info - Pages:', pdf.numPages, 'Fingerprints:', pdf.fingerprints);
      
      let fullText = '';
      const numPages = pdf.numPages;
      console.log(`PDF has ${numPages} pages`);
      console.log('=== PAGE-BY-PAGE EXTRACTION DETAILS ===');
      
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        try {
          console.log(`\n--- Processing page ${pageNum}/${numPages} ---`);
          
          console.log(`Getting page ${pageNum}...`);
          const page = await pdf.getPage(pageNum);
          console.log(`✅ Page ${pageNum} loaded`);
          
          console.log(`Getting text content for page ${pageNum}...`);
          const textContent = await page.getTextContent();
          console.log(`✅ Text content retrieved for page ${pageNum}`);
          
          const pageText = pdfTextExtractor.extractTextFromPage(textContent, pageNum);
          
          fullText += pageText + '\n\n';
          console.log(`✅ Page ${pageNum} processed successfully`);
          
        } catch (pageError) {
          console.error(`❌ Error extracting text from page ${pageNum}:`, pageError);
          const error = pageError instanceof Error ? pageError : new Error('Unknown error');
          console.error(`Page ${pageNum} error details:`, {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
          console.warn(`Page ${pageNum}: FAILED EXTRACTION - content will be missing from final result`);
          // Continue with other pages even if one fails
        }
      }
      
      console.log(`=== PDF Extraction Summary ===`);
      console.log(`Total pages processed: ${numPages}`);
      console.log(`Final document length: ${fullText.length} characters`);
      console.log(`Average chars per page: ${(fullText.length / numPages).toFixed(0)}`);
      
      // Check if text extraction was successful, fallback to OCR if needed
      if (fullText.trim().length < 50) {
        console.warn('⚠️ Limited text extracted - this may be a scanned PDF');
        console.log('Attempting OCR fallback for scanned PDF...');
        
        try {
          const ocrText = await this.performPDFOCR(pdf);
          if (ocrText && ocrText.trim().length > fullText.trim().length) {
            console.log('✅ OCR fallback successful, using OCR text');
            fullText = ocrText;
          } else {
            console.warn('⚠️ OCR fallback did not improve text extraction');
          }
        } catch (ocrError) {
          console.warn('⚠️ OCR fallback failed:', ocrError);
          console.log('Using original extracted text (limited)');
        }
      }
      
      pdfErrorHandler.validateExtractedText(fullText);
      
      console.log('✅ PDF extraction completed successfully');
      return fullText.trim();
      
    } catch (error) {
      return pdfErrorHandler.handleExtractionError(error);
    }
  }
}

export const pdfExtractionService = new PDFExtractionService();
