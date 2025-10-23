
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PromptSectionCard from './PromptSectionCard';
import LookupTableCard from './LookupTableCard';
import { AIConfigCard } from './AIConfigCard';
import PromptExecutionFlow from './PromptExecutionFlow';
import BarrierGlossaryCard from './BarrierGlossaryCard';
import InferenceTriggersCard from './InferenceTriggersCard';
import PlainLanguageMappingCard from './PlainLanguageMappingCard';
import { usePromptManagerQueries } from '@/hooks/usePromptManagerQueries';
import { usePromptManagerMutations } from '@/hooks/usePromptManagerMutations';

const PromptManagerTabs: React.FC = () => {
  const {
    promptSections,
    sectionsLoading,
    lookupTables,
    lookupLoading,
    aiConfig,
    aiConfigLoading,
    barrierGlossary,
    barrierLoading,
    inferenceTriggers,
    triggersLoading,
    plainLanguageMappings,
    mappingsLoading,
  } = usePromptManagerQueries();

  const {
    savePromptSectionMutation,
    saveLookupTableMutation,
    saveAIConfigMutation,
    saveBarrierGlossaryMutation,
    saveInferenceTriggerMutation,
    savePlainLanguageMappingMutation,
    handleSavePromptSection,
    handleSaveLookupTable,
    handleSaveAIConfig,
    handleSaveBarrierGlossary,
    handleDeleteBarrierGlossary,
    handleSaveInferenceTrigger,
    handleDeleteInferenceTrigger,
    handleSavePlainLanguageMapping,
    handleDeletePlainLanguageMapping,
  } = usePromptManagerMutations();

  return (
    <Tabs defaultValue="sections" className="w-full">
      <TabsList className="grid w-full grid-cols-7">
        <TabsTrigger value="sections">Prompts</TabsTrigger>
        <TabsTrigger value="execution-flow">Flow</TabsTrigger>
        <TabsTrigger value="lookup-tables">Lookup Tables</TabsTrigger>
        <TabsTrigger value="barriers">Barriers</TabsTrigger>
        <TabsTrigger value="triggers">Triggers</TabsTrigger>
        <TabsTrigger value="language">Plain Language</TabsTrigger>
        <TabsTrigger value="ai-config">AI Config</TabsTrigger>
      </TabsList>
      
      <TabsContent value="sections" className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {sectionsLoading ? (
            <div>Loading prompt sections...</div>
          ) : (
            promptSections?.map((section) => (
              <PromptSectionCard 
                key={section.id} 
                section={section}
                onSave={handleSavePromptSection}
                isSaving={savePromptSectionMutation.isPending}
              />
            ))
          )}
        </div>
      </TabsContent>
      
      <TabsContent value="execution-flow">
        <PromptExecutionFlow />
      </TabsContent>
      
      <TabsContent value="lookup-tables" className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {lookupLoading ? (
            <div>Loading lookup tables...</div>
          ) : (
            lookupTables?.map((table) => (
              <LookupTableCard 
                key={table.id} 
                table={table}
                onSave={handleSaveLookupTable}
                isSaving={saveLookupTableMutation.isPending}
              />
            ))
          )}
        </div>
      </TabsContent>

      <TabsContent value="barriers" className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {barrierLoading ? (
            <div>Loading barrier glossary...</div>
          ) : (
            barrierGlossary?.map((glossary) => (
              <BarrierGlossaryCard 
                key={glossary.id} 
                glossary={glossary}
                onSave={handleSaveBarrierGlossary}
                onDelete={handleDeleteBarrierGlossary}
                isSaving={saveBarrierGlossaryMutation.isPending}
              />
            ))
          )}
        </div>
      </TabsContent>

      <TabsContent value="triggers" className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {triggersLoading ? (
            <div>Loading inference triggers...</div>
          ) : (
            inferenceTriggers?.map((trigger) => (
              <InferenceTriggersCard 
                key={trigger.id} 
                trigger={trigger}
                onSave={handleSaveInferenceTrigger}
                onDelete={handleDeleteInferenceTrigger}
                isSaving={saveInferenceTriggerMutation.isPending}
              />
            ))
          )}
        </div>
      </TabsContent>

      <TabsContent value="language" className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {mappingsLoading ? (
            <div>Loading plain language mappings...</div>
          ) : (
            plainLanguageMappings?.map((mapping) => (
              <PlainLanguageMappingCard 
                key={mapping.id} 
                mapping={mapping}
                onSave={handleSavePlainLanguageMapping}
                onDelete={handleDeletePlainLanguageMapping}
                isSaving={savePlainLanguageMappingMutation.isPending}
              />
            ))
          )}
        </div>
      </TabsContent>
      
      <TabsContent value="ai-config">
        {aiConfigLoading ? (
          <div>Loading AI config...</div>
        ) : (
          aiConfig ? (
            <AIConfigCard 
              config={aiConfig}
              onUpdate={handleSaveAIConfig}
            />
          ) : (
            <div>No AI config found.</div>
          )
        )}
      </TabsContent>
    </Tabs>
  );
};

export default PromptManagerTabs;
