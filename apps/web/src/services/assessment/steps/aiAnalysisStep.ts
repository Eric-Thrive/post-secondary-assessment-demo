
import { openaiService } from '@/services/openaiService';
import { AIAnalysisRequest } from '@/types/aiAnalysis';

export class AIAnalysisStep {
  static async execute(
    processedDocs: any[], 
    moduleType: string = 'post_secondary',
    studentGrade?: string,
    studentName?: string
  ): Promise<any> {
    console.log('=== STEP 3: Running AI Analysis ===');
    console.log('Building AI analysis request with module type:', moduleType);
    
    const analysisRequest: AIAnalysisRequest = {
      documentContents: processedDocs,
      moduleType: moduleType,
      ...(studentGrade && { studentGrade }),
      ...(studentName && { studentName })
    };

    console.log('Analysis request structure:', {
      documentCount: analysisRequest.documentContents?.length || 0,
      hasStudentGrade: !!analysisRequest.studentGrade,
      moduleType: analysisRequest.moduleType
    });

    try {
      const result = await openaiService.analyzeDocuments(analysisRequest);
      
      console.log('AI analysis completed:', {
        status: result.status,
        hasMarkdownReport: !!result.markdown_report,
        reportLength: result.markdown_report?.length || 0,
        hasError: !!result.error_message
      });

      return result;
    } catch (error) {
      console.error('AI analysis failed:', {
        errorType: (error as Error).constructor.name,
        errorMessage: (error as Error).message,
        errorStack: (error as Error).stack?.substring(0, 500)
      });
      throw error;
    }
  }
}
