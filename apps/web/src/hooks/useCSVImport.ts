
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useModule } from '@/contexts/ModuleContext';
import { CSVUploadOptions } from '@/services/csvProcessingService';

// Import all the K-12 services
import { k12ItemMasterService } from '@/services/k12ItemMasterService';
import { k12SupportLookupService } from '@/services/k12SupportLookupService';
import { k12CautionLookupService } from '@/services/k12CautionLookupService';
import { k12ObservationTemplateService } from '@/services/k12ObservationTemplateService';
import { k12BarrierGlossaryService } from '@/services/k12BarrierGlossaryService';
import { k12InferenceTriggersService } from '@/services/k12InferenceTriggersService';

export const useCSVImport = () => {
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { activeModule } = useModule();

  const importItemMaster = async (data: any[], options: CSVUploadOptions) => {
    setIsImporting(true);
    try {
      if (options.mode === 'replace') {
        toast({
          title: "Replace Mode Not Implemented",
          description: "Using append mode instead",
          variant: "destructive"
        });
      }

      for (const item of data) {
        await k12ItemMasterService.save(item, activeModule);
      }

      queryClient.invalidateQueries({ queryKey: ['k12-item-master'] });
      
      toast({
        title: "Import Successful",
        description: `${data.length} item master entries imported`,
      });
    } catch (error) {
      console.error('Import failed:', error);
      throw error;
    } finally {
      setIsImporting(false);
    }
  };

  const importSupportLookup = async (data: any[], options: CSVUploadOptions) => {
    setIsImporting(true);
    try {
      for (const item of data) {
        await k12SupportLookupService.save(item, activeModule);
      }

      queryClient.invalidateQueries({ queryKey: ['k12-support-lookup'] });
      
      toast({
        title: "Import Successful",
        description: `${data.length} support lookup entries imported`,
      });
    } catch (error) {
      console.error('Import failed:', error);
      throw error;
    } finally {
      setIsImporting(false);
    }
  };

  const importCautionLookup = async (data: any[], options: CSVUploadOptions) => {
    setIsImporting(true);
    try {
      for (const item of data) {
        await k12CautionLookupService.save(item);
      }

      queryClient.invalidateQueries({ queryKey: ['k12-caution-lookup'] });
      
      toast({
        title: "Import Successful",
        description: `${data.length} caution lookup entries imported`,
      });
    } catch (error) {
      console.error('Import failed:', error);
      throw error;
    } finally {
      setIsImporting(false);
    }
  };

  const importObservationTemplate = async (data: any[], options: CSVUploadOptions) => {
    setIsImporting(true);
    try {
      for (const item of data) {
        await k12ObservationTemplateService.save(item, activeModule);
      }

      queryClient.invalidateQueries({ queryKey: ['k12-observation-template'] });
      
      toast({
        title: "Import Successful",
        description: `${data.length} observation templates imported`,
      });
    } catch (error) {
      console.error('Import failed:', error);
      throw error;
    } finally {
      setIsImporting(false);
    }
  };

  const importK12BarrierGlossary = async (data: any[], options: CSVUploadOptions) => {
    setIsImporting(true);
    try {
      for (const item of data) {
        await k12BarrierGlossaryService.save(item);
      }

      queryClient.invalidateQueries({ queryKey: ['barrier-glossary'] });
      
      toast({
        title: "Import Successful",
        description: `${data.length} K-12 barrier glossary entries imported`,
      });
    } catch (error) {
      console.error('Import failed:', error);
      throw error;
    } finally {
      setIsImporting(false);
    }
  };

  const importK12InferenceTriggers = async (data: any[], options: CSVUploadOptions) => {
    setIsImporting(true);
    try {
      for (const item of data) {
        await k12InferenceTriggersService.save(item);
      }

      queryClient.invalidateQueries({ queryKey: ['inference-triggers'] });
      
      toast({
        title: "Import Successful",
        description: `${data.length} K-12 inference triggers imported`,
      });
    } catch (error) {
      console.error('Import failed:', error);
      throw error;
    } finally {
      setIsImporting(false);
    }
  };

  return {
    isImporting,
    importItemMaster,
    importSupportLookup,
    importCautionLookup,
    importObservationTemplate,
    importK12BarrierGlossary,
    importK12InferenceTriggers,
  };
};
