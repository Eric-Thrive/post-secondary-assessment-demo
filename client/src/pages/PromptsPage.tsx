
import React from "react";
import PromptManager from "@/components/PromptManager";
import { AppNavigation } from "@/components/shared/AppNavigation";
import { useToast } from "@/hooks/use-toast";

const PromptsPage = () => {
  const { toast } = useToast();

  React.useEffect(() => {
    // Inform users about the multi-message architecture when the page loads
    toast({
      title: "Multi-Message Architecture Enabled",
      description: "This prompt system uses 6 dedicated system messages + user content",
    });
  }, [toast]);

  return (
    <div>
      <AppNavigation />
      <div className="bg-slate-50">
        <PromptManager />
      </div>
    </div>
  );
};

export default PromptsPage;
