import { useCallback } from 'react';
import { useTutoringAssessmentCases } from './useTutoringAssessmentCases';
import { useCurrentCase } from './useCurrentCase';
import { usePostSecondaryAssessmentCreation } from './usePostSecondaryAssessmentCreation';
import { useAssessmentProcessing } from './useAssessmentProcessing';
import { DocumentFile } from '@/types/assessment';
import { AssessmentCase } from '@/types/assessmentCase';

export const useTutoringAssessmentData = () => {
  const { 
    assessmentCases, 
    isLoading, 
    loadCases, 
    addCase, 
    updateCase 
  } = useTutoringAssessmentCases();

  const { 
    currentCase, 
    selectCase, 
    setCurrentCase 
  } = useCurrentCase(assessmentCases);

  // Use Post-Secondary creation for compatibility but with tutoring module type
  const { createAssessment: baseCreateAssessment } = usePostSecondaryAssessmentCreation(addCase, setCurrentCase, 'tutoring');
  
  // Wrapper to pass student name to createAssessment
  const createAssessment = useCallback(async (documents: DocumentFile[], studentName?: string): Promise<AssessmentCase> => {
    return baseCreateAssessment(documents, studentName);
  }, [baseCreateAssessment]);

  const { 
    isProcessing, 
    processAssessment 
  } = useAssessmentProcessing(updateCase, currentCase, setCurrentCase);

  return {
    assessmentCases,
    currentCase,
    isProcessing,
    isLoading,
    createAssessment,
    processAssessment,
    selectCase,
    refreshCases: loadCases
  };
};