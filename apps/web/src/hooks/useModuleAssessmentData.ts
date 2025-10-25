
import { useAssessmentData } from './useAssessmentData';
import { useK12AssessmentData } from './useK12AssessmentData';
import { usePostSecondaryAssessmentData } from './usePostSecondaryAssessmentData';
import { useTutoringAssessmentData } from './useTutoringAssessmentData';

export const useModuleAssessmentData = (moduleType: 'k12' | 'post_secondary' | 'general' | 'tutoring') => {
  const k12Data = useK12AssessmentData();
  const postSecondaryData = usePostSecondaryAssessmentData();
  const tutoringData = useTutoringAssessmentData();
  const generalData = useAssessmentData();

  console.log(`=== useModuleAssessmentData for ${moduleType} ===`);

  switch (moduleType) {
    case 'k12':
      console.log('Using K-12 assessment data hook');
      return k12Data;
    case 'post_secondary':
      console.log('Using Post-Secondary assessment data hook');
      return postSecondaryData;
    case 'tutoring':
      console.log('Using Tutoring assessment data hook');
      return tutoringData;
    case 'general':
    default:
      console.log('Using general assessment data hook');
      return generalData;
  }
};
