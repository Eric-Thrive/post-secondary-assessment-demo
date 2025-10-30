import React from "react";
import { UnifiedAssessmentForm } from "./UnifiedAssessmentForm";
import { useNavigate } from "react-router-dom";

const NewK12Assessment = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/k12");
  };

  // Default to simple pathway for all modules
  return (
    <UnifiedAssessmentForm
      moduleType="k12"
      pathway="simple"
      onBack={handleBack}
    />
  );
};

export default NewK12Assessment;
