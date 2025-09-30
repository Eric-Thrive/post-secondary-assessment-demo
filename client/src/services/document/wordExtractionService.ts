import * as mammoth from 'mammoth';

export class WordExtractionService {
  async extractTextFromWord(file: File): Promise<string> {
    // Check if this is an unsupported .doc file
    if (this.isLegacyDocFile(file)) {
      throw new Error('Legacy .doc files are not supported. Please convert to .docx format before uploading.');
    }
    
    try {
      console.log('=== Word Extraction Starting ===');
      console.log('Word file:', file.name, 'Size:', file.size, 'bytes', 'Type:', file.type);
      
      // Convert file to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      console.log('ArrayBuffer created successfully, size:', arrayBuffer.byteLength);
      
      // Extract raw text using Mammoth.js
      console.log('Extracting text from Word document...');
      const result = await mammoth.extractRawText({ arrayBuffer });
      
      const extractedText = result.value;
      console.log(`✅ Text extracted successfully: ${extractedText.length} characters`);
      
      // Log any warnings from Mammoth
      if (result.messages && result.messages.length > 0) {
        console.warn('Mammoth warnings:', result.messages);
      }
      
      // Validate extracted text
      this.validateExtractedText(extractedText);
      
      console.log('=== Word Extraction Complete ===');
      return extractedText;
      
    } catch (error) {
      console.error('❌ Word extraction failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to extract text from Word document: ${errorMessage}`);
    }
  }
  
  private validateExtractedText(text: string): void {
    if (text.trim().length === 0) {
      console.error('❌ Word document appears to contain no extractable text');
      throw new Error('No text found in Word document - document may be empty or corrupted.');
    }
    
    if (text.trim().length < 10) {
      console.warn('❌ Very little text extracted from Word document');
      throw new Error('Minimal text extracted - document may be primarily images or tables.');
    }
    
    console.log('✅ Word text validation passed');
  }
  
  private isLegacyDocFile(file: File): boolean {
    const hasDocExtension = /\.doc$/i.test(file.name);
    const hasDocMimeType = file.type === 'application/msword';
    
    return hasDocExtension || hasDocMimeType;
  }
  
  isWordDocument(file: File): boolean {
    const allWordTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.ms-word.document.macroEnabled.12', // .docm
      'application/msword' // .doc (legacy - will be rejected with helpful message)
    ];
    
    const hasWordExtension = /\.(docx?|docm)$/i.test(file.name);
    const hasWordMimeType = allWordTypes.includes(file.type);
    
    return hasWordExtension || hasWordMimeType;
  }
}

export const wordExtractionService = new WordExtractionService();