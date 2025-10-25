
import { useK12AssessmentCases } from './useK12AssessmentCases';
import { useCurrentCase } from './useCurrentCase';
import { useK12AssessmentCreation } from './useK12AssessmentCreation';
import { useAssessmentProcessing } from './useAssessmentProcessing';

export const useK12AssessmentData = () => {
  const { 
    assessmentCases, 
    isLoading, 
    loadCases, 
    addCase, 
    updateCase 
  } = useK12AssessmentCases();

  const { 
    currentCase, 
    selectCase, 
    setCurrentCase 
  } = useCurrentCase(assessmentCases);

  const { createAssessment } = useK12AssessmentCreation(addCase, setCurrentCase);

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
