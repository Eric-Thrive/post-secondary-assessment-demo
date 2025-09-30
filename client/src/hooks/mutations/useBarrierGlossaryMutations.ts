
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { promptService } from '@/services/promptService';
import { useToast } from '@/hooks/use-toast';
import { useModule } from '@/contexts/ModuleContext';
import { k12BarrierGlossaryService } from '@/services/k12BarrierGlossaryService';

export const useBarrierGlossaryMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { activeModule } = useModule();

  const saveBarrierGlossaryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return promptService.saveBarrierGlossary(id, data, activeModule);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barrier-glossary'] });
      toast({
        title: "Success",
        description: "Barrier glossary saved successfully",
      });
    },
    onError: (error) => {
      console.error('Error saving barrier glossary:', error);
      toast({
        title: "Error",
        description: "Failed to save barrier glossary",
        variant: "destructive",
      });
    },
  });

  const deleteBarrierGlossaryMutation = useMutation({
    mutationFn: async (id: string) => {
      return promptService.deleteBarrierGlossary(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barrier-glossary'] });
      toast({
        title: "Success",
        description: "Barrier glossary deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Error deleting barrier glossary:', error);
      toast({
        title: "Error",
        description: "Failed to delete barrier glossary",
        variant: "destructive",
      });
    },
  });

  const saveK12BarrierGlossaryMutation = useMutation({
    mutationFn: async ({ canonical_key, data }: { canonical_key: string; data: any }) => {
      return k12BarrierGlossaryService.update(canonical_key, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barrier-glossary'] });
      toast({
        title: "Success",
        description: "K-12 barrier glossary saved successfully",
      });
    },
    onError: (error) => {
      console.error('Error saving K-12 barrier glossary:', error);
      toast({
        title: "Error",
        description: "Failed to save K-12 barrier glossary",
        variant: "destructive",
      });
    },
  });

  const deleteK12BarrierGlossaryMutation = useMutation({
    mutationFn: async (canonical_key: string) => {
      return k12BarrierGlossaryService.delete(canonical_key);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barrier-glossary'] });
      toast({
        title: "Success",
        description: "K-12 barrier glossary deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Error deleting K-12 barrier glossary:', error);
      toast({
        title: "Error",
        description: "Failed to delete K-12 barrier glossary",
        variant: "destructive",
      });
    },
  });

  const handleSaveBarrierGlossary = async (id: string, data: any): Promise<void> => {
    await saveBarrierGlossaryMutation.mutateAsync({ id, data });
  };

  const handleDeleteBarrierGlossary = async (id: string): Promise<void> => {
    await deleteBarrierGlossaryMutation.mutateAsync(id);
  };

  const handleSaveK12BarrierGlossary = async (canonical_key: string, data: any): Promise<void> => {
    await saveK12BarrierGlossaryMutation.mutateAsync({ canonical_key, data });
  };

  const handleDeleteK12BarrierGlossary = async (canonical_key: string): Promise<void> => {
    await deleteK12BarrierGlossaryMutation.mutateAsync(canonical_key);
  };

  return {
    saveBarrierGlossaryMutation,
    deleteBarrierGlossaryMutation,
    saveK12BarrierGlossaryMutation,
    deleteK12BarrierGlossaryMutation,
    handleSaveBarrierGlossary,
    handleDeleteBarrierGlossary,
    handleSaveK12BarrierGlossary,
    handleDeleteK12BarrierGlossary,
  };
};
