
import { documentService } from '@/services/documentService';

export class DocumentProcessingStep {
  static async execute(documentFiles: FileList): Promise<any[]> {
    console.log('=== STEP 2: Document Processing Phase ===');
    console.log('Starting document processing...');
    
    const processedDocs = await documentService.processDocuments(documentFiles);
    
    console.log('✅ Document processing completed successfully');
    console.log('Document processing results:');
    processedDocs.forEach((doc, index) => {
      console.log(`  ${index + 1}. ${doc.filename}: ${doc.content.length.toLocaleString()} characters`);
      console.log(`     Type: ${doc.type}`);
      console.log(`     Preview: "${doc.content.substring(0, 100)}${doc.content.length > 100 ? '...' : ''}"`);
    });

    const totalContent = processedDocs.reduce((sum, doc) => sum + doc.content.length, 0);
    console.log('Total content extracted:', totalContent.toLocaleString(), 'characters');
    
    if (totalContent < 50) {
      console.error('❌ Very little content extracted:', totalContent, 'characters');
      throw new Error('document_processing_error: Very little content extracted from documents');
    }

    return processedDocs;
  }
}
