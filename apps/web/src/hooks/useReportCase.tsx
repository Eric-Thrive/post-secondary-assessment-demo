
import { useState, useEffect } from 'react';
import { AssessmentCase } from '@/types/assessmentCase';

export const useReportCase = (assessmentCases: AssessmentCase[]) => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [currentCase, setCurrentCase] = useState<AssessmentCase | null>(null);

  // Get cases that have been processed (completed, completed_no_findings, or error)
  const displayableCases = assessmentCases.filter(case_ => 
    ['completed', 'completed_no_findings', 'error'].includes(case_.status)
  );

  console.log('=== useReportCase Debug ===');
  console.log('Total assessment cases:', assessmentCases.length);
  console.log('Displayable cases:', displayableCases.length);
  console.log('Selected case ID:', selectedCaseId);
  console.log('Current case exists:', !!currentCase);

  // Auto-select newest case if none selected
  useEffect(() => {
    console.log('=== Auto-Selection Logic ===');
    console.log('Displayable cases count:', displayableCases.length);
    console.log('Current selectedCaseId:', selectedCaseId);
    
    if (displayableCases.length > 0 && !selectedCaseId) {
      // Sort by created_date to ensure newest case is selected
      const sortedCases = [...displayableCases].sort((a, b) => {
        const dateA = new Date(a.created_date || a.last_updated).getTime();
        const dateB = new Date(b.created_date || b.last_updated).getTime();
        return dateB - dateA; // Newest first
      });
      
      const newestCase = sortedCases[0];
      console.log('Auto-selecting newest case:', newestCase.id, 'Status:', newestCase.status);
      console.log('Newest case created:', newestCase.created_date);
      console.log('Newest case has analysis_result:', !!newestCase.analysis_result);
      if (newestCase.analysis_result) {
        console.log('Newest case markdown length:', (newestCase.analysis_result as any)?.markdown_report?.length || 0);
      }
      setSelectedCaseId(newestCase.id);
    }
  }, [displayableCases, selectedCaseId]);

  // Update current case when selection changes
  useEffect(() => {
    console.log('=== Case Selection Update ===');
    console.log('Updating for selectedCaseId:', selectedCaseId);
    
    if (selectedCaseId) {
      const selected = displayableCases.find(case_ => case_.id === selectedCaseId);
      console.log('Found selected case:', !!selected);
      if (selected) {
        console.log('Selected case details:', {
          id: selected.id,
          status: selected.status,
          hasAnalysisResult: !!selected.analysis_result,
          markdownLength: (selected.analysis_result as any)?.markdown_report?.length || 0
        });
      }
      setCurrentCase(selected || null);
    } else {
      console.log('No case ID selected, setting currentCase to null');
      setCurrentCase(null);
    }
  }, [selectedCaseId, displayableCases]);

  const handleSelectCase = (caseId: string) => {
    console.log('=== Manual Case Selection ===');
    console.log('User selected case ID:', caseId);
    setSelectedCaseId(caseId);
  };

  return {
    currentCase,
    selectedCaseId,
    displayableCases,
    handleSelectCase
  };
};
