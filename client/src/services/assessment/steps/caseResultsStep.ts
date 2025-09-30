
import { apiClient } from '@/lib/apiClient';
import { AssessmentCase } from '@/types/assessmentCase';
import { DocumentCleanupStep } from './documentCleanupStep';

export class CaseResultsStep {
  static async updateWithResults(
    assessmentCase: AssessmentCase,
    analysisResult: any,
    updateCase: (caseId: string, updates: Partial<AssessmentCase>) => void,
    currentCase: AssessmentCase | null,
    setCurrentCase: (case_: AssessmentCase) => void,
    originalDocumentCount?: number
  ): Promise<AssessmentCase> {
    console.log('=== STEP 5: Updating Case with Results ===');
    
    let finalStatus: AssessmentCase['status'];
    
    switch (analysisResult.status) {
      case 'completed':
        finalStatus = 'completed';
        break;
      case 'completed_no_findings':
        finalStatus = 'completed_no_findings';
        break;
      case 'failed':
      default:
        finalStatus = 'error';
        break;
    }
    
    console.log('Setting final case status to:', finalStatus);
    console.log('About to save analysis result with markdown_report:', !!analysisResult.markdown_report);
    console.log('Markdown length being saved:', analysisResult.markdown_report?.length?.toLocaleString() || 0);
    
    // Add document count to analysis metadata for audit purposes
    if (analysisResult.analysis_metadata && originalDocumentCount) {
      analysisResult.analysis_metadata.originalDocumentCount = originalDocumentCount;
      analysisResult.analysis_metadata.documentsCleared = true;
    }
    
    console.log('Updating case in Database...');
    await apiClient.updateCaseStatus(assessmentCase.id, finalStatus, analysisResult);
    console.log('✅ Case updated in Database successfully');
    
    const updatedCase: AssessmentCase = {
      ...assessmentCase,
      analysis_result: analysisResult,
      status: finalStatus,
      last_updated: new Date().toISOString()
    };

    console.log('Created updated case with analysis_result.markdown_report:', !!updatedCase.analysis_result?.markdown_report);
    console.log('Updated case markdown length:', updatedCase.analysis_result?.markdown_report?.length?.toLocaleString() || 0);

    updateCase(assessmentCase.id, updatedCase);

    if (currentCase?.id === assessmentCase.id) {
      console.log('Force updating current case after processing');
      setCurrentCase(updatedCase);
    }

    // Cleanup documents after successful analysis (only for completed status)
    if (finalStatus === 'completed' || finalStatus === 'completed_no_findings') {
      const documentCount = originalDocumentCount || assessmentCase.documents.length;
      await DocumentCleanupStep.execute(assessmentCase, documentCount, updateCase);
      
      // Update the returned case to reflect the cleanup
      updatedCase.documents = [];
    }

    console.log('=== Assessment Processing Complete ===');
    console.log('Final case status:', finalStatus);
    console.log('Final markdown report available:', !!updatedCase.analysis_result?.markdown_report);
    console.log('Documents cleaned up:', finalStatus === 'completed' || finalStatus === 'completed_no_findings');
    
    return updatedCase;
  }
}
