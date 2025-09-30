import { apiClient } from '@/lib/apiClient';
import { AssessmentCase } from '@/types/assessmentCase';

export class DocumentCleanupStep {
  static async execute(
    assessmentCase: AssessmentCase,
    originalDocumentCount: number,
    updateCase: (caseId: string, updates: Partial<AssessmentCase>) => void
  ): Promise<void> {
    console.log('=== STEP 4: Document Cleanup Phase ===');
    console.log('Removing document metadata after successful analysis...');
    
    // Clear documents array but keep count for audit purposes
    const cleanedCase: Partial<AssessmentCase> = {
      documents: [], // Clear all document metadata
      last_updated: new Date().toISOString()
    };

    // Update case in Database
    await apiClient.updateCaseDocuments(assessmentCase.id, []);
    
    // Update local state
    updateCase(assessmentCase.id, cleanedCase);
    
    console.log('✅ Document cleanup completed successfully');
    console.log(`Removed metadata for ${originalDocumentCount} documents`);
  }
}
