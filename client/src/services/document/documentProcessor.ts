
import { pdfExtractionService } from './pdfExtractionService';
import { fileProcessingService } from './fileProcessingService';
import { wordExtractionService } from './wordExtractionService';
import { ocrService } from './ocrService';

export interface ProcessedDocument {
  id: string;
  filename: string;
  type: string;
  content: string;
  processed_date: string;
}

export class DocumentProcessor {
  async extractTextFromFile(file: File): Promise<string> {
    if (file.type === 'application/pdf') {
      try {
        return await pdfExtractionService.extractTextFromPDF(file);
      } catch (error) {
        console.error('PDF extraction failed, using fallback:', error);
        const reason = error instanceof Error ? error.message : 'Unknown PDF processing error';
        return fileProcessingService.createEnhancedFallbackText(file, reason);
      }
    } else if (wordExtractionService.isWordDocument(file)) {
      try {
        console.log(`Processing Word document: ${file.name} (${file.type})`);
        return await wordExtractionService.extractTextFromWord(file);
      } catch (error) {
        console.error('Word extraction failed, using fallback:', error);
        const reason = error instanceof Error ? error.message : 'Unknown Word processing error';
        return `[Word Document - ${file.name}]\nFile size: ${this.formatFileSize(file.size)}\nError: ${reason}\nNote: This Word document could not be processed automatically. Please manually review and provide key findings for the accommodation assessment.`;
      }
    } else if (ocrService.canProcessWithOCR(file)) {
      try {
        console.log(`Processing image file with OCR: ${file.name} (${file.type})`);
        return await ocrService.performOCR(file);
      } catch (error) {
        console.error('OCR processing failed, using fallback:', error);
        const reason = error instanceof Error ? error.message : 'Unknown OCR processing error';
        return `[Image Document - ${file.name}]\nFile size: ${this.formatFileSize(file.size)}\nError: ${reason}\nNote: This image document could not be processed with OCR. Please manually review and provide key findings for the accommodation assessment.`;
      }
    }
    
    return await fileProcessingService.extractTextFromFile(file);
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return Math.round(bytes / (1024 * 1024)) + ' MB';
  }

  async processDocuments(files: FileList): Promise<ProcessedDocument[]> {
    const processedDocs: ProcessedDocument[] = [];
    console.log(`=== Processing ${files.length} documents ===`);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        console.log(`\n--- Processing document ${i + 1}/${files.length}: ${file.name} ---`);
        const content = await this.extractTextFromFile(file);
        
        if (!content || content.trim().length === 0) {
          console.warn(`Document ${file.name} appears to be empty or could not be processed`);
        } else {
          console.log(`Content extraction successful: ${content.length} characters`);
        }
        
        const processedDoc = {
          id: `doc_${Date.now()}_${i}`,
          filename: file.name,
          type: file.type,
          content,
          processed_date: new Date().toISOString()
        };
        
        processedDocs.push(processedDoc);
        console.log(`Document ${file.name} processed successfully`);
        
      } catch (error) {
        console.error(`Failed to process ${file.name}:`, error);
        // Add a failed document entry so the user knows what happened
        processedDocs.push({
          id: `doc_${Date.now()}_${i}_failed`,
          filename: file.name,
          type: file.type,
          content: `[Error processing ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}]\nNote: This document could not be processed automatically. Please manually review and provide key findings for the accommodation assessment.`,
          processed_date: new Date().toISOString()
        });
      }
    }
    
    console.log(`=== Document processing complete ===`);
    console.log(`${processedDocs.length} documents processed.`);
    console.log('Total content length:', processedDocs.reduce((sum, doc) => sum + doc.content.length, 0), 'characters');
    
    return processedDocs;
  }
}

export const documentProcessor = new DocumentProcessor();
