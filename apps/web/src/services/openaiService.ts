
import { AIAnalysisRequest, AIAnalysisResult } from '@/types/aiAnalysis';
import { AIResponseValidator } from './aiResponseValidator';
import { AIApiClient } from './aiApiClient';

class OpenAIService {
  async analyzeDocuments(request: AIAnalysisRequest): Promise<AIAnalysisResult> {
    try {
      // Call the API
      const result = await AIApiClient.callAnalysisAPI(request);

      // Validate and normalize the response
      const validatedResult = AIResponseValidator.validateResponse(result);
      console.log('AI analysis completed successfully:', validatedResult.status);
      
      return validatedResult;

    } catch (error) {
      console.error('AI analysis failed:', error);
      
      // Check if this is a document processing error
      const isDocumentError = error instanceof Error && (
        error.message.includes('document') || 
        error.message.includes('PDF') ||
        error.message.includes('extraction') ||
        error.message.includes('Empty response')
      );
      
      return {
        analysis_date: new Date().toISOString(),
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error occurred during analysis',
        markdown_report: ''
      };
    }
  }
}

export const openaiService = new OpenAIService();

// Re-export types for backward compatibility
export type {
  AIAnalysisRequest,
  AIAnalysisResult
} from '@/types/aiAnalysis';
