
import { AssessmentCase } from '@/types/assessmentCase';

export class DataTransformers {
  databaseRowToAssessmentCase(row: any): AssessmentCase {
    return {
      id: row.id,
      case_id: row.case_id || row.id, // Include case_id field
      display_name: row.display_name,
      documents: row.documents || row.document_names || [],
      analysis_result: row.analysis_result || row.report_data || null,
      created_date: row.created_date,
      last_updated: row.last_updated,
      status: row.status as AssessmentCase['status'],
      module_type: row.module_type || 'post_secondary' // Ensure we always have a module_type
    };
  }

  assessmentCaseToDatabaseData(assessmentCase: AssessmentCase) {
    return {
      id: assessmentCase.id,
      display_name: assessmentCase.display_name,
      documents: assessmentCase.documents as any,
      analysis_result: assessmentCase.analysis_result as any,
      created_date: assessmentCase.created_date,
      last_updated: assessmentCase.last_updated,
      status: assessmentCase.status,
      module_type: assessmentCase.module_type
    };
  }

}

export const dataTransformers = new DataTransformers();
