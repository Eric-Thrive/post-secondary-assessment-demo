
import React from 'react';
import { usePromptManagerQueries } from '@/hooks/usePromptManagerQueries';
import { usePromptManagerMutations } from '@/hooks/usePromptManagerMutations';
import { CorePromptsSection } from './prompts/CorePromptsSection';
import { DataTablesSection } from './prompts/DataTablesSection';
import { AIConfigurationSection } from './prompts/AIConfigurationSection';

const PromptManagerTabsEnhanced: React.FC = () => {
  const {
    promptSections,
    sectionsLoading,
    sectionsError,
    lookupTables,
    lookupLoading,
    lookupError,
    aiConfig,
    aiConfigLoading,
    aiConfigError,
    barrierGlossary,
    barrierLoading,
    barrierError,
    inferenceTriggers,
    triggersLoading,
    triggersError,
    plainLanguageMappings,
    mappingsLoading,
    mappingsError,
    mappingConfigurations,
    mappingConfigurationsLoading,
    mappingConfigurationsError,
    // K-12 specific data
    itemMaster,
    itemMasterLoading,
    itemMasterError,
    supportLookup,
    supportLookupLoading,
    supportLookupError,
    cautionLookup,
    cautionLookupLoading,
    cautionLookupError,
    observationTemplate,
    observationTemplateLoading,
    observationTemplateError,
    k12BarrierGlossary,
    k12BarrierLoading,
    k12BarrierError,
    k12InferenceTriggers,
    k12TriggersLoading,
    k12TriggersError,
  } = usePromptManagerQueries();

  const {
    savePromptSectionMutation,
    saveLookupTableMutation,
    saveAIConfigMutation,
    saveBarrierGlossaryMutation,
    saveInferenceTriggerMutation,
    savePlainLanguageMappingMutation,
    saveMappingConfigurationMutation,
    // K-12 mutations
    saveItemMasterMutation,
    saveSupportLookupMutation,
    saveCautionLookupMutation,
    saveObservationTemplateMutation,
    saveK12BarrierGlossaryMutation,
    saveK12InferenceTriggerMutation,
    handleSavePromptSection,
    handleSaveLookupTable,
    handleSaveAIConfig,
    handleSaveBarrierGlossary,
    handleDeleteBarrierGlossary,
    handleSaveInferenceTrigger,
    handleDeleteInferenceTrigger,
    handleSavePlainLanguageMapping,
    handleDeletePlainLanguageMapping,
    handleSaveMappingConfiguration,
    // K-12 handlers
    handleSaveItemMaster,
    handleDeleteItemMaster,
    handleSaveSupportLookup,
    handleDeleteSupportLookup,
    handleSaveCautionLookup,
    handleDeleteCautionLookup,
    handleSaveObservationTemplate,
    handleDeleteObservationTemplate,
    handleSaveK12BarrierGlossary,
    handleDeleteK12BarrierGlossary,
    handleSaveK12InferenceTrigger,
    handleDeleteK12InferenceTrigger,
  } = usePromptManagerMutations();

  // Debug logging
  React.useEffect(() => {
    console.log('=== PROMPT MANAGER DEBUG ===');
    console.log('Prompt sections:', { data: promptSections, loading: sectionsLoading, error: sectionsError });
    console.log('Lookup tables:', { data: lookupTables, loading: lookupLoading, error: lookupError });
    console.log('AI config:', { data: aiConfig, loading: aiConfigLoading, error: aiConfigError });
    console.log('Barrier glossary:', { data: barrierGlossary, loading: barrierLoading, error: barrierError });
    console.log('Inference triggers:', { data: inferenceTriggers, loading: triggersLoading, error: triggersError });
    console.log('Plain language mappings:', { data: plainLanguageMappings, loading: mappingsLoading, error: mappingsError });
    console.log('Mapping configurations:', { data: mappingConfigurations, loading: mappingConfigurationsLoading, error: mappingConfigurationsError });
    // K-12 debug logging
    console.log('K-12 Item master:', { data: itemMaster, loading: itemMasterLoading, error: itemMasterError });
    console.log('K-12 Support lookup:', { data: supportLookup, loading: supportLookupLoading, error: supportLookupError });
    console.log('K-12 Caution lookup:', { data: cautionLookup, loading: cautionLookupLoading, error: cautionLookupError });
    console.log('K-12 Observation template:', { data: observationTemplate, loading: observationTemplateLoading, error: observationTemplateError });
    console.log('K-12 Barrier glossary:', { data: k12BarrierGlossary, loading: k12BarrierLoading, error: k12BarrierError });
    console.log('K-12 Inference triggers:', { data: k12InferenceTriggers, loading: k12TriggersLoading, error: k12TriggersError });
  }, [
    promptSections, sectionsLoading, sectionsError,
    lookupTables, lookupLoading, lookupError,
    aiConfig, aiConfigLoading, aiConfigError,
    barrierGlossary, barrierLoading, barrierError,
    inferenceTriggers, triggersLoading, triggersError,
    plainLanguageMappings, mappingsLoading, mappingsError,
    mappingConfigurations, mappingConfigurationsLoading, mappingConfigurationsError,
    itemMaster, itemMasterLoading, itemMasterError,
    supportLookup, supportLookupLoading, supportLookupError,
    cautionLookup, cautionLookupLoading, cautionLookupError,
    observationTemplate, observationTemplateLoading, observationTemplateError,
    k12BarrierGlossary, k12BarrierLoading, k12BarrierError,
    k12InferenceTriggers, k12TriggersLoading, k12TriggersError
  ]);

  return (
    <div className="space-y-6">
      {/* Core Prompts Section */}
      <CorePromptsSection
        promptSections={promptSections}
        sectionsLoading={sectionsLoading}
        sectionsError={sectionsError}
        savePromptSectionMutation={savePromptSectionMutation}
        handleSavePromptSection={handleSavePromptSection}
      />

      {/* Data Tables Section */}
      <DataTablesSection
        // Post-Secondary props
        lookupTables={lookupTables}
        lookupLoading={lookupLoading}
        lookupError={lookupError}
        barrierGlossary={barrierGlossary}
        barrierLoading={barrierLoading}
        barrierError={barrierError}
        inferenceTriggers={inferenceTriggers}
        triggersLoading={triggersLoading}
        triggersError={triggersError}
        plainLanguageMappings={plainLanguageMappings}
        mappingsLoading={mappingsLoading}
        mappingsError={mappingsError}
        mappingConfigurations={mappingConfigurations}
        mappingConfigurationsLoading={mappingConfigurationsLoading}
        mappingConfigurationsError={mappingConfigurationsError}
        saveLookupTableMutation={saveLookupTableMutation}
        saveBarrierGlossaryMutation={saveBarrierGlossaryMutation}
        saveInferenceTriggerMutation={saveInferenceTriggerMutation}
        savePlainLanguageMappingMutation={savePlainLanguageMappingMutation}
        saveMappingConfigurationMutation={saveMappingConfigurationMutation}
        handleSaveLookupTable={handleSaveLookupTable}
        handleSaveBarrierGlossary={handleSaveBarrierGlossary}
        handleDeleteBarrierGlossary={handleDeleteBarrierGlossary}
        handleSaveInferenceTrigger={handleSaveInferenceTrigger}
        handleDeleteInferenceTrigger={handleDeleteInferenceTrigger}
        handleSavePlainLanguageMapping={handleSavePlainLanguageMapping}
        handleDeletePlainLanguageMapping={handleDeletePlainLanguageMapping}
        handleSaveMappingConfiguration={handleSaveMappingConfiguration}
        
        // K-12 props
        itemMaster={itemMaster}
        itemMasterLoading={itemMasterLoading}
        itemMasterError={itemMasterError}
        supportLookup={supportLookup}
        supportLookupLoading={supportLookupLoading}
        supportLookupError={supportLookupError}
        cautionLookup={cautionLookup}
        cautionLookupLoading={cautionLookupLoading}
        cautionLookupError={cautionLookupError}
        observationTemplate={observationTemplate}
        observationTemplateLoading={observationTemplateLoading}
        observationTemplateError={observationTemplateError}
        k12BarrierGlossary={k12BarrierGlossary}
        k12BarrierLoading={k12BarrierLoading}
        k12BarrierError={k12BarrierError}
        k12InferenceTriggers={k12InferenceTriggers}
        k12TriggersLoading={k12TriggersLoading}
        k12TriggersError={k12TriggersError}
        saveItemMasterMutation={saveItemMasterMutation}
        saveSupportLookupMutation={saveSupportLookupMutation}
        saveCautionLookupMutation={saveCautionLookupMutation}
        saveObservationTemplateMutation={saveObservationTemplateMutation}
        saveK12BarrierGlossaryMutation={saveK12BarrierGlossaryMutation}
        saveK12InferenceTriggerMutation={saveK12InferenceTriggerMutation}
        handleSaveItemMaster={handleSaveItemMaster}
        handleDeleteItemMaster={handleDeleteItemMaster}
        handleSaveSupportLookup={handleSaveSupportLookup}
        handleDeleteSupportLookup={handleDeleteSupportLookup}
        handleSaveCautionLookup={handleSaveCautionLookup}
        handleDeleteCautionLookup={handleDeleteCautionLookup}
        handleSaveObservationTemplate={handleSaveObservationTemplate}
        handleDeleteObservationTemplate={handleDeleteObservationTemplate}
        handleSaveK12BarrierGlossary={handleSaveK12BarrierGlossary}
        handleDeleteK12BarrierGlossary={handleDeleteK12BarrierGlossary}
        handleSaveK12InferenceTrigger={handleSaveK12InferenceTrigger}
        handleDeleteK12InferenceTrigger={handleDeleteK12InferenceTrigger}
      />

      {/* Configuration Section */}
      <AIConfigurationSection
        aiConfig={aiConfig}
        aiConfigLoading={aiConfigLoading}
        aiConfigError={aiConfigError}
        handleSaveAIConfig={handleSaveAIConfig}
      />
    </div>
  );
};

export default PromptManagerTabsEnhanced;
