import Tesseract from 'tesseract.js';

export class OCRService {
  private isInitialized = false;
  
  async initializeOCR(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    
    try {
      console.log('=== Initializing Tesseract OCR ===');
      // Tesseract.js initializes automatically when imported
      this.isInitialized = true;
      console.log('✅ Tesseract OCR initialized successfully');
    } catch (error) {
      console.error('❌ OCR initialization failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to initialize OCR: ${errorMessage}`);
    }
  }
  
  async performOCR(file: File): Promise<string> {
    try {
      console.log('=== OCR Processing Starting ===');
      console.log('OCR file:', file.name, 'Size:', file.size, 'bytes', 'Type:', file.type);
      
      await this.initializeOCR();
      
      console.log('Running OCR with Tesseract.js...');
      const result = await Tesseract.recognize(file, 'eng', {
        logger: (m: any) => console.log('Tesseract progress:', m)
      });
      
      const extractedText = result.data.text;
      console.log(`✅ OCR completed: ${extractedText.length} characters extracted`);
      console.log(`OCR confidence: ${result.data.confidence}%`);
      
      // Validate OCR results
      this.validateOCRText(extractedText);
      
      console.log('=== OCR Processing Complete ===');
      return extractedText;
      
    } catch (error) {
      console.error('❌ OCR processing failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`OCR failed: ${errorMessage}`);
    }
  }
  
  private validateOCRText(text: string): void {
    if (text.trim().length === 0) {
      console.error('❌ OCR produced no readable text');
      throw new Error('No text could be extracted via OCR - image may be too low quality or contain no readable text.');
    }
    
    if (text.trim().length < 20) {
      console.warn('⚠️ Very little text extracted via OCR - results may be incomplete');
    }
    
    console.log('✅ OCR text validation passed');
  }
  
  canProcessWithOCR(file: File): boolean {
    // Tesseract.js can handle images (PDFs need to be converted to images first)
    const ocrTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/bmp',
      'image/tiff',
      'image/webp'
    ];
    
    return ocrTypes.includes(file.type) || /\.(jpe?g|png|gif|bmp|tiff?|webp)$/i.test(file.name);
  }
}

export const ocrService = new OCRService();