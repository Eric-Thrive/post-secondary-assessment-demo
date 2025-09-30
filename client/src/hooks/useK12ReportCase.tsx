
import { useState, useEffect } from 'react';
import { AssessmentCase } from '@/types/assessmentCase';

export const useK12ReportCase = (k12AssessmentCases: AssessmentCase[]) => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [currentCase, setCurrentCase] = useState<AssessmentCase | null>(null);

  // Filter for K-12 cases that have been processed (completed, completed_no_findings, or error)
  // Note: k12AssessmentCases already contains only K-12 cases, so no module_type filtering needed
  const displayableCases = k12AssessmentCases.filter(case_ => 
    ['completed', 'completed_no_findings', 'error'].includes(case_.status)
  );

  console.log('=== useK12ReportCase Debug ===');
  console.log('Total K-12 cases received:', k12AssessmentCases.length);
  console.log('K-12 displayable cases (after status filter):', displayableCases.length);
  console.log('Selected case ID:', selectedCaseId);
  console.log('Current case exists:', !!currentCase);

  // Auto-select first K-12 case if none selected
  useEffect(() => {
    console.log('=== K-12 Auto-Selection Logic ===');
    console.log('K-12 displayable cases count:', displayableCases.length);
    console.log('Current selectedCaseId:', selectedCaseId);
    
    if (displayableCases.length > 0 && !selectedCaseId) {
      const firstCase = displayableCases[0];
      console.log('Auto-selecting first K-12 case:', firstCase.id, 'Status:', firstCase.status);
      console.log('First case has analysis_result:', !!firstCase.analysis_result);
      if (firstCase.analysis_result) {
        console.log('First case markdown length:', (firstCase.analysis_result as any)?.markdown_report?.length || 0);
      }
      setSelectedCaseId(firstCase.id);
    }
  }, [displayableCases, selectedCaseId]);

  // Update current case when selection changes
  useEffect(() => {
    console.log('=== K-12 Case Selection Update ===');
    console.log('Updating for selectedCaseId:', selectedCaseId);
    
    if (selectedCaseId) {
      const selected = displayableCases.find(case_ => case_.id === selectedCaseId);
      console.log('Found selected K-12 case:', !!selected);
      if (selected) {
        console.log('Selected K-12 case details:', {
          id: selected.id,
          status: selected.status,
          module_type: selected.module_type,
          hasAnalysisResult: !!selected.analysis_result,
          markdownLength: (selected.analysis_result as any)?.markdown_report?.length || 0
        });
      }
      setCurrentCase(selected || null);
    } else {
      console.log('No K-12 case ID selected, setting currentCase to null');
      setCurrentCase(null);
    }
  }, [selectedCaseId, displayableCases]);

  const handleSelectCase = (caseId: string) => {
    console.log('=== Manual K-12 Case Selection ===');
    console.log('User selected K-12 case ID:', caseId);
    setSelectedCaseId(caseId);
  };

  return {
    currentCase,
    selectedCaseId,
    displayableCases,
    handleSelectCase
  };
};
