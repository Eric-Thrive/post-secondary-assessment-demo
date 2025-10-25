
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { promptService } from '@/services/promptService';
import { useToast } from '@/hooks/use-toast';
import { useModule } from '@/contexts/ModuleContext';

export const usePromptSectionMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { activeModule } = useModule();

  const savePromptSectionMutation = useMutation({
    mutationFn: async ({ sectionKey, content }: { sectionKey: string; content: string }) => {
      return promptService.savePromptSection(sectionKey, content, undefined, undefined, activeModule);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompt-sections'] });
      toast({
        title: "Success",
        description: "Prompt section saved successfully",
      });
    },
    onError: (error) => {
      console.error('Error saving prompt section:', error);
      toast({
        title: "Error",
        description: "Failed to save prompt section",
        variant: "destructive",
      });
    },
  });

  const handleSavePromptSection = async (sectionKey: string, content: string): Promise<void> => {
    await savePromptSectionMutation.mutateAsync({ sectionKey, content });
  };

  return {
    savePromptSectionMutation,
    handleSavePromptSection,
  };
};
