
export class PDFErrorHandler {
  handleExtractionError(error: any): never {
    console.error('=== PDF Extraction Failed ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Provide more specific error messages based on error type
    if (error instanceof Error) {
      if (error.message.includes('worker') || error.message.includes('Worker')) {
        throw new Error(`PDF worker failed: ${error.message}. The worker file may be corrupted.`);
      }
      
      if (error.message.includes('Invalid PDF') || error.message.includes('Invalid or corrupted PDF')) {
        throw new Error('Invalid PDF file format. Please ensure the file is a valid PDF document.');
      }
      
      if (error.message.includes('Password')) {
        throw new Error('PDF is password protected and cannot be processed.');
      }
      
      if (error.message.includes('No extractable text')) {
        throw error; // Re-throw our custom message
      }
      
      // Check for specific PDF.js errors
      if (error.name === 'InvalidPDFException') {
        throw new Error('Invalid PDF file - the file may be corrupted or not a valid PDF.');
      }
      
      if (error.name === 'MissingPDFException') {
        throw new Error('PDF file is missing or could not be read.');
      }
      
      if (error.name === 'UnexpectedResponseException') {
        throw new Error('Unexpected response while processing PDF - file may be corrupted.');
      }
      
      throw new Error(`PDF processing failed: ${error.message}`);
    }
    
    throw new Error('PDF processing failed due to an unknown error');
  }

  validateExtractedText(fullText: string): void {
    if (fullText.trim().length === 0) {
      console.error('❌ PDF appears to contain no extractable text - likely scanned/image-based');
      throw new Error('No extractable text found - this may be a scanned document or image-based PDF. The PDF loaded successfully but contains no readable text.');
    }
    
    if (fullText.trim().length < 50) {
      console.warn('❌ Very little text extracted from PDF');
      throw new Error('Minimal text extracted - document may be primarily images');
    }
  }
}

export const pdfErrorHandler = new PDFErrorHandler();
