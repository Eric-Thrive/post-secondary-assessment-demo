
// Simplified service for markdown-only reports
// All complex JSON mapping logic has been removed since we now use markdown reports directly

export const reportDataMapper = {
  // This service is maintained for backward compatibility only
  // All report functionality now uses markdown reports directly from the AI analysis
  
  getMarkdownReport: (analysisResult: any): string | null => {
    return analysisResult?.markdown_report || null;
  }
};
