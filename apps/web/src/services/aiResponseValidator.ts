
import { AIAnalysisResult } from '@/types/aiAnalysis';

export class AIResponseValidator {
  static validateResponse(response: any): AIAnalysisResult {
    console.log('=== Validating AI Response (v2.0 - Full Report Preservation) ===');
    console.log('Raw response structure:', typeof response, Object.keys(response || {}));
    
    // Ensure the response has the expected structure
    if (!response || typeof response !== 'object') {
      console.warn('Invalid response structure - not an object');
      throw new Error('Invalid response structure');
    }

    // Enhanced markdown content validation
    const hasMarkdownContent = response.markdown_report && 
      typeof response.markdown_report === 'string' && 
      response.markdown_report.trim().length > 0;

    const markdownLength = response.markdown_report?.length || 0;

    console.log('Content validation:', {
      hasMarkdownContent,
      markdownLength: markdownLength.toLocaleString(),
      originalStatus: response.status
    });

    // Enhanced logging for large reports
    if (markdownLength > 50000) {
      console.log('LARGE REPORT DETECTED in validation:', markdownLength.toLocaleString(), 'characters');
      console.log('First 200 chars:', response.markdown_report.substring(0, 200));
      console.log('Last 200 chars:', response.markdown_report.substring(markdownLength - 200));
    }

    // Determine status based on content and response
    let finalStatus: 'completed' | 'completed_no_findings' | 'failed' = 'completed_no_findings';
    
    // Only mark as failed if we have a clear error
    if (response.status === 'failed' && response.error_message) {
      finalStatus = 'failed';
      console.log('Marking as failed due to explicit error:', response.error_message);
    } else if (hasMarkdownContent) {
      // Enhanced content analysis for longer reports
      const hasSubstantialContent = markdownLength > 500 && (
        response.markdown_report.toLowerCase().includes('accommodation') ||
        response.markdown_report.toLowerCase().includes('barrier') ||
        response.markdown_report.toLowerCase().includes('impact') ||
        response.markdown_report.toLowerCase().includes('support') ||
        response.markdown_report.toLowerCase().includes('recommend') ||
        response.markdown_report.toLowerCase().includes('finding') ||
        response.markdown_report.toLowerCase().includes('need')
      );
      
      finalStatus = hasSubstantialContent ? 'completed' : 'completed_no_findings';
      console.log('Marking as', finalStatus, '- comprehensive analysis complete');
    } else {
      finalStatus = 'completed_no_findings';
      console.log('Marking as completed_no_findings - analysis successful but no meaningful content');
    }

    // Create validated response with FULL markdown preservation
    const validatedResponse: AIAnalysisResult = {
      analysis_date: response.analysis_date || new Date().toISOString(),
      status: finalStatus,
      error_message: response.error_message,
      markdown_report: response.markdown_report || '' // CRITICAL: Preserve full report
    };

    console.log('Final validated response:', {
      status: validatedResponse.status,
      markdownLength: validatedResponse.markdown_report.length.toLocaleString(),
      hasErrorMessage: !!validatedResponse.error_message
    });

    // Final verification that we haven't truncated
    if (validatedResponse.markdown_report.length !== markdownLength) {
      console.error('CRITICAL ERROR: Markdown report was truncated during validation!');
      console.error('Original length:', markdownLength);
      console.error('Validated length:', validatedResponse.markdown_report.length);
    }

    return validatedResponse;
  }
}
