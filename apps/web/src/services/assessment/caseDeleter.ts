
import { apiClient } from '@/lib/apiClient';

export class CaseDeleter {
  async deleteCase(caseId: string): Promise<void> {
    try {
      console.log('Deleting case:', caseId);
      
      await apiClient.deleteAssessmentCase(caseId);

      console.log('Successfully deleted case');
      
    } catch (error) {
      console.error('Failed to delete case:', error);
      throw error;
    }
  }
}

export const caseDeleter = new CaseDeleter();
