import { useEffect } from "react";
import { useModule } from "@/contexts/ModuleContext";
import WelcomeDashboard from "./WelcomeDashboard";

export default function TutoringHomePage() {
  const { setActiveModule } = useModule();

  useEffect(() => {
    setActiveModule("tutoring");
  }, [setActiveModule]);

  return <WelcomeDashboard />;
}
