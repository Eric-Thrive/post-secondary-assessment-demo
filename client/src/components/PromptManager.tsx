
import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import PromptManagerHeader from './PromptManagerHeader';
import PromptManagerTabsEnhanced from './PromptManagerTabsEnhanced';
import PromptImportDialog from './PromptImportDialog';
import { usePromptManagerMutations } from '@/hooks/usePromptManagerMutations';
import { useQueryClient } from '@tanstack/react-query';

const PromptManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  
  const { testPromptsMutation, restorePromptsMutation } = usePromptManagerMutations();

  const syncToDatabase = async () => {
    toast({ title: "Sync Complete", description: "All configurations have been synced to the database." });
  };

  const handleImportComplete = () => {
    queryClient.invalidateQueries({ queryKey: ['prompt-sections'] });
    queryClient.invalidateQueries({ queryKey: ['lookup-tables'] });
    queryClient.invalidateQueries({ queryKey: ['ai-config'] });
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50/30">
      <div className="container mx-auto p-6 space-y-8">
        <PromptManagerHeader 
          onImportPrompts={() => setImportDialogOpen(true)}
          onRestoreOriginal={() => restorePromptsMutation.mutate()}
          onTestPrompts={() => testPromptsMutation.mutate()}
          onSyncToDatabase={syncToDatabase}
          isRestoring={restorePromptsMutation.isPending}
        />
        
        <PromptManagerTabsEnhanced />

        <PromptImportDialog 
          isOpen={importDialogOpen} 
          onClose={() => setImportDialogOpen(false)}
          onImportComplete={handleImportComplete}
        />
      </div>
    </div>
  );
};

export default PromptManager;
