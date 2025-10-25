
import { apiClient } from '@/lib/apiClient';
import { AssessmentCase } from '@/types/assessmentCase';

export class CaseStatusStep {
  static async updateToProcessing(
    assessmentCase: AssessmentCase,
    updateCase: (caseId: string, updates: Partial<AssessmentCase>) => void
  ): Promise<void> {
    console.log('=== STEP 1: Updating case status to processing ===');
    await apiClient.updateCaseStatus(assessmentCase.id, 'processing');
    
    updateCase(assessmentCase.id, { 
      status: 'processing', 
      last_updated: new Date().toISOString() 
    });

    console.log('✅ Case status updated successfully');
  }
}
