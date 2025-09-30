
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { promptService } from '@/services/promptService';
import { useToast } from '@/hooks/use-toast';
import { useModule } from '@/contexts/ModuleContext';
import { k12InferenceTriggersService } from '@/services/k12InferenceTriggersService';

export const useInferenceTriggerMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { activeModule } = useModule();

  const saveInferenceTriggerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return promptService.saveInferenceTrigger(id, data, activeModule);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inference-triggers'] });
      toast({
        title: "Success",
        description: "Inference trigger saved successfully",
      });
    },
    onError: (error) => {
      console.error('Error saving inference trigger:', error);
      toast({
        title: "Error",
        description: "Failed to save inference trigger",
        variant: "destructive",
      });
    },
  });

  const deleteInferenceTriggerMutation = useMutation({
    mutationFn: async (id: string) => {
      return promptService.deleteInferenceTrigger(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inference-triggers'] });
      toast({
        title: "Success",
        description: "Inference trigger deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Error deleting inference trigger:', error);
      toast({
        title: "Error",
        description: "Failed to delete inference trigger",
        variant: "destructive",
      });
    },
  });

  const saveK12InferenceTriggerMutation = useMutation({
    mutationFn: async ({ canonical_key, data }: { canonical_key: string; data: any }) => {
      return k12InferenceTriggersService.update(canonical_key, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inference-triggers'] });
      toast({
        title: "Success",
        description: "K-12 inference trigger saved successfully",
      });
    },
    onError: (error) => {
      console.error('Error saving K-12 inference trigger:', error);
      toast({
        title: "Error",
        description: "Failed to save K-12 inference trigger",
        variant: "destructive",
      });
    },
  });

  const deleteK12InferenceTriggerMutation = useMutation({
    mutationFn: async (canonical_key: string) => {
      return k12InferenceTriggersService.delete(canonical_key);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inference-triggers'] });
      toast({
        title: "Success",
        description: "K-12 inference trigger deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Error deleting K-12 inference trigger:', error);
      toast({
        title: "Error",
        description: "Failed to delete K-12 inference trigger",
        variant: "destructive",
      });
    },
  });

  const handleSaveInferenceTrigger = async (id: string, data: any): Promise<void> => {
    await saveInferenceTriggerMutation.mutateAsync({ id, data });
  };

  const handleDeleteInferenceTrigger = async (id: string): Promise<void> => {
    await deleteInferenceTriggerMutation.mutateAsync(id);
  };

  const handleSaveK12InferenceTrigger = async (canonical_key: string, data: any): Promise<void> => {
    await saveK12InferenceTriggerMutation.mutateAsync({ canonical_key, data });
  };

  const handleDeleteK12InferenceTrigger = async (canonical_key: string): Promise<void> => {
    await deleteK12InferenceTriggerMutation.mutateAsync(canonical_key);
  };

  return {
    saveInferenceTriggerMutation,
    deleteInferenceTriggerMutation,
    saveK12InferenceTriggerMutation,
    deleteK12InferenceTriggerMutation,
    handleSaveInferenceTrigger,
    handleDeleteInferenceTrigger,
    handleSaveK12InferenceTrigger,
    handleDeleteK12InferenceTrigger,
  };
};
