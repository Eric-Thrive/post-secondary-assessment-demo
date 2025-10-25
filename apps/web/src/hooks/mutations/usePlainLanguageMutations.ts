
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { promptService } from '@/services/promptService';
import { useToast } from '@/hooks/use-toast';
import { useModule } from '@/contexts/ModuleContext';

export const usePlainLanguageMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { activeModule } = useModule();

  const savePlainLanguageMappingMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return promptService.savePlainLanguageMapping(id, data, activeModule);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plain-language-mappings'] });
      toast({
        title: "Success",
        description: "Plain language mapping saved successfully",
      });
    },
    onError: (error) => {
      console.error('Error saving plain language mapping:', error);
      toast({
        title: "Error",
        description: "Failed to save plain language mapping",
        variant: "destructive",
      });
    },
  });

  const deletePlainLanguageMappingMutation = useMutation({
    mutationFn: async (id: string) => {
      return promptService.deletePlainLanguageMapping(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plain-language-mappings'] });
      toast({
        title: "Success",
        description: "Plain language mapping deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Error deleting plain language mapping:', error);
      toast({
        title: "Error",
        description: "Failed to delete plain language mapping",
        variant: "destructive",
      });
    },
  });

  const handleSavePlainLanguageMapping = async (id: string, data: any): Promise<void> => {
    await savePlainLanguageMappingMutation.mutateAsync({ id, data });
  };

  const handleDeletePlainLanguageMapping = async (id: string): Promise<void> => {
    await deletePlainLanguageMappingMutation.mutateAsync(id);
  };

  return {
    savePlainLanguageMappingMutation,
    deletePlainLanguageMappingMutation,
    handleSavePlainLanguageMapping,
    handleDeletePlainLanguageMapping,
  };
};
