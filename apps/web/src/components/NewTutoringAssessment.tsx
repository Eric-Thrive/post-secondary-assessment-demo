import React, { useState } from 'react';
import { PathwaySelector } from './PathwaySelector';
import { UnifiedAssessmentForm } from './UnifiedAssessmentForm';

type SelectedPathway = 'simple' | 'complex' | null;

const NewTutoringAssessment = () => {
  const [selectedPathway, setSelectedPathway] = useState<SelectedPathway>(null);

  const handlePathwaySelect = (pathway: 'simple' | 'complex') => {
    setSelectedPathway(pathway);
  };

  const handleBack = () => {
    setSelectedPathway(null);
  };

  if (selectedPathway) {
    return (
      <UnifiedAssessmentForm 
        moduleType="tutoring" 
        pathway={selectedPathway} 
        onBack={handleBack}
      />
    );
  }

  return (
    <PathwaySelector 
      moduleType="tutoring"
      onSelectPathway={handlePathwaySelect} 
    />
  );
};

export default NewTutoringAssessment;
