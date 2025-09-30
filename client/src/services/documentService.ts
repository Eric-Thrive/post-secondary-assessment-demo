
import { documentProcessor, ProcessedDocument } from './document/documentProcessor';

class DocumentService {
  async extractTextFromFile(file: File): Promise<string> {
    return await documentProcessor.extractTextFromFile(file);
  }

  async processDocuments(files: FileList): Promise<ProcessedDocument[]> {
    return await documentProcessor.processDocuments(files);
  }
}

export const documentService = new DocumentService();
export type { ProcessedDocument };
