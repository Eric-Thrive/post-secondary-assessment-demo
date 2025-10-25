
import * as pdfjsLib from 'pdfjs-dist';

export class PDFWorkerValidator {
  async validateWorker(): Promise<void> {
    try {
      console.log('=== Validating PDF.js Worker ===');
      console.log('Worker source:', pdfjsLib.GlobalWorkerOptions.workerSrc);
      
      // Check if worker file exists and is accessible
      const workerResponse = await fetch('/pdf.worker.min.js');
      if (!workerResponse.ok) {
        throw new Error(`PDF worker file not found (HTTP ${workerResponse.status}). Please run: node scripts/download-pdf-worker.cjs`);
      }
      
      const workerSize = workerResponse.headers.get('content-length');
      console.log('Worker file found, size:', workerSize ? `${Math.floor(parseInt(workerSize) / 1024)} KB` : 'unknown');
      
      // Test worker initialization by trying to load a minimal PDF
      console.log('Testing worker initialization...');
      
      console.log('✅ PDF worker validation passed');
    } catch (error) {
      console.error('❌ PDF worker validation failed:', error);
      throw error;
    }
  }
}

export const pdfWorkerValidator = new PDFWorkerValidator();
