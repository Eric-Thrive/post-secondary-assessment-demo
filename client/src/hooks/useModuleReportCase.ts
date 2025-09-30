
import { useReportCase } from './useReportCase';
import { useK12ReportCase } from './useK12ReportCase';
import { usePostSecondaryReportCase } from './usePostSecondaryReportCase';
import { AssessmentCase } from '@/types/assessmentCase';

export const useModuleReportCase = (assessmentCases: AssessmentCase[], moduleType: 'k12' | 'post_secondary' | 'general' | 'tutoring') => {
  console.log(`=== useModuleReportCase for ${moduleType} ===`);

  // Always call all hooks to maintain hook order (React Rules of Hooks)
  const k12CaseData = useK12ReportCase(assessmentCases);
  const postSecondaryCaseData = usePostSecondaryReportCase(assessmentCases);
  const generalCaseData = useReportCase(assessmentCases);
  
  // For tutoring, create filtered cases and call hook specifically for them
  const tutoringCases = assessmentCases.filter(case_ => case_.module_type === 'tutoring');
  console.log('Filtered tutoring cases:', tutoringCases.length, 'out of', assessmentCases.length, 'total');
  const tutoringCaseData = useReportCase(tutoringCases);

  switch (moduleType) {
    case 'k12':
      console.log('Using K-12 report case hook');
      return k12CaseData;
    case 'post_secondary':
      console.log('Using Post-Secondary report case hook');
      return postSecondaryCaseData;
    case 'tutoring':
      console.log('Using tutoring-specific filtering');
      return tutoringCaseData;
    case 'general':
    default:
      console.log('Using general report case hook');
      return generalCaseData;
  }
};
