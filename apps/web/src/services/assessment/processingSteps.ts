import { AssessmentCase } from '@/types/assessmentCase';
import { K12CleanupStep } from './steps/k12CleanupStep';
import { PostSecondaryCleanupStep } from './steps/postSecondaryCleanupStep';
import { CaseStatusStep } from './steps/caseStatusStep';
import { DocumentProcessingStep } from './steps/documentProcessingStep';
import { AIAnalysisStep } from './steps/aiAnalysisStep';
import { CaseResultsStep } from './steps/caseResultsStep';

export class ProcessingSteps {
  static async cleanupK12LookupTables(): Promise<void> {
    return K12CleanupStep.execute();
  }

  static async cleanupPostSecondaryLookupTables(): Promise<void> {
    return PostSecondaryCleanupStep.execute();
  }

  static async updateCaseToProcessing(
    assessmentCase: AssessmentCase,
    updateCase: (caseId: string, updates: Partial<AssessmentCase>) => void
  ): Promise<void> {
    return CaseStatusStep.updateToProcessing(assessmentCase, updateCase);
  }

  static async processDocuments(documentFiles: FileList): Promise<any[]> {
    return DocumentProcessingStep.execute(documentFiles);
  }

  static async runAIAnalysis(
    processedDocs: any[], 
    moduleType: string = 'post_secondary',
    studentGrade?: string,
    studentName?: string
  ): Promise<any> {
    return AIAnalysisStep.execute(processedDocs, moduleType, studentGrade, studentName);
  }

  static async cleanupDocuments(
    assessmentCase: AssessmentCase,
    originalDocumentCount: number,
    updateCase: (caseId: string, updates: Partial<AssessmentCase>) => void
  ): Promise<void> {
    // This method is now handled within CaseResultsStep.updateWithResults
    // Keeping this for backward compatibility if needed
    throw new Error('cleanupDocuments is now handled within updateCaseWithResults');
  }

  static async updateCaseWithResults(
    assessmentCase: AssessmentCase,
    analysisResult: any,
    updateCase: (caseId: string, updates: Partial<AssessmentCase>) => void,
    currentCase: AssessmentCase | null,
    setCurrentCase: (case_: AssessmentCase) => void,
    originalDocumentCount?: number
  ): Promise<AssessmentCase> {
    return CaseResultsStep.updateWithResults(
      assessmentCase,
      analysisResult,
      updateCase,
      currentCase,
      setCurrentCase,
      originalDocumentCount
    );
  }
}
