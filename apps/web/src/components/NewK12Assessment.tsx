import React, { useState } from 'react';
import { PathwaySelector } from './PathwaySelector';
import { UnifiedAssessmentForm } from './UnifiedAssessmentForm';

type SelectedPathway = 'simple' | 'complex' | null;

const NewK12Assessment = () => {
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
        moduleType="k12" 
        pathway={selectedPathway} 
        onBack={handleBack}
      />
    );
  }

  return (
    <PathwaySelector 
      moduleType="k12"
      onSelectPathway={handlePathwaySelect} 
    />
  );
};

export default NewK12Assessment;