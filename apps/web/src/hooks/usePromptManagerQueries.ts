import { useQuery } from '@tanstack/react-query';
import { promptService } from '@/services/promptService';
import { useModule } from '@/contexts/ModuleContext';

export const usePromptManagerQueries = () => {
  const { activeModule } = useModule();

  const promptSectionsQuery = useQuery({
    queryKey: ['prompt-sections', activeModule],
    queryFn: async () => {
      try {
        console.log('Loading prompt sections for module:', activeModule);
        const result = await promptService.loadPromptSections(activeModule);
        console.log('Prompt sections loaded:', result?.length || 0);
        return result;
      } catch (error) {
        console.error('Failed to load prompt sections:', error);
        throw error;
      }
    },
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const lookupTablesQuery = useQuery({
    queryKey: ['lookup-tables', activeModule],
    queryFn: async () => {
      try {
        console.log('Loading lookup tables for module:', activeModule);
        const result = await promptService.loadLookupTables(activeModule);
        console.log('Lookup tables loaded:', result?.length || 0);
        return result;
      } catch (error) {
        console.error('Failed to load lookup tables:', error);
        throw error;
      }
    },
    retry: 3,
    staleTime: 5 * 60 * 1000,
  });

  const aiConfigQuery = useQuery({
    queryKey: ['ai-config'],
    queryFn: async () => {
      try {
        console.log('=== LOADING AI CONFIG ===');
        console.log('Active module:', activeModule);
        const result = await promptService.loadAIConfig(activeModule);
        console.log('AI config result:', result);
        console.log('AI config loaded successfully:', !!result);
        return result;
      } catch (error) {
        console.error('Failed to load AI config:', error);
        throw error;
      }
    },
    retry: 3,
    staleTime: 30 * 1000, // Reduced to 30 seconds for testing
  });

  const barrierGlossaryQuery = useQuery({
    queryKey: ['barrier-glossary', activeModule],
    queryFn: async () => {
      try {
        console.log('Loading barrier glossary for module:', activeModule);
        const result = await promptService.loadBarrierGlossary(activeModule);
        console.log('Barrier glossary loaded:', result?.length || 0);
        return result;
      } catch (error) {
        console.error('Failed to load barrier glossary:', error);
        throw error;
      }
    },
    retry: 3,
    staleTime: 5 * 60 * 1000,
  });

  const inferenceTriggersQuery = useQuery({
    queryKey: ['inference-triggers', activeModule],
    queryFn: async () => {
      try {
        console.log('Loading inference triggers for module:', activeModule);
        const result = await promptService.loadInferenceTriggers(activeModule);
        console.log('Inference triggers loaded:', result?.length || 0);
        return result;
      } catch (error) {
        console.error('Failed to load inference triggers:', error);
        throw error;
      }
    },
    retry: 3,
    staleTime: 5 * 60 * 1000,
  });

  const plainLanguageMappingsQuery = useQuery({
    queryKey: ['plain-language-mappings', activeModule],
    queryFn: async () => {
      try {
        console.log('Loading plain language mappings for module:', activeModule);
        const result = await promptService.loadPlainLanguageMappings(activeModule);
        console.log('Plain language mappings loaded:', result?.length || 0);
        return result;
      } catch (error) {
        console.error('Failed to load plain language mappings:', error);
        throw error;
      }
    },
    retry: 3,
    staleTime: 5 * 60 * 1000,
  });

  const mappingConfigurationsQuery = useQuery({
    queryKey: ['mapping-configurations', activeModule],
    queryFn: async () => {
      try {
        console.log('Loading mapping configurations for module:', activeModule);
        const result = await promptService.loadMappingConfigurations(activeModule);
        console.log('Mapping configurations loaded:', result?.length || 0);
        return result;
      } catch (error) {
        console.error('Failed to load mapping configurations:', error);
        throw error;
      }
    },
    retry: 3,
    staleTime: 5 * 60 * 1000,
  });

  // K-12 specific queries (only load when in K-12 module)
  const itemMasterQuery = useQuery({
    queryKey: ['k12-item-master', activeModule],
    queryFn: async () => {
      try {
        console.log('Loading K-12 item master for module:', activeModule);
        const result = await promptService.loadItemMaster(activeModule);
        console.log('K-12 item master loaded:', result?.length || 0);
        return result;
      } catch (error) {
        console.error('Failed to load K-12 item master:', error);
        throw error;
      }
    },
    enabled: activeModule === 'k12',
    retry: 3,
    staleTime: 5 * 60 * 1000,
  });

  const supportLookupQuery = useQuery({
    queryKey: ['k12-support-lookup', activeModule],
    queryFn: async () => {
      try {
        console.log('Loading K-12 support lookup for module:', activeModule);
        const result = await promptService.loadSupportLookup(activeModule);
        console.log('K-12 support lookup loaded:', result?.length || 0);
        return result;
      } catch (error) {
        console.error('Failed to load K-12 support lookup:', error);
        throw error;
      }
    },
    enabled: activeModule === 'k12',
    retry: 3,
    staleTime: 5 * 60 * 1000,
  });

  const cautionLookupQuery = useQuery({
    queryKey: ['k12-caution-lookup', activeModule],
    queryFn: async () => {
      try {
        console.log('Loading K-12 caution lookup for module:', activeModule);
        const result = await promptService.loadCautionLookup(activeModule);
        console.log('K-12 caution lookup loaded:', result?.length || 0);
        return result;
      } catch (error) {
        console.error('Failed to load K-12 caution lookup:', error);
        throw error;
      }
    },
    enabled: activeModule === 'k12',
    retry: 3,
    staleTime: 5 * 60 * 1000,
  });

  const observationTemplateQuery = useQuery({
    queryKey: ['k12-observation-template', activeModule],
    queryFn: async () => {
      try {
        console.log('Loading K-12 observation template for module:', activeModule);
        const result = await promptService.loadObservationTemplate(activeModule);
        console.log('K-12 observation template loaded:', result?.length || 0);
        return result;
      } catch (error) {
        console.error('Failed to load K-12 observation template:', error);
        throw error;
      }
    },
    enabled: activeModule === 'k12',
    retry: 3,
    staleTime: 5 * 60 * 1000,
  });

  return {
    promptSections: promptSectionsQuery.data,
    sectionsLoading: promptSectionsQuery.isLoading,
    sectionsError: promptSectionsQuery.error,
    lookupTables: lookupTablesQuery.data,
    lookupLoading: lookupTablesQuery.isLoading,
    lookupError: lookupTablesQuery.error,
    aiConfig: aiConfigQuery.data,
    aiConfigLoading: aiConfigQuery.isLoading,
    aiConfigError: aiConfigQuery.error,
    barrierGlossary: barrierGlossaryQuery.data,
    barrierLoading: barrierGlossaryQuery.isLoading,
    barrierError: barrierGlossaryQuery.error,
    inferenceTriggers: inferenceTriggersQuery.data,
    triggersLoading: inferenceTriggersQuery.isLoading,
    triggersError: inferenceTriggersQuery.error,
    plainLanguageMappings: plainLanguageMappingsQuery.data,
    mappingsLoading: plainLanguageMappingsQuery.isLoading,
    mappingsError: plainLanguageMappingsQuery.error,
    mappingConfigurations: mappingConfigurationsQuery.data,
    mappingConfigurationsLoading: mappingConfigurationsQuery.isLoading,
    mappingConfigurationsError: mappingConfigurationsQuery.error,
    // K-12 specific data
    itemMaster: itemMasterQuery.data,
    itemMasterLoading: itemMasterQuery.isLoading,
    itemMasterError: itemMasterQuery.error,
    supportLookup: supportLookupQuery.data,
    supportLookupLoading: supportLookupQuery.isLoading,
    supportLookupError: supportLookupQuery.error,
    cautionLookup: cautionLookupQuery.data,
    cautionLookupLoading: cautionLookupQuery.isLoading,
    cautionLookupError: cautionLookupQuery.error,
    observationTemplate: observationTemplateQuery.data,
    observationTemplateLoading: observationTemplateQuery.isLoading,
    observationTemplateError: observationTemplateQuery.error,
    // For K-12 module, barrier glossary and inference triggers use the same data but with different keys for components
    k12BarrierGlossary: activeModule === 'k12' ? barrierGlossaryQuery.data : undefined,
    k12BarrierLoading: activeModule === 'k12' ? barrierGlossaryQuery.isLoading : false,
    k12BarrierError: activeModule === 'k12' ? barrierGlossaryQuery.error : null,
    k12InferenceTriggers: activeModule === 'k12' ? inferenceTriggersQuery.data : undefined,
    k12TriggersLoading: activeModule === 'k12' ? inferenceTriggersQuery.isLoading : false,
    k12TriggersError: activeModule === 'k12' ? inferenceTriggersQuery.error : null,
  };
};
