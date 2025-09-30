
import { AIAnalysisResult } from '@/types/aiAnalysis';
import { DocumentFile } from '@/types/assessment';

export interface AssessmentCase {
  id: string;
  case_id: string;
  display_name: string;
  documents: DocumentFile[];
  analysis_result?: AIAnalysisResult;
  created_date: string;
  last_updated: string;
  status: 'draft' | 'processing' | 'completed' | 'completed_no_findings' | 'document_processing_error' | 'error';
  module_type: string; // Make required instead of optional
  // Sharing fields
  share_token?: string | null;
  is_shared?: boolean;
  shared_at?: string | null;
}
