import { useEffect } from "react";
import { useModule } from "@/contexts/ModuleContext";
import WelcomeDashboard from "./WelcomeDashboard";

export default function K12HomePage() {
  const { setActiveModule } = useModule();

  useEffect(() => {
    setActiveModule("k12");
  }, [setActiveModule]);

  return <WelcomeDashboard />;
}
