import React, { useState } from 'react';
import { PathwaySelector } from './PathwaySelector';
import { UnifiedAssessmentForm } from './UnifiedAssessmentForm';

type SelectedPathway = 'simple' | 'complex' | null;

const NewPostSecondaryAssessment = () => {
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
        moduleType="post_secondary" 
        pathway={selectedPathway} 
        onBack={handleBack}
      />
    );
  }

  return (
    <PathwaySelector 
      moduleType="post_secondary"
      onSelectPathway={handlePathwaySelect} 
    />
  );
};

export default NewPostSecondaryAssessment;