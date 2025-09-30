import { useAssessmentData } from './useAssessmentData';
import { useK12AssessmentData } from './useK12AssessmentData';
import { usePostSecondaryAssessmentData } from './usePostSecondaryAssessmentData';

export const useModuleAssessmentData = (moduleType: 'k12' | 'post_secondary' | 'general') => {
  const k12Data = useK12AssessmentData();
  const postSecondaryData = usePostSecondaryAssessmentData();
  const generalData = useAssessmentData();

  console.log(`=== useModuleAssessmentData for ${moduleType} ===`);

  switch (moduleType) {
    case 'k12':
      console.log('Using K-12 assessment data hook');
      return k12Data;
    case 'post_secondary':
      console.log('Using Post-Secondary assessment data hook');
      return postSecondaryData;
    case 'general':
    default:
      console.log('Using general assessment data hook');
      return generalData;
  }
};