
import { Navigate } from "react-router-dom";
import { useModule } from "@/contexts/ModuleContext";

const NewAssessmentPage = () => {
  const { activeModule } = useModule();

  const targetRoute =
    activeModule === "k12"
      ? "/new-k12-assessment"
      : activeModule === "tutoring"
      ? "/new-tutoring-assessment"
      : "/new-post-secondary-assessment";

  return <Navigate to={targetRoute} replace />;
};

export default NewAssessmentPage;
