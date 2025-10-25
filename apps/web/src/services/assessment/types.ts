
import { AssessmentCase } from '@/types/assessmentCase';

export interface AssessmentServiceInterface {
  loadCases(): Promise<AssessmentCase[]>;
  saveCase(assessmentCase: AssessmentCase): Promise<AssessmentCase>;
  updateCaseStatus(caseId: string, status: AssessmentCase['status'], analysisResult?: any): Promise<void>;
  deleteCase(caseId: string): Promise<void>;
  subscribeToChanges(callback: (cases: AssessmentCase[]) => void): any;
}
