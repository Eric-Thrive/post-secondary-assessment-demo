
import { useState, useEffect } from 'react';
import { AssessmentCase } from '@/types/assessmentCase';

export const usePostSecondaryReportCase = (assessmentCases: AssessmentCase[]) => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [currentCase, setCurrentCase] = useState<AssessmentCase | null>(null);

  // Filter for post-secondary cases that have been successfully processed (exclude error cases)
  const displayableCases = assessmentCases.filter(case_ => 
    (!case_.module_type || case_.module_type === 'post_secondary') && 
    ['completed', 'completed_no_findings'].includes(case_.status)
  );

  console.log('=== usePostSecondaryReportCase Debug ===');
  console.log('Total assessment cases:', assessmentCases.length);
  console.log('Post-secondary cases:', assessmentCases.filter(c => !c.module_type || c.module_type === 'post_secondary').length);
  console.log('Post-secondary displayable cases:', displayableCases.length);
  console.log('Selected case ID:', selectedCaseId);
  console.log('Current case exists:', !!currentCase);

  // Auto-select first post-secondary case if none selected
  useEffect(() => {
    console.log('=== Post-Secondary Auto-Selection Logic ===');
    console.log('Post-secondary displayable cases count:', displayableCases.length);
    console.log('Current selectedCaseId:', selectedCaseId);
    
    if (displayableCases.length > 0 && !selectedCaseId) {
      const firstCase = displayableCases[0];
      console.log('Auto-selecting first post-secondary case:', firstCase.id, 'Status:', firstCase.status);
      console.log('First case has analysis_result:', !!firstCase.analysis_result);
      if (firstCase.analysis_result) {
        console.log('First case markdown length:', (firstCase.analysis_result as any)?.markdown_report?.length || 0);
      }
      setSelectedCaseId(firstCase.id);
    }
  }, [displayableCases, selectedCaseId]);

  // Update current case when selection changes
  useEffect(() => {
    console.log('=== Post-Secondary Case Selection Update ===');
    console.log('Updating for selectedCaseId:', selectedCaseId);
    
    if (selectedCaseId) {
      const selected = displayableCases.find(case_ => case_.id === selectedCaseId);
      console.log('Found selected post-secondary case:', !!selected);
      if (selected) {
        console.log('Selected post-secondary case details:', {
          id: selected.id,
          status: selected.status,
          module_type: selected.module_type || 'post_secondary',
          hasAnalysisResult: !!selected.analysis_result,
          markdownLength: (selected.analysis_result as any)?.markdown_report?.length || 0
        });
      }
      setCurrentCase(selected || null);
    } else {
      console.log('No post-secondary case ID selected, setting currentCase to null');
      setCurrentCase(null);
    }
  }, [selectedCaseId, displayableCases]);

  const handleSelectCase = (caseId: string) => {
    console.log('=== Manual Post-Secondary Case Selection ===');
    console.log('User selected post-secondary case ID:', caseId);
    setSelectedCaseId(caseId);
  };

  return {
    currentCase,
    selectedCaseId,
    displayableCases,
    handleSelectCase
  };
};
