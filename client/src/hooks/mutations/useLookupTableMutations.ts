
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { promptService } from '@/services/promptService';
import { useToast } from '@/hooks/use-toast';
import { useModule } from '@/contexts/ModuleContext';

export const useLookupTableMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { activeModule } = useModule();

  const saveLookupTableMutation = useMutation({
    mutationFn: async ({ tableKey, content }: { tableKey: string; content: any }) => {
      return promptService.saveLookupTable(tableKey, content, activeModule);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lookup-tables'] });
      toast({
        title: "Success",
        description: "Lookup table saved successfully",
      });
    },
    onError: (error) => {
      console.error('Error saving lookup table:', error);
      toast({
        title: "Error",
        description: "Failed to save lookup table",
        variant: "destructive",
      });
    },
  });

  const saveMappingConfigurationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return promptService.saveMappingConfiguration(id, data, activeModule);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mapping-configurations'] });
      toast({
        title: "Success",
        description: "Mapping configuration saved successfully",
      });
    },
    onError: (error) => {
      console.error('Error saving mapping configuration:', error);
      toast({
        title: "Error",
        description: "Failed to save mapping configuration",
        variant: "destructive",
      });
    },
  });

  const handleSaveLookupTable = async (tableKey: string, content: any): Promise<void> => {
    await saveLookupTableMutation.mutateAsync({ tableKey, content });
  };

  const handleSaveMappingConfiguration = async (id: string, data: any): Promise<void> => {
    await saveMappingConfigurationMutation.mutateAsync({ id, data });
  };

  return {
    saveLookupTableMutation,
    saveMappingConfigurationMutation,
    handleSaveLookupTable,
    handleSaveMappingConfiguration,
  };
};
