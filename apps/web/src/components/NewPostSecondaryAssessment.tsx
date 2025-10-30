import React from "react";
import { UnifiedAssessmentForm } from "./UnifiedAssessmentForm";
import { useNavigate } from "react-router-dom";

const NewPostSecondaryAssessment = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/post-secondary");
  };

  // Default to simple pathway for all modules
  return (
    <UnifiedAssessmentForm
      moduleType="post_secondary"
      pathway="simple"
      onBack={handleBack}
    />
  );
};

export default NewPostSecondaryAssessment;
