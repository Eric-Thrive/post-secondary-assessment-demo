
export interface AIAnalysisRequest {
  caseId?: string;
  documentContents?: {
    filename: string;
    type: string;
    content: string;
  }[];
  documents?: {
    filename: string;
    content: string;
  }[];
  moduleType?: string;
  pathway?: string;
  uniqueId?: string;
  programMajor?: string;
  reportAuthor?: string;
  dateIssued?: string;
  studentGrade?: string;
}

export interface AIAnalysisResult {
  analysis_date: string;
  status: 'completed' | 'completed_no_findings' | 'failed';
  error_message?: string;
  markdown_report: string;
}
