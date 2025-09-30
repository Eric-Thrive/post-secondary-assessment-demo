
import React, { useEffect } from 'react';
import { AppNavigation } from "@/components/shared/AppNavigation";
import { SplashScreen } from "@/components/shared/SplashScreen";
import { PromptUpdateService } from "@/services/prompt/promptUpdateService";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { toast } = useToast();

  // Disabled auto-sync to prevent server crashes and user-facing errors
  // The tutoring analysis works perfectly without this prompt synchronization
  // useEffect(() => {
  //   const runComprehensiveUpdate = async () => {
  //     try {
  //       console.log('🚀 Starting comprehensive prompt synchronization...');
  //       
  //       // Update all module prompts to v2.0 rich content approach
  //       await PromptUpdateService.updateAllModulePrompts();
  //       
  //       // Verify consistency
  //       const consistency = await PromptUpdateService.verifyPromptConsistency();
  //       
  //       if (consistency.consistent) {
  //         toast({
  //           title: "All Prompts Synchronized",
  //           description: "Successfully updated all K-12 and Post-Secondary prompts to v2.0 rich content approach",
  //         });
  //         console.log('✅ All prompts synchronized successfully');
  //       } else {
  //         toast({
  //           title: "Synchronization Issues Detected",
  //           description: `Some prompts may need attention: ${consistency.issues.join(', ')}`,
  //           variant: "destructive",
  //         });
  //         console.log('⚠️ Synchronization issues:', consistency.issues);
  //       }
  //     } catch (error) {
  //       console.error('❌ Comprehensive update failed:', error);
  //       toast({
  //         title: "Update Failed",
  //         description: "Failed to update prompts. Check console for details.",
  //         variant: "destructive",
  //       });
  //     }
  //   };
  //
  //   runComprehensiveUpdate();
  // }, [toast]);

  return (
    <div className="min-h-screen">
      <AppNavigation />
      
      <main className="bg-gradient-to-br from-blue-600 to-blue-800 min-h-[calc(100vh-4rem)] px-4 sm:px-6 lg:px-8 py-8">
        <SplashScreen />
      </main>
    </div>
  );
};

export default Index;
