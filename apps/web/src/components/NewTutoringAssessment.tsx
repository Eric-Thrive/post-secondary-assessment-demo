import React from "react";
import { UnifiedAssessmentForm } from "./UnifiedAssessmentForm";
import { useNavigate } from "react-router-dom";

const NewTutoringAssessment = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/tutoring");
  };

  // Default to simple pathway for all modules
  return (
    <UnifiedAssessmentForm
      moduleType="tutoring"
      pathway="simple"
      onBack={handleBack}
    />
  );
};

export default NewTutoringAssessment;
