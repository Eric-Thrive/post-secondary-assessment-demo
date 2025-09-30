
import { AssessmentCase } from '@/types/assessmentCase';

export const selectBestCase = (
  assessmentCases: AssessmentCase[],
  currentCase: AssessmentCase | null
): AssessmentCase | null => {
  console.log('Assessment cases changed. Current case:', currentCase?.id || 'none');
  console.log('Available cases:', assessmentCases.map(c => `${c.id} (${c.status})`));
  
  if (!currentCase && assessmentCases.length > 0) {
    // First try to find completed cases
    const completedCases = assessmentCases.filter(c => c.status === 'completed');
    console.log('Completed cases available:', completedCases.length);
    
    if (completedCases.length > 0) {
      const mostRecentCompleted = completedCases.sort((a, b) => 
        new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime()
      )[0];
      console.log('Auto-selecting most recent completed case:', mostRecentCompleted.id);
      return mostRecentCompleted;
    } else {
      // Fallback: select any case with analysis results (even if status isn't 'completed')
      const casesWithResults = assessmentCases.filter(c => c.analysis_result);
      console.log('Cases with analysis results:', casesWithResults.length);
      
      if (casesWithResults.length > 0) {
        const mostRecentWithResults = casesWithResults.sort((a, b) => 
          new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime()
        )[0];
        console.log('Auto-selecting most recent case with results:', mostRecentWithResults.id);
        return mostRecentWithResults;
      }
    }
  }
  return currentCase;
};
