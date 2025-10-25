
import { usePromptSectionMutations } from './mutations/usePromptSectionMutations';
import { useLookupTableMutations } from './mutations/useLookupTableMutations';
import { useAIConfigMutations } from './mutations/useAIConfigMutations';
import { useBarrierGlossaryMutations } from './mutations/useBarrierGlossaryMutations';
import { useInferenceTriggerMutations } from './mutations/useInferenceTriggerMutations';
import { usePlainLanguageMutations } from './mutations/usePlainLanguageMutations';
import { useK12DataMutations } from './mutations/useK12DataMutations';

export const usePromptManagerMutations = () => {
  const promptSectionMutations = usePromptSectionMutations();
  const lookupTableMutations = useLookupTableMutations();
  const aiConfigMutations = useAIConfigMutations();
  const barrierGlossaryMutations = useBarrierGlossaryMutations();
  const inferenceTriggerMutations = useInferenceTriggerMutations();
  const plainLanguageMutations = usePlainLanguageMutations();
  const k12DataMutations = useK12DataMutations();

  return {
    // Prompt Section mutations
    savePromptSectionMutation: promptSectionMutations.savePromptSectionMutation,
    handleSavePromptSection: promptSectionMutations.handleSavePromptSection,

    // Lookup Table mutations
    saveLookupTableMutation: lookupTableMutations.saveLookupTableMutation,
    saveMappingConfigurationMutation: lookupTableMutations.saveMappingConfigurationMutation,
    handleSaveLookupTable: lookupTableMutations.handleSaveLookupTable,
    handleSaveMappingConfiguration: lookupTableMutations.handleSaveMappingConfiguration,

    // AI Config mutations
    saveAIConfigMutation: aiConfigMutations.saveAIConfigMutation,
    testPromptsMutation: aiConfigMutations.testPromptsMutation,
    restorePromptsMutation: aiConfigMutations.restorePromptsMutation,
    handleSaveAIConfig: aiConfigMutations.handleSaveAIConfig,

    // Barrier Glossary mutations (both regular and K-12)
    saveBarrierGlossaryMutation: barrierGlossaryMutations.saveBarrierGlossaryMutation,
    deleteBarrierGlossaryMutation: barrierGlossaryMutations.deleteBarrierGlossaryMutation,
    saveK12BarrierGlossaryMutation: barrierGlossaryMutations.saveK12BarrierGlossaryMutation,
    deleteK12BarrierGlossaryMutation: barrierGlossaryMutations.deleteK12BarrierGlossaryMutation,
    handleSaveBarrierGlossary: barrierGlossaryMutations.handleSaveBarrierGlossary,
    handleDeleteBarrierGlossary: barrierGlossaryMutations.handleDeleteBarrierGlossary,
    handleSaveK12BarrierGlossary: barrierGlossaryMutations.handleSaveK12BarrierGlossary,
    handleDeleteK12BarrierGlossary: barrierGlossaryMutations.handleDeleteK12BarrierGlossary,

    // Inference Trigger mutations (both regular and K-12)
    saveInferenceTriggerMutation: inferenceTriggerMutations.saveInferenceTriggerMutation,
    deleteInferenceTriggerMutation: inferenceTriggerMutations.deleteInferenceTriggerMutation,
    saveK12InferenceTriggerMutation: inferenceTriggerMutations.saveK12InferenceTriggerMutation,
    deleteK12InferenceTriggerMutation: inferenceTriggerMutations.deleteK12InferenceTriggerMutation,
    handleSaveInferenceTrigger: inferenceTriggerMutations.handleSaveInferenceTrigger,
    handleDeleteInferenceTrigger: inferenceTriggerMutations.handleDeleteInferenceTrigger,
    handleSaveK12InferenceTrigger: inferenceTriggerMutations.handleSaveK12InferenceTrigger,
    handleDeleteK12InferenceTrigger: inferenceTriggerMutations.handleDeleteK12InferenceTrigger,

    // Plain Language mutations
    savePlainLanguageMappingMutation: plainLanguageMutations.savePlainLanguageMappingMutation,
    deletePlainLanguageMappingMutation: plainLanguageMutations.deletePlainLanguageMappingMutation,
    handleSavePlainLanguageMapping: plainLanguageMutations.handleSavePlainLanguageMapping,
    handleDeletePlainLanguageMapping: plainLanguageMutations.handleDeletePlainLanguageMapping,

    // K-12 Data mutations
    saveItemMasterMutation: k12DataMutations.saveItemMasterMutation,
    deleteItemMasterMutation: k12DataMutations.deleteItemMasterMutation,
    saveSupportLookupMutation: k12DataMutations.saveSupportLookupMutation,
    deleteSupportLookupMutation: k12DataMutations.deleteSupportLookupMutation,
    saveCautionLookupMutation: k12DataMutations.saveCautionLookupMutation,
    deleteCautionLookupMutation: k12DataMutations.deleteCautionLookupMutation,
    saveObservationTemplateMutation: k12DataMutations.saveObservationTemplateMutation,
    deleteObservationTemplateMutation: k12DataMutations.deleteObservationTemplateMutation,
    handleSaveItemMaster: k12DataMutations.handleSaveItemMaster,
    handleDeleteItemMaster: k12DataMutations.handleDeleteItemMaster,
    handleSaveSupportLookup: k12DataMutations.handleSaveSupportLookup,
    handleDeleteSupportLookup: k12DataMutations.handleDeleteSupportLookup,
    handleSaveCautionLookup: k12DataMutations.handleSaveCautionLookup,
    handleDeleteCautionLookup: k12DataMutations.handleDeleteCautionLookup,
    handleSaveObservationTemplate: k12DataMutations.handleSaveObservationTemplate,
    handleDeleteObservationTemplate: k12DataMutations.handleDeleteObservationTemplate,
  };
};
