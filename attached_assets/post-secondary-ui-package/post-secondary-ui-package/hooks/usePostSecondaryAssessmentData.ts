import { usePostSecondaryAssessmentCases } from './usePostSecondaryAssessmentCases';
import { useCurrentCase } from './useCurrentCase';
import { usePostSecondaryAssessmentCreation } from './usePostSecondaryAssessmentCreation';
import { useAssessmentProcessing } from './useAssessmentProcessing';

export const usePostSecondaryAssessmentData = () => {
  const { 
    assessmentCases, 
    isLoading, 
    loadCases, 
    addCase, 
    updateCase 
  } = usePostSecondaryAssessmentCases();

  const { 
    currentCase, 
    selectCase, 
    setCurrentCase 
  } = useCurrentCase(assessmentCases);

  const { createAssessment } = usePostSecondaryAssessmentCreation(addCase, setCurrentCase);

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