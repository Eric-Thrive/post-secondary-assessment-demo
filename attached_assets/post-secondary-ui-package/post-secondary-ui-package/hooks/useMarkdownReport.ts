import { AssessmentCase } from '@/types/assessmentCase';

export const useMarkdownReport = (currentCase: AssessmentCase | null) => {
  console.log('=== useMarkdownReport Hook Debug ===');
  console.log('Received currentCase:', currentCase?.id || 'null');
  console.log('Current case status:', currentCase?.status || 'null');
  console.log('Current case analysis_result exists:', !!currentCase?.analysis_result);
  
  // Enhanced markdown report detection with comprehensive logging
  const getMarkdownReport = (case_: AssessmentCase | null): string | null => {
    console.log('=== Getting Markdown Report (Enhanced) ===');
    console.log('Case ID:', case_?.id);
    console.log('Case status:', case_?.status);
    console.log('Has analysis_result:', !!case_?.analysis_result);
    console.log('Has report_data:', !!(case_ as any)?.report_data);
    
    // Check both analysis_result and report_data fields
    const analysisResult = case_?.analysis_result || (case_ as any)?.report_data;
    
    if (!analysisResult) {
      console.log('No analysis_result or report_data found');
      return null;
    }
    console.log('Analysis result type:', typeof analysisResult);
    console.log('Analysis result keys:', Object.keys(analysisResult));
    
    // Primary: Check for markdown_report in analysis result
    if (analysisResult.markdown_report) {
      const reportLength = analysisResult.markdown_report.length;
      console.log('Found markdown_report in analysis_result, length:', reportLength.toLocaleString());
      console.log('Report preview (first 100 chars):', analysisResult.markdown_report.substring(0, 100));
      
      // Additional validation for long reports
      if (reportLength > 50000) {
        console.log('LARGE REPORT DETECTED - Length:', reportLength.toLocaleString(), 'characters');
      }
      
      // Check if this might be a truncated report
      if (reportLength < 1000) {
        console.warn('SHORT REPORT DETECTED - This might be truncated. Length:', reportLength);
      }
      
      return analysisResult.markdown_report;
    }
    
    // Fallback: Check if we have item master data that could be used to reconstruct markdown
    if (analysisResult.item_master_data && Array.isArray(analysisResult.item_master_data)) {
      console.log('Found item_master_data array with', analysisResult.item_master_data.length, 'items');
      console.log('Item master data could be used to reconstruct markdown if needed');
      
      // For now, we'll still return null and rely on the stored markdown_report
      // In the future, we could implement client-side markdown reconstruction here
      console.log('Item master data available but no markdown_report - this case may need report regeneration');
    }
    
    console.log('No markdown_report field found in analysis_result');
    return null;
  };

  const markdownReport = getMarkdownReport(currentCase);
  const hasAnalysisResult = !!markdownReport;

  // Enhanced logging with item master data awareness
  if (currentCase?.analysis_result) {
    const analysisResult = currentCase.analysis_result as any;
    const hasItemMasterData = analysisResult.item_master_data && Array.isArray(analysisResult.item_master_data);
    const itemMasterCount = hasItemMasterData ? analysisResult.item_master_data.length : 0;
    
    console.log('=== Markdown Report Hook State (Enhanced) ===');
    console.log('Current case ID:', currentCase?.id);
    console.log('Current case status:', currentCase?.status);
    console.log('Current case module:', currentCase?.module_type);
    console.log('Markdown report exists:', hasAnalysisResult);
    console.log('Markdown report length:', markdownReport?.length?.toLocaleString() || 0);
    console.log('Has item master data:', hasItemMasterData);
    console.log('Item master count:', itemMasterCount);
    
    if (analysisResult.item_master_metadata) {
      console.log('Item master metadata:', {
        captureTimestamp: analysisResult.item_master_metadata.captureTimestamp,
        totalItems: analysisResult.item_master_metadata.totalItems,
        populateItemMasterCalls: analysisResult.item_master_metadata.populateItemMasterCalls,
        functionalCompleteness: analysisResult.item_master_metadata.functionalCompleteness
      });
    }
  }

  return {
    markdownReport,
    hasAnalysisResult
  };
};