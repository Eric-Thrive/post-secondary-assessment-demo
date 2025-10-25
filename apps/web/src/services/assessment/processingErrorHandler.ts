
import { apiClient } from '@/lib/apiClient';
import { AssessmentCase } from '@/types/assessmentCase';

export class ProcessingErrorHandler {
  static async handleProcessingError(
    error: any,
    assessmentCase: AssessmentCase,
    updateCase: (caseId: string, updates: Partial<AssessmentCase>) => void,
    currentCase: AssessmentCase | null,
    setCurrentCase: (case_: AssessmentCase) => void
  ): Promise<void> {
    console.error('=== Assessment Processing Failed ===');
    console.error('Error details:', {
      errorType: error.constructor.name,
      errorMessage: error.message,
      errorStack: error.stack
    });
    
    const isDocumentError = error instanceof Error && error.message.includes('Document processing failed');
    const errorStatus = isDocumentError ? 'document_processing_error' : 'error';
    
    console.log('Setting error status to:', errorStatus);
    
    await apiClient.updateCaseStatus(assessmentCase.id, errorStatus);
    
    const errorCase: AssessmentCase = {
      ...assessmentCase,
      status: errorStatus,
      last_updated: new Date().toISOString()
    };

    updateCase(assessmentCase.id, errorCase);

    if (currentCase?.id === assessmentCase.id) {
      setCurrentCase(errorCase);
    }
  }
}
