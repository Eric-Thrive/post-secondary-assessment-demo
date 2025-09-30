
import { useState, useEffect, useCallback } from 'react';
import { AssessmentCase } from '@/types/assessmentCase';

export const useCurrentCase = (assessmentCases: AssessmentCase[]) => {
  const [currentCase, setCurrentCase] = useState<AssessmentCase | null>(null);

  console.log('=== useCurrentCase Hook State ===');
  console.log('Current case:', currentCase?.id || 'none');
  console.log('Current case status:', currentCase?.status || 'none');

  // Improved auto-selection logic
  useEffect(() => {
    console.log('=== Auto-Selection Logic Triggered ===');
    console.log('Cases available:', assessmentCases.length);
    console.log('Current case exists:', !!currentCase);
    
    if (assessmentCases.length === 0) {
      console.log('No cases available, clearing current case');
      setCurrentCase(null);
      return;
    }

    // Always check for the best case (newest first) regardless of current selection
    const completedCases = assessmentCases.filter(c => c.status === 'completed');
    const casesWithResults = assessmentCases.filter(c => c.analysis_result);
    
    console.log('All cases IDs:', assessmentCases.map(c => ({ id: c.id, created: c.created_date, display: c.display_name })));
    
    console.log('Completed cases:', completedCases.length);
    console.log('Cases with results:', casesWithResults.length);
    
    let bestCase: AssessmentCase | null = null;
    
    if (completedCases.length > 0) {
      // Sort by created_date instead of last_updated to match database ordering
      bestCase = completedCases.sort((a, b) => {
        const dateA = new Date(a.created_date || a.last_updated).getTime();
        const dateB = new Date(b.created_date || b.last_updated).getTime();
        return dateB - dateA;
      })[0];
      console.log('Found most recent completed case by created_date:', bestCase.id);
      console.log('Case created_date:', bestCase.created_date);
      console.log('Case last_updated:', bestCase.last_updated);
    } else if (casesWithResults.length > 0) {
      // Sort by created_date instead of last_updated to match database ordering
      bestCase = casesWithResults.sort((a, b) => {
        const dateA = new Date(a.created_date || a.last_updated).getTime();
        const dateB = new Date(b.created_date || b.last_updated).getTime();
        return dateB - dateA;
      })[0];
      console.log('Found most recent case with results by created_date:', bestCase.id);
      console.log('Case created_date:', bestCase.created_date);
      console.log('Case last_updated:', bestCase.last_updated);
    }
    
    // If no current case or if we found a newer case, select the best one
    if (!currentCase) {
      if (bestCase) {
        console.log('No current case - setting to newest:', bestCase.id, 'Status:', bestCase.status);
        setCurrentCase(bestCase);
      }
    } else if (bestCase && bestCase.id !== currentCase.id) {
      console.log('Found newer case! Switching from', currentCase.id, 'to', bestCase.id);
      console.log('New case created:', bestCase.created_date, 'Old case created:', currentCase.created_date);
      setCurrentCase(bestCase);
    } else if (currentCase) {
      // If we have a current case and it's still the newest, ensure it's up to date
      const updatedCase = assessmentCases.find(c => c.id === currentCase.id);
      if (updatedCase && (updatedCase.status !== currentCase.status || updatedCase.last_updated !== currentCase.last_updated)) {
        console.log('Updating current case with latest data:', updatedCase.id, 'Status:', updatedCase.status);
        setCurrentCase(updatedCase);
      }
    }
  }, [assessmentCases, currentCase]);

  const selectCase = useCallback((caseId: string) => {
    console.log('=== Manually Selecting Case ===');
    console.log('Requested case ID:', caseId);
    
    const selectedCase = assessmentCases.find(c => c.id === caseId);
    if (selectedCase) {
      console.log('Found case:', selectedCase.id, 'Status:', selectedCase.status);
      console.log('Display name:', selectedCase.display_name);
      console.log('Has analysis result:', !!selectedCase.analysis_result);
      console.log('Analysis status:', selectedCase.analysis_result?.status || 'none');
      setCurrentCase(selectedCase);
    } else {
      console.warn('Case not found:', caseId);
      setCurrentCase(null);
    }
  }, [assessmentCases]);

  return {
    currentCase,
    selectCase,
    setCurrentCase
  };
};
