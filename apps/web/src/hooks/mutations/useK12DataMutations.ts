import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { k12ItemMasterService } from '@/services/k12ItemMasterService';
import { k12SupportLookupService } from '@/services/k12SupportLookupService';
import { k12CautionLookupService } from '@/services/k12CautionLookupService';
import { k12ObservationTemplateService } from '@/services/k12ObservationTemplateService';

export const useK12DataMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Item Master mutations
  const saveItemMasterMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return k12ItemMasterService.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['k12-item-master'] });
      toast({
        title: "Success",
        description: "Item master saved successfully",
      });
    },
    onError: (error) => {
      console.error('Error saving item master:', error);
      toast({
        title: "Error",
        description: "Failed to save item master",
        variant: "destructive",
      });
    },
  });

  const deleteItemMasterMutation = useMutation({
    mutationFn: async (id: string) => {
      return k12ItemMasterService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['k12-item-master'] });
      toast({
        title: "Success",
        description: "Item master deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Error deleting item master:', error);
      toast({
        title: "Error",
        description: "Failed to delete item master",
        variant: "destructive",
      });
    },
  });

  // Support Lookup mutations
  const saveSupportLookupMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return k12SupportLookupService.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['k12-support-lookup'] });
      toast({
        title: "Success",
        description: "Support lookup saved successfully",
      });
    },
    onError: (error) => {
      console.error('Error saving support lookup:', error);
      toast({
        title: "Error",
        description: "Failed to save support lookup",
        variant: "destructive",
      });
    },
  });

  const deleteSupportLookupMutation = useMutation({
    mutationFn: async (id: string) => {
      return k12SupportLookupService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['k12-support-lookup'] });
      toast({
        title: "Success",
        description: "Support lookup deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Error deleting support lookup:', error);
      toast({
        title: "Error",
        description: "Failed to delete support lookup",
        variant: "destructive",
      });
    },
  });

  // Caution Lookup mutations
  const saveCautionLookupMutation = useMutation({
    mutationFn: async ({ caution_id, data }: { caution_id: string; data: any }) => {
      return k12CautionLookupService.update(caution_id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['k12-caution-lookup'] });
      toast({
        title: "Success",
        description: "Caution lookup saved successfully",
      });
    },
    onError: (error) => {
      console.error('Error saving caution lookup:', error);
      toast({
        title: "Error",
        description: "Failed to save caution lookup",
        variant: "destructive",
      });
    },
  });

  const deleteCautionLookupMutation = useMutation({
    mutationFn: async (caution_id: string) => {
      return k12CautionLookupService.delete(caution_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['k12-caution-lookup'] });
      toast({
        title: "Success",
        description: "Caution lookup deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Error deleting caution lookup:', error);
      toast({
        title: "Error",
        description: "Failed to delete caution lookup",
        variant: "destructive",
      });
    },
  });

  // Observation Template mutations
  const saveObservationTemplateMutation = useMutation({
    mutationFn: async ({ canonical_key, grade_band, data }: { canonical_key: string; grade_band: string; data: any }) => {
      return k12ObservationTemplateService.update(canonical_key, grade_band, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['k12-observation-template'] });
      toast({
        title: "Success",
        description: "Observation template saved successfully",
      });
    },
    onError: (error) => {
      console.error('Error saving observation template:', error);
      toast({
        title: "Error",
        description: "Failed to save observation template",
        variant: "destructive",
      });
    },
  });

  const deleteObservationTemplateMutation = useMutation({
    mutationFn: async ({ canonical_key, grade_band }: { canonical_key: string; grade_band: string }) => {
      return k12ObservationTemplateService.delete(canonical_key, grade_band);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['k12-observation-template'] });
      toast({
        title: "Success",
        description: "Observation template deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Error deleting observation template:', error);
      toast({
        title: "Error",
        description: "Failed to delete observation template",
        variant: "destructive",
      });
    },
  });

  // Helper functions
  const handleSaveItemMaster = async (id: string, data: any): Promise<void> => {
    await saveItemMasterMutation.mutateAsync({ id, data });
  };

  const handleDeleteItemMaster = async (id: string): Promise<void> => {
    await deleteItemMasterMutation.mutateAsync(id);
  };

  const handleSaveSupportLookup = async (id: string, data: any): Promise<void> => {
    await saveSupportLookupMutation.mutateAsync({ id, data });
  };

  const handleDeleteSupportLookup = async (id: string): Promise<void> => {
    await deleteSupportLookupMutation.mutateAsync(id);
  };

  const handleSaveCautionLookup = async (caution_id: string, data: any): Promise<void> => {
    await saveCautionLookupMutation.mutateAsync({ caution_id, data });
  };

  const handleDeleteCautionLookup = async (caution_id: string): Promise<void> => {
    await deleteCautionLookupMutation.mutateAsync(caution_id);
  };

  const handleSaveObservationTemplate = async (canonical_key: string, grade_band: string, data: any): Promise<void> => {
    await saveObservationTemplateMutation.mutateAsync({ canonical_key, grade_band, data });
  };

  const handleDeleteObservationTemplate = async (canonical_key: string, grade_band: string): Promise<void> => {
    await deleteObservationTemplateMutation.mutateAsync({ canonical_key, grade_band });
  };

  return {
    // Item Master
    saveItemMasterMutation,
    deleteItemMasterMutation,
    handleSaveItemMaster,
    handleDeleteItemMaster,

    // Support Lookup
    saveSupportLookupMutation,
    deleteSupportLookupMutation,
    handleSaveSupportLookup,
    handleDeleteSupportLookup,

    // Caution Lookup
    saveCautionLookupMutation,
    deleteCautionLookupMutation,
    handleSaveCautionLookup,
    handleDeleteCautionLookup,

    // Observation Template
    saveObservationTemplateMutation,
    deleteObservationTemplateMutation,
    handleSaveObservationTemplate,
    handleDeleteObservationTemplate,
  };
};
