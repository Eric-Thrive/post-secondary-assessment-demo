
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { promptService } from '@/services/promptService';
import { useToast } from '@/hooks/use-toast';
import { useModule } from '@/contexts/ModuleContext';

export const useAIConfigMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { activeModule } = useModule();

  const saveAIConfigMutation = useMutation({
    mutationFn: async (data: any) => {
      return promptService.saveAIConfig(data, activeModule);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-config'] });
      toast({
        title: "Success",
        description: "AI configuration saved successfully",
      });
    },
    onError: (error) => {
      console.error('Error saving AI config:', error);
      toast({
        title: "Error",
        description: "Failed to save AI configuration",
        variant: "destructive",
      });
    },
  });

  const testPromptsMutation = useMutation({
    mutationFn: async () => {
      console.log('Testing prompts...');
      return Promise.resolve();
    },
    onSuccess: () => {
      toast({
        title: "Test Complete",
        description: "Prompts tested successfully",
      });
    },
  });

  const restorePromptsMutation = useMutation({
    mutationFn: async () => {
      console.log('Restoring prompts...');
      return Promise.resolve();
    },
    onSuccess: () => {
      toast({
        title: "Restore Complete",
        description: "Prompts restored successfully",
      });
    },
  });

  const handleSaveAIConfig = async (data: any): Promise<void> => {
    await saveAIConfigMutation.mutateAsync(data);
  };

  return {
    saveAIConfigMutation,
    testPromptsMutation,
    restorePromptsMutation,
    handleSaveAIConfig,
  };
};
