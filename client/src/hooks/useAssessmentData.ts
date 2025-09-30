
import { useAssessmentCases } from './useAssessmentCases';
import { useCurrentCase } from './useCurrentCase';
import { usePostSecondaryAssessmentCreation } from './usePostSecondaryAssessmentCreation';
import { useAssessmentProcessing } from './useAssessmentProcessing';

export const useAssessmentData = () => {
  const { 
    assessmentCases, 
    isLoading, 
    loadCases, 
    addCase, 
    updateCase 
  } = useAssessmentCases();

  const { 
    currentCase, 
    selectCase, 
    setCurrentCase 
  } = useCurrentCase(assessmentCases);

  // Use Post-Secondary creation for legacy compatibility
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
