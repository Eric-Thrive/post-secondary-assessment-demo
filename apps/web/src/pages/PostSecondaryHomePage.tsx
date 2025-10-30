import { useEffect } from "react";
import { useModule } from "@/contexts/ModuleContext";
import WelcomeDashboard from "./WelcomeDashboard";

export default function PostSecondaryHomePage() {
  const { setActiveModule } = useModule();

  useEffect(() => {
    setActiveModule("post_secondary");
  }, [setActiveModule]);

  return <WelcomeDashboard />;
}
